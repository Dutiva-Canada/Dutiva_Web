import { pick, pickL } from '@/i18n/core'
import type { Lang } from '@/i18n/core'
import { cases, employees, memoryThreads } from '@/data'
import type { MemoryFact, MemoryScope } from '@/data'
import { isExpiringSoon } from './memoryModel'

/**
 * Shared Advisor Memory workspace helpers — subject resolution, filtering
 * and metrics. Demo fixtures resolve subjects from `@/data`; production passes
 * its own name maps (see `MemoryManagerProductionView`).
 */

export interface SubjectRef {
  readonly scope: MemoryScope
  readonly id: string
  /** Display name for the subject. */
  readonly label: string
  /** Route to the entity deep-link, when available. */
  readonly href: string | null
}

export interface SubjectMaps {
  /** person id → name */
  readonly personNames: Record<string, string>
  /** case id → title */
  readonly caseTitles: Record<string, string>
  /** thread id → label */
  readonly threadLabels: Record<string, string>
}

/** Demo subject maps built from the Northgate fixtures. */
export function demoSubjectMaps(): SubjectMaps {
  return {
    personNames: Object.fromEntries(employees.map((e) => [e.id, e.name])),
    caseTitles: Object.fromEntries(cases.map((c) => [c.id, pick(c.title, 'en')])),
    threadLabels: Object.fromEntries(
      memoryThreads.map((t) => [t.id, pick(t.navLabel, 'en')]),
    ),
  }
}

export function resolveSubject(fact: MemoryFact, maps: SubjectMaps, _lang: Lang): SubjectRef {
  if (fact.scope === 'person') {
    const name = maps.personNames[fact.entityId] ?? fact.entityId
    return { scope: 'person', id: fact.entityId, label: name, href: `/app/settings/memory/people/${fact.entityId}` }
  }
  if (fact.scope === 'case') {
    const title = maps.caseTitles[fact.entityId] ?? fact.entityId
    return { scope: 'case', id: fact.entityId, label: title, href: `/app/settings/memory/cases/${fact.entityId}` }
  }
  const label = maps.threadLabels[fact.entityId] ?? fact.entityId
  return { scope: 'thread', id: fact.entityId, label, href: `/app/settings/memory/conversations/${fact.entityId}` }
}

export interface MemoryFilterState {
  readonly query: string
  readonly subject: MemoryScope | 'all'
  readonly status: string | 'all'
  readonly source: string | 'all'
  readonly sensitivity: string | 'all'
}

export const emptyMemoryFilter: MemoryFilterState = {
  query: '',
  subject: 'all',
  status: 'all',
  source: 'all',
  sensitivity: 'all',
}

export function isFilterActive(state: MemoryFilterState): boolean {
  return (
    state.query.trim().length > 0 ||
    state.subject !== 'all' ||
    state.status !== 'all' ||
    state.source !== 'all' ||
    state.sensitivity !== 'all'
  )
}

/** Search matches memory text, associated subject, source detail and tags. */
export function memoryMatchesQuery(
  fact: MemoryFact,
  query: string,
  maps: SubjectMaps,
  lang: Lang,
): boolean {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return true
  if (pickL(fact.statement, 'en').toLowerCase().includes(q)) return true
  if (pickL(fact.statement, 'fr').toLowerCase().includes(q)) return true
  const subject = resolveSubject(fact, maps, lang)
  if (subject.label.toLowerCase().includes(q)) return true
  if (pickL(fact.source.detail, lang).toLowerCase().includes(q)) return true
  if (fact.tags?.some((t) => pick(t, lang).toLowerCase().includes(q))) return true
  return false
}

export interface MemoryMetrics {
  readonly active: number
  readonly needsReview: number
  readonly expiringSoon: number
  readonly restricted: number
}

export function computeMetrics(facts: readonly MemoryFact[], todayISO: string): MemoryMetrics {
  let active = 0
  let needsReview = 0
  let expiringSoon = 0
  let restricted = 0
  for (const f of facts) {
    const status = f.status ?? (f.confidence === 'confirmed' ? 'confirmed' : 'proposed')
    if (status === 'removed') continue
    active += 1
    if (status === 'proposed' || status === 'needs_review') needsReview += 1
    if (isExpiringSoon(f, todayISO)) expiringSoon += 1
    if (f.sensitivity === 'restricted' || f.visibility === 'restricted') restricted += 1
  }
  return { active, needsReview, expiringSoon, restricted }
}

/** Distinct subject options that actually have memories, for the filter. */
export function subjectOptions(facts: readonly MemoryFact[]): { scope: MemoryScope; count: number }[] {
  const counts: Record<MemoryScope, number> = { person: 0, case: 0, thread: 0 }
  for (const f of facts) {
    const status = f.status ?? (f.confidence === 'confirmed' ? 'confirmed' : 'proposed')
    if (status === 'removed') continue
    counts[f.scope] += 1
  }
  return (['person', 'case', 'thread'] as MemoryScope[]).map((scope) => ({ scope, count: counts[scope] }))
}
