import { useState } from 'react'
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

function EngagementRow({ engagement, name }: { readonly engagement: SpecialistEngagement; readonly name: string }) {
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
      {engagement.engagement_type ? (
        <span className={statusChipClass('info')}>{x(M[TYPE_LABELS[engagement.engagement_type]])}</span>
      ) : null}
    </div>
  )
}

export function Engagements() {
  const { x } = useI18n()
  const { specialists, engagements, addEngagement } = useSpecialistsData()

  const [show, setShow] = useState(false)
  const [specialistId, setSpecialistId] = useState('')
  const [engagementDate, setEngagementDate] = useState('')
  const [engagementType, setEngagementType] = useState<NonNullable<SpecialistEngagementType>>('call')
  const [summary, setSummary] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const namesById = new Map(specialists.map((s) => [s.id, s.name]))

  const reset = () => {
    setSpecialistId(specialists[0]?.id ?? '')
    setEngagementDate('')
    setEngagementType('call')
    setSummary('')
    setFollowUpDate('')
  }

  const onSubmit = async () => {
    const newEngagement: SpecialistEngagement = {
      id: generateId(),
      organization_id: '',
      specialist_id: specialistId || specialists[0]?.id || '',
      engagement_date: engagementDate || null,
      engagement_type: engagementType,
      summary: summary || null,
      follow_up_date: followUpDate || null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addEngagement(newEngagement)
    reset()
    setShow(false)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show ? M.spec_cancel : M.spec_add_engagement)}
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
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.spec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.spec_save)}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
