import { afterEach, describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { HiringView } from './HiringView'
import { listChain, mockProductionWorkspace, PRODUCTION_ORG_ID } from '@/test/productionWorkspace'

describe('HiringView', () => {
  it('renders the hiring module with candidates tab', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })

    // Check that the main title is rendered (h1)
    expect(screen.getByRole('heading', { name: /Hiring|Recrutement/i })).toBeInTheDocument()
  })

  it('displays candidate list in demo mode', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })

    // Check that candidates are displayed (rendered in both desktop table and mobile cards)
    expect(screen.getAllByText(/Sarah Chen/).length).toBeGreaterThan(0)
  })

  it('shows funnel analytics tab', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })

    // Check that funnel tab is available
    expect(screen.getByRole('tab', { name: /Funnel|Entonnoir/i })).toBeInTheDocument()
  })

  it('shows job postings tab', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })

    // Check that postings tab is available
    expect(screen.getByRole('tab', { name: /Job postings|Offres d'emploi/i })).toBeInTheDocument()
  })
})

/* ── Production mode ─────────────────────────────────────────────────── */

const CANDIDATE_ROW = {
  id: 'c1',
  organization_id: PRODUCTION_ORG_ID,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: null,
  location: 'Toronto',
  resume: 'Senior PM',
  linkedin: null,
  position: 'Product Manager',
  current_role: 'Senior PM',
  years_experience: 8,
  work_authorization: 'authorized',
  compensation_expectations: null,
  status: 'application',
  applied_date: '2026-01-15',
  assigned_to: null,
  knockout_criteria: {
    meets_requirements: true,
    required_qualifications: [],
    missing_requirements: [],
  },
}

const JOB_POSTING_ROW = {
  id: 'jp1',
  organization_id: PRODUCTION_ORG_ID,
  title: 'Senior Product Manager',
  department: 'Product',
  location: 'Toronto',
  type: 'Full-time',
  description: 'Lead the product team.',
  requirements: [],
  knockout_criteria: [],
  work_sample_scenario: '',
  status: 'active',
  posted_date: '2026-01-10',
  closing_date: null,
}

describe('HiringView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  function mockHiringProduction(data: {
    candidates?: Record<string, unknown>[]
    jobPostings?: Record<string, unknown>[]
  }) {
    mockProductionWorkspace({
      tables: {
        hr_candidates: () => ({
          select: () => ({
            eq: () => ({
              order: () => listChain(data.candidates ?? []),
              maybeSingle: () =>
                Promise.resolve({ data: (data.candidates ?? [])[0] ?? null, error: null }),
            }),
          }),
        }),
        hr_job_postings: () => ({
          select: () => ({
            eq: () => ({
              order: () => listChain(data.jobPostings ?? []),
              maybeSingle: () =>
                Promise.resolve({ data: (data.jobPostings ?? [])[0] ?? null, error: null }),
            }),
          }),
        }),
      },
    })
    vi.resetModules()
  }

  it('renders the job posting creation form when Create posting is clicked', async () => {
    mockHiringProduction({
      candidates: [CANDIDATE_ROW],
      jobPostings: [JOB_POSTING_ROW],
    })
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { HiringView: HiringViewFresh } = await import('./HiringView')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    renderAppFresh(<HiringViewFresh />, { route: '/app/hiring?tab=postings', path: '/app/hiring' })

    // Wait for production data to load and the postings tab to render
    const createBtn = await screen.findByRole('button', { name: /Create posting|Créer une offre/i })
    await user.click(createBtn)

    // The form should render with the expected fields
    expect(screen.getByLabelText(/Title|Titre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Department|Département/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Location|Lieu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type|Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Status|Statut/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save posting|Enregistrer l'offre/i })).toBeInTheDocument()
  })

  it('exposes a candidate status-change control on each candidate row', async () => {
    mockHiringProduction({
      candidates: [CANDIDATE_ROW],
      jobPostings: [JOB_POSTING_ROW],
    })
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { HiringView: HiringViewFresh } = await import('./HiringView')

    renderAppFresh(<HiringViewFresh />, { route: '/app/hiring?tab=candidates', path: '/app/hiring' })

    // Wait for the candidate to appear (rendered in both desktop table and mobile cards)
    expect((await screen.findAllByText('Jane Doe')).length).toBeGreaterThan(0)

    // The status dropdown should be present (combobox labelled "Status" or "Statut")
    const statusSelect = screen.getByRole('combobox', { name: /^Status$|^Statut$/i })
    expect(statusSelect).toBeInTheDocument()
    expect(statusSelect).toHaveValue('application')

    // The advance button should also be present
    expect(screen.getByRole('button', { name: /Advance stage|Avancer l'étape/i })).toBeInTheDocument()
  })
})
