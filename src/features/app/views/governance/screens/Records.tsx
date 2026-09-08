import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceRecord, GovernanceRecordStatus, GovernanceRecordType } from '../data/types'

const RECORD_TYPE_LABELS: Record<GovernanceRecordType, keyof typeof M> = {
  articles: 'gov_record_type_articles',
  bylaw: 'gov_record_type_bylaw',
  resolution: 'gov_record_type_resolution',
  minutes: 'gov_record_type_minutes',
  register: 'gov_record_type_register',
}

const STATUS_LABELS: Record<GovernanceRecordStatus, keyof typeof M> = {
  active: 'gov_status_active',
  superseded: 'gov_status_superseded',
  pending_review: 'gov_status_pending_review',
}

const STATUS_TONE: Record<GovernanceRecordStatus, 'success' | 'warning' | 'risk' | 'neutral'> = {
  active: 'success',
  superseded: 'neutral',
  pending_review: 'warning',
}

function RecordRow({ record }: { readonly record: GovernanceRecord }) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">
          {record.title}
        </div>
        <div className="text-[12px] text-text-muted">
          {x(M[RECORD_TYPE_LABELS[record.record_type]])}
          {record.jurisdiction ? ` · ${record.jurisdiction}` : null}
          {record.review_due_date ? ` · ${record.review_due_date}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        {record.document_id ? (
          <Link to={`${root}/documents/${record.document_id}`} className="text-[12px] text-accent hover:underline">
            {x(M.gov_link_document)}
          </Link>
        ) : null}
        <span className={statusChipClass(STATUS_TONE[record.status])}>{x(M[STATUS_LABELS[record.status]])}</span>
      </div>
    </div>
  )
}

export function Records() {
  const { x } = useI18n()
  const { records } = useGovernanceData()

  if (records.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {records.map((record) => (
        <RecordRow key={record.id} record={record} />
      ))}
    </div>
  )
}
