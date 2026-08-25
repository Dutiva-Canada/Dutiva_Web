import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { webApplicationNode } from '@/seo/jsonld'
import './landing.css'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { TrustStrip } from './sections/TrustStrip'
import { HowItWorks } from './sections/HowItWorks'
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
 * `Landing Page (redesign) v2.dc.html`. Section order mirrors the prototype:
 * hero → trust strip → how → workflows → Document Studio → one workspace →
 * why Dutiva → beta testimonials (when published) → coverage → pricing → guides → beta signup → footer.
 */
export function LandingPage() {
  const { lang } = useI18n()
  return (
    <div className="surface-marketing dutiva-surface min-h-screen text-text">
      <Seo route="home" extraNodes={[webApplicationNode(lang)]} />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Workflows />
        <Product />
        <Modules />
        <WhyDutiva />
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
