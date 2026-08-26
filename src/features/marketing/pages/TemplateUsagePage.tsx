import { CircleCheck, FileWarning, FileX, ScrollText, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { MarketingMessageKey } from '@/i18n/messages'
import { Seo } from '@/seo/Seo'
import { howToNode } from '@/seo/jsonld'
import { seoRoute } from '@/seo/routes'
import { usePublicPath } from '@/seo/usePublicPath'
import { Breadcrumbs, MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

const STEPS: { titleKey: MarketingMessageKey; bodyKey: MarketingMessageKey }[] = [
  { titleKey: 'tmplGuide_st1t', bodyKey: 'tmplGuide_st1p' },
  { titleKey: 'tmplGuide_st2t', bodyKey: 'tmplGuide_st2p' },
  { titleKey: 'tmplGuide_st3t', bodyKey: 'tmplGuide_st3p' },
]

const CATEGORIES: { icon: LucideIcon; titleKey: MarketingMessageKey; bodyKey: MarketingMessageKey }[] = [
  { icon: UserPlus, titleKey: 'tmplGuide_c1t', bodyKey: 'tmplGuide_c1p' },
  { icon: ScrollText, titleKey: 'tmplGuide_c2t', bodyKey: 'tmplGuide_c2p' },
  { icon: FileWarning, titleKey: 'tmplGuide_c3t', bodyKey: 'tmplGuide_c3p' },
  { icon: FileX, titleKey: 'tmplGuide_c4t', bodyKey: 'tmplGuide_c4p' },
]

const PRACTICES: MarketingMessageKey[] = ['tmplGuide_bp1', 'tmplGuide_bp2', 'tmplGuide_bp3', 'tmplGuide_bp4']

/** /guides/template-usage — how template generation works (tmplGuide_* strings). */
export function TemplateUsagePage() {
  const { t, lang } = useI18n()
  const { p, home } = usePublicPath()
  const route = seoRoute('templateUsage')
  /* Shared by the visible trail and the BreadcrumbList JSON-LD. */
  const trail = [
    { name: 'Dutiva', path: home() },
    { name: 'Guides', path: p('guides') },
    { name: t('tmplGuide_h1') },
  ]
  const howTo = howToNode({
    lang,
    path: route.path[lang],
    name: t('tmplGuide_h1'),
    description: t('tmplGuide_meta_description'),
    steps: STEPS.map((step) => ({
      name: t(step.titleKey),
      text: t(step.bodyKey),
    })),
  })
  return (
    <MarketingPageShell>
      <Seo route="templateUsage" breadcrumb={trail} extraNodes={[howTo]} />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow={t('tmplGuide_eyebrow')}
        title={t('tmplGuide_h1')}
        intro={t('tmplGuide_intro')}
      />

      <PageSection title={t('tmplGuide_s1')}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {STEPS.map((step, index) => (
            <div key={step.titleKey} className="premium-card-soft p-[22px]">
              {/* bg-gold-subtle: the marketing surface's gold wash (--gold-bg is app-surface only). */}
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold-border bg-gold-subtle font-display text-sm font-bold text-gold-strong">
                {index + 1}
              </span>
              <div className="mt-3 text-[0.9375rem] font-semibold text-text">
                {t(step.titleKey)}
              </div>
              <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title={t('tmplGuide_s2')}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {CATEGORIES.map((category) => (
            <div key={category.titleKey} className="premium-card-soft p-[22px]">
              <category.icon size={18} className="text-gold-strong" />
              <div className="mt-3 text-[0.9375rem] font-semibold text-text">
                {t(category.titleKey)}
              </div>
              <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{t(category.bodyKey)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title={t('tmplGuide_s3')}>
        <div className="premium-card-soft p-[22px]">
          <ul className="grid gap-3">
            {PRACTICES.map((practiceKey) => (
              <li key={practiceKey} className="flex items-start gap-3">
                <CircleCheck size={16} className="mt-0.5 flex-none text-gold-strong" />
                <span className="text-sm leading-[1.6] text-text-2">{t(practiceKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      <PageCta
        title={t('tmplGuide_cta_t')}
        body={t('tmplGuide_cta_p')}
        action={t('tmplGuide_cta_btn')}
        to="/app/welcome"
      />
    </MarketingPageShell>
  )
}
