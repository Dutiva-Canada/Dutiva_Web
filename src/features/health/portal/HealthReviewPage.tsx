import '@/features/invest/portal/strategies.css'
import './health.css'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useI18n } from '@/i18n/context'
import { AgentReviewQueue, type KindRenderer } from '@/features/agent/AgentReviewQueue'
import { addHabit } from '@/features/health/data/api'
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

export function HealthReviewPage() {
  const { x } = useI18n()
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
            await addHabit(name)
            showToast(HM.health_habit_added)
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
        messages={{
          empty: HM.health_review_empty,
          dismiss: HM.health_ai_habit_dismiss,
          acceptFallback: HM.health_review_ack,
          loadFailed: HM.health_review_load_failed,
          filedBy: HM.health_review_filed_by,
          kindLabel: { habit: HM.health_review_kind_habit },
        }}
      />
    </div>
  )
}
