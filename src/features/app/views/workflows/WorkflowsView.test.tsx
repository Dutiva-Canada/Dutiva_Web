import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { mockProductionWorkspace } from '@/test/productionWorkspace'
import { flows } from '@/features/app/flows/data'
import { WorkflowsView } from './WorkflowsView'

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </>
  )
}

function renderWorkflows() {
  return renderApp(
    <>
      <WorkflowsView />
      <LocationProbe />
    </>,
    { route: '/app/workflows' },
  )
}

describe('WorkflowsView', () => {
  it('lists every guided flow and links each to its runner', () => {
    renderWorkflows()
    /* Derived, not hardcoded: adding a flow is not a reason to edit this. */
    expect(screen.getByText(`Guided processes · ${flows.length}`)).toBeInTheDocument()
    for (const flow of flows) {
      expect(
        screen.getByRole('link', { name: new RegExp(flow.summary.en.slice(0, 40), 's') }),
        flow.slug,
      ).toHaveAttribute('href', `/app/workflows/${flow.slug}`)
    }
  })

  it('routes the accommodation catalogue tile to the flow, not the Advisor', async () => {
    const user = userEvent.setup()
    renderWorkflows()
    /* The tile is a button; its subtitle is the process name. */
    const tile = screen.getByRole('button', { name: /Accommodation/ })
    await user.click(tile)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/workflows/duty-to-accommodate')
  })

  it('renders the header, in-flight rows, flagship map, and catalog', () => {
    renderWorkflows()

    expect(
      screen.getByText(
        'End-to-end HR outcomes — Advisor coordinates the steps, documents, records, and compliance impact.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/In flight/)).toBeInTheDocument()

    /* In-flight rows: person · province lines, progress + meta labels. */
    expect(screen.getByText('Jordan Mensah · Ontario')).toBeInTheDocument()
    expect(screen.getByText('Amara Okafor · British Columbia')).toBeInTheDocument()
    expect(screen.getByText('Step 4/9')).toBeInTheDocument()
    expect(screen.getByText('2 of 4 docs')).toBeInTheDocument()
    expect(screen.getByText('+2 score on close')).toBeInTheDocument()
    /* Risk chips: High (risk) on the termination row; wf2's due-date chip
       doubles as its meta label ('Due Jul 14' appears twice, per prototype). */
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getAllByText('Due Jul 14')).toHaveLength(2)

    /* Flagship termination map starts expanded (prototype wfMapOpen: true). */
    expect(screen.getByText('Termination — Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Intake')).toBeInTheDocument()
    expect(screen.getByText('2 of 4 drafted')).toBeInTheDocument()
    expect(screen.getByText('Waiting')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument()

    /* Catalog tiles ('Hiring'/'Termination' also name in-flight rows). */
    expect(screen.getAllByText('Hiring').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Policy update')).toBeInTheDocument()
    /* Two now: the guided-flow card and the catalogue tile whose subtitle
       names the same process — the tile routes to the flow rather than to an
       Advisor conversation about it. */
    expect(screen.getAllByText('Duty to accommodate')).toHaveLength(2)

    expect(
      screen.getByText(
        'Advisor provides compliance-oriented HR guidance — not legal advice. Verify important decisions.',
      ),
    ).toBeInTheDocument()
  })

  it('collapses and re-expands the termination map', async () => {
    const user = userEvent.setup()
    renderWorkflows()

    await user.click(screen.getByRole('button', { name: 'Collapse' }))
    expect(screen.queryByText('Intake')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue this workflow' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View all 9 stages' }))
    expect(screen.getByText('Intake')).toBeInTheDocument()
    expect(screen.getByText('Audit trail')).toBeInTheDocument()
  })

  it('continues the termination workflow into its case file', async () => {
    const user = userEvent.setup()
    renderWorkflows()

    const continueButtons = screen.getAllByRole('button', { name: 'Continue' })
    expect(continueButtons).toHaveLength(3)
    await user.click(continueButtons[0]!)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/cases/case1')
  })

  it('continues the hiring workflow into its Advisor thread (chatId state)', async () => {
    const user = userEvent.setup()
    renderWorkflows()

    const continueButtons = screen.getAllByRole('button', { name: 'Continue' })
    await user.click(continueButtons[2]!)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/advisor')
    expect(screen.getByTestId('state')).toHaveTextContent('{"chatId":"c2"}')
  })

  it('starts a catalog workflow in the Advisor', async () => {
    const user = userEvent.setup()
    renderWorkflows()

    await user.click(screen.getByRole('button', { name: 'Investigation Intake → findings' }))
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/advisor')
  })

  it('renders the prototype French strings when the language is FR', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('dutiva-lang', 'fr')
    try {
      renderWorkflows()
      expect(
        screen.getByText(
          'Des résultats RH de bout en bout — le Conseiller coordonne les étapes, les documents, les dossiers et l’impact sur la conformité.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Cessation d’emploi — Jordan Mensah')).toBeInTheDocument()
      expect(screen.getByText('Étape 4/9')).toBeInTheDocument()
      /* FR '2 doc. sur 4' doubles as wf1's docs label and the map's partial chip. */
      expect(screen.getAllByText('2 doc. sur 4').length).toBeGreaterThanOrEqual(2)
      await user.click(screen.getByRole('button', { name: 'Réduire' }))
      expect(screen.getByRole('button', { name: 'Voir les 9 étapes' })).toBeInTheDocument()
    } finally {
      window.localStorage.removeItem('dutiva-lang')
    }
  })
})

describe('WorkflowsView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('shows guided processes and the prod intro, hiding demo fixtures', async () => {
    mockProductionWorkspace({ tables: {} })
    vi.resetModules()
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WorkflowsView: View } = await import('./WorkflowsView')

    renderFresh(<View />, { route: '/app/workflows', path: '/app/workflows' })

    expect(await screen.findByText(`Guided processes · ${flows.length}`)).toBeInTheDocument()
    expect(await screen.findByText(/Northgate demo fixtures/)).toBeInTheDocument()
    expect(screen.queryByText(/In flight/)).not.toBeInTheDocument()
    expect(screen.queryByText('Termination — Jordan Mensah')).not.toBeInTheDocument()
    expect(screen.queryByText('Start a workflow')).not.toBeInTheDocument()
  })
})
