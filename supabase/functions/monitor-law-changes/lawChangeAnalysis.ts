/**
 * lawChangeAnalysis — the AI read of a detected law change.
 *
 * `change_summary` / `raw_diff` carry the facts the detector observed;
 * the analysis columns carry a plain-language interpretation for a busy
 * HR lead. The model receives ONLY the detector's own facts — section
 * numbers, in-force dates, amending instruments, provision text excerpts —
 * and is told to never invent provisions. If the record is a metadata
 * refresh with no section-level signal, the analysis says so rather than
 * dressing up a corpus republish as an amendment.
 *
 * Output is strict JSON {"en": "…", "fr": "…"} so both locales ship from
 * one call. Pure functions — the fetch lives in index.ts.
 */

export interface LawAnalysis {
  en: string
  fr: string
}

export const LAW_ANALYSIS_MAX_CHARS = 1400

const SYSTEM_PROMPT =
  'You are an analyst for a Canadian law-change monitor. You are given the ' +
  'facts a deterministic detector recorded about one statute: provision ' +
  'numbers, in-force dates, amending instruments, and short text excerpts. ' +
  'Write a plain-language brief for a busy HR lead who is not a lawyer: ' +
  'what changed, what was added, removed, or amended, whether this looks ' +
  'like a substantive amendment or an administrative reissue, and one ' +
  'concrete next step (e.g. which policy or practice to review). ' +
  'Rules: use ONLY the supplied facts — never invent provisions, dates, ' +
  'effects, or employer obligations. If the facts cannot show the substance ' +
  'of the change, say exactly that. Do not claim a provision affects ' +
  'employers unless its text does. 3–6 sentences. ' +
  'Output ONLY strict JSON: {"en": "English brief", "fr": "the same brief ' +
  'in idiomatic Canadian French"}.'

/** Render the detector's facts into the user turn. `facts` is the
    assembled evidence block (section diffs, dates, excerpts). */
export function buildLawAnalysisMessages(
  lawName: string,
  jurisdiction: string,
  facts: string,
): { role: 'system' | 'user'; content: string }[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `Law: ${lawName} (${jurisdiction})\n` +
        'Facts recorded by the change detector:\n' +
        facts.slice(0, 6000) +
        '\n\nWrite the brief.',
    },
  ]
}

/**
 * Facts block for the maintenance backfill — rows written before section
 * evidence existed carry only change_summary + raw_diff, and the analysis
 * must be honest about that ("a corpus refresh was recorded; which
 * provisions moved is not in this record") rather than invent detail.
 */
export function buildBackfillFacts(row: {
  change_summary: string | null
  raw_diff: string | null
}): string {
  const parts: string[] = []
  if (row.change_summary) parts.push(`Detector summary: ${row.change_summary}`)
  if (row.raw_diff) parts.push(`Detail recorded:\n${row.raw_diff}`)
  return parts.join('\n\n')
}

/**
 * Parse the model's reply into both locales. Returns null on anything
 * unparseable or one-sided — a half-language analysis is worse than none,
 * since the card and the digest pick a field per locale.
 */
export function parseLawAnalysis(raw: string | null | undefined): LawAnalysis | null {
  if (!raw) return null
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as { en?: unknown; fr?: unknown }
    const en = typeof obj.en === 'string' ? obj.en.trim() : ''
    const fr = typeof obj.fr === 'string' ? obj.fr.trim() : ''
    if (!en || !fr) return null
    return {
      en: en.slice(0, LAW_ANALYSIS_MAX_CHARS),
      fr: fr.slice(0, LAW_ANALYSIS_MAX_CHARS),
    }
  } catch {
    return null
  }
}
