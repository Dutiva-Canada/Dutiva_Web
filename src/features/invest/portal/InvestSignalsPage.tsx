import './strategies.css'
import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { InvestSignal, SignalStatus } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { setSignalStatus } from '@/features/invest/data/api'
import { sendInvestReaction } from '@/features/invest/data/chatApi'
import { TallyNote } from './TallyNote'
import { InfoHint } from './InfoHint'
import { useInvestHead } from './useInvestHead'
import { SignalCard } from './SignalCard'
import { PageHead } from './PageHead'

const statusLabel: Record<SignalStatus, keyof typeof IM> = {
  new: 'invest_signal_new',
  acknowledged: 'invest_signal_acknowledged',
  dismissed: 'invest_signal_dismissed',
}

/** Signals tab — what the bot emitted, with acknowledge/dismiss triage. */
export function InvestSignalsPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_signals, IM.invest_seo_desc_signals)
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
  const [showDismissed, setShowDismissed] = useState(false)

  const heldSymbols = useMemo(
    () => new Set((state?.positions ?? []).map((p) => p.symbol.toUpperCase())),
    [state?.positions],
  )

  const act = async (id: string, status: SignalStatus) => {
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
    /* Tally notices the triage — best-effort; a throttled or failed
       reaction never disturbs the status change. A reopen is an undo, not
       a triage event, so it stays out of the reaction feed. */
    if (status === 'acknowledged' || status === 'dismissed') {
      const symbol = state?.signals.find((s) => s.id === id)?.symbol
      sendInvestReaction({ type: 'signal_updated', status, symbol }, lang, setTallyLine)
        .then((r) => {
          if (r.reply) setTallyLine(r.reply)
        })
        .catch(() => {})
    }
    setBusy(id, false)
  }

  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  const renderSignal = (s: InvestSignal) => (
    <SignalCard
      key={s.id}
      signal={s}
      heldSymbols={heldSymbols}
      side={
        <>
          <span className={`sb-pill ${s.status === 'new' ? 'sb-pill-warn' : s.status === 'acknowledged' ? 'sb-pill-ok' : 'sb-pill-draft'}`}>
            {x(IM[statusLabel[s.status]])}
          </span>
          <span className="sb-row-actions">
              {s.status === 'new' && (
                <button
                  type="button"
                  disabled={busyIds.has(s.id)}
                  onClick={() => void act(s.id, 'acknowledged')}
                  className="sb-btn sb-btn-primary sb-btn-sm"
                >
                  {x(IM.invest_acknowledge)}
                </button>
              )}
              {s.status !== 'dismissed' && (
                <button
                  type="button"
                  disabled={busyIds.has(s.id)}
                  onClick={() => void act(s.id, 'dismissed')}
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                >
                  {x(IM.invest_dismiss)}
                </button>
              )}
              {s.status !== 'new' && (
                <button
                  type="button"
                  disabled={busyIds.has(s.id)}
                  onClick={() => void act(s.id, 'new')}
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                >
                  {x(IM.invest_signal_reopen)}
                </button>
              )}
            </span>
        </>
      }
    />
  )

  const openSignals = state.signals.filter((s) => s.status !== 'dismissed')
  const dismissedSignals = state.signals.filter((s) => s.status === 'dismissed')

  return (
    <div className="sb sb-page">
      <PageHead
        title={
          <>
            {x(IM.invest_signals_title)}
            <InfoHint
              label={x(IM.invest_hint_signal_kinds_aria)}
              text={x(IM.invest_hint_signal_kinds)}
            />
          </>
        }
      />
      {error && (
        <p role="alert" className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {error}
        </p>
      )}
      {tallyLine && <TallyNote line={tallyLine} />}
      {state.signals.length === 0 ? (
        <section className="sb-card sb-card-pad" style={{ marginTop: 16 }}>
          <p className="sb-empty" style={{ marginTop: 0 }}>{x(IM.invest_signals_empty)}</p>
        </section>
      ) : (
        <>
          {openSignals.length === 0 ? (
            <section className="sb-card sb-card-pad" style={{ marginTop: 16 }}>
              <p className="sb-empty" style={{ marginTop: 0 }}>{x(IM.invest_signals_empty)}</p>
            </section>
          ) : (
            <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {openSignals.map(renderSignal)}
            </ul>
          )}
          {dismissedSignals.length > 0 && (
            <>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                style={{ marginTop: 16 }}
                aria-expanded={showDismissed}
                onClick={() => setShowDismissed((v) => !v)}
              >
                {showDismissed
                  ? x(IM.invest_signals_hide_dismissed)
                  : x(IM.invest_signals_show_dismissed).replace(
                      '{count}',
                      String(dismissedSignals.length),
                    )}
              </button>
              {showDismissed && (
                <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {dismissedSignals.map(renderSignal)}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
