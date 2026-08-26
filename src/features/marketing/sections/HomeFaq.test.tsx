import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { landing } from '@/i18n/messages/landing'
import { HOME_FAQ_ITEMS } from '../homeFaq'
import { HomeFaq } from './HomeFaq'

describe('HomeFaq', () => {
  it('puts each answer in the paragraph immediately under the question heading', () => {
    renderApp(<HomeFaq />, { route: '/', path: '/' })

    for (const item of HOME_FAQ_ITEMS) {
      const heading = screen.getByRole('heading', { level: 2, name: landing[item.q].en })
      const answer = heading.nextElementSibling
      expect(answer?.tagName).toBe('P')
      expect(answer).toHaveTextContent(landing[item.a].en)
    }
  })

  it('links to the full FAQ', () => {
    renderApp(<HomeFaq />, { route: '/', path: '/' })
    expect(screen.getByRole('link', { name: landing.landing_faq_more.en })).toHaveAttribute(
      'href',
      '/faq',
    )
  })
})
