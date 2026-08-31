import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { knowledgeItems } from '@/data'
import { KnowledgeView } from './KnowledgeView'

describe('KnowledgeView', () => {
  /* The rail's advisor turn streams on timers — keep them under test control. */
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders every knowledge article with its tag', () => {
    renderApp(<KnowledgeView />, { route: '/app/knowledge', path: '/app/knowledge' })

    const articles = within(screen.getByTestId('knowledge-articles'))
    expect(articles.getAllByRole('button')).toHaveLength(knowledgeItems.length)
    expect(
      screen.getByText('Ontario ESA: notice of termination & severance pay'),
    ).toBeInTheDocument()
    expect(screen.getByText('Termination · Ontario')).toBeInTheDocument()
    expect(
      screen.getByText('Probationary periods: employment standards & termination risk'),
    ).toBeInTheDocument()
  })

  it('filters articles by title or tag (case-insensitive substring)', () => {
    renderApp(<KnowledgeView />, { route: '/app/knowledge', path: '/app/knowledge' })
    const input = screen.getByPlaceholderText('Search HR knowledge…')
    const articles = within(screen.getByTestId('knowledge-articles'))

    /* Title match. */
    fireEvent.change(input, { target: { value: 'SEVERANCE' } })
    expect(articles.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByText('Ontario ESA: notice of termination & severance pay'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Quebec Charter of the French Language: employment documents in French'),
    ).not.toBeInTheDocument()

    /* Tag match. */
    fireEvent.change(input, { target: { value: 'british columbia' } })
    expect(articles.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByText('BC Employment Standards: hiring rules & employment terms'),
    ).toBeInTheDocument()

    /* Clearing restores the full list. */
    fireEvent.change(input, { target: { value: '' } })
    expect(articles.getAllByRole('button')).toHaveLength(knowledgeItems.length)
  })

  it('opens the Advisor rail on the article when clicked', () => {
    renderApp(
      <>
        <KnowledgeView />
        <AdvisorRail />
      </>,
      { route: '/app/knowledge', path: '/app/knowledge' },
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Duty to accommodate/ }))

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText('Duty to accommodate: functional limitations vs. diagnosis'),
    ).toBeInTheDocument()
  })
})
