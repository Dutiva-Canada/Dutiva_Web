import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Newspaper,
  RotateCcw,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { AssetClass } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { muteNewsSource, unmuteNewsSource } from '@/features/invest/data/api'
import {
  dedupeNews,
  isPaywalledSource,
  NEWS_KIND_ORDER,
  newsKind,
  normalizeSource,
  sourceInSet,
  type NewsKind,
} from '@/features/invest/data/newsDedupe'
import { NewsPaywallChip } from './NewsPaywallChip'
import { usePaywalledPref } from './newsPrefs'
import { relTimeLabel } from './relTime'
import { ASSET_LABEL, fmtDay } from './strategyUi'

const KIND_LABEL: Record<NewsKind, keyof typeof IM | null> = {
  event: 'invest_news_kind_event',
  view: 'invest_news_kind_view',
  move: 'invest_news_kind_move',
  filing: 'invest_news_kind_filing',
  news: null,
}

/* Ellipsis mid-word reads as a glitch — cut at the last space instead. */
function ellipsize(s: string, max = 44): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > 0 ? cut.slice(0, sp) : cut).trimEnd()}…`
}

/* The sync's model pass stores kind on the row (0241); rows it missed
   fall back to the title heuristic — same four labels either way. */
const kindOf = (n: { title: string; kind: NewsKind | null }): NewsKind => n.kind ?? newsKind(n.title)

/* The feed retains 30 days; the card windows it. */
const NEWS_RANGE_MS = { '7d': 7 * 86_400_000, '14d': 14 * 86_400_000, '30d': 30 * 86_400_000 } as const

// Publisher-badge tints — token pairs only, hashed by source name.
const SOURCE_TINTS = [
  'bg-accent-soft text-accent',
  'bg-gold-bg text-gold-fg',
  'bg-ok-bg text-ok-fg',
  'bg-inset text-text-2',
]

function sourceTint(source: string): string {
  let h = 0
  for (const c of source) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return SOURCE_TINTS[h % SOURCE_TINTS.length] ?? 'bg-inset text-text-2'
}

/* Dedupe + junk filtering live in data/newsDedupe — same-event stories
   from different outlets cluster on token overlap, and listing pages
   (options chains, tokenized stocks) never render as headlines. */

/**
 * Market-headlines card — third-party headlines verbatim, organized by
 * window (7d/2w/30d), facet chips (book / ticker / class / theme /
 * general market), and publish-day groups. Per-source mutes hide a
 * publisher everywhere the feed surfaces; the muted row keeps what's
 * hidden visible and restorable.
 */
export function NewsFeedCard() {
  const { x, lang } = useI18n()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()
  const [newsExpanded, setNewsExpanded] = useState(false)
  /* 'book' shows only headlines tagged to a held or watched symbol —
     the news-for-your-book cut. */
  /* Facet keys: 'all' | 'book' | 'general' | 'sym:AMD' | 'cls:crypto' |
     'theme:<watch-item title>'. The range axis is separate — the feed
     retains 30 days, windowed to 7d by default. */
  const [newsFilter, setNewsFilter] = useState<string>('all')
  const [newsRange, setNewsRange] = useState<'7d' | '14d' | '30d'>('7d')
  /* Source name of the in-flight mute write — disables both controls so
     a second click can't queue a competing mutation. */
  const [muting, setMuting] = useState<string | null>(null)
  /* Subscription-only sources are hidden by default — a headline you
     can't open is noise. The toggle is a device pref shared with the
     Analysis board: 'I'm subscribed somewhere' is a display choice. */
  const [showPaywalled, togglePaywalled] = usePaywalledPref()

  /* Held ∪ watched — 'Your book' means symbols the user actually owns or
     tracks, never a symbol a theme feed happened to link. The same
     set prefers the surviving tag when one theme story carries several
     linkage copies. */
  const bookSymbols = useMemo(() => {
    const s = new Set<string>()
    for (const p of state.positions) s.add(p.symbol.toUpperCase())
    for (const w of state.watchlist) s.add(w.symbol.toUpperCase())
    return s
  }, [state.positions, state.watchlist])

  /* Muted publishers drop out after dedupe — facets, counts, and day
     groups all describe what the user actually sees. Source names
     normalize before comparing so edition/casing variants ('Reuters',
     'Reuters Canada') follow the same mute. */
  const muted = useMemo(
    () => new Set(state.newsMutes.map(normalizeSource)),
    [state.newsMutes],
  )
  /* The full unmuted set — the paywall chip counts against this so its
     number is what 'show' would actually reveal in the current scope. */
  const allDeduped = useMemo(
    () =>
      dedupeNews(state.news, { preferSymbols: bookSymbols }).filter(
        (n) => !sourceInSet(muted, n.source),
      ),
    [state.news, bookSymbols, muted],
  )
  const headlines = useMemo(
    () =>
      showPaywalled
        ? allDeduped
        : allDeduped.filter((n) => !isPaywalledSource(n.source)),
    [allDeduped, showPaywalled],
  )
  /* Range narrows first — facets and 'Your book' describe the windowed
     set, so a chip reflects what selecting it would actually show. A
     quiet window still shows what's on file rather than blank the list
     because the freshest headline happens to predate the range — and
     says so, so a pressed '7 days' chip can't quietly show older news. */
  const rangeOf = useCallback(
    (rows: typeof headlines) => {
      const cutoff = Date.now() - NEWS_RANGE_MS[newsRange]
      const r = rows.filter(
        (n) => n.publishedAt !== null && Date.parse(n.publishedAt) >= cutoff,
      )
      return { rows: r.length > 0 ? r : rows, fellBack: r.length === 0 && rows.length > 0 }
    },
    [newsRange],
  )
  const ranged = useMemo(() => rangeOf(headlines), [headlines, rangeOf])
  const rangedHeadlines = ranged.rows
  const rangedAll = useMemo(() => rangeOf(allDeduped).rows, [allDeduped, rangeOf])
  const bookHeadlines = useMemo(
    () => rangedHeadlines.filter((n) => bookSymbols.has(n.symbol.toUpperCase())),
    [rangedHeadlines, bookSymbols],
  )
  /* Facet chips derive from what the feed actually carries — a facet
     never appears for an empty result. Symbols sort book-first, then
     alphabetically; a class chip exists only when it splits the feed
     (an all-equity list gains nothing from an 'Equity' chip); 'General'
     is skipped when it would equal 'All'. */
  const newsFacets = useMemo(() => {
    const syms = new Set<string>()
    const themes = new Set<string>()
    const classes = new Set<string>()
    let general = false
    for (const n of rangedHeadlines) {
      if (n.symbol === '') general = true
      else syms.add(n.symbol.toUpperCase())
      if (n.viaTheme) themes.add(n.viaTheme)
      if (n.assetClass) classes.add(n.assetClass)
    }
    return {
      book: bookHeadlines.length > 0 && bookHeadlines.length !== rangedHeadlines.length,
      symbols: [...syms].sort(
        (a, b) => Number(bookSymbols.has(b)) - Number(bookSymbols.has(a)) || a.localeCompare(b),
      ),
      themes: [...themes].sort((a, b) => a.localeCompare(b)),
      classes: classes.size > 1 ? [...classes].sort() : [],
      general: general && syms.size > 0,
    }
  }, [rangedHeadlines, bookHeadlines, bookSymbols])
  /* One predicate for the active facet — the visible list and the
     paywall-hidden count both run through it, so the chip's number is
     exactly what 'show' adds under the pressed facet. */
  const matchesFacet = useCallback(
    (n: (typeof rangedHeadlines)[number]): boolean =>
      newsFilter === 'all'
        ? true
        : newsFilter === 'book'
          ? bookSymbols.has(n.symbol.toUpperCase())
          : newsFilter === 'general'
            ? n.symbol === ''
            : newsFilter.startsWith('sym:')
              ? n.symbol.toUpperCase() === newsFilter.slice(4)
              : newsFilter.startsWith('theme:')
                ? n.viaTheme === newsFilter.slice(6)
                : n.assetClass === newsFilter.slice(4),
    [newsFilter, bookSymbols],
  )
  const scopedHeadlines = useMemo(() => {
    const rows = rangedHeadlines.filter(matchesFacet)
    /* A facet can outlive its rows (a refresh clears them) — fall back
       to 'all' rather than blank the list. */
    return rows.length > 0 ? rows : rangedHeadlines
  }, [rangedHeadlines, matchesFacet])
  /* How many subscription-only rows the same scope hides — counted in
     the ranged+faceted set, not the whole 30-day corpus, so 'show'
     reveals exactly what the chip counted. Sources are named on the
     chip's tooltip: hidden is never anonymous. */
  const paywalledHidden = useMemo(() => {
    if (showPaywalled) return { count: 0, sources: [] as string[] }
    const hidden = rangedAll.filter(
      (n) => isPaywalledSource(n.source) && matchesFacet(n),
    )
    return {
      count: hidden.length,
      sources: [...new Set(hidden.map((n) => n.source))].sort(),
    }
  }, [rangedAll, showPaywalled, matchesFacet])

  /* ...but a pressed chip must never be invisible — when the selected
     facet leaves the feed, reset to 'all' so what you see is what the
     control shows. */
  useEffect(() => {
    if (newsFilter === 'all') return
    const valid =
      (newsFilter === 'book' && newsFacets.book) ||
      (newsFilter === 'general' && newsFacets.general) ||
      (newsFilter.startsWith('sym:') && newsFacets.symbols.includes(newsFilter.slice(4))) ||
      (newsFilter.startsWith('theme:') && newsFacets.themes.includes(newsFilter.slice(6))) ||
      (newsFilter.startsWith('cls:') && newsFacets.classes.includes(newsFilter.slice(4)))
    if (!valid) setNewsFilter('all')
  }, [newsFilter, newsFacets])
  const visibleHeadlines = newsExpanded ? scopedHeadlines : scopedHeadlines.slice(0, 12)

  /* Chunk the flat feed by publish day — 'Today' / 'Yesterday' / a date.
     Rows arrive newest-first, so same-day rows are already consecutive
     and a single pass groups them; undated rows settle last. */
  const groupedHeadlines = useMemo(() => {
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const now = new Date()
    const todayKey = dayKey(now)
    const yesterdayKey = dayKey(new Date(now.getTime() - 86_400_000))
    const groups: { key: string; label: string; items: typeof visibleHeadlines }[] = []
    for (const n of visibleHeadlines) {
      const key = n.publishedAt ? dayKey(new Date(n.publishedAt)) : 'undated'
      const label = !n.publishedAt
        ? x(IM.invest_news_undated)
        : key === todayKey
          ? x(IM.invest_news_today)
          : key === yesterdayKey
            ? x(IM.invest_news_yesterday)
            : fmtDay(lang, key)
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.items.push(n)
      else groups.push({ key, label, items: [n] })
    }
    /* Within a day, kind order before recency — 'something happened'
     * outranks an analyst note or a price-move writeup. Stable sort:
     * items arrive newest-first and keep it inside a kind. */
    for (const g of groups) {
      g.items.sort((a, b) => NEWS_KIND_ORDER[kindOf(a)] - NEWS_KIND_ORDER[kindOf(b)])
    }
    return groups
  }, [visibleHeadlines, lang, x])

  const setMute = async (source: string, hide: boolean) => {
    if (muting !== null) return
    setMuting(source)
    try {
      await (hide ? muteNewsSource(source) : unmuteNewsSource(source))
      await refresh()
    } catch {
      showToast(IM.invest_news_mute_failed)
    } finally {
      setMuting(null)
    }
  }

  return (
    <section className="sb-card sb-card-pad" style={{ marginTop: 16 }}>
      {/* Third-party headlines, verbatim — label them as such so a publisher's
          headline never reads as a Dutiva recommendation. */}
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h2 className="m-0 flex items-center gap-[8px]">
            <span
              aria-hidden="true"
              className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-accent-soft text-accent"
            >
              <Newspaper size={13} strokeWidth={2} />
            </span>
            {x(IM.invest_news_title)}
          </h2>
          <p className="m-0 ml-[32px] mt-[2px] text-[12px] leading-normal text-text-muted">
            {x(IM.invest_news_note)}
          </p>
        </div>
        <div className="mt-[3px] flex shrink-0 items-center gap-[8px]">
          {headlines.length > 0 && (
          <div
            className="sb-seg sb-seg-sm"
            role="group"
            aria-label={x(IM.invest_news_range_aria)}
          >
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={newsRange === r}
                onClick={() => setNewsRange(r)}
              >
                {x(IM[`invest_news_range_${r}`])}
              </button>
            ))}
          </div>
          )}
          {scopedHeadlines.length > 12 && (
            <span className="shrink-0 rounded-full bg-inset px-[9px] py-[3px] text-[11px] font-medium tabular-nums text-text-muted">
              {x(IM.invest_news_count).replace('{count}', String(scopedHeadlines.length))}
            </span>
          )}
        </div>
      </div>
      {state.news.length === 0 ? (
        <p className="sb-empty">{x(IM.invest_news_empty)}</p>
      ) : (
        <>
        <div
          className="sb-pills sb-pills-sm mt-[12px]"
          role="group"
          aria-label={x(IM.invest_news_filter_aria)}
        >
          <button
            type="button"
            aria-pressed={newsFilter === 'all'}
            onClick={() => setNewsFilter('all')}
          >
            {x(IM.invest_news_all)}
          </button>
          {newsFacets.book && (
            <button
              type="button"
              aria-pressed={newsFilter === 'book'}
              onClick={() => setNewsFilter('book')}
            >
              {x(IM.invest_news_book)}
            </button>
          )}
          {/* Each facet group is an atomic flex-wrap block — a chip
              group never splits across the wrap ('Crypto' can't end a
              row while 'Equity' opens the next). */}
          <span className="flex flex-wrap items-center gap-[6px]">
            {newsFacets.symbols.map((s) => (
              <button
                key={`sym:${s}`}
                type="button"
                aria-pressed={newsFilter === `sym:${s}`}
                onClick={() => setNewsFilter(`sym:${s}`)}
              >
                {s}
              </button>
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-[6px]">
            {newsFacets.classes.map((c) => (
              <button
                key={`cls:${c}`}
                type="button"
                aria-pressed={newsFilter === `cls:${c}`}
                onClick={() => setNewsFilter(`cls:${c}`)}
              >
                {c in ASSET_LABEL ? x(IM[ASSET_LABEL[c as AssetClass]]) : c}
              </button>
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-[6px]">
            {newsFacets.themes.map((t) => (
              <button
                key={`theme:${t}`}
                type="button"
                title={t}
                aria-pressed={newsFilter === `theme:${t}`}
                onClick={() => setNewsFilter(`theme:${t}`)}
              >
                {ellipsize(t)}
              </button>
            ))}
          </span>
          {newsFacets.general && (
            <button
              type="button"
              aria-pressed={newsFilter === 'general'}
              onClick={() => setNewsFilter('general')}
            >
              {x(IM.invest_news_general)}
            </button>
          )}
        </div>
        {/* Hidden publishers stay visible here — a mute is a preference,
            not a deletion, so the list of what's muted is always shown. */}
        {state.newsMutes.length > 0 && (
          <div className="mt-[8px] flex flex-wrap items-center gap-[6px]">
            <span className="text-[11px] font-medium text-text-muted">
              {x(IM.invest_news_muted)}
            </span>
            {state.newsMutes.map((s) => (
              <button
                key={s}
                type="button"
                disabled={muting !== null}
                title={x(IM.invest_news_unmute).replace('{source}', s)}
                aria-label={x(IM.invest_news_unmute).replace('{source}', s)}
                onClick={() => void setMute(s, false)}
                className="flex cursor-pointer items-center gap-[4px] rounded-full border border-border bg-inset px-[8px] py-[3px] text-[11px] font-medium text-text-2 transition-colors hover:border-border-strong hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-60"
              >
                <RotateCcw size={10} aria-hidden="true" />
                {s}
              </button>
            ))}
          </div>
        )}
        {/* Same rule as mutes: what's hidden by default stays named and
            one tap reveals it — for the user who is subscribed. */}
        <NewsPaywallChip
          hiddenCount={paywalledHidden.count}
          hiddenSources={paywalledHidden.sources}
          showPaywalled={showPaywalled}
          onToggle={togglePaywalled}
        />
        {ranged.fellBack && (
          <p className="m-0 mt-[8px] text-[11.5px] text-text-muted">
            {x(IM.invest_news_range_fallback)}
          </p>
        )}
        {groupedHeadlines.length === 0 && allDeduped.length > 0 && (
          <p className="m-0 mt-[10px] text-[12.5px] text-text-muted">
            {x(IM.invest_news_all_filtered)}
          </p>
        )}
        {groupedHeadlines.map((g, gi) => (
          <section key={g.key} className={gi === 0 ? 'mt-[14px]' : 'mt-[20px]'}>
            <h3 className="m-0 mb-[8px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
              {g.label}
            </h3>
            <ul className="m-0 grid list-none grid-cols-1 gap-[8px] p-0 min-[980px]:grid-cols-2">
              {g.items.map((n, i) => {
                const featured = gi === 0 && i === 0
                const kind = kindOf(n)
                const kindKey = KIND_LABEL[kind]
                return (
            <li key={n.id} className={featured ? 'relative min-[980px]:col-span-2' : 'relative'}>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-full items-center gap-[11px] rounded-[12px] border border-border bg-surface no-underline transition-all hover:border-border-strong hover:bg-inset hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${featured ? 'p-[13px]' : 'p-[11px]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex shrink-0 items-center justify-center rounded-[10px] font-bold uppercase ${featured ? 'h-[34px] w-[34px] text-[13px]' : 'h-[30px] w-[30px] text-[11.5px]'} ${sourceTint(n.source)}`}
                >
                  {(n.source || '?').trim().charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`line-clamp-2 block font-semibold leading-snug text-text underline decoration-transparent underline-offset-2 transition-[text-decoration-color] group-hover:decoration-accent ${featured ? 'text-[14px]' : 'text-[13px]'}`}>
                    {n.title}
                  </span>
                  <span className="mt-[5px] flex items-center gap-[6px] pr-[24px] text-[11.5px] text-text-muted">
                    <span className="truncate">{n.source}</span>
                    {n.publishedAt && relTimeLabel(n.publishedAt, x) !== null && (
                      <span className="shrink-0 text-text-3">{relTimeLabel(n.publishedAt, x)}</span>
                    )}
                    {kindKey !== null && (
                      <span className={`shrink-0 rounded-[6px] px-[6px] py-px text-[10px] font-semibold uppercase tracking-[0.04em] ${kind === 'event' ? 'bg-ok-bg text-ok-fg' : 'bg-inset text-text-3'}`}>
                        {x(IM[kindKey])}
                      </span>
                    )}
                    {n.symbol && (
                      <span className="shrink-0 rounded-[6px] bg-accent-soft px-[6px] py-px text-[10px] font-semibold uppercase tracking-[0.04em] text-accent">
                        {n.symbol}
                      </span>
                    )}
                    {n.viaTheme && (
                      <span
                        className="max-w-[180px] shrink-0 truncate rounded-[6px] bg-inset px-[6px] py-px text-[10px] font-medium text-text-3"
                        title={n.viaTheme}
                      >
                        {x(IM.invest_news_via).replace('{theme}', n.viaTheme)}
                      </span>
                    )}
                  </span>
                </span>
                <ArrowUpRight
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="mt-[3px] shrink-0 self-start text-text-3 transition-transform duration-150 group-hover:-translate-y-[1px] group-hover:translate-x-[1px] group-hover:text-accent"
                />
                <span className="sr-only">{x(IM.invest_news_external)}</span>
              </a>
              {/* The mute control can't live inside the anchor — it
                  overlays the card's bottom-right padding instead. */}
              {n.source !== '' && (
                <button
                  type="button"
                  disabled={muting !== null}
                  title={x(IM.invest_news_mute).replace('{source}', n.source)}
                  aria-label={x(IM.invest_news_mute).replace('{source}', n.source)}
                  onClick={() => void setMute(n.source, true)}
                  className="absolute bottom-[6px] right-[8px] flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-3 opacity-60 transition hover:bg-inset hover:text-text hover:opacity-100 focus-visible:outline-2 focus-visible:outline-accent focus-visible:opacity-100 disabled:cursor-default disabled:opacity-40"
                >
                  <EyeOff size={11} aria-hidden="true" />
                </button>
              )}
            </li>
                )
              })}
            </ul>
          </section>
        ))}
        {/* Gate and count both read the scoped list — under 'Your book'
            the button must promise only what the filter can reveal. */}
        {scopedHeadlines.length > 12 && (
          <button
            type="button"
            onClick={() => setNewsExpanded((v) => !v)}
            className="mx-auto mt-[12px] flex min-h-[34px] w-auto cursor-pointer items-center justify-center gap-[6px] rounded-full border border-border bg-transparent px-[18px] text-[12.5px] font-semibold text-text-2 transition-colors hover:border-border-strong hover:bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {newsExpanded
              ? x(IM.invest_news_less)
              : x(IM.invest_news_more).replace('{count}', String(scopedHeadlines.length))}
            {newsExpanded ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>
        )}
        </>
      )}
    </section>
  )
}
