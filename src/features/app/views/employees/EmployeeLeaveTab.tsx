import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { sourceChipClass } from '@/components/chips'
import type { ProductionLeave } from './productionApi'

/**
 * Leave tab for the production employee profile — leave records
 * (hr_leaves, status only). The parent owns the leave list; this
 * component owns the add-leave form state.
 */

const inputClass =
  'rounded-[10px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[13px] text-text'
const smallButtonClass =
  'cursor-pointer rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text'
const primaryButtonClass =
  'cursor-pointer rounded-[10px] border-none bg-navy px-[14px] py-[8px] font-sans text-[12.5px] font-semibold text-white disabled:opacity-60'

function SectionHeading({ text }: { readonly text: string }) {
  return (
    <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
      {text}
    </div>
  )
}

export function EmployeeLeaveTab({
  isOrgAdmin,
  leaves,
  onAddLeave,
  onEndLeave,
}: Readonly<{
  isOrgAdmin: boolean
  leaves: ProductionLeave[]
  onAddLeave: (data: {
    leaveType: string
    isProtected: boolean
    startDate: string | null
    expectedReturnDate: string | null
  }) => Promise<void>
  onEndLeave: (id: string) => Promise<void>
}>) {
  const { x } = useI18n()
  const [leaveType, setLeaveType] = useState('')
  const [leaveProtected, setLeaveProtected] = useState(false)
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveReturn, setLeaveReturn] = useState('')
  const [leaveSaving, setLeaveSaving] = useState(false)

  const currentLeaves = leaves.filter((l) => l.endedOn === null)
  const endedLeaves = leaves.filter((l) => l.endedOn !== null)

  const submit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!leaveType.trim() || leaveSaving) return
    setLeaveSaving(true)
    try {
      await onAddLeave({
        leaveType: leaveType.trim(),
        isProtected: leaveProtected,
        startDate: leaveStart || null,
        expectedReturnDate: leaveReturn || null,
      })
      setLeaveType('')
      setLeaveProtected(false)
      setLeaveStart('')
      setLeaveReturn('')
    } finally {
      setLeaveSaving(false)
    }
  }

  return (
    <>
      <SectionHeading text={x(M.employees_prod_leave_title)} />
      <div className="mb-[12px] overflow-hidden rounded-[12px] border border-border bg-surface">
        {leaves.length === 0 && (
          <div className="px-[18px] py-[14px] text-[13px] text-text-muted">
            {x(M.employees_prod_leave_empty)}
          </div>
        )}
        {[...currentLeaves, ...endedLeaves].map((leave) => (
          <div
            key={leave.id}
            className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
          >
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
              {leave.leaveType}
            </span>
            {leave.isProtected && (
              <span className={`${sourceChipClass('info')} items-center`}>
                <ShieldCheck
                  size={11}
                  strokeWidth={1.9}
                  className="mr-[4px]"
                  aria-hidden="true"
                />
                {x(M.employees_prod_leave_protected)}
              </span>
            )}
            <span className="shrink-0 text-[12.5px] text-text-2">
              {leave.endedOn !== null
                ? x(M.employees_prod_leave_ended_on).replace('{date}', leave.endedOn)
                : leave.expectedReturnDate !== null
                  ? x(M.employees_prod_leave_returns).replace(
                      '{date}',
                      leave.expectedReturnDate,
                    )
                  : x(M.employees_prod_leave_current)}
            </span>
            {isOrgAdmin && leave.endedOn === null && (
              <button
                type="button"
                onClick={() => void onEndLeave(leave.id)}
                className={smallButtonClass}
              >
                {x(M.employees_prod_leave_end)}
              </button>
            )}
          </div>
        ))}
      </div>
      {isOrgAdmin && (
        <form
          onSubmit={(e) => void submit(e)}
          className="mb-[18px] flex flex-wrap items-end gap-[8px]"
        >
          <label className="flex min-w-[180px] flex-1 flex-col gap-[4px]">
            <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.employees_prod_leave_type)}
            </span>
            <input
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              placeholder={x(M.employees_prod_leave_type_placeholder)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.employees_prod_leave_start)}
            </span>
            <input
              type="date"
              value={leaveStart}
              onChange={(e) => setLeaveStart(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.employees_prod_leave_return)}
            </span>
            <input
              type="date"
              value={leaveReturn}
              onChange={(e) => setLeaveReturn(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-[6px] pb-[9px] text-[12.5px] text-text-2">
            <input
              type="checkbox"
              checked={leaveProtected}
              onChange={(e) => setLeaveProtected(e.target.checked)}
            />
            {x(M.employees_prod_leave_protected)}
          </label>
          <button
            type="submit"
            disabled={leaveSaving || !leaveType.trim()}
            className={primaryButtonClass}
          >
            {x(M.employees_prod_leave_add)}
          </button>
        </form>
      )}
    </>
  )
}

