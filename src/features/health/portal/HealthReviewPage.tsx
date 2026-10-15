import '@/features/invest/portal/strategies.css'
import './health.css'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useI18n } from '@/i18n/context'
import { AgentReviewQueue, type KindRenderer } from '@/features/agent/AgentReviewQueue'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addHabit, addHealthMemory, sendHealthReaction } from '@/features/health/data/api'
import type { AgentSuggestion } from '@/lib/agentQueue'
import { useToasts } from '@/features/app/toasts/toastsContext'
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
            /* Idempotent — a resolve that failed after the write leaves the
               row pending; the retry must not add a second copy. */
            const dupe = (state?.habits ?? []).some(
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
            /* Same idempotency — a retried resolve can't write the memory
               twice. */
            const dupe = (state?.memories ?? []).some(
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
    </div>
  )
}
