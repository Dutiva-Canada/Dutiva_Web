import { z } from 'zod'
import type { LText } from '@/i18n/core'
import {
  FORMULA_MAX_DEPTH,
  FORMULA_MAX_NODES,
  formulaDepth,
  formulaExprSchema,
  formulaNodeCount,
  formulaRefs,
  type FormulaExpr,
} from './formula'

/**
 * Widget spec — the contract between a chatbot's reply and <ChatWidget />.
 *
 * A bot emits a fenced ```dutiva-widget block containing one spec JSON
 * object: `{ type, title?, locale?, data }` and nothing else. Every object
 * is strict — an unknown key (an `html` field, an event handler name, an
 * extra option) fails validation and renders the fallback, never markup.
 *
 * User-facing strings are `LText`: either a plain string (already in the
 * chat's language) or an `{ en, fr }` pair. Emitting pairs is what lets a
 * live language toggle re-render a visible widget in the other language.
 *
 * Caps exist so a hostile or runaway spec stays cheap: short strings,
 * bounded arrays, bounded formula trees, no URLs anywhere (nothing a widget
 * renders may cause a network fetch).
 */

export const lTextSchema: z.ZodType<LText> = z.union([
  z.string().min(1).max(500),
  z.strictObject({
    en: z.string().min(1).max(500),
    fr: z.string().min(1).max(500),
  }),
])

const keySchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/)

/** Number presentation shared by calculators, charts and table cells. */
export const formatSpecSchema = z.union([
  z.enum(['number', 'currency', 'percent']),
  z.strictObject({
    prefix: z.string().max(8).optional(),
    suffix: z.string().max(8).optional(),
    decimals: z.number().int().min(0).max(6).optional(),
  }),
])
export type FormatSpec = z.infer<typeof formatSpecSchema>

const widgetBase = {
  title: lTextSchema.optional(),
  /* The spec's authoring locale. Widgets re-localize live off the chat
     locale; this only documents which language plain (non-Bi) strings are
     written in. */
  locale: z.enum(['en', 'fr']).optional(),
} as const

/* ------------------------------------------------------------ calculator */

const calculatorInputSchema = z.strictObject({
  key: keySchema,
  label: lTextSchema,
  default: z.number().finite().optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().positive().optional(),
  unit: lTextSchema.optional(),
  help: lTextSchema.optional(),
})

const boundedFormula = formulaExprSchema.refine(
  (expr) => formulaDepth(expr) <= FORMULA_MAX_DEPTH && formulaNodeCount(expr) <= FORMULA_MAX_NODES,
  'formula exceeds depth/node budget',
)

const calculatorSpecSchema = z
  .strictObject({
    type: z.literal('calculator'),
    ...widgetBase,
    data: z.strictObject({
      inputs: z.array(calculatorInputSchema).min(1).max(8),
      formula: boundedFormula,
      result: z.strictObject({
        label: lTextSchema,
        format: formatSpecSchema.optional(),
      }),
      breakdown: z
        .array(
          z.strictObject({
            label: lTextSchema,
            value: boundedFormula,
            /* Rows are raw quantities (weeks, hours) unless they say
               otherwise — only the main result gets the widget's format. */
            format: formatSpecSchema.optional(),
          }),
        )
        .max(4)
        .optional(),
      /* Regulated domains (termination pay, overtime) show the standing
         "estimate — verify" line; never optional there. */
      regulated: z.boolean().optional(),
      note: lTextSchema.optional(),
    }),
  })
  .superRefine((spec, ctx) => {
    const keys = new Set(spec.data.inputs.map((input) => input.key))
    if (keys.size !== spec.data.inputs.length) {
      ctx.addIssue({ code: 'custom', message: 'input keys must be unique', path: ['data', 'inputs'] })
    }
    const checkRefs = (expr: FormulaExpr, path: string) => {
      for (const ref of formulaRefs(expr)) {
        if (!keys.has(ref)) {
          ctx.addIssue({ code: 'custom', message: `formula ref "${ref}" is not a declared input`, path: [path] })
        }
      }
    }
    checkRefs(spec.data.formula, 'data.formula')
    spec.data.breakdown?.forEach((row, i) => checkRefs(row.value, `data.breakdown.${i}`))
  })

export type CalculatorSpec = z.infer<typeof calculatorSpecSchema>

/* ----------------------------------------------------------------- chart */

const chartSpecSchema = z
  .strictObject({
    type: z.literal('chart'),
    ...widgetBase,
    data: z.strictObject({
      kind: z.enum(['bar', 'pie']),
      format: formatSpecSchema.optional(),
      items: z
        .array(
          z.strictObject({
            label: lTextSchema,
            value: z.number().finite(),
            hint: lTextSchema.optional(),
          }),
        )
        .min(1)
        .max(12),
    }),
  })
  .superRefine((spec, ctx) => {
    /* Pie slices are parts of a whole — negatives are meaningless. */
    if (spec.data.kind === 'pie' && spec.data.items.some((item) => item.value < 0)) {
      ctx.addIssue({ code: 'custom', message: 'pie items must be non-negative', path: ['data', 'items'] })
    }
  })

export type ChartWidgetSpec = z.infer<typeof chartSpecSchema>

/* ----------------------------------------------------------------- table */

const tableCellSchema = z.union([z.string().max(200), z.number().finite(), lTextSchema])

const tableSpecSchema = z
  .strictObject({
    type: z.literal('table'),
    ...widgetBase,
    data: z.strictObject({
      columns: z
        .array(
          z.strictObject({
            key: keySchema,
            label: lTextSchema,
            align: z.enum(['left', 'center', 'right']).optional(),
          }),
        )
        .min(1)
        .max(8),
      rows: z.array(z.record(z.string(), tableCellSchema)).min(1).max(500),
      searchable: z.boolean().optional(),
      sortable: z.boolean().optional(),
    }),
  })
  .superRefine((spec, ctx) => {
    /* Duplicate column keys would alias sort toggles and render the same
       cell twice — reject rather than render ambiguously. */
    const keys = new Set(spec.data.columns.map((col) => col.key))
    if (keys.size !== spec.data.columns.length) {
      ctx.addIssue({ code: 'custom', message: 'column keys must be unique', path: ['data', 'columns'] })
    }
  })

export type TableSpec = z.infer<typeof tableSpecSchema>

/* ------------------------------------------------------------- checklist */

const checklistSpecSchema = z
  .strictObject({
    type: z.literal('checklist'),
    ...widgetBase,
    data: z.strictObject({
      items: z
        .array(
          z.strictObject({
            /* Safe charset — the id becomes an object key and a React key,
               so `__proto__`-style names are rejected at the boundary. */
            id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,59}$/),
            label: lTextSchema,
            done: z.boolean().optional(),
          }),
        )
        .min(1)
        .max(60),
      showProgress: z.boolean().optional(),
      copySummary: z.boolean().optional(),
    }),
  })
  .superRefine((spec, ctx) => {
    /* Duplicate ids would share one checkbox state and one React key. */
    const ids = new Set(spec.data.items.map((item) => item.id))
    if (ids.size !== spec.data.items.length) {
      ctx.addIssue({ code: 'custom', message: 'checklist ids must be unique', path: ['data', 'items'] })
    }
  })

export type ChecklistSpec = z.infer<typeof checklistSpecSchema>

/* -------------------------------------------------------------- timeline */

const timelineSpecSchema = z.strictObject({
  type: z.literal('timeline'),
  ...widgetBase,
  data: z.strictObject({
    steps: z
      .array(
        z.strictObject({
          label: lTextSchema,
          /* ISO date or a short free-text label ("Week 12"). */
          date: z.string().min(1).max(40).optional(),
          description: lTextSchema.optional(),
          status: z.enum(['done', 'current', 'upcoming']).optional(),
        }),
      )
      .min(2)
      .max(14),
  }),
})

export type TimelineSpec = z.infer<typeof timelineSpecSchema>

/* ------------------------------------------------------------ comparison */

const comparisonSpecSchema = z
  .strictObject({
    type: z.literal('comparison'),
    ...widgetBase,
    data: z.strictObject({
      options: z
        .array(
          z.strictObject({
            name: lTextSchema,
            tagline: lTextSchema.optional(),
            badge: lTextSchema.optional(),
            recommended: z.boolean().optional(),
            rows: z
              .array(z.strictObject({ label: lTextSchema, value: lTextSchema }))
              .min(1)
              .max(10),
            footnote: lTextSchema.optional(),
          }),
        )
        .min(2)
        .max(3),
    }),
  })
  .superRefine((spec, ctx) => {
    /* Two "recommended" cards is no recommendation — the badge must be
       unambiguous or absent. */
    if (spec.data.options.filter((o) => o.recommended).length > 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'at most one option may be recommended',
        path: ['data', 'options'],
      })
    }
  })

export type ComparisonSpec = z.infer<typeof comparisonSpecSchema>

/* ------------------------------------------------------------------ spec */

export const widgetSpecSchema = z.discriminatedUnion('type', [
  calculatorSpecSchema,
  chartSpecSchema,
  tableSpecSchema,
  checklistSpecSchema,
  timelineSpecSchema,
  comparisonSpecSchema,
])

export type WidgetSpec = z.infer<typeof widgetSpecSchema>

/** Fence language tag a bot uses to embed a spec in a reply. */
export const CHAT_WIDGET_FENCE = 'dutiva-widget'

/**
 * JSON source → validated spec, or null when the source isn't a spec we
 * render (bad JSON, failed validation, unknown type). The caller renders the
 * fallback — a widget never throws and never echoes the source back.
 */
export function parseWidgetSpec(source: string): WidgetSpec | null {
  try {
    const parsed = widgetSpecSchema.safeParse(JSON.parse(source))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export type { LText }
