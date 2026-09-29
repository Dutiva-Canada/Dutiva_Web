import type { Bi } from '@/i18n/core'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { fill } from '@/lib/format'
import type {
  ProductionEmployee,
  ProductionLeave,
} from '@/features/app/views/employees/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import type { ProductionObligation } from '@/features/app/views/compliance/productionApi'
import type { ProductionTask } from '@/features/app/views/tasks/productionApi'
import { hasProbationReviewTask } from '@/features/app/views/tasks/productionApi'
import type { AttentionRow } from './AttentionList'
import type { LeaveDisplayRow } from './LeaveList'
import type { ScoreSnapshot } from './productionApi'
import { attentionChipLabel, attentionSecondary } from './attentionLabels'
import type { ExpiryBuckets, ScoreComponent } from './aggregation'
import {
  addDaysISO,
  daysBetweenISO,
  meanInWindow,
  rankAttention,
  turnoverRatePct,
} from './aggregation'
import { formatDayISO } from './format'

/**
 * Pure per-card row derivations for the production dashboard — extracted so
 * AnalyticsProductionView stays an orchestrator and each mapping is
 * unit-testable without React.
 */

const ATTENTION_CAP = 5

type X = (value: Bi) => string

interface DatedRecord {
  id: string
  expiryISO: string
  name: string
  employeeId: string
  employeeName: string | null
  employeeJurisdiction: string | null
}

export function attentionRowsOf(
  input: {
    tasks: readonly ProductionTask[]
    cases: readonly ProductionCase[]
    obligations: readonly ProductionObligation[]
    certBuckets: ExpiryBuckets<DatedRecord>
    docBuckets: ExpiryBuckets<DatedRecord>
  },
  todayISO: string,
  x: X,
  locale: string,
): { rows: AttentionRow[]; totalCount: number } {
  const pool = [
    ...input.tasks
      .filter((t) => !t.done && t.dueDate !== null)
      .map((t) => ({
        id: `task-${t.id}`,
        dueISO: t.dueDate!,
        title: t.title,
        secondary: x(M.analytics_attention_task_kind),
        href: '/app/planning/tasks',
      })),
    ...input.cases
      .filter((c) => c.status !== 'resolved' && c.dueDate !== null)
      .map((c) => ({
        id: `case-${c.id}`,
        dueISO: c.dueDate!,
        title: c.title,
        secondary: attentionSecondary(c.jurisdiction, undefined, x),
        href: `/app/cases/${c.id}`,
      })),
    /* Obligations without evidence on file, once dated — the same pool the
       demo card draws from. */
    ...input.obligations
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
    ...[
      ...input.certBuckets.expired,
      ...input.docBuckets.expired,
      ...input.docBuckets.within30,
    ].map((record) => ({
      id: record.id,
      dueISO: record.expiryISO,
      title: record.employeeName ? `${record.name} — ${record.employeeName}` : record.name,
      secondary: attentionSecondary(record.employeeJurisdiction ?? '', undefined, x),
      href: `/app/employees/${record.employeeId}`,
    })),
  ]
  const ranked = rankAttention(pool, todayISO)
  return {
    rows: ranked.slice(0, ATTENTION_CAP).map((r) => ({
      key: r.item.id,
      title: r.item.title,
      secondary: r.item.secondary,
      status: r.status,
      chipLabel: attentionChipLabel(r, x, locale),
      href: r.item.href,
    })),
    totalCount: ranked.length,
  }
}

export function headcountRowsOf(
  activeEmployees: readonly ProductionEmployee[],
): { key: string; label: string; value: number }[] {
  const counts = new Map<string, number>()
  for (const employee of activeEmployees) {
    counts.set(employee.jurisdiction, (counts.get(employee.jurisdiction) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([province, value]) => ({ key: province, label: province, value }))
}

/** Service milestones due within 30 days — probation end dates, with the
    review-task linkage checked exactly (task metadata). */
export function serviceMilestoneRowsOf(
  employeeRows: readonly ProductionEmployee[],
  taskRows: readonly ProductionTask[],
  todayISO: string,
  locale: string,
): {
  hasProbationDates: boolean
  rows: {
    key: string
    name: string
    secondary: string
    endLabel: string
    daysLeft: number
    reviewTaskCreated: boolean
    href: string
  }[]
} {
  return {
    hasProbationDates: employeeRows.some((e) => e.probationEndDate !== null),
    rows: employeeRows
      .filter((e) => e.status !== 'terminated' && e.probationEndDate !== null)
      .map((e) => ({ employee: e, daysLeft: daysBetweenISO(todayISO, e.probationEndDate!) }))
      .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .map(({ employee, daysLeft }) => ({
        key: employee.id,
        name: employee.name,
        secondary: [employee.title, employee.jurisdiction].filter(Boolean).join(' · '),
        endLabel: formatDayISO(employee.probationEndDate!, locale),
        daysLeft,
        reviewTaskCreated: hasProbationReviewTask(taskRows, employee.id),
        href: `/app/employees/${employee.id}`,
      })),
  }
}

/** Real leave records first, with a bare fallback row for anyone whose
    roster status says on_leave but has no record yet. */
export function leaveRowsOf(
  leaveRows: readonly ProductionLeave[],
  activeEmployees: readonly ProductionEmployee[],
  todayISO: string,
  x: X,
  locale: string,
): { rows: LeaveDisplayRow[]; bareCount: number } {
  const currentLeaves = leaveRows.filter((l) => l.endedOn === null)
  const coveredEmployeeIds = new Set(currentLeaves.map((l) => l.employeeId))
  const bareOnLeave = activeEmployees.filter(
    (e) => e.status === 'on_leave' && !coveredEmployeeIds.has(e.id),
  )
  const rows: LeaveDisplayRow[] = [
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
      type: e.title ?? e.jurisdiction,
      protected: false,
      returnLabel: x(M.analytics_leave_on_now),
      imminent: false,
      href: `/app/employees/${e.id}`,
      sortKey: '9999-12-31',
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  return { rows, bareCount: bareOnLeave.length }
}

/** Turnover — real once termination dates exist. */
export function turnoverOf(
  input: {
    employees: readonly ProductionEmployee[]
    snapshots: readonly ScoreSnapshot[]
    headcountTrend: readonly { monthISO: string; value: number }[]
    liveHeadcount: number | null
  },
  todayISO: string,
  currentMonthISO: string,
): { now: number | null; delta: number | null; priorWindowEndISO: string } {
  const terminationDates = input.employees
    .map((e) => e.terminationDate)
    .filter((d): d is string => d !== null)
  const priorWindowEndISO = addDaysISO(currentMonthISO, -1)
  const currentAvgHeadcount =
    meanInWindow(input.headcountTrend, addDaysISO(todayISO, -365), todayISO) ?? input.liveHeadcount
  const priorAvgHeadcount = meanInWindow(
    input.snapshots
      .filter((s) => s.headcount !== null)
      .map((s) => ({ monthISO: s.monthISO, value: s.headcount! })),
    addDaysISO(priorWindowEndISO, -365),
    priorWindowEndISO,
  )
  const now =
    terminationDates.length > 0
      ? turnoverRatePct(terminationDates, todayISO, currentAvgHeadcount)
      : null
  const prior =
    now !== null ? turnoverRatePct(terminationDates, priorWindowEndISO, priorAvgHeadcount) : null
  const delta = now !== null && prior !== null ? Math.round((now - prior) * 10) / 10 : null
  return { now, delta, priorWindowEndISO }
}

export function breakdownRowsOf(
  components: readonly ScoreComponent[],
  x: X,
): {
  key: string
  label: string
  pct: number
  valueText: string
  flagged: boolean
}[] {
  const componentLabels: Record<string, string> = {
    policies: x(M.analytics_comp_policies),
    tasks: x(M.analytics_comp_tasks),
    findings: x(M.analytics_comp_findings),
    obligations: x(M.analytics_comp_obligations),
    comms_issues: x(M.analytics_comp_comms_issues),
    comms_submissions: x(M.analytics_comp_comms_submissions),
    comms_brand_claims: x(M.analytics_comp_comms_brand_claims),
    comms_policy_files: x(M.analytics_comp_comms_policy_files),
    security: x(M.analytics_comp_security),
    operations: x(M.analytics_comp_operations),
    governance: x(M.analytics_comp_governance),
    revenue: x(M.analytics_comp_revenue),
    specialists: x(M.analytics_comp_specialists),
  }
  const presentPcts = components.filter((c) => c.pct !== null).map((c) => c.pct!)
  const lowestPct = presentPcts.length >= 2 ? Math.min(...presentPcts) : null
  return components
    .filter((c) => c.pct !== null)
    .map((c) => ({
      key: c.key,
      label: componentLabels[c.key] ?? c.key,
      pct: c.pct!,
      valueText: fill(x(M.analytics_comp_value), { done: c.done, total: c.total }),
      flagged: lowestPct !== null && c.pct === lowestPct,
    }))
}
