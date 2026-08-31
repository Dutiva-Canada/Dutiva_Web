import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'

const isCurrentUserAdmin = vi.hoisted(() => vi.fn())
const adminGetTicket = vi.hoisted(() => vi.fn())
const runAgentAction = vi.hoisted(() => vi.fn())
const adminGetScheduledCall = vi.hoisted(() => vi.fn().mockResolvedValue(null))
vi.mock('@/features/support/supportAdminApi', () => ({
  isCurrentUserAdmin,
  adminGetTicket,
  runAgentAction,
  adminGetScheduledCall,
}))

import { SupportAdminTicket } from './SupportAdminTicket'

function renderTicket(id = 't1') {
  render(
    <LangProvider>
      <MemoryRouter initialEntries={[`/app/support/admin/${id}`]}>
        <Routes>
          <Route path="/app/support/admin/:ticketId" element={<SupportAdminTicket />} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

const ticket = {
  id: 't1',
  publicReference: 'DUT-2026-000009',
  subject: 'Security concern',
  requesterEmail: 'user@acme.test',
  requesterPlan: null,
  category: 'security',
  status: 'new' as const,
  priority: 'high' as const,
  restricted: true,
  language: 'en' as const,
  createdAt: '2026-07-16T00:00:00Z',
  firstResponseAt: null,
  description: 'Something looks off',
  impact: 'major',
  urgency: 'urgent',
  preferredResponseMethod: 'email',
  messages: [
    {
      id: 'm1',
      authorRole: 'customer' as const,
      body: 'Found an issue',
      isInternal: false,
      createdAt: '2026-07-16T00:00:00Z',
    },
    {
      id: 'm2',
      authorRole: 'agent' as const,
      body: 'Only we can see this',
      isInternal: true,
      createdAt: '2026-07-16T00:05:00Z',
    },
  ],
}

beforeEach(() => {
  isCurrentUserAdmin.mockReset()
  adminGetTicket.mockReset()
  runAgentAction.mockReset()
  adminGetScheduledCall.mockReset()
  isCurrentUserAdmin.mockResolvedValue(true)
  adminGetTicket.mockResolvedValue(ticket)
  runAgentAction.mockResolvedValue(undefined)
  adminGetScheduledCall.mockResolvedValue(null)
})

describe('SupportAdminTicket', () => {
  it('denies non-admins', async () => {
    isCurrentUserAdmin.mockResolvedValue(false)
    renderTicket()
    expect(await screen.findByText(/limited to support operators/i)).toBeInTheDocument()
    expect(adminGetTicket).not.toHaveBeenCalled()
  })

  it('shows the thread including the internal note and sends an agent reply', async () => {
    const user = userEvent.setup()
    renderTicket()

    expect(await screen.findByText('Found an issue')).toBeInTheDocument()
    expect(screen.getByText('Only we can see this')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/reply to the customer/i), 'We are investigating')
    await user.click(screen.getByRole('button', { name: /send reply/i }))

    expect(runAgentAction).toHaveBeenCalledWith('t1', {
      action: 'reply',
      body: 'We are investigating',
    })
  })

  it('changes status via the operator control', async () => {
    const user = userEvent.setup()
    renderTicket()
    await screen.findByText('Found an issue')

    await user.selectOptions(screen.getByLabelText(/set status/i), 'in_progress')
    expect(runAgentAction).toHaveBeenCalledWith('t1', { action: 'status', status: 'in_progress' })
  })

  it('proposes a call time and reports it back to the customer', async () => {
    const user = userEvent.setup()
    renderTicket()
    await screen.findByText('Found an issue')
    await screen.findByText(/propose call times/i)

    await user.type(screen.getByLabelText(/time option 1/i), '2027-01-15T14:30')
    await user.click(screen.getByRole('button', { name: /send proposed times/i }))

    expect(runAgentAction).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        action: 'propose_call',
        duration_minutes: 30,
        slots: [
          {
            start: new Date('2027-01-15T14:30').toISOString(),
            end: new Date(new Date('2027-01-15T14:30').getTime() + 30 * 60000).toISOString(),
          },
        ],
      }),
    )
  })

  it('shows the confirmed time and a calendar-sync note when there is no Meet link', async () => {
    adminGetScheduledCall.mockResolvedValue({
      id: 'call1',
      proposedSlots: [{ start: '2027-01-15T14:30:00.000Z', end: '2027-01-15T15:00:00.000Z' }],
      durationMinutes: 30,
      status: 'confirmed',
      confirmedStart: '2027-01-15T14:30:00.000Z',
      confirmedEnd: '2027-01-15T15:00:00.000Z',
      meetLink: null,
    })
    renderTicket()
    expect(await screen.findByText(/confirmed/i)).toBeInTheDocument()
    expect(screen.getByText(/add this to your calendar by hand/i)).toBeInTheDocument()
  })
})
