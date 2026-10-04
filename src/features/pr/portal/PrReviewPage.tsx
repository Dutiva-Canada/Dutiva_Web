import '@/features/invest/portal/strategies.css'
import './pr.css'
import { prMessages as PM } from '@/i18n/messages/pr'
import { useI18n } from '@/i18n/context'
import { AgentReviewQueue, type KindRenderer } from '@/features/agent/AgentReviewQueue'
import { addGeoPrompt } from '@/features/pr/data/api'
import type { AgentSuggestion } from '@/lib/agentQueue'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { usePrHead } from './usePrHead'

/**
 * /pr/review — the desk's agent inbox. Pitch drafts and suggested tracked
 * questions wait here until a human resolves them; resolving an item also
 * carries out the action (adding a question, opening the mail draft), so a
 * row is only ever as real as the user's click.
 */

interface PitchPayload {
  contactId?: string | null
  contactName?: string
  outlet?: string
  email?: string
  subject?: string
  body?: string
}

interface PromptPayload {
  prompt?: string
}

export function PrReviewPage() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  usePrHead(PM.pr_seo_title_review, PM.pr_review_sub)

  const kinds: Record<string, KindRenderer> = {
    pitch: {
      detail: (s) => {
        const p = (s.payload ?? {}) as PitchPayload
        return p.subject ? `Subject: ${p.subject}` : null
      },
      actions: [
        {
          label: PM.pr_review_accept_pitch_copy,
          action: 'copied',
          run: async (s: AgentSuggestion) => {
            const p = (s.payload ?? {}) as PitchPayload
            await navigator.clipboard.writeText(
              `${p.subject ? `Subject: ${p.subject}\n\n` : ''}${p.body ?? ''}`,
            )
            showToast({ en: 'Copied.', fr: 'Copié.' })
          },
        },
        {
          label: PM.pr_review_accept_pitch_mail,
          action: 'opened_email',
          run: async (s: AgentSuggestion) => {
            const p = (s.payload ?? {}) as PitchPayload
            const to = p.email ?? ''
            window.location.href =
              `mailto:${to}?subject=${encodeURIComponent(p.subject ?? '')}` +
              `&body=${encodeURIComponent(p.body ?? '')}`
          },
        },
      ],
    },
    geo_prompt: {
      detail: () => null,
      actions: [
        {
          label: PM.pr_review_accept_prompt,
          action: 'added',
          run: async (s: AgentSuggestion) => {
            const p = (s.payload ?? {}) as PromptPayload
            if (!p.prompt) return
            await addGeoPrompt({ prompt: p.prompt, engine: 'chatgpt' })
            showToast(PM.pr_review_saved)
          },
        },
      ],
    },
  }

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_review_title)}</h1>
      </div>
      <p className="sb-sub">{x(PM.pr_review_sub)}</p>

      <AgentReviewQueue
        surface="pr"
        kinds={kinds}
        messages={{
          empty: PM.pr_review_empty,
          dismiss: PM.pr_ai_dismiss,
          acceptFallback: PM.pr_review_ack,
          loadFailed: PM.pr_review_load_failed,
          filedBy: PM.pr_review_filed_by,
          kindLabel: {
            pitch: PM.pr_review_kind_pitch,
            geo_prompt: PM.pr_review_kind_geo_prompt,
          },
        }}
      />
    </div>
  )
}
