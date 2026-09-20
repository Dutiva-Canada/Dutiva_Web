import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('filters accounts and workspaces independently', async () => {
    isCurrentUserAdmin.mockResolvedValue(true)
    adminListUsers.mockResolvedValue([
      {
        userId: 'u1',
        email: 'active@acme.test',
        companyName: 'Acme Corp',
        plan: 'growth',
        subscriptionStatus: 'active',
        billingPeriod: 'monthly',
        roles: [],
        createdAt: '2026-09-18T12:00:00Z',
        lastSignInAt: null,
      },
      {
        userId: 'u2',
        email: 'trial@beta.test',
        companyName: 'Beta Inc',
        plan: 'starter',
        subscriptionStatus: 'trialing',
        billingPeriod: 'monthly',
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
      {
        organizationId: 'o2',
        name: 'Beta Workspace',
        legalName: 'Beta Inc.',
        plan: 'starter',
        subscriptionStatus: 'trialing',
        billingPeriod: 'monthly',
        memberCount: 1,
        createdAt: '2026-09-18T12:00:00Z',
      },
    ])
    renderView()

    expect(await screen.findByText('active@acme.test')).toBeInTheDocument()
    const accountPlan = screen.getByRole('combobox', {
      name: /accounts.*plan/i,
    })
    fireEvent.change(accountPlan, { target: { value: 'growth' } })
    expect(screen.getByText('active@acme.test')).toBeInTheDocument()
    expect(screen.queryByText('trial@beta.test')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Workspace')).toBeInTheDocument()

    const workspaceStatus = screen.getByRole('combobox', {
      name: /workspaces.*status/i,
    })
    fireEvent.change(workspaceStatus, { target: { value: 'trialing' } })
    expect(screen.queryByText('Acme Workspace')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Workspace')).toBeInTheDocument()
  })
})
