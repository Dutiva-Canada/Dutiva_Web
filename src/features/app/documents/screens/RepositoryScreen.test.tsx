import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { DoclibProvider } from '../DoclibProvider'
import { RepositoryScreen } from './RepositoryScreen'

function renderRepository() {
  return renderApp(
    <DoclibProvider>
      <RepositoryScreen />
    </DoclibProvider>,
    { route: '/app/documents', path: '/app/documents' },
  )
}

describe('RepositoryScreen', () => {
  afterEach(() => {
    sessionStorage.removeItem('dutiva-doclib-role')
  })

  it('lists the 13 non-archived documents by default, with row links to detail', async () => {
    renderRepository()

    expect(await screen.findByText('My documents')).toBeInTheDocument()
    const table = await screen.findByRole('table')
    const links = within(table).getAllByRole('link')
    expect(links).toHaveLength(13)

    /* Fixture order — doc_001 first; its row link targets the detail route. */
    expect(links[0]).toHaveAttribute('href', '/app/documents/doc_001')
    expect(within(table).getByText('Offer of employment — Gabriel Dubois')).toBeInTheDocument()

    /* Count card mirrors the visible set. */
    expect(screen.getByText('13')).toBeInTheDocument()

    /* Catalogue templates must not appear as repository rows. */
    expect(screen.queryByText('Offer of employment letter')).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Create from a template' })).toHaveAttribute(
      'href',
      '/app/documents/studio',
    )

    /* The archived fixture stays hidden until the toggle is on. */
    expect(
      screen.queryByText('Vacation & leave policy — 2025 (superseded)'),
    ).not.toBeInTheDocument()
  })

  it('narrows by title search', async () => {
    renderRepository()

    const input = await screen.findByPlaceholderText('Search documents…')
    fireEvent.change(input, { target: { value: 'Gabriel' } })

    const table = screen.getByRole('table')
    const links = within(table).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(within(table).getByText('Offer of employment — Gabriel Dubois')).toBeInTheDocument()
  })

  it('narrows with the status filter', async () => {
    renderRepository()
    await screen.findByRole('table')

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'signed' } })

    /* doc_001, doc_011, doc_014 are status=signed (non-archived). */
    expect(within(screen.getByRole('table')).getAllByRole('link')).toHaveLength(3)
    expect(
      within(screen.getByRole('table')).getByText('Code of conduct — 2026'),
    ).toBeInTheDocument()
  })

  it('reveals archived documents with the show-archived toggle', async () => {
    renderRepository()
    await screen.findByRole('table')

    fireEvent.click(screen.getByRole('button', { name: 'Show archived' }))

    expect(within(screen.getByRole('table')).getAllByRole('link')).toHaveLength(14)
    /* Title shows in both the table row and the mobile card variant. */
    expect(
      screen.getAllByText('Vacation & leave policy — 2025 (superseded)').length,
    ).toBeGreaterThan(0)
  })

  it('shows a permission note instead of the repository for the external role', async () => {
    sessionStorage.setItem('dutiva-doclib-role', 'external')
    renderRepository()

    expect(await screen.findByText('Action not available for your role')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
