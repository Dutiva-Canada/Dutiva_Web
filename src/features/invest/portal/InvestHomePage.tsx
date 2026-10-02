import { useMemo, useState } from 'react'
import { ArrowUpRight, ChevronDown, ChevronUp, Info, Loader2, Newspaper, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { ASSET_CLASSES, type AssetClass } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { syncPrices } from '@/features/invest/data/api'
import { useInvestHead } from './useInvestHead'
import { InvestOnboarding } from './InvestOnboarding'

const assetLabel: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'

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
function dedupeNews<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((n) => {
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
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD',
      }),
    [lang],
  )

  const snapshotPrice = (assetClass: AssetClass, symbol: string) =>
    state.snapshots.find((s) => s.assetClass === assetClass && s.symbol === symbol)?.price

  const positionValue = (p: (typeof state.positions)[number]) =>
    p.quantity * (snapshotPrice(p.assetClass, p.symbol) ?? p.lastPrice ?? p.avgCost)

  const positionsValue = state.positions.reduce((sum, p) => sum + positionValue(p), 0)
  const cash = state.accounts.reduce((sum, a) => sum + a.cashBalance, 0)
  const openSignals = state.signals.filter((s) => s.status === 'new').length
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
          : x(IM.invest_sync_done).replace('{count}', String(r.synced)),
      )
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  const headlines = useMemo(() => dedupeNews(state.news), [state.news])
  const visibleHeadlines = newsExpanded ? headlines : headlines.slice(0, 12)

  const allocation = ASSET_CLASSES.map((cls) => ({
    cls,
    value: state.positions
      .filter((p) => p.assetClass === cls)
      .reduce((sum, p) => sum + positionValue(p), 0),
  })).filter((a) => a.value > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
            {x(IM.invest_title)}
          </h1>
          <p className="m-0 mt-[4px] text-[13px] text-text-3">{x(IM.invest_subtitle)}</p>
          {pricesAsOf && (
            <p className="m-0 mt-[4px] text-[11.5px] text-text-muted">
              {x(IM.invest_prices_as_of).replace(
                '{time}',
                new Date(pricesAsOf).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA'),
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void syncNow()}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border border-border bg-transparent px-[12px] text-[12.5px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={13} aria-hidden="true" />
          )}
          {busy ? x(IM.invest_syncing) : x(IM.invest_sync_prices)}
        </button>
      </div>
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}
      {syncNote && !error && (
        <p role="status" className="m-0 text-[12.5px] text-text-2">
          {syncNote}
        </p>
      )}

      <InvestOnboarding />

      <div className="flex items-start gap-[8px] rounded-[12px] border border-border bg-surface px-[14px] py-[11px] text-[12px] leading-normal text-text-muted">
        <Info size={15} strokeWidth={1.7} className="mt-px shrink-0" aria-hidden="true" />
        <span>{x(IM.invest_info_note)}</span>
      </div>

      <div className="grid grid-cols-2 gap-[12px] min-[720px]:grid-cols-4">
        <div className={cardClass}>
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {x(IM.invest_ov_total_value)}
          </p>
          <p className="m-0 mt-[8px] font-display text-[22px] font-semibold text-text">
            {fmt.format(positionsValue + cash)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {x(IM.invest_ov_cash)}
          </p>
          <p className="m-0 mt-[8px] font-display text-[22px] font-semibold text-text">
            {fmt.format(cash)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {x(IM.invest_ov_open_signals)}
          </p>
          <p className="m-0 mt-[8px] font-display text-[22px] font-semibold text-text">
            {openSignals}
          </p>
        </div>
        <div className={cardClass}>
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {x(IM.invest_ov_last_run)}
          </p>
          <p className="m-0 mt-[8px] font-display text-[15px] font-semibold text-text">
            {lastRun ? new Date(lastRun.ranAt).toLocaleString() : x(IM.invest_ov_never_run)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[16px] min-[820px]:grid-cols-2">
        <section className={cardClass}>
          <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_ov_allocation)}</h2>
          {allocation.length === 0 ? (
            <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">
              {x(IM.invest_positions_empty)}
            </p>
          ) : (
            <ul className="m-0 mt-[14px] flex list-none flex-col gap-[10px] p-0">
              {allocation.map(({ cls, value }) => {
                const pct = positionsValue > 0 ? (value / positionsValue) * 100 : 0
                return (
                  <li key={cls}>
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="font-medium text-text-2">{x(IM[assetLabel[cls]])}</span>
                      <span className="tabular-nums text-text-muted">
                        {fmt.format(value)} · {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="mt-[5px] h-[6px] overflow-hidden rounded-full bg-inset">
                      <div
                        className="h-full rounded-full bg-navy"
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={cardClass}>
          <h2 className="m-0 text-[14px] font-semibold text-text">
            {x(IM.invest_ov_recent_signals)}
          </h2>
          {state.signals.length === 0 ? (
            <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">
              {x(IM.invest_signals_empty)}
            </p>
          ) : (
            <ul className="m-0 mt-[12px] flex list-none flex-col divide-y divide-border p-0">
              {state.signals.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-[12px] py-[10px]">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[13px] font-semibold text-text">
                      {lang === 'fr' && s.titleFr ? s.titleFr : s.title}
                    </p>
                    <p className="m-0 mt-[2px] text-[11.5px] text-text-muted">
                      {s.symbol} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {s.status === 'new' && (
                    <span className="shrink-0 rounded-full bg-gold-bg px-[8px] py-[2px] text-[10.5px] font-semibold text-gold-fg">
                      {x(IM.invest_signal_new)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={cardClass}>
        {/* Third-party headlines, verbatim — label them as such so a publisher's
            headline never reads as a Dutiva recommendation. */}
        <h2 className="m-0 flex items-center gap-[8px] text-[14px] font-semibold text-text">
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
        {state.news.length === 0 ? (
          <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">{x(IM.invest_news_empty)}</p>
        ) : (
          <>
          <ul className="m-0 mt-[12px] grid list-none grid-cols-1 gap-[8px] p-0 min-[980px]:grid-cols-2">
            {visibleHeadlines.map((n) => (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-[11px] rounded-[12px] border border-border bg-surface p-[11px] no-underline transition-all hover:border-border-strong hover:bg-inset hover:shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] text-[11.5px] font-bold uppercase ${sourceTint(n.source)}`}
                  >
                    {(n.source || '?').trim().charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[13px] font-semibold leading-snug text-text underline decoration-transparent underline-offset-2 transition-[text-decoration-color] group-hover:decoration-accent">
                      {n.title}
                    </span>
                    <span className="mt-[5px] flex items-center gap-[6px] text-[11.5px] text-text-muted">
                      <span className="truncate">{n.source}</span>
                      {n.symbol && (
                        <span className="shrink-0 rounded-[6px] border border-border bg-inset px-[6px] py-px text-[10px] font-semibold uppercase tracking-[0.04em] text-text-2">
                          {n.symbol}
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
                    className="mt-[3px] shrink-0 text-text-3 transition-transform duration-150 group-hover:-translate-y-[1px] group-hover:translate-x-[1px] group-hover:text-accent"
                  />
                  <span className="sr-only">{x(IM.invest_news_external)}</span>
                </a>
              </li>
            ))}
          </ul>
          {headlines.length > 12 && (
            <button
              type="button"
              onClick={() => setNewsExpanded((v) => !v)}
              className="mx-auto mt-[12px] flex min-h-[34px] w-auto cursor-pointer items-center justify-center gap-[6px] rounded-full border border-border bg-transparent px-[18px] text-[12.5px] font-semibold text-text-2 transition-colors hover:border-border-strong hover:bg-inset"
            >
              {newsExpanded
                ? x(IM.invest_news_less)
                : x(IM.invest_news_more).replace('{count}', String(headlines.length))}
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
