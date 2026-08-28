import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { legalDocPath } from '@/seo/routes'
import { LEGAL_HUB_GROUPS } from '../legal/legalHubData'
import type { LegalHubRow } from '../legal/legalHubData'
import { MarketingPageShell, PageHero, PageSection } from './MarketingPage'

/** /legal — index of the 26 policy documents, grouped per the prototype (legalHub_* strings). */
export function LegalHubPage() {
  const { t, L, lang } = useI18n()
  return (
    <MarketingPageShell>
      <Seo route="legal" pageType="CollectionPage" />
      <PageHero
        eyebrow={t('legalHub_eyebrow')}
        title={t('legalHub_h1')}
        intro={t('legalHub_intro')}
      />

      {LEGAL_HUB_GROUPS.map((group) => (
        <PageSection key={group.titleKey} title={t(group.titleKey)}>
          <div className="marketing-auto-grid gap-4">
            {group.rows.map((row: LegalHubRow) => (
              <Link
                key={row.slug}
                to={legalDocPath(row, lang)}
                className="premium-card-soft flex items-start justify-between gap-4 p-[20px_22px]"
              >
                <div>
                  <div className="text-[0.9375rem] font-semibold text-text">{t(row.titleKey)}</div>
                  <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{t(row.descKey)}</p>
                </div>
                <ArrowRight size={16} className="mt-0.5 flex-none text-text-3" />
              </Link>
            ))}
          </div>
        </PageSection>
      ))}

      <section className="mx-auto max-w-[960px] px-6 pt-2 pb-16">
        <p className="text-center text-sm text-text-3">
          {L(
            'Questions about any of these documents?',
            'Des questions sur l’un de ces documents ?',
          )}{' '}
          <a href="mailto:legal@dutiva.ca" className="font-semibold text-text-2 hover:opacity-80">
            legal@dutiva.ca
          </a>
        </p>
      </section>
    </MarketingPageShell>
  )
}
