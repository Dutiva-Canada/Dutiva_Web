import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { casesMessages as CM } from '@/i18n/messages/cases'
import { statusChipClass } from '@/components/chips'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'

/**
 * Cases tab for the production employee profile — open cases that
 * reference this employee, linking to the case detail page.
 */

function SectionHeading({ text }: { readonly text: string }) {
  return (
    <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
      {text}
    </div>
  )
}

export function EmployeeCasesTab({
  openCases,
}: Readonly<{ openCases: ProductionCase[] }>) {
  const { x } = useI18n()
  return (
    <>
      <SectionHeading text={x(M.employees_prod_cases_title)} />
      <div className="mb-[18px] overflow-hidden rounded-[12px] border border-border bg-surface">
        {openCases.length === 0 && (
          <div className="px-[18px] py-[14px] text-[13px] text-text-muted">
            {x(M.employees_prod_cases_none)}
          </div>
        )}
        {openCases.map((caze) => (
          <Link
            key={caze.id}
            to={`/app/cases/${caze.id}`}
            className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[12px] first:border-t-0 hover:bg-inset"
          >
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
              {caze.title}
            </span>
            <span className={statusChipClass(caze.status === 'in_review' ? 'warning' : 'info')}>
              {x(
                caze.status === 'in_review'
                  ? CM.cases_prod_status_in_review
                  : CM.cases_prod_status_open,
              )}
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
