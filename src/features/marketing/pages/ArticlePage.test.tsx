import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { ALL_ARTICLES, BLOG_ARTICLES, GUIDE_ARTICLES, articlePath } from '../articles'
import { articleSections } from '../articles/content'
import { BlogArticlePage, GuideArticlePage } from './ArticlePage'

const [firstGuide] = GUIDE_ARTICLES
const [firstPost] = BLOG_ARTICLES

describe('ArticlePage', () => {
  it('renders a guide with one H1, its body copy, and a breadcrumb to /guides', () => {
    const guide = firstGuide!
    renderApp(<GuideArticlePage />, {
      route: articlePath(guide, 'en'),
      path: '/guides/:slug',
    })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: guide.title.en })).toBeInTheDocument()
    expect(main.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(main.getByText(guide.summary.en)).toBeInTheDocument()
    /* First body paragraph is rendered, not just the card metadata. */
    const firstBlock = articleSections(guide.collection, guide.slug)[0]!.blocks[0]!
    expect(main.getByText(firstBlock.text.en)).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', {
        name: 'Guides',
      }),
    ).toHaveAttribute('href', '/guides')
  })

  it('renders French copy and French links once the language is French', async () => {
    const user = userEvent.setup()
    const post = firstPost!
    renderApp(<BlogArticlePage />, { route: articlePath(post, 'fr'), path: '/fr/blogue/:slug' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: post.title.fr })).toBeInTheDocument()
    expect(main.getByText(post.summary.fr)).toBeInTheDocument()
    expect(main.getByText(/Publié en/)).toBeInTheDocument()
  })

  it('shows a published date on blog articles and not on guides', () => {
    const post = firstPost!
    const blog = renderApp(<BlogArticlePage />, {
      route: articlePath(post, 'en'),
      path: '/blog/:slug',
    })
    expect(within(blog.getByRole('main')).getByText(/Published August 2026/)).toBeInTheDocument()
    blog.unmount()

    const guide = firstGuide!
    const guideView = renderApp(<GuideArticlePage />, {
      route: articlePath(guide, 'en'),
      path: '/guides/:slug',
    })
    expect(within(guideView.getByRole('main')).queryByText(/Published/)).not.toBeInTheDocument()
  })

  it('resolves a slug from the other locale rather than dropping the page', () => {
    /* Prerendered URLs are locale-correct, but a hand-typed or stale link may
       carry the other locale's slug. PolicyPage and HelpArticlePage both fall
       back this way instead of redirecting. */
    const post = firstPost!
    renderApp(<BlogArticlePage />, { route: `/blog/${post.frSlug}`, path: '/blog/:slug' })
    expect(
      within(screen.getByRole('main')).getByRole('heading', { level: 1, name: post.title.en }),
    ).toBeInTheDocument()
  })

  it('redirects an unknown slug to the collection index instead of rendering an empty page', () => {
    renderApp(<GuideArticlePage />, { route: '/guides/not-a-real-guide', path: '/guides/:slug' })
    expect(screen.queryByRole('heading', { level: 1, name: firstGuide!.title.en })).toBeNull()
  })

  it('keeps every slug unique across both collections and locales', () => {
    /* Slugs are public URLs; a collision would silently shadow a page. */
    const paths = ALL_ARTICLES.flatMap((a) => [articlePath(a, 'en'), articlePath(a, 'fr')])
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('never reuses a title between the guides and blog collections', () => {
    const guideTitles = new Set(GUIDE_ARTICLES.map((a) => a.title.en))
    for (const post of BLOG_ARTICLES) {
      expect(guideTitles.has(post.title.en)).toBe(false)
    }
  })

  it('gives every article enough body copy to be worth indexing', () => {
    for (const article of ALL_ARTICLES) {
      const words = articleSections(article.collection, article.slug)
        .flatMap((s) => s.blocks.map((b) => b.text.en))
        .join(' ')
        .split(/\s+/).length
      expect(words).toBeGreaterThan(300)
    }
  })
})
