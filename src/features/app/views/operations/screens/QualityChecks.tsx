import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsQualityCheck, OperationsQualityStatus } from '../data/types'

const STATUS_LABELS: Record<OperationsQualityStatus, keyof typeof M> = {
  pending: 'ops_quality_status_pending',
  passed: 'ops_quality_status_passed',
  failed: 'ops_quality_status_failed',
  overdue: 'ops_quality_status_overdue',
}

const STATUS_TONE: Record<OperationsQualityStatus, 'warning' | 'success' | 'risk' | 'risk'> = {
  pending: 'warning',
  passed: 'success',
  failed: 'risk',
  overdue: 'risk',
}

function QualityRow({ check }: { readonly check: OperationsQualityCheck }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{check.title}</div>
        <div className="text-[12px] text-text-muted">
          {check.due_date ? `due ${check.due_date}` : null}
          {check.completed_date ? ` · completed ${check.completed_date}` : null}
          {check.non_conformance ? ` · ${check.non_conformance}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[check.status])}>{x(M[STATUS_LABELS[check.status]])}</span>
    </div>
  )
}

export function QualityChecks() {
  const { x } = useI18n()
  const { qualityChecks } = useOperationsData()

  if (qualityChecks.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {qualityChecks.map((check) => (
        <QualityRow key={check.id} check={check} />
      ))}
    </div>
  )
}
