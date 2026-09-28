import type { Bi } from '@/i18n/core'
import type { Jurisdiction } from '@/features/app/documents/data/types'

/**
 * Content model for in-product reference guides — the second surface Ring 2
 * needed and the product did not have (docs/FOUR_RING_FRAMEWORK.md).
 *
 * Eight of the framework's remaining tools are reference documents: the EAP
 * referral guide, the manager conversation guide, the functional limitations
 * guide, the pay-stub explainer, and so on. None of them fit anywhere. The
 * Knowledge view held titles and tags with no bodies; Document Studio
 * generates documents rather than publishing them; and the public `/guides`
 * collection is editorial, bound by a rule against stating statutory figures
 * that a working reference for an HR operator cannot live under.
 *
 * So this is deliberately **not** `articleModel.ts`, even though the block
 * structure is similar. Different reader, different rules:
 *
 *   - it is in-product and behind the app, not indexed;
 *   - it carries per-jurisdiction notes, because the reader has a jurisdiction;
 *   - it links to the templates and flows that act on it, because the reader
 *     is mid-task rather than browsing.
 *
 * What it is not: a place for statutory figures that go stale. The same
 * caution the editorial rule exists for applies here — name the statute,
 * describe the shape of the rule, and send the reader to the official text.
 * The difference is that here it is a judgement call rather than a test.
 */

export type GuideBlock =
  | { type: 'p'; text: Bi }
  | { type: 'li'; text: Bi }
  /** A do/don't pair — the shape most of this content actually takes. */
  | { type: 'contrast'; instead: Bi; notThis: Bi }

export interface GuideSection {
  heading: Bi
  blocks: GuideBlock[]
}

export interface ReferenceGuide {
  /** Stable slug — `/app/knowledge/<slug>`. */
  slug: string
  title: Bi
  /** One line, shown on the Knowledge index card. */
  summary: Bi
  /** Short topic label, matching the Knowledge list's existing tag treatment. */
  tag: Bi
  ring: 1 | 2 | 3 | 4
  jurisdictions: Jurisdiction[]
  readingMinutes: number
  sections: GuideSection[]
  /** Per-jurisdiction notes, rendered together at the end. */
  jurisdictionNotes: Partial<Record<Jurisdiction, Bi>>
  /** Document Studio tids this guide is the background reading for. */
  relatedTemplates?: string[]
  /** Flow slugs this guide supports. */
  relatedFlows?: string[]
}

export const p = (en: string, fr: string): GuideBlock => ({ type: 'p', text: { en, fr } })
export const li = (en: string, fr: string): GuideBlock => ({ type: 'li', text: { en, fr } })
export const contrast = (instead: Bi, notThis: Bi): GuideBlock => ({
  type: 'contrast',
  instead,
  notThis,
})

type GuideBlockGroup =
  | { kind: 'p'; text: Bi }
  | { kind: 'list'; items: Bi[] }
  | { kind: 'contrast'; instead: Bi; notThis: Bi }

/**
 * Collapses consecutive `li` blocks into one list so the rendered markup is a
 * single semantic `<ul>` rather than a run of one-item lists. Same shape as
 * `groupArticleBlocks` and `groupHelpBlocks`.
 */
export function groupGuideBlocks(blocks: GuideBlock[]): GuideBlockGroup[] {
  const groups: GuideBlockGroup[] = []
  for (const block of blocks) {
    if (block.type === 'li') {
      const last = groups.at(-1)
      if (last?.kind === 'list') last.items.push(block.text)
      else groups.push({ kind: 'list', items: [block.text] })
    } else if (block.type === 'contrast') {
      groups.push({ kind: 'contrast', instead: block.instead, notThis: block.notThis })
    } else {
      groups.push({ kind: 'p', text: block.text })
    }
  }
  return groups
}
