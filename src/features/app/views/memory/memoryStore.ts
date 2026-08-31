import { useSyncExternalStore } from 'react'
import { bi } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { memoryScenarioTodayISO, seedMemoryFacts } from '@/data'
import type { MemoryFact } from '@/data'

/**
 * Session-scoped Advisor Memory store. Seeds from the fixtures and applies
 * the three first-class memory actions (Advisor Memory prototype):
 *
 * - Confirm — promotes inferred → confirmed and stamps the date;
 * - Correct — inline statement edit (the source stays untouched);
 * - Forget — removes the memory, honouring a correction/erasure request.
 *
 * Every action is appended to the session audit log ("every add, edit and
 * forget is recorded with who and when"). Like `advisorSession`, this lives
 * for the browser session and is intentionally not persisted.
 */

export type MemoryAuditAction = 'confirm' | 'correct' | 'forget'

export interface MemoryAuditEntry {
  action: MemoryAuditAction
  statement: LText
}

interface MemoryStore {
  facts: MemoryFact[]
  audit: MemoryAuditEntry[]
}

/** Facts carry object identity from the fixtures — clone so edits stay local. */
function seeded(): MemoryStore {
  return { facts: seedMemoryFacts.map((f) => ({ ...f, source: { ...f.source } })), audit: [] }
}

let store: MemoryStore = seeded()
const listeners = new Set<() => void>()

function emit(next: MemoryStore) {
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

const TODAY_ISO = memoryScenarioTodayISO

export const memoryActions = {
  confirm(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact || fact.confidence === 'confirmed') return
    emit({
      facts: store.facts.map((f) =>
        f.id === id
          ? {
              ...f,
              confidence: 'confirmed',
              confirmation: {
                at: TODAY_ISO,
                source: {
                  type: 'manual',
                  detail: bi('Confirmed in Memory', 'Confirmé dans la Mémoire'),
                },
              },
            }
          : f,
      ),
      audit: [{ action: 'confirm', statement: fact.statement }, ...store.audit],
    })
  },

  correct(id: string, statement: string): void {
    const trimmed = statement.trim()
    const fact = store.facts.find((f) => f.id === id)
    if (!fact || trimmed.length === 0) return
    emit({
      /* A correction is operator-entered text — language-neutral until the
         governance backend localizes it. */
      facts: store.facts.map((f) => (f.id === id ? { ...f, statement: bi(trimmed, trimmed) } : f)),
      audit: [{ action: 'correct', statement: fact.statement }, ...store.audit],
    })
  },

  forget(id: string): void {
    const fact = store.facts.find((f) => f.id === id)
    if (!fact) return
    emit({
      facts: store.facts.filter((f) => f.id !== id),
      audit: [{ action: 'forget', statement: fact.statement }, ...store.audit],
    })
  },
}

/** Test helper — reset to the seed fixtures. */
export function resetMemoryStore(): void {
  emit(seeded())
}
