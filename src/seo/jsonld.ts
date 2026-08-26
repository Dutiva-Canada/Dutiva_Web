/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Lang } from '@/i18n/core'
import { FOUNDER, ORG, ORG_DESCRIPTION, SITE_ORIGIN, absoluteUrl } from './site'

/**
 * JSON-LD (schema.org) builders. Every node lives in one `@graph` per page
 * and reuses stable `@id`s anchored on the canonical origin, so all pages
 * describe the same Dutiva entity instead of minting disconnected ones.
 *
 * Rules (docs/SEO_GEO_IMPLEMENTATION.md): only verified, visible facts.
 * No ratings, reviews, awards, addresses, or founding dates. Social
 * profiles only when published on the site (founder LinkedIn on Person;
 * company LinkedIn on Organization).
 */

export type JsonLdNode = Record<string, unknown>

export const ORG_ID = `${SITE_ORIGIN}/#organization`
export const FOUNDER_ID = `${SITE_ORIGIN}/#founder`
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`
export const SOFTWARE_ID = `${SITE_ORIGIN}/#software`

const LOCALE_TAG: Record<Lang, string> = { en: 'en-CA', fr: 'fr-CA' }

export function organizationNode(lang: Lang): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORG.name,
    legalName: ORG.legalName,
    url: `${SITE_ORIGIN}/`,
    description: ORG_DESCRIPTION[lang],
    email: ORG.supportEmail,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(ORG.logoPath),
      width: ORG.logoWidth,
      height: ORG.logoHeight,
    },
    sameAs: [ORG.linkedinUrl],
    areaServed: { '@type': 'Country', name: 'Canada' },
    knowsLanguage: ['en-CA', 'fr-CA'],
    founder: { '@id': FOUNDER_ID },
  }
}

/** Person node for the named founder. Must ship in the same `@graph` as
 *  `organizationNode` so `founder` is not a dangling `@id`. */
export function personNode(lang: Lang): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle[lang],
    image: absoluteUrl(FOUNDER.photoPath),
    sameAs: [FOUNDER.linkedinUrl],
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: FOUNDER.alumniOf[lang],
    },
    worksFor: { '@id': ORG_ID },
  }
}

export function webSiteNode(lang: Lang): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: ORG.name,
    url: `${SITE_ORIGIN}/`,
    description: ORG_DESCRIPTION[lang],
    inLanguage: ['en-CA', 'fr-CA'],
    publisher: { '@id': ORG_ID },
  }
}

export interface OfferInput {
  name: string
  /** Monthly price in CAD, as visibly rendered on the pricing page. */
  priceCad: number
}

/**
 * The Dutiva product as a schema.org WebApplication. `offers` should be
 * passed only from the pricing page, mirroring its visible plan cards.
 */
export function webApplicationNode(lang: Lang, offers?: OfferInput[]): JsonLdNode {
  const node: JsonLdNode = {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': SOFTWARE_ID,
    name: ORG.name,
    url: `${SITE_ORIGIN}/`,
    description: ORG_DESCRIPTION[lang],
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: ['en-CA', 'fr-CA'],
    countriesSupported: 'CA',
    publisher: { '@id': ORG_ID },
  }
  if (offers && offers.length > 0) {
    node.offers = offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.priceCad.toFixed(2),
      priceCurrency: 'CAD',
      url: absoluteUrl(lang === 'fr' ? '/fr/tarifs' : '/pricing'),
    }))
  }
  return node
}

export type WebPageType = 'WebPage' | 'AboutPage' | 'CollectionPage' | 'FAQPage'

export interface WebPageInput {
  lang: Lang
  /** Canonical pathname of the page. */
  path: string
  title: string
  description: string
  type?: WebPageType
  /** Real content dates only (ISO 8601). Never the build date. */
  datePublished?: string
  dateModified?: string
  hasBreadcrumb?: boolean
}

export function webPageNode(input: WebPageInput): JsonLdNode {
  const url = absoluteUrl(input.path)
  const node: JsonLdNode = {
    '@type': input.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: input.title,
    description: input.description,
    inLanguage: LOCALE_TAG[input.lang],
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
  }
  if (input.datePublished) node.datePublished = input.datePublished
  if (input.dateModified) node.dateModified = input.dateModified
  if (input.hasBreadcrumb) node.breadcrumb = { '@id': `${url}#breadcrumb` }
  return node
}

export interface BreadcrumbItem {
  name: string
  /** Canonical pathname; the final item may omit it (current page). */
  path?: string
}

export function breadcrumbNode(pagePath: string, items: BreadcrumbItem[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(pagePath)}#breadcrumb`,
    itemListElement: items.map((item, i) => {
      const li: JsonLdNode = { '@type': 'ListItem', position: i + 1, name: item.name }
      if (item.path) li.item = absoluteUrl(item.path)
      return li
    }),
  }
}

export interface FaqEntry {
  question: string
  answer: string
}

/** FAQPage main entity — pass ONLY questions/answers visibly rendered on the
    page, from the same message catalogue the page renders. */
export function faqPageEntities(entries: FaqEntry[]): JsonLdNode[] {
  return entries.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: { '@type': 'Answer', text: entry.answer },
  }))
}

export interface ArticleNodeInput {
  lang: Lang
  path: string
  headline: string
  description: string
  /** Real content dates only (ISO 8601). Never the build date. */
  datePublished: string
  dateModified: string
}

/**
 * Editorial Article node for `/guides/:slug` and `/blog/:slug`. Author is the
 * founder Person `@id` already in the same `@graph`. Dates must match the
 * article's authored `updated` field (and any visible date on the page).
 */
export function articleNode(input: ArticleNodeInput): JsonLdNode {
  const url = absoluteUrl(input.path)
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: LOCALE_TAG[input.lang],
    author: { '@id': FOUNDER_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@id': `${url}#webpage` },
  }
}

export interface HowToStepInput {
  name: string
  text: string
}

export interface HowToNodeInput {
  lang: Lang
  path: string
  name: string
  description: string
  /** Ordered steps that are visibly rendered on the page. */
  steps: HowToStepInput[]
}

/**
 * HowTo node for pages that show an ordered procedure (e.g. template-usage).
 * Steps must come from the same catalogue the page renders.
 */
export function howToNode(input: HowToNodeInput): JsonLdNode {
  const url = absoluteUrl(input.path)
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: input.name,
    description: input.description,
    inLanguage: LOCALE_TAG[input.lang],
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  }
}

/** Wraps graph nodes into a single serializable JSON-LD document. */
export function jsonLdDocument(nodes: JsonLdNode[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': nodes }
}

/** JSON-LD serialized for a <script> tag ("<" escaped so content cannot
    close the tag or open a new one). */
export function serializeJsonLd(document: Record<string, unknown>): string {
  return JSON.stringify(document).replace(/</g, '\\u003c')
}
