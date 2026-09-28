import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { landing } from '@/i18n/messages/landing'
import { getPlanById } from '@/config/plans'
import { Hero } from './Hero'

describe('Hero', () => {
  it('uses the on-demand support badge in both languages', () => {
    expect(landing.landing_hero_badge.en).toContain('Human support on demand')
    expect(landing.landing_hero_badge.fr).toContain('Soutien humain sur demande')
  })

  it('states who the product is not for below the disclaimer', () => {
    renderApp(<Hero />, { route: '/', path: '/' })
    expect(screen.getByText(landing.landing_hero_scope.en)).toBeInTheDocument()
  })

  it('anchors the entry price under the hero CTAs', () => {
    renderApp(<Hero />, { route: '/', path: '/' })
    const price = getPlanById('starter')!.monthlyPrice
    expect(screen.getByText(`$${price}`, { exact: false })).toBeInTheDocument()
    expect(landing.landing_hero_price.fr).toContain(`${price} $ CA`)
  })

  it('leads with relief and statute-grounded guidance in the hero subhead', () => {
    expect(landing.landing_sub_dir_strong.en).toMatch(/losing sleep/i)
    expect(landing.landing_sub_dir_rest.en).toMatch(/review-ready document/)
    expect(landing.landing_sub_dir_rest.en).toMatch(/exact statutes/)
  })
})
