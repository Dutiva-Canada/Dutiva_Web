/* Headline dedupe for the invest portal.
 *
 * Exact-title equality can't see that "AMD Stock Falls 6% — Here's Why"
 * and "AMD Stock Down 6.0% but Still Overvalued" are the same event —
 * every outlet rewrites the wire. So rows cluster on content-token
 * overlap (Jaccard ≥ 0.35) within the same publish-day, matched on the
 * symbol tag or shared theme provenance. Two different stories about the
 * same stock on the same day rarely share half their content words;
 * the same wire story from two outlets nearly always does.
 *
 * Junk patterns — betting boards, options-chain listings, tokenized-
 * stock quote pages — are filtered at ingest AND hidden here for rows
 * already stored. Keep JUNK_HEADLINE in sync with the copy in
 * supabase/functions/invest-market-sync/handlers.ts. */

export const JUNK_HEADLINE =
  /\bprediction markets?\b|\btokenized stock\b|\bto usd live\b|live price,? marketcap|\b[A-Z]{1,6}\d{6}[CP]\d{8}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s+[\d.]+\s+(?:call|put)\b/i

/* Headline boilerplate — these words inflate overlap between unrelated
   stories ("Stock Falls…Should You Sell?" churn shares a template), so
   they don't count toward 'same event'. */
const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'on', 'in', 'to', 'is', 'it', 'at',
  'as', 'by', 'be', 'do', 'so', 'if', 'up', 'out', 'off', 'per', 'via',
  'vs', 'for', 'with', 'from', 'this', 'that', 'says', 'after', 'over',
  'amid', 'into', 'what', 'why', 'how', 'than', 'then', 'more', 'most',
  'should', 'could', 'would', 'about', 'here', 'you', 'your', 'now',
  'new', 'its', 'are', 'was', 'were', 'has', 'have', 'had', 'not', 'but',
  'all', 'can', 'will', 'just', 'may', 'say', 'saw', 'got', 'gets',
  'stock', 'stocks', 'share', 'shares', 'investor', 'investors', 'today',
  'market', 'markets', 'inc', 'plc', 'corp', 'ltd', 'nasdaq', 'nyse',
])

function fingerprint(title: string): Set<string> {
  const out = new Set<string>()
  for (const t of title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)) {
    /* Pure numbers (percents, scores, prices) reword differently across
       outlets and only dilute the overlap — '6%' vs '6.0%' shouldn't
       keep a rewrite apart. */
    if (t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t)) out.add(t)
  }
  return out
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

interface NewsRow {
  title: string
  symbol?: string
  publishedAt?: string | null
  viaTheme?: string | null
}

/**
 * Newest-first in, deduped out. `symbolAware` (default) only merges rows
 * that share a symbol tag or where one side is unscoped — pass false for
 * a surface already grouped by theme (the scan cards), where the symbol
 * tag is incidental. Rows claiming the same `viaTheme` merge across
 * symbols regardless: a theme tag is a linkage claim, not a mention —
 * "US-China Trade War Escalates" tagged AMAT/AMD/ARM is one story, not
 * three. `preferSymbols` decides which tag survives that merge (the
 * book's own symbols beat board-only links).
 */
export function dedupeNews<T extends NewsRow>(
  items: T[],
  { symbolAware = true, preferSymbols }: { symbolAware?: boolean; preferSymbols?: Set<string> } = {},
): T[] {
  const kept: { idx: number; fp: Set<string>; sym: string; day: string; theme: string | null }[] = []
  const out: T[] = []
  for (const n of items) {
    if (JUNK_HEADLINE.test(n.title)) continue
    const fp = fingerprint(n.title)
    const day = (n.publishedAt ?? '').slice(0, 10)
    const sym = (n.symbol ?? '').toUpperCase()
    const theme = n.viaTheme ?? null
    const dup =
      fp.size > 0
        ? kept.find(
            (k) =>
              k.day === day &&
              (!symbolAware ||
                k.sym === sym ||
                k.sym === '' ||
                sym === '' ||
                (theme !== null && theme === k.theme)) &&
              jaccard(fp, k.fp) >= 0.35,
          )
        : undefined
    if (!dup) {
      kept.push({ idx: out.length, fp, sym, day, theme })
      out.push(n)
      continue
    }
    /* Same story under a symbol tag beats the unscoped copy — the tag
       is information. Across same-theme tag copies, a book symbol beats
       a board-only link. */
    const betterTag =
      sym !== '' &&
      (dup.sym === '' || (preferSymbols ? preferSymbols.has(sym) && !preferSymbols.has(dup.sym) : false))
    if (betterTag) {
      out[dup.idx] = n
      dup.sym = sym
      dup.theme = theme ?? dup.theme
    }
  }
  return out
}
