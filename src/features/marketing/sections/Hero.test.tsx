import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { landing } from '@/i18n/messages/landing'
import { Hero } from './Hero'

describe('Hero', () => {
  it('states who the product is not for below the disclaimer', () => {
    renderApp(<Hero />, { route: '/', path: '/' })
    expect(screen.getByText(landing.landing_hero_scope.en)).toBeInTheDocument()
  })

  it('leads with relief and statute-grounded guidance in the hero subhead', () => {
    expect(landing.landing_sub_dir_strong.en).toMatch(/losing sleep/i)
    expect(landing.landing_sub_dir_rest.en).toMatch(/review-ready document/)
    expect(landing.landing_sub_dir_rest.en).toMatch(/exact statutes/)
  })
})
