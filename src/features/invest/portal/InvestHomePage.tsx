import './strategies.css'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, ChevronUp, Info, Loader2, Newspaper, RefreshCw, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { ASSET_CLASSES, type AssetClass } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { syncPrices } from '@/features/invest/data/api'
import { convertFx, loadFxRates, type FxTable } from '@/features/invest/data/fx'
import { useInvestHead } from './useInvestHead'
import { InvestOnboarding } from './InvestOnboarding'
import { MorningBrief } from './MorningBrief'
import { readDisplayCurrency } from './investPrefs'
import { fmtDay, fmtNum, fmtPct, pl, tallyNoticed } from './strategyUi'

const assetLabel: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const cardClass = 'sb-card sb-card-pad'

/* recharts (~420kB with its d3 tree) must stay an on-demand chunk — the
   same rule as components/advisor/ChatChart.tsx. The curve mounts once
   when the overview first renders. */
const BookCurve = lazy(() =>
  import('./BookCurve').then((m) => ({ default: m.BookCurve })),
)

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

// The same wire story often lands from several publishers — keep the first.
// Betting-market listings aren't headlines; the ingest filter keeps new
// ones out, this one hides rows already in the table. Keep in sync with
// JUNK_HEADLINE in supabase/functions/invest-market-sync/handlers.ts.
const JUNK_HEADLINE = /\bprediction markets?\b/i
function dedupeNews<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((n) => {
    if (JUNK_HEADLINE.test(n.title)) return false
    const key = n.title.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Overview tab — book value, cash, open signals, last bot run, allocation. */
export function InvestHomePage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_overview, IM.invest_seo_desc_overview)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [syncNote, setSyncNote] = useState<string | undefined>()
  const [newsExpanded, setNewsExpanded] = useState(false)
  /* 'book' shows only headlines tagged to a held or watched symbol —
     the news-for-your-book cut. */
  const [newsFilter, setNewsFilter] = useState<'all' | 'book'>('all')
  /* ECB reference rates, loaded once — null means 'no rate on file', and
     cross-currency amounts drop out of the totals with a note below
     rather than sum into a wrong number. */
  const [fx, setFx] = useState<FxTable | null>(null)
  useEffect(() => {
    let live = true
    let retry: ReturnType<typeof setTimeout> | undefined
    void loadFxRates().then((t) => {
      if (!live) return
      setFx(t)
      /* A blocked/down feed misses once — one retry covers the transient
         case without polling a host that may be unreachable all session. */
      if (!t) {
        retry = setTimeout(
          () => void loadFxRates().then((t2) => live && setFx(t2)),
          4_000,
        )
      }
    })
    return () => {
      live = false
      if (retry) clearTimeout(retry)
    }
  }, [])
  /* Headline figures are denominated in the display-currency preference,
     falling back to the primary account's base currency. */
  const homeCur = readDisplayCurrency() || state.accounts[0]?.baseCurrency || 'CAD'
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: homeCur,
      }),
    [lang, homeCur],
  )
  /* Per-currency formatters for the no-FX fallback — each line is honest
     native money, never converted. `code` display names the currency
     ('CAD 5,614.51') so a bare '$' can't be misread next to a USD line. */
  const fmtFor = (cur: string) =>
    new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: cur,
      currencyDisplay: 'code',
    })

  const book = useMemo(() => {
    let used = false
    let missed = 0
    const missedCurs = new Set<string>()
    const pairs = new Set<string>()
    const conv = (n: number, from: string): number | null => {
      if (from === homeCur) return n
      const c = convertFx(n, from, homeCur, fx)
      if (c === null) {
        missed++
        missedCurs.add(from)
        return null
      }
      used = true
      pairs.add(`${from}→${homeCur}`)
      return c
    }
    /* Priced positions count at market; unpriced ones fall back to book
       value (cost) so the headline doesn't read zero while quotes load.
       The table is stricter — there an unpriced row shows '—'. */
    const valueOf = (p: (typeof state.positions)[number]): number | null => {
      const snap = state.snapshots.find(
        (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
      )
      const pxNative = snap?.price ?? p.lastPrice
      if (pxNative !== null) {
        const px = conv(pxNative, snap?.currency ?? (p.currency || 'CAD'))
        return px === null ? null : px * p.quantity
      }
      return conv(p.quantity * p.avgCost, p.currency)
    }
    /* The same figure in its own money — the fallback display when a
       conversion can't happen. Priced at quote currency, unpriced at the
       position's cost currency — same rule valueOf uses before conv(). */
    const nativeOf = (p: (typeof state.positions)[number]): { cur: string; amt: number } => {
      const snap = state.snapshots.find(
        (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
      )
      const pxNative = snap?.price ?? p.lastPrice
      const cur =
        (pxNative !== null ? (snap?.currency ?? p.currency) : p.currency) || 'CAD'
      return {
        cur,
        amt: pxNative !== null ? pxNative * p.quantity : p.quantity * p.avgCost,
      }
    }
    const addTo = (m: Map<string, number>, cur: string, amt: number) =>
      m.set(cur, (m.get(cur) ?? 0) + amt)
    const posByCur = new Map<string, number>()
    const cashByCur = new Map<string, number>()
    let positionsValue = 0
    for (const p of state.positions) {
      const v = valueOf(p)
      if (v !== null) positionsValue += v
      const n = nativeOf(p)
      addTo(posByCur, n.cur, n.amt)
    }
    let cash = 0
    for (const a of state.accounts) {
      const c = conv(a.cashBalance, a.baseCurrency)
      if (c !== null) cash += c
      addTo(cashByCur, a.baseCurrency || 'CAD', a.cashBalance)
    }
    /* Book currency first, the rest alphabetical — one honest line each. */
    const orderCurs = (m: Map<string, number>): [string, number][] =>
      [...m.entries()].sort(([a], [b]) =>
        a === homeCur ? -1 : b === homeCur ? 1 : a.localeCompare(b),
      )
    const totalByCur = new Map<string, number>()
    for (const [c, v] of posByCur) addTo(totalByCur, c, v)
    for (const [c, v] of cashByCur) addTo(totalByCur, c, v)
    const pairList = [...pairs]
      .map((pair) => {
        const [f, t] = pair.split('→') as [string, string]
        const r = convertFx(1, f, t, fx)
        return r === null ? pair : `${pair} ${fmtNum(lang, r, 4)}`
      })
      .join(' · ')
    return {
      positionsValue,
      cash,
      valueOf,
      nativeOf,
      used,
      missed,
      pairList,
      totalByCur: orderCurs(totalByCur),
      cashByCur: orderCurs(cashByCur),
      posByCur,
      missedCurs,
    }
  }, [state.positions, state.accounts, state.snapshots, fx, homeCur, lang])
  /* 'Open' means still actionable — new or acknowledged. Dismissed is
     closed and drops out of both the count and the latest list. */
  const openSignals = state.signals.filter((s) => s.status !== 'dismissed').length
  const latestSignals = state.signals.filter((s) => s.status !== 'dismissed').slice(0, 5)
  const lastRun = state.runs[0]
  const pricesAsOf = useMemo(() => {
    let latest: string | undefined
    for (const s of state.snapshots) {
      if (!latest || s.asOf > latest) latest = s.asOf
    }
    return latest
  }, [state.snapshots])

  const syncNow = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const r = await syncPrices()
      setSyncNote(
        r.failed.length > 0
          ? x(IM.invest_sync_partial).replace('{symbols}', r.failed.join(', '))
          : x(IM.invest_sync_done).replace(
              '{symbols}',
              pl(lang, r.synced, IM.invest_sync_symbol_one, IM.invest_sync_symbol_many),
            ),
      )
      await refresh()
      /* Refresh doubles as the FX retry — a manual resync should also
         pull the rate table when the first load missed it. */
      void loadFxRates().then(setFx)
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  const headlines = useMemo(() => dedupeNews(state.news), [state.news])
  const bookHeadlines = useMemo(
    () => headlines.filter((n) => n.symbol !== ''),
    [headlines],
  )
  /* A 'book' selection outlives its items (a refresh clears the symbols)
     → the filter falls back to 'all' rather than blank the list. */
  const effectiveNewsFilter = bookHeadlines.length === 0 ? 'all' : newsFilter
  const scopedHeadlines = effectiveNewsFilter === 'book' ? bookHeadlines : headlines
  const visibleHeadlines = newsExpanded ? scopedHeadlines : scopedHeadlines.slice(0, 12)

  /* Tally's presence outside the chat tab — one noticed thing, built
     locally from the same state the stats read. No model call. */
  const noticed = tallyNoticed(state, lang)

  const allocation = ASSET_CLASSES.map((cls) => {
    let value = 0
    const native = new Map<string, number>()
    for (const p of state.positions.filter((p) => p.assetClass === cls)) {
      value += book.valueOf(p) ?? 0
      const n = book.nativeOf(p)
      native.set(n.cur, (native.get(n.cur) ?? 0) + n.amt)
    }
    return { cls, value, native: [...native.entries()] }
    /* A class shows when it holds anything — an unconvertible position
       still counts even though `value` (the converted sum) reads zero. */
  }).filter((a) => a.native.some(([, v]) => v > 0))

  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="sb sb-page">
      <div className="sb-head-row">
        <div>
          <h1>{x(IM.invest_title)}</h1>
          <p className="sb-sub">{x(IM.invest_subtitle)}</p>
          {pricesAsOf && (
            <p className="sb-helper" style={{ margin: '6px 0 0' }}>
              {x(IM.invest_prices_as_of).replace(
                '{time}',
                new Date(pricesAsOf).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void syncNow()}
          className="sb-btn sb-btn-secondary sb-btn-sm"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={14} aria-hidden="true" />
          )}
          {busy ? x(IM.invest_syncing) : x(IM.invest_sync_prices)}
        </button>
      </div>
      {error && (
        <p role="alert" className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {error}
        </p>
      )}
      {syncNote && !error && (
        <p role="status" className="sb-helper">
          {syncNote}
        </p>
      )}

      <InvestOnboarding />

      {noticed && (
        <div className="sb-note sb-note-accent" style={{ marginBottom: 16, alignItems: 'center' }}>
          <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <strong>{x(IM.invest_home_tally_label)}</strong> — {noticed.text}{' '}
            <Link to="/invest/chat" style={{ color: 'inherit', fontWeight: 600 }}>
              {x(IM.invest_home_tally_open)}
            </Link>
          </span>
        </div>
      )}

      <div className="sb-note">
        <Info size={16} strokeWidth={1.7} aria-hidden="true" />
        <span>{x(IM.invest_info_note)}</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <MorningBrief
          positions={state.positions}
          watchSymbols={state.watchlist.map((w) => w.symbol)}
          snapshots={state.snapshots}
          signals={state.signals}
          theses={state.theses}
          goals={state.goals}
          orders={state.orders}
          ordersCovered={noticed?.kind === 'orders'}
        />
      </div>

      <div className="sb-stats">
        <div className="sb-stat">
          <p className="k" style={{ margin: 0 }}>
            {x(book.missed > 0 ? IM.invest_ov_total_value_split : IM.invest_ov_total_value)}
          </p>
          {book.missed > 0 ? (
            /* Anything unconvertible means a single blended figure would
               be wrong — one honest line per currency instead. */
            <p className="v" style={{ margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {book.totalByCur.map(([cur, amt]) => (
                <span key={cur}>{fmtFor(cur).format(amt)}</span>
              ))}
            </p>
          ) : (
            <p className="v" style={{ margin: '8px 0 0' }}>
              {book.used && <span className="dim">≈ </span>}
              {fmt.format(book.positionsValue + book.cash)}
            </p>
          )}
        </div>
        <div className="sb-stat">
          <p className="k" style={{ margin: 0 }}>{x(IM.invest_ov_cash)}</p>
          {book.missed > 0 ? (
            <p className="v" style={{ margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {book.cashByCur.map(([cur, amt]) => (
                <span key={cur}>{fmtFor(cur).format(amt)}</span>
              ))}
            </p>
          ) : (
            <p className="v" style={{ margin: '8px 0 0' }}>
              {book.used && <span className="dim">≈ </span>}
              {fmt.format(book.cash)}
            </p>
          )}
        </div>
        <div className="sb-stat">
          <p className="k" style={{ margin: 0 }}>{x(IM.invest_ov_open_signals)}</p>
          <p className="v" style={{ margin: '8px 0 0' }}>{openSignals}</p>
        </div>
        <div className="sb-stat">
          <p className="k" style={{ margin: 0 }}>{x(IM.invest_ov_last_run)}</p>
          <p className="v small" style={{ margin: '8px 0 0' }}>
            {lastRun ? (
              <>
                {new Date(lastRun.ranAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {/* Sweep = heartbeat, nothing due; evaluation = a strategy
                    actually ran — its own dim line, never a dangling "·". */}
                <span className="dim" style={{ display: 'block' }}>
                  {x(lastRun.strategyId ? IM.invest_ov_last_run_eval : IM.invest_ov_last_run_sweep)}
                </span>
              </>
            ) : (
              x(IM.invest_ov_never_run)
            )}
          </p>
        </div>
      </div>
      {book.used && fx && (
        <p className="sb-helper" style={{ margin: '6px 0 0' }}>
          {x(IM.invest_fx_note)
            .replace('{pairs}', book.pairList)
            .replace('{date}', fmtDay(lang, fx.date))}
        </p>
      )}
      {book.missed > 0 && (
        <p className="sb-helper" style={{ margin: '4px 0 0' }}>
          {fx
            ? /* Rates exist — just not for the named currencies. */
              x(IM.invest_home_fx_uncovered).replace(
                '{curs}',
                [...book.missedCurs].join(', '),
              )
            : x(IM.invest_home_fx_split)}
        </p>
      )}

      <div style={{ marginBottom: 16 }}>
        <Suspense fallback={null}>
          <BookCurve
            snapshots={state.bookSnapshots}
            cashEvents={state.cashEvents}
            accounts={state.accounts}
            fx={fx}
          />
        </Suspense>
      </div>

      <div className="sb-duo">
        <section className={cardClass}>
          <h2 style={{ margin: 0 }}>{x(IM.invest_ov_allocation)}</h2>
          {allocation.length === 0 ? (
            <p className="sb-empty">{x(IM.invest_positions_empty)}</p>
          ) : (
            <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allocation.map(({ cls, value, native }) => {
                const pct = book.positionsValue > 0 ? (value / book.positionsValue) * 100 : 0
                /* No blended book → no share-of-book. Each native amount
                   still gets its own honest proportion: its share of the
                   positions held in that same currency. */
                const nativePct = ([c, a]: [string, number]) => {
                  const denom = book.posByCur.get(c) ?? 0
                  return denom > 0 ? (a / denom) * 100 : 0
                }
                return (
                  <li key={cls}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--sb-body)' }}>{x(IM[assetLabel[cls]])}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--sb-muted)' }}>
                        {book.missed > 0
                          ? native
                              .map(([c, a]) =>
                                x(IM.invest_alloc_of_cur)
                                  .replace('{pct}', String(Math.round(nativePct([c, a]))))
                                  .replace('{cur}', c)
                                  .replace('{amt}', fmtFor(c).format(a)),
                              )
                              .join(' + ')
                          : `${fmt.format(value)} · ${fmtPct(lang, pct, { max: 0 })}`}
                      </span>
                    </div>
                    {/* Bars compare shares of one book — without a
                        comparable total every class fills its own
                        currency slice to 100%, which is noise not a
                        proportion. Text carries the honest share. */}
                    {book.missed === 0 && (
                      <div className="sb-bar-track">
                        <div className="sb-bar-fill" style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={cardClass}>
          <h2 style={{ margin: 0 }}>{x(IM.invest_ov_recent_signals)}</h2>
          {latestSignals.length === 0 ? (
            <p className="sb-empty">{x(IM.invest_signals_empty)}</p>
          ) : (
            <ul className="sb-mini-list">
              {latestSignals.map((s) => (
                <li key={s.id}>
                  <div style={{ minWidth: 0 }}>
                    <p className="sb-sig-title" style={{ fontSize: 14.5 }}>
                      {lang === 'fr' && s.titleFr ? s.titleFr : s.title}
                    </p>
                    <p className="sb-helper" style={{ margin: '3px 0 0' }}>
                      {/* Portfolio-level signals carry no symbol — skip the
                          separator rather than render a dangling '·'. */}
                      {s.symbol ? `${s.symbol} · ` : ''}
                      {new Date(s.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {s.status === 'new' && (
                    <span className="sb-pill sb-pill-warn">{x(IM.invest_signal_new)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={cardClass} style={{ marginTop: 16 }}>
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
            {/* 'Your book' keeps only headlines tagged to a held or
                watched symbol — the general market wrap drops out. */}
            {bookHeadlines.length > 0 && bookHeadlines.length !== headlines.length && (
              <div className="sb-seg sb-seg-sm">
                <button
                  type="button"
                  aria-pressed={newsFilter === 'all'}
                  onClick={() => setNewsFilter('all')}
                >
                  {x(IM.invest_news_all)}
                </button>
                <button
                  type="button"
                  aria-pressed={newsFilter === 'book'}
                  onClick={() => setNewsFilter('book')}
                >
                  {x(IM.invest_news_book)}
                </button>
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
          <ul className="m-0 mt-[14px] grid list-none grid-cols-1 gap-[8px] p-0 min-[980px]:grid-cols-2">
            {visibleHeadlines.map((n, i) => (
              <li key={n.id} className={i === 0 ? 'min-[980px]:col-span-2' : undefined}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex h-full items-center gap-[11px] rounded-[12px] border border-border bg-surface no-underline transition-all hover:border-border-strong hover:bg-inset hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${i === 0 ? 'p-[13px]' : 'p-[11px]'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex shrink-0 items-center justify-center rounded-[10px] font-bold uppercase ${i === 0 ? 'h-[34px] w-[34px] text-[13px]' : 'h-[30px] w-[30px] text-[11.5px]'} ${sourceTint(n.source)}`}
                  >
                    {(n.source || '?').trim().charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`line-clamp-2 block font-semibold leading-snug text-text underline decoration-transparent underline-offset-2 transition-[text-decoration-color] group-hover:decoration-accent ${i === 0 ? 'text-[14px]' : 'text-[13px]'}`}>
                      {n.title}
                    </span>
                    <span className="mt-[5px] flex items-center gap-[6px] text-[11.5px] text-text-muted">
                      <span className="truncate">{n.source}</span>
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
                      {n.publishedAt && (
                        <span className="ml-auto shrink-0 tabular-nums">
                          {new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' }).format(new Date(n.publishedAt))}
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
              </li>
            ))}
          </ul>
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
    </div>
  )
}
