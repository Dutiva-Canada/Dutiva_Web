import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const getFirstLineAnswer = vi.hoisted(() => vi.fn())
vi.mock('./firstLineApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./firstLineApi')>()
  return { ...actual, getFirstLineAnswer }
})

import { FirstLineSuggestions } from './FirstLineSuggestions'

const ELIGIBLE = 'generate a document from a template'

describe('FirstLineSuggestions', () => {
  beforeEach(() => getFirstLineAnswer.mockReset())

  it('shows the human-handled note for a sensitive category', () => {
    renderApp(
      <FirstLineSuggestions query="I found a vulnerability" category="security" allowGenerative />,
    )
    expect(screen.getByRole('note')).toHaveTextContent(
      'This type of request is always handled by a person',
    )
    expect(screen.queryByText(/Before you send/)).toBeNull()
    // Never offers the generative button for a human-only category.
    expect(screen.queryByRole('button', { name: /instant answer/i })).toBeNull()
  })

  it('suggests matching Help Centre articles for an eligible category', () => {
    renderApp(<FirstLineSuggestions query={ELIGIBLE} category="product_question" />)
    expect(screen.getByText(/Before you send/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Generating a document from a template/ })
    expect(link).toHaveAttribute('href', '/help/generate-a-document')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders nothing before the query is meaningful', () => {
    renderApp(<FirstLineSuggestions query="ab" category="product_question" />)
    expect(screen.queryByRole('note')).toBeNull()
    expect(screen.queryByText(/Before you send/)).toBeNull()
  })

  it('offers the instant-answer button only when allowGenerative is set', () => {
    const { unmount } = renderApp(
      <FirstLineSuggestions query={ELIGIBLE} category="product_question" />,
    )
    expect(screen.queryByRole('button', { name: /instant answer/i })).toBeNull()
    unmount()
    renderApp(<FirstLineSuggestions query={ELIGIBLE} category="product_question" allowGenerative />)
    expect(screen.getByRole('button', { name: /instant answer/i })).toBeInTheDocument()
  })

  it('generates a grounded answer with the not-legal-advice disclaimer', async () => {
    const user = userEvent.setup()
    getFirstLineAnswer.mockResolvedValue({
      escalate: false,
      answer: 'Open Document Studio and pick a template.',
    })
    renderApp(<FirstLineSuggestions query={ELIGIBLE} category="product_question" allowGenerative />)
    await user.click(screen.getByRole('button', { name: /instant answer/i }))
    expect(await screen.findByText('Open Document Studio and pick a template.')).toBeInTheDocument()
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument()
    expect(getFirstLineAnswer).toHaveBeenCalledOnce()
  })

  it('shows an error and keeps the request path when there is no confident answer', async () => {
    const user = userEvent.setup()
    getFirstLineAnswer.mockResolvedValue({ escalate: false, answer: '' })
    renderApp(<FirstLineSuggestions query={ELIGIBLE} category="product_question" allowGenerative />)
    await user.click(screen.getByRole('button', { name: /instant answer/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t generate an answer/i)
  })
})
