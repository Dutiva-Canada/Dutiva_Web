import { pricingMessages } from './pricing'
import { templatesPreviewMessages } from './templatesPreview'
import { guidesIndexMessages } from './guidesIndex'
import { aboutMessages } from './about'
import { faqMessages } from './faq'
import { blogMessages } from './blog'
import { tmplGuideMessages } from './templateUsage'
import { limitsMessages } from './knownLimitations'
import { legalHubMessages } from './legalHub'
import { jurisdictionToolMessages } from './jurisdictionTool'
import { changelogMessages } from './changelog'
import { comparisonMessages } from './comparison'
import { sharedMessages } from './shared'

/**
 * The public marketing catalogue: every module read only from
 * `src/features/marketing/**` (and, for the `*_intro` keys, from
 * `src/seo/routes.ts`), merged with the shared set. `ForcedLangProvider` and
 * `src/seo/routes.ts` are the only consumers that should import this — see
 * `index.ts` for why the split exists and what it does not do yet.
 */
export const marketingMessages = {
  ...pricingMessages,
  ...templatesPreviewMessages,
  ...guidesIndexMessages,
  ...aboutMessages,
  ...faqMessages,
  ...blogMessages,
  ...tmplGuideMessages,
  ...limitsMessages,
  ...legalHubMessages,
  ...jurisdictionToolMessages,
  ...changelogMessages,
  ...comparisonMessages,
  ...sharedMessages,
} as const

/** Keys a marketing call site may use: marketing-only plus shared. */
export type MarketingMessageKey = keyof typeof marketingMessages
