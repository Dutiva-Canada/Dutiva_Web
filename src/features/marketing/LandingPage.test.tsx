import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { landing } from '@/i18n/messages/landing'
import { LandingPage } from './LandingPage'
import { HOME_FAQ_ITEMS } from './homeFaq'

describe('LandingPage', () => {
  it('emits FAQPage JSON-LD from the same homepage questions that are visible', () => {
    renderApp(<LandingPage />, { route: '/', path: '/' })

    const script = document.head.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const graph = (JSON.parse(script!.textContent ?? '') as { '@graph': Record<string, unknown>[] })[
      '@graph'
    ]
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
})
