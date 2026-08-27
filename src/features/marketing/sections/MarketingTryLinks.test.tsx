import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { MarketingTryLinks } from './MarketingTryLinks'

describe('MarketingTryLinks', () => {
  it('links to template samples and the jurisdiction tool', () => {
    renderApp(<MarketingTryLinks />, { route: '/', path: '/' })
    expect(screen.getByRole('link', { name: /See sample document outputs/ })).toHaveAttribute(
      'href',
      '/templates',
    )
    expect(screen.getByRole('link', { name: /Try the jurisdiction tool/ })).toHaveAttribute(
      'href',
      '/tools/jurisdiction-check',
    )
  })
})
