import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { articleNode, webApplicationNode } from '@/seo/jsonld'
import { maxIsoDate } from '@/seo/dates'
import { GUIDE_ARTICLES, articlePath } from './articles'
import { latestChangelogDate } from './changelog/changelogEntries'
import { homeFaqEntries } from './homeFaq'
import './landing.css'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { TrustStrip } from './sections/TrustStrip'
import { HowItWorks } from './sections/HowItWorks'
import { HomeFaq } from './sections/HomeFaq'
import { Workflows } from './sections/Workflows'
import { Product } from './sections/Product'
import { Modules } from './sections/Modules'
import { WhyDutiva } from './sections/WhyDutiva'
import { TestimonialWall } from './sections/TestimonialWall'
import { Coverage } from './sections/Coverage'
import { Pricing } from './sections/Pricing'
import { Guides } from './sections/Guides'
import { BetaSignup } from './sections/BetaSignup'
import { Footer } from './sections/Footer'

/**
 * Marketing landing page (dutiva.ca) — ported from
 * `Landing Page (redesign) v2.dc.html`. Section order: hero → trust → how →
 * common questions → workflows → why Dutiva (human element early) →
 * Document Studio → one workspace → beta testimonials (when published) →
 * coverage → pricing → guides → beta signup → footer.
 */
export function LandingPage() {
  const { lang, x, L } = useI18n()
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
        <HomeFaq />
        <Workflows />
        <WhyDutiva />
        <Product />
        <Modules />
        <TestimonialWall />
        <Coverage />
        <Pricing />
        <Guides />
        <BetaSignup />
      </main>
      <Footer />
    </div>
  )
}
