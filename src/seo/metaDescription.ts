import type { Lang } from '@/i18n/core'

/** Bing recommends ≥120; Google truncates around 155. */
export const META_DESCRIPTION_MIN = 120
export const META_DESCRIPTION_MAX = 155

const DEFAULT_PAD: Record<Lang, string> = {
  en: ' — Dutiva, Canadian HR compliance for employers.',
  fr: ' — Dutiva, conformité RH canadienne pour employeurs.',
}

const MIN_FILLERS: Record<Lang, readonly string[]> = {
  en: [' Bilingual EN/FR.', ' For Canadian employers.', ' Published by Dutiva Canada Inc.'],
  fr: [' Bilingue FR/EN.', ' Pour employeurs canadiens.', ' Publié par Dutiva Canada Inc.'],
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace >= META_DESCRIPTION_MIN - 24) return slice.slice(0, lastSpace).trimEnd()
  return slice.trimEnd()
}

function inBand(text: string): boolean {
  return text.length >= META_DESCRIPTION_MIN && text.length <= META_DESCRIPTION_MAX
}

function expandToMin(text: string, lang: Lang): string {
  let out = text
  for (const filler of MIN_FILLERS[lang]) {
    if (inBand(out)) return out
    if (out.length >= META_DESCRIPTION_MIN) return truncateAtWord(out, META_DESCRIPTION_MAX)
    out = `${out}${filler}`
  }
  return truncateAtWord(out, META_DESCRIPTION_MAX)
}

/**
 * Shape a summary blurb into a SERP-friendly meta description without changing
 * the visible page copy. Static marketing routes use dedicated *_meta_description
 * keys; dynamic legal, help, and editorial pages pass their one-line summaries
 * through here at the SEO registry boundary.
 */
export function formatMetaDescription(
  base: string,
  lang: Lang,
  suffix?: string,
): string {
  let text = normalize(base)
  if (inBand(text)) return text
  if (text.length > META_DESCRIPTION_MAX) return truncateAtWord(text, META_DESCRIPTION_MAX)

  const punctuated = text.endsWith('.') ? text : `${text}.`
  const pads = [suffix, DEFAULT_PAD[lang], lang === 'fr' ? ' — Dutiva.' : ' — Dutiva.'].filter(
    (pad): pad is string => pad != null && pad.length > 0,
  )

  for (const pad of pads) {
    const candidate = `${punctuated}${pad}`
    if (inBand(candidate)) return candidate
    if (candidate.length > META_DESCRIPTION_MAX) return truncateAtWord(candidate, META_DESCRIPTION_MAX)
  }

  return expandToMin(`${punctuated}${pads.at(-1) ?? DEFAULT_PAD[lang]}`, lang)
}
