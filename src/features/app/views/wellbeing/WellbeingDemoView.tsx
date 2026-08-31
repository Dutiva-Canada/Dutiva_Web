import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { employees, supportSignals } from '@/data'
import { statusChipClass } from '@/components/chips'
import { useWellbeingRail } from '@/features/app/rail/useEntityRails'
import { wellbeingMessages as M } from '@/i18n/messages/wellbeing'
import { AppPage } from '@/features/app/shell/AppPage'

/** Prototype `followCount: '2'` — a fixed figure in the handoff. */
const FOLLOW_UPS_THIS_WEEK = '2'

/** Northgate support signals — demo workspace and public `/demo` only. */
export function WellbeingDemoView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const openWellbeingRail = useWellbeingRail()

  const draftCheckIn = (employeeId: string | null) => {
    if (employeeId !== null && employees.some((e) => e.id === employeeId)) {
      openWellbeingRail(employeeId)
    } else {
      navigate('/app/communications')
    }
  }

  return (
    <AppPage width="comfort">
      <div className="mb-[18px] flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[14px] py-[11px]">
        <Shield
          size={14}
          strokeWidth={1.8}
          className="mt-px shrink-0 text-gold-fg"
          aria-hidden="true"
        />
        <span className="text-[12.5px] leading-[1.55] font-semibold text-gold-fg">
          {x(M.wellbeing_banner)}
        </span>
      </div>

      <div className="mb-[22px] flex flex-wrap gap-[14px]">
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="font-display text-[26px] font-bold text-text">
            {supportSignals.length}
          </div>
          <div className="mt-[2px] text-[12.5px] text-text-muted">
            {x(M.wellbeing_active_label)}
          </div>
        </div>
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="font-display text-[26px] font-bold text-gold-dot">
            {FOLLOW_UPS_THIS_WEEK}
          </div>
          <div className="mt-[2px] text-[12.5px] text-text-muted">
            {x(M.wellbeing_follow_label)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[12px]">
        {supportSignals.map((signal) => (
          <div
            key={signal.id}
            className="rounded-[12px] border border-border bg-surface px-[18px] py-[16px]"
          >
            <div className="flex flex-wrap items-start justify-between gap-[12px]">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] leading-[1.45] font-semibold text-text">
                  {x(signal.type)}
                </div>
                <div className="mt-[3px] text-[12px] text-text-muted">
                  {x(signal.who)} · {x(M.wellbeing_source)}: {x(signal.source)} ·{' '}
                  {x(M.wellbeing_confidence)}: {x(signal.confidence)}
                </div>
              </div>
              <span className={statusChipClass(signal.tone)}>{x(signal.sensitivity)}</span>
            </div>
            <div className="mt-[8px] text-[13px] leading-[1.55] text-text-3">{x(signal.why)}</div>
            <div className="mt-[9px] flex flex-col gap-[4px] rounded-[9px] bg-inset px-[13px] py-[10px]">
              <span className="text-[11px] font-bold tracking-[0.03em] text-gold-dot uppercase">
                {x(M.wellbeing_recommended)}
              </span>
              <span className="text-[12.5px] leading-normal text-text-2">{x(signal.action)}</span>
            </div>
            <div className="mt-[10px] flex flex-wrap gap-[8px]">
              {signal.employeeId !== null && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/app/employees/${signal.employeeId}`, {
                      state: { tab: 'wellbeing' },
                    })
                  }
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-text"
                >
                  {x(M.wellbeing_open_profile)}
                </button>
              )}
              <button
                type="button"
                onClick={() => draftCheckIn(signal.employeeId)}
                className="cursor-pointer rounded-[8px] border-none bg-accent-soft px-[12px] py-[6px] font-sans text-[12px] font-semibold text-accent"
              >
                {x(M.wellbeing_draft_checkin)}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[14px] flex items-start gap-[7px] text-[11px] leading-normal text-text-faint">
        <Shield size={12} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />
        <span>{x(M.wellbeing_audit_note)}</span>
      </div>
    </AppPage>
  )
}
