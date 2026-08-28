import { landingAdvisorPreview } from './advisorPreview'
import { landingChrome } from './chrome'
import { landingCoverage } from './coverage'
import { landingDemo } from './demo'
import { landingDocumentStudio } from './documentStudio'
import { landingFaq } from './faq'
import { landingFooter } from './footer'
import { landingGuidesTeaser } from './guidesTeaser'
import { landingHero } from './hero'
import { landingHowItWorks } from './howItWorks'
import { landingMisc } from './misc'
import { landingPricing } from './pricing'
import { landingProduct } from './product'
import { landingTestimonials } from './testimonials'
import { landingTrust } from './trust'
import { landingWaitlistCta } from './waitlistCta'
import { landingWhyDutiva } from './whyDutiva'
import { landingWorkflows } from './workflows'

/** Landing page messages — split by section for maintainability. */
export const landing = {
  ...landingAdvisorPreview,
  ...landingChrome,
  ...landingCoverage,
  ...landingDemo,
  ...landingDocumentStudio,
  ...landingFaq,
  ...landingFooter,
  ...landingGuidesTeaser,
  ...landingHero,
  ...landingHowItWorks,
  ...landingMisc,
  ...landingPricing,
  ...landingProduct,
  ...landingTestimonials,
  ...landingTrust,
  ...landingWaitlistCta,
  ...landingWhyDutiva,
  ...landingWorkflows,
} as const
