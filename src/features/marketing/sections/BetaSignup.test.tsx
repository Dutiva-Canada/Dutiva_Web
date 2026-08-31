import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const createBetaSignup = vi.hoisted(() => vi.fn())
const getBetaCohortStatus = vi.hoisted(() => vi.fn().mockResolvedValue({ taken: 3, limit: 15 }))
vi.mock('../betaSignupApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../betaSignupApi')>()
  return { ...actual, createBetaSignup }
})
vi.mock('../betaCohortApi', () => ({ getBetaCohortStatus }))

import { BetaSignup } from './BetaSignup'
import { BetaSignupError } from '../betaSignupApi'

const render = () => renderApp(<BetaSignup />, { route: '/', path: '/' })

/**
 * Each case resets the mock in its own body rather than from a `beforeEach`.
 * With the reset in a hook, Vitest attributes the (handled) rejection the
 * error-path cases stage to the test itself and fails it; resetting inline
 * gives the same isolation without that false positive.
 */
describe('BetaSignup', () => {
  it('rejects an invalid email before calling the server', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    await user.type(screen.getByLabelText('Work email'), 'not-an-email')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(screen.getByText('Please enter a valid work email address.')).toBeInTheDocument()
    expect(createBetaSignup).not.toHaveBeenCalled()
  })

  it('requires express consent before calling the server (CASL)', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(
      screen.getByText('Please confirm you agree to receive product updates.'),
    ).toBeInTheDocument()
    expect(createBetaSignup).not.toHaveBeenCalled()
  })

  it('sends the signup to the server and confirms', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    createBetaSignup.mockResolvedValue({ waitlisted: false })
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.type(screen.getByLabelText('Company (optional)'), 'Example Inc.')
    await user.selectOptions(screen.getByLabelText('Province / jurisdiction (optional)'), 'qc')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(createBetaSignup).toHaveBeenCalledOnce()
    expect(createBetaSignup).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.ca',
        company: 'Example Inc.',
        province: 'qc',
        language: 'en',
        consent: true,
      }),
    )
    expect(await screen.findByText("You're on the list.")).toBeInTheDocument()
    expect(screen.getByText('4 of 15 spots currently taken')).toBeInTheDocument()
  })

  it('confirms a waiting-list signup as waiting, not as admitted', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    createBetaSignup.mockResolvedValue({ waitlisted: true })
    getBetaCohortStatus.mockResolvedValue({ taken: 15, limit: 15 })
    render()
    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(await screen.findByText("You're on the waiting list.")).toBeInTheDocument()
    /* The admitted-cohort promise ("we'll email your beta access") must not
       show — a full cohort means there is no access to email yet. */
    expect(screen.queryByText("You're on the list.")).toBeNull()
    expect(screen.queryByText(/beta access/)).toBeNull()
  })

  it('shows the live spot counter and bumps it after an admitted signup', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    createBetaSignup.mockResolvedValue({ waitlisted: false })
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    expect(await screen.findByText('3 of 15 spots currently taken')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(await screen.findByText("You're on the list.")).toBeInTheDocument()
    expect(screen.getByText('4 of 15 spots currently taken')).toBeInTheDocument()
  })

  it('states waitlist capacity next to the form', () => {
    createBetaSignup.mockReset()
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    expect(screen.getByText(/waitlist has 15 free seats/)).toBeInTheDocument()
  })

  it('surfaces the rate-limit message and stays on the form', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    createBetaSignup.mockRejectedValue(new BetaSignupError('rate_limited'))
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(await screen.findByText(/Too many attempts in a short time/)).toBeInTheDocument()
    expect(screen.getByLabelText('Work email')).toBeInTheDocument()
  })

  it('reports a failed signup instead of claiming success', async () => {
    const user = userEvent.setup()
    createBetaSignup.mockReset()
    createBetaSignup.mockRejectedValue(new BetaSignupError('error'))
    getBetaCohortStatus.mockResolvedValue({ taken: 3, limit: 15 })
    render()
    await user.type(screen.getByLabelText('Work email'), 'owner@example.ca')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))

    expect(await screen.findByText(/Could not record your signup/)).toBeInTheDocument()
    expect(screen.queryByText("You're on the list.")).toBeNull()
  })
})
