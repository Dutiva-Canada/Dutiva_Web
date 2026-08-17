/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * Converts the human-readable dates displayed in policy documents
 * ("June 1, 2026" / "1er juin 2026") to ISO 8601 for JSON-LD and the
 * sitemap. Returns undefined for anything unparseable — metadata simply
 * omits the date rather than guessing. These dates come from the content
 * files themselves, so they only change when the documents change.
 */

const FR_MONTHS: Record<string, number> = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
}

const pad = (n: number) => String(n).padStart(2, '0')

export function parseDisplayDate(value: string | undefined): string | undefined {
  if (!value) return undefined

  // French-Canadian form: "1er juin 2026" / "15 décembre 2025".
  const fr = /^(\d{1,2})(?:er)?\s+([a-zA-Zà-ÿÀ-Ÿ]+)\s+(\d{4})$/.exec(value.trim())
  if (fr) {
    const month = FR_MONTHS[fr[2]!.toLowerCase()]
    if (month) return `${fr[3]}-${pad(month)}-${pad(Number(fr[1]))}`
    return undefined
  }

  // English form: "June 1, 2026" (Date.parse handles it consistently).
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
}
