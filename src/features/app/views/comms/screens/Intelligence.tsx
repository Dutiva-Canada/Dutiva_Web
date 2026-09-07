import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useCommsData } from '../data/useCommsData'
import type {
  CommsChannel,
  CommsIssueSeverity,
  CommsIssueStatus,
  CommsPolicyStage,
} from '../data/types'
import { ISSUE_SEVERITY_LABEL, ISSUE_STATUS_LABEL, POLICY_STAGE_LABEL } from '../commsLabels'
import { CoverageSection } from './CoverageSection'
import { FeedsSection } from './FeedsSection'
import { IntelligenceFeed } from './IntelligenceFeed'
import { SubmissionsSection } from './SubmissionsSection'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'
const checkboxClass =
  'h-[18px] w-[18px] rounded-[4px] border border-border bg-surface text-accent accent-accent'

const POLICY_STAGES: CommsPolicyStage[] = ['proposed', 'enacted', 'in_force', 'consultation_open', 'consultation_closed']
const ISSUE_SEVERITIES: CommsIssueSeverity[] = ['low', 'medium', 'high', 'critical']
const ISSUE_STATUSES: CommsIssueStatus[] = ['open', 'monitoring', 'resolved', 'closed']

const SEVERITY_TONE: Record<CommsIssueSeverity, 'neutral' | 'warning' | 'risk'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'warning',
  critical: 'risk',
}

function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function parseChannels(raw: string): CommsChannel[] {
  const cleaned = raw.split(',').map((c) => c.trim().toLowerCase().replace(/\s+/g, '_'))
  const valid: CommsChannel[] = [
    'email',
    'intranet',
    'social_linkedin',
    'social_x',
    'press_release',
    'website',
    'newsletter',
    'meeting',
    'other',
  ]
  return cleaned.filter((c): c is CommsChannel => valid.includes(c as CommsChannel))
}

function PolicyFileForm({ onCancel }: { onCancel: () => void }) {
  const { x, lang } = useI18n()
  const { addPolicyFile } = useCommsData()
  const [authority, setAuthority] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [objective, setObjective] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [stage, setStage] = useState<CommsPolicyStage>('proposed')
  const [deadline, setDeadline] = useState('')
  const [owner, setOwner] = useState('')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!authority.trim() || !owner.trim()) return
    addPolicyFile({
      authority: biInput(authority, lang) ?? { en: authority.trim(), fr: `[FR review] ${authority.trim()}` },
      jurisdiction: biInput(jurisdiction, lang) ?? { en: '', fr: '' },
      objective: biInput(objective, lang) ?? { en: '', fr: '' },
      sourceUrl: sourceUrl.trim() || undefined,
      stage,
      deadline: deadline || undefined,
      owner: owner.trim(),
    })
    onCancel()
  }

  return (
    <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div>
          <label className={labelClass}>{x(M.comms_policy_authority)}</label>
          <input value={authority} onChange={(e) => setAuthority(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_policy_jurisdiction)}</label>
          <input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_policy_objective)}</label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
            required
          />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_policy_source_url)}</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_policy_owner)}</label>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_policy_stage)}</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as CommsPolicyStage)}
            className={inputClass}
          >
            {POLICY_STAGES.map((s) => (
              <option key={s} value={s}>{x(POLICY_STAGE_LABEL[s])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_policy_deadline)}</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
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

function IssueForm({ onCancel }: { onCancel: () => void }) {
  const { x, lang } = useI18n()
  const { state, addIssue } = useCommsData()
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<CommsIssueSeverity>('medium')
  const [status, setStatus] = useState<CommsIssueStatus>('open')
  const [lead, setLead] = useState('')
  const [spokesperson, setSpokesperson] = useState('')
  const [channels, setChannels] = useState('')
  const [restricted, setRestricted] = useState(false)
  const [summary, setSummary] = useState('')
  const [resolution, setResolution] = useState('')
  const [initiativeId, setInitiativeId] = useState('')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim() || !lead.trim()) return
    addIssue({
      title: biInput(title, lang) ?? { en: title.trim(), fr: `[FR review] ${title.trim()}` },
      severity,
      status,
      lead: lead.trim(),
      spokesperson: spokesperson.trim() || undefined,
      affectedChannels: parseChannels(channels),
      restricted,
      summary: biInput(summary, lang),
      resolution: biInput(resolution, lang),
      initiativeId: initiativeId || undefined,
    })
    onCancel()
  }

  return (
    <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_issue_title)}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_issue_severity)}</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as CommsIssueSeverity)}
            className={inputClass}
          >
            {ISSUE_SEVERITIES.map((s) => (
              <option key={s} value={s}>{x(ISSUE_SEVERITY_LABEL[s])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_issue_status)}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CommsIssueStatus)}
            className={inputClass}
          >
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>{x(ISSUE_STATUS_LABEL[s])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_issue_lead)}</label>
          <input value={lead} onChange={(e) => setLead(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_issue_spokesperson)}</label>
          <input value={spokesperson} onChange={(e) => setSpokesperson(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_issue_affected_channels)}</label>
          <input
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            placeholder={x(M.comms_issue_affected_channels_placeholder)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_engagement_initiative)}</label>
          <select
            value={initiativeId}
            onChange={(e) => setInitiativeId(e.target.value)}
            className={inputClass}
          >
            <option value="">{x(M.comms_org_none)}</option>
            {state.initiatives.map((i) => (
              <option key={i.id} value={i.id}>{x(i.title)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-[8px]">
          <input
            id="issue-restricted"
            type="checkbox"
            checked={restricted}
            onChange={(e) => setRestricted(e.target.checked)}
            className={checkboxClass}
          />
          <label htmlFor="issue-restricted" className="text-[12px] font-semibold text-text-3">
            {x(M.comms_issue_restricted)}
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_issue_summary)}</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_issue_resolution)}</label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={2}
            className={`${inputClass} resize-y`}
          />
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

export function Intelligence() {
  const { x } = useI18n()
  const { state, canWrite, toggleInitiativePause, removePolicyFile, removeIssue } = useCommsData()
  const { identity } = useWorkspaceMode()
  const [addingPolicy, setAddingPolicy] = useState(false)
  const [addingIssue, setAddingIssue] = useState(false)

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_intelligence_title)}</h2>

      <IntelligenceFeed />

      <FeedsSection />

      <CoverageSection />

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px]">
          <h3 className="text-[15px] font-semibold text-text">{x(M.comms_policy_files)}</h3>
          {canWrite && !addingPolicy && (
            <button
              type="button"
              onClick={() => setAddingPolicy(true)}
              className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
            >
              <Plus size={14} aria-hidden="true" />
              {x(M.comms_policy_add)}
            </button>
          )}
        </div>

        {addingPolicy && <PolicyFileForm onCancel={() => setAddingPolicy(false)} />}

        {state.policyFiles.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.policyFiles.map((file) => (
              <li key={file.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[14px] font-semibold text-text">{x(file.authority)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(file.jurisdiction)} · {x(POLICY_STAGE_LABEL[file.stage])}
                      {file.deadline ? ` · ${x(M.comms_policy_deadline)} ${file.deadline}` : ''}
                    </div>
                  </div>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => removePolicyFile(file.id)}
                      aria-label={x(M.comms_remove)}
                      className="text-text-muted hover:text-risk-fg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-[6px] text-[13px] text-text-2">{x(file.objective)}</div>
                {file.sourceUrl && (
                  <a
                    href={file.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-[6px] inline-block text-[12px] text-accent hover:underline"
                  >
                    {file.sourceUrl}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <SubmissionsSection />

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px]">
          <h3 className="text-[15px] font-semibold text-text">{x(M.comms_issues)}</h3>
          {canWrite && !addingIssue && (
            <button
              type="button"
              onClick={() => setAddingIssue(true)}
              className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
            >
              <Plus size={14} aria-hidden="true" />
              {x(M.comms_issue_add)}
            </button>
          )}
        </div>

        {addingIssue && <IssueForm onCancel={() => setAddingIssue(false)} />}

        {state.issues.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.issues.map((issue) => (
              <li key={issue.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[14px] font-semibold text-text">{x(issue.title)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.comms_issue_lead)} {issue.lead}
                      {issue.spokesperson ? ` · ${x(M.comms_issue_spokesperson)} ${issue.spokesperson}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <span className={statusChipClass(SEVERITY_TONE[issue.severity])}>
                      {x(ISSUE_SEVERITY_LABEL[issue.severity])}
                    </span>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => removeIssue(issue.id)}
                        aria-label={x(M.comms_remove)}
                        className="text-text-muted hover:text-risk-fg"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-[8px] flex flex-wrap gap-[6px]">
                  {issue.affectedChannels.map((channel) => (
                    <span key={channel} className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] text-text-muted">
                      {channel}
                    </span>
                  ))}
                </div>
                {issue.restricted && (
                  <div className="mt-[10px] rounded-[8px] border border-risk-border bg-risk-bg px-[12px] py-[8px] text-[12px] text-risk-fg">
                    {x(M.comms_issue_restricted_notice)}
                  </div>
                )}
                {canWrite && issue.initiativeId && (
                  <button
                    type="button"
                    onClick={() => toggleInitiativePause(issue.initiativeId!, issue.status === 'open', identity.user.name)}
                    className="mt-[10px] flex items-center gap-[4px] rounded-[6px] border border-border bg-surface px-[8px] py-[4px] font-sans text-[11.5px] font-semibold text-text hover:bg-inset"
                  >
                    {x(M.comms_initiative_pause_publications)}
                  </button>
                )}
                {issue.summary && <p className="mt-[10px] text-[13px] leading-normal text-text-2">{x(issue.summary)}</p>}
                {issue.resolution && (
                  <p className="mt-[6px] text-[13px] leading-normal text-text-2">{x(issue.resolution)}</p>
                )}
                <div className="mt-[8px] text-[12px] text-text-muted">
                  {x(ISSUE_STATUS_LABEL[issue.status])}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
