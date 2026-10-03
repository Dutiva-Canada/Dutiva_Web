/**
 * pr-ai — pure prompt/parse helpers, split out so vitest can cover them
 * without the edge runtime.
 */

export const PR_SENTIMENTS = ['positive', 'neutral', 'negative'] as const
export type PrSentiment = (typeof PR_SENTIMENTS)[number]

const TONE_WORDS = new Map<string, PrSentiment>([
  ['positive', 'positive'], ['positif', 'positive'], ['favorable', 'positive'],
  ['neutral', 'neutral'], ['neutre', 'neutral'],
  ['negative', 'negative'], ['négatif', 'negative'], ['negatif', 'negative'], ['unfavorable', 'negative'],
])

/** Extract one tone word from a short model reply — tolerates numbering
    ("2. positive"), punctuation, and French labels. Anything ambiguous or
    empty maps to null so the caller decides (manual form keeps its value,
    ingest falls back to 'neutral'). */
export function parseTone(raw: string): PrSentiment | null {
  const text = raw.trim().toLowerCase()
  if (!text) return null
  const first = text.split('\n').find((l) => l.trim() !== '') ?? ''
  const cleaned = first.replace(/^\s*\d+[.)-]?\s*/, '').replace(/[^a-zàâäçéèêëîïôöùûü\s-]/gi, '')
  for (const word of cleaned.split(/[\s-]+/)) {
    const hit = TONE_WORDS.get(word)
    if (hit) return hit
  }
  return null
}

/** Batch version for feed ingest — the model gets numbered headlines and
    answers one tone per line. Missing/garbled lines fall back to 'neutral'
    so a flaky reply never blocks an insert. */
export function parseToneList(raw: string, count: number): PrSentiment[] {
  const tones: PrSentiment[] = []
  const lines = raw.split('\n')
  for (const line of lines) {
    if (tones.length >= count) break
    const t = parseTone(line)
    if (t) tones.push(t)
  }
  while (tones.length < count) tones.push('neutral')
  return tones
}

export function tonePrompt(headlines: string[]): string {
  const list = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
  return [
    'You are tagging press coverage for a Canadian company\'s PR desk. For each numbered headline, judge the tone TOWARD THE COVERED COMPANY — positive, neutral, or negative — not the topic itself.',
    'Answer with exactly one word per line, in order: positive, neutral, or negative. No numbering, no explanations.',
    '',
    list,
  ].join('\n')
}

export function singleTonePrompt(title: string, source: string): string {
  return [
    'You are tagging one piece of press coverage for a Canadian company\'s PR desk. Judge the tone TOWARD THE COVERED COMPANY — positive, neutral, or negative — not the topic itself.',
    'Answer with exactly one word: positive, neutral, or negative.',
    '',
    `Headline: ${title}`,
    source ? `Outlet: ${source}` : '',
  ].filter(Boolean).join('\n')
}

/** Strip model scaffolding — surrounding quotes, "Here's a draft" preambles,
    markdown headers — without touching the draft itself. */
export function cleanDraft(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/,'').trim()
  const lines = text.split('\n')
  while (lines.length > 0) {
    const first = (lines[0] ?? '').trim()
    if (
      first === '' ||
      /^#+\s/.test(first) ||
      /^(here|voici|voilà)\b.*[:：]?\s*$/i.test(first) && first.length < 80
    ) {
      lines.shift()
      continue
    }
    break
  }
  while (lines.length > 0 && (lines[lines.length - 1] ?? '').trim() === '') lines.pop()
  return lines.join('\n').trim()
}

export interface DraftInput {
  itemKind: string
  channel: string
  title: string
  notes: string
  lang: 'en' | 'fr'
}

export function draftPrompt(input: DraftInput): string {
  const langLine = input.lang === 'fr'
    ? 'Write in Canadian French.'
    : 'Write in Canadian English.'
  const len = input.itemKind === 'post' || input.itemKind === 'social'
    ? 'Keep it under 60 words — short enough to post as-is.'
    : 'Aim for 120–180 words.'
  return [
    'You help the Dutiva PR desk draft communications materials. Dutiva is a Canadian HR-compliance platform (dutiva.ca).',
    'Write a first draft only — concrete, plain, no hype words, no emoji, no hashtags unless the channel is social. A human edits before anything ships.',
    langLine,
    len,
    '',
    `Type: ${input.itemKind}`,
    input.channel ? `Channel: ${input.channel}` : '',
    `Working title: ${input.title}`,
    input.notes ? `Notes to work from: ${input.notes}` : '',
    '',
    'Return only the draft text.',
  ].filter((l) => l !== undefined).join('\n')
}
