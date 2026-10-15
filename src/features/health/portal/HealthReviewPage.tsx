import '@/features/invest/portal/strategies.css'
import './health.css'
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useI18n } from '@/i18n/context'
import { AgentReviewQueue, type KindRenderer } from '@/features/agent/AgentReviewQueue'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  addHabit,
  addHealthMemory,
  listSharedJournalEntries,
  sendHealthReaction,
  unshareEntryFromMira,
} from '@/features/health/data/api'
import type { HealthJournalEntry } from '@/features/health/data/types'
import type { AgentSuggestion } from '@/lib/agentQueue'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtRelativeDateTime } from './healthUi'
import { useHealthHead } from './useHealthHead'

/**
 * /health/review — the portal's agent inbox. Suggested habits wait here for
 * a human decision; accepting one adds it to the habits list, dismissing
 * just files the suggestion away. Non-clinical by the same rule as the
 * producer: aggregates in, suggestions out, the person decides.
 */

interface HabitPayload {
  name?: string
  why?: string
}

/* Mira's proposed memories — she can offer "remember this" in chat, but a
   memory only exists once the person accepts it here (source 'mira'). */
interface MemoryPayload {
  text?: string
}

/* The consent ledger — every journal entry Mira can currently read, with
   the revoke switch right on the row. Sharing is per-entry and stamped on
   the row itself; this list is the one place the whole set is visible. */
function SharedEntries() {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const [shared, setShared] = useState<HealthJournalEntry[] | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())

  const load = useCallback(async () => {
    try {
      setShared(await listSharedJournalEntries())
      setLoadFailed(false)
    } catch {
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = async (id: string) => {
    if (busyIds.has(id)) return
    setBusyIds((cur) => new Set(cur).add(id))
    try {
      await unshareEntryFromMira(id)
      /* Both truths: the ledger refetches, and refresh keeps the journal
         row's own share stamp honest if it's inside the capped window. */
      await Promise.all([load(), refresh()])
      showToast(HM.health_review_shared_revoked)
    } catch {
      showToast(HM.health_journal_unshare_failed)
    } finally {
      setBusyIds((cur) => {
        const next = new Set(cur)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
      <div className="sb-section-head" style={{ marginTop: 0 }}>
        <h2 className="m-0 text-[16px]">{x(HM.health_review_shared_title)}</h2>
      </div>
      <p className="sb-body-text" style={{ marginTop: 0 }}>{x(HM.health_review_shared_sub)}</p>
      {loadFailed ? (
        <div className="sb-empty" role="alert">
          {x(HM.health_review_shared_load_failed)}{' '}
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            onClick={() => void load()}
          >
            {x(HM.health_retry)}
          </button>
        </div>
      ) : shared === undefined ? (
        <div className="sb-empty">{x(HM.health_loading)}</div>
      ) : shared.length === 0 ? (
        <div className="sb-empty">{x(HM.health_review_shared_empty)}</div>
      ) : (
        <div className="hb-rows" role="list">
          {shared.map((e) => {
            const title = e.title.trim() || x(HM.health_journal_untitled)
            return (
              <div key={e.id} className="hb-row" role="listitem">
                <div className="hb-row-main">
                  <span className="hb-row-title">{title}</span>
                  <span className="hb-row-meta">
                    {e.sharedAt ? fmtRelativeDateTime(e.sharedAt, lang) : ''}
                  </span>
                </div>
                <div className="hb-row-side">
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    disabled={busyIds.has(e.id)}
                    aria-label={x(HM.health_journal_unshare_named).replace('{title}', title)}
                    onClick={() => void revoke(e.id)}
                  >
                    {busyIds.has(e.id) && (
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    )}
                    {x(HM.health_journal_unshare_mira)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function HealthReviewPage() {
  const { x, lang } = useI18n()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_review, HM.health_review_sub)

  const kinds: Record<string, KindRenderer> = {
    habit: {
      detail: (s) => (s.payload as HabitPayload | null)?.why ?? null,
      actions: [
        {
          label: HM.health_review_accept_habit,
          action: 'added',
          run: async (s: AgentSuggestion) => {
            const name = (s.payload as HabitPayload | null)?.name?.trim()
            if (!name) return
            /* The dedupe below needs the provider's first load — accepting
               before it lands would check against an empty list. */
            if (state === undefined) {
              showToast(HM.health_review_wait_load)
              return
            }
            /* Idempotent — a resolve that failed after the write leaves the
               row pending; the retry must not add a second copy. */
            const dupe = state.habits.some(
              (h) => h.name.trim().toLowerCase() === name.toLowerCase(),
            )
            if (dupe) {
              showToast(HM.health_habit_exists)
              return
            }
            await addHabit(name)
            showToast(HM.health_habit_added)
            /* No MiraNote on this surface — the reply still lands in the
               chat thread as a persisted turn. */
            void sendHealthReaction({ type: 'habit_added', habit: name }, lang, () => {})
          },
        },
      ],
    },
    memory: {
      detail: () => null,
      actions: [
        {
          label: HM.health_review_accept_memory,
          action: 'remembered',
          run: async (s: AgentSuggestion) => {
            const text = (s.payload as MemoryPayload | null)?.text?.trim()
            if (!text) return
            /* Same load gate — the dedupe check is only as good as the
               list it reads. */
            if (state === undefined) {
              showToast(HM.health_review_wait_load)
              return
            }
            /* Same idempotency — a retried resolve can't write the memory
               twice. */
            const dupe = state.memories.some(
              (m) => m.text.trim().toLowerCase() === text.toLowerCase(),
            )
            if (dupe) return
            await addHealthMemory(text, 'mira')
            showToast(HM.health_mem_added)
            /* Parity with habit accepts — Mira notes it in the thread. */
            void sendHealthReaction({ type: 'memory_added', text }, lang, () => {})
          },
        },
      ],
    },
  }

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_review_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_review_sub)}</p>

      <AgentReviewQueue
        surface="health"
        kinds={kinds}
        /* Resolving rows shrinks pendingReview — refresh so the nav badge
           drops at once instead of waiting for another page's load. */
        onChanged={() => void refresh()}
        resolved={{
          title: HM.health_review_resolved_title,
          putback: HM.health_review_resolved_putback,
          putbackNamed: HM.health_review_resolved_putback_named,
          restored: HM.health_review_resolved_restored,
          statusWord: {
            accepted: HM.health_review_resolved_accepted,
            dismissed: HM.health_review_resolved_dismissed,
          },
        }}
        messages={{
          empty: HM.health_review_empty,
          dismiss: HM.health_ai_habit_dismiss,
          acceptFallback: HM.health_review_ack,
          loadFailed: HM.health_review_load_failed,
          filedBy: HM.health_review_filed_by,
          actionFailed: HM.health_review_action_failed,
          dismissed: HM.health_review_dismissed,
          kindLabel: { habit: HM.health_review_kind_habit, memory: HM.health_review_kind_memory },
        }}
      />

      <SharedEntries />
    </div>
  )
}
