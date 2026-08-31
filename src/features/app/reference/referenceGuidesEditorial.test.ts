import { describe, expect, it } from 'vitest'
import { referenceGuides } from './data'
import { editorialFigureIn } from '@/features/marketing/articles/editorialFigures'

/**
 * In-product reference guides must not publish statutory figures in their
 * jurisdiction notes — the same load-bearing surface as template
 * jurisdictionNotes. Illustrative durations in contrast-pair examples ("ten
 * minutes before the meeting") are allowed; those are coaching copy, not
 * statutory claims.
 */

describe.each(referenceGuides.map((g) => [g.slug, g] as const))(
  'guide jurisdiction notes: %s',
  (_slug, guide) => {
    it('quotes no duration or monetary statutory figure in jurisdiction notes', () => {
      const offenders: string[] = []
      for (const [code, note] of Object.entries(guide.jurisdictionNotes)) {
        if (!note) continue
        for (const [lang, text] of [
          ['en', note.en],
          ['fr', note.fr],
        ] as const) {
          const figure = editorialFigureIn(text)
          if (figure)
            offenders.push(`jurisdictionNotes.${code} (${lang}) — "${figure}" in: ${text}`)
        }
      }
      expect(offenders).toEqual([])
    })
  },
)

describe('guide privacy: diagnosis language', () => {
  it('does not instruct managers to collect a diagnosis in contrast-pair advice', () => {
    for (const guide of referenceGuides) {
      for (const section of guide.sections) {
        for (const block of section.blocks) {
          if (block.type !== 'contrast') continue
          const text = block.instead.en
          if (!/diagnos/i.test(text)) continue
          expect(
            /do not ask|never ask|must not ask|not asking for a diagnosis/i.test(text),
            `${guide.slug} contrast.instead advises collecting diagnosis`,
          ).toBe(true)
        }
      }
    }
  })
})
