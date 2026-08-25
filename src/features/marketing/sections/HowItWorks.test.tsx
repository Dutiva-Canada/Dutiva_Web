import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'
import { screen } from '@testing-library/react'
import { HowItWorks } from './HowItWorks'
import { landing } from '@/i18n/messages/landing'

describe('HowItWorks', () => {
  it('surfaces the risk-flagging callout below the steps', () => {
    renderApp(<HowItWorks />, { route: '/', path: '/' })
    expect(screen.getByText(landing.landing_how_risk_callout.en)).toBeInTheDocument()
  })
})
