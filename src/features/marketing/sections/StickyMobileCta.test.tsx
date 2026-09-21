import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { StickyMobileCta } from './StickyMobileCta'

describe('StickyMobileCta', () => {
  it('renders a single paid-first plans link', () => {
    renderApp(<StickyMobileCta />, { route: '/', path: '/' })
    /* The bar mounts aria-hidden until the hero scrolls away. */
    const link = screen.getByRole('link', {
      name: /See plans|Voir les forfaits/i,
      hidden: true,
    })
    expect(link).toHaveAttribute('href', '/pricing')
  })
})
