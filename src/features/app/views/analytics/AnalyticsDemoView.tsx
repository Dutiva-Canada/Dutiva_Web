import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import {
  cases,
  certifications,
  complianceCategories,
  complianceItems,
  demoTodayISO,
  employeeDocuments,
  headcountByJurisdiction,
  headcountHistory,
  headcountTotal,
  jurisdictionScores,
  leaveOverview,
  obligations,
  policyAcknowledgment,
  serviceMilestones,
  scoreHistory,
  turnover,
} from '@/data'
import type { ExpiryRecord } from '@/data'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { AckMeter } from './AckMeter'
import { AttentionList } from './AttentionList'
import type { AttentionRow } from './AttentionList'
import { DeltaChip } from './DeltaChip'
import { ExpiryBucketsSection } from './ExpiryBucketsSection'
import type { ExpiryDisplayRow } from './ExpiryBucketsSection'
import { JurisdictionBars } from './JurisdictionBars'
import { LeaveList } from './LeaveList'
import { OpenCaseRows } from './OpenCaseRows'
import { ServiceMilestoneList } from './ServiceMilestoneList'
import { ScoreBreakdownMeters } from './ScoreBreakdownMeters'
import { ScoreHero } from './ScoreHero'
import { TrendLineChart } from './TrendLineChart'
import { StatTile } from './StatTile'
import {
  ackProgress,
  caseAging,
  daysBetweenISO,
  expiryBuckets,
  flattenBuckets,
  formatMonthISO,
  rankAttention,
  scoreDelta,
} from './aggregation'
import { attentionChipLabel, attentionSecondary } from './attentionLabels'
import { fill, formatDayISO, formatPct, formatSignedDecimal, intlLocale } from './format'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Analytics (formerly Reports) — the workspace dashboard. Phase 1: the
 * compliance score (trend + breakdown + per-jurisdiction scores), the
 * needs-attention queue, headcount by jurisdiction, open-case aging and
 * policy acknowledgments. Phase 2 adds certifications & training expiring,
 * service milestones, document expiries, the leave overview and the headcount
 * & turnover trend.
 *
 * Demo mode renders the Northgate diorama below — every number computed
 * from `src/data` fixtures against the diorama's fixed "today"; production
 * renders AnalyticsProductionView (live aggregation).
 */

const ATTENTION_CAP = 5
const LEAVE_IMMINENT_DAYS = 14
const JURISDICTION_FLAG_GAP = 10

/** Northgate fixtures — demo workspace and public `/demo` only. */
export function AnalyticsDemoView() {
  const { x, lang } = useI18n()
  const locale = intlLocale(lang)

  /* ── Compliance score ──────────────────────────────────────────────────── */
  const delta = scoreDelta(scoreHistory)
  const currentScore = scoreHistory.at(-1)?.score ?? 0
  const lowestCategoryScore = Math.min(...complianceCategories.map((c) => c.score))
  const breakdownRows = complianceCategories.map((cat) => ({
    key: cat.key,
    label: x(cat.label),
    pct: cat.score,
    valueText: String(cat.score),
    flagged: cat.score === lowestCategoryScore,
  }))

  /* Score by jurisdiction — flagged when ≥10 points under the blended score,
     so one weak province can't hide behind a strong overall number. */
  const jurisdictionRows = jurisdictionScores.map((jur) => {
    const gap = currentScore - jur.score
    const flagged = gap >= JURISDICTION_FLAG_GAP
    return {
      key: jur.key,
      label: x(jur.label),
      pct: jur.score,
      valueText: String(jur.score),
      flagged,
      flagLabel: flagged ? fill(x(M.analytics_jur_flag), { n: `−${gap}` }) : undefined,
    }
  })

  /* ── Expiry buckets (certifications & training / employee documents) ───── */
  const certBuckets = expiryBuckets(certifications, demoTodayISO)
  const docBuckets = expiryBuckets(employeeDocuments, demoTodayISO)

  const toExpiryRow = (record: ExpiryRecord): ExpiryDisplayRow => ({
    key: record.id,
    title: x(record.name),
    secondary: `${record.employeeName} · ${x(record.jurisdiction)}`,
    dateLabel: formatDayISO(record.expiryISO, locale),
    expired: daysBetweenISO(demoTodayISO, record.expiryISO) < 0,
    href: record.employeeId ? `/app/employees/${record.employeeId}` : undefined,
  })

  /* ── Needs attention ───────────────────────────────────────────────────
     Dated compliance items across programs, plus the escalations the spec
     demands: expired certifications, and employee documents that are
     expired or inside 30 days (an expiring work permit is a compliance
     event — zero silent expiries). */
  const escalatedDocs = [...docBuckets.expired, ...docBuckets.within30]
  const attentionPool = [
    ...obligations
      .filter((ob) => ob.status !== 'ok')
      .map((ob) => ({
        id: ob.id,
        dueISO: ob.dueISO,
        title: x(ob.title),
        secondary: attentionSecondary(x(ob.jurLabel), ob.affected, x),
        href: '/app/compliance',
      })),
    ...complianceItems
      .filter((item) => item.severity !== 'Resolved' && item.dueISO !== undefined)
      .map((item) => ({
        id: item.id,
        dueISO: item.dueISO!,
        title: x(item.title),
        secondary: attentionSecondary(x(item.province), item.affected, x),
        href: '/app/compliance',
      })),
    ...certBuckets.expired.map((cert) => ({
      id: cert.id,
      dueISO: cert.expiryISO,
      title: `${x(cert.name)} — ${cert.employeeName}`,
      secondary: attentionSecondary(x(cert.jurisdiction), undefined, x),
      href: cert.employeeId ? `/app/employees/${cert.employeeId}` : '/app/employees',
    })),
    ...escalatedDocs.map((doc) => ({
      id: doc.id,
      dueISO: doc.expiryISO,
      title: `${x(doc.name)} — ${doc.employeeName}`,
      secondary: attentionSecondary(x(doc.jurisdiction), undefined, x),
      href: doc.employeeId ? `/app/employees/${doc.employeeId}` : '/app/employees',
    })),
  ]
  const ranked = rankAttention(attentionPool, demoTodayISO)
  const attentionRows: AttentionRow[] = ranked.slice(0, ATTENTION_CAP).map((r) => ({
    key: r.item.id,
    title: r.item.title,
    secondary: r.item.secondary,
    status: r.status,
    chipLabel: attentionChipLabel(r, x, locale),
    href: r.item.href,
  }))

  /* ── Open cases ────────────────────────────────────────────────────────── */
  const openCases = cases.filter((c) => c.status.en !== 'Resolved')
  const aging = caseAging(openCases, demoTodayISO)

  /* ── Policy acknowledgments ────────────────────────────────────────────── */
  const ack = ackProgress(policyAcknowledgment.signed, policyAcknowledgment.total)

  /* ── Service milestones / leave / trend ────────────────────────────────── */
  const serviceMilestoneRows = serviceMilestones
    .map((row) => ({ row, daysLeft: daysBetweenISO(demoTodayISO, row.endISO) }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(({ row, daysLeft }) => ({
      key: row.id,
      name: row.employeeName,
      secondary: `${x(row.role)} · ${x(row.jurisdiction)}`,
      endLabel: formatDayISO(row.endISO, locale),
      daysLeft,
      reviewTaskCreated: row.reviewTaskCreated,
      href: row.employeeId ? `/app/employees/${row.employeeId}` : undefined,
    }))

  const leaveRows = leaveOverview
    .map((record) => {
      const daysToReturn =
        record.returnISO === null ? null : daysBetweenISO(demoTodayISO, record.returnISO)
      return {
        key: record.id,
        name: record.employeeName,
        type: x(record.type),
        protected: record.protected,
        returnLabel:
          record.returnISO !== null
            ? fill(x(M.analytics_leave_returns), {
                date: formatDayISO(record.returnISO, locale),
              })
            : record.note
              ? x(record.note)
              : x(M.analytics_leave_on_now),
        imminent: daysToReturn !== null && daysToReturn >= 0 && daysToReturn <= LEAVE_IMMINENT_DAYS,
        href: record.employeeId ? `/app/employees/${record.employeeId}` : undefined,
        sortKey: record.returnISO ?? '9999-12-31',
      }
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  const turnoverDelta = turnover.ratePct - turnover.priorRatePct

  return (
    <AppPage width="default" responsivePad>
      <div className="mb-[14px] text-[13px] text-text-muted">{x(M.analytics_subtitle)}</div>

      <div className="grid grid-cols-1 gap-[14px] min-[900px]:grid-cols-2 min-[900px]:gap-[16px]">
        {/* Compliance score — hero, windowed trend, breakdown, jurisdictions */}
        <AnalyticsCard title={x(M.analytics_score_title)} className="min-[900px]:col-span-2">
          <ScoreHero score={currentScore} delta={delta} />
          <div className="mt-[10px]">
            <TrendLineChart
              points={scoreHistory.map((p) => ({ monthISO: p.monthISO, value: p.score }))}
              ariaLabel={x(M.analytics_score_chart_aria).replace(
                '{points}',
                scoreHistory
                  .map((p) => `${formatMonthISO(p.monthISO, locale, 'long')} ${p.score}`)
                  .join(', '),
              )}
              valueHeader={x(M.analytics_score_table_score)}
              clampMax={100}
            />
          </div>
          <div className="mt-[14px] border-t border-border-soft pt-[14px]">
            <div className="mb-[10px] text-[11.5px] font-bold tracking-[0.04em] uppercase text-text-muted">
              {x(M.analytics_score_breakdown_title)}
            </div>
            <ScoreBreakdownMeters rows={breakdownRows} />
          </div>
          <div className="mt-[14px] border-t border-border-soft pt-[14px]">
            <div className="mb-[10px] text-[11.5px] font-bold tracking-[0.04em] uppercase text-text-muted">
              {x(M.analytics_jur_score_title)}
            </div>
            <ScoreBreakdownMeters rows={jurisdictionRows} />
          </div>
        </AnalyticsCard>

        {/* Needs attention */}
        <AnalyticsCard
          title={x(M.analytics_attention_title)}
          subtitle={x(M.analytics_attention_sub)}
        >
          {attentionRows.length === 0 ? (
            <CardEmpty text={x(M.analytics_attention_empty)} />
          ) : (
            <AttentionList
              rows={attentionRows}
              viewAllHref="/app/compliance"
              viewAllLabel={fill(x(M.analytics_attention_view_all), { n: ranked.length })}
            />
          )}
        </AnalyticsCard>

        {/* Headcount by jurisdiction */}
        <AnalyticsCard
          title={x(M.analytics_headcount_title)}
          subtitle={fill(x(M.analytics_headcount_total), { n: headcountTotal })}
        >
          <JurisdictionBars
            rows={headcountByJurisdiction.map((row) => ({
              key: row.key,
              label: x(row.label),
              value: row.value,
            }))}
          />
          <p className="mt-[10px] mb-0 text-[11.5px] text-text-faint">
            {x(M.analytics_headcount_footnote)}
          </p>
        </AnalyticsCard>

        {/* Open cases */}
        <AnalyticsCard title={x(M.analytics_cases_title)}>
          {aging === null ? (
            <CardEmpty text={x(M.analytics_cases_empty)} />
          ) : (
            <>
              <div className="mb-[12px] flex gap-[10px]">
                <StatTile value={String(aging.openCount)} label={x(M.analytics_cases_open_now)} />
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
                  typeLabel: x(caseRow.typeLabel),
                  jurisdiction: x(caseRow.province),
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
          )}
        </AnalyticsCard>

        {/* Policy acknowledgments — outstanding signatures are chased from
              the Communications program (mockup's suggested path). */}
        <AnalyticsCard title={x(M.analytics_ack_title)} subtitle={x(policyAcknowledgment.title)}>
          <AckMeter ack={ack} nudgeHref="/app/communications" />
        </AnalyticsCard>

        {/* A · Certifications & training expiring */}
        <AnalyticsCard title={x(M.analytics_certs_title)} subtitle={x(M.analytics_certs_sub)}>
          {flattenBuckets(certBuckets).length === 0 ? (
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
          )}
        </AnalyticsCard>

        {/* C · Service milestones due */}
        <AnalyticsCard
          title={x(M.analytics_service_milestone_title)}
          subtitle={x(M.analytics_service_milestone_sub)}
        >
          {serviceMilestoneRows.length === 0 ? (
            <CardEmpty text={x(M.analytics_service_milestone_empty)} />
          ) : (
            <ServiceMilestoneList rows={serviceMilestoneRows} />
          )}
        </AnalyticsCard>

        {/* D · Document expiries */}
        <AnalyticsCard title={x(M.analytics_docs_title)} subtitle={x(M.analytics_docs_sub)}>
          {flattenBuckets(docBuckets).length === 0 ? (
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
          )}
        </AnalyticsCard>

        {/* E · Leave overview */}
        <AnalyticsCard title={x(M.analytics_leave_title)} subtitle={x(M.analytics_leave_sub)}>
          {leaveRows.length === 0 ? (
            <CardEmpty text={x(M.analytics_leave_empty)} />
          ) : (
            <LeaveList rows={leaveRows} />
          )}
        </AnalyticsCard>

        {/* F · Headcount & turnover trend */}
        <AnalyticsCard
          title={x(M.analytics_trend_title)}
          subtitle={x(M.analytics_trend_sub)}
          className="min-[900px]:col-span-2"
        >
          <div className="mb-[12px] flex gap-[10px]">
            <div className="min-w-0 flex-1 rounded-[10px] border border-border-soft bg-surface-2 px-[12px] py-[10px]">
              <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
                <span className="font-display text-[22px] font-bold text-text">
                  {formatPct(turnover.ratePct, locale)}
                </span>
                <DeltaChip
                  delta={turnoverDelta}
                  goodWhenUp={false}
                  label={fill(x(M.analytics_turnover_delta), {
                    delta: formatSignedDecimal(turnoverDelta, locale),
                    month: formatMonthISO(turnover.priorMonthISO, locale, 'long'),
                  })}
                />
              </div>
              <div className="mt-[2px] text-[11.5px] text-text-muted">
                {x(M.analytics_turnover_label)}
              </div>
            </div>
          </div>
          <TrendLineChart
            points={headcountHistory}
            ariaLabel={x(M.analytics_trend_chart_aria).replace(
              '{points}',
              headcountHistory
                .map((p) => `${formatMonthISO(p.monthISO, locale, 'long')} ${p.value}`)
                .join(', '),
            )}
            valueHeader={x(M.analytics_trend_table_value)}
          />
        </AnalyticsCard>
      </div>
    </AppPage>
  )
}
