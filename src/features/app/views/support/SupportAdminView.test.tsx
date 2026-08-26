import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'

const isCurrentUserAdmin = vi.hoisted(() => vi.fn())
const adminListTickets = vi.hoisted(() => vi.fn())
vi.mock('@/features/support/supportAdminApi', () => ({ isCurrentUserAdmin, adminListTickets }))

import { SupportAdminView } from './SupportAdminView'

function renderView() {
  render(
    <LangProvider>
      <MemoryRouter>
        <SupportAdminView />
      </MemoryRouter>
    </LangProvider>,
  )
}

beforeEach(() => {
  isCurrentUserAdmin.mockReset()
  adminListTickets.mockReset()
  adminListTickets.mockResolvedValue([])
})

describe('SupportAdminView', () => {
  it('denies non-admins', async () => {
    isCurrentUserAdmin.mockResolvedValue(false)
    renderView()
    expect(await screen.findByText(/limited to support operators/i)).toBeInTheDocument()
    expect(adminListTickets).not.toHaveBeenCalled()
  })

  it('shows the ticket table for an admin', async () => {
    isCurrentUserAdmin.mockResolvedValue(true)
    adminListTickets.mockResolvedValue([
      {
        id: 't1',
        publicReference: 'DUT-2026-000009',
        subject: 'Security concern',
        requesterEmail: 'user@acme.test',
        requesterPlan: null,
        category: 'security',
        status: 'new',
        priority: 'high',
        restricted: true,
        language: 'en',
        createdAt: '2026-07-16T00:00:00Z',
        firstResponseAt: null,
      },
    ])
    renderView()

    expect(await screen.findByRole('link', { name: /security concern/i })).toHaveAttribute(
      'href',
      '/app/support/admin/t1',
    )
    expect(screen.getByText('user@acme.test')).toBeInTheDocument()
    expect(screen.getByText(/DUT-2026-000009/)).toBeInTheDocument()
    expect(screen.getAllByText(/restricted/i).length).toBeGreaterThan(0)
  })
})
