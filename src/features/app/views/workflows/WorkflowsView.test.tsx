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
  it('lists calculators and process guides and links each to its runner', () => {
    renderWorkflows()
    expect(screen.getByText(/Calculators ·/)).toBeInTheDocument()
    expect(screen.getByText(/Process guides ·/)).toBeInTheDocument()
    for (const flow of flows) {
      expect(
        screen.getByRole('link', { name: new RegExp(flow.summary.en.slice(0, 40), 's') }),
        flow.slug,
      ).toHaveAttribute('href', `/app/workflows/${flow.slug}`)
    }
  })

  it('routes the leave catalogue tile to the flow, not the Advisor', async () => {
    const user = userEvent.setup()
    renderWorkflows()
    const tile = screen.getByRole('button', { name: /^Leave/ })
    await user.click(tile)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/workflows/leave-of-absence')
  })

  it('routes the accommodation catalogue tile to the flow, not the Advisor', async () => {
    const user = userEvent.setup()
    renderWorkflows()
    /* The catalogue tile carries the 'Guided' badge; the in-flight
       Accommodation row is a separate button. */
    const tile = screen.getByRole('button', { name: /Accommodation\s*Guided/ })
    await user.click(tile)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/workflows/duty-to-accommodate')
  })

  it('renders the header, in-flight rows, flagship map, and catalog', () => {
    renderWorkflows()

    expect(
      screen.getByText(
        'Three ways to move work: Ask the Advisor for judgment calls, run a guided process or calculator here, or create the letter from Templates.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/In flight/)).toBeInTheDocument()

    /* In-flight rows: person · province lines, progress + meta labels. */
    expect(screen.getByText('Jordan Mensah · Ontario')).toBeInTheDocument()
    expect(screen.getByText('Amara Okafor · Ontario')).toBeInTheDocument()
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

    /* The whole in-flight row is the button; 'Continue' is its styled affordance. */
    await user.click(screen.getByRole('button', { name: /Jordan Mensah · Ontario/ }))
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/cases/case1')
  })

  it('continues the hiring workflow into its Advisor thread (chatId state)', async () => {
    const user = userEvent.setup()
    renderWorkflows()

    await user.click(screen.getByRole('button', { name: /Senior Analyst · Ontario/ }))
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
          'Trois façons d’avancer : demandez au Conseiller pour le jugement, lancez un processus guidé ou un calculateur ici, ou créez la lettre à partir des Modèles.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Licenciement — Jordan Mensah')).toBeInTheDocument()
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

  it('shows guided processes, the start catalog, and honest copy — hiding only sample data', async () => {
    mockProductionWorkspace({ tables: {} })
    vi.resetModules()
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WorkflowsView: View } = await import('./WorkflowsView')

    renderFresh(<View />, { route: '/app/workflows', path: '/app/workflows' })

    /* Anchor on the production-only copy first: the workspace-resolution
       pass swaps the demo fixtures for the production view async, and under
       suite load the swap can outlast a single findByText budget. */
    expect(await screen.findByText(/sample data in Demo mode/)).toBeInTheDocument()

    expect(screen.getByText(/Calculators ·/)).toBeInTheDocument()
    expect(screen.getByText(/Process guides ·/)).toBeInTheDocument()
    /* The catalog is a real entry-point grid (guided-flow routes + seeded
       Advisor conversations), not Northgate sample data — it ships in
       production. Only the in-flight list / termination map stay demo-only. */
    expect(screen.getByText('Start a workflow')).toBeInTheDocument()
    expect(screen.getByText('Policy update')).toBeInTheDocument()
    expect(screen.queryByText(/In flight/)).not.toBeInTheDocument()
    expect(screen.queryByText('Termination — Jordan Mensah')).not.toBeInTheDocument()
  })

  it('routes a production catalog tile to its real surface', async () => {
    mockProductionWorkspace({ tables: {} })
    vi.resetModules()
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WorkflowsView: View } = await import('./WorkflowsView')
    const { default: user } = await import('@testing-library/user-event')

    renderFresh(
      <>
        <View />
        <LocationProbe />
      </>,
      /* '*' keeps the probe mounted after the tile navigates away from
         /app/workflows — an exact path would unmount it mid-assertion. */
      { route: '/app/workflows', path: '*' },
    )

    /* Wait for the production pass to settle first — grabbing the tile while
       the demo tree is still mounted leaves a detached node the click can't
       reach (demo → production swap remounts the grid). */
    await screen.findByText(/sample data in Demo mode/)

    /* Leave carries a flowSlug — the real guided-flow runner. */
    await user.setup().click(screen.getByRole('button', { name: /^Leave/ }))
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/workflows/leave-of-absence')
  })
})
