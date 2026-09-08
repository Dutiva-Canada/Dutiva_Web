import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pause, Play, Plus, X } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'

import { useCommsData } from '../data/useCommsData'
import { useInitiatives } from '../data/useInitiatives'
import type {
  CommsDomain,
  CommsInitiative,
  CommsInitiativeStatus,
  CommsInitiativeType,
  CommsRiskLevel,
} from '../data/types'
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

function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function InitiativeForm({
  editing,
  onCancel,
  onAdd,
  onUpdate,
}: {
  editing?: CommsInitiative
  onCancel: () => void
  onAdd: (item: Omit<CommsInitiative, 'id'>) => Promise<CommsInitiative | null>
  onUpdate: (id: string, patch: Partial<CommsInitiative>) => Promise<CommsInitiative | null>
}) {
  const { x, lang } = useI18n()
  const [title, setTitle] = useState(editing?.title[lang] ?? '')
  const [type, setType] = useState<CommsInitiativeType>(editing?.type ?? 'campaign')
  const [domain, setDomain] = useState<CommsDomain>(editing?.domain ?? 'marketing')
  const [owner, setOwner] = useState(editing?.owner ?? '')
  const [status, setStatus] = useState<CommsInitiativeStatus>(editing?.status ?? 'planning')
  const [risk, setRisk] = useState<CommsRiskLevel>(editing?.risk ?? 'low')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const titleBi = biInput(title, lang) ?? { en: title, fr: `[FR review] ${title}` }
    const payload: Omit<CommsInitiative, 'id'> = {
      title: titleBi,
      type,
      domain,
      owner,
      audience: { en: '', fr: '' },
      intendedOutcome: { en: '', fr: '' },
      risk,
      status,
    }
    if (editing) {
      await onUpdate(editing.id, payload)
    } else {
      await onAdd(payload)
    }
    onCancel()
  }

  return (
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
          {x(editing ? M.comms_save : M.comms_create)}
        </button>
        <button type="button" onClick={onCancel} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
          {x(M.comms_cancel)}
        </button>
      </div>
    </form>
  )
}

function ObjectivesSection({ initiatives }: { initiatives: CommsInitiative[] }) {
  const { x, lang } = useI18n()
  const { state, canWrite, addObjective, removeObjective } = useCommsData()
  const [open, setOpen] = useState(false)
  const [initiativeId, setInitiativeId] = useState('')
  const [label, setLabel] = useState('')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [period, setPeriod] = useState('')
  const [owner, setOwner] = useState('')
  const [evidence, setEvidence] = useState('')

  const reset = () => {
    setOpen(false)
    setInitiativeId('')
    setLabel('')
    setBaseline('')
    setTarget('')
    setPeriod('')
    setOwner('')
    setEvidence('')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!initiativeId || !label.trim() || !owner.trim()) return
    addObjective({
      initiativeId,
      label: biInput(label, lang) ?? { en: label.trim(), fr: `[FR review] ${label.trim()}` },
      baseline: baseline.trim() || undefined,
      target: target.trim() || undefined,
      period: biInput(period, lang),
      owner: owner.trim(),
      evidenceSource: biInput(evidence, lang),
    })
    reset()
  }

  const grouped = useMemo(() => {
    const byInitiative: Record<string, typeof state.objectives> = {}
    for (const obj of state.objectives) {
      const list = byInitiative[obj.initiativeId] ?? (byInitiative[obj.initiativeId] = [])
      list.push(obj)
    }
    return byInitiative
  }, [state.objectives])

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex items-center justify-between gap-[12px]">
        <h3 className="text-[15px] font-semibold text-text">{x(M.comms_objectives_title)}</h3>
        {canWrite && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_objective_add)}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div>
              <label className={labelClass}>{x(M.comms_objective_initiative)}</label>
              <select
                value={initiativeId}
                onChange={(e) => setInitiativeId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">{x(M.comms_org_none)}</option>
                {initiatives.map((i) => (
                  <option key={i.id} value={i.id}>{x(i.title)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_objective_owner)}</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_objective_label)}</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_objective_baseline)}</label>
              <input value={baseline} onChange={(e) => setBaseline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_objective_target)}</label>
              <input value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_objective_period)}</label>
              <input value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_objective_evidence)}</label>
              <input value={evidence} onChange={(e) => setEvidence(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white">
              {x(M.comms_create)}
            </button>
            <button type="button" onClick={reset} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
              {x(M.comms_cancel)}
            </button>
          </div>
        </form>
      )}

      {state.objectives.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_objectives_empty)}</p>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {initiatives.map((init) => {
            const objectives = grouped[init.id]
            if (!objectives || objectives.length === 0) return null
            return (
              <div key={init.id}>
                <div className="mb-[6px] text-[13px] font-semibold text-text">{x(init.title)}</div>
                <ul className="m-0 flex flex-col gap-[8px] p-0">
                  {objectives.map((obj) => (
                    <li key={obj.id} className="rounded-[8px] bg-inset p-[12px]">
                      <div className="flex items-start justify-between gap-[12px]">
                        <div>
                          <div className="text-[14px] font-semibold text-text">{x(obj.label)}</div>
                          <div className="text-[12px] text-text-muted">
                            {obj.baseline ? `${x(M.comms_objective_baseline)}: ${obj.baseline}` : ''}
                            {obj.baseline && obj.target ? ' · ' : ''}
                            {obj.target ? `${x(M.comms_objective_target)}: ${obj.target}` : ''}
                          </div>
                        </div>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => removeObjective(obj.id)}
                            aria-label={x(M.comms_remove)}
                            className="text-text-muted hover:text-risk-fg"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {obj.period && (
                        <div className="mt-[4px] text-[12px] text-text-2">{x(obj.period)}</div>
                      )}
                      {obj.evidenceSource && (
                        <div className="text-[12px] text-text-2">{x(obj.evidenceSource)}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function Initiatives() {
  const { x } = useI18n()
  const {
    initiatives,
    canWrite,
    addInitiative,
    updateInitiative,
    removeInitiative,
    toggleInitiativePause,
  } = useInitiatives()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = useMemo(() => initiatives.find((i) => i.id === editingId), [editingId, initiatives])

  const onCancel = () => {
    setOpen(false)
    setEditingId(null)
  }

  const startEdit = (initiative: CommsInitiative) => {
    setEditingId(initiative.id)
    setOpen(true)
  }

  const sorted = useMemo(
    () => [...initiatives].sort((a, b) => a.title.en.localeCompare(b.title.en)),
    [initiatives],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h2 className="text-[18px] font-semibold text-text">{x(M.comms_initiatives_title)}</h2>
        {canWrite && !open && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setOpen(true)
            }}
            className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_initiatives_add)}
          </button>
        )}
      </div>

      {open && <InitiativeForm editing={editing} onCancel={onCancel} onAdd={addInitiative} onUpdate={updateInitiative} />}

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
                      onClick={() => toggleInitiativePause(init.id, init.status !== 'paused')}
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

      <ObjectivesSection initiatives={initiatives} />
    </div>
  )
}
