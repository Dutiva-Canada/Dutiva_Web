import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { CandidateApplication } from '@/features/careers/data/applicationsApi'

vi.mock('@/features/careers/data/applicationsApi', () => ({
  listMyApplications: vi.fn(),
  hasApplied: vi.fn(),
  submitApplication: vi.fn(),
  withdrawApplication: vi.fn(),
}))

const { listMyApplications, withdrawApplication } = await import('@/features/careers/data/applicationsApi')

const MOCK_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'a1',
    candidateId: 'p1',
    jobPostingId: 'jp-1',
    status: 'submitted',
    coverLetter: null,
    submittedResume: 'Resume text',
    aiMatchScore: null,
    aiSuggestions: null,
    appliedAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
    jobPosting: { id: 'jp-1', title: 'Senior PM', department: 'Product', location: 'Toronto', type: 'Full-time' },
  },
  {
    id: 'a2',
    candidateId: 'p1',
    jobPostingId: 'jp-2',
    status: 'hired',
    coverLetter: null,
    submittedResume: 'Resume text',
    aiMatchScore: null,
    aiSuggestions: null,
    appliedAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    jobPosting: { id: 'jp-2', title: 'Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
  },
]

function renderCareers(
  ui: ReactElement,
  { path = '/careers/portal/applications', route = '/careers/portal/applications' } = {},
) {
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

describe('ApplicationsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the applications list with job titles and status badges', async () => {
    vi.mocked(listMyApplications).mockResolvedValue(MOCK_APPLICATIONS)
    const { ApplicationsPage } = await import('./ApplicationsPage')
    renderCareers(<ApplicationsPage />)

    // Both job titles should appear
    expect(await screen.findByText('Senior PM')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()

    // Status badges
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Hired')).toBeInTheDocument()
  })

  it('shows the empty state when there are no applications', async () => {
    vi.mocked(listMyApplications).mockResolvedValue([])
    const { ApplicationsPage } = await import('./ApplicationsPage')
    renderCareers(<ApplicationsPage />)

    expect(await screen.findByText(/You haven't applied to any roles yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Browse open jobs/i })).toBeInTheDocument()
  })

  it('shows a withdraw button for non-terminal statuses', async () => {
    vi.mocked(listMyApplications).mockResolvedValue(MOCK_APPLICATIONS)
    const { ApplicationsPage } = await import('./ApplicationsPage')
    renderCareers(<ApplicationsPage />)

    await screen.findByText('Senior PM')

    // "submitted" is non-terminal → withdraw button present
    expect(screen.getByRole('button', { name: /^Withdraw$/i })).toBeInTheDocument()
  })

  it('does not show a withdraw button for terminal statuses', async () => {
    vi.mocked(listMyApplications).mockResolvedValue(MOCK_APPLICATIONS)
    const { ApplicationsPage } = await import('./ApplicationsPage')
    renderCareers(<ApplicationsPage />)

    await screen.findByText('Senior PM')

    // Only one withdraw button (for the "submitted" application, not "hired")
    expect(screen.getAllByRole('button', { name: /^Withdraw$/i })).toHaveLength(1)
  })

  it('withdraws an application after confirmation', async () => {
    vi.mocked(listMyApplications).mockResolvedValue(MOCK_APPLICATIONS)
    vi.mocked(withdrawApplication).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { ApplicationsPage } = await import('./ApplicationsPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<ApplicationsPage />)

    await screen.findByText('Senior PM')
    await user.click(screen.getByRole('button', { name: /^Withdraw$/i }))

    await vi.waitFor(() => {
      expect(withdrawApplication).toHaveBeenCalledWith('a1')
    })
  })

  it('shows the error state when the API fails', async () => {
    vi.mocked(listMyApplications).mockRejectedValue(new Error('network'))
    const { ApplicationsPage } = await import('./ApplicationsPage')
    renderCareers(<ApplicationsPage />)

    expect((await screen.findAllByText(/Something went wrong/i)).length).toBeGreaterThan(0)
  })
})
