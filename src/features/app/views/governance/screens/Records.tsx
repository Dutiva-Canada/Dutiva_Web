import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormCheckbox } from '@/components/FormField'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceRecord, GovernanceRecordStatus, GovernanceRecordType } from '../data/types'

const RECORD_TYPES: GovernanceRecordType[] = ['articles', 'bylaw', 'resolution', 'minutes', 'register']
const STATUSES: GovernanceRecordStatus[] = ['active', 'superseded', 'pending_review']

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

const STATUS_TONE: Record<GovernanceRecordStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  superseded: 'neutral',
  pending_review: 'warning',
}

function generateId() {
  return `gr-${Math.random().toString(36).slice(2, 9)}`
}

function emptyRecord(): GovernanceRecord {
  return {
    id: generateId(),
    organization_id: '',
    title: '',
    record_type: 'resolution',
    jurisdiction: null,
    effective_date: null,
    review_due_date: null,
    status: 'active',
    viewer_visible: false,
    document_id: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function RecordRow({ record, onEdit }: { readonly record: GovernanceRecord; readonly onEdit: (record: GovernanceRecord) => void }) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{record.title}</div>
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
        <button
          type="button"
          onClick={() => onEdit(record)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.gov_edit)}
        </button>
      </div>
    </div>
  )
}

export function Records() {
  const { x } = useI18n()
  const { records, addRecord, updateRecord } = useGovernanceData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<GovernanceRecord | null>(null)

  const initial = editing ?? emptyRecord()
  const [title, setTitle] = useState(initial.title)
  const [recordType, setRecordType] = useState<GovernanceRecordType>(initial.record_type)
  const [jurisdiction, setJurisdiction] = useState(initial.jurisdiction ?? '')
  const [effectiveDate, setEffectiveDate] = useState(initial.effective_date ?? '')
  const [reviewDueDate, setReviewDueDate] = useState(initial.review_due_date ?? '')
  const [status, setStatus] = useState<GovernanceRecordStatus>(initial.status)
  const [viewerVisible, setViewerVisible] = useState(initial.viewer_visible)

  useEffect(() => {
    const base = editing ?? emptyRecord()
    setTitle(base.title)
    setRecordType(base.record_type)
    setJurisdiction(base.jurisdiction ?? '')
    setEffectiveDate(base.effective_date ?? '')
    setReviewDueDate(base.review_due_date ?? '')
    setStatus(base.status)
    setViewerVisible(base.viewer_visible)
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyRecord()
    setTitle(base.title)
    setRecordType(base.record_type)
    setJurisdiction(base.jurisdiction ?? '')
    setEffectiveDate(base.effective_date ?? '')
    setReviewDueDate(base.review_due_date ?? '')
    setStatus(base.status)
    setViewerVisible(base.viewer_visible)
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const record: GovernanceRecord = {
      ...(editing ?? emptyRecord()),
      title,
      record_type: recordType,
      jurisdiction: jurisdiction || null,
      effective_date: effectiveDate || null,
      review_due_date: reviewDueDate || null,
      status,
      viewer_visible: viewerVisible,
      created_by: null,
      updated_at: now,
    }
    if (editing) {
      await updateRecord(record)
    } else {
      await addRecord({ ...record, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.gov_cancel : M.gov_add_record)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.gov_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.gov_record_type)}>
            <FormSelect value={recordType} onChange={(e) => setRecordType(e.target.value as GovernanceRecordType)}>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[RECORD_TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.gov_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as GovernanceRecordStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.gov_jurisdiction)}>
            <FormInput value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_effective_date)}>
            <FormInput type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_review_due_date)}>
            <FormInput type="date" value={reviewDueDate} onChange={(e) => setReviewDueDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_viewer_visible)}>
            <FormCheckbox label={x(M.gov_viewer_visible)} checked={viewerVisible} onChange={setViewerVisible} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.gov_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.gov_save_changes : M.gov_save)}
            </button>
          </div>
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {records.map((record) => (
            <RecordRow key={record.id} record={record} onEdit={(r) => { setEditing(r); setShow(true) }} />
          ))}
        </div>
      )}
    </div>
  )
}
