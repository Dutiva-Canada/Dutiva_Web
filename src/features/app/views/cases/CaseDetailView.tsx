import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import {
  caseNotes as seededCaseNotes,
  caseRecommendationByType,
  caseRiskAxesByType,
  caseRiskByType,
  complianceItems,
  employeeDetails,
  employees,
  tasks,
} from '@/data'
import type { ComplianceItem, Task } from '@/data'
import { useRail } from '@/features/app/rail/railContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CaseDetailProductionView } from './CaseDetailProductionView'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import {
  contextFromEmployee,
  useWorkspaceContext,
} from '@/features/app/workspaceContext/workspaceContextStore'
import { cardToneStyles } from '@/features/app/advisor/toneStyles'
import type { ToneCardData } from '@/features/app/advisor/types'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { casesMessages as M } from '@/i18n/messages/cases'
import { statusChipClass } from '@/components/chips'
import {
  findCase,
  isFixtureCaseType,
  pendingRecommendation,
  pendingRisk,
  pendingRiskAxes,
} from './caseModel'
import type { WorkspaceCase } from './caseModel'
import {
  CaseActivityTab,
  CaseLegalTab,
  CaseNotesTab,
  CaseOverviewTab,
  CaseRiskTab,
} from './caseDetailTabs'
import { AppPage } from '@/features/app/shell/AppPage'
import type {
  CaseActivityEntry,
  CaseApprovalState,
  CaseLegalRow,
  CasePerson,
  LocalNote,
} from './caseDetailTabs'

/**
 * Case detail — port of the prototype's case workspace (markup 1791–1971,
 * `buildCaseDetail`): header with status chip + Ask Advisor, five tabs
 * (Overview / Risk review / Legal review / Activity log / Notes), the
 * overview two-column grid (summary, Advisor recommendation, risk
 * assessment, workflow, timeline · people, approvals, linked tasks,
 * documents, compliance flags), the six-axis risk review, the legal-review
 * record, the composed activity feed, and the private notes composer.
 * The tab bodies live in `caseDetailTabs.tsx`; this file owns all state.
 */
export function CaseDetailView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  /* Production: the real working record (hr_cases + hr_case_notes). */
  if (workspaceMode === 'production') return <CaseDetailProductionView />
  return <CaseDetailDemoView />
}

function CaseDetailDemoView() {
  const { caseId } = useParams()
  const caze = caseId ? findCase(caseId) : undefined
  if (!caze) return <CaseNotFound />
  /* Key by case id so notes/tasks/approval state resets per case. */
  return <CaseDetail key={caze.id} caze={caze} />
}

type CaseTab = 'overview' | 'risk' | 'legal' | 'activity' | 'notes'

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)

/** Build the composed activity feed for a case (extracted to reduce component complexity). */
function buildActivity(
  caze: WorkspaceCase,
  risk: { levelLabel: Bi; tone: string },
  timeline: { text: Bi; date: string; tone?: string }[],
  approvalRequested: boolean,
): CaseActivityEntry[] {
  const openedText: Bi = {
    en: `Case opened and risk assessed as ${risk.levelLabel.en.toLowerCase()} severity`,
    fr: `Dossier ouvert et risque évalué comme gravité ${risk.levelLabel.fr.toLowerCase()}`,
  }
  const activity: CaseActivityEntry[] = [
    { actor: 'Advisor', text: openedText, time: caze.opened, tone: risk.tone as CaseActivityEntry['tone'] },
  ]
  caze.steps
    .filter((st) => st.done)
    .forEach((st, i) =>
      activity.push({
        actor: i === 0 ? 'Riley Summers' : 'Advisor',
        text: st.label,
        time: caze.opened,
        tone: 'success',
      }),
    )
  timeline
    .slice(0, 2)
    .forEach((t) => activity.push({ actor: 'System', text: t.text, time: t.date, tone: t.tone as CaseActivityEntry['tone'] }))
  if (approvalRequested) {
    activity.unshift({
      actor: 'Riley Summers',
      text: M.cases_activity_requested,
      time: M.cases_just_now,
      tone: 'info',
    })
  }
  return activity
}

function CaseDetail({ caze }: Readonly<{ caze: WorkspaceCase }>) {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { openRail, closeRail } = useRail()
  const { showToast } = useToasts()
  const { openDocFromLibrary } = useDocStudio()

  const [tab, setTab] = useState<CaseTab>('overview')
  const [approvalRequested, setApprovalRequested] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [notes, setNotes] = useState<LocalNote[]>(() =>
    (seededCaseNotes[caze.id] ?? []).map((n) => ({ text: n.text, author: n.author, time: n.time })),
  )

  const emp = caze.empId ? employees.find((e) => e.id === caze.empId) : undefined
  const det = emp ? employeeDetails[emp.id] : undefined

  /* Prototype: opening a case pins it as the Advisor's workspace context
     ("Advisor is using · On case …", logic 4281). The localized typeLabel is
     the topic chip — the prototype translates its raw c.type via tr(). */
  const { setContext } = useWorkspaceContext()
  useEffect(() => {
    if (emp) setContext(contextFromEmployee(emp, caze.typeLabel, 'case'))
  }, [emp, caze.typeLabel, setContext])
  const linkedTasks = tasks.filter((t) => t.chatId === caze.chatId)
  const [taskDone, setTaskDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(linkedTasks.map((t) => [t.id, t.done])),
  )
  const toggleTask = (task: Task) =>
    setTaskDone((prev) => ({ ...prev, [task.id]: !(prev[task.id] ?? task.done) }))
  const docs = det?.docs ?? []
  const timeline = det?.timeline ?? []
  const flags = complianceItems.filter((ci) => ci.chatId === caze.chatId)

  const risk = isFixtureCaseType(caze.type) ? caseRiskByType[caze.type] : pendingRisk
  const rec = isFixtureCaseType(caze.type)
    ? caseRecommendationByType[caze.type]
    : pendingRecommendation
  const axes = isFixtureCaseType(caze.type) ? caseRiskAxesByType[caze.type] : pendingRiskAxes
  const recTone = cardToneStyles[rec.tone]

  /* ── Approvals (prototype `caseApprovals` state + `requestApproval`) ────── */
  const approvalTarget =
    caze.type === 'Termination'
      ? M.cases_approval_target_counsel
      : M.cases_approval_target_people_ops
  const approvalByType: Record<string, Bi> = {
    Termination: M.cases_approval_termination,
    Onboarding: M.cases_approval_onboarding,
  }
  const defaultApproval: Bi = approvalByType[caze.type] ?? M.cases_approval_default
  const approvalStatus: Bi = approvalRequested
    ? {
        en: M.cases_approval_requested_prefix.en + approvalTarget.en,
        fr: M.cases_approval_requested_prefix.fr + approvalTarget.fr,
      }
    : defaultApproval
  const canRequestApproval =
    !approvalRequested && caze.type !== 'Onboarding' && caze.type !== 'Termination'
  const requestApproval = () => {
    setApprovalRequested(true)
    showToast(M.cases_toast_approval, 'ok')
  }
  const approval: CaseApprovalState = {
    status: approvalStatus,
    canRequest: canRequestApproval,
    requested: approvalRequested,
  }

  /* ── People involved ────────────────────────────────────────────────────── */
  const manager = det?.manager ?? 'Riley Summers'
  const people: CasePerson[] = [
    {
      name: caze.empName,
      role: {
        en: M.cases_people_subject_prefix.en + caze.province.en,
        fr: M.cases_people_subject_prefix.fr + caze.province.fr,
      },
      initials: initialsOf(pickL(caze.empName, 'en')),
    },
    { name: manager, role: M.cases_people_manager, initials: initialsOf(manager) },
    { name: caze.owner, role: M.cases_people_owner, initials: initialsOf(caze.owner) },
  ]
  if (caze.type === 'Termination') {
    people.push({
      name: M.cases_people_partner_counsel,
      role: M.cases_people_counsel_role,
      initials: 'PC',
    })
  }

  /* ── Activity feed (prototype-composed) ─────────────────────────────────── */
  const activity = buildActivity(caze, risk, timeline, approvalRequested)

  /* ── Advisor rail affordances ───────────────────────────────────────────── */
  const openChat = (chatId: string) =>
    navigate('/app/advisor', { state: { chatId } satisfies AdvisorSearchNavState })

  /* Prototype `askAdvisorAboutEmployee(emp)`. */
  const askAdvisor = () => {
    if (!emp) return
    const flag = emp.risk
    const flagChatId = flag?.chatId ?? null
    const cards: ToneCardData[] = flag
      ? [
          {
            tone: flag.tone,
            title: flag.title,
            body: flag.body,
            actions: flagChatId
              ? [
                  {
                    label: M.cases_open_full_case,
                    primary: true,
                    onClick: () => {
                      closeRail()
                      openChat(flagChatId)
                    },
                  },
                ]
              : [],
          },
        ]
      : []
    openRail(
      emp.name,
      { text: emp.insight, cards },
      { chips: [emp.province, emp.role, caze.typeLabel], initials: emp.initials },
    )
  }

  /* Prototype `askAdvisorAboutRisk(item)`. */
  const openFlag = (item: ComplianceItem) => {
    const chatId = item.chatId
    openRail(item.title, {
      text: M.cases_flag_intro,
      cards: [
        {
          tone: item.tone,
          title: item.title,
          body: item.detail,
          citations: item.citations.map((c) => ({ label: c.label })),
          actions: chatId
            ? [
                {
                  label: M.cases_open_full_case,
                  primary: true,
                  onClick: () => {
                    closeRail()
                    openChat(chatId)
                  },
                },
              ]
            : [{ label: M.cases_draft_fix, primary: true, onClick: () => closeRail() }],
        },
      ],
    })
  }

  /* ── Notes ──────────────────────────────────────────────────────────────── */
  const addNote = () => {
    const draft = noteDraft.trim()
    if (!draft) return
    setNotes((prev) => [...prev, { text: draft, author: 'Riley Summers', time: M.cases_just_now }])
    setNoteDraft('')
    showToast(M.cases_toast_note_added, 'ok')
  }

  /* ── Legal review record ────────────────────────────────────────────────── */
  const legalRows: CaseLegalRow[] = [
    {
      label: M.cases_legal_counsel,
      value:
        caze.type === 'Termination'
          ? M.cases_legal_counsel_termination
          : M.cases_legal_counsel_none,
    },
    { label: M.cases_legal_scope, value: caze.legalScope ?? '—' },
    { label: M.cases_legal_due, value: caze.due || '—' },
    { label: M.cases_legal_retention, value: caze.retention },
    {
      label: M.cases_legal_outcome,
      value:
        caze.status.en === 'Resolved' ? M.cases_legal_outcome_closed : M.cases_legal_outcome_open,
    },
  ]

  const tabs: { key: CaseTab; label: Bi }[] = [
    { key: 'overview', label: M.cases_tab_overview },
    { key: 'risk', label: M.cases_tab_risk },
    { key: 'legal', label: M.cases_tab_legal },
    { key: 'activity', label: M.cases_tab_activity },
    { key: 'notes', label: M.cases_tab_notes },
  ]

  return (
    <AppPage width="default">
        <button
          type="button"
          onClick={() => navigate('/app/cases')}
          className="mb-[16px] flex cursor-pointer items-center gap-[6px] border-none bg-transparent p-0 font-sans text-[13px] font-semibold text-text-muted"
        >
          <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
          {x(M.cases_all_cases)}
        </button>

        {/* Header */}
        <div className="mb-[6px] flex flex-wrap items-start justify-between gap-[16px]">
          <div className="min-w-0">
            <div className="font-display text-[22px] font-semibold text-text">
              {pickL(caze.title, lang)}
            </div>
            <div className="mt-[3px] text-[13px] text-text-muted">
              {x(caze.typeLabel)} · {x(caze.province)} · {x(M.cases_owner)} {caze.owner} ·{' '}
              {x(M.cases_opened)} {caze.opened}
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-[8px]">
            <span className={statusChipClass(caze.tone)}>{x(caze.status)}</span>
            <button
              type="button"
              onClick={askAdvisor}
              className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border border-gold-border bg-gold-bg px-[14px] py-[8px] font-sans text-[13px] font-bold text-gold-fg"
            >
              <Sparkle size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              {x(M.cases_ask_advisor)}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label={x(M.cases_tabs_aria)}
          className="mt-[18px] mb-[20px] flex gap-[2px] overflow-x-auto border-b border-border"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 cursor-pointer border-b-2 bg-transparent px-[14px] py-[9px] font-sans text-[13px] font-semibold whitespace-nowrap ${
                tab === t.key ? 'border-navy text-text' : 'border-transparent text-text-muted'
              }`}
            >
              {x(t.label)}
            </button>
          ))}
        </div>

        {/* ── Overview ───────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <CaseOverviewTab
            data={{ caze, risk, rec, recTone, timeline, people, linkedTasks, docs, flags }}
            approval={approval}
            taskDone={taskDone}
            onToggleTask={toggleTask}
            onRequestApproval={requestApproval}
            onOpenChat={openChat}
            onOpenDoc={openDocFromLibrary}
            onOpenFlag={openFlag}
          />
        )}

        {/* ── Risk review ────────────────────────────────────────────────── */}
        {tab === 'risk' && <CaseRiskTab axes={axes} />}

        {/* ── Legal review ───────────────────────────────────────────────── */}
        {tab === 'legal' && (
          <CaseLegalTab
            approval={approval}
            legalRows={legalRows}
            onRequestApproval={requestApproval}
          />
        )}

        {/* ── Activity log ───────────────────────────────────────────────── */}
        {tab === 'activity' && <CaseActivityTab activity={activity} />}

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        {tab === 'notes' && (
          <CaseNotesTab
            noteDraft={noteDraft}
            notes={notes}
            onDraftChange={setNoteDraft}
            onAddNote={addNote}
          />
        )}
    </AppPage>
  )
}

/** Gentle empty state for an unknown case id, with a route back to the list. */
function CaseNotFound() {
  const { x } = useI18n()
  return (
    <AppPage width="default">
        <Link
          to="/app/cases"
          className="mb-[16px] flex w-fit items-center gap-[6px] text-[13px] font-semibold text-text-muted no-underline"
        >
          <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
          {x(M.cases_all_cases)}
        </Link>
        <div className="mx-auto mt-[48px] max-w-[420px] rounded-[12px] border border-border bg-surface px-[24px] py-[28px] text-center">
          <div className="font-display text-[17px] font-semibold text-text">
            {x(M.cases_not_found_title)}
          </div>
          <div className="mt-[8px] text-[13px] leading-[1.55] text-text-3">
            {x(M.cases_not_found_body)}
          </div>
          <Link
            to="/app/cases"
            className="mt-[16px] inline-block rounded-[9px] bg-navy px-[16px] py-[9px] text-[12.5px] font-bold text-white no-underline"
          >
            {x(M.cases_all_cases)}
          </Link>
        </div>
    </AppPage>
  )
}
