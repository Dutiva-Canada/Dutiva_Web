import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

/**
 * Same fresh-module-graph pattern as AuthProvider.test.tsx: `supabaseClient`
 * is mocked per test, and RequireAdminSession + AuthProvider + LangProvider
 * are re-imported together after vi.resetModules() so they all share one
 * AuthContext instance.
 */
describe('RequireAdminSession', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.doUnmock('@/lib/deployEnv')
    vi.resetModules()
  })

  async function renderGuarded() {
    const { RequireAdminSession } = await import('./RequireAdminSession')
    const { AuthProvider } = await import('./AuthProvider')
    const { LangProvider } = await import('@/i18n/LangProvider')

    render(
      <LangProvider>
        <MemoryRouter initialEntries={['/app']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <RequireAdminSession>
                    <div>workspace</div>
                  </RequireAdminSession>
                }
              />
              <Route path="/app/welcome" element={<div>welcome</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </LangProvider>,
    )
  }

  it('renders children when Supabase is not configured (no gate to apply)', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: null }))
    vi.resetModules()
    await renderGuarded()
    expect(await screen.findByText('workspace')).toBeInTheDocument()
  })

  it('renders children on a Vercel preview deployment even when signed out', async () => {
    vi.doMock('@/lib/deployEnv', () => ({ isVercelPreview: () => true }))
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
      },
    }))
    vi.resetModules()
    await renderGuarded()
    expect(await screen.findByText('workspace')).toBeInTheDocument()
    expect(screen.queryByText('welcome')).toBeNull()
  })

  it('still gates a signed-out visitor when not on a preview deployment', async () => {
    vi.doMock('@/lib/deployEnv', () => ({ isVercelPreview: () => false }))
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
      },
    }))
    vi.resetModules()
    await renderGuarded()
    expect(await screen.findByText('welcome')).toBeInTheDocument()
    expect(screen.queryByText('workspace')).toBeNull()
  })

  it('redirects to /app/welcome when signed out', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
      },
    }))
    vi.resetModules()
    await renderGuarded()
    expect(await screen.findByText('welcome')).toBeInTheDocument()
    expect(screen.queryByText('workspace')).toBeNull()
  })

  it('redirects to /app/welcome for a signed-in session that is not on the beta list', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({ data: { session: { user: { email: 'riley@example.com' } } } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: false, error: null })),
      },
    }))
    vi.resetModules()
    await renderGuarded()
    expect(await screen.findByText('welcome')).toBeInTheDocument()
    expect(screen.queryByText('workspace')).toBeNull()
  })

  it('renders children for a signed-in, invited session', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
      },
    }))
    vi.resetModules()
    await renderGuarded()
    expect(await screen.findByText('workspace')).toBeInTheDocument()
  })

  it('shows neither screen while the membership check is still in flight', async () => {
    let resolveRpc: ((value: { data: boolean; error: null }) => void) | undefined
    const rpc = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRpc = resolve
        }),
    )
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              /* Non-staff email — @dutiva.ca short-circuits without the RPC. */
              data: { session: { user: { email: 'invited@example.com' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc,
      },
    }))
    vi.resetModules()
    await renderGuarded()
    // Wait for the effect chain (session settles -> status signed-in -> membership
    // RPC called) to actually reach the RPC before asserting the pending state —
    // a fixed-delay wait can race ahead of it and leave resolveRpc unset.
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('current_user_is_workspace_member'))
    expect(screen.queryByText('workspace')).toBeNull()
    expect(screen.queryByText('welcome')).toBeNull()

    resolveRpc?.({ data: true, error: null })
    expect(await screen.findByText('workspace')).toBeInTheDocument()
  })

  it('holds the surface blank while the workspace pass is still resolving', async () => {
    /* Identity-flicker regression: a signed-in production user must never see
       demo identity/fixtures — the gate stays on the blank screen until
       WorkspaceModeProvider commits mode + identity. */
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
      },
    }))
    vi.resetModules()

    const { RequireAdminSession } = await import('./RequireAdminSession')
    const { AuthProvider } = await import('./AuthProvider')
    const { LangProvider } = await import('@/i18n/LangProvider')
    const { WorkspaceModeContext } = await import(
      '@/features/app/workspaceMode/workspaceModeContext'
    )
    const resolving = { resolving: true } as Parameters<
      typeof WorkspaceModeContext.Provider
    >[0]['value']

    render(
      <LangProvider>
        <MemoryRouter initialEntries={['/app']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <WorkspaceModeContext.Provider value={resolving}>
                    <RequireAdminSession>
                      <div>workspace</div>
                    </RequireAdminSession>
                  </WorkspaceModeContext.Provider>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </LangProvider>,
    )

    /* Session + membership resolve fine — only the workspace pass is pending.
       Wait for the session to settle before asserting. */
    await waitFor(() => expect(screen.queryByText('welcome')).toBeNull())
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText('workspace')).toBeNull()
  })

  it('paints a skeleton — never a blank page — during the pending windows', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
      },
    }))
    vi.resetModules()

    const { RequireAdminSession } = await import('./RequireAdminSession')
    const { AuthProvider } = await import('./AuthProvider')
    const { LangProvider } = await import('@/i18n/LangProvider')
    const { WorkspaceModeContext } = await import(
      '@/features/app/workspaceMode/workspaceModeContext'
    )
    const resolving = { resolving: true } as Parameters<
      typeof WorkspaceModeContext.Provider
    >[0]['value']

    render(
      <LangProvider>
        <MemoryRouter initialEntries={['/app']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <WorkspaceModeContext.Provider value={resolving}>
                    <RequireAdminSession>
                      <div>workspace</div>
                    </RequireAdminSession>
                  </WorkspaceModeContext.Provider>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </LangProvider>,
    )

    /* The gate's pending surface is the shell-shaped skeleton with an
       accessible status node — a visible first paint, not an empty div. */
    await waitFor(() => expect(screen.queryByText('welcome')).toBeNull())
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText('workspace')).toBeNull()
    const status = screen.getByRole('status')
    expect(status).toHaveAccessibleName(/loading your workspace/i)
    /* Shell-shaped skeleton content — visible paint, not an empty div. */
    expect(status.firstElementChild).not.toBeNull()
    expect(status.firstElementChild?.childElementCount).toBeGreaterThan(0)
  })

  it('shows a localized retry surface when workspace resolution fails', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
      },
    }))
    vi.resetModules()

    const { RequireAdminSession } = await import('./RequireAdminSession')
    const { AuthProvider } = await import('./AuthProvider')
    const { LangProvider } = await import('@/i18n/LangProvider')
    const { WorkspaceModeContext } = await import(
      '@/features/app/workspaceMode/workspaceModeContext'
    )
    const retryResolution = vi.fn()
    const failed = { resolving: false, resolutionFailed: true, retryResolution } as unknown as Parameters<
      typeof WorkspaceModeContext.Provider
    >[0]['value']

    render(
      <LangProvider>
        <MemoryRouter initialEntries={['/app']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <WorkspaceModeContext.Provider value={failed}>
                    <RequireAdminSession>
                      <div>workspace</div>
                    </RequireAdminSession>
                  </WorkspaceModeContext.Provider>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </LangProvider>,
    )

    /* A signed-in session whose resolution failed gets an honest error +
       retry — never the demo workspace the degraded reads would imply. */
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/load your workspace/i)
    expect(screen.queryByText('workspace')).toBeNull()
    expect(screen.queryByText('welcome')).toBeNull()

    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.setup().click(screen.getByRole('button', { name: /Try again/i }))
    expect(retryResolution).toHaveBeenCalledTimes(1)
  })
})
