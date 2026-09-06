import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { INTERACTION_TYPE_LABEL } from '../commsLabels'

const VISIBILITY_LABEL: Record<import('../data/types').CommsInteraction['visibility'], keyof typeof M> = {
  public: 'comms_visibility_public',
  internal: 'comms_visibility_internal',
  restricted: 'comms_visibility_restricted',
}

const STATUS_TONE: Record<import('../data/types').CommsInteraction['status'], import('@/components/chips').ChipTone> = {
  open: 'warning',
  pending: 'warning',
  responded: 'success',
  escalated: 'risk',
  closed: 'neutral',
}

export function Engagement() {
  const { x } = useI18n()
  const { state } = useCommsData()

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_engagement_title)}</h2>

      {state.interactions.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_engagement_empty)}</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {state.interactions.map((item) => (
            <div key={item.id} className="rounded-[12px] border border-border bg-surface p-[16px]">
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[14px] font-semibold text-text">{x(INTERACTION_TYPE_LABEL[item.type])}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(item.source)} · {x(M[VISIBILITY_LABEL[item.visibility]])} · {item.owner}
                    {item.responseTarget ? ` · ${x(M.comms_engagement_target)} ${item.responseTarget}` : ''}
                  </div>
                </div>
                <span className={statusChipClass(STATUS_TONE[item.status])}>
                  {x(M[`comms_interaction_status_${item.status}` as keyof typeof M])}
                </span>
              </div>
              <p className="mt-[10px] text-[13px] leading-normal text-text-2">{x(item.summary)}</p>
              {item.escalationReason && (
                <div className="mt-[8px] rounded-[8px] bg-risk-bg px-[12px] py-[8px] text-[12px] text-risk-fg">
                  {x(item.escalationReason)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
