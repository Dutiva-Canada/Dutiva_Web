import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { CHANGELOG_ENTRIES } from '../changelog/changelogEntries'
import { ChangelogPage } from './ChangelogPage'

describe('ChangelogPage', () => {
  it('renders dated entries with founder byline in English', () => {
    renderApp(<ChangelogPage />, { route: '/changelog', path: '/changelog' })
    expect(screen.getByRole('heading', { level: 1, name: 'What we shipped.' })).toBeInTheDocument()
    expect(screen.getByText(/Updates from Martin Constantineau/)).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    for (const entry of CHANGELOG_ENTRIES) {
      expect(main.getByRole('heading', { level: 2, name: entry.title.en })).toBeInTheDocument()
    }
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<ChangelogPage />, { route: '/changelog', path: '/changelog' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ce que nous avons livré.' }),
    ).toBeInTheDocument()
  })
})
