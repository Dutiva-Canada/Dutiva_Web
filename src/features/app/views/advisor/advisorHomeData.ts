import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { cases, complianceItems, complianceScore, employeeDetails, employees, tasks } from '@/data'
import { homePriorities } from '@/features/app/views/home/homeData'

/**
 * Advisor home (empty state) widgets — the port of the prototype's
 * `buildAdvisorHomeWidgets()` and `buildPriorities()`. Counts are derived
 * from the fixtures the same way the prototype derives them from its state.
 *
 * EN verbatim; FR from the prototype's inline `L(en, fr)` pairs and the
 * `fr ? … : …` branches of `buildPriorities()`.
 */

export type MetricTone = 'risk' | 'warning' | 'info' | 'success'
export type TrendTone = 'risk' | 'success' | 'muted'

export interface HomeMetric {
  value: string
  suffix: string
  tone: MetricTone
  trend: Bi
  trendTone: TrendTone
  /** Workspace view the tile deep-links to (route segment under /app). */
  view: 'compliance' | 'cases' | 'wellbeing'
  /** Message key resolved by the view (advisorViewMessages). */
  labelKey: 'compliance' | 'risk' | 'cases' | 'signals'
}

/** Prototype `buildWellbeingView().attention` — sentiment < 55 head-count. */
export function supportAttentionCount(): number {
  return employees.filter((e) => {
    const sentiment = employeeDetails[e.id]?.sentiment
    return sentiment != null && sentiment < 55
  }).length
}

export function buildHomeMetrics(): HomeMetric[] {
  const openCases = cases.filter((c) => c.status.en !== 'Resolved').length
  const openTasks = tasks.filter((t) => !t.done).length
  const openRisk = complianceItems.filter((c) => c.severity !== 'Resolved').length
  const highRisk = complianceItems.filter((c) => c.severity === 'High').length
  const attention = supportAttentionCount()
  return [
    {
      labelKey: 'compliance',
      value: String(complianceScore),
      suffix: '/100',
      tone: 'warning',
      trend: bi('+8 in 6 mo', '+8 en 6 mois'),
      trendTone: 'success',
      view: 'compliance',
    },
    {
      labelKey: 'risk',
      value: String(openRisk),
      suffix: '',
      tone: 'risk',
      trend: bi(`${highRisk} high`, `${highRisk} élevés`),
      trendTone: 'risk',
      view: 'compliance',
    },
    {
      labelKey: 'cases',
      value: String(openCases),
      suffix: '',
      tone: 'info',
      trend: bi(`${openTasks} open tasks`, `${openTasks} tâches ouvertes`),
      trendTone: 'muted',
      view: 'cases',
    },
    {
      labelKey: 'signals',
      value: String(attention),
      suffix: '',
      tone: attention ? 'warning' : 'success',
      trend: bi('supportive follow-up only', 'suivi de soutien seulement'),
      trendTone: 'muted',
      view: 'wellbeing',
    },
  ]
}

/* Priorities live in the home feature (homeData.ts homePriorities /
   severityLabels) — the Advisor home renders that canonical list. */

/* ------------------------------------------------------------- daily brief */

/** Prototype `buildAdvisorHomeWidgets()` brief sentence, both languages. */
export function buildDailyBrief(): Bi {
  const highCount = homePriorities.filter((p) => p.severity === 'High').length
  const total = homePriorities.length
  if (highCount === 0) {
    return bi(
      `${total} signals are on my radar today. Nothing is high-risk right now — compliance is holding at 82.`,
      `${total} signaux sont sur mon radar aujourd’hui. Rien n’est à risque élevé pour l’instant — la conformité se maintient à 82.`,
    )
  }
  const enItem = highCount === 1 ? ' item needs' : ' items need'
  const frItem = highCount === 1 ? ' élément requiert' : ' éléments requièrent'
  const en = `${highCount}${enItem} action today, and ${total} signals are on my radar. Compliance is holding at 82 — the biggest lever is the overdue Remote Work Policy.`
  const fr = `${highCount}${frItem} une action aujourd’hui, et ${total} signaux sont sur mon radar. La conformité se maintient à 82 — le plus grand levier est la politique de télétravail en retard.`
  return bi(en, fr)
}
