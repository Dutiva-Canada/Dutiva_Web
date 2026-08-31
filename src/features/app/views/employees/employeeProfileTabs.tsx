import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronRight, FileText, Info, Lock, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { leaveStatusLabels, leaveStatusTones } from '@/data'
import { resolveDocTitle } from '@/features/app/docstudio/resolveDocTitle'
import type {
  CaseFile,
  ComplianceItem,
  Employee,
  EmployeeDetail,
  LeaveRecord,
  SupportSignal,
  TimelineEvent,
  TimelineKind,
} from '@/data'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { moneyOrUnset } from '@/lib/money'
import { sensitiveCaseTypes } from '@/features/app/views/cases/caseModel'
import { dotToneClass, sourceChipClass, statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { RiskFlagCard } from './RiskFlagCard'

/**
 * Employee profile tab panels — the eight tab bodies extracted from
 * `EmployeeProfileView` (prototype markup 1436–1622, `buildProfileView()`).
 * Pure renderers: state, effects and every handler stay in
 * `EmployeeProfileView` and arrive here as props.
 */

/** Prototype `timelineKindMeta(kind)` (4111–4123). */
const TIMELINE_META: Record<TimelineKind, { source: Bi; tone: ChipTone }> = {
  hire: { source: M.employees_src_onboarding, tone: 'info' },
  review: { source: M.employees_src_performance, tone: 'info' },
  comp: { source: M.employees_src_compensation, tone: 'success' },
  case: { source: M.employees_src_case, tone: 'warning' },
  wellbeing: { source: M.employees_src_wellbeing, tone: 'warning' },
  doc: { source: M.employees_src_documents, tone: 'neutral' },
  comms: { source: M.employees_src_communications, tone: 'info' },
  ack: { source: M.employees_src_policy, tone: 'success' },
  compliance: { source: M.employees_src_compliance, tone: 'warning' },
}

/* Prototype `sensitiveCaseTypes()` — single source in the cases feature. */
const SENSITIVE_CASE_TYPES: readonly string[] = sensitiveCaseTypes

const activateOnKey = (fn: () => void) => (e: ReactKeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

function GoldBanner({ text, extraClass = '' }: Readonly<{ text: Bi; extraClass?: string }>) {
  const { x } = useI18n()
  return (
    <div
      className={`flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[14px] py-[11px] ${extraClass}`}
    >
      <Lock
        size={14}
        strokeWidth={1.8}
        className="mt-px shrink-0 text-gold-fg"
        aria-hidden="true"
      />
      <span className="text-[12.5px] leading-[1.55] font-semibold text-gold-fg">{x(text)}</span>
    </div>
  )
}

function EmptyState({ title, body }: Readonly<{ title: Bi; body: Bi }>) {
  const { x } = useI18n()
  return (
    <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[48px] text-center">
      <div className="mb-[4px] text-[14px] font-semibold text-text">{x(title)}</div>
      <div className="mx-auto max-w-[400px] text-[13px] text-text-muted">{x(body)}</div>
    </div>
  )
}

export function EmployeeOverviewTab({
  emp,
  det,
  recordRows,
  wbSignalCount,
  openCaseCount,
  onOpenAdvisorChat,
}: Readonly<{
  emp: Employee
  det: EmployeeDetail
  recordRows: Array<{ k: string; v: string }>
  wbSignalCount: number
  openCaseCount: number
  onOpenAdvisorChat: (chatId: string) => void
}>) {
  const { x } = useI18n()
  const risk = emp.risk
  const riskChatId = risk?.chatId ?? null
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[16px] text-[14px] leading-[1.6] text-text-2">
        {x(emp.insight)}
      </div>
      <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[8px]">
        {recordRows.map((rr) => (
          <div key={rr.k} className="flex gap-[12px] border-b border-b-inset py-[10px]">
            <span className="flex-[0_0_180px] text-[12.5px] font-semibold text-text-muted">
              {rr.k}
            </span>
            <span className="text-[13px] leading-normal text-text-2">{rr.v}</span>
          </div>
        ))}
      </div>
      {risk && (
        <RiskFlagCard
          tone={risk.tone}
          title={risk.title}
          body={risk.body}
          actions={
            riskChatId
              ? [
                  {
                    label: M.employees_open_full_case,
                    primary: true,
                    onClick: () => onOpenAdvisorChat(riskChatId),
                  },
                ]
              : []
          }
        />
      )}
      <div className="flex flex-wrap gap-[12px]">
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[15px]">
          <div className="text-[12px] text-text-muted">{x(M.employees_base_salary)}</div>
          <div className="mt-[3px] font-display text-[20px] font-semibold text-text">
            {x(moneyOrUnset(det.salary))}
          </div>
        </div>
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[15px]">
          <div className="text-[12px] text-text-muted">{x(M.employees_support_signals)}</div>
          <div className="mt-[3px] font-display text-[20px] font-semibold text-text">
            {wbSignalCount}
          </div>
        </div>
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[15px]">
          <div className="text-[12px] text-text-muted">{x(M.employees_open_cases)}</div>
          <div className="mt-[3px] font-display text-[20px] font-semibold text-text">
            {openCaseCount}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmployeeTimelineTab({
  timeline,
  eventAction,
}: Readonly<{
  timeline: TimelineEvent[]
  eventAction: (ev: TimelineEvent) => (() => void) | null
}>) {
  const { x } = useI18n()
  return (
    <>
      <div className="mb-[12px] flex items-center gap-[7px] text-[12px] text-text-muted">
        <Sparkle
          size={14}
          fill="currentColor"
          strokeWidth={0}
          className="shrink-0 text-gold-dot"
          aria-hidden="true"
        />
        <span>{x(M.employees_timeline_auto_note)}</span>
      </div>
      {timeline.length > 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[8px]">
          {timeline.map((ev) => {
            const meta = TIMELINE_META[ev.kind]
            const tone: ChipTone = ev.tone ?? meta.tone
            const action = eventAction(ev)
            return (
              <div
                key={`${ev.date}-${ev.kind}`}
                {...(action
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: action,
                      onKeyDown: activateOnKey(action),
                    }
                  : {})}
                className={`flex gap-[12px] border-b border-b-inset py-[14px] ${
                  action ? 'cursor-pointer hover:bg-inset' : 'cursor-default'
                }`}
              >
                <div
                  className={`mt-[4px] h-[9px] w-[9px] shrink-0 rounded-full ${dotToneClass(tone)}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className={sourceChipClass(tone)}>{x(meta.source)}</span>
                    <span className="text-[13.5px] leading-normal text-text">{x(ev.text)}</span>
                  </div>
                  <div className="mt-[3px] text-[12px] text-text-muted">{ev.date}</div>
                </div>
                {action && (
                  <ChevronRight
                    size={15}
                    strokeWidth={2}
                    className="mt-[3px] shrink-0 text-text-faint"
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState title={M.employees_no_recorded_events} body={M.employees_timeline_empty_body} />
      )}
    </>
  )
}

export function EmployeeDocumentsTab({
  docs,
  onOpenDoc,
}: Readonly<{
  docs: string[]
  onOpenDoc: (docKey: string) => void
}>) {
  const { x } = useI18n()
  return (
    <div className="flex flex-col gap-[10px]">
      {docs.map((docKey) => {
        const title = resolveDocTitle(docKey)
        return (
          <button
            key={docKey}
            type="button"
            onClick={() => onOpenDoc(docKey)}
            className="flex cursor-pointer items-center gap-[12px] rounded-[11px] border border-border bg-surface px-[16px] py-[13px] text-left font-sans"
          >
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-inset">
              <FileText
                size={14}
                strokeWidth={1.7}
                className="text-text-muted"
                aria-hidden="true"
              />
            </div>
            <span className="text-[13.5px] font-semibold text-text">{x(title)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function EmployeeLeaveTab({ leave }: Readonly<{ leave: LeaveRecord[] }>) {
  const { x } = useI18n()
  return (
    <>
      <GoldBanner text={M.employees_leave_banner} extraClass="mb-[14px]" />
      {leave.length > 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[8px]">
          {leave.map((lr) => (
            <div
              key={`${lr.type.en}-${lr.period.en}`}
              className="flex flex-wrap items-center gap-[12px] border-b border-b-inset py-[13px]"
            >
              <div className="min-w-[180px] flex-1">
                <div className="text-[13.5px] font-semibold text-text">{x(lr.type)}</div>
                <div className="mt-[2px] text-[12px] text-text-muted">
                  {x(lr.period)} · {x(lr.note)}
                </div>
              </div>
              <span className={statusChipClass(leaveStatusTones[lr.status])}>
                {x(leaveStatusLabels[lr.status])}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={M.employees_leave_empty_title} body={M.employees_leave_empty_body} />
      )}
    </>
  )
}

export function EmployeeCompensationTab({
  det,
  marketDelta,
  marketDeltaLabel,
}: Readonly<{
  det: EmployeeDetail
  marketDelta: number | null
  marketDeltaLabel: string
}>) {
  const { x } = useI18n()
  return (
    <div className="flex flex-col gap-[14px]">
      <GoldBanner text={M.employees_comp_banner} />
      <div className="flex flex-wrap gap-[12px]">
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[12px] text-text-muted">{x(M.employees_base_salary)}</div>
          <div className="mt-[3px] font-display text-[22px] font-semibold text-text">
            {x(moneyOrUnset(det.salary))}
          </div>
          <div className="mt-[2px] text-[12px] text-text-muted">
            {x(M.employees_band_label)} {det.band}
          </div>
        </div>
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[12px] text-text-muted">{x(M.employees_market_midpoint)}</div>
          <div className="mt-[3px] font-display text-[22px] font-semibold text-text">
            {x(moneyOrUnset(det.market))}
          </div>
          {marketDelta != null ? (
            <div className="mt-[6px]">
              <span className={statusChipClass(marketDelta < -4 ? 'warning' : 'success')}>
                {marketDeltaLabel}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-start gap-[8px] rounded-[12px] border border-(--accent-soft-border) bg-accent-soft px-[16px] py-[14px]">
        <Info
          size={16}
          strokeWidth={1.7}
          className="mt-px shrink-0 text-accent"
          aria-hidden="true"
        />
        <span className="text-[13px] leading-[1.55] text-text-2">
          {x(M.employees_comp_market_note)}
        </span>
      </div>
    </div>
  )
}

export function EmployeeWellbeingTab({ wbSignals }: Readonly<{ wbSignals: SupportSignal[] }>) {
  const { x } = useI18n()
  return (
    <>
      <GoldBanner text={M.employees_wellbeing_banner} extraClass="mb-[14px]" />
      {wbSignals.length > 0 ? (
        <div className="flex flex-col gap-[12px]">
          {wbSignals.map((sg) => (
            <div
              key={sg.id}
              className="rounded-[12px] border border-border bg-surface px-[18px] py-[16px]"
            >
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div className="text-[14px] leading-[1.45] font-semibold text-text">
                  {x(sg.type)}
                </div>
                <span className={statusChipClass(sg.tone)}>{x(sg.sensitivity)}</span>
              </div>
              <div className="mt-[3px] text-[12px] text-text-muted">
                {x(M.employees_wb_source)}: {x(sg.source)} · {x(M.employees_wb_confidence)}:{' '}
                {x(sg.confidence)}
              </div>
              <div className="mt-[8px] text-[13px] leading-[1.55] text-text-3">{x(sg.why)}</div>
              <div className="mt-[9px] flex flex-col gap-[4px] rounded-[9px] bg-inset px-[13px] py-[10px]">
                <span className="text-[11px] font-bold tracking-[0.03em] text-gold-dot uppercase">
                  {x(M.employees_wb_action)}
                </span>
                <span className="text-[12.5px] leading-normal text-text-2">{x(sg.action)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={M.employees_wb_empty_title} body={M.employees_wb_empty_body} />
      )}
    </>
  )
}

export function EmployeeComplianceTab({
  items,
  onResolve,
}: Readonly<{
  items: ComplianceItem[]
  onResolve: (item: ComplianceItem) => void
}>) {
  const { x } = useI18n()
  return (
    <div className="flex flex-col gap-[12px]">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex flex-col gap-[8px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]"
        >
          <div className="flex items-center gap-[10px]">
            <span className={statusChipClass(it.tone)}>{x(it.severityLabel)}</span>
            <span className="text-[14px] font-semibold text-text">{x(it.title)}</span>
          </div>
          <div className="text-[13px] leading-[1.55] text-text-3">{x(it.detail)}</div>
          <button
            type="button"
            onClick={() => onResolve(it)}
            className="cursor-pointer self-start rounded-[8px] border-none bg-accent-soft px-[13px] py-[7px] font-sans text-[12.5px] font-bold text-accent"
          >
            {x(M.employees_resolve_with_advisor)}
          </button>
        </div>
      ))}
    </div>
  )
}

export function EmployeeCasesTab({
  empCases,
  onOpenCase,
}: Readonly<{
  empCases: CaseFile[]
  onOpenCase: (caseId: string) => void
}>) {
  const { x } = useI18n()
  return (
    <div className="flex flex-col gap-[10px]">
      {empCases.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onOpenCase(c.id)}
          className="flex cursor-pointer items-center justify-between gap-[12px] rounded-[11px] border border-border bg-surface px-[16px] py-[14px] text-left font-sans"
        >
          <div>
            <div className="text-[14px] font-semibold text-text">{x(c.title)}</div>
            <div className="mt-[2px] text-[12px] text-text-muted">{x(c.typeLabel)}</div>
          </div>
          <div className="flex shrink-0 items-center gap-[10px]">
            {SENSITIVE_CASE_TYPES.includes(c.type) && (
              <span className="inline-flex items-center gap-[4px] text-[10.5px] font-bold tracking-[0.03em] text-gold-fg uppercase">
                <Lock size={11} strokeWidth={2} aria-hidden="true" />
                {x(M.employees_restricted)}
              </span>
            )}
            <span className={statusChipClass(c.tone)}>{x(c.status)}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
