import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { AuthMenuButton } from './AuthMenuButton'

/**
 * Signed-in/loading states are covered by AuthProvider.test.tsx (session
 * transitions) and GuidanceSourcesPanel.test.tsx (sign-in submission); this
 * covers the button's own popover open/close and its signed-out content.
 */
describe('AuthMenuButton', () => {
  it('opens a popover with the sign-in form on click, closed by default', async () => {
    const user = userEvent.setup()
    renderApp(<AuthMenuButton />)

    expect(screen.queryByRole('dialog', { name: 'Account' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Account' }))
    const dialog = screen.getByRole('dialog', { name: 'Account' })
    expect(dialog).toBeInTheDocument()
    expect(
      screen.getByText('Sign in for live Advisor answers and legal sources.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send sign-in link' })).toBeInTheDocument()
  })

  it('closes when clicking the backdrop', async () => {
    const user = userEvent.setup()
    renderApp(<AuthMenuButton />)

    await user.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByRole('dialog', { name: 'Account' })).toBeInTheDocument()

    /* Backdrop is deliberately unlabelled (same pattern as Topbar's notifications popover). */
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0')
    expect(backdrop).not.toBeNull()
    await user.click(backdrop as Element)
    expect(screen.queryByRole('dialog', { name: 'Account' })).not.toBeInTheDocument()
  })
})
