import './strategies.css'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { InvestSignal } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { setSignalStatus } from '@/features/invest/data/api'
import { sendInvestReaction } from '@/features/invest/data/chatApi'
import { fill } from '@/lib/format'
import { useInvestHead } from './useInvestHead'
import { StrategyDeliveryCard } from './StrategyDeliveryCard'
import { TallyNote } from './TallyNote'
import { InfoHint } from './InfoHint'
import { SignalCard } from './SignalCard'
import { PageHead } from './PageHead'

/** Where a row's subject lives — an inbox that routes nowhere is a dead
    end. Theses land on the Theses cards (with their reaffirm action),
    goals and watch items on the Analysis board. The strategy kinds key
    on provenance: a rule-produced row (strategyId set) lands on the
    Agent tab where the source can be tuned, while a provenance-less
    observation — the insight pass writes insight/alert rows with no
    strategy — goes to Tally, the only place to discuss what the bot
    noticed. */
function signalDest(s: InvestSignal): { to: string; tab: keyof typeof IM } {
  if (s.kind === 'thesis') return { to: '/invest/theses', tab: 'invest_tab_theses' }
  if (s.kind === 'goal' || s.kind === 'scan')
    return { to: '/invest/analysis', tab: 'invest_tab_analysis' }
  return s.strategyId
    ? { to: '/invest/strategies', tab: 'invest_tab_strategies' }
    : { to: '/invest/chat', tab: 'invest_tab_chat' }
}

/**
 * Notifications tab — the in-app home for what strategies surface: new
 * signals to triage and draft proposals waiting in Orders. The header
 * badge counts the same two under the default badge scope; the
 * signals-only setting narrows the nudge, not this record — drafts
 * stay listed here either way. Rows wear the Signals tab's shape so the
 * same row reads identically on both surfaces, and each routes to the
 * page that owns it. Delivery destinations live per strategy on the
 * Agent tab; the read view is below.
 */
export function InvestNotificationsPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_notifications, IM.invest_seo_desc_notifications)
  /* One busy slot per row — a single id would re-enable row A's buttons
     the moment row B's tap moves the marker. */
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())
  const setBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const [error, setError] = useState<string | undefined>()
  const [tallyLine, setTallyLine] = useState<string | null>(null)

  /* Held symbols link a row's subject chip straight to the book —
     watchlist-only names stay plain (no position to land on). */
  const heldSymbols = useMemo(
    () => new Set((state?.positions ?? []).map((p) => p.symbol.toUpperCase())),
    [state?.positions],
  )

  const act = async (id: string, status: 'acknowledged' | 'dismissed') => {
    setBusy(id, true)
    setError(undefined)
    try {
      await setSignalStatus(id, status)
    } catch {
      /* The write itself failed — the row is still genuinely new. */
      setError(x(IM.invest_error_generic))
      setBusy(id, false)
      return
    }
    /* The write landed — don't let a failed reload report an error on an
       action that succeeded; the row lingers until the next load heals
       local state. */
    await refresh().catch(() => {})
    /* Same reaction the Signals tab sends — a triage is a triage
       regardless of which page the tap happened on. Best-effort; a
       throttled or failed reply never disturbs the status change. */
    const symbol = state?.signals.find((s) => s.id === id)?.symbol
    sendInvestReaction({ type: 'signal_updated', status, symbol }, lang, setTallyLine)
      .then((r) => {
        if (r.reply) setTallyLine(r.reply)
      })
      .catch(() => {})
    setBusy(id, false)
  }

  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  const newSignals = state.signals.filter((s) => s.status === 'new')
  const drafts = state.orders.filter((o) => o.status === 'draft')

  return (
    <div className="sb sb-page">
      <PageHead title={x(IM.invest_notif_title)} />
      {error && (
        <p role="alert" className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {error}
        </p>
      )}
      {tallyLine && <TallyNote line={tallyLine} />}

      <section className="sb-section" aria-label={x(IM.invest_notif_attention)}>
        <div className="sb-section-head">
          <div>
            <h2>
              {x(IM.invest_notif_attention)}
              <InfoHint
                label={x(IM.invest_hint_notif_actions_aria)}
                text={x(IM.invest_hint_notif_actions)}
              />
            </h2>
          </div>
        </div>
        {drafts.length === 0 && newSignals.length === 0 ? (
          <div className="sb-card sb-card-pad">
            <p className="sb-empty" style={{ marginTop: 0 }}>{x(IM.invest_notif_empty)}</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drafts.length > 0 && (
              <li className="sb-card sb-card-pad">
                <div className="sb-sig" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <p className="sb-sig-title" style={{ margin: 0 }}>
                    {fill(x(IM.invest_notif_drafts), { n: drafts.length })}
                  </p>
                  <Link to="/invest/orders" className="sb-notif-open">
                    {x(IM.invest_notif_review_orders)}
                    <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            )}
            {newSignals.map((s) => {
              const dest = signalDest(s)
              const openLabel = fill(x(IM.invest_notif_open), {
                dest: x(IM[dest.tab]),
              })
              /* Same card the Signals tab draws — only the side verbs
                 differ: triage buttons plus the route to the page that
                 owns the subject. */
              return (
                <SignalCard
                  key={s.id}
                  signal={s}
                  heldSymbols={heldSymbols}
                  side={
                    <>
                      <span className="sb-row-actions">
                        <button
                          type="button"
                          disabled={busyIds.has(s.id)}
                          onClick={() => void act(s.id, 'acknowledged')}
                          className="sb-btn sb-btn-primary sb-btn-sm"
                        >
                          {x(IM.invest_acknowledge)}
                        </button>
                        <button
                          type="button"
                          disabled={busyIds.has(s.id)}
                          onClick={() => void act(s.id, 'dismissed')}
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                        >
                          {x(IM.invest_dismiss)}
                        </button>
                      </span>
                      <Link
                        to={dest.to}
                        className="sb-notif-open"
                        aria-label={s.symbol ? `${openLabel} — ${s.symbol}` : openLabel}
                      >
                        {openLabel}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                      </Link>
                    </>
                  }
                />
              )
            })}
          </ul>
        )}
      </section>

      <StrategyDeliveryCard />
    </div>
  )
}
