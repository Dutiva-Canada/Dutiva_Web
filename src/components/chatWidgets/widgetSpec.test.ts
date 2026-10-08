import { describe, expect, it } from 'vitest'
import { parseWidgetSpec, widgetSpecSchema, type WidgetSpec } from './widgetSpec'
import { ontarioTerminationPaySpec } from './prebuiltWidgets'

/**
 * Schema-validation coverage: all six widget types accept well-formed
 * specs, and the adversarial shapes — markup, code, unknown types, extra
 * keys, undeclared formula refs, runaway trees — are rejected. A rejected
 * spec renders WidgetFallback, never its contents.
 */

const validCalculator = {
  type: 'calculator',
  title: { en: 'Pay estimator', fr: 'Estimateur de paie' },
  data: {
    inputs: [{ key: 'hours', label: { en: 'Hours', fr: 'Heures' }, default: 40 }],
    formula: { op: 'mul', args: [{ op: 'ref', key: 'hours' }, { op: 'num', value: 2 }] },
    result: { label: 'Total' },
  },
}

const validChart = {
  type: 'chart',
  data: {
    kind: 'bar',
    items: [{ label: 'Ontario', value: 6 }],
  },
}

const validTable = {
  type: 'table',
  data: {
    columns: [{ key: 'name', label: 'Name' }],
    rows: [{ name: 'Ontario' }, { name: 'Québec' }],
  },
}

const validChecklist = {
  type: 'checklist',
  data: { items: [{ id: 'a', label: 'Collect SIN' }] },
}

const validTimeline = {
  type: 'timeline',
  data: {
    steps: [
      { label: 'Start', date: '2026-01-05' },
      { label: 'Review', date: '2026-04-05', status: 'upcoming' },
    ],
  },
}

const validComparison = {
  type: 'comparison',
  data: {
    options: [
      { name: 'Employee', rows: [{ label: 'Control', value: 'Employer' }] },
      { name: 'Contractor', rows: [{ label: 'Control', value: 'Worker' }] },
    ],
  },
}

describe('widgetSpecSchema — valid specs', () => {
  it.each([
    ['calculator', validCalculator],
    ['chart', validChart],
    ['table', validTable],
    ['checklist', validChecklist],
    ['timeline', validTimeline],
    ['comparison', validComparison],
  ])('accepts a well-formed %s spec', (_name, spec) => {
    const result = widgetSpecSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it('accepts the prebuilt Ontario termination-pay spec', () => {
    expect(widgetSpecSchema.safeParse(ontarioTerminationPaySpec()).success).toBe(true)
  })

  it('accepts optional title and locale fields', () => {
    const spec = { ...validChart, title: 'Breakdown', locale: 'en' }
    expect(widgetSpecSchema.safeParse(spec).success).toBe(true)
  })
})

describe('widgetSpecSchema — adversarial specs', () => {
  it('rejects a spec whose type is not in the catalog', () => {
    expect(
      widgetSpecSchema.safeParse({ type: 'script', data: {} }).success,
    ).toBe(false)
    expect(
      widgetSpecSchema.safeParse({ type: 'html', data: {} }).success,
    ).toBe(false)
    expect(
      widgetSpecSchema.safeParse({ type: 'form', data: {} }).success,
    ).toBe(false)
  })

  it('rejects extra keys at every level — an html field fails validation', () => {
    expect(
      widgetSpecSchema.safeParse({ ...validCalculator, html: '<img src=x>' }).success,
    ).toBe(false)
    expect(
      widgetSpecSchema.safeParse({
        ...validCalculator,
        data: { ...validCalculator.data, onClick: 'steal()' },
      }).success,
    ).toBe(false)
    expect(
      widgetSpecSchema.safeParse({
        ...validChecklist,
        data: { items: [{ id: 'a', label: 'x', href: 'javascript:alert(1)' }] },
      }).success,
    ).toBe(false)
  })

  it('rejects a formula expressed as a code string', () => {
    const spec = {
      ...validCalculator,
      data: { ...validCalculator.data, formula: 'alert(document.cookie)' },
    }
    expect(widgetSpecSchema.safeParse(spec).success).toBe(false)
  })

  it('rejects a formula with an operator outside the whitelist', () => {
    const spec = {
      ...validCalculator,
      data: {
        ...validCalculator.data,
        formula: { op: 'eval', args: [{ op: 'num', value: 1 }] },
      },
    }
    expect(widgetSpecSchema.safeParse(spec).success).toBe(false)
  })

  it('rejects a formula that references an undeclared input', () => {
    const spec = {
      ...validCalculator,
      data: {
        ...validCalculator.data,
        formula: { op: 'ref', key: 'secret' },
      },
    }
    expect(widgetSpecSchema.safeParse(spec).success).toBe(false)
  })

  it('rejects formulas that exceed the depth/node budget', () => {
    let deep: unknown = { op: 'num', value: 1 }
    for (let i = 0; i < 20; i += 1) deep = { op: 'abs', arg: deep }
    const spec = { ...validCalculator, data: { ...validCalculator.data, formula: deep } }
    expect(widgetSpecSchema.safeParse(spec).success).toBe(false)
  })

  it('rejects negative slices in a pie chart', () => {
    const spec = {
      type: 'chart',
      data: { kind: 'pie', items: [{ label: 'A', value: -5 }, { label: 'B', value: 10 }] },
    }
    expect(widgetSpecSchema.safeParse(spec).success).toBe(false)
  })

  it('rejects oversized collections', () => {
    const huge = {
      type: 'table',
      data: {
        columns: [{ key: 'a', label: 'a' }],
        rows: Array.from({ length: 501 }, (_, i) => ({ a: i })),
      },
    }
    expect(widgetSpecSchema.safeParse(huge).success).toBe(false)
  })

  it('rejects missing required data fields', () => {
    expect(
      widgetSpecSchema.safeParse({ type: 'checklist', data: {} }).success,
    ).toBe(false)
  })

  it('rejects duplicate keys that would alias widget state', () => {
    /* Two inputs sharing a key share one field; two columns share sort. */
    expect(
      widgetSpecSchema.safeParse({
        ...validCalculator,
        data: {
          ...validCalculator.data,
          inputs: [
            { key: 'hours', label: 'Hours' },
            { key: 'hours', label: 'Also hours' },
          ],
        },
      }).success,
    ).toBe(false)
    expect(
      widgetSpecSchema.safeParse({
        type: 'table',
        data: {
          columns: [
            { key: 'a', label: 'A' },
            { key: 'a', label: 'A again' },
          ],
          rows: [{ a: 'x' }],
        },
      }).success,
    ).toBe(false)
    expect(
      widgetSpecSchema.safeParse({
        type: 'checklist',
        data: {
          items: [
            { id: 'a', label: 'One' },
            { id: 'a', label: 'Two' },
          ],
        },
      }).success,
    ).toBe(false)
  })

  it('rejects item ids that could double as object internals', () => {
    for (const id of ['__proto__', '_hidden', 'has space', 'has.dot', '9starts-digit']) {
      expect(
        widgetSpecSchema.safeParse({
          type: 'checklist',
          data: { items: [{ id, label: 'x' }] },
        }).success,
      ).toBe(false)
    }
  })
})

describe('parseWidgetSpec', () => {
  it('parses valid spec JSON', () => {
    const spec = parseWidgetSpec(JSON.stringify(validChecklist))
    expect(spec?.type).toBe('checklist')
  })

  it('returns null for non-JSON sources — raw HTML/JS never reaches the renderer', () => {
    expect(parseWidgetSpec('<script>alert(1)</script>')).toBeNull()
    expect(parseWidgetSpec('alert(document.cookie)')).toBeNull()
    expect(parseWidgetSpec('<img src=x onerror=alert(1)>')).toBeNull()
  })

  it('returns null for JSON that fails validation', () => {
    expect(parseWidgetSpec('{"type":"calculator","html":"<script>"}')).toBeNull()
    expect(parseWidgetSpec('{"type":"unknown","data":{}}')).toBeNull()
    expect(parseWidgetSpec('{"data":{}}')).toBeNull()
  })

  it('keeps label strings as inert text — markup inside a label is data, not DOM', () => {
    const spec = parseWidgetSpec(
      JSON.stringify({
        type: 'checklist',
        data: { items: [{ id: 'a', label: '<b>bold</b>' }] },
      }),
    ) as WidgetSpec
    expect(spec.type).toBe('checklist')
    if (spec.type !== 'checklist') return
    expect(spec.data.items[0]?.label).toBe('<b>bold</b>')
  })
})
