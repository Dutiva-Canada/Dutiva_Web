/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import { parseDisplayDate } from './dates'
import { buildHead, serializeHead } from './head'
import {
  articleNode,
  breadcrumbNode,
  faqPageEntities,
  howToNode,
  jsonLdDocument,
  organizationNode,
  personNode,
  serializeJsonLd,
  webApplicationNode,
  webPageNode,
  webSiteNode,
} from './jsonld'
import {
  LEGAL_ROWS,
  SEO_ROUTES,
  allPublicPages,
  alternatePathFor,
  langOfPath,
  legalDocPath,
} from './routes'
import { HELP_ARTICLES } from '@/features/support/help/helpCenterData'
import { ALL_ARTICLES, BLOG_ARTICLES, GUIDE_ARTICLES } from '@/features/marketing/articles'
import { FOUNDER, ORG, SITE_ORIGIN, absoluteUrl } from './site'

describe('SEO route registry', () => {
  const pages = allPublicPages()

  it('covers the static routes, policy documents, help articles, and editorial articles', () => {
    expect(SEO_ROUTES.length).toBeGreaterThanOrEqual(10)
    expect(LEGAL_ROWS).toHaveLength(26)
    expect(HELP_ARTICLES.length).toBeGreaterThan(0)
    expect(ALL_ARTICLES.length).toBeGreaterThan(0)
    expect(pages).toHaveLength(SEO_ROUTES.length + 26 + HELP_ARTICLES.length + ALL_ARTICLES.length)
  })

  it('keeps the guides and blog collections disjoint', () => {
    /* Both indexes once listed the same six topics. Giving each a URL under
       both prefixes would ship duplicate pages competing in search, so the
       collections must never converge again. */
    const guideTitles = new Set(GUIDE_ARTICLES.map((a) => a.title.en))
    for (const post of BLOG_ARTICLES) {
      expect(guideTitles.has(post.title.en)).toBe(false)
    }
    const slugs = ALL_ARTICLES.flatMap((a) => [a.slug, a.frSlug])
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('gives every page a distinct pathname per locale, FR under /fr', () => {
    for (const lang of ['en', 'fr'] as const) {
      const paths = pages.map((p) => p.path[lang])
      expect(new Set(paths).size).toBe(paths.length)
    }
    for (const page of pages) {
      expect(page.path.en, page.key).not.toMatch(/^\/fr(\/|$)/)
      expect(page.path.fr, page.key).toMatch(/^\/fr(\/|$)/)
      // No trailing slashes, no uppercase, no spaces.
      for (const lang of ['en', 'fr'] as const) {
        const p = page.path[lang]
        if (p !== '/') expect(p, page.key).not.toMatch(/\/$/)
        expect(p, page.key).toBe(p.toLowerCase())
        expect(p, page.key).not.toMatch(/\s/)
      }
    }
  })

  it('never shares a canonical URL between two pages or locales', () => {
    const all = pages.flatMap((p) => [p.path.en, p.path.fr])
    expect(new Set(all).size).toBe(all.length)
  })

  it('has unique, non-empty titles and descriptions in both languages', () => {
    for (const lang of ['en', 'fr'] as const) {
      const titles = pages.map((p) => p.title[lang])
      const descriptions = pages.map((p) => p.description[lang])
      expect(new Set(titles).size).toBe(titles.length)
      expect(new Set(descriptions).size).toBe(descriptions.length)
      for (const value of [...titles, ...descriptions]) {
        expect(value.trim().length).toBeGreaterThan(10)
        expect(value).not.toMatch(/undefined|null|TODO/)
      }
    }
  })

  it('gives static-route updated dates ISO form when present', () => {
    for (const route of SEO_ROUTES) {
      if (route.updated) expect(route.updated, route.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('keeps every static route meta description within the SERP display band (120–155 chars)', () => {
    /* Bing flagged many descriptions as too short; Google truncates around 155
       (audit D5.1). Static routes use dedicated *_meta_description keys where
       the visible page intro is longer. */
    for (const route of SEO_ROUTES) {
      for (const lang of ['en', 'fr'] as const) {
        const len = route.description[lang].length
        expect(len, `${route.id} ${lang}`).toBeGreaterThanOrEqual(120)
        expect(len, `${route.id} ${lang}`).toBeLessThanOrEqual(155)
      }
    }
  })

  it('keeps legal slugs unique in both slug spaces', () => {
    expect(new Set(LEGAL_ROWS.map((r) => r.slug)).size).toBe(26)
    expect(new Set(LEGAL_ROWS.map((r) => r.frSlug)).size).toBe(26)
    // The two slug spaces must not collide with each other either
    // (cross-locale fallback resolution in PolicyPage depends on it).
    const union = new Set([...LEGAL_ROWS.map((r) => r.slug), ...LEGAL_ROWS.map((r) => r.frSlug)])
    expect(union.size).toBe(52)
  })

  it('maps locale alternates reciprocally for every public page', () => {
    for (const page of pages) {
      expect(alternatePathFor(page.path.en, 'fr'), page.key).toBe(page.path.fr)
      expect(alternatePathFor(page.path.fr, 'en'), page.key).toBe(page.path.en)
      // Self-mapping is stable too (a page is in its own alternate set).
      expect(alternatePathFor(page.path.en, 'en'), page.key).toBe(page.path.en)
    }
    expect(alternatePathFor('/app/home', 'fr')).toBeUndefined()
    expect(alternatePathFor('/nope', 'fr')).toBeUndefined()
  })

  it('derives locale from the URL prefix', () => {
    expect(langOfPath('/')).toBe('en')
    expect(langOfPath('/legal/terms')).toBe('en')
    expect(langOfPath('/fr')).toBe('fr')
    expect(langOfPath('/fr/juridique')).toBe('fr')
    expect(langOfPath('/friends')).toBe('en')
  })

  it('builds legal document paths in both locales', () => {
    const terms = LEGAL_ROWS.find((r) => r.slug === 'terms')!
    expect(legalDocPath(terms, 'en')).toBe('/legal/terms')
    expect(legalDocPath(terms, 'fr')).toBe('/fr/juridique/conditions-utilisation')
  })
})

describe('buildHead', () => {
  const input = {
    lang: 'en' as const,
    title: 'About Dutiva',
    description: 'What Dutiva Canada Inc. builds & why.',
    path: { en: '/about', fr: '/fr/a-propos' },
    indexable: true,
  }

  it('emits self-canonical, reciprocal hreflang, and social tags', () => {
    const head = buildHead(input)
    const byRel = (rel: string, hreflang?: string) =>
      head.tags.filter((t) => t.attrs.rel === rel && (!hreflang || t.attrs.hreflang === hreflang))
    expect(byRel('canonical')[0]!.attrs.href).toBe(`${SITE_ORIGIN}/about`)
    expect(byRel('alternate', 'en-CA')[0]!.attrs.href).toBe(`${SITE_ORIGIN}/about`)
    expect(byRel('alternate', 'fr-CA')[0]!.attrs.href).toBe(`${SITE_ORIGIN}/fr/a-propos`)
    expect(byRel('alternate', 'x-default')[0]!.attrs.href).toBe(`${SITE_ORIGIN}/about`)
    const og = Object.fromEntries(
      head.tags.filter((t) => t.attrs.property).map((t) => [t.attrs.property, t.attrs.content]),
    )
    expect(og['og:locale']).toBe('en_CA')
    expect(og['og:locale:alternate']).toBe('fr_CA')
    expect(og['og:url']).toBe(`${SITE_ORIGIN}/about`)
    expect(og['og:site_name']).toBe('Dutiva')
    expect(og['og:image']).toMatch(/^https:\/\/.*og-dutiva-en\.png$/)
  })

  it('uses the French canonical and og:locale on FR pages', () => {
    const head = buildHead({ ...input, lang: 'fr' })
    expect(head.tags.find((t) => t.attrs.rel === 'canonical')!.attrs.href).toBe(
      `${SITE_ORIGIN}/fr/a-propos`,
    )
    expect(head.tags.find((t) => t.attrs.property === 'og:locale')!.attrs.content).toBe('fr_CA')
    expect(head.tags.find((t) => t.attrs.property === 'og:image')!.attrs.content).toMatch(
      /og-dutiva-fr\.png$/,
    )
  })

  it('noindex pages carry robots + description only — no canonical, social, or JSON-LD', () => {
    const head = buildHead({ ...input, indexable: false, jsonLd: [organizationNode('en')] })
    expect(head.tags.find((t) => t.attrs.name === 'robots')!.attrs.content).toBe(
      'noindex, nofollow',
    )
    expect(head.tags.some((t) => t.attrs.rel === 'canonical')).toBe(false)
    expect(head.tags.some((t) => t.attrs.property)).toBe(false)
    expect(head.jsonLd).toBeNull()
  })

  it('escapes attribute values and JSON-LD script content on serialization', () => {
    const head = buildHead({
      ...input,
      title: 'A "quoted" <title> & more',
      description: 'x'.repeat(40),
      jsonLd: [{ '@type': 'WebPage', name: '</script><script>alert(1)</script>' }],
    })
    const html = serializeHead(head)
    // Text nodes escape < and & (quotes are legal there); og:title lives in
    // an attribute, where quotes must be escaped.
    expect(html).toContain('<title>A "quoted" &lt;title&gt; &amp; more</title>')
    expect(html).toContain('content="A &quot;quoted&quot; &lt;title&gt; &amp; more"')
    expect(html).not.toContain('</script><script>alert(1)')
    expect(html).toContain('\\u003c/script')
  })
})

describe('JSON-LD builders', () => {
  it('describes the verified organization with stable @ids on the canonical origin', () => {
    const org = organizationNode('en')
    expect(org['@id']).toBe(`${SITE_ORIGIN}/#organization`)
    expect(org.legalName).toBe('Dutiva Canada Inc.')
    expect(org.name).toBe('Dutiva')
    expect(org.email).toBe(ORG.supportEmail)
    expect(org.founder).toEqual({ '@id': `${SITE_ORIGIN}/#founder` })
    expect(org.sameAs).toEqual([
      ORG.linkedinUrl,
      ORG.facebookUrl,
      ORG.redditUrl,
      ORG.googleMapsUrl,
    ])
    expect(org.foundingDate).toBe(ORG.foundingDate)
    expect(org.identifier).toEqual({
      '@type': 'PropertyValue',
      name: 'Corporations Canada corporation number',
      value: ORG.corporationNumber,
    })
    // No invented facts.
    expect(org).not.toHaveProperty('address')
    expect(org).not.toHaveProperty('aggregateRating')
  })

  it('describes the named founder with LinkedIn sameAs, alumniOf, and an on-origin photo', () => {
    const person = personNode('en')
    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': `${SITE_ORIGIN}/#founder`,
      name: FOUNDER.name,
      jobTitle: FOUNDER.jobTitle.en,
      image: `${SITE_ORIGIN}${FOUNDER.photoPath}`,
      sameAs: [FOUNDER.linkedinUrl],
      alumniOf: { '@type': 'CollegeOrUniversity', name: FOUNDER.alumniOf.en },
      worksFor: { '@id': `${SITE_ORIGIN}/#organization` },
    })
    expect(personNode('fr').jobTitle).toBe(FOUNDER.jobTitle.fr)
    expect(personNode('fr').alumniOf).toEqual({
      '@type': 'CollegeOrUniversity',
      name: FOUNDER.alumniOf.fr,
    })
  })

  it('links WebSite and WebApplication to the organization', () => {
    const site = webSiteNode('en')
    const app = webApplicationNode('en')
    expect(site.publisher).toEqual({ '@id': `${SITE_ORIGIN}/#organization` })
    expect(site.inLanguage).toEqual(['en-CA', 'fr-CA'])
    expect(app.applicationCategory).toBe('BusinessApplication')
    expect(app).not.toHaveProperty('offers')
    expect(app).not.toHaveProperty('aggregateRating')
  })

  it('adds offers only when given visible prices, in CAD', () => {
    const app = webApplicationNode('en', [
      { name: 'Starter', priceCad: 24 },
      { name: 'Growth', priceCad: 49 },
    ])
    const offers = app.offers as { price: string; priceCurrency: string }[]
    expect(offers).toHaveLength(2)
    expect(offers[0]).toMatchObject({ price: '24.00', priceCurrency: 'CAD' })
  })

  it('builds FAQPage entities, breadcrumbs, and page nodes that serialize as valid JSON', () => {
    const page = webPageNode({
      lang: 'fr',
      path: '/fr/juridique/conditions-utilisation',
      title: 'Conditions',
      description: 'desc',
      datePublished: '2026-06-01',
      dateModified: '2026-06-01',
      hasBreadcrumb: true,
    })
    const crumbs = breadcrumbNode('/fr/juridique/conditions-utilisation', [
      { name: 'Dutiva', path: '/fr' },
      { name: 'Juridique', path: '/fr/juridique' },
      { name: 'Conditions' },
    ])
    page.mainEntity = faqPageEntities([{ question: 'Q?', answer: 'A.' }])
    const doc = jsonLdDocument([organizationNode('fr'), webSiteNode('fr'), page, crumbs])
    const parsed = JSON.parse(serializeJsonLd(doc)) as {
      '@context': string
      '@graph': Record<string, unknown>[]
    }
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed['@graph']).toHaveLength(4)
    const crumbItems = (
      parsed['@graph'][3] as { itemListElement: { position: number; item?: string }[] }
    ).itemListElement
    expect(crumbItems.map((i) => i.position)).toEqual([1, 2, 3])
    expect(crumbItems[0]!.item).toBe(`${SITE_ORIGIN}/fr`)
    expect(crumbItems[2]!.item).toBeUndefined()
    expect(parsed['@graph'][2]).toMatchObject({
      inLanguage: 'fr-CA',
      datePublished: '2026-06-01',
    })
  })

  it('builds Article nodes authored by the founder with real dates', () => {
    const node = articleNode({
      lang: 'en',
      path: '/blog/quebec-employment-standards',
      headline: 'Quebec employment standards',
      description: 'What differs from Ontario.',
      datePublished: '2026-08-01',
      dateModified: '2026-08-01',
    })
    expect(node).toMatchObject({
      '@type': 'Article',
      '@id': `${SITE_ORIGIN}/blog/quebec-employment-standards#article`,
      author: { '@id': `${SITE_ORIGIN}/#founder` },
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      datePublished: '2026-08-01',
      dateModified: '2026-08-01',
      mainEntityOfPage: { '@id': `${SITE_ORIGIN}/blog/quebec-employment-standards#webpage` },
    })
  })

  it('builds HowTo nodes from visible steps', () => {
    const node = howToNode({
      lang: 'en',
      path: '/guides/template-usage',
      name: 'How to use Dutiva templates.',
      description: 'Guided generation.',
      steps: [
        { name: 'Pick a template', text: 'Choose from the catalogue.' },
        { name: 'Answer guided questions', text: 'Jurisdiction and situation.' },
      ],
    })
    expect(node['@type']).toBe('HowTo')
    expect(node.step).toEqual([
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Pick a template',
        text: 'Choose from the catalogue.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Answer guided questions',
        text: 'Jurisdiction and situation.',
      },
    ])
  })
})

describe('parseDisplayDate', () => {
  it('parses the English and French policy date formats', () => {
    expect(parseDisplayDate('June 1, 2026')).toBe('2026-06-01')
    expect(parseDisplayDate('December 15, 2025')).toBe('2025-12-15')
    expect(parseDisplayDate('1er juin 2026')).toBe('2026-06-01')
    expect(parseDisplayDate('15 décembre 2025')).toBe('2025-12-15')
    expect(parseDisplayDate('3 août 2025')).toBe('2025-08-03')
  })

  it('returns undefined rather than guessing', () => {
    expect(parseDisplayDate(undefined)).toBeUndefined()
    expect(parseDisplayDate('')).toBeUndefined()
    expect(parseDisplayDate('sometime soon')).toBeUndefined()
    expect(parseDisplayDate('1er brumaire 2026')).toBeUndefined()
  })
})

describe('absoluteUrl', () => {
  it('joins the canonical origin without duplicate slashes', () => {
    expect(absoluteUrl('/')).toBe(`${SITE_ORIGIN}/`)
    expect(absoluteUrl('/about')).toBe(`${SITE_ORIGIN}/about`)
  })
})
