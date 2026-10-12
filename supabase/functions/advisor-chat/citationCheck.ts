import type { GuidanceChunk } from './chatTypes.ts'

/**
 * Grounding measurement for Advisor replies — deliberately advisory, never
 * user-facing. Extracts the citations a reply makes (statute names and
 * section/article references) and reports which ones the retrieved corpus
 * cannot support. Results land in ai_usage metadata so a repair loop can be
 * justified on real false-positive data before it ever touches a reply —
 * on legal text, a wrong repair is worse than no check.
 *
 * Only runs on grounded turns: with no chunks in context there is nothing
 * to verify against and every answer would flag.
 */

/* "Employment Standards Act", "Canada Labour Code", "Charter of Rights",
   "Act respecting labour standards" — title-case phrase ending in the
   statute noun. FR: "Loi sur les normes du travail", "Code civil du Québec". */
const ACT_EN = /\b([A-Z][\w'’-]*(?:[ ,][A-Za-z'’-]+)*?\s(?:Act|Code|Charter))\b/g
const ACT_FR = /\b(Loi\s+(?:sur|de|du|des|d['’])[^.,;:!?\n]+|Code\s+civil[^.,;:!?\n]*)/g
const SECTION_REF = /\b(?:s\.|sec\.|section|ss\.|art\.|article)\s*(\d+[\d.]*)/gi

/** Words too common to ground a statute-name match on their own. */
const STOPWORDS = new Set([
  'the', 'of', 'and', 'for', 'in', 'on', 'a', 'an', 'to', 'et', 'de', 'du',
  'des', 'la', 'le', 'les', 'sur', 'd', 'l', 'au', 'aux', 'canada', 'canadian',
  'act', 'code', 'charter', 'loi', 'civil',
])

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
}

/** Significant words that must all appear in the corpus for the act to
    count as grounded — "Employment Standards Act" needs employment +
    standards somewhere in the retrieved text. */
function significantWords(name: string): string[] {
  return normalize(name)
    .replace(/\(.*?\)/g, ' ')
    .split(/[^\w']+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

export function findUngroundedCitations(reply: string, chunks: GuidanceChunk[]): string[] {
  if (chunks.length === 0 || !reply) return []
  const haystack = normalize(
    chunks.map((c) => `${c.source_name} ${c.title} ${c.content}`).join('\n'),
  )
  const ungrounded: string[] = []
  const seen = new Set<string>()

  for (const re of [ACT_EN, ACT_FR]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(reply)) !== null) {
      const name = m[1].replace(/\s+/g, ' ').trim()
      /* Skip very short or parenthetical matches — noise, not citations. */
      if (name.length < 8) continue
      const key = normalize(name)
      if (seen.has(key)) continue
      seen.add(key)
      const words = significantWords(name)
      const grounded = words.length > 0 && words.every((w) => haystack.includes(w))
      if (!grounded) ungrounded.push(name)
    }
  }

  SECTION_REF.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = SECTION_REF.exec(reply)) !== null) {
    const num = m[1].replace(/\.$/, '')
    /* Grounded if the corpus itself cites the section in any conventional
       form. Bare-number matching would let any stray figure ground it. */
    const cited = new RegExp(
      `(?:s\\.?|sec\\.?|section|ss\\.?|art\\.?|article)\\s*${num.replace(/\./g, '\\.')}(?!\\d)`,
      'i',
    ).test(haystack)
    if (!cited) ungrounded.push(`s. ${num}`)
  }
  return ungrounded
}
