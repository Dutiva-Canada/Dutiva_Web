/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { PublicJobPosting } from './data/jobBoardApi'
import { FIXTURE_POSTINGS, makePosting } from './postingFixtures'

const TWO_POSTINGS: PublicJobPosting[] = [
  makePosting({
    id: 'jp-1',
    slug: 'senior-product-manager-jp-1',
    title: 'Senior Product Manager',
    department: 'Product',
    location: 'Toronto, ON',
    type: 'Full-time',
    description: 'Lead the product team.',
    requirements: ['5+ years PM experience', 'B2B SaaS background'],
    postedDate: '2026-01-15',
    closingDate: '2026-03-01',
  }),
  makePosting({
    id: 'jp-2',
    slug: 'frontend-engineer-jp-2',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Remote (Canada)',
    type: 'Full-time',
    description: 'Build the candidate portal.',
    requirements: ['React', 'TypeScript'],
    salaryMin: 110000,
    salaryMax: 140000,
    postedDate: '2026-01-20',
  }),
]

vi.mock('./data/jobBoardApi', () => ({
  listActiveJobPostings: vi.fn(),
  getPublicJobPosting: vi.fn(),
}))

const { listActiveJobPostings } = await import('./data/jobBoardApi')

function renderCareers(ui: ReactElement, { path = '/careers', route = '/careers' } = {}) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path={path} element={ui} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('JobBoardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders job postings from the API, with slug detail links', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(TWO_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    // Both job titles should appear
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()

    // Departments and locations render (also present as facet options — hence All)
    expect(screen.getAllByText('Product').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Toronto, ON').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Remote (Canada)').length).toBeGreaterThan(0)

    // "View details" cards link to slug URLs
    const detailLinks = screen.getAllByRole('link', { name: /Senior Product Manager/i })
    expect(detailLinks[0]).toHaveAttribute('href', '/careers/jobs/senior-product-manager-jp-1')
  })

  it('renders the employer name, closing date, and salary when present', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(TWO_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Product Manager')

    // Employer name shows on each card
    expect(screen.getAllByText('Northgate Logistics Inc.')).toHaveLength(2)
    // Closing date renders for jp-1 only (en-CA short format)
    expect(screen.getByText(/Mar 1, 2026/)).toBeInTheDocument()
    // Salary renders for jp-2 only — never a placeholder for the other card
    // (en-CA Intl formats CAD as "$", not "CA$")
    expect(screen.getByText(/\$110,000/)).toBeInTheDocument()
    // Only one card shows a salary (facet band labels end in "+", not "/yr")
    expect(screen.getAllByText(/\/yr/)).toHaveLength(1)
  })

  it('shows skeleton cards while loading, then results', async () => {
    let resolveList: (value: PublicJobPosting[]) => void = () => {}
    vi.mocked(listActiveJobPostings).mockImplementation(
      () => new Promise((resolve) => void (resolveList = resolve)),
    )
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    expect(screen.getByRole('status')).toHaveTextContent(/Loading job openings/i)

    resolveList(TWO_POSTINGS)
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
  })

  it('shows the error state when the API fails', async () => {
    vi.mocked(listActiveJobPostings).mockRejectedValue(new Error('network'))
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    expect(await screen.findByText(/Could not load job openings/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()

    vi.mocked(listActiveJobPostings).mockResolvedValue(TWO_POSTINGS)
    await user.click(screen.getByRole('button', { name: /Try again/i }))
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
    expect(listActiveJobPostings).toHaveBeenCalledTimes(2)
  })

  it('filters by the debounced search box and announces the count', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(FIXTURE_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Recruiter')
    const search = screen.getByLabelText(/Search by title/i)
    // Typing filters through the 300ms debounce — wait for a non-match to drop
    await user.type(search, 'engineer')
    await waitFor(() =>
      expect(screen.queryByText('Senior Recruiter')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('2 role(s) found'),
    )
  })

  it('reads ?q= from the URL and pre-fills the input', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(FIXTURE_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />, { route: '/careers?q=engineer' })

    const search = screen.getByLabelText(/Search by title/i)
    expect(search).toHaveValue('engineer')
    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Senior Recruiter')).not.toBeInTheDocument()
  })

  it('facet filters compose and produce removable chips', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(FIXTURE_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Recruiter')

    // Department facet
    await user.selectOptions(screen.getByLabelText(/^Department$/i), 'Engineering')
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Senior Recruiter')).not.toBeInTheDocument()
    // The active facet shows as a chip
    expect(screen.getByRole('button', { name: 'Remove filter: Engineering' })).toBeInTheDocument()

    // Work arrangement facet composes
    await user.selectOptions(screen.getByLabelText(/Work arrangement/i), 'remote')
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Payroll Supervisor')).not.toBeInTheDocument()

    // Clear all restores the full list
    await user.click(screen.getByRole('button', { name: /Clear all filters/i }))
    expect(await screen.findByText('Senior Recruiter')).toBeInTheDocument()
  })

  it('salary facet filters to postings meeting the annualized floor', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(FIXTURE_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Recruiter')
    await user.selectOptions(screen.getByLabelText(/Minimum salary/i), '100000')
    // $100k+ — Frontend ($140k ceiling) and Backend ($105/hr ceiling ≈ $218k)
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Payroll Supervisor')).not.toBeInTheDocument()
    // Active facet renders as a chip the user can remove
    expect(screen.getByRole('button', { name: /Remove filter.*100,000/i })).toBeInTheDocument()
  })

  it('reads ?page= from the URL so a shared deep page keeps its window', async () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      makePosting({ id: `jp-${i}`, slug: `role-${i}`, title: `Role ${i}` }),
    )
    vi.mocked(listActiveJobPostings).mockResolvedValue(many)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />, { route: '/careers?page=2' })

    // page=2 → 24-deep window: every fixture row is visible without clicking
    expect(await screen.findByText('Role 0')).toBeInTheDocument()
    expect(screen.getByText('Role 13')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Load more/i })).not.toBeInTheDocument()
  })

  it('shows a distinct empty state with a clear-search action when filters match nothing', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(TWO_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />, { route: '/careers?q=zzzznope' })

    expect(await screen.findByText(/No open positions match/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Clear search/i }))
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
  })

  it('shows the genuinely-empty state with a profile CTA when no postings exist', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue([])
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    // Zero-postings copy — not the "no search match" wording
    expect(await screen.findByText(/No open positions right now/i)).toBeInTheDocument()
    expect(screen.queryByText(/match your search/i)).not.toBeInTheDocument()

    // The empty state offers a next action: create a profile via the portal
    const cta = screen.getByRole('link', { name: /Create a free profile/i })
    expect(cta).toHaveAttribute('href', '/careers/portal')
  })

  it('paginates long lists behind Load more', async () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      makePosting({
        id: `jp-${i}`,
        slug: `role-${i}-jp-${i}`,
        title: `Role ${i}`,
        postedDate: `2026-09-${String(i + 1).padStart(2, '0')}`,
      }),
    )
    vi.mocked(listActiveJobPostings).mockResolvedValue(many)
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    // Newest-first: Role 13 (latest date) on page one, Role 0 paginated out
    await screen.findByText('Role 13')
    expect(screen.queryByText('Role 0')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 12 of 14')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Load more/i }))
    expect(await screen.findByText('Role 0')).toBeInTheDocument()
  })

  it('renders the explainer as a headed bullet list', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(TWO_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Product Manager')
    expect(screen.getByRole('heading', { name: /How it works/i })).toBeInTheDocument()
    expect(screen.getByText(/no account needed to look/i)).toBeInTheDocument()
    expect(screen.getByText(/reuse it for every application/i)).toBeInTheDocument()
    expect(screen.getByText(/tailor your resume/i)).toBeInTheDocument()
  })

  it('offers employers a door to post a role', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(TWO_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Product Manager')
    const cta = screen.getByRole('link', { name: /Hiring\? Post a role/i })
    expect(cta).toHaveAttribute('href', '/employer')
  })
})
