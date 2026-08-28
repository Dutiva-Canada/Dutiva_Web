import { describe, expect, it } from 'vitest'
import {
  answerLabels,
  applicability,
  can,
  computedTokens,
  docActionsFor,
  fillProgress,
  formatDateAnswer,
  gatePasses,
  mergeSegments,
  resolveBlocks,
  templateTokens,
} from './engine'
import { defaultOrgProfile, sampleDocuments, templateByTid } from './data'
import { allTemplates } from './catalogue'
import type { DocTemplate, GeneratedDoc, OrgProfile } from './data'

const tpl = (tid: string): DocTemplate => {
  const t = templateByTid.get(tid)
  if (!t) throw new Error(`missing template ${tid}`)
  return t
}
const org = (over: Partial<OrgProfile>): OrgProfile => ({ ...defaultOrgProfile, ...over })

describe('conditional clauses (template × jurisdiction × headcount × union)', () => {
  it('T01 injects the disconnecting-from-work / electronic monitoring clause only at 25+ staff', () => {
    const t = tpl('T01')
    const base = { jurisdiction: 'ON' as const, unionized: false }
    const at25 = resolveBlocks(t, { ...base, headcount: 25 })
    const at24 = resolveBlocks(t, { ...base, headcount: 24 })
    expect(at25).toHaveLength(t.preview.length)
    expect(at24).toHaveLength(t.preview.length - 1)
    const gated = t.preview.find((b) => b.when)
    expect(gated?.when).toEqual({ min_headcount: 25 })
  })

  it.each(['T03', 'T06', 'T15', 'T16'])(
    '%s injects the collective-agreement clause only for unionized orgs',
    (tid) => {
      const t = tpl(tid)
      const ctx = { jurisdiction: 'ON' as const, headcount: 38 }
      const union = resolveBlocks(t, { ...ctx, unionized: true })
      const nonUnion = resolveBlocks(t, { ...ctx, unionized: false })
      expect(union).toHaveLength(nonUnion.length + 1)
    },
  )

  it('resolved T03 clause text is stable per context (snapshot matrix)', () => {
    const t = tpl('T03')
    const texts = (unionized: boolean) =>
      resolveBlocks(t, { jurisdiction: 'ON', headcount: 38, unionized })
        .map((b) => b.text?.en ?? `[sig: ${b.roles?.map((r) => r.en).join(', ')}]`)
        .join('\n')
    expect(texts(false)).toMatchSnapshot('T03 ON non-union')
    expect(texts(true)).toMatchSnapshot('T03 ON unionized')
  })

  it('gatePasses evaluates every present test conjunctively', () => {
    const ctx = { jurisdiction: 'ON' as const, headcount: 30, unionized: true }
    expect(gatePasses(undefined, ctx)).toBe(true)
    expect(gatePasses({ juris: 'ON', min_headcount: 25, union: true }, ctx)).toBe(true)
    expect(gatePasses({ juris: 'QC' }, ctx)).toBe(false)
    expect(gatePasses({ min_headcount: 31 }, ctx)).toBe(false)
    expect(gatePasses({ union: false }, ctx)).toBe(false)
  })

  it('gates a block on a wizard answer, and treats unanswered as undecided', () => {
    const base = { jurisdiction: 'ON' as const, headcount: 30, unionized: false }
    const gate = { answer: { id: 'reack', equals: ['yes'] } }
    expect(gatePasses(gate, { ...base, answers: { reack: 'yes' } })).toBe(true)
    expect(gatePasses(gate, { ...base, answers: { reack: 'no' } })).toBe(false)
    /* Still being filled in — the clause stays visible rather than flickering
       out of the live preview before the question has been reached. */
    expect(gatePasses(gate, { ...base, answers: { reack: '' } })).toBe(true)
    expect(gatePasses(gate, { ...base, answers: {} })).toBe(true)
    /* No answers at all: the template detail preview, which is showing what
       the template can produce rather than one filled-in document. */
    expect(gatePasses(gate, base)).toBe(true)
  })

  it('T40 omits the signature page when no acknowledgement was asked for', () => {
    /* The document has to honour the answer it collected: telling someone
       they need not sign and then handing them a signature block is the
       contradiction this gate exists for. */
    const t = tpl('T40')
    const ctx = { jurisdiction: 'ON' as const, headcount: 30, unionized: false }
    const kinds = (reack: string) =>
      resolveBlocks(t, { ...ctx, answers: { reack } }).map((b) => b.type)
    expect(kinds('yes')).toContain('ack')
    expect(kinds('yes')).toContain('sig')
    expect(kinds('no')).not.toContain('ack')
    expect(kinds('no')).not.toContain('sig')
  })

  it('T02 includes Schedule B only when an enhanced termination entitlement is confirmed', () => {
    /* The source instructs "complete this schedule only if..." — a gate, not
       prose to render unconditionally. */
    const t = tpl('T02')
    const ctx = { jurisdiction: 'ON' as const, headcount: 30, unionized: false }
    const headings = (has_enhanced_termination: string) =>
      resolveBlocks(t, { ...ctx, answers: { has_enhanced_termination } }).map((b) => b.heading?.en)
    expect(headings('yes')).toContain('Schedule B - Additional Contractual Termination Entitlement')
    expect(headings('no')).not.toContain(
      'Schedule B - Additional Contractual Termination Entitlement',
    )
    /* Unanswered reads as undecided — visible in the template detail preview,
       same convention as every other answer-gated block. */
    expect(headings('')).toContain('Schedule B - Additional Contractual Termination Entitlement')
  })
})

describe('applicability engine', () => {
  it('Northgate defaults: 38 staff, non-union (guard for the cases below)', () => {
    expect(defaultOrgProfile.headcount).toBeLessThan(50)
    expect(defaultOrgProfile.headcount).toBeGreaterThanOrEqual(25)
    expect(defaultOrgProfile.unionized).toBe(false)
  })

  it('T15 (group termination) is size-triggered at 50+', () => {
    expect(applicability(tpl('T15'), defaultOrgProfile).kind).toBe('below')
    expect(applicability(tpl('T15'), org({ headcount: 50 })).kind).toBe('required')
    expect(applicability(tpl('T15'), org({ headcount: 49 })).kind).toBe('below')
  })

  it('collective agreement takes precedence for unionized orgs', () => {
    expect(applicability(tpl('T15'), org({ unionized: true, headcount: 60 })).kind).toBe('union')
    expect(applicability(tpl('T03'), org({ unionized: true })).kind).toBe('union')
    expect(applicability(tpl('T03'), defaultOrgProfile).kind).toBe('applies')
  })

  it('clause-level size gates surface as "required" once the org crosses them', () => {
    expect(applicability(tpl('T01'), org({ headcount: 30 })).kind).toBe('required')
    expect(applicability(tpl('T01'), org({ headcount: 10 })).kind).toBe('applies')
  })

  it('ungated templates simply apply', () => {
    expect(applicability(tpl('T05'), defaultOrgProfile).kind).toBe('applies')
  })
})

describe('merge fields', () => {
  it('splits filled vs unfilled tokens for the live preview', () => {
    const segs = mergeSegments('Dear {{candidate_name}}, start {{start_date}}.', {
      candidate_name: 'Gabriel Dubois',
    })
    expect(segs).toEqual([
      { id: 'text-0', kind: 'text', text: 'Dear ' },
      { id: 'token-5', kind: 'filled', text: 'Gabriel Dubois' },
      { id: 'text-23', kind: 'text', text: ', start ' },
      { id: 'token-31', kind: 'unfilled', text: 'start date' },
      { id: 'text-45', kind: 'text', text: '.' },
    ])
  })

  it('computed tokens localize jurisdiction and statute', () => {
    expect(computedTokens('QC', 'fr', '2026-07-10').statute).toBe(
      'Loi sur les normes du travail (LNT)',
    )
    expect(computedTokens('ON', 'en', '2026-07-10').jurisdiction).toBe('Ontario')
  })

  it('formats date answers in long form for the document language', () => {
    expect(formatDateAnswer('2026-09-15', 'en')).toBe('September 15, 2026')
    expect(formatDateAnswer('2026-09-15', 'fr')).toMatch(/15 septembre 2026/)
    expect(answerLabels(tpl('T01'), { start_date: '2026-09-15' }, 'en').start_date).toBe(
      'September 15, 2026',
    )
  })

  it('merges vacation weeks as the option label without duplicating the unit word', () => {
    const resolved = answerLabels(tpl('T01'), { vacation_weeks: '3' }, 'en').vacation_weeks
    expect(resolved).toBe('3 weeks')
    const text = mergeSegments(
      'You will receive {{vacation_weeks}} of paid vacation per year.',
      { vacation_weeks: resolved! },
    )
      .map((segment) => segment.text)
      .join('')
    expect(text).toBe('You will receive 3 weeks of paid vacation per year.')
    expect(text).not.toMatch(/weeks weeks/)
  })

  it('merges a select as its label in the document language, not its stored value', () => {
    /* A select stores `option.value` and mergeSegments inserts verbatim, so
       without answerLabels a French document renders the English value — or,
       where the value is a key, renders the key. Both shipped before this. */
    const t41 = tpl('T41')
    expect(answerLabels(t41, { role: 'respondent' }, 'en').role).toBe(
      'The person the allegations are about',
    )
    expect(answerLabels(t41, { role: 'respondent' }, 'fr').role).toBe(
      'La personne visée par les allégations',
    )

    /* The pre-existing case: a human-readable value that is still one
       language's prose. */
    expect(answerLabels(tpl('T11'), { vacation_base: '2 weeks' }, 'fr').vacation_base).toContain(
      'semaines',
    )
  })

  it('leaves free-text answers and unknown options alone', () => {
    const t41 = tpl('T41')
    expect(answerLabels(t41, { participant_name: 'Priya Raman' }, 'fr').participant_name).toBe(
      'Priya Raman',
    )
    /* A stored value with no matching option — a stale draft after the options
       changed — passes through rather than resolving to undefined. */
    expect(answerLabels(t41, { role: 'gone' }, 'fr').role).toBe('gone')
  })

  it('every merged select resolves to a label, across the whole catalogue', () => {
    /* The guard that makes this stay fixed: any template merging a select must
       have that select resolvable, in both languages. */
    for (const template of allTemplates) {
      const merged = new Set(templateTokens(template))
      for (const question of template.questions) {
        if (!question.options || !merged.has(question.id)) continue
        for (const option of question.options) {
          for (const lang of ['en', 'fr'] as const) {
            const resolved = answerLabels(template, { [question.id]: option.value }, lang)
            expect(resolved[question.id], `${template.tid}.${question.id}=${option.value}`).toBe(
              option.label[lang],
            )
          }
        }
      }
    }
  })

  it('fillProgress counts answer-backed tokens only', () => {
    const t = tpl('T01')
    const empty = fillProgress(t, {})
    expect(empty.total).toBeGreaterThan(5)
    expect(empty.filled).toBe(0)
    expect(fillProgress(t, { employee_name: 'A' }).filled).toBe(1)
  })
})

describe('role & status action gating', () => {
  const docBy = (status: GeneratedDoc['status'], archived = false): GeneratedDoc => {
    const base = sampleDocuments[0]
    if (!base) throw new Error('no sample documents')
    return { ...base, status, archived }
  }

  it('viewers and external signers get no actions', () => {
    expect(docActionsFor(docBy('draft'), 'viewer')).toEqual([])
    expect(docActionsFor(docBy('approved'), 'external')).toEqual([])
  })

  it('owner on an archived document can only restore', () => {
    expect(docActionsFor(docBy('archived', true), 'owner')).toEqual(['restore'])
  })

  it('hr on in_review can approve but not request review or restore', () => {
    const actions = docActionsFor(docBy('in_review'), 'hr')
    expect(actions).toContain('approve')
    expect(actions).not.toContain('request_review')
    expect(actions).not.toContain('restore')
    expect(actions).not.toContain('void')
  })

  it('send for signature requires an approved document', () => {
    expect(docActionsFor(docBy('approved'), 'hr')).toContain('send_for_signature')
    expect(docActionsFor(docBy('draft'), 'hr')).not.toContain('send_for_signature')
  })

  it('manager can generate and export but not edit or approve', () => {
    expect(can('manager', 'generate')).toBe(true)
    expect(can('manager', 'export')).toBe(true)
    expect(can('manager', 'edit')).toBe(false)
    expect(can('manager', 'approve_review')).toBe(false)
  })
})
