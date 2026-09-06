import { Pause, Play } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useCommsData } from '../data/useCommsData'
import { ISSUE_SEVERITY_LABEL, ISSUE_STATUS_LABEL, POLICY_STAGE_LABEL } from '../commsLabels'
import { CoverageSection } from './CoverageSection'
import { FeedsSection } from './FeedsSection'
import { IntelligenceFeed } from './IntelligenceFeed'
import { SubmissionsSection } from './SubmissionsSection'

const SEVERITY_TONE: Record<import('../data/types').CommsIssueSeverity, import('@/components/chips').ChipTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'warning',
  critical: 'risk',
}

export function Intelligence() {
  const { x } = useI18n()
  const { state, canWrite, toggleInitiativePause } = useCommsData()
  const { identity } = useWorkspaceMode()

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_intelligence_title)}</h2>

      <IntelligenceFeed />

      <FeedsSection />

      <CoverageSection />

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_policy_files)}</h3>
        {state.policyFiles.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.policyFiles.map((file) => (
              <li key={file.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="text-[14px] font-semibold text-text">{x(file.authority)}</div>
                <div className="text-[12px] text-text-muted">
                  {x(file.jurisdiction)} · {x(POLICY_STAGE_LABEL[file.stage])}
                  {file.deadline ? ` · ${x(M.comms_policy_deadline)} ${file.deadline}` : ''}
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
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_issues)}</h3>
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
                  <span className={statusChipClass(SEVERITY_TONE[issue.severity])}>
                    {x(ISSUE_SEVERITY_LABEL[issue.severity])}
                  </span>
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
                    {issue.status === 'open' ? <Pause size={12} /> : <Play size={12} />}
                    {issue.status === 'open' ? x(M.comms_initiative_pause_publications) : x(M.comms_initiative_resume_publications)}
                  </button>
                )}
                {issue.summary && <p className="mt-[10px] text-[13px] leading-normal text-text-2">{x(issue.summary)}</p>}
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
