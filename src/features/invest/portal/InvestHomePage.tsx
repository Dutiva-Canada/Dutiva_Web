import { useMemo } from 'react'
import { Info, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { ASSET_CLASSES, type AssetClass } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'

const assetLabel: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'

/** Overview tab — book value, cash, open signals, last bot run, allocation. */
export function InvestHomePage() {
  const { x, lang } = useI18n()
  const { state, loading } = useInvestData()
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
      <div>
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
          {x(IM.invest_title)}
        </h1>
        <p className="m-0 mt-[4px] text-[13px] text-text-3">{x(IM.invest_subtitle)}</p>
      </div>

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
          <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_ov_recent_signals)}</h2>
          {state.signals.length === 0 ? (
            <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">
              {x(IM.invest_signals_empty)}
            </p>
          ) : (
            <ul className="m-0 mt-[12px] flex list-none flex-col divide-y divide-border p-0">
              {state.signals.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-[12px] py-[10px]">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[13px] font-semibold text-text">{s.title}</p>
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
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_news_title)}</h2>
        {state.news.length === 0 ? (
          <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">{x(IM.invest_news_empty)}</p>
        ) : (
          <ul className="m-0 mt-[12px] flex list-none flex-col divide-y divide-border p-0">
            {state.news.slice(0, 12).map((n) => (
              <li key={n.id} className="py-[10px]">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-accent no-underline hover:underline"
                >
                  {n.title}
                </a>
                <p className="m-0 mt-[3px] text-[11.5px] text-text-muted">
                  {n.symbol && <span className="font-semibold uppercase">{n.symbol} · </span>}
                  {n.source}
                  {n.publishedAt && <> · {new Date(n.publishedAt).toLocaleDateString()}</>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
