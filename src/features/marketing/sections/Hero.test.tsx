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

  it('names statutes in the hero subhead copy', () => {
    expect(landing.landing_sub_dir_rest.en).toMatch(/Employment Standards Act/)
    expect(landing.landing_sub_dir_rest.en).toMatch(/Canada Labour Code/)
    expect(landing.landing_sub_dir_rest.en).toMatch(/not just the province/)
  })
})
