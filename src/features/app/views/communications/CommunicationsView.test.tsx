import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { ADVISOR_STREAM_TICK_MS, ADVISOR_THINK_MS } from '@/features/app/advisor/useAdvisorEngine'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { mockProductionWorkspace } from '@/test/productionWorkspace'
import { CommunicationsView } from './CommunicationsView'

function renderView() {
  return renderApp(
    <>
      <CommunicationsView />
      <AdvisorRail />
    </>,
    { route: '/app/communications' },
  )
}

describe('CommunicationsView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the pipeline in display order with review dimensions and statuses', () => {
    renderView()

    expect(
      screen.getByText(
        'Advisor reviews every announcement for jurisdiction and tone before it goes out.',
      ),
    ).toBeInTheDocument()

    /* Fixture content (order cm1, cm5, cm6, cm4, cm2, cm3). */
    expect(screen.getByText('Return-to-office cadence — company-wide')).toBeInTheDocument()
    expect(screen.getByText('Disciplinary meeting invite — Devon Clarke')).toBeInTheDocument()
    expect(screen.getByText('Statutory holiday notice — August')).toBeInTheDocument()

    /* Statuses: four drafts, one scheduled, one sent. */
    expect(screen.getAllByText('Draft')).toHaveLength(4)
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()

    /* Advisor review dimensions (cm1: tone ok, legal + policy need review). */
    expect(screen.getAllByText('Tone · OK').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Legal · Review').length).toBeGreaterThan(0)

    /* Linked entity + bilingual meta. */
    expect(screen.getByText('Linked: Remote Work Policy (refresh in draft)')).toBeInTheDocument()
    expect(screen.getByText(/EN \+ FR ready/)).toBeInTheDocument()
  })

  it('sends a non-sensitive communication directly and flips it to Sent · Just now', () => {
    renderView()

    /* cm2 (Benefits enrolment reminder) is Scheduled and not sensitive. */
    fireEvent.click(screen.getByRole('button', { name: 'Send now' }))

    expect(screen.queryByRole('button', { name: 'Send now' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Sent')).toHaveLength(2)
    expect(screen.getByText(/Just now/)).toBeInTheDocument()
  })

  it('gates a sensitive send behind the review rail, then marks it sent on confirm', () => {
    vi.useFakeTimers()
    renderView()

    /* First "Send" belongs to cm1 (Return-to-office cadence), a sensitive draft. */
    act(() => {
      const sendButton = screen.getAllByRole('button', { name: 'Send' })[0]
      expect(sendButton).toBeDefined()
      fireEvent.click(sendButton as HTMLElement)
    })

    const dialog = screen.getByRole('dialog', { name: 'Ask Advisor' })
    expect(dialog).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(ADVISOR_THINK_MS + 120 * ADVISOR_STREAM_TICK_MS)
    })
    expect(
      screen.getByText('This is a sensitive communication — review before sending.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Review before sending')).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mark reviewed & send' }))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText('Sent')).toHaveLength(2)
    expect(screen.getByText(/Just now/)).toBeInTheDocument()
  })

  it('opens the Advisor review rail with the communication context', () => {
    vi.useFakeTimers()
    renderView()

    act(() => {
      const reviewButton = screen.getAllByRole('button', { name: 'Review with Advisor' })[0]
      expect(reviewButton).toBeDefined()
      fireEvent.click(reviewButton as HTMLElement)
    })

    const dialog = screen.getByRole('dialog', { name: 'Ask Advisor' })
    expect(dialog).toBeInTheDocument()
    /* Rail header title + context chips (province · audience). */
    expect(screen.getAllByText('Return-to-office cadence — company-wide')).toHaveLength(2)
    /* The province and audience surface as rail context chips. */
    expect(screen.getByText('Multi-province')).toBeInTheDocument()
    expect(screen.getByText('All employees · 94 people')).toBeInTheDocument()
  })
})

describe('CommunicationsView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const ROW = {
    id: 'comm-1',
    title: 'Restructuring announcement',
    audience: 'All staff',
    channel: 'email',
    status: 'scheduled',
    scheduled_for: '2026-09-01',
    sent_on: null,
    template_tid: 'T36',
    note: 'Managers briefed first.',
  }

  function mockComms(initial: Record<string, unknown>[]) {
    const rows = [...initial]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `comm-${rows.length + 1}`,
            title: row.title,
            audience: row.audience ?? null,
            channel: row.channel,
            status: row.status,
            scheduled_for: row.scheduled_for ?? null,
            sent_on: null,
            template_tid: row.template_tid ?? null,
            note: row.note ?? null,
          }
          rows.unshift(created)
          return Promise.resolve({ data: created, error: null })
        },
      }),
    }))
    const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
    mockProductionWorkspace({
      tables: {
        hr_communications: () => ({
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: rows, error: null }) }),
          }),
          insert,
          update,
        }),
      },
    })
    vi.resetModules()
    return { insert, update }
  }

  it('renders the real log instead of the fixtures, and links the Ring 3 template', async () => {
    mockComms([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CommunicationsView: View } = await import('./CommunicationsView')

    renderFresh(<View />, { route: '/app/communications', path: '/app/communications' })

    expect(await screen.findByText('Restructuring announcement')).toBeInTheDocument()
    expect(screen.getByText('1 message')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Team restructuring announcement/ })).toHaveAttribute(
      'href',
      '/app/documents/generate/T36',
    )
  })

  /* The reason this module was rewritten rather than ported: the demo scored
     every message on tone/legal/clarity/policy, and nothing in the product
     performs that analysis. A green "Legal ✓" is a claim, not decoration. */
  it('shows no Advisor review dimensions', async () => {
    mockComms([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CommunicationsView: View } = await import('./CommunicationsView')

    renderFresh(<View />, { route: '/app/communications', path: '/app/communications' })
    await screen.findByText('Restructuring announcement')

    for (const dim of [/^Tone ·/, /^Legal ·/, /^Clarity ·/, /^Policy ·/]) {
      expect(screen.queryByText(dim)).not.toBeInTheDocument()
    }
  })

  /* And it never claims to deliver anything. */
  it('marks a message sent as a record, saying plainly that Dutiva does not send', async () => {
    const { update } = mockComms([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CommunicationsView: View } = await import('./CommunicationsView')

    renderFresh(<View />, { route: '/app/communications', path: '/app/communications' })
    await screen.findByText('Restructuring announcement')

    expect(
      screen.getByText(/Dutiva does not deliver messages — marking one sent logs that you did\./),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark as sent' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', sent_on: expect.any(String) }),
    )
    await waitFor(() => expect(screen.getByText('Sent')).toBeInTheDocument())
  })

  it('logs a new message', async () => {
    const { insert } = mockComms([])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CommunicationsView: View } = await import('./CommunicationsView')

    renderFresh(<View />, { route: '/app/communications', path: '/app/communications' })

    expect(await screen.findByText('No messages logged yet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Log a message' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Office closure' } })
    fireEvent.change(screen.getByLabelText('Channel'), { target: { value: 'intranet' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(insert).toHaveBeenCalled())
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        title: 'Office closure',
        channel: 'intranet',
        status: 'draft',
      }),
    )
    await waitFor(() => expect(screen.getByText('Office closure')).toBeInTheDocument())
  })

  it('shows the disabled Advisor review rail with honest copy', async () => {
    mockComms([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CommunicationsView: View } = await import('./CommunicationsView')

    renderFresh(<View />, { route: '/app/communications', path: '/app/communications' })
    await screen.findByText('Restructuring announcement')

    expect(screen.getByText('Advisor review')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Tone, legal, clarity, and policy checks appear when Advisor has reviewed a draft\./,
      ),
    ).toBeInTheDocument()
  })
})
