import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { capacityMessages as M } from '@/i18n/messages/capacity'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { joinOrganizationWaitlist } from '@/features/app/workspaceMode/api'

export function CapacityAlert() {
  const { x } = useI18n()
  const { admissionStatus, clearAdmissionStatus, identity } = useWorkspaceMode()
  const [submitted, setSubmitted] = useState(false)
  const [working, setWorking] = useState(false)

  if (admissionStatus === 'idle') return null

  const requestedName = identity?.companyName ?? 'Dutiva Canada Inc.'

  async function handleJoin() {
    setWorking(true)
    const result = await joinOrganizationWaitlist(requestedName)
    if (result === 'waiting' || result === 'already_waiting') {
      setSubmitted(true)
    }
    setWorking(false)
  }

  const primaryClass =
    'cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60'
  const secondaryClass =
    'cursor-pointer rounded-[8px] border-none bg-accent-soft px-[14px] py-[8px] font-sans text-[13px] font-semibold text-accent'

  if (admissionStatus === 'waitlist' || submitted) {
    return (
      <div
        className="mt-[16px] rounded-[12px] border border-border bg-inset px-[16px] py-[14px]"
        role="status"
      >
        <h3 className="m-0 text-[14px] font-semibold text-text-2">{x(M.capacity_waitlist_title)}</h3>
        <p className="mt-[6px] text-[13px] leading-[1.5] text-text-3">{x(M.capacity_waitlist_body)}</p>
        <div className="mt-[12px]">
          <button type="button" className={secondaryClass} onClick={clearAdmissionStatus}>
            {x(M.capacity_dismiss)}
          </button>
        </div>
      </div>
    )
  }

  if (admissionStatus === 'capacity') {
    return (
      <div
        className="mt-[16px] rounded-[12px] border border-risk-border bg-risk-bg px-[16px] py-[14px]"
        role="alert"
      >
        <h3 className="m-0 text-[14px] font-semibold text-risk-fg">{x(M.capacity_reached_title)}</h3>
        <p className="mt-[6px] text-[13px] leading-[1.5] text-text-3">{x(M.capacity_reached_body)}</p>
        <div className="mt-[12px] flex gap-[10px]">
          <button type="button" className={primaryClass} onClick={handleJoin} disabled={working}>
            {x(M.capacity_join_waitlist)}
          </button>
          <button type="button" className={secondaryClass} onClick={clearAdmissionStatus}>
            {x(M.capacity_dismiss)}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="mt-[16px] rounded-[12px] border border-risk-border bg-risk-bg px-[16px] py-[14px]"
      role="alert"
    >
      <h3 className="m-0 text-[14px] font-semibold text-risk-fg">{x(M.capacity_error_title)}</h3>
      <p className="mt-[6px] text-[13px] leading-[1.5] text-text-3">{x(M.capacity_error_body)}</p>
      <div className="mt-[12px]">
        <button type="button" className={secondaryClass} onClick={clearAdmissionStatus}>
          {x(M.capacity_dismiss)}
        </button>
      </div>
    </div>
  )
}
