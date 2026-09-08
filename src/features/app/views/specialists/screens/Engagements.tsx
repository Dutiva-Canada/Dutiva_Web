import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { statusChipClass } from '@/components/chips'
import { useSpecialistsData } from '../SpecialistsDataContext'
import type { SpecialistEngagement, SpecialistEngagementType } from '../data/types'

const TYPE_LABELS: Record<NonNullable<SpecialistEngagementType>, keyof typeof M> = {
  call: 'spec_engagement_type_call',
  email: 'spec_engagement_type_email',
  meeting: 'spec_engagement_type_meeting',
  contract: 'spec_engagement_type_contract',
  task: 'spec_engagement_type_task',
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
  const { specialists, engagements } = useSpecialistsData()

  const namesById = new Map(specialists.map((s) => [s.id, s.name]))

  if (engagements.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.spec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {engagements.map((engagement) => (
        <EngagementRow
          key={engagement.id}
          engagement={engagement}
          name={namesById.get(engagement.specialist_id) ?? 'Unknown'}
        />
      ))}
    </div>
  )
}
