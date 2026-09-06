import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pause, Play, Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useCommsData } from '../data/useCommsData'
import type { CommsDomain, CommsInitiativeStatus, CommsInitiativeType, CommsRiskLevel } from '../data/types'
import {
  DOMAIN_LABEL,
  INITIATIVE_STATUS_LABEL,
  INITIATIVE_TYPE_LABEL,
  RISK_LABEL,
} from '../commsLabels'

const DOMAINS: CommsDomain[] = ['pr', 'corporate', 'social', 'public_affairs', 'marketing', 'advertising', 'imc']
const TYPES: CommsInitiativeType[] = [
  'campaign',
  'programme',
  'announcement',
  'policy_consultation',
  'event',
  'issue_response',
  'standalone',
]
const STATUSES: CommsInitiativeStatus[] = ['planning', 'active', 'paused', 'completed', 'cancelled']
const RISKS: CommsRiskLevel[] = ['low', 'medium', 'high', 'critical']

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function Initiatives() {
  const { x, lang } = useI18n()
  const { state, canWrite, addInitiative, updateInitiative, removeInitiative, toggleInitiativePause } = useCommsData()
  const { identity } = useWorkspaceMode()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CommsInitiativeType>('campaign')
  const [domain, setDomain] = useState<CommsDomain>('marketing')
  const [owner, setOwner] = useState('')
  const [status, setStatus] = useState<CommsInitiativeStatus>('planning')
  const [risk, setRisk] = useState<CommsRiskLevel>('low')

  const reset = () => {
    setOpen(false)
    setEditingId(null)
    setTitle('')
    setType('campaign')
    setDomain('marketing')
    setOwner('')
    setStatus('planning')
    setRisk('low')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      title: { en: title, fr: `[FR] ${title}` },
      type,
      domain,
      owner,
      audience: { en: '', fr: '' },
      intendedOutcome: { en: '', fr: '' },
      risk,
      status,
    }
    if (editingId) {
      const existing = state.initiatives.find((i) => i.id === editingId)
      if (existing) {
        updateInitiative(editingId, { ...payload, title: existing.title.en !== title ? { en: title, fr: `[FR review] ${title}` } : existing.title })
      }
    } else {
      addInitiative(payload)
    }
    reset()
  }

  const startEdit = (initiative: import('../data/types').CommsInitiative) => {
    setEditingId(initiative.id)
    setTitle(initiative.title[lang])
    setType(initiative.type)
    setDomain(initiative.domain)
    setOwner(initiative.owner)
    setStatus(initiative.status)
    setRisk(initiative.risk)
    setOpen(true)
  }

  const sorted = useMemo(
    () => [...state.initiatives].sort((a, b) => a.title.en.localeCompare(b.title.en)),
    [state.initiatives],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h2 className="text-[18px] font-semibold text-text">{x(M.comms_initiatives_title)}</h2>
        {canWrite && !open && (
          <button
            type="button"
            onClick={() => {
              reset()
              setOpen(true)
            }}
            className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_initiatives_add)}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_initiatives_name)}</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder={x(M.comms_initiatives_name)}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_type)}</label>
              <select value={type} onChange={(e) => setType(e.target.value as CommsInitiativeType)} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{x(INITIATIVE_TYPE_LABEL[t])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_domain)}</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value as CommsDomain)} className={inputClass}>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{x(DOMAIN_LABEL[d])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_owner)}</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_status)}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as CommsInitiativeStatus)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{x(INITIATIVE_STATUS_LABEL[s])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_risk)}</label>
              <select value={risk} onChange={(e) => setRisk(e.target.value as CommsRiskLevel)} className={inputClass}>
                {RISKS.map((r) => (
                  <option key={r} value={r}>{x(RISK_LABEL[r])}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white">
              {x(editingId ? M.comms_save : M.comms_create)}
            </button>
            <button type="button" onClick={reset} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
              {x(M.comms_cancel)}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_initiatives_empty)}</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {sorted.map((init) => (
            <div key={init.id} className="rounded-[12px] border border-border bg-surface p-[16px]">
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div>
                  <Link to={`/app/comms/initiatives/${init.id}`} className="text-[14.5px] font-semibold text-accent no-underline hover:underline">
                    {x(init.title)}
                  </Link>
                  <div className="text-[12px] text-text-muted">
                    {x(INITIATIVE_TYPE_LABEL[init.type])} · {x(DOMAIN_LABEL[init.domain])} · {init.owner}
                  </div>
                </div>
                <span className={statusChipClass(init.status === 'active' ? 'success' : init.status === 'cancelled' ? 'risk' : 'neutral')}>
                  {x(INITIATIVE_STATUS_LABEL[init.status])}
                </span>
              </div>
              <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
                <span className={statusChipClass(init.risk === 'critical' ? 'risk' : init.risk === 'high' ? 'warning' : 'neutral')}>
                  {x(RISK_LABEL[init.risk])}
                </span>
                {canWrite && (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(init)}
                      className="text-[12px] font-semibold text-accent"
                    >
                      {x(M.comms_edit)}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleInitiativePause(init.id, init.status !== 'paused', identity.user.name)}
                      className="flex items-center gap-[3px] text-[12px] font-semibold text-text-2"
                    >
                      {init.status === 'paused' ? <Play size={12} /> : <Pause size={12} />}
                      {init.status === 'paused' ? x(M.comms_initiative_resume_publications) : x(M.comms_initiative_pause_publications)}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeInitiative(init.id)}
                      className="text-[12px] font-semibold text-risk-fg"
                    >
                      {x(M.comms_remove)}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
