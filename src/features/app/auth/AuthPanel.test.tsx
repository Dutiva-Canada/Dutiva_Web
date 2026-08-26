import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'
import { AuthPanel } from './AuthPanel'

/**
 * AuthPanel owns a local state machine (mode toggle, form → sent → resend /
 * different-email) that the provider tests don't exercise. We drive it with a
 * fake AuthContext so signInWithEmail can resolve deterministically, wrapped
 * in a router (Link) + LangProvider (copy, usePublicPath). English is the
 * LangProvider default; localStorage is cleared so no prior test leaks `fr`.
 */
function renderPanel(overrides: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    status: 'signed-out',
    session: null,
    authorized: null,
    signInWithEmail: vi.fn(async () => undefined),
    verifyEmailCode: vi.fn(async () => undefined),
    signOut: vi.fn(async () => {}),
    ...overrides,
  }
  render(
    <LangProvider>
      <MemoryRouter>
        <AuthContext.Provider value={value}>
          <AuthPanel />
        </AuthContext.Provider>
      </MemoryRouter>
    </LangProvider>,
  )
  return value
}

describe('AuthPanel', () => {
  beforeEach(() => localStorage.clear())

  it('signs in: submits the email (no name) and shows the sent confirmation', async () => {
    const user = userEvent.setup()
    const { signInWithEmail } = renderPanel()

    await user.type(screen.getByLabelText('Work email'), 'martin@dutiva.ca')
    await user.click(screen.getByRole('button', { name: 'Send sign-in link' }))

    expect(signInWithEmail).toHaveBeenCalledWith('martin@dutiva.ca', undefined)
    expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
    expect(screen.getByText('martin@dutiva.ca')).toBeInTheDocument()
  })

  it('signs up: the toggle reveals a name field and passes the name through', async () => {
    const user = userEvent.setup()
    const { signInWithEmail } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(screen.getByText('Create your account')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Full name'), '  Jordan Mensah  ')
    await user.type(screen.getByLabelText('Work email'), 'martin@dutiva.ca')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signInWithEmail).toHaveBeenCalledWith('martin@dutiva.ca', {
      name: '  Jordan Mensah  ',
    })
    expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
  })

  it('blocks a whitespace-only name on sign-up without calling the provider', async () => {
    const user = userEvent.setup()
    const { signInWithEmail } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    await user.type(screen.getByLabelText('Full name'), '   ')
    await user.type(screen.getByLabelText('Work email'), 'martin@dutiva.ca')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signInWithEmail).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter your full name.')).toBeInTheDocument()
  })

  it('resends the link and lets the user return to the form for a different email', async () => {
    const user = userEvent.setup()
    const { signInWithEmail } = renderPanel()

    await user.type(screen.getByLabelText('Work email'), 'martin@dutiva.ca')
    await user.click(screen.getByRole('button', { name: 'Send sign-in link' }))
    await screen.findByText('Check your inbox')

    await user.click(screen.getByRole('button', { name: 'Resend link' }))
    expect(signInWithEmail).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(screen.getByRole('button', { name: 'Send sign-in link' })).toBeInTheDocument()
  })

  /**
   * The scanner-proof route. A magic link is spent by whatever fetches it
   * first — Google Workspace's scanner runs JavaScript and did exactly that on
   * 2026-08-08 — so the emailed code has to be able to complete a sign-in on
   * its own, against the address the code was sent to.
   */
  it('verifies the emailed code against the address it was sent to', async () => {
    const user = userEvent.setup()
    const { verifyEmailCode } = renderPanel()

    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('button', { name: 'Send sign-in link' }))

    await user.type(await screen.findByLabelText('Sign-in code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(verifyEmailCode).toHaveBeenCalledWith('owner@example.ca', '123456')
  })

  it('surfaces a rejected code without leaving the code step', async () => {
    const user = userEvent.setup()
    renderPanel({ verifyEmailCode: vi.fn(async () => 'That code isn’t valid or has expired.') })

    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('button', { name: 'Send sign-in link' }))

    await user.type(await screen.findByLabelText('Sign-in code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/isn’t valid or has expired/)
    expect(screen.getByLabelText('Sign-in code')).toBeInTheDocument()
  })

  it('shows a not-authorized notice with sign-out for a session on another account', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn(async () => {})
    renderPanel({
      status: 'signed-in',
      session: { user: { email: 'someone@example.com' } } as unknown as Session,
      signOut,
    })

    expect(screen.getByText('someone@example.com')).toBeInTheDocument()
    expect(screen.getByText(/available on that account/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choose a plan' })).toHaveAttribute('href', '/pricing')

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(signOut).toHaveBeenCalled()
  })
})
