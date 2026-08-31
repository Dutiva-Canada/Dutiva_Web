import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChartNoAxesColumn } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { casesMessages } from '@/i18n/messages/cases'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { analyticsCardVisible } from './cardVisibility'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import {
  listEmployees,
  listExpiryRecords,
  listLeaves,
} from '@/features/app/views/employees/productionApi'
import type {
  ProductionEmployee,
  ProductionExpiryRecord,
  ProductionLeave,
} from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase, ProductionCaseType } from '@/features/app/views/cases/productionApi'
import { hasProbationReviewTask, listTasks } from '@/features/app/views/tasks/productionApi'
import type { ProductionTask } from '@/features/app/views/tasks/productionApi'
import { listFindings, listObligations } from '@/features/app/views/compliance/productionApi'
import type {
  ProductionFinding,
  ProductionObligation,
} from '@/features/app/views/compliance/productionApi'
import { listPolicies } from '@/features/app/views/policies/productionApi'
import type { ProductionPolicy } from '@/features/app/views/policies/productionApi'
import { listScoreSnapshots, recordScoreSnapshot } from './productionApi'
import type { ScoreSnapshot } from './productionApi'
import { AnalyticsCard, CardEmpty, CardError, CardSkeleton } from './AnalyticsCard'
import { AttentionList } from './AttentionList'
import type { AttentionRow } from './AttentionList'
import { DeltaChip } from './DeltaChip'
import { ExpiryBucketsSection } from './ExpiryBucketsSection'
import type { ExpiryDisplayRow } from './ExpiryBucketsSection'
import { JurisdictionBars } from './JurisdictionBars'
import { LeaveList } from './LeaveList'
import type { LeaveDisplayRow } from './LeaveList'
import { OpenCaseRows } from './OpenCaseRows'
import { ProbationList } from './ProbationList'
import { ScoreBreakdownMeters } from './ScoreBreakdownMeters'
import { ScoreHero } from './ScoreHero'
import { StatTile } from './StatTile'
import { TrendLineChart } from './TrendLineChart'
import {
  CRITICAL_SCORE_CEILING,
  FINDING_SEVERITY_WEIGHTS,
  SCORE_FORMULA_VERSION,
  addDaysISO,
  applyCriticalCeiling,
  blendScore,
  caseAging,
  daysBetweenISO,
  expiryBuckets,
  flattenBuckets,
  formatMonthISO,
  isProvenancedTask,
  meanInWindow,
  monthStartISO,
  rankAttention,
  scoreComponent,
  scoreDelta,
  turnoverRatePct,
  weightedComponent,
} from './aggregation'
import { attentionChipLabel, attentionSecondary } from './attentionLabels'
import { fill, formatDayISO, formatPct, formatSignedDecimal, intlLocale } from './format'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Analytics in production mode. The monthly snapshot table
 * (compliance_score_snapshots) persists the two aggregates that can't be
 * recomputed later — the blended score and the headcount; everything else
 * aggregates live from the modules already on real persistence, through
 * their own productionApi boundaries.
 *
 * Each card fetches only the modules it needs and carries its own skeleton,
 * empty state and retry — so a failing module degrades one card, and cards
 * can later be hidden per role without entangling the rest of the page.
 * Phase 2 cards whose underlying records don't exist in this workspace yet
 * (certifications, probation dates, document expiries, leave detail) say so
 * plainly instead of hiding.
 */

const ATTENTION_CAP = 5
const HISTORY_WINDOW_MONTHS = 6

const TYPE_LABEL: Record<ProductionCaseType, (typeof casesMessages)[keyof typeof casesMessages]> = {
  Termination: casesMessages.cases_prod_type_termination,
  Performance: casesMessages.cases_prod_type_performance,
  Accommodation: casesMessages.cases_prod_type_accommodation,
  Onboarding: casesMessages.cases_prod_type_onboarding,
}

type ModuleState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; rows: T[] }

/** Per-module loader with its own retry, so cards stay independently alive. */
function useModuleRows<T>(
  organizationId: string | null,
  list: (organizationId: string) => Promise<T[]>,
): { state: ModuleState<T>; retry: () => void } {
  const [state, setState] = useState<ModuleState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!organizationId) return
    let cancelled = false
    setState({ status: 'loading' })
    list(organizationId)
      .then((rows) => {
        if (!cancelled) setState({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [organizationId, list, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

/** Skeleton / error / ready gate over the modules a card depends on. */
function CardData({
  deps,
  skeletonLines = 3,
  children,
}: {
  readonly deps: readonly { state: ModuleState<unknown>; retry: () => void }[]
  readonly skeletonLines?: number
  readonly children: () => ReactNode
}) {
  if (deps.some((d) => d.state.status === 'error')) {
    return (
      <CardError
        onRetry={() => {
          for (const dep of deps) if (dep.state.status === 'error') dep.retry()
        }}
      />
    )
  }
  if (deps.some((d) => d.state.status === 'loading')) {
    return <CardSkeleton lines={skeletonLines} />
  }
  return <>{children()}</>
}

function rowsOf<T>(state: ModuleState<T>): T[] {
  return state.status === 'ready' ? state.rows : []
}

export function AnalyticsProductionView() {
  const { x, lang } = useI18n()
  const locale = intlLocale(lang)
  const { organizationId, memberRole, isOrgAdmin } = useWorkspaceMode()

  const todayISO = new Date().toISOString().slice(0, 10)
  const currentMonthISO = monthStartISO(todayISO)

  const employees = useModuleRows<ProductionEmployee>(organizationId, listEmployees)
  const hrCases = useModuleRows<ProductionCase>(organizationId, listCases)
  const tasks = useModuleRows<ProductionTask>(organizationId, listTasks)
  const findings = useModuleRows<ProductionFinding>(organizationId, listFindings)
  const obligations = useModuleRows<ProductionObligation>(organizationId, listObligations)
  const policies = useModuleRows<ProductionPolicy>(organizationId, listPolicies)
  const snapshots = useModuleRows<ScoreSnapshot>(organizationId, listScoreSnapshots)
  const expiryRecords = useModuleRows<ProductionExpiryRecord>(organizationId, listExpiryRecords)
  const leaves = useModuleRows<ProductionLeave>(organizationId, listLeaves)

  /* ── Score: live components + snapshot history ─────────────────────────── */
  const scoreReady =
    policies.state.status === 'ready' &&
    tasks.state.status === 'ready' &&
    findings.state.status === 'ready' &&
    obligations.state.status === 'ready'

  const components = useMemo(() => {
    const policyRows = rowsOf(policies.state)
    /* v3 scope: provenanced rows only (a hand-added to-do is real work but
       not compliance posture); cancelled tasks are neither done nor pending
       work — the same exclusion the backend's own overdue count applies. */
    const taskRows = rowsOf(tasks.state).filter(
      (t) => isProvenancedTask(t.category, t.linkedKind) && t.status !== 'cancelled',
    )
    const findingRows = rowsOf(findings.state)
    const obligationRows = rowsOf(obligations.state)
    return [
      scoreComponent(
        'policies',
        policyRows.filter((p) => p.status === 'up_to_date').length,
        policyRows.length,
      ),
      scoreComponent('tasks', taskRows.filter((t) => t.done).length, taskRows.length),
      weightedComponent(
        'findings',
        findingRows.map((f) => ({
          done: f.resolved,
          weight: FINDING_SEVERITY_WEIGHTS[f.severity],
        })),
      ),
      scoreComponent(
        'obligations',
        obligationRows.filter((o) => o.status === 'ok').length,
        obligationRows.length,
      ),
    ]
  }, [policies.state, tasks.state, findings.state, obligations.state])

  const openCriticalCount = useMemo(
    () => rowsOf(findings.state).filter((f) => !f.resolved && f.severity === 'critical').length,
    [findings.state],
  )
  const ceiling = applyCriticalCeiling(
    scoreReady ? blendScore(components) : null,
    openCriticalCount,
  )
  const liveScore = ceiling.score

  const activeEmployees = useMemo(
    () => rowsOf(employees.state).filter((e) => e.status !== 'terminated'),
    [employees.state],
  )
  const liveHeadcount = employees.state.status === 'ready' ? activeEmployees.length : null

  /* Record this month's snapshot once per page view — score and headcount
     history are written as a side effect of computing the live numbers.
     Waits for the employees module to settle so headcount isn't dropped by
     a race; a module error records what is known. Failure is dropped:
     history is an enhancement, never a reason to degrade the dashboard. */
  const recordedRef = useRef(false)
  useEffect(() => {
    if (recordedRef.current || !organizationId || liveScore === null) return
    if (employees.state.status === 'loading') return
    recordedRef.current = true
    recordScoreSnapshot(
      organizationId,
      currentMonthISO,
      liveScore,
      components.map((c) => ({
        key: c.key,
        done: c.done,
        total: c.total,
        weightedDone: c.weightedDone,
        weightedTotal: c.weightedTotal,
      })),
      liveHeadcount,
    ).catch(() => {})
  }, [organizationId, liveScore, components, currentMonthISO, employees.state, liveHeadcount])

  const history = useMemo(() => {
    if (liveScore === null) return []
    const past = rowsOf(snapshots.state).filter((s) => s.monthISO < currentMonthISO)
    return [...past, { monthISO: currentMonthISO, score: liveScore }].slice(-HISTORY_WINDOW_MONTHS)
  }, [snapshots.state, liveScore, currentMonthISO])

  /* A trend crossing formula versions is labeled, not silently mixed: true
     when any charted past month was frozen under an older formula. */
  const hasOlderFormulaPoints = useMemo(() => {
    const windowStart = history[0]?.monthISO
    if (windowStart === undefined) return false
    return rowsOf(snapshots.state).some(
      (s) =>
        s.monthISO >= windowStart &&
        s.monthISO < currentMonthISO &&
        s.formulaVersion < SCORE_FORMULA_VERSION,
    )
  }, [snapshots.state, history, currentMonthISO])

  const headcountTrend = useMemo(() => {
    if (liveHeadcount === null) return []
    const past = rowsOf(snapshots.state)
      .filter((s) => s.headcount !== null && s.monthISO < currentMonthISO)
      .map((s) => ({ monthISO: s.monthISO, value: s.headcount! }))
    return [...past, { monthISO: currentMonthISO, value: liveHeadcount }].slice(
      -HISTORY_WINDOW_MONTHS,
    )
  }, [snapshots.state, liveHeadcount, currentMonthISO])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.analytics_prod_empty_title)} />
  }

  /* ── Whole-page empty state: brand-new workspace with no records at all ── */
  const coreReady =
    scoreReady && employees.state.status === 'ready' && hrCases.state.status === 'ready'
  const hasAnyData =
    rowsOf(employees.state).length +
      rowsOf(hrCases.state).length +
      rowsOf(tasks.state).length +
      rowsOf(findings.state).length +
      rowsOf(obligations.state).length +
      rowsOf(policies.state).length >
    0
  if (coreReady && !hasAnyData) {
    return (
      <AppPage width="default" responsivePad>
        <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
          <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
            <ChartNoAxesColumn
              size={20}
              strokeWidth={1.7}
              className="text-text-muted"
              aria-hidden="true"
            />
          </div>
          <div className="mb-[6px] text-[15px] font-semibold text-text">
            {x(M.analytics_prod_empty_title)}
          </div>
          <p className="m-0 text-[13px] text-text-muted">{x(M.analytics_prod_empty_body)}</p>
        </div>
      </AppPage>
    )
  }

  /* ── Card data ─────────────────────────────────────────────────────────── */
  const scoreDeltaValue = scoreDelta(history)
  const componentLabels: Record<string, string> = {
    policies: x(M.analytics_comp_policies),
    tasks: x(M.analytics_comp_tasks),
    findings: x(M.analytics_comp_findings),
    obligations: x(M.analytics_comp_obligations),
  }
  const presentPcts = components.filter((c) => c.pct !== null).map((c) => c.pct!)
  const lowestPct = presentPcts.length >= 2 ? Math.min(...presentPcts) : null
  const breakdownRows = components
    .filter((c) => c.pct !== null)
    .map((c) => ({
      key: c.key,
      label: componentLabels[c.key] ?? c.key,
      pct: c.pct!,
      valueText: fill(x(M.analytics_comp_value), { done: c.done, total: c.total }),
      flagged: lowestPct !== null && c.pct === lowestPct,
    }))

  /* ── Expiry records: certification / document buckets ──────────────────── */
  const allRecords = rowsOf(expiryRecords.state).map((r) => ({ ...r, expiryISO: r.expiryDate }))
  const certRecords = allRecords.filter((r) => r.kind === 'certification')
  const docRecords = allRecords.filter((r) => r.kind === 'document')
  const certBuckets = expiryBuckets(certRecords, todayISO)
  const docBuckets = expiryBuckets(docRecords, todayISO)

  const toExpiryRow = (
    record: ProductionExpiryRecord & { expiryISO: string },
  ): ExpiryDisplayRow => ({
    key: record.id,
    title: record.name,
    secondary: [record.employeeName, record.employeeProvince].filter(Boolean).join(' · '),
    dateLabel: formatDayISO(record.expiryISO, locale),
    expired: daysBetweenISO(todayISO, record.expiryISO) < 0,
    href: `/app/employees/${record.employeeId}`,
  })

  const attentionPool = [
    ...rowsOf(tasks.state)
      .filter((t) => !t.done && t.dueDate !== null)
      .map((t) => ({
        id: `task-${t.id}`,
        dueISO: t.dueDate!,
        title: t.title,
        secondary: x(M.analytics_attention_task_kind),
        href: '/app/planning/tasks',
      })),
    ...rowsOf(hrCases.state)
      .filter((c) => c.status !== 'resolved' && c.dueDate !== null)
      .map((c) => ({
        id: `case-${c.id}`,
        dueISO: c.dueDate!,
        title: c.title,
        secondary: attentionSecondary(c.province, undefined, x),
        href: `/app/cases/${c.id}`,
      })),
    /* Obligations without evidence on file, once dated — the same pool the
       demo card draws from. */
    ...rowsOf(obligations.state)
      .filter((o) => o.status !== 'ok' && o.dueOn !== null)
      .map((o) => ({
        id: `obligation-${o.id}`,
        dueISO: o.dueOn!,
        title: o.title,
        secondary: attentionSecondary(o.jurisdiction ?? '', undefined, x),
        href: '/app/compliance',
      })),
    /* Escalations: expired certifications; documents expired or ≤30 days —
       an expiring work permit is a compliance event (zero silent expiries). */
    ...[...certBuckets.expired, ...docBuckets.expired, ...docBuckets.within30].map((record) => ({
      id: record.id,
      dueISO: record.expiryISO,
      title: record.employeeName ? `${record.name} — ${record.employeeName}` : record.name,
      secondary: attentionSecondary(record.employeeProvince ?? '', undefined, x),
      href: `/app/employees/${record.employeeId}`,
    })),
  ]
  const ranked = rankAttention(attentionPool, todayISO)
  const attentionRows: AttentionRow[] = ranked.slice(0, ATTENTION_CAP).map((r) => ({
    key: r.item.id,
    title: r.item.title,
    secondary: r.item.secondary,
    status: r.status,
    chipLabel: attentionChipLabel(r, x, locale),
    href: r.item.href,
  }))

  const headcountCounts = new Map<string, number>()
  for (const employee of activeEmployees) {
    headcountCounts.set(employee.province, (headcountCounts.get(employee.province) ?? 0) + 1)
  }
  const headcountRows = [...headcountCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([province, value]) => ({ key: province, label: province, value }))

  const openCases = rowsOf(hrCases.state).filter((c) => c.status !== 'resolved')
  const aging = caseAging(
    openCases.map((c) => ({ ...c, openedISO: c.createdAt.slice(0, 10) })),
    todayISO,
  )

  /* ── Probation periods ending within 30 days ───────────────────────────── */
  const taskRows = rowsOf(tasks.state)
  const anyProbationDates = rowsOf(employees.state).some((e) => e.probationEndDate !== null)
  const probationRows = rowsOf(employees.state)
    .filter((e) => e.status !== 'terminated' && e.probationEndDate !== null)
    .map((e) => ({ employee: e, daysLeft: daysBetweenISO(todayISO, e.probationEndDate!) }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(({ employee, daysLeft }) => ({
      key: employee.id,
      name: employee.name,
      secondary: [employee.title, employee.province].filter(Boolean).join(' · '),
      endLabel: formatDayISO(employee.probationEndDate!, locale),
      daysLeft,
      reviewTaskCreated: hasProbationReviewTask(taskRows, employee.id),
      href: `/app/employees/${employee.id}`,
    }))

  /* ── Leave overview — real leave records first, with a bare fallback row
     for anyone whose roster status says on_leave but has no record yet. ── */
  const currentLeaves = rowsOf(leaves.state).filter((l) => l.endedOn === null)
  const coveredEmployeeIds = new Set(currentLeaves.map((l) => l.employeeId))
  const bareOnLeave = activeEmployees.filter(
    (e) => e.status === 'on_leave' && !coveredEmployeeIds.has(e.id),
  )
  const leaveRows: LeaveDisplayRow[] = [
    ...currentLeaves.map((leave) => {
      const daysToReturn =
        leave.expectedReturnDate === null
          ? null
          : daysBetweenISO(todayISO, leave.expectedReturnDate)
      return {
        key: leave.id,
        name: leave.employeeName ?? leave.employeeId,
        type: leave.leaveType,
        protected: leave.isProtected,
        returnLabel:
          leave.expectedReturnDate !== null
            ? fill(x(M.analytics_leave_returns), {
                date: formatDayISO(leave.expectedReturnDate, locale),
              })
            : x(M.analytics_leave_on_now),
        imminent: daysToReturn !== null && daysToReturn >= 0 && daysToReturn <= 14,
        href: `/app/employees/${leave.employeeId}`,
        sortKey: leave.expectedReturnDate ?? '9999-12-31',
      }
    }),
    ...bareOnLeave.map((e) => ({
      key: `bare-${e.id}`,
      name: e.name,
      type: e.title ?? e.province,
      protected: false,
      returnLabel: x(M.analytics_leave_on_now),
      imminent: false,
      href: `/app/employees/${e.id}`,
      sortKey: '9999-12-31',
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  /* ── Turnover — real once termination dates exist ───────────────────────── */
  const terminationDates = rowsOf(employees.state)
    .map((e) => e.terminationDate)
    .filter((d): d is string => d !== null)
  const priorWindowEndISO = addDaysISO(currentMonthISO, -1)
  const currentAvgHeadcount =
    meanInWindow(headcountTrend, addDaysISO(todayISO, -365), todayISO) ?? liveHeadcount
  const priorAvgHeadcount = meanInWindow(
    rowsOf(snapshots.state)
      .filter((s) => s.headcount !== null)
      .map((s) => ({ monthISO: s.monthISO, value: s.headcount! })),
    addDaysISO(priorWindowEndISO, -365),
    priorWindowEndISO,
  )
  const turnoverNow =
    terminationDates.length > 0
      ? turnoverRatePct(terminationDates, todayISO, currentAvgHeadcount)
      : null
  const turnoverPrior =
    turnoverNow !== null
      ? turnoverRatePct(terminationDates, priorWindowEndISO, priorAvgHeadcount)
      : null
  const turnoverDelta =
    turnoverNow !== null && turnoverPrior !== null
      ? Math.round((turnoverNow - turnoverPrior) * 10) / 10
      : null

  const show = (card: Parameters<typeof analyticsCardVisible>[0]) =>
    analyticsCardVisible(card, memberRole, isOrgAdmin)

  return (
    <AppPage width="default" responsivePad>
      <div className="mb-[14px] text-[13px] text-text-muted">{x(M.analytics_live_note)}</div>

      <div className="grid grid-cols-1 gap-[14px] min-[900px]:grid-cols-2 min-[900px]:gap-[16px]">
        {/* Compliance score */}
        <AnalyticsCard
          title={x(M.analytics_score_title)}
          className="min-[900px]:col-span-2"
          hidden={!show('score')}
        >
          <CardData deps={[policies, tasks, findings, obligations, snapshots]} skeletonLines={4}>
            {() =>
              liveScore === null ? (
                <CardEmpty text={x(M.analytics_score_empty)} />
              ) : (
                <>
                  <ScoreHero score={liveScore} delta={scoreDeltaValue} />
                  {ceiling.capped && (
                    <p className="mt-[8px] mb-0 text-[12.5px] font-medium text-risk-fg">
                      {fill(x(M.analytics_score_capped_note), {
                        ceiling: CRITICAL_SCORE_CEILING,
                      })}
                    </p>
                  )}
                  {history.length >= 2 ? (
                    <div className="mt-[10px]">
                      <TrendLineChart
                        points={history.map((p) => ({ monthISO: p.monthISO, value: p.score }))}
                        ariaLabel={x(M.analytics_score_chart_aria).replace(
                          '{points}',
                          history
                            .map((p) => `${formatMonthISO(p.monthISO, locale, 'long')} ${p.score}`)
                            .join(', '),
                        )}
                        valueHeader={x(M.analytics_score_table_score)}
                        clampMax={100}
                      />
                    </div>
                  ) : (
                    <p className="mt-[10px] mb-0 text-[12.5px] text-text-muted">
                      {x(M.analytics_score_first_point)}
                    </p>
                  )}
                  {hasOlderFormulaPoints && (
                    <p className="mt-[8px] mb-0 text-[11.5px] text-text-faint">
                      {x(M.analytics_score_formula_note)}
                    </p>
                  )}
                  {breakdownRows.length > 0 && (
                    <div className="mt-[14px] border-t border-border-soft pt-[14px]">
                      <div className="mb-[10px] text-[11.5px] font-bold tracking-[0.04em] uppercase text-text-muted">
                        {x(M.analytics_score_breakdown_title)}
                      </div>
                      <ScoreBreakdownMeters rows={breakdownRows} />
                    </div>
                  )}
                </>
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* Needs attention */}
        <AnalyticsCard
          title={x(M.analytics_attention_title)}
          subtitle={x(M.analytics_attention_sub)}
          hidden={!show('attention')}
        >
          <CardData deps={[tasks, hrCases, obligations]} skeletonLines={4}>
            {() =>
              attentionRows.length === 0 ? (
                <CardEmpty text={x(M.analytics_attention_empty)} />
              ) : (
                <AttentionList
                  rows={attentionRows}
                  viewAllHref="/app/planning/tasks"
                  viewAllLabel={fill(x(M.analytics_attention_view_all), { n: ranked.length })}
                />
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* Headcount by jurisdiction */}
        <AnalyticsCard
          title={x(M.analytics_headcount_title)}
          subtitle={
            activeEmployees.length > 0
              ? fill(x(M.analytics_headcount_total), { n: activeEmployees.length })
              : undefined
          }
          hidden={!show('headcount')}
        >
          <CardData deps={[employees]} skeletonLines={4}>
            {() =>
              headcountRows.length === 0 ? (
                <CardEmpty text={x(M.analytics_headcount_empty)} />
              ) : (
                <>
                  <JurisdictionBars rows={headcountRows} />
                  <p className="mt-[10px] mb-0 text-[11.5px] text-text-faint">
                    {x(M.analytics_headcount_footnote)}
                  </p>
                </>
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* Open cases */}
        <AnalyticsCard title={x(M.analytics_cases_title)} hidden={!show('cases')}>
          <CardData deps={[hrCases]} skeletonLines={4}>
            {() =>
              aging === null ? (
                <CardEmpty text={x(M.analytics_cases_empty)} />
              ) : (
                <>
                  <div className="mb-[12px] flex gap-[10px]">
                    <StatTile
                      value={String(aging.openCount)}
                      label={x(M.analytics_cases_open_now)}
                    />
                    <StatTile value={String(aging.avgDays)} label={x(M.analytics_cases_avg_age)} />
                    <StatTile
                      value={String(aging.oldestDays)}
                      label={x(M.analytics_cases_oldest)}
                      alert={aging.oldestDays > 14}
                    />
                  </div>
                  <OpenCaseRows
                    rows={aging.rows.map(({ caseRow, daysOpen }) => ({
                      key: caseRow.id,
                      href: `/app/cases/${caseRow.id}`,
                      typeLabel: x(TYPE_LABEL[caseRow.caseType]),
                      jurisdiction: caseRow.province,
                      openedLabel: fill(x(M.analytics_cases_opened), {
                        date: formatDayISO(caseRow.openedISO, locale),
                      }),
                      daysOpen,
                      daysLabel:
                        daysOpen === 1
                          ? x(M.analytics_cases_day_one)
                          : fill(x(M.analytics_cases_days), { n: daysOpen }),
                    }))}
                  />
                </>
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* Policy acknowledgments — no tracking data source in production
              yet; the card states that plainly instead of hiding. */}
        <AnalyticsCard title={x(M.analytics_ack_title)} hidden={!show('acks')}>
          <CardEmpty text={x(M.analytics_ack_empty)} />
        </AnalyticsCard>

        {/* A · Certifications & training — from hr_expiry_records. */}
        <AnalyticsCard
          title={x(M.analytics_certs_title)}
          subtitle={x(M.analytics_certs_sub)}
          hidden={!show('certifications')}
        >
          <CardData deps={[expiryRecords]} skeletonLines={4}>
            {() =>
              certRecords.length === 0 ? (
                <CardEmpty text={x(M.analytics_certs_prod_empty)} />
              ) : flattenBuckets(certBuckets).length === 0 ? (
                <CardEmpty text={x(M.analytics_certs_empty)} />
              ) : (
                <ExpiryBucketsSection
                  counts={{
                    expired: certBuckets.expired.length,
                    within30: certBuckets.within30.length,
                    within60: certBuckets.within60.length,
                    within90: certBuckets.within90.length,
                  }}
                  rows={flattenBuckets(certBuckets).map(toExpiryRow)}
                />
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* C · Probation periods ending — employees.probation_end_date,
              with the review-task linkage checked exactly (task metadata). */}
        <AnalyticsCard
          title={x(M.analytics_probation_title)}
          subtitle={x(M.analytics_probation_sub)}
          hidden={!show('probation')}
        >
          <CardData deps={[employees, tasks]} skeletonLines={3}>
            {() =>
              !anyProbationDates ? (
                <CardEmpty text={x(M.analytics_probation_prod_empty)} />
              ) : probationRows.length === 0 ? (
                <CardEmpty text={x(M.analytics_probation_empty)} />
              ) : (
                <ProbationList rows={probationRows} />
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* D · Document expiries — from hr_expiry_records. */}
        <AnalyticsCard
          title={x(M.analytics_docs_title)}
          subtitle={x(M.analytics_docs_sub)}
          hidden={!show('documents')}
        >
          <CardData deps={[expiryRecords]} skeletonLines={4}>
            {() =>
              docRecords.length === 0 ? (
                <CardEmpty text={x(M.analytics_docs_prod_empty)} />
              ) : flattenBuckets(docBuckets).length === 0 ? (
                <CardEmpty text={x(M.analytics_docs_empty)} />
              ) : (
                <ExpiryBucketsSection
                  counts={{
                    expired: docBuckets.expired.length,
                    within30: docBuckets.within30.length,
                    within60: docBuckets.within60.length,
                    within90: docBuckets.within90.length,
                  }}
                  rows={flattenBuckets(docBuckets).map(toExpiryRow)}
                />
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* E · Leave overview — hr_leaves records, with a bare row for
              anyone marked on_leave who has no record yet. */}
        <AnalyticsCard
          title={x(M.analytics_leave_title)}
          subtitle={x(M.analytics_leave_sub)}
          hidden={!show('leave')}
        >
          <CardData deps={[employees, leaves]} skeletonLines={3}>
            {() =>
              leaveRows.length === 0 ? (
                <CardEmpty text={x(M.analytics_leave_empty)} />
              ) : (
                <>
                  <LeaveList rows={leaveRows} />
                  {bareOnLeave.length > 0 && (
                    <p className="mt-[8px] mb-0 text-[11.5px] text-text-faint">
                      {x(M.analytics_leave_prod_note)}
                    </p>
                  )}
                </>
              )
            }
          </CardData>
        </AnalyticsCard>

        {/* F · Headcount & turnover — headcount history accumulates via the
              monthly snapshot; turnover awaits termination history. */}
        <AnalyticsCard
          title={x(M.analytics_trend_title)}
          subtitle={x(M.analytics_trend_sub)}
          className="min-[900px]:col-span-2"
          hidden={!show('trend')}
        >
          <CardData deps={[employees, snapshots]} skeletonLines={4}>
            {() =>
              liveHeadcount === null || liveHeadcount === 0 ? (
                <CardEmpty text={x(M.analytics_trend_empty)} />
              ) : (
                <>
                  {turnoverNow !== null && (
                    <div className="mb-[12px] flex gap-[10px]">
                      <div className="min-w-0 flex-1 rounded-[10px] border border-border-soft bg-surface-2 px-[12px] py-[10px]">
                        <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
                          <span className="font-display text-[22px] font-bold text-text">
                            {formatPct(turnoverNow, locale)}
                          </span>
                          {turnoverDelta !== null && (
                            <DeltaChip
                              delta={turnoverDelta}
                              goodWhenUp={false}
                              label={fill(x(M.analytics_turnover_delta), {
                                delta: formatSignedDecimal(turnoverDelta, locale),
                                month: formatMonthISO(priorWindowEndISO, locale, 'long'),
                              })}
                            />
                          )}
                        </div>
                        <div className="mt-[2px] text-[11.5px] text-text-muted">
                          {x(M.analytics_turnover_label)}
                        </div>
                      </div>
                    </div>
                  )}
                  {headcountTrend.length >= 2 ? (
                    <TrendLineChart
                      points={headcountTrend}
                      ariaLabel={x(M.analytics_trend_chart_aria).replace(
                        '{points}',
                        headcountTrend
                          .map((p) => `${formatMonthISO(p.monthISO, locale, 'long')} ${p.value}`)
                          .join(', '),
                      )}
                      valueHeader={x(M.analytics_trend_table_value)}
                    />
                  ) : (
                    <p className="m-0 text-[12.5px] text-text-muted">
                      {x(M.analytics_trend_first_point)}
                    </p>
                  )}
                  {turnoverNow === null && (
                    <p className="mt-[8px] mb-0 text-[11.5px] text-text-faint">
                      {x(M.analytics_turnover_prod_note)}
                    </p>
                  )}
                </>
              )
            }
          </CardData>
        </AnalyticsCard>
      </div>
    </AppPage>
  )
}
