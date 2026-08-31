import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useEscapeToClose } from '@/lib/escapeStack'
import { employeesMessages as M } from '@/i18n/messages/employees'
import type { Employee } from '@/data'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { statusChipClass } from '@/components/chips'
import { RiskFlagCard } from './RiskFlagCard'
import { useAskAdvisorAboutEmployee } from './useAskAdvisorAboutEmployee'

/**
 * Employee quick drawer — the 400px right-hand profile peek (prototype
 * `employeeDrawerView`, markup 1974–2003 + `buildEmployeeDrawerView()`):
 * identity header, the Advisor insight line, the risk-flag card with its
 * "Open full case" action, and a full-width "Ask Advisor about {name}" CTA.
 *
 * Controlled component: the prototype keeps the subject in state
 * (`openEmployeeDrawer(emp)`), so hosts own `employee` and `onClose`.
 */
export interface EmployeeDrawerProps {
  readonly employee: Employee | null
  readonly onClose: () => void
}

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  const { x } = useI18n()
  const navigate = useNavigate()
  const askAdvisor = useAskAdvisorAboutEmployee()

  const open = employee !== null
  useEscapeToClose(open, onClose)

  if (!employee) return null

  const risk = employee.risk
  const chatId = risk?.chatId ?? null

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label={x(M.employees_drawer_close)}
        className="fixed inset-0 z-285 cursor-default border-none bg-overlay-scrim-soft"
      />
      <dialog
        open
        aria-modal="true"
        aria-label={x(M.employees_drawer_aria)}
        className="fixed top-0 right-0 bottom-0 z-286 m-0 flex w-[min(400px,100%)] animate-[slideInRight_.2s_ease] flex-col bg-surface font-sans shadow-[-20px_0_50px_rgba(0,0,0,0.2)]"
      >
        <div className="border-b border-border-soft px-[22px] pt-[22px] pb-[18px]">
          <button
            type="button"
            onClick={onClose}
            aria-label={x(M.employees_drawer_close)}
            className="float-right flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-inset"
          >
            <X size={14} strokeWidth={2} className="text-text-3" aria-hidden="true" />
          </button>
          <div className="mb-[10px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-accent-soft text-[15px] font-bold text-accent">
            {employee.initials}
          </div>
          <div className="font-display text-[19px] font-semibold text-text">{employee.name}</div>
          <div className="mt-[2px] text-[13px] text-text-3">
            {x(employee.role)} · {x(employee.jurisdiction)}
          </div>
          <div className="mt-[10px] flex gap-[8px]">
            <span className={statusChipClass(employee.tone)}>{x(employee.status)}</span>
            <span className="py-[3px] text-[12px] text-text-muted">{x(employee.tenure)}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-[14px] overflow-y-auto px-[22px] py-[20px]">
          <div className="text-[13.5px] leading-[1.6] text-text-2">{x(employee.insight)}</div>
          {risk && (
            <RiskFlagCard
              tone={risk.tone}
              title={risk.title}
              body={risk.body}
              actions={
                chatId
                  ? [
                      {
                        label: M.employees_open_full_case,
                        primary: true,
                        onClick: () => {
                          onClose()
                          navigate('/app/advisor', {
                            state: { chatId } satisfies AdvisorSearchNavState,
                          })
                        },
                      },
                    ]
                  : []
              }
            />
          )}
        </div>

        <div className="border-t border-border-soft px-[22px] pt-[16px] pb-[20px]">
          <button
            type="button"
            onClick={() => {
              onClose()
              askAdvisor(employee)
            }}
            className="w-full cursor-pointer rounded-[9px] border-none bg-navy p-[11px] font-sans text-[13.5px] font-bold text-white"
          >
            {x(M.employees_drawer_ask_about)} {employee.name}
          </button>
        </div>
      </dialog>
    </>
  )
}
