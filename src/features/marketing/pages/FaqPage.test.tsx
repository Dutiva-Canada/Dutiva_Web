import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { FaqPage } from './FaqPage'

describe('FaqPage', () => {
  it('renders hero, question groups, and CTA in English', () => {
    const { container } = renderApp(<FaqPage />, { route: '/faq', path: '/faq' })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Frequently asked questions.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'General' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Compliance & coverage' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Data & security' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Pricing & billing' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Choosing and getting started' }),
    ).toBeInTheDocument()
    // The Footer repeats the legal-advice disclaimer — scope content to <main>.
    const main = within(screen.getByRole('main'))
    expect(main.getByText('Is Dutiva a law firm?')).toBeInTheDocument()
    // Native <details> keeps its content in the DOM even while closed.
    expect(
      main.getByText(
        'No. Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice. Complex or high-risk situations should be reviewed with qualified counsel.',
      ),
    ).toBeInTheDocument()
    // Payroll-scope disambiguation renders under the General group.
    expect(main.getByText('Does Dutiva run payroll?')).toBeInTheDocument()
    expect(main.getByText('Can I use one subscription for multiple clients?')).toBeInTheDocument()
    expect(
      main.getByText('How do I choose an HR compliance provider in this space?'),
    ).toBeInTheDocument()
    expect(main.getByText('What should I know before committing to Dutiva?')).toBeInTheDocument()
    expect(main.getByText('Is Dutiva reputable?')).toBeInTheDocument()
    expect(main.getByText('How do I get started with Dutiva?')).toBeInTheDocument()
    expect(main.getByText('How do I contact Dutiva support?')).toBeInTheDocument()
    expect(
      main.getByText(/Dutiva is HR compliance and documentation software — not a payroll provider/),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('details')).toHaveLength(20)
    expect(main.getByRole('link', { name: /Contact support/ })).toHaveAttribute(
      'href',
      'mailto:support@dutiva.ca',
    )
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<FaqPage />, { route: '/faq', path: '/faq' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    expect(langToggle).toBeDefined()
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Foire aux questions.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Général' })).toBeInTheDocument()
  })
})
