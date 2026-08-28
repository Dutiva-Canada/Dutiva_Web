import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { doclibMessages } from '@/i18n/messages/doclib'
import { jurisdictionInfo, sizeThresholds, unionNote, capabilityMatrix, DOC_ORG_NAME } from './data'
import type {
  ClauseGate,
  DocCapability,
  DocStatus,
  DocTemplate,
  GeneratedDoc,
  Jurisdiction,
  OrgProfile,
  PreviewBlock,
  WorkspaceRole,
} from './data'

/**
 * The library's pure logic: merge-field resolution, conditional-clause
 * evaluation, the org-profile applicability engine, and role/status action
 * gating. The handoff shipped these as behavior descriptions plus data
 * (`when` gates, thresholds, the capability matrix) rather than code — rules
 * here are reconstructed from those sources and locked in by engine.test.ts's
 * (template × jurisdiction × headcount × union) matrix, the tests the README
 * says matter most. NOTE (handoff): this evaluation belongs server-side in
 * real production so finalized documents can't drift from the engine.
 */

/* ── Conditional clauses ─────────────────────────────────────────────────── */

export interface ClauseContext {
  jurisdiction: Jurisdiction
  headcount: number
  unionized: boolean
  /**
   * Wizard answers, where the caller has them. Omit on a surface with no
   * filled-in document — an `answer` gate then passes, so the template detail
   * preview shows every clause the template can produce.
   */
  answers?: Record<string, string>
}

/** A gated block renders only when every present test passes. */
export function gatePasses(gate: ClauseGate | undefined, ctx: ClauseContext): boolean {
  if (!gate) return true
  if (gate.juris && gate.juris !== ctx.jurisdiction) return false
  if (gate.min_headcount !== undefined && ctx.headcount < gate.min_headcount) return false
  if (gate.union !== undefined && ctx.unionized !== gate.union) return false
  if (gate.answer && ctx.answers) {
    const value = ctx.answers[gate.answer.id]
    /* Unanswered reads as "not yet decided" rather than "no": the clause stays
       visible in the live preview while the wizard is still being filled in. */
    if (value !== undefined && value !== '' && !gate.answer.equals.includes(value)) return false
  }
  return true
}

/** The blocks a generated document actually contains for this context. */
export function resolveBlocks(template: DocTemplate, ctx: ClauseContext): PreviewBlock[] {
  return template.preview.filter((block) => gatePasses(block.when, ctx))
}

/** Label/value lines in clause copy (e.g. T01 §1 employer table). */
export interface ClauseFieldLine {
  label: string
  value: string
}

const CLAUSE_FIELD_LINE_RE = /^([^:\n]{1,48}):\s*(.+)$/

/**
 * Split clause body into intro prose, a run of `Label: value` lines, and any
 * trailing prose. Returns null when the copy is ordinary paragraph text.
 */
export function parseClauseFieldLines(text: string): {
  intro: string
  fields: ClauseFieldLine[]
  outro: string
} | null {
  const lines = text.split('\n')
  const fields: ClauseFieldLine[] = []
  let fieldStart = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const match = line.match(CLAUSE_FIELD_LINE_RE)
    const label = match?.[1]?.trim() ?? ''
    const value = match?.[2]?.trim() ?? ''
    const isField = label.length > 0 && value.length > 0 && !label.includes('.')

    if (isField) {
      if (fieldStart === -1) fieldStart = i
      fields.push({ label, value })
      continue
    }
    if (fields.length > 0) {
      return {
        intro: lines.slice(0, fieldStart).join('\n'),
        fields,
        outro: lines.slice(i).join('\n'),
      }
    }
  }

  if (fields.length === 0) return null
  return {
    intro: lines.slice(0, fieldStart).join('\n'),
    fields,
    outro: '',
  }
}

/** Bullet lines in clause copy (`* item`), e.g. T01 §13 conditions. */
export function parseClauseBulletLines(text: string): {
  intro: string
  items: string[]
  outro: string
} | null {
  const lines = text.split('\n')
  const items: string[] = []
  let bulletStart = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (line.startsWith('* ')) {
      if (bulletStart === -1) bulletStart = i
      items.push(line.slice(2).trim())
      continue
    }
    if (items.length > 0) {
      return {
        intro: lines.slice(0, bulletStart).join('\n'),
        items,
        outro: lines.slice(i).join('\n'),
      }
    }
  }

  if (items.length === 0) return null
  return {
    intro: lines.slice(0, bulletStart).join('\n'),
    items,
    outro: '',
  }
}

/** Letter closing block after `Sincerely,` / `Cordialement,` (T01 §15). */
export function splitClauseSignOff(text: string): {
  body: string
  closing: string
  lines: string[]
} | null {
  const match = text.match(/\n(Sincerely,|Cordialement,)\n/)
  if (!match || match.index === undefined || !match[1]) return null
  const body = text.slice(0, match.index)
  const tail = text.slice(match.index + 1).trim()
  const tailLines = tail.split('\n')
  const closing = tailLines[0] ?? ''
  return { body, closing, lines: tailLines.slice(1) }
}

/* ── Merge fields ────────────────────────────────────────────────────────── */

export interface MergeSegment {
  id: string
  kind: 'text' | 'filled' | 'unfilled'
  text: string
}

const TOKEN_RE = /\{\{([a-z0-9_]+)\}\}/g

/** Computed tokens available beyond the wizard answers. */
export function computedTokens(
  jurisdiction: Jurisdiction,
  lang: Lang,
  today: string,
): Record<string, string> {
  const info = jurisdictionInfo.find((j) => j.code === jurisdiction)
  return {
    org: DOC_ORG_NAME,
    today,
    jurisdiction: info ? pick(info.name, lang) : jurisdiction,
    statute: info ? pick(info.statute, lang) : '',
  }
}

/** Long-form "today" string for merge fields in the given document language. */
export function formatTodayLabel(lang: Lang, at: Date = new Date()): string {
  return at.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Wizard answers + computed tokens, ready for mergeSegments / DocPaper. */
export function mergeFieldValues(
  template: DocTemplate,
  answers: Record<string, string>,
  jurisdiction: Jurisdiction,
  lang: Lang,
  today?: string,
): Record<string, string> {
  const todayString = today ?? formatTodayLabel(lang)
  return {
    ...computedTokens(jurisdiction, lang, todayString),
    ...answerLabels(template, answers, lang),
  }
}

/** EN + FR merge values for templates that deliver both languages in one file. */
export function bilingualMergeValues(
  template: DocTemplate,
  answers: Record<string, string>,
  jurisdiction: Jurisdiction,
  at: Date = new Date(),
): { en: Record<string, string>; fr: Record<string, string> } {
  return {
    en: mergeFieldValues(template, answers, jurisdiction, 'en', formatTodayLabel('en', at)),
    fr: mergeFieldValues(template, answers, jurisdiction, 'fr', formatTodayLabel('fr', at)),
  }
}

export function isBilingualDelivery(template: DocTemplate): boolean {
  return template.delivery === 'bilingual'
}

/** Body copy repeats per language; signature and disclaimer blocks render once at the end. */
export function splitBilingualBody(blocks: PreviewBlock[]): {
  body: PreviewBlock[]
  tail: PreviewBlock[]
} {
  const tailTypes = new Set<PreviewBlock['type']>(['sig', 'note'])
  return {
    body: blocks.filter((block) => !tailTypes.has(block.type)),
    tail: blocks.filter((block) => tailTypes.has(block.type)),
  }
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Long-form calendar date for merge fields — matches `today` in the wizard. */
export function formatDateAnswer(iso: string, lang: Lang): string {
  const trimmed = iso.trim()
  if (!ISO_DATE_RE.test(trimmed)) return iso
  const date = new Date(`${trimmed}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Wizard answers with every `select`/`radio` answer replaced by that option's
 * label in the document's language, and every `date` answer rendered in long
 * form instead of raw ISO.
 *
 * A select stores `option.value`, and `mergeSegments` inserts whatever it is
 * given verbatim — so without this, a merged select renders its stored value
 * into the finished document. That is wrong twice over. The value can be an
 * internal key (`no_plans`), and even where it is prose it is one language's
 * prose, so a French document renders "2 weeks" where the option's own French
 * label says "2 semaines".
 *
 * Date inputs store `YYYY-MM-DD`; without formatting, a start date reads
 * `2026-09-15` beside a letter date of "August 27, 2026".
 *
 * Both were live before Ring 3 — T01, T08, T10, T11, T16, T22 and T23 all
 * merge a select — which is why this is fixed here rather than worked around
 * in the new templates. Apply it wherever answers meet `mergeSegments`;
 * computed tokens are already localized by `computedTokens`.
 */
export function answerLabels(
  template: DocTemplate,
  answers: Record<string, string>,
  lang: Lang,
): Record<string, string> {
  const resolved: Record<string, string> = { ...answers }
  for (const question of template.questions) {
    const answer = answers[question.id]
    if (answer === undefined || answer === '') continue
    if (question.type === 'date') {
      resolved[question.id] = formatDateAnswer(answer, lang)
      continue
    }
    if (!question.options) continue
    const option = question.options.find((o) => o.value === answer)
    if (option) resolved[question.id] = pick(option.label, lang)
  }
  return resolved
}

/**
 * Split block text into segments so the renderer can style filled (`.mf.filled`)
 * vs unfilled (`.mf`) merge fields distinctly — the prototype's live-preview
 * treatment. Unfilled tokens keep a readable placeholder form.
 */
export function mergeSegments(text: string, answers: Record<string, string>): MergeSegment[] {
  const segments: MergeSegment[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN_RE)) {
    const index = match.index
    if (index === undefined) continue
    if (index > last)
      segments.push({ id: `text-${last}`, kind: 'text', text: text.slice(last, index) })
    const token = match[1] ?? ''
    const value = answers[token]
    if (value !== undefined && String(value).trim() !== '') {
      segments.push({ id: `token-${index}`, kind: 'filled', text: String(value) })
    } else {
      segments.push({ id: `token-${index}`, kind: 'unfilled', text: token.replaceAll('_', ' ') })
    }
    last = index + match[0].length
  }
  if (last < text.length)
    segments.push({ id: `text-${last}`, kind: 'text', text: text.slice(last) })
  return segments
}

/** Distinct merge tokens across a template's blocks (answer-backed only). */
export function templateTokens(template: DocTemplate): string[] {
  const computed = new Set(['org', 'today', 'jurisdiction', 'statute'])
  const tokens = new Set<string>()
  for (const block of template.preview) {
    for (const lang of ['en', 'fr'] as const) {
      const text = block.text?.[lang] ?? ''
      for (const match of text.matchAll(TOKEN_RE)) {
        const token = match[1] ?? ''
        if (!computed.has(token)) tokens.add(token)
      }
    }
  }
  return [...tokens]
}

/** Fill progress for the review step: X of Y answer-backed fields filled. */
export function fillProgress(
  template: DocTemplate,
  answers: Record<string, string>,
): { filled: number; total: number } {
  const tokens = templateTokens(template)
  const filled = tokens.filter((t) => (answers[t] ?? '').trim() !== '').length
  return { filled, total: tokens.length }
}

/* ── Applicability engine ────────────────────────────────────────────────── */

export type ApplicabilityKind = 'required' | 'applies' | 'below' | 'union'

export interface Applicability {
  kind: ApplicabilityKind
  label: Bi
  reason: Bi
}

/**
 * Whole-template size triggers. The handoff's data encodes clause-level gates
 * (`when`) but describes one template-level rule in prose + thresholds data:
 * group/mass-termination provisions (T15) trigger at 50+ employees.
 * ⚠ Legal-facing thresholds — must be verified by counsel before real use.
 */
const TEMPLATE_SIZE_TRIGGERS: Record<string, number> = { T15: 50 }

const APPLIC_LABEL: Record<ApplicabilityKind, Bi> = {
  required: doclibMessages.doclib_applic_required,
  applies: doclibMessages.doclib_applic_applies,
  below: doclibMessages.doclib_applic_below,
  union: doclibMessages.doclib_applic_union,
}

const APPLIES_REASON: Bi = {
  en: 'Standard obligations for your organization profile.',
  fr: 'Obligations habituelles pour le profil de votre organisation.', // [FR self-authored]
}

/**
 * Given the org compliance profile, how does this template apply?
 * Precedence: collective agreement > size trigger > size-gated clause > default.
 */
export function applicability(template: DocTemplate, org: OrgProfile): Applicability {
  const unionGated = template.preview.some((b) => b.when?.union !== undefined)
  if (unionGated && org.unionized) {
    return { kind: 'union', label: APPLIC_LABEL.union, reason: unionNote }
  }

  const sizeTrigger = TEMPLATE_SIZE_TRIGGERS[template.tid]
  if (sizeTrigger !== undefined) {
    const threshold = sizeThresholds.find((t) => t.at === sizeTrigger)
    const reason = threshold?.text ?? APPLIES_REASON
    return org.headcount >= sizeTrigger
      ? { kind: 'required', label: APPLIC_LABEL.required, reason }
      : { kind: 'below', label: APPLIC_LABEL.below, reason }
  }

  const sizeGates = template.preview
    .map((b) => b.when?.min_headcount)
    .filter((n): n is number => n !== undefined)
  const activeGate = sizeGates.find((gate) => org.headcount >= gate)
  if (activeGate !== undefined) {
    const threshold = sizeThresholds.find((t) => t.at === activeGate)
    return {
      kind: 'required',
      label: APPLIC_LABEL.required,
      reason: threshold?.text ?? APPLIES_REASON,
    }
  }

  return { kind: 'applies', label: APPLIC_LABEL.applies, reason: APPLIES_REASON }
}

/* ── Roles & document actions ────────────────────────────────────────────── */

export function can(role: WorkspaceRole, capability: DocCapability): boolean {
  return capabilityMatrix[capability].includes(role)
}

export type DocAction =
  | 'edit'
  | 'request_review'
  | 'approve'
  | 'send_for_signature'
  | 'export'
  | 'archive'
  | 'restore'
  | 'void'

interface ActionRule {
  capability: DocCapability
  /** Statuses the action is available from (absent = any non-terminal). */
  from?: DocStatus[]
  notFrom?: DocStatus[]
}

/* Status gating per the prototype's docActionsFor(): terminal statuses only
   allow restore/void paths; signature flow requires an approved document. */
const ACTION_RULES: Record<DocAction, ActionRule> = {
  edit: {
    capability: 'edit',
    notFrom: [
      'signed',
      'exported',
      'archived',
      'voided',
      'deleted',
      'sent_for_signature',
      'partially_signed',
    ],
  },
  request_review: { capability: 'request_review', from: ['draft', 'needs_revision'] },
  approve: { capability: 'approve_review', from: ['in_review'] },
  send_for_signature: { capability: 'send_for_signature', from: ['approved'] },
  export: { capability: 'export', notFrom: ['archived', 'voided', 'deleted'] },
  archive: { capability: 'archive', notFrom: ['archived', 'voided', 'deleted'] },
  restore: { capability: 'restore', from: ['archived'] },
  void: { capability: 'void', notFrom: ['voided', 'deleted', 'archived'] },
}

/** The action buttons this role can use on this document, in display order. */
export function docActionsFor(doc: GeneratedDoc, role: WorkspaceRole): DocAction[] {
  const status: DocStatus = doc.archived ? 'archived' : doc.status
  return (Object.keys(ACTION_RULES) as DocAction[]).filter((action) => {
    const rule = ACTION_RULES[action]
    if (!can(role, rule.capability)) return false
    if (rule.from && !rule.from.includes(status)) return false
    if (rule.notFrom?.includes(status)) return false
    return true
  })
}
