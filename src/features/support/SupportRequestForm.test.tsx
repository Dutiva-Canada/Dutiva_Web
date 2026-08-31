import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '@/i18n/LangProvider'

const createSupportTicket = vi.hoisted(() => vi.fn())
vi.mock('./supportApi', () => ({ createSupportTicket }))

vi.mock('@/features/app/workspaceMode/workspaceModeContext', () => ({
  useWorkspaceMode: () => ({
    organizationId: null,
    mode: 'demo',
    isAdmin: false,
    identity: {
      companyName: 'Test',
      user: { name: 'Test', initials: 'T', role: { en: '', fr: '' }, email: '' },
    },
    setMode: vi.fn(),
  }),
}))

import { SupportRequestForm } from './SupportRequestForm'

function renderForm() {
  render(
    <LangProvider>
      <SupportRequestForm />
    </LangProvider>,
  )
}

beforeEach(() => {
  createSupportTicket.mockReset()
})

describe('SupportRequestForm', () => {
  it('blocks submission and shows inline errors when required fields are empty', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /send request/i }))

    expect(await screen.findByText(/please add a subject/i)).toBeInTheDocument()
    expect(screen.getByText(/please describe how we can help/i)).toBeInTheDocument()
    expect(screen.getByText(/please confirm to continue/i)).toBeInTheDocument()
    expect(createSupportTicket).not.toHaveBeenCalled()
  })

  it('reveals the security warning for the security category', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.selectOptions(screen.getByLabelText(/what is this about/i), 'security')
    expect(screen.getByText(/no bug bounty/i)).toBeInTheDocument()
  })

  it('reveals the account-access question for that category', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.selectOptions(screen.getByLabelText(/what is this about/i), 'account_access')
    expect(screen.getAllByText(/can you still sign in/i).length).toBeGreaterThan(0)
  })

  it('submits a valid request and shows the ticket reference', async () => {
    createSupportTicket.mockResolvedValue({
      id: 't1',
      publicReference: 'DUT-2026-000042',
      status: 'new',
      priority: 'standard',
    })
    const user = userEvent.setup()
    renderForm()

    await user.selectOptions(screen.getByLabelText(/what is this about/i), 'technical')
    await user.type(screen.getByLabelText(/^subject$/i), 'Cannot generate a document')
    await user.type(screen.getByLabelText(/how can we help/i), 'The generate button does nothing.')
    await user.click(screen.getByLabelText(/i understand dutiva will use this request/i))
    await user.click(screen.getByRole('button', { name: /send request/i }))

    expect(await screen.findByText('DUT-2026-000042')).toBeInTheDocument()
    expect(createSupportTicket).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'technical', subject: 'Cannot generate a document' }),
    )
  })
})
