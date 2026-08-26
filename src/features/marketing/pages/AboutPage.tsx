import { Facebook, HeartHandshake, Leaf, Linkedin, MapPin, MapPinned, Scale, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { MarketingMessageKey } from '@/i18n/messages'
import { Seo } from '@/seo/Seo'
import { FOUNDER, ORG } from '@/seo/site'
import { FounderIdentity } from '../FounderIdentity'
import { MarketingPageShell, PageAside, PageCta, PageHero, PageSection } from './MarketingPage'
import { usePublicPath } from '@/seo/usePublicPath'

const VALUES: { icon: LucideIcon; titleKey: MarketingMessageKey; bodyKey: MarketingMessageKey }[] =
  [
    { icon: Scale, titleKey: 'about_v1t', bodyKey: 'about_v1p' },
    { icon: HeartHandshake, titleKey: 'about_v2t', bodyKey: 'about_v2p' },
    { icon: ShieldCheck, titleKey: 'about_v3t', bodyKey: 'about_v3p' },
    { icon: Leaf, titleKey: 'about_v4t', bodyKey: 'about_v4p' },
  ]

const COMPANY_PROFILES: {
  href: string
  icon: LucideIcon
  labelKey: MarketingMessageKey
}[] = [
  { href: ORG.linkedinUrl, icon: Linkedin, labelKey: 'about_company_linkedin' },
  { href: ORG.facebookUrl, icon: Facebook, labelKey: 'about_company_facebook' },
  { href: ORG.googleMapsUrl, icon: MapPinned, labelKey: 'about_company_google' },
]

/** /about — company story, values, built-in-Canada band (about_* strings). */
export function AboutPage() {
  const { t, lang } = useI18n()
  const { p } = usePublicPath()
  return (
    <MarketingPageShell>
      <Seo route="about" pageType="AboutPage" />
      <PageHero eyebrow={t('about_eyebrow')} title={t('about_h1')} intro={t('about_intro')} />

      <PageSection title={t('about_s1')}>
        <div className="premium-card p-[clamp(24px,3vw,40px)]">
          <p className="max-w-[58ch] font-display text-[clamp(1.125rem,1.8vw,1.375rem)] leading-normal font-medium text-text">
            {t('about_mission')}
          </p>
        </div>
      </PageSection>

      <PageSection title={t('about_s2')}>
        <div className="premium-card-soft p-[clamp(22px,3vw,32px)]">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="max-w-[70ch] text-base leading-[1.65] text-text-2">
                {t('about_why_p1')}
              </p>
              <p className="mt-4 max-w-[70ch] text-base leading-[1.65] font-medium text-text">
                {t('about_why_p2')}
              </p>
              <p className="mt-4 max-w-[70ch] text-base leading-[1.65] text-text-2">
                {t('about_why_p3')}
              </p>
              <p className="mt-4 max-w-[70ch] text-base leading-[1.65] text-text-2">
                {t('about_why_p4')}
              </p>
              <p className="mt-6 text-base font-semibold text-text">— {FOUNDER.name}</p>
              <p className="mt-0.5 text-sm text-text-3">
                {FOUNDER.jobTitle[lang]}, {ORG.legalName}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-text-3">
                <MapPin size={14} className="flex-none text-gold-strong" />
                {t('about_why_foot')}
              </div>
            </div>
            <FounderIdentity size="about" />
          </div>
        </div>
      </PageSection>

      <PageSection title={t('about_s3')}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {VALUES.map((value) => (
            <div key={value.titleKey} className="premium-card-soft p-[22px]">
              <value.icon size={18} className="text-gold-strong" />
              <div className="mt-3 text-[0.9375rem] font-semibold text-text">
                {t(value.titleKey)}
              </div>
              <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{t(value.bodyKey)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title={t('about_s4')}>
        <div className="premium-card-soft flex flex-wrap items-center gap-5 p-[clamp(22px,3vw,32px)]">
          <Leaf size={22} className="flex-none text-gold-strong" />
          <p className="min-w-[260px] flex-1 text-base leading-[1.6] text-text-2">
            {t('about_built')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="dutiva-pill">{t('about_pill_bilingual')}</span>
            {COMPANY_PROFILES.map((profile) => (
              <a
                key={profile.href}
                href={profile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
              >
                <profile.icon size={16} className="flex-none" aria-hidden="true" />
                {t(profile.labelKey)}
              </a>
            ))}
          </div>
        </div>
      </PageSection>

      <PageAside
        title={t('about_changelog_t')}
        body={t('about_changelog_p')}
        action={t('about_changelog_link')}
        to={p('changelog')}
      />

      <PageCta
        title={t('about_cta_t')}
        body={t('about_cta_p')}
        action={t('about_cta_btn')}
        to="/app/welcome"
      />
    </MarketingPageShell>
  )
}
