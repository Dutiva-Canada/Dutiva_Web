import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useSpecialistsData } from '../SpecialistsDataContext'
import type { SpecialistEngagement, SpecialistEngagementType } from '../data/types'

const ENGAGEMENT_TYPES: NonNullable<SpecialistEngagementType>[] = ['call', 'email', 'meeting', 'contract', 'task']

const TYPE_LABELS: Record<NonNullable<SpecialistEngagementType>, keyof typeof M> = {
  call: 'spec_engagement_type_call',
  email: 'spec_engagement_type_email',
  meeting: 'spec_engagement_type_meeting',
  contract: 'spec_engagement_type_contract',
  task: 'spec_engagement_type_task',
}

function generateId() {
  return `se-${Math.random().toString(36).slice(2, 9)}`
}

function emptyEngagement(): SpecialistEngagement {
  return {
    id: generateId(),
    organization_id: '',
    specialist_id: '',
    engagement_date: null,
    engagement_type: 'call',
    summary: null,
    follow_up_date: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function EngagementRow({
  engagement,
  name,
  onEdit,
  onRemove,
}: {
  readonly engagement: SpecialistEngagement
  readonly name: string
  readonly onEdit: (engagement: SpecialistEngagement) => void
  readonly onRemove: (id: string) => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{name}</div>
        <div className="text-[12px] text-text-muted">
          {engagement.engagement_date}
          {engagement.engagement_type ? ` · ${x(M[TYPE_LABELS[engagement.engagement_type]])}` : null}
          {engagement.summary ? ` · ${engagement.summary}` : null}
          {engagement.follow_up_date ? ` · ${x(M.spec_upcoming_followup)} ${engagement.follow_up_date}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        {engagement.engagement_type ? (
          <span className={statusChipClass('info')}>{x(M[TYPE_LABELS[engagement.engagement_type]])}</span>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(engagement)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.spec_edit)}
        </button>
        <button
          type="button"
          onClick={() => onRemove(engagement.id)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.spec_remove)}
        </button>
      </div>
    </div>
  )
}

export function Engagements() {
  const { x } = useI18n()
  const { specialists, engagements, addEngagement, updateEngagement, removeEngagement } = useSpecialistsData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<SpecialistEngagement | null>(null)

  const initial = editing ?? emptyEngagement()
  const [specialistId, setSpecialistId] = useState(initial.specialist_id || specialists[0]?.id || '')
  const [engagementDate, setEngagementDate] = useState(initial.engagement_date ?? '')
  const [engagementType, setEngagementType] = useState<NonNullable<SpecialistEngagementType>>(
    initial.engagement_type ?? 'call',
  )
  const [summary, setSummary] = useState(initial.summary ?? '')
  const [followUpDate, setFollowUpDate] = useState(initial.follow_up_date ?? '')

  const namesById = new Map(specialists.map((s) => [s.id, s.name]))

  useEffect(() => {
    const base = editing ?? emptyEngagement()
    setSpecialistId(base.specialist_id || specialists[0]?.id || '')
    setEngagementDate(base.engagement_date ?? '')
    setEngagementType(base.engagement_type ?? 'call')
    setSummary(base.summary ?? '')
    setFollowUpDate(base.follow_up_date ?? '')
  }, [editing, specialists])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyEngagement()
    setSpecialistId(base.specialist_id || specialists[0]?.id || '')
    setEngagementDate(base.engagement_date ?? '')
    setEngagementType(base.engagement_type ?? 'call')
    setSummary(base.summary ?? '')
    setFollowUpDate(base.follow_up_date ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const engagement: SpecialistEngagement = {
      ...(editing ?? emptyEngagement()),
      specialist_id: specialistId || specialists[0]?.id || '',
      engagement_date: engagementDate || null,
      engagement_type: engagementType,
      summary: summary || null,
      follow_up_date: followUpDate || null,
      updated_at: now,
    }
    if (editing) {
      await updateEngagement(engagement)
    } else {
      await addEngagement({ ...engagement, created_at: now })
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
          {x(show && !editing ? M.spec_cancel : M.spec_add_engagement)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.spec_engagement_specialist)}>
            <FormSelect value={specialistId} onChange={(e) => setSpecialistId(e.target.value)}>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.spec_engagement_type)}>
            <FormSelect
              value={engagementType}
              onChange={(e) => setEngagementType(e.target.value as NonNullable<SpecialistEngagementType>)}
            >
              {ENGAGEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.spec_engagement_date)}>
            <FormInput type="date" value={engagementDate} onChange={(e) => setEngagementDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.spec_follow_up_date)}>
            <FormInput type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.spec_engagement_summary)} className="sm:col-span-2">
            <FormTextarea value={summary} onChange={(e) => setSummary(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.spec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.spec_save_changes : M.spec_save)}
            </button>
          </div>
        </div>
      ) : null}

      {engagements.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.spec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {engagements.map((engagement) => (
            <EngagementRow
              key={engagement.id}
              engagement={engagement}
              name={namesById.get(engagement.specialist_id) ?? 'Unknown'}
              onEdit={(e) => { setEditing(e); setShow(true) }}
              onRemove={removeEngagement}
            />
          ))}
        </div>
      )}
    </div>
  )
}
