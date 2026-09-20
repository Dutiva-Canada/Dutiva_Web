import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'

const isCurrentUserAdmin = vi.hoisted(() => vi.fn())
const adminListUsers = vi.hoisted(() => vi.fn())
const adminListOrganizations = vi.hoisted(() => vi.fn())
vi.mock('@/features/support/supportAdminApi', () => ({ isCurrentUserAdmin }))
vi.mock('@/features/support/adminDirectoryApi', () => ({
  adminListUsers,
  adminListOrganizations,
}))

import { CustomerDirectoryView } from './CustomerDirectoryView'

function renderView() {
  render(
    <LangProvider>
      <MemoryRouter>
        <CustomerDirectoryView />
      </MemoryRouter>
    </LangProvider>,
  )
}

beforeEach(() => {
  isCurrentUserAdmin.mockReset()
  adminListUsers.mockReset()
  adminListOrganizations.mockReset()
  adminListUsers.mockResolvedValue([])
  adminListOrganizations.mockResolvedValue([])
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('min-width:'),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  )
})

describe('CustomerDirectoryView', () => {
  it('denies non-admins', async () => {
    isCurrentUserAdmin.mockResolvedValue(false)
    renderView()
    expect(await screen.findByText(/limited to support operators/i)).toBeInTheDocument()
    expect(adminListUsers).not.toHaveBeenCalled()
    expect(adminListOrganizations).not.toHaveBeenCalled()
  })

  it('lists accounts and workspaces for an admin', async () => {
    isCurrentUserAdmin.mockResolvedValue(true)
    adminListUsers.mockResolvedValue([
      {
        userId: 'u1',
        email: 'newcustomer@acme.test',
        companyName: 'Acme Corp',
        plan: null,
        subscriptionStatus: null,
        billingPeriod: null,
        roles: [],
        createdAt: '2026-09-18T12:00:00Z',
        lastSignInAt: null,
      },
    ])
    adminListOrganizations.mockResolvedValue([
      {
        organizationId: 'o1',
        name: 'Acme Workspace',
        legalName: 'Acme Corp Inc.',
        plan: 'growth',
        subscriptionStatus: 'active',
        billingPeriod: 'monthly',
        memberCount: 3,
        createdAt: '2026-09-18T12:00:00Z',
      },
    ])
    renderView()
    expect(await screen.findByText('newcustomer@acme.test')).toBeInTheDocument()
    expect(screen.getByText('Acme Workspace')).toBeInTheDocument()
    // Null plan renders as free (0013 convention).
    expect(screen.getAllByText('free').length).toBeGreaterThan(0)
  })
})
