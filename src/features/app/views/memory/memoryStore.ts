import { useSyncExternalStore } from 'react'
import { bi } from '@/i18n/core'
import type { Bi, LText } from '@/i18n/core'
import {
  memoryPrivacyConfig,
  memoryRetentionSchedule,
  memoryScenarioTodayISO,
  seedMemoryFacts,
} from '@/data'
import type {
  MemoryFact,
  MemoryLegalHold,
  MemoryRetentionCategory,
  MemorySensitivity,
  MemoryStatus,
} from '@/data'
import type { MemoryPrivacyConfig } from '@/data'
import type { MemoryRetentionRule } from '@/data'

/**
 * Session-scoped Advisor Memory store. Seeds from the fixtures and applies
 * the memory lifecycle actions:
 *
 * - Add memory (manual entry → confirmed)
 * - Confirm (proposed → confirmed)
 * - Reject (proposed → removed)
 * - Edit (inline statement edit; source stays untouched)
 * - Remove from Advisor memory (record stays stored, becomes Advisor-unusable)
 * - Restore
 * - Legal hold add/remove (pauses scheduled expiration/deletion)
 * - Mark for review
 * - Disable/enable Advisor memory (governance toggle)
 *
 * Every action is appended to the session audit log. Like `advisorSession`,
 * this lives for the browser session and is intentionally not persisted.
 *
 * Privacy: audit entries for removed restricted memories retain
 * accountability metadata (action, actor, timestamp, subject) but not the
 * raw statement text — the audit log must not become a shadow archive of
 * deleted personal information.
 */

export type MemoryAuditAction =
  | 'created'
  | 'proposed'
  | 'confirmed'
  | 'rejected'
  | 'edited'
  | 'removed'
  | 'restored'
  | 'expired'
  | 'exported'
  | 'legal_hold_added'
  | 'legal_hold_removed'
  | 'review_requested'
  | 'memory_disabled'
  | 'memory_enabled'

export interface MemoryAuditEntry {
  id: string
  action: MemoryAuditAction
  actor: string
  /** ISO timestamp. */
  timestamp: string
  factId: string | null
  /** Subject label (person/case name) for navigation/context. */
  subjectLabel: Bi | null
  /** Statement text — omitted for removed restricted memories (privacy). */
  statement: LText | null
  sensitive: boolean
}

export interface MemoryStore {
  facts: MemoryFact[]
  audit: MemoryAuditEntry[]
  memoryEnabled: boolean
  privacyConfig: MemoryPrivacyConfig
  retentionSchedule: MemoryRetentionRule[]
}

const ACTOR = 'Riley Summers'
const TODAY_ISO = memoryScenarioTodayISO

let auditSeq = 0
function nextAuditId(): string {
  auditSeq += 1
  return `a${auditSeq}`
}

/** Facts carry object identity from the fixtures — clone so edits stay local. */
function seeded(): MemoryStore {
  return {
    facts: seedMemoryFacts.map((f) => ({
      ...f,
      source: { ...f.source },
      ...(f.tags != null ? { tags: [...f.tags] } : {}),
      ...(f.legalHold != null ? { legalHold: { ...f.legalHold } } : {}),
    })),
    audit: [],
    memoryEnabled: true,
    privacyConfig: { ...memoryPrivacyConfig, jurisdictions: [...memoryPrivacyConfig.jurisdictions] },
    retentionSchedule: memoryRetentionSchedule.map((r) => ({ ...r })),
  }
}

let store: MemoryStore = seeded()
const listeners = new Set<() => void>()

function emit(next: MemoryStore): void {
  store = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMemoryStore(): MemoryStore {
  return useSyncExternalStore(subscribe, () => store)
}

/** Active facts — excludes removed records from the working list. */
export function activeFacts(facts: readonly MemoryFact[]): MemoryFact[] {
  return facts.filter((f) => (f.status ?? (f.confidence === 'confirmed' ? 'confirmed' : 'proposed')) !== 'removed')
}

function subjectLabelFor(fact: MemoryFact): Bi | null {
  if (fact.scope === 'person') return bi('Person', 'Personne')
  if (fact.scope === 'case') return bi('Case', 'Dossier')
  return bi('Conversation', 'Conversation')
}

function isRestricted(fact: MemoryFact): boolean {
  return fact.sensitivity === 'restricted' || fact.visibility === 'restricted' || fact.sensitive
}

function appendAudit(
  action: MemoryAuditAction,
  fact: MemoryFact | null,
  statement: LText | null = null,
): MemoryAuditEntry {
  const sensitive = fact != null && isRestricted(fact)
  /* For removed restricted memories, do not retain the raw statement. */
  const keepStatement =
    statement != null && !(sensitive && (action === 'removed' || action === 'rejected'))
  const entry: MemoryAuditEntry = {
    id: nextAuditId(),
    action,
    actor: ACTOR,
    timestamp: TODAY_ISO,
    factId: fact?.id ?? null,
    subjectLabel: fact != null ? subjectLabelFor(fact) : null,
    statement: keepStatement ? statement : null,
    sensitive,
  }
  return entry
}

export interface AddMemoryInput {
  scope: MemoryFact['scope']
  entityId: string
  category: MemoryFact['category']
  statement: Bi
  classification?: MemoryFact['classification']
  sensitivity?: MemorySensitivity
  retentionCategory?: MemoryRetentionCategory
  purpose?: Bi | null
  jurisdiction?: string | null
  sourceDetail?: Bi
}

export const memoryActions = {
  addMemory(input: AddMemoryInput): void {
    const id = `m${Date.now().toString(36)}`
    const now = TODAY_ISO
    const restricted = input.sensitivity === 'restricted'
    const fact: MemoryFact = {
      id,
      scope: input.scope,
      entityId: input.entityId,
      category: input.category,
      statement: input.statement,
      confidence: 'confirmed',
      source: {
        type: 'manual',
        detail: input.sourceDetail ?? bi('Manual entry', 'Saisie manuelle'),
      },
      learnedAt: now,
      confirmation: { at: now, source: { type: 'manual', detail: bi('Manual entry', 'Saisie manuelle') } },
      visibility: restricted ? 'restricted' : 'hr',
      sensitive: restricted,
      status: 'confirmed',
      classification: input.classification ?? 'fact',
      origin: 'manual',
      ...(input.sensitivity != null ? { sensitivity: input.sensitivity } : {}),
      advisorUsable: !restricted,
      ...(input.retentionCategory != null ? { retentionCategory: input.retentionCategory } : {}),
      ...(input.purpose != null ? { purpose: input.purpose } : {}),
      ...(input.jurisdiction != null ? { jurisdiction: input.jurisdiction } : {}),
      creator: ACTOR,
      confirmedBy: ACTOR,
    }
    emit({
      ...store,
      facts: [fact, ...store.facts],
      audit: [appendAudit('created', fact, fact.statement), ...store.audit],
    })
  },

  confirm(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact) return
    const status = fact.status ?? (fact.confidence === 'confirmed' ? 'confirmed' : 'proposed')
    if (status === 'confirmed') return
    emit({
      ...store,
      facts: store.facts.map((f) =>
        f.id === id
          ? {
              ...f,
              confidence: 'confirmed',
              status: 'confirmed',
              confirmation: {
                at: TODAY_ISO,
                source: { type: 'manual', detail: bi('Confirmed in Memory', 'Confirmé dans la Mémoire') },
              },
              confirmedBy: ACTOR,
              ...(f.advisorUsable == null ? { advisorUsable: effectiveSensitivityDefault(f) } : {}),
            }
          : f,
      ),
      audit: [appendAudit('confirmed', fact, fact.statement), ...store.audit],
    })
  },

  reject(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact) return
    emit({
      ...store,
      facts: store.facts.map((f) =>
        f.id === id ? { ...f, status: 'removed', advisorUsable: false } : f,
      ),
      audit: [appendAudit('rejected', fact, fact.statement), ...store.audit],
    })
  },

  correct(id: string, statement: string): void {
    const trimmed = statement.trim()
    const fact = store.facts.find((f) => f.id === id)
    if (!fact || trimmed.length === 0) return
    emit({
      ...store,
      facts: store.facts.map((f) => (f.id === id ? { ...f, statement: bi(trimmed, trimmed) } : f)),
      audit: [appendAudit('edited', fact, fact.statement), ...store.audit],
    })
  },

  /** Remove from Advisor memory: record stays stored but becomes Advisor-unusable. */
  remove(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact) return
    emit({
      ...store,
      facts: store.facts.map((f) =>
        f.id === id ? { ...f, status: 'removed', advisorUsable: false } : f,
      ),
      audit: [appendAudit('removed', fact, fact.statement), ...store.audit],
    })
  },

  /** Legacy alias for {@link remove} — kept for existing callers/tests. */
  forget(id: string): void {
    memoryActions.remove(id)
  },

  restore(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact) return
    const priorStatus: MemoryStatus = fact.confidence === 'confirmed' ? 'confirmed' : 'needs_review'
    emit({
      ...store,
      facts: store.facts.map((f) =>
        f.id === id ? { ...f, status: priorStatus, advisorUsable: effectiveSensitivityDefault(f) } : f,
      ),
      audit: [appendAudit('restored', fact, fact.statement), ...store.audit],
    })
  },

  markForReview(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact) return
    emit({
      ...store,
      facts: store.facts.map((f) => (f.id === id ? { ...f, status: 'needs_review' } : f)),
      audit: [appendAudit('review_requested', fact, fact.statement), ...store.audit],
    })
  },

  addLegalHold(id: string, reason: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact || fact.legalHold != null) return
    const trimmed = reason.trim()
    if (trimmed.length === 0) return
    const hold: MemoryLegalHold = {
      reason: bi(trimmed, trimmed),
      placedAt: TODAY_ISO,
      placedBy: ACTOR,
    }
    emit({
      ...store,
      facts: store.facts.map((f) => (f.id === id ? { ...f, legalHold: hold } : f)),
      audit: [appendAudit('legal_hold_added', fact, hold.reason), ...store.audit],
    })
  },

  removeLegalHold(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact || fact.legalHold == null) return
    emit({
      ...store,
      facts: store.facts.map((f) => (f.id === id ? { ...f, legalHold: null } : f)),
      audit: [appendAudit('legal_hold_removed', fact, fact.legalHold.reason), ...store.audit],
    })
  },

  setMemoryEnabled(enabled: boolean): void {
    if (store.memoryEnabled === enabled) return
    emit({
      ...store,
      memoryEnabled: enabled,
      audit: [appendAudit(enabled ? 'memory_enabled' : 'memory_disabled', null, null), ...store.audit],
    })
  },

  setAutoProposalsEnabled(enabled: boolean): void {
    emit({
      ...store,
      privacyConfig: { ...store.privacyConfig, autoProposalsEnabled: enabled },
    })
  },

  setRestrictedRetrieval(restricted: boolean): void {
    emit({
      ...store,
      privacyConfig: { ...store.privacyConfig, restrictAdvisorRetrieval: restricted },
    })
  },

  logExport(facts: readonly MemoryFact[]): void {
    const fact = facts[0] ?? null
    emit({
      ...store,
      audit: [appendAudit('exported', fact, fact?.statement ?? null), ...store.audit],
    })
  },
}

function effectiveSensitivityDefault(f: MemoryFact): boolean {
  return f.sensitivity !== 'restricted' && f.visibility !== 'restricted'
}

/** Test helper — reset to the seed fixtures. */
export function resetMemoryStore(): void {
  auditSeq = 0
  emit(seeded())
}
