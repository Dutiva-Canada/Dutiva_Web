import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'

vi.mock('@/features/app/workspaceMode/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/app/workspaceMode/api')>()),
  claimOrgInvitations: vi.fn(async () => 0),
  fetchOrganizationMembership: vi.fn(async () => null),
  bootstrapOrganization: vi.fn(async () => ({
    status: 'success',
    organizationId: 'org-new',
    memberRole: 'owner',
  })),
  saveStoredMode: vi.fn(async () => true),
}))

const api = await import('@/features/app/workspaceMode/api')

function renderDoor(ui: ReactElement, auth: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    status: 'signed-out',
    session: null,
    authorized: null,
    signInWithEmail: vi.fn(async () => undefined),
    verifyEmailCode: vi.fn(async () => undefined),
    signOut: vi.fn(async () => {}),
    refreshAuthorization: vi.fn(async () => {}),
    ...auth,
  }
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthContext.Provider value={value}>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/employer']}>
              <Routes>
                <Route path="/employer" element={ui} />
                <Route path="/app/home" element={<div data-testid="workspace" />} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthContext.Provider>
      </LangProvider>
    </ThemeProvider>,
  )
}

const SIGNED_IN: Partial<AuthContextValue> = {
  status: 'signed-in',
  session: { user: { id: 'u9', email: 'boss@acme.ca' } } as AuthContextValue['session'],
}

describe('EmployerDoorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the passwordless sign-in card when signed out', async () => {
    const { EmployerDoorPage } = await import('./EmployerDoorPage')
    renderDoor(<EmployerDoorPage />)

    expect(
      await screen.findByRole('heading', { name: /Dutiva for employers/i }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Welcome back/i })).toBeInTheDocument()
  })

  it('offers "open your workspace" to a signed-in org member', async () => {
    vi.mocked(api.fetchOrganizationMembership).mockResolvedValue({
      organizationId: 'org-1',
      role: 'member',
    })
    const { EmployerDoorPage } = await import('./EmployerDoorPage')
    renderDoor(<EmployerDoorPage />, SIGNED_IN)

    const open = await screen.findByRole('button', { name: /Open your workspace/i })
    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.setup().click(open)

    expect(vi.mocked(api.saveStoredMode)).toHaveBeenCalledWith('u9', 'production')
    expect(await screen.findByTestId('workspace')).toBeInTheDocument()
  })

  it('offers org creation to a signed-in non-member and provisions via the RPC', async () => {
    vi.mocked(api.fetchOrganizationMembership).mockResolvedValue(null)
    const { EmployerDoorPage } = await import('./EmployerDoorPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderDoor(<EmployerDoorPage />, SIGNED_IN)

    await user.type(
      await screen.findByLabelText(/Organization name/i),
      'Acme Manufacturing',
    )
    await user.click(screen.getByRole('button', { name: /Create workspace/i }))

    expect(vi.mocked(api.bootstrapOrganization)).toHaveBeenCalledWith(
      'Acme Manufacturing',
      'Acme Manufacturing',
    )
    expect(await screen.findByTestId('workspace')).toBeInTheDocument()
  })

  it('surfaces the capacity message when the RPC declines', async () => {
    vi.mocked(api.fetchOrganizationMembership).mockResolvedValue(null)
    vi.mocked(api.bootstrapOrganization).mockResolvedValue({ status: 'capacity' })
    const { EmployerDoorPage } = await import('./EmployerDoorPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderDoor(<EmployerDoorPage />, SIGNED_IN)

    await user.type(await screen.findByLabelText(/Organization name/i), 'Acme')
    await user.click(screen.getByRole('button', { name: /Create workspace/i }))

    expect(await screen.findByText(/at capacity/i)).toBeInTheDocument()
  })
})
