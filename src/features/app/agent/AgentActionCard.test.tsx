import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { bi } from '@/i18n/core'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import type { WorkspaceModeContextValue } from '@/features/app/workspaceMode/workspaceModeContext'
import { AgentActionCard } from './AgentActionCard'
import { resetAuditForTest } from './audit'
import { createProposal } from './propose'
import { defineTool, resetToolsForTest } from './registry'
import { bindModuleContext, resetModuleContextsForTest } from './runtime'
import type { AgentTool, AgentToolProposal } from './types'

const workspaceStub: WorkspaceModeContextValue = {
  mode: 'demo',
  isAdmin: false,
  canUseProduction: false,
  identity: {
    companyName: 'Northgate Logistics Inc.',
    user: { name: 'Demo', initials: 'D', role: bi('Owner', 'Propriétaire'), email: 'demo@x.ca' },
  },
  companyName: 'Northgate Logistics Inc.',
  organizationId: null,
  memberRole: null,
  isOrgAdmin: false,
  setMode: async () => {},
  organization: null,
  refreshOrganization: async () => {},
  refreshIdentity: async () => {},
  admissionStatus: 'idle',
  clearAdmissionStatus: () => {},
}

function renderCard(proposal: AgentToolProposal) {
  return render(
    <LangProvider>
      <WorkspaceModeContext value={workspaceStub}>
        <AgentActionCard proposal={proposal} />
      </WorkspaceModeContext>
    </LangProvider>,
  )
}

function registerEcho(run: AgentTool<{ hits: unknown[] }>['run']) {
  defineTool<{ hits: unknown[] }>({
    id: 'test.echo',
    module: 'test',
    moduleLabel: bi('the test module', 'le module de test'),
    tier: 'commit',
    label: bi('Write a test record', 'Écrire un enregistrement de test'),
    description: bi('Echoes params.', 'Renvoie les paramètres.'),
    params: [{ name: 'name', type: 'string', required: true, description: bi('Name', 'Nom') }],
    run,
  })
}

describe('AgentActionCard', () => {
  beforeEach(() => {
    resetToolsForTest()
    resetModuleContextsForTest()
    resetAuditForTest()
  })

  it('renders the proposal: tool label, summary, params, tier chip', () => {
    registerEcho(() => ({ status: 'completed', message: bi('done', 'fait') }))
    renderCard(
      createProposal('test.echo', bi('Add a record named Amara', 'Ajouter une fiche Amara'), {
        name: 'Amara',
      }),
    )
    expect(screen.getByText('Proposed action')).toBeTruthy()
    expect(screen.getByText('Write a test record')).toBeTruthy()
    expect(screen.getByText('Add a record named Amara')).toBeTruthy()
    expect(screen.getByText('Amara')).toBeTruthy()
    expect(screen.getByText('Writes to workspace')).toBeTruthy()
  })

  it('executes on Confirm and shows the outcome', async () => {
    const run = vi.fn((ctx: { hits: unknown[] }, params: Record<string, unknown>) => {
      ctx.hits.push(params)
      return { status: 'completed' as const, message: bi('Record written.', 'Fiche écrite.') }
    })
    registerEcho(run)
    bindModuleContext('test', { hits: [] })
    renderCard(createProposal('test.echo', bi('Do it', 'Exécuter'), { name: 'Amara' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.getByText('Record written.')).toBeTruthy())
    expect(run).toHaveBeenCalledOnce()
    /* Buttons are gone once the outcome lands. */
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull()
  })

  it('shows the refusal reason when the module is not mounted', async () => {
    registerEcho(() => ({ status: 'completed', message: bi('done', 'fait') }))
    renderCard(createProposal('test.echo', bi('Do it', 'Exécuter'), { name: 'Amara' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.getByText(/Open this workspace first/)).toBeTruthy())
  })

  it('Decline marks the proposal declined — nothing executes', () => {
    const run = vi.fn(() => ({ status: 'completed' as const, message: bi('done', 'fait') }))
    registerEcho(run)
    bindModuleContext('test', { hits: [] })
    renderCard(createProposal('test.echo', bi('Do it', 'Exécuter'), { name: 'Amara' }))
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }))
    expect(screen.getByText(/Declined/)).toBeTruthy()
    expect(run).not.toHaveBeenCalled()
  })

  it('labels a read-tier proposal with Run instead of Confirm', () => {
    defineTool({
      id: 'test.peek',
      module: 'test',
      moduleLabel: bi('the test module', 'le module de test'),
      tier: 'read',
      label: bi('Peek', 'Aperçu'),
      description: bi('Reads.', 'Lit.'),
      params: [],
      run: () => ({ status: 'completed', message: bi('ok', 'ok') }),
    })
    renderCard(createProposal('test.peek', bi('Look at rows', 'Voir les lignes'), {}))
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy()
    expect(screen.getByText('Read')).toBeTruthy()
  })
})
