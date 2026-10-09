import './strategies.css'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { SignalKind, SignalStatus } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { setSignalStatus } from '@/features/invest/data/api'
import { sendInvestReaction } from '@/features/invest/data/chatApi'
import { TallyNote } from './TallyNote'
import { useInvestHead } from './useInvestHead'

const kindLabel: Record<SignalKind, keyof typeof IM> = {
  screen: 'invest_signal_kind_screen',
  insight: 'invest_signal_kind_insight',
  alert: 'invest_signal_kind_alert',
  thesis: 'invest_signal_kind_thesis',
}

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
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [tallyLine, setTallyLine] = useState<string | null>(null)

  const act = async (id: string, status: SignalStatus) => {
    setBusyId(id)
    setError(undefined)
    try {
      await setSignalStatus(id, status)
      await refresh()
      /* Tally notices the triage — best-effort; a throttled or failed
         reaction never disturbs the status change. */
      if (status === 'acknowledged' || status === 'dismissed') {
        const symbol = state?.signals.find((s) => s.id === id)?.symbol
        sendInvestReaction({ type: 'signal_updated', status, symbol }, lang, setTallyLine)
          .then((r) => {
            if (r.reply) setTallyLine(r.reply)
          })
          .catch(() => {})
      }
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusyId(null)
    }
  }

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
        <h1>{x(IM.invest_signals_title)}</h1>
      </div>
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
        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.signals.map((s) => (
            <li key={s.id} className="sb-card sb-card-pad">
              <div className="sb-sig">
                <div style={{ minWidth: 0 }}>
                  <div className="sb-sig-head">
                    <span className={`sb-pill ${s.kind === 'alert' ? 'sb-pill-warn' : 'sb-pill-draft'}`}>
                      {x(IM[kindLabel[s.kind]])}
                    </span>
                    {s.symbol && <span className="sb-pill">{s.symbol}</span>}
                    {s.score !== null && (
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {x(IM.invest_score)} {Math.round(s.score)}
                      </span>
                    )}
                    <span>{new Date(s.createdAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}</span>
                  </div>
                  <p className="sb-sig-title" style={{ marginTop: 8 }}>
                    {lang === 'fr' && s.titleFr ? s.titleFr : s.title}
                  </p>
                  {(lang === 'fr' && s.bodyFr ? s.bodyFr : s.body) && (
                    <p className="sb-sig-body">
                      {lang === 'fr' && s.bodyFr ? s.bodyFr : s.body}
                    </p>
                  )}
                </div>
                <div className="sb-sig-side">
                  <span className={`sb-pill ${s.status === 'new' ? 'sb-pill-warn' : s.status === 'acknowledged' ? 'sb-pill-ok' : 'sb-pill-draft'}`}>
                    {x(IM[statusLabel[s.status]])}
                  </span>
                  {s.status === 'new' && (
                    <span className="sb-row-actions">
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => void act(s.id, 'acknowledged')}
                        className="sb-btn sb-btn-primary sb-btn-sm"
                      >
                        {x(IM.invest_acknowledge)}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => void act(s.id, 'dismissed')}
                        className="sb-btn sb-btn-secondary sb-btn-sm"
                      >
                        {x(IM.invest_dismiss)}
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
