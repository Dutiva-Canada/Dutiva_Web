import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { readHelpfulness, recordHelpfulness } from './helpFeedback'
import type { Helpfulness } from './helpFeedback'
import { trackEvent } from '@/features/support/analytics/supportAnalytics'

/**
 * "Was this article helpful?" — a small, self-contained widget. A vote is
 * remembered locally (helpFeedback) so a returning reader isn't asked again;
 * nothing is transmitted. The status line is an always-present `aria-live`
 * region so the thank-you is announced to assistive technology when a choice
 * is made.
 *
 * Remount per article (a `key={slug}` at the call site) resets the state, so
 * navigating between articles re-reads that article's own stored vote.
 */
export function HelpfulnessWidget({ slug }: { readonly slug: string }) {
  const { t, lang } = useI18n()
  const [vote, setVote] = useState<Helpfulness | null>(() => readHelpfulness(slug))

  function choose(value: Helpfulness) {
    setVote(recordHelpfulness(slug, value))
    trackEvent({
      event_type: 'helpfulness_vote',
      article_slug: slug,
      vote_value: value,
      locale: lang,
    })
  }

  const buttonClass =
    'inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-2 transition-colors hover:border-gold-strong hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-strong'

  return (
    <div
      role="group"
      aria-label={t('help_feedback_question')}
      className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-semibold text-text">{t('help_feedback_question')}</p>
      {vote === null && (
        <div className="flex gap-2.5">
          <button type="button" onClick={() => choose('yes')} className={buttonClass}>
            <ThumbsUp size={15} aria-hidden="true" />
            {t('help_feedback_yes')}
          </button>
          <button type="button" onClick={() => choose('no')} className={buttonClass}>
            <ThumbsDown size={15} aria-hidden="true" />
            {t('help_feedback_no')}
          </button>
        </div>
      )}
      <p aria-live="polite" className="text-sm text-text-2">
        {vote === null
          ? ''
          : vote === 'yes'
            ? t('help_feedback_thanks_yes')
            : t('help_feedback_thanks_no')}
      </p>
    </div>
  )
}
