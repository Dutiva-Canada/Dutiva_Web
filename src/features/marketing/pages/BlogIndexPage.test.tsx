import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { BLOG_ARTICLES, GUIDE_ARTICLES, articlePath } from '../articles'
import { BlogIndexPage } from './BlogIndexPage'

describe('BlogIndexPage', () => {
  it('renders hero, a linked card per post, and CTA in English', () => {
    renderApp(<BlogIndexPage />, { route: '/blog', path: '/blog' })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Know what applies to your workplace.' }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    for (const post of BLOG_ARTICLES) {
      expect(main.getByRole('heading', { level: 2, name: post.title.en })).toBeInTheDocument()
      expect(main.getByRole('link', { name: post.title.en })).toHaveAttribute(
        'href',
        articlePath(post, 'en'),
      )
    }
    // Header carries its own "Start free" links — scope the CTA check to <main>.
    expect(main.getByRole('link', { name: /Start free/ })).toHaveAttribute('href', '/app/welcome')
    expect(main.getAllByText(/Published August 2026/).length).toBe(BLOG_ARTICLES.length)
  })

  it('lists no topic that belongs to the guides collection', () => {
    /* The two indexes used to list the same six topics. Giving each a URL
       under both prefixes would ship duplicate competing pages, so the
       collections must stay disjoint. */
    renderApp(<BlogIndexPage />, { route: '/blog', path: '/blog' })
    const main = within(screen.getByRole('main'))
    for (const guide of GUIDE_ARTICLES) {
      expect(main.queryByText(guide.title.en)).not.toBeInTheDocument()
    }
  })

  it('points a reader who wants the document itself at /guides', () => {
    /* The two collections split on purpose, not freshness (articleModel.ts):
       /blog is the obligations that apply, /guides is the documents produced.
       A reader who landed on the wrong one needs a way across — without this
       link /blog is reachable from the footer but leads nowhere but itself. */
    renderApp(<BlogIndexPage />, { route: '/blog', path: '/blog' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /Browse the guides/ })).toHaveAttribute('href', '/guides')
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<BlogIndexPage />, { route: '/blog', path: '/blog' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    expect(langToggle).toBeDefined()
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Sachez ce qui s’applique à votre entreprise.',
      }),
    ).toBeInTheDocument()
    const [first] = BLOG_ARTICLES
    expect(first).toBeDefined()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: first!.title.fr }),
    ).toHaveAttribute('href', articlePath(first!, 'fr'))
  })
})
