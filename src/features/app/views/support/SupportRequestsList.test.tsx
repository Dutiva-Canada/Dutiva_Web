import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'

const listMySupportTickets = vi.hoisted(() => vi.fn())
vi.mock('@/features/support/supportApi', () => ({ listMySupportTickets }))

import { SupportRequestsList } from './SupportRequestsList'

function renderList() {
  render(
    <LangProvider>
      <MemoryRouter>
        <SupportRequestsList />
      </MemoryRouter>
    </LangProvider>,
  )
}

beforeEach(() => {
  listMySupportTickets.mockReset()
})

describe('SupportRequestsList', () => {
  it('shows the empty state with a CTA', async () => {
    listMySupportTickets.mockResolvedValue([])
    renderList()
    expect(await screen.findByText(/haven’t sent any support requests/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /send your first request/i })).toHaveAttribute(
      'href',
      '/workspace/support',
    )
  })

  it('lists tickets with reference, status, and a link to the thread', async () => {
    listMySupportTickets.mockResolvedValue([
      {
        id: 't1',
        publicReference: 'DUT-2026-000001',
        subject: 'Cannot generate a document',
        category: 'technical',
        status: 'new',
        priority: 'standard',
        createdAt: '2026-07-16T00:00:00Z',
        updatedAt: '2026-07-16T00:00:00Z',
      },
    ])
    renderList()
    expect(await screen.findByText('Cannot generate a document')).toBeInTheDocument()
    expect(screen.getByText(/DUT-2026-000001/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cannot generate a document/i })).toHaveAttribute(
      'href',
      '/workspace/support/requests/t1',
    )
  })

  it('shows an error state when the load fails', async () => {
    listMySupportTickets.mockRejectedValue(new Error('boom'))
    renderList()
    expect(await screen.findByText(/couldn’t load your requests/i)).toBeInTheDocument()
  })
})
