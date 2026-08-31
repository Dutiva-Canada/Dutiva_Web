import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Lock, Shield, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { cases, complianceItems, employees, employeeDetails, supportSignals } from '@/data'
import type { ComplianceItem, TimelineEvent } from '@/data'
import { useRail } from '@/features/app/rail/railContext'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import {
  contextFromEmployee,
  useWorkspaceContext,
} from '@/features/app/workspaceContext/workspaceContextStore'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { statusChipClass } from '@/components/chips'
import { useAskAdvisorAboutEmployee } from './useAskAdvisorAboutEmployee'
import {
  EmployeeCasesTab,
  EmployeeComplianceTab,
  EmployeeCompensationTab,
  EmployeeDocumentsTab,
  EmployeeLeaveTab,
  EmployeeOverviewTab,
  EmployeeTimelineTab,
  EmployeeWellbeingTab,
} from './employeeProfileTabs'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Employee profile hub — the prototype's `isProfileView` markup (App
 * v2.dc.html, 1436–1622) + `buildProfileView()` (4202–4267): identity
 * header, eight tabs (three restricted), the auto-composed timeline, the
 * document shelf, leave & accommodation records, compensation, wellbeing
 * support signals, related compliance flags and linked cases. The tab
 * panels live in `employeeProfileTabs.tsx`; this file owns state + effects.
 */

type ProfileTab =
  | 'overview'
  | 'timeline'
  | 'documents'
  | 'leave'
  | 'compensation'
  | 'wellbeing'
  | 'compliance'
  | 'cases'

const PROFILE_TABS: ReadonlyArray<{ key: ProfileTab; label: Bi; locked: boolean }> = [
  { key: 'overview', label: M.employees_tab_overview, locked: false },
  { key: 'timeline', label: M.employees_tab_timeline, locked: false },
  { key: 'documents', label: M.employees_tab_documents, locked: false },
  { key: 'leave', label: M.employees_tab_leave, locked: true },
  { key: 'compensation', label: M.employees_tab_compensation, locked: true },
  { key: 'wellbeing', label: M.employees_tab_wellbeing, locked: true },
  { key: 'compliance', label: M.employees_tab_compliance, locked: false },
  { key: 'cases', label: M.employees_tab_cases, locked: false },
]

/** Governing statute per jurisdiction (prototype `statuteMap`, 4214–4215). */
const STATUTES: Record<string, Bi> = {
  Ontario: M.employees_statute_on,
  Quebec: M.employees_statute_qc,
  'British Columbia': M.employees_statute_bc,
  Alberta: M.employees_statute_ab,
  Federal: M.employees_statute_fed,
}

const TAB_KEYS: readonly ProfileTab[] = PROFILE_TABS.map((t) => t.key)

/** Compensation/Wellbeing deep links navigate here with { tab } router state
    (prototype `openProfile(id)` + `setProfileTab(...)`). */
function readNavTab(state: unknown): ProfileTab | null {
  if (state !== null && typeof state === 'object' && 'tab' in state) {
    const value = (state as { tab?: unknown }).tab
    if (typeof value === 'string' && (TAB_KEYS as readonly string[]).includes(value)) {
      return value as ProfileTab
    }
  }
  return null
}

/** Northgate fixtures — demo workspace and public `/demo` only. */
export function EmployeeProfileDemoView() {
  const { employeeId } = useParams()
  const location = useLocation()
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { openRail, closeRail } = useRail()
  const { openDocFromLibrary } = useDocStudio()
  const askAdvisor = useAskAdvisorAboutEmployee()
  const { setContext } = useWorkspaceContext()
  const [tab, setTab] = useState<ProfileTab>(() => readNavTab(location.state) ?? 'overview')

  /* Same component instance across profile navigations — re-apply the deep-linked
     tab (or reset) when the person or the incoming state changes. */
  useEffect(() => {
    setTab(readNavTab(location.state) ?? 'overview')
  }, [employeeId, location.state])

  /* Prototype `openProfile()` pins the person as the Advisor's workspace
     context ("Advisor is using · Working with …"). */
  useEffect(() => {
    const contextEmp = employees.find((e) => e.id === employeeId)
    if (contextEmp) setContext(contextFromEmployee(contextEmp))
  }, [employeeId, setContext])

  const emp = employees.find((e) => e.id === employeeId)
  const det = emp ? employeeDetails[emp.id] : undefined
  if (!emp || !det) return null

  const statute = STATUTES[emp.jurisdiction.en] ?? M.employees_statute_fallback
  const wbSignals = supportSignals.filter((sg) => sg.employeeId === emp.id)
  const empCases = cases.filter((c) => c.empId === emp.id)
  const firstName = emp.name.split(' ')[0] ?? emp.name
  const relatedCompliance = complianceItems.filter(
    (ci) => ci.title.en.includes(firstName) || ci.title.en.includes(emp.name),
  )
  const marketDelta =
    det.salary != null && det.market != null
      ? Math.round(((det.salary - det.market) / det.market) * 100)
      : null
  const marketDeltaLabel =
    marketDelta != null
      ? (marketDelta >= 0 ? '+' : '') + marketDelta + x(M.employees_vs_market_suffix)
      : '—'

  /* FR typography puts a space before the colon in the header meta line. */
  const colon = lang === 'fr' ? ' : ' : ': '

  const recordRows: Array<{ k: string; v: string }> = [
    { k: x(M.employees_rr_location), v: `${x(emp.jurisdiction)} · ${x(statute)}` },
    { k: x(M.employees_rr_type), v: x(M.employees_rr_type_value) },
    { k: x(M.employees_rr_department), v: x(emp.dept) },
    { k: x(M.employees_manager_label), v: det.manager },
    { k: x(M.employees_rr_start), v: `${det.startDate} · ${x(emp.tenure)}` },
    { k: x(M.employees_rr_band), v: det.band },
  ]

  const openAdvisorChat = (chatId: string) => {
    navigate('/app/advisor', { state: { chatId } satisfies AdvisorSearchNavState })
  }

  /* Prototype `composeTimeline(det)` — doc events open Document Studio, case
     events open the case record; everything else is inert. */
  const eventAction = (ev: TimelineEvent): (() => void) | null => {
    if (ev.docKey !== undefined) {
      const docKey = ev.docKey
      return () => openDocFromLibrary(docKey)
    }
    if (ev.caseId !== undefined) {
      const caseId = ev.caseId
      return () => void navigate(`/app/cases/${caseId}`)
    }
    return null
  }

  /* Prototype `askAdvisorAboutRisk(item)` (3302–3304). */
  const resolveWithAdvisor = (item: ComplianceItem) => {
    openRail(item.title, {
      text: M.employees_risk_flag_intro,
      cards: [
        {
          tone: item.tone,
          title: item.title,
          body: item.detail,
          citations: item.citations.map((c) => ({ label: c.label })),
          actions: item.chatId
            ? [
                {
                  label: M.employees_open_full_case,
                  primary: true,
                  onClick: () => {
                    closeRail()
                    openAdvisorChat(item.chatId)
                  },
                },
              ]
            : [{ label: M.employees_draft_fix, primary: true, onClick: () => closeRail() }],
        },
      ],
    })
  }

  return (
    <AppPage width="default">
      <button
        type="button"
        onClick={() => navigate('/app/employees')}
        className="mb-[16px] flex cursor-pointer items-center gap-[6px] border-none bg-transparent p-0 font-sans text-[13px] font-semibold text-text-muted"
      >
        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        {x(M.employees_back_all_people)}
      </button>

      {/* Identity header */}
      <div className="mb-[6px] flex flex-wrap items-start gap-[16px]">
        <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-navy text-[19px] font-bold text-gold-on-navy">
          {emp.initials}
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="font-display text-[23px] font-semibold text-text">{emp.name}</div>
          <div className="mt-[2px] text-[13.5px] text-text-3">
            {x(emp.role)} · {x(emp.dept)} · {x(emp.jurisdiction)}
          </div>
          <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
            <span className={statusChipClass(emp.tone)}>{x(emp.status)}</span>
            <span className="text-[12px] text-text-muted">
              {x(emp.tenure)} · {x(M.employees_manager_label)}
              {colon}
              {det.manager} · {x(M.employees_since_label)} {det.startDate}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => askAdvisor(emp)}
          className="flex shrink-0 cursor-pointer items-center gap-[7px] rounded-[9px] border border-gold-border bg-gold-bg px-[15px] py-[9px] font-sans text-[13px] font-bold text-gold-fg"
        >
          <Sparkle size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {x(M.employees_ask_advisor)}
        </button>
      </div>

      {/* Tab strip */}
      <div
        role="tablist"
        aria-label={x(M.employees_profile_tabs_aria)}
        className="mt-[18px] mb-[22px] flex gap-[2px] overflow-x-auto border-b border-border"
      >
        {PROFILE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer border-0 border-b-2 bg-transparent px-[14px] py-[9px] font-sans text-[13px] font-semibold whitespace-nowrap ${
              tab === t.key ? 'border-b-navy text-text' : 'border-b-transparent text-text-muted'
            }`}
          >
            <span className="inline-flex items-center gap-[5px]">
              {x(t.label)}
              {t.locked && (
                <Lock size={11} strokeWidth={2} className="opacity-70" aria-hidden="true" />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <EmployeeOverviewTab
          emp={emp}
          det={det}
          recordRows={recordRows}
          wbSignalCount={wbSignals.length}
          openCaseCount={empCases.length}
          onOpenAdvisorChat={openAdvisorChat}
        />
      )}

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      {tab === 'timeline' && (
        <EmployeeTimelineTab timeline={det.timeline} eventAction={eventAction} />
      )}

      {/* ── Documents ────────────────────────────────────────────────── */}
      {tab === 'documents' && det.docs.length > 0 && (
        <EmployeeDocumentsTab docs={det.docs} onOpenDoc={openDocFromLibrary} />
      )}

      {/* ── Leave & accommodation ────────────────────────────────────── */}
      {tab === 'leave' && <EmployeeLeaveTab leave={det.leave} />}

      {/* ── Compensation ─────────────────────────────────────────────── */}
      {tab === 'compensation' && (
        <EmployeeCompensationTab
          det={det}
          marketDelta={marketDelta}
          marketDeltaLabel={marketDeltaLabel}
        />
      )}

      {/* ── Wellbeing ────────────────────────────────────────────────── */}
      {tab === 'wellbeing' && <EmployeeWellbeingTab wbSignals={wbSignals} />}

      {/* ── Compliance ───────────────────────────────────────────────── */}
      {tab === 'compliance' && relatedCompliance.length > 0 && (
        <EmployeeComplianceTab items={relatedCompliance} onResolve={resolveWithAdvisor} />
      )}

      {/* ── Cases ────────────────────────────────────────────────────── */}
      {tab === 'cases' && empCases.length > 0 && (
        <EmployeeCasesTab
          empCases={empCases}
          onOpenCase={(caseId) => navigate(`/app/cases/${caseId}`)}
        />
      )}

      {/* Audit footnote */}
      <div className="mt-[22px] flex items-start gap-[7px] text-[11px] leading-normal text-text-faint">
        <Shield size={12} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />
        <span>{x(M.employees_audit_foot)}</span>
      </div>
    </AppPage>
  )
}
