import { Check, FileText } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { keyOfL, pickL } from '@/i18n/core'
import type { Bi, LText } from '@/i18n/core'
import { resolveDocTitle } from '@/features/app/docstudio/resolveDocTitle'
import type {
  CaseRisk,
  CaseRiskAxis,
  ComplianceItem,
  FixtureToneCard,
  Task,
  TimelineEvent,
  Tone,
} from '@/data'
import type { ToneStyle } from '@/features/app/advisor/toneStyles'
import { casesMessages as M } from '@/i18n/messages/cases'
import { statusChipClass } from '@/components/chips'
import { activityDotClass, barToneClass, riskLevelTone, timelineDotClass } from './caseModel'
import type { WorkspaceCase } from './caseModel'

/**
 * Case detail tab bodies — the five tab panels extracted from
 * `CaseDetailView`'s `CaseDetail` orchestrator (prototype markup 1791–1971).
 * Pure renderers: every piece of state and every handler stays in
 * `CaseDetail` and arrives here as props.
 */

const cardClass = 'rounded-[12px] border border-border bg-surface'

/** A private case note (seeded fixture notes + notes added this session). */
export interface LocalNote {
  text: LText
  author: string
  time: LText
}

/** One "People involved" row (subject, manager, owner, counsel). */
export interface CasePerson {
  name: LText
  role: LText
  initials: string
}

/** One composed activity-feed row. */
export interface CaseActivityEntry {
  actor: string
  text: LText
  time: LText
  tone?: Tone
}

/** One label/value row of the legal-review record. */
export interface CaseLegalRow {
  label: Bi
  value: LText
}

/** Approval panel state shared by the Overview and Legal review tabs. */
export interface CaseApprovalState {
  status: Bi
  canRequest: boolean
  requested: boolean
}

/** Read-only derived data behind the Overview tab. */
export interface CaseOverviewData {
  caze: WorkspaceCase
  risk: CaseRisk
  rec: FixtureToneCard
  recTone: ToneStyle
  timeline: TimelineEvent[]
  people: CasePerson[]
  linkedTasks: Task[]
  docs: string[]
  flags: ComplianceItem[]
}

const docTitle = (key: string): LText => resolveDocTitle(key)

export function CaseOverviewTab({
  data,
  approval,
  taskDone,
  onToggleTask,
  onRequestApproval,
  onOpenChat,
  onOpenDoc,
  onOpenFlag,
}: Readonly<{
  data: CaseOverviewData
  approval: CaseApprovalState
  taskDone: Record<string, boolean>
  onToggleTask: (task: Task) => void
  onRequestApproval: () => void
  onOpenChat: (chatId: string) => void
  onOpenDoc: (key: string) => void
  onOpenFlag: (item: ComplianceItem) => void
}>) {
  const { x, lang } = useI18n()
  const { caze, risk, rec, recTone, timeline, people, linkedTasks, docs, flags } = data
  return (
    <div className="grid grid-cols-1 items-start gap-[16px] sm:grid-cols-[1.6fr_1fr]">
      <div className="flex min-w-0 flex-col gap-[14px]">
        <div className={`${cardClass} px-[18px] py-[16px] text-[14px] leading-[1.6] text-text-2`}>
          {x(caze.summary)}
        </div>

        {/* Advisor recommendation (prototype `prepCard(caseRecommendation)`) */}
        <div
          className={`flex flex-col gap-[8px] rounded-[12px] border px-[16px] py-[14px] ${recTone.card}`}
        >
          <div className="flex items-center gap-[8px]">
            <div className={`h-[7px] w-[7px] shrink-0 rounded-full ${recTone.dot}`} />
            <div className={`text-[13.5px] font-bold ${recTone.title}`}>{x(rec.title)}</div>
          </div>
          <div className="text-[13.5px] leading-[1.55] text-text-2">{x(rec.body)}</div>
        </div>

        {/* Risk assessment */}
        <div className={`${cardClass} px-[18px] py-[16px]`}>
          <div className="mb-[12px] flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.cases_risk_assessment)}
            </span>
            <span className={statusChipClass(risk.tone)}>{x(risk.levelLabel)}</span>
          </div>
          <div className="flex flex-col gap-[8px]">
            {risk.factors.map((f) => (
              <div key={f.en} className="flex gap-[9px]">
                <div
                  className={`mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full ${barToneClass(risk.tone)}`}
                />
                <span className="text-[13px] leading-normal text-text-2">{x(f)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className={`${cardClass} px-[18px] py-[16px]`}>
          <div className="mb-[12px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
            {x(M.cases_workflow)}
          </div>
          <div className="flex flex-col gap-[11px]">
            {caze.steps.map((st) => (
              <div key={st.label.en} className="flex items-center gap-[10px]">
                <div
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                    st.done ? 'bg-ok-fg' : 'border-[1.5px] border-border bg-surface'
                  }`}
                >
                  {st.done && (
                    <Check size={11} strokeWidth={3} className="text-white" aria-hidden="true" />
                  )}
                </div>
                <span className={`text-[13px] ${st.done ? 'text-text-2' : 'text-text-muted'}`}>
                  {x(st.label)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className={`${cardClass} px-[18px] py-[8px]`}>
            <div className="pt-[12px] pb-[4px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.cases_timeline)}
            </div>
            {timeline.map((ev) => (
              <div
                key={`${ev.date}-${ev.kind}`}
                className="flex gap-[12px] border-t border-inset py-[11px]"
              >
                <div
                  className={`mt-[4px] h-[9px] w-[9px] shrink-0 rounded-full ${timelineDotClass(ev.kind, ev.tone)}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] leading-normal text-text">{x(ev.text)}</div>
                  <div className="mt-[2px] text-[11.5px] text-text-muted">{ev.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-[14px]">
        {/* People involved */}
        <div className={`${cardClass} px-[16px] py-[14px]`}>
          <div className="mb-[10px] text-[12px] font-bold text-text-2">
            {x(M.cases_people_involved)}
          </div>
          <div className="flex flex-col gap-[10px]">
            {people.map((p) => (
              <div key={p.initials} className="flex items-center gap-[9px]">
                <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10.5px] font-bold text-accent">
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text">{pickL(p.name, lang)}</div>
                  <div className="text-[11.5px] text-text-muted">{pickL(p.role, lang)}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenChat(caze.chatId)}
            className="mt-[12px] w-full cursor-pointer rounded-[8px] border-none bg-navy p-[9px] font-sans text-[12.5px] font-bold text-white"
          >
            {x(M.cases_open_conversation)}
          </button>
        </div>

        {/* Approvals */}
        <div className={`${cardClass} px-[16px] py-[14px]`}>
          <div className="mb-[8px] text-[12px] font-bold text-text-2">{x(M.cases_approvals)}</div>
          <div className="text-[12.5px] leading-normal text-text-3">
            {pickL(approval.status, lang)}
          </div>
          {approval.canRequest && (
            <button
              type="button"
              onClick={onRequestApproval}
              className="mt-[10px] w-full cursor-pointer rounded-[8px] border border-(--accent-soft-border) bg-accent-soft p-[8px] font-sans text-[12.5px] font-semibold text-accent"
            >
              {x(M.cases_request_approval)}
            </button>
          )}
          {approval.requested && (
            <div className="mt-[10px] flex items-center gap-[7px] rounded-[8px] border border-ok-border bg-ok-bg px-[10px] py-[8px] text-[12px] font-semibold text-ok-fg">
              <Check size={13} strokeWidth={2.2} aria-hidden="true" />
              {x(M.cases_requested)}
            </div>
          )}
        </div>

        {/* Linked tasks */}
        {linkedTasks.length > 0 && (
          <div className={`${cardClass} px-[16px] py-[14px]`}>
            <div className="mb-[10px] text-[12px] font-bold text-text-2">
              {x(M.cases_linked_tasks)}
            </div>
            <div className="flex flex-col gap-[9px]">
              {linkedTasks.map((t) => {
                const done = taskDone[t.id] ?? t.done
                return (
                  <div key={t.id} className="flex items-center gap-[9px]">
                    <button
                      type="button"
                      aria-label={x(M.cases_toggle_task_aria)}
                      onClick={() => onToggleTask(t)}
                      className={`relative flex h-[17px] w-[17px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] after:absolute after:inset-[-14px] after:content-[''] ${
                        done ? 'border-none bg-ok-fg' : 'border-[1.5px] border-border bg-surface'
                      }`}
                    >
                      {done && (
                        <Check
                          size={11}
                          strokeWidth={3}
                          className="text-white"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[13px] ${done ? 'text-text-faint line-through' : 'text-text'}`}
                      >
                        {x(t.title)}
                      </div>
                      <div className="text-[11px] text-text-muted">{x(t.due)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Documents */}
        {docs.length > 0 && (
          <div className={`${cardClass} px-[16px] py-[14px]`}>
            <div className="mb-[10px] text-[12px] font-bold text-text-2">
              {x(M.cases_documents)}
            </div>
            <div className="flex flex-col gap-[8px]">
              {docs.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onOpenDoc(key)}
                  className="flex cursor-pointer items-center gap-[9px] border-none bg-transparent p-0 text-left font-sans"
                >
                  <FileText
                    size={14}
                    strokeWidth={1.7}
                    className="shrink-0 text-text-muted"
                    aria-hidden="true"
                  />
                  <span className="text-[13px] font-medium text-text">
                    {pickL(docTitle(key), lang)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compliance flags */}
        {flags.length > 0 && (
          <div className={`${cardClass} px-[16px] py-[14px]`}>
            <div className="mb-[10px] text-[12px] font-bold text-text-2">
              {x(M.cases_compliance_flags)}
            </div>
            <div className="flex flex-col gap-[9px]">
              {flags.map((ci) => (
                <button
                  key={ci.id}
                  type="button"
                  onClick={() => onOpenFlag(ci)}
                  className="flex cursor-pointer items-start gap-[8px] border-none bg-transparent p-0 text-left font-sans"
                >
                  <span className={statusChipClass(ci.tone)}>{x(ci.severityLabel)}</span>
                  <span className="text-[12.5px] leading-[1.4] text-text-2">{x(ci.title)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CaseRiskTab({ axes }: Readonly<{ axes: CaseRiskAxis[] }>) {
  const { x } = useI18n()
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[12px]">
        {axes.map((ra) => (
          <div key={ra.axis.en} className={`${cardClass} px-[17px] py-[15px]`}>
            <div className="mb-[8px] flex items-center justify-between gap-[8px]">
              <span className="text-[12.5px] font-bold text-text">{x(ra.axis)}</span>
              <span className={statusChipClass(riskLevelTone(ra.level))}>{x(ra.levelLabel)}</span>
            </div>
            <div className="text-[13px] leading-[1.55] text-text-2">{x(ra.reason)}</div>
            <div className="mt-[8px] border-t border-inset pt-[8px] text-[12.5px] leading-normal text-text-3">
              <span className="font-bold text-text-muted">{x(M.cases_mitigation)} · </span>
              {x(ra.mitigation)}
            </div>
          </div>
        ))}
      </div>
      <Disclaimer className="mt-[16px]" />
    </>
  )
}

export function CaseLegalTab({
  approval,
  legalRows,
  onRequestApproval,
}: Readonly<{
  approval: CaseApprovalState
  legalRows: CaseLegalRow[]
  onRequestApproval: () => void
}>) {
  const { x, lang } = useI18n()
  return (
    <div className="flex max-w-[640px] flex-col gap-[14px]">
      <div className={`${cardClass} px-[18px] py-[16px]`}>
        <div className="mb-[8px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
          {x(M.cases_legal_status)}
        </div>
        <div className="text-[13.5px] leading-[1.55] text-text-2">
          {pickL(approval.status, lang)}
        </div>
        {approval.canRequest && (
          <button
            type="button"
            onClick={onRequestApproval}
            className="mt-[12px] cursor-pointer rounded-[8px] border-none bg-navy px-[15px] py-[9px] font-sans text-[12.5px] font-bold text-white"
          >
            {x(M.cases_legal_request)} →
          </button>
        )}
      </div>
      <div className={`${cardClass} px-[18px] py-[8px]`}>
        {legalRows.map((row, i) => (
          <div
            key={row.label.en}
            className={`flex gap-[12px] border-t py-[11px] ${
              i === 0 ? 'border-transparent' : 'border-inset'
            }`}
          >
            <span className="w-[160px] shrink-0 text-[12.5px] font-semibold text-text-muted">
              {x(row.label)}
            </span>
            <span className="text-[13px] text-text-2">{pickL(row.value, lang)}</span>
          </div>
        ))}
      </div>
      <Disclaimer variant="block" />
    </div>
  )
}

export function CaseActivityTab({ activity }: Readonly<{ activity: CaseActivityEntry[] }>) {
  const { lang } = useI18n()
  return (
    <div className={`${cardClass} max-w-[640px] px-[18px] py-[8px]`}>
      {activity.map((a) => (
        <div
          key={`${a.actor}-${keyOfL(a.time)}`}
          className="flex gap-[12px] border-t border-inset py-[13px]"
        >
          <div
            className={`mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full ${activityDotClass(a.tone)}`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] leading-normal text-text">{pickL(a.text, lang)}</div>
            <div className="mt-[2px] text-[11.5px] text-text-muted">
              {a.actor} · {pickL(a.time, lang)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CaseNotesTab({
  noteDraft,
  notes,
  onDraftChange,
  onAddNote,
}: Readonly<{
  noteDraft: string
  notes: LocalNote[]
  onDraftChange: (draft: string) => void
  onAddNote: () => void
}>) {
  const { x, lang } = useI18n()
  return (
    <div className="max-w-[640px]">
      <div className="mb-[16px] flex items-end gap-[10px] rounded-[12px] border border-border bg-surface py-[8px] pr-[8px] pl-[14px]">
        <textarea
          value={noteDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              onAddNote()
            }
          }}
          placeholder={x(M.cases_note_placeholder)}
          rows={1}
          className="max-h-[120px] flex-1 resize-none border-none bg-transparent py-[7px] font-sans text-[13.5px] leading-normal text-text outline-none"
        />
        <button
          type="button"
          onClick={onAddNote}
          className="shrink-0 cursor-pointer rounded-[8px] border-none bg-navy px-[15px] py-[9px] font-sans text-[12.5px] font-bold text-white"
        >
          {x(M.cases_note_add)}
        </button>
      </div>
      {notes.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          {notes.map((n) => (
            <div
              key={`${n.author}-${keyOfL(n.time)}`}
              className="rounded-[11px] border border-border bg-surface px-[16px] py-[13px]"
            >
              <div className="text-[13.5px] leading-[1.55] text-text-2">{pickL(n.text, lang)}</div>
              <div className="mt-[6px] text-[11.5px] text-text-muted">
                {n.author} · {pickL(n.time, lang)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
