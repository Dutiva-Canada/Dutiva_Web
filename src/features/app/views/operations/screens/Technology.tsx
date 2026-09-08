import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsTechnology, OperationsTechnologyStatus, OperationsTechnologyType } from '../data/types'

const TYPE_LABELS: Record<NonNullable<OperationsTechnologyType>, keyof typeof M> = {
  internal: 'ops_tech_type_internal',
  customer_facing: 'ops_tech_type_customer_facing',
  integration: 'ops_tech_type_integration',
  infrastructure: 'ops_tech_type_infrastructure',
}

const STATUS_LABELS: Record<OperationsTechnologyStatus, keyof typeof M> = {
  active: 'ops_tech_status_active',
  deprecated: 'ops_tech_status_deprecated',
  planned: 'ops_tech_status_planned',
}

const STATUS_TONE: Record<OperationsTechnologyStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  deprecated: 'neutral',
  planned: 'warning',
}

function TechnologyRow({ tech }: { readonly tech: OperationsTechnology }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{tech.name}</div>
        <div className="text-[12px] text-text-muted">
          {tech.system_type ? x(M[TYPE_LABELS[tech.system_type]]) : null}
          {tech.renewal_date ? ` · renewal ${tech.renewal_date}` : null}
          {tech.integration_notes ? ` · ${tech.integration_notes}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[tech.status])}>{x(M[STATUS_LABELS[tech.status]])}</span>
    </div>
  )
}

export function Technology() {
  const { x } = useI18n()
  const { technology } = useOperationsData()

  if (technology.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {technology.map((tech) => (
        <TechnologyRow key={tech.id} tech={tech} />
      ))}
    </div>
  )
}
