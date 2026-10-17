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
  /\bprediction markets?\b|\btokenized stock\b|\bto usd live\b|live price,? marketcap|^current price of\b|\b[A-Z]{1,6}\d{6}[CP]\d{8}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s+[\d.]+\s+(?:call|put)\b/i

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

function intersects(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const t of a) if (b.has(t)) n++
  return n
}

interface NewsRow {
  title: string
  symbol?: string
  publishedAt?: string | null
  viaTheme?: string | null
  /** Stored model-assigned kind (0241); the sync writes it, the title
      heuristic fills in when it's absent. */
  kind?: NewsKind | null
}

/* ── Headline kind — signal vs churn ────────────────────────────────────── */

export type NewsKind = 'event' | 'view' | 'move' | 'news'

/* What the headline IS, not whether it matters — a classifier can say
   'this is a price-move writeup' honestly where 'this is important'
   would be a judgment the data can't support.

   Precedence is deliberate: analyst churn borrows event verbs ('Analyst
   Announces New Price Target'), so 'view' is checked first. 'event'
   then wins over 'move' — 'Stock Jumps on FDA Approval' reports an
   approval; the price framing doesn't erase the trigger. Bare 'forecast'
   stays out of the view list: 'Raises Guidance' is an event, not a
   note. */
const KIND_VIEW =
  /\banalyst|price target|rating|upgrad|downgrad|initiat|reiterat|maintain(?:s|ed|ing)?\b|overweight|underweight|outperform|underperform|\b(?:buy|sell|hold) rating|price prediction|stock prediction|should you (?:buy|sell)|stocks? to (?:buy|watch)|top \d+ stocks?|best\b.{0,25}\bstocks?|is\b.{0,25}\ba (?:buy|sell)\b/i

const KIND_EVENT =
  /\bearnings|guidance|merger|acqui|takeover|buyout|\bipo\b|bankrupt|lawsuit|\bsues\b|\bsued\b|settlement|\bsec\b|\bfda\b|approv|recall|layoff|appoint|resign|\bce[foost]\b|launch|unveil|announce|contract|partnership|dividend|buyback|stock split|spin-?off|delist|halt(?:ed|s|suspension)?\b|sanction|export (?:controls?|ban|rules)|antitrust|investigat|verdict|fined|plead/i

const KIND_MOVE =
  /\bfell|falls|drops?|dropped|sinks?|sank|rises?|rose|jumps?|jumped|soars?|soared|plunges?|plunged|slides?|slid|slumps?|slumped|gains?|climbs?|climbed|rall(?:y|ies|ied)|surges?|surged|tumbles?|tumbled|rebounds?|rebounded|mov(?:es?|ed|ing)\b[^.]{0,15}(?:up|down|higher|lower)|(?:up|down)(?: by)? \d+(?:\.\d+)?%|moving (?:today|now)|(?:are|is|was|were) (?:up|down) \d|hits? (?:a )?(?:new )?(?:record|high|low|all-time)|sells? off|selloff|sell-off|trades? (?:up|down|lower|higher)/i

/** 'event' — something happened; 'view' — analyst note, rating, or
    opinion/listicle; 'move' — a writeup whose substance is the price
    itself; 'news' — everything else. */
export function newsKind(title: string): NewsKind {
  if (KIND_VIEW.test(title)) return 'view'
  if (KIND_EVENT.test(title)) return 'event'
  if (KIND_MOVE.test(title)) return 'move'
  return 'news'
}

/* Within a publish-day, order by kind then recency: events and news
   first, analyst notes, price-move writeups last. Stable — rows arrive
   newest-first, so equal kinds keep that order. */
export const NEWS_KIND_ORDER: Record<NewsKind, number> = {
  event: 0,
  news: 1,
  view: 2,
  move: 3,
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
    /* Clusters anchor on their founder's fingerprint (kept.fp never
       mutates), so membership is 'resembles the founder' — no transitive
       chaining. But a short founder is permissive: one shared token
       ('amd') shouldn't prove same-story, so a merge also needs ≥2
       overlapping content tokens. */
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
              intersects(fp, k.fp) >= 2 &&
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
    } else {
      /* The classified copy merged away — carry its kind so the kept
         row doesn't fall back to the title heuristic. */
      const keptRow = out[dup.idx] as NewsRow | undefined
      if (keptRow && !keptRow.kind && n.kind) keptRow.kind = n.kind
    }
  }
  return out
}
