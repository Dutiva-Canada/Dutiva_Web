/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { PublicJobPosting } from './data/jobBoardApi'

const MOCK_POSTINGS: PublicJobPosting[] = [
  {
    id: 'jp-1',
    organizationId: 'org-1',
    organizationName: 'Northgate Logistics Inc.',
    title: 'Senior Product Manager',
    department: 'Product',
    location: 'Toronto, ON',
    type: 'Full-time',
    description: 'Lead the product team.',
    requirements: ['5+ years PM experience', 'B2B SaaS background'],
    status: 'active',
    postedDate: '2026-01-15',
    closingDate: '2026-03-01',
  },
  {
    id: 'jp-2',
    organizationId: 'org-1',
    organizationName: 'Northgate Logistics Inc.',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Remote (Canada)',
    type: 'Full-time',
    description: 'Build the candidate portal.',
    requirements: ['React', 'TypeScript'],
    status: 'active',
    postedDate: '2026-01-20',
    closingDate: null,
  },
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

  it('renders job postings from the API', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(MOCK_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    // Both job titles should appear
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()

    // Departments and locations render
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument()
    expect(screen.getByText('Remote (Canada)')).toBeInTheDocument()

    // "View details" links point at the detail pages
    const detailLinks = screen.getAllByRole('link', { name: /View details/i })
    expect(detailLinks).toHaveLength(2)
    expect(detailLinks[0]).toHaveAttribute('href', '/careers/jobs/jp-1')
    expect(detailLinks[1]).toHaveAttribute('href', '/careers/jobs/jp-2')
  })

  it('renders the employer name and the closing date when present', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(MOCK_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Product Manager')

    // Employer name shows on each card
    expect(screen.getAllByText('Northgate Logistics Inc.')).toHaveLength(2)
    // Closing date renders for jp-1 only (en-CA short format)
    expect(screen.getByText(/Mar 1, 2026/)).toBeInTheDocument()
  })

  it('shows the loading state before data arrives', async () => {
    let resolveList: (value: PublicJobPosting[]) => void = () => {}
    vi.mocked(listActiveJobPostings).mockImplementation(
      () => new Promise((resolve) => void (resolveList = resolve)),
    )
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    expect(screen.getByText(/Loading job openings/i)).toBeInTheDocument()

    // Let the pending promise settle so afterEach cleanup is clean
    resolveList([])
    await vi.waitFor(() => {
      expect(screen.queryByText(/Loading job openings/i)).not.toBeInTheDocument()
    })
  })

  it('shows the error state when the API fails', async () => {
    vi.mocked(listActiveJobPostings).mockRejectedValue(new Error('network'))
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    expect(await screen.findByText(/Could not load job openings/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()

    vi.mocked(listActiveJobPostings).mockResolvedValue(MOCK_POSTINGS)
    await user.click(screen.getByRole('button', { name: /Try again/i }))
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
    expect(listActiveJobPostings).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when the search has no matches', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(MOCK_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<JobBoardPage />)

    // Wait for postings to load
    await screen.findByText('Senior Product Manager')

    // Type a query that matches nothing
    const search = screen.getByLabelText(/Search by title/i)
    await user.type(search, 'zzzznope')

    expect(await screen.findByText(/No open positions match/i)).toBeInTheDocument()

    // Clear search restores the listings
    await user.click(screen.getByRole('button', { name: /Clear search/i }))
    expect(await screen.findByText('Senior Product Manager')).toBeInTheDocument()
  })

  it('shows a distinct empty state with a profile CTA when no postings exist', async () => {
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

  it('renders the explainer as a headed bullet list', async () => {
    vi.mocked(listActiveJobPostings).mockResolvedValue(MOCK_POSTINGS)
    const { JobBoardPage } = await import('./JobBoardPage')
    renderCareers(<JobBoardPage />)

    await screen.findByText('Senior Product Manager')
    expect(screen.getByRole('heading', { name: /How it works/i })).toBeInTheDocument()
    expect(screen.getByText(/no account needed to look/i)).toBeInTheDocument()
    expect(screen.getByText(/reuse it for every application/i)).toBeInTheDocument()
    expect(screen.getByText(/tailor your resume/i)).toBeInTheDocument()
  })
})
