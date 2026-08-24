import { describe, expect, it } from 'vitest'
import { allTemplates } from '../../catalogue'
import { computedTokens, mergeSegments, resolveBlocks } from '../../engine'
import { templateCategories } from '../meta'
import type { DocTemplate, Jurisdiction } from '../types'

/**
 * Guards for handoff-derived templates (T01–T20) and the ported legacy
 * bodies in customTemplates (T17–T20 overlap is covered once via the
 * catalogue). The generator that validated these on import no longer runs,
 * so the same structural checks applied to T21+ in authoredTemplates.test.ts
 * are asserted here — adapted for templates that may be single-jurisdiction.
 */

const HANDOFF = allTemplates.filter((t) => {
  const n = Number(t.tid.slice(1))
  return n >= 1 && n <= 20
})
const TIDS = HANDOFF.map((t) => t.tid)

const template = (tid: string): DocTemplate => {
  const found = allTemplates.find((t) => t.tid === tid)
  if (!found) throw new Error(`missing template ${tid}`)
  return found
}

function biStrings(tpl: DocTemplate): [string, { en: string; fr: string }][] {
  const out: [string, { en: string; fr: string }][] = [
    ['name', tpl.name],
    ['desc', tpl.desc],
    ...tpl.statutory.map((s, i): [string, typeof s] => [`statutory[${i}]`, s]),
    ...Object.entries(tpl.jurisdictionNotes).map(([k, v]): [string, typeof v] => [
      `jurisdictionNotes.${k}`,
      v,
    ]),
    ...tpl.includes.map((s, i): [string, typeof s] => [`includes[${i}]`, s]),
  ]
  for (const [i, q] of tpl.questions.entries()) {
    out.push([`questions[${i}].section`, q.section], [`questions[${i}].label`, q.label])
    if (q.placeholder) out.push([`questions[${i}].placeholder`, q.placeholder])
    if (q.hint) out.push([`questions[${i}].hint`, q.hint])
    for (const [j, o] of (q.options ?? []).entries()) {
      out.push([`questions[${i}].options[${j}].label`, o.label])
    }
  }
  for (const [i, b] of tpl.preview.entries()) {
    if (b.text) out.push([`preview[${i}].text`, b.text])
    if (b.heading) out.push([`preview[${i}].heading`, b.heading])
    for (const [j, r] of (b.roles ?? []).entries()) {
      out.push([`preview[${i}].roles[${j}]`, r])
    }
  }
  return out
}

const TOKEN_RE = /\{\{([a-z0-9_]+)\}\}/g
const tokensIn = (text: string): string[] => [...text.matchAll(TOKEN_RE)].map((m) => m[1] ?? '')

describe.each(TIDS)('%s (handoff)', (tid) => {
  it('claims only jurisdictions it documents in notes', () => {
    const tpl = template(tid)
    expect(Object.keys(tpl.jurisdictionNotes).sort()).toEqual([...tpl.jurisdictions].sort())
  })

  it('sits in a category the catalogue actually defines', () => {
    expect(templateCategories.map((c) => c.id)).toContain(template(tid).category)
  })

  it('routes to lawyer review when it is marked high risk', () => {
    const tpl = template(tid)
    if (tpl.risk !== 'high') return
    expect(tpl.requiresLawyerReview, tid).toBe(true)
    expect(tpl.review, tid).toBe('lawyer_review_recommended')
  })

  it('ships every string in both languages, with no untranslated FR', () => {
    for (const [path, bi] of biStrings(template(tid))) {
      expect(bi.en.trim(), `${tid} ${path}.en`).not.toBe('')
      expect(bi.fr.trim(), `${tid} ${path}.fr`).not.toBe('')
      if (bi.en.split(/\s+/).length > 3 && !bi.en.startsWith('{{')) {
        expect(bi.fr, `${tid} ${path} is untranslated`).not.toBe(bi.en)
      }
    }
  })

  it('resolves every merge field from a question or a computed token', () => {
    const tpl = template(tid)
    const answerable = new Set(tpl.questions.map((q) => q.id))
    for (const jurisdiction of tpl.jurisdictions) {
      const computed = new Set(Object.keys(computedTokens(jurisdiction, 'en', '2026-08-01')))
      for (const block of tpl.preview) {
        for (const lang of ['en', 'fr'] as const) {
          for (const token of tokensIn(block.text?.[lang] ?? '')) {
            expect(
              answerable.has(token) || computed.has(token),
              `${tid} renders {{${token}}} (${lang}, ${jurisdiction}) with nothing to fill it`,
            ).toBe(true)
          }
        }
      }
    }
  })

  it('leaves no unfilled merge field once every question is answered', () => {
    const tpl = template(tid)
    const answers = Object.fromEntries(tpl.questions.map((q) => [q.id, 'x']))
    for (const jurisdiction of tpl.jurisdictions) {
      const blocks = resolveBlocks(tpl, { jurisdiction, headcount: 38, unionized: true })
      for (const block of blocks) {
        const text = block.text?.en
        if (text === undefined) continue
        const filled = { ...answers, ...computedTokens(jurisdiction as Jurisdiction, 'en', '2026-08-01') }
        const unfilled = mergeSegments(text, filled).filter((s) => s.kind === 'unfilled')
        expect(unfilled, `${tid} ${jurisdiction}`).toEqual([])
      }
    }
  })
})

describe('ported legacy templates (T17–T20)', () => {
  it('marks T17 full-and-final release for lawyer review', () => {
    expect(template('T17').requiresLawyerReview).toBe(true)
    expect(template('T17').jurisdictions).toEqual(['ON'])
  })
})
