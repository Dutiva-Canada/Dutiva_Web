import { lazy, Suspense } from 'react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { articleNode, webApplicationNode } from '@/seo/jsonld'
import { maxIsoDate } from '@/seo/dates'
import { GUIDE_ARTICLES, articlePath } from './articles'
import { latestChangelogDate } from './changelog/changelogEntries'
import { homeFaqEntries } from './homeFaq'
import { useScrollToHash } from './useScrollToHash'
import './landing.css'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { TrustStrip } from './sections/TrustStrip'
import { HowItWorks } from './sections/HowItWorks'
import { HomeFaq } from './sections/HomeFaq'
import { Workflows } from './sections/Workflows'
import { WhyDutiva } from './sections/WhyDutiva'
import { TestimonialWall } from './sections/TestimonialWall'
import { Coverage } from './sections/Coverage'
import { Pricing } from './sections/Pricing'
import { Guides } from './sections/Guides'
import { BetaSignup } from './sections/BetaSignup'
import { StickyMobileCta } from './sections/StickyMobileCta'
import { Footer } from './sections/Footer'
import { landing } from '@/i18n/messages/landing/index'
import { aboutMessages } from '@/i18n/messages/about'
import { LangScope } from '@/i18n/LangScope'

/* Below-fold product proof in its own chunk — the showcase pulls in the app
   demo components (ScoreHero, chips) and the template catalogue via
   DocumentStudioDemo, which the first paint does not need. */
const WorkspaceModuleDemos = lazy(() =>
  import('./sections/WorkspaceModuleDemos').then((m) => ({ default: m.WorkspaceModuleDemos })),
)

/**
 * Marketing landing page (dutiva.ca). Section order follows the conversion
 * funnel: hero → trust → how it works → product proof (Document Studio +
 * workspace demos) → coverage → workflows → founder → testimonials →
 * guides teaser → pricing → objections (FAQ) → dual CTA (paid / waitlist) →
 * footer. Guides cards stay visible because Article JSON-LD is coupled to
 * them (see LandingPage.test.tsx).
 */
const SCOPE = { ...landing, ...aboutMessages }

export function LandingPage() {
  return (
    <LangScope messages={SCOPE}>
      <LandingPageInner />
    </LangScope>
  )
}

function LandingPageInner() {
  const { lang, x, L } = useI18n()
  useScrollToHash()
  /* BreadcrumbList JSON-LD for search; the homepage has no trail to draw. */
  const homeTrail = [{ name: L('Home', 'Accueil') }]
  const guideArticles = GUIDE_ARTICLES.map((guide) =>
    articleNode({
      lang,
      path: articlePath(guide, lang),
      headline: x(guide.title),
      description: x(guide.summary),
      datePublished: guide.updated,
      dateModified: guide.updated,
    }),
  )
  return (
    <div className="surface-marketing dutiva-surface min-h-screen text-text">
      <Seo
        route="home"
        faq={homeFaqEntries(lang)}
        breadcrumb={homeTrail}
        dateModified={maxIsoDate([
          latestChangelogDate(),
          ...GUIDE_ARTICLES.map((guide) => guide.updated),
        ])}
        extraNodes={[webApplicationNode(lang), ...guideArticles]}
      />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Suspense fallback={<div className="mx-auto min-h-[600px] max-w-300" aria-hidden="true" />}>
          <WorkspaceModuleDemos />
        </Suspense>
        <Coverage />
        <Workflows />
        <WhyDutiva />
        <TestimonialWall />
        <Guides />
        <Pricing />
        <HomeFaq />
        <BetaSignup />
      </main>
      <StickyMobileCta />
      <Footer />
    </div>
  )
}
