import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import type { Bi } from '@/i18n/core'
import type { ChipTone } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { useStakeholders } from '../data/useStakeholders'
import { useInitiatives } from '../data/useInitiatives'
import type { CommsContact, CommsInitiative } from '../data/types'
import type {
  CommsInteractionStatus,
  CommsInteractionType,
  CommsInteractionVisibility,
} from '../data/types'
import { INTERACTION_TYPE_LABEL } from '../commsLabels'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const INTERACTION_TYPES: CommsInteractionType[] = ['inquiry', 'comment', 'dm', 'pitch', 'meeting', 'submission']
const INTERACTION_STATUSES: CommsInteractionStatus[] = ['open', 'pending', 'responded', 'escalated', 'closed']
const VISIBILITIES: CommsInteractionVisibility[] = ['public', 'internal', 'restricted']

const VISIBILITY_LABEL: Record<CommsInteractionVisibility, keyof typeof M> = {
  public: 'comms_visibility_public',
  internal: 'comms_visibility_internal',
  restricted: 'comms_visibility_restricted',
}

const STATUS_TONE: Record<CommsInteractionStatus, ChipTone> = {
  open: 'warning',
  pending: 'warning',
  responded: 'success',
  escalated: 'risk',
  closed: 'neutral',
}

function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function InteractionForm({
  onCancel,
  contacts,
  initiatives,
}: {
  onCancel: () => void
  contacts: CommsContact[]
  initiatives: CommsInitiative[]
}) {
  const { x, lang } = useI18n()
  const { addInteraction } = useCommsData()
  const [type, setType] = useState<CommsInteractionType>('inquiry')
  const [source, setSource] = useState('')
  const [visibility, setVisibility] = useState<CommsInteractionVisibility>('internal')
  const [summary, setSummary] = useState('')
  const [responseTarget, setResponseTarget] = useState('')
  const [owner, setOwner] = useState('')
  const [status, setStatus] = useState<CommsInteractionStatus>('open')
  const [contactId, setContactId] = useState('')
  const [initiativeId, setInitiativeId] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [moderationReason, setModerationReason] = useState('')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!owner.trim() || !summary.trim()) return
    addInteraction({
      type,
      source: biInput(source, lang) ?? { en: 'Unknown', fr: 'Inconnu' },
      visibility,
      summary: biInput(summary, lang) ?? { en: '', fr: '' },
      responseTarget: responseTarget || undefined,
      owner: owner.trim(),
      status,
      contactId: contactId || undefined,
      initiativeId: initiativeId || undefined,
      escalationReason: biInput(escalationReason, lang),
      moderationReason: biInput(moderationReason, lang),
    })
    onCancel()
  }

  return (
    <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div>
          <label className={labelClass}>{x(M.comms_engagement_inquiry)}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CommsInteractionType)}
            className={inputClass}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>{x(INTERACTION_TYPE_LABEL[t])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_visibility)}</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as CommsInteractionVisibility)}
            className={inputClass}
          >
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>{x(M[VISIBILITY_LABEL[v]])}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_engagement_summary)}</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
            required
          />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_source)}</label>
          <input value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_target)}</label>
          <input
            type="date"
            value={responseTarget}
            onChange={(e) => setResponseTarget(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_owner)}</label>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_status)}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CommsInteractionStatus)}
            className={inputClass}
          >
            {INTERACTION_STATUSES.map((s) => (
              <option key={s} value={s}>{x(M[`comms_interaction_status_${s}` as keyof typeof M])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_contact)}</label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={inputClass}
          >
            <option value="">{x(M.comms_org_none)}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_initiative)}</label>
          <select
            value={initiativeId}
            onChange={(e) => setInitiativeId(e.target.value)}
            className={inputClass}
          >
            <option value="">{x(M.comms_org_none)}</option>
            {initiatives.map((i) => (
              <option key={i.id} value={i.id}>{x(i.title)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_escalation)}</label>
          <input value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_moderation)}</label>
          <input value={moderationReason} onChange={(e) => setModerationReason(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="mt-[14px] flex gap-[8px]">
        <button
          type="submit"
          className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
        >
          {x(M.comms_create)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
        >
          {x(M.comms_cancel)}
        </button>
      </div>
    </form>
  )
}

export function Engagement() {
  const { x } = useI18n()
  const { state, canWrite, removeInteraction } = useCommsData()
  const { contacts } = useStakeholders()
  const { initiatives } = useInitiatives()
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h2 className="text-[18px] font-semibold text-text">{x(M.comms_engagement_title)}</h2>
        {canWrite && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_engagement_add)}
          </button>
        )}
      </div>

      {adding && <InteractionForm onCancel={() => setAdding(false)} contacts={contacts} initiatives={initiatives} />}

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
                <div className="flex items-center gap-[8px]">
                  <span className={statusChipClass(STATUS_TONE[item.status])}>
                    {x(M[`comms_interaction_status_${item.status}` as keyof typeof M])}
                  </span>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => removeInteraction(item.id)}
                      aria-label={x(M.comms_remove)}
                      className="text-text-muted hover:text-risk-fg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-[10px] text-[13px] leading-normal text-text-2">{x(item.summary)}</p>
              {item.escalationReason && (
                <div className="mt-[8px] rounded-[8px] bg-risk-bg px-[12px] py-[8px] text-[12px] text-risk-fg">
                  {x(item.escalationReason)}
                </div>
              )}
              {item.moderationReason && (
                <div className="mt-[8px] rounded-[8px] bg-gold-bg px-[12px] py-[8px] text-[12px] text-gold-fg">
                  {x(item.moderationReason)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
