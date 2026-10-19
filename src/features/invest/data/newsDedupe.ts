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
  /\bprediction markets?\b|\btokenized stock\b|\bto usd live\b|live price,? marketcap|^current price of\b|\b[A-Z]{1,6}\d{6}[CP]\d{8}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s+[\d.]+\s+(?:call|put)\b|\bdepository receipts?\b|[–—]\s*[A-Z]{2,10}:[A-Z0-9]{1,15}\s*$/i

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
  source?: string
  symbol?: string
  publishedAt?: string | null
  viaTheme?: string | null
  /** Stored model-assigned kind (0241); the sync writes it, the title
      heuristic fills in when it's absent. */
  kind?: NewsKind | null
}

/* ── Headline kind — signal vs churn ────────────────────────────────────── */

export type NewsKind = 'event' | 'view' | 'move' | 'filing' | 'news'

/* What the headline IS, not whether it matters — a classifier can say
   'this is a price-move writeup' honestly where 'this is important'
   would be a judgment the data can't support.

   Precedence is deliberate: filing churn borrows analyst verbs
   ('Initiates Position'), analyst churn borrows event verbs ('Analyst
   Announces New Price Target'), so 'filing' then 'view' run first.
   'event' wins over 'move' — 'Stock Jumps on FDA Approval' reports an
   approval; the price framing doesn't erase the trigger. 'forecast:'
   reads as a prediction piece; a bare 'forecasts' verb ('Raises
   Guidance') still lands as the event it reports. */
const KIND_VIEW =
  /\banalyst|price target|rating|upgrad|downgrad|initiat|reiterat|maintain(?:s|ed|ing)?\b|overweight|underweight|outperform|underperform|\b(?:buy|sell|hold) rating|price prediction|stock prediction|price forecast|\bforecasts?\s*[:–—]|within reach|should you (?:buy|sell)|stocks? to (?:buy|watch)|top \d+ stocks?|best\b.{0,25}\bstocks?|is\b.{0,25}\ba (?:buy|sell)\b|\bbeginners?\b|\bbasics\b|\bexplained\b|what to (?:look|watch) for/i

/* Position-disclosure churn — 'Annex Advisory LLC Raises Holdings',
   'Z Trims Stake', 'Purchases 12,000 Shares'. A 13F-style restatement
   is a fact but not an event; it sinks to the bottom of the day and
   wears its own badge. Checked first: its verbs ('initiates',
   'acquires') collide with the analyst and event lists, but the
   stake/holdings/shares object is what marks it as a filing. */
const KIND_FILING =
  /\b(?:raises?|boosts?|lifts?|increases?|lowers?|cuts?|trims?|reduces?|decreases?|discloses?|initiates?|opens?|closes?|exits?|grows?|expands?|takes?)\s+(?:\S+\s){0,4}(?:stake|holdings?|positions?)\b|\b(?:buys?|sells?|purchases?|acquires?|raises?|boosts?|lowers?|cuts?|trims?|reduces?|increases?|initiates?|discloses?|exits?|closes?|opens?)\s+(?:\S+\s){0,3}shares?\s+(?:of|in)\b|\b(?:stake|holdings?|positions?)\b[^.]{0,25}\b(?:raised|boosted|increased|lowered|cut|trimmed|reduced|sold|bought|acquired|purchased|disclosed|initiated|opened|closed|exited)\b/i

const KIND_EVENT =
  /\bearnings|guidance|merger|acqui|takeover|buyout|\bipo\b|bankrupt|lawsuit|\bsues\b|\bsued\b|settlement|\bsec\b|\bfda\b|approv|recall|layoff|appoint|resign|\bce[foost]\b|launch|unveil|announce|contract|partnership|dividend|buyback|stock split|spin-?off|delist|halt(?:ed|s|suspension)?\b|sanction|export (?:controls?|ban|rules)|antitrust|investigat|verdict|fined|plead/i

const KIND_MOVE =
  /\bfell|falls|drops?|dropped|sinks?|sank|rises?|rose|jumps?|jumped|soars?|soared|plunges?|plunged|slides?|slid|slumps?|slumped|gains?|climbs?|climbed|rall(?:y|ies|ied)|surges?|surged|tumbles?|tumbled|rebounds?|rebounded|mov(?:es?|ed|ing)\b[^.]{0,15}(?:up|down|higher|lower)|(?:up|down)(?: by)? \d+(?:\.\d+)?%|moving (?:today|now)|(?:are|is|was|were) (?:up|down) \d|hits? (?:a )?(?:new )?(?:record|high|low|all-time)|sells? off|selloff|sell-off|trades? (?:up|down|lower|higher)/i

/** 'event' — something happened; 'view' — analyst note, rating, or
    opinion/listicle; 'move' — a writeup whose substance is the price
    itself; 'news' — everything else. */
export function newsKind(title: string): NewsKind {
  if (KIND_FILING.test(title)) return 'filing'
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
  filing: 4,
}

/* ── Source names ───────────────────────────────────────────────────────── */

/* Google News <source> names vary by edition and punctuation — 'Yahoo
   Finance' vs 'Yahoo! Finance Canada', curly vs straight apostrophes in
   'Barron's'. Normalizing to bare alphanumerics keeps mutes and the
   paywall list stable across those variants. */
export function normalizeSource(source: string): string {
  return source.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/* Membership test for normalized source sets: exact match, plus a
   longer source starting with a listed key ('Reuters Canada' follows
   'Reuters'; 'Yahoo! Finance Canada' follows a muted 'Yahoo Finance'). */
export function sourceInSet(keys: ReadonlySet<string>, source: string): boolean {
  const k = normalizeSource(source)
  if (keys.has(k)) return true
  for (const key of keys) if (key.length >= 3 && k.length > key.length && k.startsWith(key)) return true
  return false
}

/* The localStorage key both feed surfaces share for 'I'm subscribed —
   show subscription-only sources'. A device display pref, not account
   data. */
export const NEWS_PAYWALL_PREF = 'dutiva.news.showPaywalled'

/* ── Subscription-only sources ──────────────────────────────────────────── */

/* Publishers whose articles sit behind a hard paywall — as named in the
   Google News <source> tag, not domains. Deliberately excludes metered/
   partial walls (The Globe and Mail, Forbes, Morningstar): those serve
   free articles too, so hiding the whole source would over-remove. A
   subscribed user reveals them with the card's toggle; a source the
   user simply dislikes is covered by mutes. */
export const PAYWALL_SOURCES: ReadonlySet<string> = new Set([
  'Barron\'s',
  'Bloomberg',
  'Business Insider',
  'Financial Times',
  'Haaretz',
  'Harvard Business Review',
  'Investor\'s Business Daily',
  'MarketWatch',
  'Reuters',
  'Seeking Alpha',
  'The Athletic',
  'The Economist',
  'The Information',
  'The New York Times',
  'The Telegraph',
  'The Wall Street Journal',
  'WSJ',
])

const PAYWALL_KEYS: ReadonlySet<string> = new Set([...PAYWALL_SOURCES].map(normalizeSource))

/** Case/punctuation-insensitive hard-paywall test. */
export function isPaywalledSource(source: string): boolean {
  return sourceInSet(PAYWALL_KEYS, source)
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
    const keptRow = out[dup.idx] as NewsRow
    const keptPaywalled = isPaywalledSource(keptRow.source ?? '')
    const inPaywalled = isPaywalledSource(n.source ?? '')
    /* The accessible copy wins the merge: the row that survives is the
       one the paywall filter judges, so a paywalled founder must not
       swallow the free version of the same story. The free row inherits
       the twin's symbol/theme tag when it has none — same story, same
       association. */
    if (keptPaywalled && !inPaywalled) {
      if (sym === '' && dup.sym !== '') n.symbol = dup.sym
      if (!n.viaTheme && dup.theme) n.viaTheme = dup.theme
      if (!n.kind && keptRow.kind) n.kind = keptRow.kind
      out[dup.idx] = n
      dup.sym = ((n.symbol ?? '') as string).toUpperCase() || dup.sym
      dup.theme = theme ?? dup.theme
      continue
    }
    if (!keptPaywalled && inPaywalled) {
      /* The paywalled twin loses — but its tag describes the same story,
         so it donates symbol/theme to the kept row before merging away. */
      if (!keptRow.symbol && sym !== '') keptRow.symbol = sym
      if (!keptRow.viaTheme && n.viaTheme) keptRow.viaTheme = n.viaTheme
      if (!keptRow.kind && n.kind) keptRow.kind = n.kind
      if (sym !== '') dup.sym = sym
      dup.theme = theme ?? dup.theme
      continue
    }
    /* Same story under a symbol tag beats the unscoped copy — the tag
       is information. Across same-theme tag copies, a book symbol beats
       a board-only link. */
    const betterTag =
      sym !== '' &&
      (dup.sym === '' || (preferSymbols ? preferSymbols.has(sym) && !preferSymbols.has(dup.sym) : false))
    if (betterTag) {
      if (!n.kind && keptRow.kind) n.kind = keptRow.kind
      out[dup.idx] = n
      dup.sym = sym
      dup.theme = theme ?? dup.theme
    } else {
      /* The classified copy merged away — carry its kind so the kept
         row doesn't fall back to the title heuristic. */
      if (!keptRow.kind && n.kind) keptRow.kind = n.kind
    }
  }
  return out
}
