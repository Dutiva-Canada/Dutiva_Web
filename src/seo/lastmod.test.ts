import { describe, expect, it } from 'vitest'
import { BLOG_ARTICLES, GUIDE_ARTICLES } from '@/features/marketing/articles'
import { latestChangelogDate } from '@/features/marketing/changelog/changelogEntries'
import { HELP_ARTICLES } from '@/features/support/help/helpCenterData'
import { maxIsoDate } from './dates'
import { lastmodFor } from './lastmod'
import { allPublicPages } from './routes'

const ISO = /^\d{4}-\d{2}-\d{2}$/

describe('lastmodFor', () => {
  it('supplies an ISO lastmod for every public page in both locales', async () => {
    for (const page of allPublicPages()) {
      for (const lang of ['en', 'fr'] as const) {
        const lastmod = await lastmodFor(page.key, lang)
        expect(lastmod, `${page.key} ${lang}`).toBeDefined()
        expect(lastmod, `${page.key} ${lang}`).toMatch(ISO)
      }
    }
  })

  it('derives collection lastmod from the newest child, not a build date', async () => {
    expect(await lastmodFor('guides', 'en')).toBe(maxIsoDate(GUIDE_ARTICLES.map((a) => a.updated)))
    expect(await lastmodFor('blog', 'fr')).toBe(maxIsoDate(BLOG_ARTICLES.map((a) => a.updated)))
    expect(await lastmodFor('help', 'en')).toBe(maxIsoDate(HELP_ARTICLES.map((a) => a.updated)))
    expect(await lastmodFor('changelog', 'en')).toBe(latestChangelogDate())
    expect(await lastmodFor('home', 'en')).toBe(
      maxIsoDate([latestChangelogDate(), ...GUIDE_ARTICLES.map((a) => a.updated)]),
    )
  })

  it('uses the help article updated field for helpDoc keys', async () => {
    expect(await lastmodFor('helpDoc:signing-in', 'en')).toBe('2026-08-08')
    expect(await lastmodFor('helpDoc:how-support-works', 'fr')).toBe('2026-08-26')
  })

  it('uses the article updated field for editorial keys', async () => {
    const guide = GUIDE_ARTICLES[0]
    expect(guide).toBeDefined()
    expect(await lastmodFor(`guideDoc:${guide!.slug}`, 'en')).toBe(guide!.updated)
  })
})
