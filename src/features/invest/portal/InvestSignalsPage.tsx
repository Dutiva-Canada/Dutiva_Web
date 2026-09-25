import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { SignalKind, SignalStatus } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { setSignalStatus } from '@/features/invest/data/api'

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
  const { x } = useI18n()
  const { state, loading, refresh } = useInvestData()
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

  return (
    <div className="flex flex-col gap-[16px]">
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(IM.invest_signals_title)}
      </h1>
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}
      {state.signals.length === 0 ? (
        <p className="m-0 rounded-[14px] border border-border bg-surface p-[18px] text-[12.5px] text-text-muted">
          {x(IM.invest_signals_empty)}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
          {state.signals.map((s) => (
            <li
              key={s.id}
              className="rounded-[14px] border border-border bg-surface p-[16px]"
            >
              <div className="flex items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="rounded-full bg-gold-bg px-[8px] py-[2px] text-[10.5px] font-semibold text-gold-fg">
                      {x(IM[kindLabel[s.kind]])}
                    </span>
                    <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                      {s.symbol}
                    </span>
                    {s.score !== null && (
                      <span className="text-[11px] tabular-nums text-text-muted">
                        {x(IM.invest_score)} {Math.round(s.score)}
                      </span>
                    )}
                    <span className="text-[11px] text-text-muted">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="m-0 mt-[8px] text-[13.5px] font-semibold text-text">{s.title}</p>
                  {s.body && (
                    <p className="m-0 mt-[4px] text-[12.5px] leading-[1.5] text-text-3">{s.body}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-[6px]">
                  <span className="rounded-full bg-inset px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                    {x(IM[statusLabel[s.status]])}
                  </span>
                  {s.status === 'new' && (
                    <span className="flex gap-[6px]">
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => void act(s.id, 'acknowledged')}
                        className="cursor-pointer rounded-[7px] border-none bg-navy px-[9px] py-[4px] text-[11px] font-semibold text-white disabled:opacity-50"
                      >
                        {x(IM.invest_acknowledge)}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => void act(s.id, 'dismissed')}
                        className="cursor-pointer rounded-[7px] border border-border bg-transparent px-[9px] py-[4px] text-[11px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50"
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
