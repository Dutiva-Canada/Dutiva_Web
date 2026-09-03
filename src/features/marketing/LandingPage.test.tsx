import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { landing } from '@/i18n/messages/landing'
import { GUIDE_ARTICLES } from './articles'
import { LandingPage } from './LandingPage'
import { HOME_FAQ_ITEMS } from './homeFaq'

describe('LandingPage', () => {
  it('emits FAQPage JSON-LD from the same homepage questions that are visible', () => {
    renderApp(<LandingPage />, { route: '/', path: '/' })

    const script = document.head.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const graph = (
      JSON.parse(script!.textContent ?? '') as { '@graph': Record<string, unknown>[] }
    )['@graph']
    const page = graph.find((node) => node['@type'] === 'FAQPage') as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[]
    }
    expect(page.mainEntity).toHaveLength(HOME_FAQ_ITEMS.length)

    for (const [index, item] of HOME_FAQ_ITEMS.entries()) {
      expect(page.mainEntity[index]?.name).toBe(landing[item.q].en)
      expect(page.mainEntity[index]?.acceptedAnswer.text).toBe(landing[item.a].en)
      expect(
        screen.getByRole('heading', { level: 2, name: landing[item.q].en }),
      ).toBeInTheDocument()
    }
  })

  it('emits BreadcrumbList JSON-LD and Article nodes for the visible guide cards', () => {
    renderApp(<LandingPage />, { route: '/', path: '/' })

    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument()

    const script = document.head.querySelector('script[type="application/ld+json"]')
    const graph = (
      JSON.parse(script!.textContent ?? '') as { '@graph': Record<string, unknown>[] }
    )['@graph']
    expect(graph.some((node) => node['@type'] === 'BreadcrumbList')).toBe(true)
    const articles = graph.filter((node) => node['@type'] === 'Article')
    expect(articles).toHaveLength(GUIDE_ARTICLES.length)
    for (const guide of GUIDE_ARTICLES) {
      expect(articles.some((node) => node.headline === guide.title.en)).toBe(true)
      expect(screen.getByText(guide.title.en)).toBeInTheDocument()
    }
  })

  it('sends header and footer Guides to the guides index, not a homepage hash', () => {
    renderApp(<LandingPage />, { route: '/', path: '/' })
    const links = screen.getAllByRole('link', { name: 'Guides' })
    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/guides')
    }
  })

  it('points header nav at landing sections, /pricing, /guides, and sign-in', () => {
    renderApp(<LandingPage />, { route: '/', path: '/' })
    const nav = document.querySelector('header nav') as HTMLElement | null
    expect(nav).not.toBeNull()
    const href = (name: string) => within(nav!).getByRole('link', { name }).getAttribute('href')

    expect(href('How it works')).toBe('/#how')
    expect(href('Workflows')).toBe('/#workflows')
    expect(href('Document Studio')).toBe('/#product')
    expect(href('Coverage')).toBe('/#coverage')
    expect(href('Pricing')).toBe('/pricing')
    expect(href('Guides')).toBe('/guides')

    const header = document.querySelector('header')!
    expect(within(header).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/app/welcome',
    )
    expect(within(header).getByRole('link', { name: 'See plans' })).toHaveAttribute(
      'href',
      '/pricing',
    )
  })

  it('shows the Free plan access duration on the homepage pricing card', () => {
    renderApp(<LandingPage />, { route: '/', path: '/' })
    expect(
      screen.getByText(/Free access lasts 3 months\. It may be extended after that\./),
    ).toBeInTheDocument()
  })

  it('scrolls the hash target into view when the landing page mounts with a hash', () => {
    const spy = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: spy,
    })
    try {
      renderApp(<LandingPage />, { route: '/#product', path: '/' })
      expect(document.getElementById('product')).not.toBeNull()
      expect(spy).toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    }
  })
})
