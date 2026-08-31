import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { usePublicPath } from '@/seo/usePublicPath'
import {
  hasAnalyticsConsent,
  hasConsentResponse,
  setAnalyticsConsent,
} from '@/lib/analyticsConsent'
import { loadConsentedTags } from './gtm'
import { COOKIE_PREFERENCES_EVENT } from './cookiePreferences'

/**
 * Analytics-consent banner (Quebec Law 25 s. 8.1, PIPEDA, the Cookie Policy).
 *
 * Shows on the first visit — when no choice has been recorded — and whenever
 * reopened from the footer's "Cookie preferences" control. Accept and Decline
 * carry equal visual weight: the choice has to be genuine, not a dark pattern
 * that buries the refusal. Nothing here fires without a click, so declining and
 * simply ignoring the banner both leave analytics off, which is the required
 * default.
 *
 * Renders nothing until it has mounted on the client, so the prerendered HTML
 * (scripts/prerender.mjs, where there is no window and no stored choice) and
 * the first client render agree — no hydration mismatch — and the banner then
 * appears only for visitors who still owe a choice. Accepting loads GTM
 * (or GA4 when no container ID is set) immediately when configured, so the
 * decision takes hold without a page reload; first-party support analytics
 * simply reads the stored consent on its next event.
 */
export function ConsentBanner() {
  const { L } = useI18n()
  const { legalDoc } = usePublicPath()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasConsentResponse()) {
      // First visit: the banner owes the visitor a choice.
      setVisible(true)
    } else if (hasAnalyticsConsent()) {
      // Returning visitor who already accepted — start consented tags without a reload.
      loadConsentedTags()
    }

    const reopen = () => setVisible(true)
    window.addEventListener(COOKIE_PREFERENCES_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, reopen)
  }, [])

  useEffect(() => {
    if (!visible) {
      document.body.classList.remove('consent-banner-open')
      return
    }
    document.body.classList.add('consent-banner-open')
    return () => document.body.classList.remove('consent-banner-open')
  }, [visible])

  if (!visible) return null

  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted)
    if (granted) loadConsentedTags()
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label={L('Cookie consent', 'Consentement aux témoins')}
      className="surface-marketing dutiva-surface fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-[880px] flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-4 shadow-modal sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="max-w-[64ch] text-sm leading-[1.6] text-text-2">
          {L(
            'We use necessary cookies to operate Dutiva, plus optional analytics to understand how the site is used. Analytics remain disabled until you accept.',
            'Nous utilisons des témoins nécessaires au fonctionnement de Dutiva, ainsi que des statistiques facultatives pour comprendre l’utilisation du site. Les statistiques restent désactivées tant que vous ne les acceptez pas.',
          )}{' '}
          <Link
            to={legalDoc('cookies')}
            className="font-medium text-gold-strong underline underline-offset-2 hover:opacity-80"
          >
            {L('Cookie Policy', 'Politique relative aux témoins')}
          </Link>
        </p>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-none">
          <button
            type="button"
            onClick={() => choose(false)}
            className="ghost-button ghost-button-md min-h-11 w-full sm:w-auto"
          >
            {L('Decline', 'Refuser')}
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="gold-button gold-button-consent min-h-11 w-full sm:w-auto"
          >
            {L('Accept', 'Accepter')}
          </button>
        </div>
      </div>
    </div>
  )
}
