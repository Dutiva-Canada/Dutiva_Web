import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthConfirm } from './AuthConfirm'

const authMock = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: authMock } }))

beforeEach(() => {
  authMock.verifyOtp.mockResolvedValue({ error: null })
  authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
  authMock.getSession.mockResolvedValue({ data: { session: null } })
})

afterEach(() => {
  vi.clearAllMocks()
})

function renderAt(search: string) {
  render(
    <LangProvider>
      <MemoryRouter initialEntries={[`/app/auth/confirm${search}`]}>
        <Routes>
          <Route path="/app/auth/confirm" element={<AuthConfirm />} />
          <Route path="/app/home" element={<div>WORKSPACE HOME</div>} />
          <Route path="/app/welcome" element={<div>WELCOME</div>} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

describe('AuthConfirm', () => {
  /**
   * The defence that matters: a mailbox security scanner renders this page and
   * runs its JavaScript (Google Workspace's did, on 2026-08-08, burning the
   * token 33s after send and locking the recipient out). Rendering alone must
   * therefore never spend the one-time token.
   */
  it('does not spend the token on render — only on a real click', async () => {
    renderAt('?token_hash=abc123&type=magiclink')

    expect(await screen.findByRole('button', { name: /confirm sign-in/i })).toBeInTheDocument()
    expect(authMock.verifyOtp).not.toHaveBeenCalled()
    expect(screen.queryByText('WORKSPACE HOME')).not.toBeInTheDocument()
  })

  it('verifies the token_hash and enters the workspace once confirmed', async () => {
    renderAt('?token_hash=abc123&type=magiclink')

    await userEvent.click(await screen.findByRole('button', { name: /confirm sign-in/i }))

    await waitFor(() => expect(screen.getByText('WORKSPACE HOME')).toBeInTheDocument())
    expect(authMock.verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'magiclink' })
  })

  it('shows an error (and a retry link) when verification fails', async () => {
    authMock.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired' } })
    renderAt('?token_hash=stale&type=magiclink')

    await userEvent.click(await screen.findByRole('button', { name: /confirm sign-in/i }))

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument()
    expect(screen.queryByText('WORKSPACE HOME')).not.toBeInTheDocument()
  })

  it('surfaces an error carried in the URL query without calling verifyOtp', async () => {
    renderAt('?error=access_denied&error_description=Email+link+is+invalid+or+has+expired')

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
    expect(authMock.verifyOtp).not.toHaveBeenCalled()
  })

  it('surfaces an error carried in the URL fragment (implicit flow)', async () => {
    renderAt(
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    )

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
    expect(authMock.verifyOtp).not.toHaveBeenCalled()
    expect(authMock.getSession).not.toHaveBeenCalled()
  })

  it('exchanges a PKCE code when present instead of a token_hash', async () => {
    renderAt('?code=pkce-code')

    await waitFor(() => expect(screen.getByText('WORKSPACE HOME')).toBeInTheDocument())
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
    expect(authMock.verifyOtp).not.toHaveBeenCalled()
  })
})
