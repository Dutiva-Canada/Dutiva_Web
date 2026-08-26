/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { Seo } from './Seo'
import { SITE_ORIGIN } from './site'

function renderSeo(ui: React.ReactElement) {
  return render(<LangProvider>{ui}</LangProvider>)
}

const head = () => document.head

describe('<Seo>', () => {
  it('applies title, description, robots, canonical, and hreflang to document.head', () => {
    renderSeo(<Seo route="about" />)
    expect(document.title).toBe('About Dutiva — HR compliance software, built in Canada')
    expect(head().querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'Dutiva Canada Inc.',
    )
    expect(head().querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('index')
    expect(head().querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_ORIGIN}/about`,
    )
    expect(head().querySelector('link[hreflang="fr-CA"]')?.getAttribute('href')).toBe(
      `${SITE_ORIGIN}/fr/a-propos`,
    )
    expect(head().querySelector('link[hreflang="x-default"]')?.getAttribute('href')).toBe(
      `${SITE_ORIGIN}/about`,
    )
  })

  it('replaces tags on page change without accumulating duplicates', () => {
    const first = renderSeo(<Seo route="about" />)
    first.unmount()
    renderSeo(<Seo route="faq" />)
    expect(document.title).toBe('Frequently asked questions | Dutiva')
    expect(head().querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(head().querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(head().querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_ORIGIN}/faq`,
    )
  })

  it('emits parseable JSON-LD aligned with the page', () => {
    renderSeo(
      <Seo
        route="faq"
        faq={[{ question: 'Is Dutiva a law firm?', answer: 'No. Dutiva is not a law firm.' }]}
      />,
    )
    const scripts = head().querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(1)
    const graph = (
      JSON.parse(scripts[0]!.textContent ?? '') as { '@graph': Record<string, unknown>[] }
    )['@graph']
    const pageNode = graph.find((n) => n['@type'] === 'FAQPage') as {
      mainEntity: { name: string }[]
    }
    expect(pageNode.mainEntity[0]!.name).toBe('Is Dutiva a law firm?')
  })

  it('renders noindex pages without canonical or JSON-LD', () => {
    renderSeo(
      <Seo
        page={{
          title: { en: 'Page not found | Dutiva', fr: 'Page introuvable | Dutiva' },
          description: { en: 'Not found description.', fr: 'Description introuvable.' },
          path: { en: '/', fr: '/fr' },
          indexable: false,
        }}
      />,
    )
    expect(head().querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    )
    expect(head().querySelector('link[rel="canonical"]')).toBeNull()
    expect(head().querySelector('script[type="application/ld+json"]')).toBeNull()
  })
})
