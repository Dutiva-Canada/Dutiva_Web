import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { COMPARISON_PAGES } from '../comparison/comparisonPages'
import { VsHrdownloadsPage, VsSixfiftyPage } from './ComparisonPage'

describe('ComparisonPage', () => {
  it('renders HRdownloads comparison table and FAQ in English', () => {
    const page = COMPARISON_PAGES.hrdownloads
    renderApp(<VsHrdownloadsPage />, { route: '/vs/hrdownloads', path: '/vs/hrdownloads' })
    expect(
      screen.getByRole('heading', { level: 1, name: page.h1.en }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('columnheader', { name: 'Dutiva' })).toBeInTheDocument()
    expect(main.getByRole('columnheader', { name: 'Citation Canada (HRdownloads)' })).toBeInTheDocument()
    expect(main.getByText(/Citation Canada \(formerly HRdownloads\)/)).toBeInTheDocument()
    expect(main.getByText('Pricing transparency')).toBeInTheDocument()
    expect(main.getByText('AI risk flagging')).toBeInTheDocument()
    for (const item of page.faq) {
      expect(main.getByText(item.question.en)).toBeInTheDocument()
    }
    expect(main.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/app/welcome')
  })

  it('renders SixFifty comparison page', () => {
    const page = COMPARISON_PAGES.sixfifty
    renderApp(<VsSixfiftyPage />, { route: '/vs/sixfifty', path: '/vs/sixfifty' })
    expect(
      screen.getByRole('heading', { level: 1, name: page.h1.en }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('columnheader', { name: 'SixFifty' })).toBeInTheDocument()
    expect(main.getByRole('row', { name: /Pricing transparency/ }).textContent).toMatch(
      /\$75\/mo billed annually/,
    )
  })
})
