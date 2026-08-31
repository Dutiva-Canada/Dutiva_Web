import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'

const getBetaCohortStatus = vi.hoisted(() => vi.fn().mockResolvedValue({ taken: 3, limit: 15 }))
vi.mock('../betaCohortApi', () => ({ getBetaCohortStatus }))

import { BetaSpotCounter } from './BetaSpotCounter'

describe('BetaSpotCounter', () => {
  it('shows aggregate cohort fill from the status endpoint', async () => {
    renderApp(<BetaSpotCounter />, { route: '/', path: '/' })
    expect(await screen.findByText('3 of 15 spots currently taken')).toBeInTheDocument()
  })

  it('adds extraTaken to the displayed count', async () => {
    renderApp(<BetaSpotCounter extraTaken={2} />, { route: '/', path: '/' })
    expect(await screen.findByText('5 of 15 spots currently taken')).toBeInTheDocument()
  })
})
