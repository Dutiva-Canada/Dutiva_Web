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

/* ---------- coverage themes ---------- */

export interface ClusterItem {
  title: string
  source: string
}
export interface Cluster {
  theme: string
  /** 0-based indices into the submitted items array. */
  indices: number[]
}

export function clustersPrompt(items: ClusterItem[]): string {
  const list = items
    .map((it, i) => `${i + 1}. ${it.title}${it.source ? ` — ${it.source}` : ''}`)
    .join('\n')
  return [
    'You are grouping press headlines for a PR desk. Group the numbered items into 2–4 broad themes (e.g. product news, criticism, an industry topic). Theme names should be short — two to five words.',
    'Return one line per theme, in exactly this format: Theme name | 1,3,5',
    'Use only item numbers that exist, and each headline may appear in at most one theme. Skip any headline that fits no theme. No preamble, no explanations.',
    '',
    list,
  ].join('\n')
}

/** Parse "Theme name | 1,3,5" lines. Anything malformed is dropped — a
    partial grouping beats a failed one, and no invented indices escape. */
export function parseClusters(raw: string, count: number): Cluster[] {
  const clusters: Cluster[] = []
  for (const line of raw.split('\n')) {
    if (clusters.length >= 4) break
    const t = line.trim()
    if (!t) continue
    const bar = t.lastIndexOf('|')
    if (bar < 0) continue
    const theme = t.slice(0, bar).replace(/^[-*•\d.\s]+/, '').trim()
    const indices = [...new Set(
      t.slice(bar + 1)
        .split(/[,\s]+/)
        .map((n) => parseInt(n, 10) - 1)
        .filter((n) => Number.isInteger(n) && n >= 0 && n < count),
    )]
    if (!theme || indices.length === 0) continue
    clusters.push({ theme: theme.slice(0, 80), indices })
  }
  return clusters
}

/* ---------- monthly report intro ---------- */

export function summaryPrompt(statsJson: string, monthLabel: string, lang: 'en' | 'fr'): string {
  const langLine = lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.'
  return [
    'You write the intro line of a monthly PR report. Two or three plain sentences describing ONLY the numbers provided — what was logged, nothing predictive and no advice. Name the month. If the numbers are thin, say so honestly in one sentence.',
    langLine,
    'Return only the intro text — no preamble, no heading.',
    '',
    `Month: ${monthLabel}`,
    `Numbers: ${statsJson}`,
  ].join('\n')
}

/* ---------- GEO prompt suggestions ---------- */

export interface PromptsInput {
  campaigns: string[]
  existing: string[]
  lang: 'en' | 'fr'
}

export function promptsPrompt(input: PromptsInput): string {
  const langLine = input.lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.'
  return [
    'A PR desk tracks whether AI assistants mention their brand. Suggest 3 new questions a real person might type into an assistant where the brand could plausibly appear — about its category, alternatives, or problems it solves. The brand is Dutiva, a Canadian HR-compliance platform (dutiva.ca).',
    'Each suggestion must read like a natural question, not a keyword phrase. Do not repeat the already-tracked questions.',
    langLine,
    'Return exactly 3 lines, one question per line. No numbering, no preamble.',
    '',
    input.campaigns.length > 0 ? `Current campaigns: ${input.campaigns.join(' · ')}` : '',
    input.existing.length > 0 ? `Already tracked: ${input.existing.join(' | ')}` : '',
  ].filter((l) => l !== undefined).join('\n')
}

/** Numbered/bulleted lines → clean prompt strings, deduped case-insensitively
    against already-tracked prompts and each other. */
export function parsePromptList(raw: string, existing: string[], max = 3): string[] {
  const seen = new Set(existing.map((e) => e.trim().toLowerCase()))
  const out: string[] = []
  for (const line of raw.split('\n')) {
    if (out.length >= max) break
    const t = line
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
      .trim()
      .replace(/^["“]|["”]$/g, '')
    if (t.length < 8 || t.length > 300) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}
