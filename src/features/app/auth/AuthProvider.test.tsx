import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * `@/lib/supabaseClient` is mocked per test (vi.doMock + resetModules, same
 * pattern as documents/api.test.ts) so both the fake client's shape and
 * whether it exists at all can vary per test. AuthProvider, useAuth, AND
 * LangProvider are all re-imported fresh (dynamically, after resetModules)
 * so every module involved shares one module graph — AuthProvider now calls
 * useI18n(), and a statically-imported LangProvider would carry a stale
 * LangContext instance that doesn't match the freshly re-imported one.
 */
describe('AuthProvider', () => {
  /* Language is a persisted client preference; clear it so a French test can't
     bleed into the locale-sensitive assertions of the next one. */
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('stays signed-out when Supabase is not configured, and signInWithEmail reports it', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: null }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')
    const { authMessages } = await import('@/i18n/messages/auth')

    function Probe() {
      const { status, signInWithEmail } = useAuth()
      const [error, setError] = useState<string>()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => void signInWithEmail('a@b.com').then(setError)}>send</button>
          {error && <span data-testid="error">{error}</span>}
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    expect(screen.getByTestId('status')).toHaveTextContent('signed-out')
    await user.click(screen.getByRole('button', { name: 'send' }))
    expect(await screen.findByTestId('error')).toHaveTextContent(
      authMessages.auth_not_configured.en,
    )
  })

  it('localizes the not-configured error in French (not a hard-coded English string)', async () => {
    localStorage.setItem('dutiva-lang', 'fr')
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: null }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')
    const { authMessages } = await import('@/i18n/messages/auth')

    function Probe() {
      const { signInWithEmail } = useAuth()
      const [error, setError] = useState<string>()
      return (
        <div>
          <button onClick={() => void signInWithEmail('a@b.com').then(setError)}>send</button>
          {error && <span data-testid="error">{error}</span>}
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'send' }))
    const errorEl = await screen.findByTestId('error')
    expect(errorEl).toHaveTextContent(authMessages.auth_not_configured.fr)
    expect(errorEl).not.toHaveTextContent(authMessages.auth_not_configured.en)
  })

  it('reflects an existing session on load and updates on sign-out', async () => {
    let stateChangeHandler: ((event: string, session: unknown) => void) | undefined
    const fakeSession = { user: { id: 'u1' } }
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: fakeSession } }),
          onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
            stateChangeHandler = cb
            return { data: { subscription: { unsubscribe: vi.fn() } } }
          },
          signOut: vi.fn(async () => {
            stateChangeHandler?.('SIGNED_OUT', null)
          }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { status, signOut } = useAuth()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => void signOut()}>signout</button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    expect(await screen.findByTestId('status')).toHaveTextContent('signed-in')
    await user.click(screen.getByRole('button', { name: 'signout' }))
    expect(await screen.findByTestId('status')).toHaveTextContent('signed-out')
  })

  it('sends the magic link to any syntactically valid address — membership is checked after sign-in, never as a pre-send guess', async () => {
    /* No client-side eligibility gate anymore: pre-checking "is this address
       on the beta list" before sending would mean answering that question
       for an address that isn't necessarily the caller's own — the exact
       oracle create-beta-signup's duplicate-signup handling avoids. The real
       boundary is server-side (RLS, the edge-function checks) and, for the
       signed-in UI, the `authorized` field this provider now exposes. */
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          signInWithOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { status, signInWithEmail } = useAuth()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => void signInWithEmail('someone-not-yet-invited@gmail.com')}>
            send
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'send' }))
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'someone-not-yet-invited@gmail.com' }),
    )
    expect(await screen.findByTestId('status')).toHaveTextContent('sent-link')
  })

  it('resolves authorized from the workspace-membership RPC once signed in, and resets it on sign-out', async () => {
    let stateChangeHandler: ((event: string, session: unknown) => void) | undefined
    const rpc = vi.fn(() => Promise.resolve({ data: true, error: null }))
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
            stateChangeHandler = cb
            return { data: { subscription: { unsubscribe: vi.fn() } } }
          },
        },
        rpc,
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { status, authorized } = useAuth()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="authorized">{String(authorized)}</span>
        </div>
      )
    }

    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    /* Let the initial getSession() resolution (signed-out, no session) settle
       before simulating a sign-in via onAuthStateChange — otherwise that
       still-pending resolution can land after the manual sign-in below and
       clobber it back to signed-out. */
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'))
    expect(screen.getByTestId('authorized')).toHaveTextContent('null')

    stateChangeHandler?.('SIGNED_IN', { user: { id: 'u1', email: 'new@example.ca' } })
    await waitFor(() => expect(screen.getByTestId('authorized')).toHaveTextContent('true'))
    expect(rpc).toHaveBeenCalledWith('current_user_is_workspace_member')

    stateChangeHandler?.('SIGNED_OUT', null)
    await waitFor(() => expect(screen.getByTestId('authorized')).toHaveTextContent('null'))
  })

  it('admits @dutiva.ca staff without waiting on the membership RPC', async () => {
    const rpc = vi.fn()
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { id: 'u1', email: 'ops@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc,
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { authorized } = useAuth()
      return <span data-testid="authorized">{String(authorized)}</span>
    }

    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('authorized')).toHaveTextContent('true'))
    expect(rpc).not.toHaveBeenCalled()
  })

  it('fails closed to unauthorized when the membership RPC errors', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({ data: { session: { user: { id: 'u1', email: 'x@example.ca' } } } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: 'boom' } })),
      },
    }))
    vi.resetModules()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { authorized } = useAuth()
      return <span data-testid="authorized">{String(authorized)}</span>
    }

    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('authorized')).toHaveTextContent('false'))
    errorSpy.mockRestore()
  })

  it('allows the allowed account through to signInWithOtp, case-insensitively', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          signInWithOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { status, signInWithEmail } = useAuth()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => void signInWithEmail('Martin.Constantineau@Dutiva.ca')}>
            send
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'send' }))
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'Martin.Constantineau@Dutiva.ca' }),
    )
    expect(await screen.findByTestId('status')).toHaveTextContent('sent-link')
  })

  it('sends a trimmed full_name as user metadata when a name is passed (sign-up)', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          signInWithOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { signInWithEmail } = useAuth()
      return (
        <button
          onClick={() =>
            void signInWithEmail('martin.constantineau@dutiva.ca', { name: '  Jordan Mensah  ' })
          }
        >
          send
        </button>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'send' }))
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'martin.constantineau@dutiva.ca',
        options: expect.objectContaining({ data: { full_name: 'Jordan Mensah' } }),
      }),
    )
  })

  it('omits user metadata when signing in without a name', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          signInWithOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { signInWithEmail } = useAuth()
      return (
        <button onClick={() => void signInWithEmail('martin.constantineau@dutiva.ca')}>send</button>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'send' }))
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'martin.constantineau@dutiva.ca',
        options: expect.not.objectContaining({ data: expect.anything() }),
      }),
    )
  })

  it('returns a localized generic error (not the raw provider text) on a Supabase failure, staying signed-out', async () => {
    localStorage.clear()
    localStorage.setItem('dutiva-lang', 'fr')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const providerMessage = 'Email rate limit exceeded'
    const signInWithOtp = vi.fn().mockResolvedValue({ error: { message: providerMessage } })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          signInWithOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')
    const { authMessages } = await import('@/i18n/messages/auth')

    function Probe() {
      const { status, signInWithEmail } = useAuth()
      const [error, setError] = useState<string>()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button
            onClick={() => void signInWithEmail('martin.constantineau@dutiva.ca').then(setError)}
          >
            send
          </button>
          {error && <span data-testid="error">{error}</span>}
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'send' }))
    const errorEl = await screen.findByTestId('error')
    /* French generic message, not Supabase's English error.message. */
    expect(errorEl).toHaveTextContent(authMessages.auth_generic_error.fr)
    expect(errorEl).not.toHaveTextContent(providerMessage)
    expect(screen.getByTestId('status')).toHaveTextContent('signed-out')

    errorSpy.mockRestore()
    localStorage.clear()
  })

  /**
   * The emailed 6-digit code is the one sign-in route a mailbox security
   * scanner cannot spend on the recipient's behalf (it has to be typed), so it
   * has to work for both cases the one sign-in form produces: an existing
   * account and a first-time signup, whose codes carry different OTP types.
   */
  it('verifies a sign-in code, falling back to the signup OTP type', async () => {
    const verifyOtp = vi
      .fn()
      /* Existing-account type first; a mismatch is a lookup miss, not a spend. */
      .mockResolvedValueOnce({ error: { message: 'Token not found' } })
      .mockResolvedValueOnce({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          verifyOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { verifyEmailCode } = useAuth()
      const [result, setResult] = useState('pending')
      return (
        <div>
          <span data-testid="result">{result}</span>
          <button
            onClick={() =>
              /* Spaces as a mail client renders them — stripped before sending. */
              void verifyEmailCode('owner@example.ca', '123 456').then((e) => setResult(e ?? 'ok'))
            }
          >
            verify
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'verify' }))

    expect(await screen.findByTestId('result')).toHaveTextContent('ok')
    expect(verifyOtp).toHaveBeenNthCalledWith(1, {
      email: 'owner@example.ca',
      token: '123456',
      type: 'email',
    })
    expect(verifyOtp).toHaveBeenNthCalledWith(2, {
      email: 'owner@example.ca',
      token: '123456',
      type: 'signup',
    })
  })

  it('returns a localized message when the code is rejected outright', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyOtp = vi.fn().mockResolvedValue({ error: { message: 'Token has expired' } })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
          verifyOtp,
        },
      },
    }))
    vi.resetModules()
    const { AuthProvider } = await import('./AuthProvider')
    const { useAuth } = await import('./authContext')
    const { LangProvider } = await import('@/i18n/LangProvider')

    function Probe() {
      const { verifyEmailCode } = useAuth()
      const [result, setResult] = useState('pending')
      return (
        <div>
          <span data-testid="result">{result}</span>
          <button
            onClick={() =>
              void verifyEmailCode('o@e.ca', '000000').then((e) => setResult(e ?? 'ok'))
            }
          >
            verify
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <LangProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </LangProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'verify' }))

    /* Never Supabase's raw English message — it would leak into the French UI. */
    expect(await screen.findByTestId('result')).toHaveTextContent(/isn’t valid or has expired/)
    expect(verifyOtp).toHaveBeenCalledTimes(2)
    errorSpy.mockRestore()
  })
})
