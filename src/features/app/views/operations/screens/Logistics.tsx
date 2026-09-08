import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsLogistics, OperationsLogisticsStatus } from '../data/types'

const STATUS_LABELS: Record<OperationsLogisticsStatus, keyof typeof M> = {
  in_transit: 'ops_logistics_status_in_transit',
  delivered: 'ops_logistics_status_delivered',
  delayed: 'ops_logistics_status_delayed',
  returned: 'ops_logistics_status_returned',
}

const STATUS_TONE: Record<OperationsLogisticsStatus, 'warning' | 'success' | 'risk' | 'neutral'> = {
  in_transit: 'warning',
  delivered: 'success',
  delayed: 'risk',
  returned: 'neutral',
}

function LogisticsRow({ row }: { readonly row: OperationsLogistics }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{row.title}</div>
        <div className="text-[12px] text-text-muted">
          {row.expected_date ? `expected ${row.expected_date}` : null}
          {row.delivered_date ? ` · delivered ${row.delivered_date}` : null}
          {row.notes ? ` · ${row.notes}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[row.status])}>{x(M[STATUS_LABELS[row.status]])}</span>
    </div>
  )
}

export function Logistics() {
  const { x } = useI18n()
  const { logistics } = useOperationsData()

  if (logistics.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {logistics.map((row) => (
        <LogisticsRow key={row.id} row={row} />
      ))}
    </div>
  )
}
