import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { isAdminRole } from '@/features/app/workspaceMode/roles'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL, PAY_RUN_STATUS_LABEL } from '../financeLabels'
import type { FinancePayRunStatus } from '../data/types'

const FILTERS: ('all' | FinancePayRunStatus)[] = [
  'all', 'inputs_open', 'inputs_approved', 'submitted', 'results_imported', 'reconciled', 'exception',
]

const VALID_TRANSITIONS: Record<FinancePayRunStatus, { status: FinancePayRunStatus; label: keyof typeof M }[]> = {
  inputs_open: [{ status: 'inputs_approved', label: 'finance_payroll_mark_inputs_approved' }],
  inputs_approved: [{ status: 'submitted', label: 'finance_payroll_mark_submitted' }],
  submitted: [{ status: 'results_imported', label: 'finance_payroll_mark_results' }],
  results_imported: [{ status: 'reconciled', label: 'finance_payroll_mark_reconciled' }],
  reconciled: [],
  exception: [{ status: 'results_imported', label: 'finance_payroll_mark_results' }],
}

export function Payroll() {
  const { x } = useI18n()
  const { memberRole, mode } = useWorkspaceMode()
  const { state, canWrite, transitionPayRunStatus } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinancePayRunStatus>('all')

  const payRuns = useMemo(
    () => (filter === 'all' ? state.payRuns : state.payRuns.filter((pr) => pr.status === filter)),
    [state.payRuns, filter],
  )

  const periodLabel = (id: string) => state.payPeriods.find((p) => p.id === id)?.label ?? id

  // In production mode, payroll records are sensitive — RLS returns no rows
  // for non-admins. Show an explicit notice instead of an empty list.
  // In demo mode, everyone sees the fixture data.
  const isRestricted = mode === 'production' && !isAdminRole(memberRole)

  if (isRestricted) {
    return (
      <div className="flex flex-col gap-[16px]">
        <div className="flex items-start gap-[10px] rounded-[10px] bg-inset px-[12px] py-[8px] text-[12px] text-text-muted">
          <Lock size={14} className="mt-[2px] shrink-0" />
          <span>{x(M.finance_payroll_admin_only)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[10px] bg-inset px-[12px] py-[8px] text-[12px] text-text-muted">
        {x(M.finance_payroll_restricted)}
      </div>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_payroll_runs)}</h2>
        <div className="mb-[12px] flex flex-wrap gap-[6px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-[8px] px-[10px] py-[5px] text-[12px] font-semibold transition-colors ${
                filter === f ? 'bg-navy text-white' : 'bg-inset text-text-2 hover:bg-surface border border-border'
              }`}
            >
              {f === 'all' ? x(M.finance_filter_all) : x(PAY_RUN_STATUS_LABEL[f])}
            </button>
          ))}
        </div>
        {payRuns.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_payroll_no_runs)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {payRuns.map((pr) => (
              <li key={pr.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{periodLabel(pr.periodId)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_payroll_gross)}: {x(CURRENCY_LABEL[pr.currency])} {pr.grossPay} ·{' '}
                      {x(M.finance_payroll_deductions)}: {pr.employeeDeductions} ·{' '}
                      {x(M.finance_payroll_employer)}: {pr.employerContributions} ·{' '}
                      {x(M.finance_payroll_net)}: {pr.netPay} ·{' '}
                      {x(M.finance_payroll_fees)}: {pr.providerFees}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_payroll_jurisdictions)}: {pr.jurisdictions.join(', ')} ·{' '}
                      {x(M.finance_source)}: {x(pr.calculationSource)}
                      {pr.ruleVersion && ` · ${pr.ruleVersion}`}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      pr.status === 'reconciled' ? 'success' : pr.status === 'exception' ? 'risk' : 'warning',
                    )}
                  >
                    {x(PAY_RUN_STATUS_LABEL[pr.status])}
                  </span>
                </div>
                {pr.exceptions && pr.exceptions.length > 0 && (
                  <div className="rounded-[6px] border border-risk-border bg-risk-surface px-[10px] py-[6px]">
                    <div className="text-[12px] font-semibold text-risk-fg">{x(M.finance_payroll_exceptions)}</div>
                    <ul className="m-0 mt-[4px] flex flex-col gap-[2px] p-0">
                      {pr.exceptions.map((exc, idx) => (
                        <li key={idx} className="text-[12px] text-risk-fg">{x(exc)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {canWrite && VALID_TRANSITIONS[pr.status].length > 0 && (
                  <div className="flex flex-wrap gap-[6px]">
                    {VALID_TRANSITIONS[pr.status].map((t) => (
                      <button
                        key={t.status}
                        type="button"
                        onClick={() => transitionPayRunStatus(pr.id, t.status, 'Workspace user')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M[t.label])}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_payroll_liabilities)}</h2>
        {state.payrollLiabilities.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.payrollLiabilities.map((liab) => (
              <li key={liab.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{liab.type}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(CURRENCY_LABEL[liab.currency])} {liab.amount} · {x(M.finance_due_date)}: {liab.dueDate}
                  </div>
                </div>
                <span className={statusChipClass(liab.settled ? 'success' : 'warning')}>
                  {liab.settled ? 'Settled' : 'Outstanding'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
