import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { legalDocPath, legalRowBySlug, seoRoute } from '@/seo/routes'

/**
 * Closing "still need help?" escalation shown on the Help Centre index and
 * every article. The primary action opens the public Contact form (no account
 * needed), and the secondary link points at the public support policy so
 * visitors understand the digital-first model before they write in.
 */
export function HelpContactCta() {
  const { t, lang } = useI18n()
  const contactPath = seoRoute('contact').path[lang]
  const policyRow = legalRowBySlug('support-policy')
  const policyPath = policyRow ? legalDocPath(policyRow, lang) : undefined

  return (
    <section className="mx-auto max-w-[960px] px-6 pt-4 pb-16">
      <div className="premium-card p-[clamp(24px,3.5vw,40px)] text-center">
        <h2 className="font-display text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold tracking-[-0.02em] text-text">
          {t('help_contact_title')}
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-[0.9375rem] leading-[1.6] text-text-2">
          {t('help_contact_body')}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link
            to={contactPath}
            className="gold-button gold-button-lg"
          >
            {t('help_contact_action')}
            <ArrowRight size={16} />
          </Link>
          {policyPath && (
            <Link
              to={policyPath}
              className="text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
            >
              {t('help_contact_policy')}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
