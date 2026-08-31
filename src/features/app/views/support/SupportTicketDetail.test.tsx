import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'

const getSupportTicket = vi.hoisted(() => vi.fn())
const replyToSupportTicket = vi.hoisted(() => vi.fn())
const getScheduledCall = vi.hoisted(() => vi.fn().mockResolvedValue(null))
const confirmScheduledCall = vi.hoisted(() => vi.fn())
vi.mock('@/features/support/supportApi', () => ({
  getSupportTicket,
  replyToSupportTicket,
  getScheduledCall,
  confirmScheduledCall,
}))

import { SupportTicketDetail } from './SupportTicketDetail'

function renderDetail(id = 't1') {
  render(
    <LangProvider>
      <MemoryRouter initialEntries={[`/app/support/requests/${id}`]}>
        <Routes>
          <Route path="/app/support/requests/:ticketId" element={<SupportTicketDetail />} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

const baseTicket = {
  id: 't1',
  publicReference: 'DUT-2026-000001',
  subject: 'Cannot generate',
  category: 'technical',
  priority: 'standard',
  createdAt: '2026-07-16T00:00:00Z',
  updatedAt: '2026-07-16T00:00:00Z',
}

beforeEach(() => {
  getSupportTicket.mockReset()
  replyToSupportTicket.mockReset()
  getScheduledCall.mockReset()
  confirmScheduledCall.mockReset()
  getScheduledCall.mockResolvedValue(null)
})

describe('SupportTicketDetail', () => {
  it('renders the thread and appends a customer reply', async () => {
    getSupportTicket.mockResolvedValue({
      ...baseTicket,
      status: 'in_progress',
      messages: [
        {
          id: 'm1',
          authorRole: 'customer',
          body: 'The button does nothing',
          createdAt: '2026-07-16T00:00:00Z',
        },
      ],
    })
    replyToSupportTicket.mockResolvedValue({
      id: 'm2',
      authorRole: 'customer',
      body: 'Still broken',
      createdAt: '2026-07-16T01:00:00Z',
    })
    const user = userEvent.setup()
    renderDetail()

    expect(await screen.findByText('The button does nothing')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/add a reply/i), 'Still broken')
    await user.click(screen.getByRole('button', { name: /send reply/i }))

    expect(await screen.findByText('Still broken')).toBeInTheDocument()
    expect(replyToSupportTicket).toHaveBeenCalledWith('t1', 'Still broken')
  })

  it('hides the reply box for a closed request', async () => {
    getSupportTicket.mockResolvedValue({ ...baseTicket, status: 'closed', messages: [] })
    renderDetail()

    expect(await screen.findByText(/this request is closed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send reply/i })).not.toBeInTheDocument()
  })

  it('shows a not-found message when the ticket is missing', async () => {
    getSupportTicket.mockResolvedValue(null)
    renderDetail()
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })

  it('confirms a proposed call time', async () => {
    getSupportTicket.mockResolvedValue({ ...baseTicket, status: 'scheduled_call', messages: [] })
    // Queued rather than a blanket mockResolvedValue: the panel's post-confirm
    // reload races the test's own assertions, so the second value must already
    // be queued before the click, not assigned afterward.
    getScheduledCall
      .mockResolvedValueOnce({
        id: 'call1',
        proposedSlots: [
          { start: '2027-01-15T14:30:00.000Z', end: '2027-01-15T15:00:00.000Z' },
          { start: '2027-01-16T14:30:00.000Z', end: '2027-01-16T15:00:00.000Z' },
        ],
        durationMinutes: 30,
        status: 'proposed',
        confirmedStart: null,
        confirmedEnd: null,
        meetLink: null,
      })
      .mockResolvedValueOnce({
        id: 'call1',
        proposedSlots: [],
        durationMinutes: 30,
        status: 'confirmed',
        confirmedStart: '2027-01-16T14:30:00.000Z',
        confirmedEnd: '2027-01-16T15:00:00.000Z',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })
    confirmScheduledCall.mockResolvedValue({
      start: '2027-01-16T14:30:00.000Z',
      end: '2027-01-16T15:00:00.000Z',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    })
    const user = userEvent.setup()
    renderDetail()

    expect(await screen.findByText(/scheduled call/i)).toBeInTheDocument()
    const confirmButtons = await screen.findAllByRole('button', { name: /confirm this time/i })
    expect(confirmButtons).toHaveLength(2)

    await user.click(confirmButtons[1] as HTMLElement)
    expect(confirmScheduledCall).toHaveBeenCalledWith('t1', 1)

    expect(await screen.findByText(/your call is confirmed/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /join the call/i })).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij',
    )
  })
})
