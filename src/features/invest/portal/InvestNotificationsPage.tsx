import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { SignalKind, SignalStatus } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { setSignalStatus } from '@/features/invest/data/api'
import { fill } from '@/lib/format'
import { useInvestHead } from './useInvestHead'
import { StrategyDeliveryCard } from './StrategyDeliveryCard'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'

const kindLabel: Record<SignalKind, keyof typeof IM> = {
  screen: 'invest_signal_kind_screen',
  insight: 'invest_signal_kind_insight',
  alert: 'invest_signal_kind_alert',
  thesis: 'invest_signal_kind_thesis',
}

/**
 * Notifications tab — the in-app home for what strategies surface: new
 * signals to triage and draft proposals waiting in Orders (badge in the
 * header counts the same two). Delivery destinations live per strategy on
 * the Bot tab; the read view is below.
 */
export function InvestNotificationsPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_notifications, IM.invest_seo_desc_notifications)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()

  const act = async (id: string, status: SignalStatus) => {
    setBusyId(id)
    setError(undefined)
    try {
      await setSignalStatus(id, status)
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }

  const newSignals = state.signals.filter((s) => s.status === 'new')
  const drafts = state.orders.filter((o) => o.status === 'draft')

  return (
    <div className="flex flex-col gap-[16px]">
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(IM.invest_notif_title)}
      </h1>
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_notif_attention)}</h2>
        {drafts.length === 0 && newSignals.length === 0 ? (
          <p className="m-0 mt-[12px] text-[12.5px] text-text-muted">{x(IM.invest_notif_empty)}</p>
        ) : (
          <ul className="m-0 mt-[12px] flex list-none flex-col divide-y divide-border p-0">
            {drafts.length > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-[10px] py-[10px]">
                <p className="m-0 text-[13px] font-semibold text-text">
                  {fill(x(IM.invest_notif_drafts), { n: drafts.length })}
                </p>
                <Link
                  to="/invest/orders"
                  className="inline-flex items-center gap-[5px] text-[12px] font-semibold text-accent no-underline hover:underline"
                >
                  {x(IM.invest_notif_review_orders)}
                  <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                </Link>
              </li>
            )}
            {newSignals.map((s) => (
              <li key={s.id} className="py-[10px]">
                <div className="flex flex-col gap-[10px] min-[640px]:flex-row min-[640px]:items-start min-[640px]:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span className="rounded-full bg-gold-bg px-[8px] py-[2px] text-[10.5px] font-semibold text-gold-fg">
                        {x(IM[kindLabel[s.kind]])}
                      </span>
                      {s.symbol && (
                        <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                          {s.symbol}
                        </span>
                      )}
                      <span className="text-[11px] text-text-muted">
                        {new Date(s.createdAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                      </span>
                    </div>
                    <p className="m-0 mt-[6px] text-[13px] font-semibold text-text">
                      {lang === 'fr' && s.titleFr ? s.titleFr : s.title}
                    </p>
                    {(lang === 'fr' && s.bodyFr ? s.bodyFr : s.body) && (
                      <p className="m-0 mt-[3px] text-[12px] leading-[1.5] text-text-3">
                        {lang === 'fr' && s.bodyFr ? s.bodyFr : s.body}
                      </p>
                    )}
                  </div>
                  <span className="flex shrink-0 gap-[8px]">
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => void act(s.id, 'acknowledged')}
                      className="min-h-[44px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] text-[12px] font-semibold text-white disabled:opacity-50"
                    >
                      {x(IM.invest_acknowledge)}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => void act(s.id, 'dismissed')}
                      className="min-h-[44px] cursor-pointer rounded-[8px] border border-border bg-transparent px-[14px] text-[12px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50"
                    >
                      {x(IM.invest_dismiss)}
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StrategyDeliveryCard />
    </div>
  )
}
