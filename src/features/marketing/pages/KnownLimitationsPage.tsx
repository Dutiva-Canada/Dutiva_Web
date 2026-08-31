import { Globe, ShieldAlert, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import type { MarketingMessageKey } from '@/i18n/messages'
import { Seo } from '@/seo/Seo'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

const SECTIONS: {
  titleKey: MarketingMessageKey
  icon: LucideIcon
  itemKeys: MarketingMessageKey[]
}[] = [
  { titleKey: 'limits_s1', icon: ShieldAlert, itemKeys: ['limits_n1', 'limits_n2', 'limits_n3'] },
  { titleKey: 'limits_s2', icon: TriangleAlert, itemKeys: ['limits_a1', 'limits_a2', 'limits_a3'] },
  { titleKey: 'limits_s3', icon: Globe, itemKeys: ['limits_c1', 'limits_c2', 'limits_c3'] },
]

/**
 * Emphasize the lead of a "Bold lead — rest of sentence" limitation string by
 * splitting on the first ' — '. Strings without the separator render plain
 * (defensive only — every limits_* item carries one in both languages).
 */
function renderLimitation(text: string): ReactNode {
  const separator = ' — '
  const index = text.indexOf(separator)
  if (index === -1) return text
  return (
    <>
      <strong className="font-semibold text-text">{text.slice(0, index)}</strong>
      {separator}
      {text.slice(index + separator.length)}
    </>
  )
}

/** /known-limitations — honest constraints of Advisor and documents (limits_* strings). */
export function KnownLimitationsPage() {
  const { t } = useI18n()
  return (
    <MarketingPageShell>
      <Seo route="knownLimitations" />
      <PageHero eyebrow={t('limits_eyebrow')} title={t('limits_h1')} intro={t('limits_intro')} />

      {SECTIONS.map((section) => (
        <PageSection key={section.titleKey} title={t(section.titleKey)}>
          <div className="grid gap-3">
            {section.itemKeys.map((itemKey) => (
              <div
                key={itemKey}
                className="premium-card-soft flex items-start gap-3 px-[22px] py-[18px]"
              >
                <section.icon size={16} className="mt-0.5 flex-none text-gold-strong" />
                <p className="text-sm leading-[1.6] text-text-2">{renderLimitation(t(itemKey))}</p>
              </div>
            ))}
          </div>
        </PageSection>
      ))}

      <PageCta
        title={t('limits_cta_t')}
        body={t('limits_cta_p')}
        action={t('limits_cta_btn')}
        href="mailto:support@dutiva.ca"
      />
    </MarketingPageShell>
  )
}
