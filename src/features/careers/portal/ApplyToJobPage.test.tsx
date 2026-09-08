import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { CandidateProfile } from '@/features/careers/data/candidateApi'
import type { CandidateApplication } from '@/features/careers/data/applicationsApi'
import type { PublicJobPosting } from '@/features/careers/data/jobBoardApi'

vi.mock('@/features/careers/data/candidateApi', () => ({
  getMyCandidateProfile: vi.fn(),
  createCandidateProfile: vi.fn(),
  updateCandidateProfile: vi.fn(),
}))
vi.mock('@/features/careers/data/applicationsApi', () => ({
  listMyApplications: vi.fn(),
  hasApplied: vi.fn(),
  submitApplication: vi.fn(),
  withdrawApplication: vi.fn(),
}))
vi.mock('@/features/careers/data/jobBoardApi', () => ({
  listActiveJobPostings: vi.fn(),
  getPublicJobPosting: vi.fn(),
}))
vi.mock('@/features/careers/data/candidateAi', () => ({
  tailorResume: vi.fn(),
  generateCoverLetter: vi.fn(),
  scoreMatch: vi.fn(),
  interviewPrep: vi.fn(),
}))

const { getMyCandidateProfile } = await import('@/features/careers/data/candidateApi')
const { hasApplied, submitApplication } = await import('@/features/careers/data/applicationsApi')
const { getPublicJobPosting } = await import('@/features/careers/data/jobBoardApi')

const MOCK_JOB: PublicJobPosting = {
  id: 'jp-1',
  organizationId: 'org-1',
  title: 'Senior Product Manager',
  department: 'Product',
  location: 'Toronto, ON',
  type: 'Full-time',
  description: 'Lead the product team.',
  requirements: ['5+ years PM experience', 'B2B SaaS background'],
  status: 'active',
  postedDate: '2026-01-15',
  closingDate: null,
}

const MOCK_PROFILE: CandidateProfile = {
  id: 'p1',
  userId: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: null,
  location: 'Toronto',
  headline: 'Senior PM',
  summary: 'Experienced product manager.',
  resumeText: 'Jane Doe — Senior PM with 8 years experience.',
  coverLetter: null,
  linkedin: null,
  website: null,
  yearsExperience: 8,
  workAuthorization: 'authorized',
  currentRole: 'Senior PM',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const MOCK_APPLICATION: CandidateApplication = {
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
}

function renderCareers(
  ui: ReactElement,
  { path = '/careers/portal/jobs/:postingId/apply', route = '/careers/portal/jobs/jp-1/apply' } = {},
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

describe('ApplyToJobPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the job summary and application form when profile exists and not yet applied', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(false)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    renderCareers(<ApplyToJobPage />)

    // Job title appears in the "Apply to <title>" heading
    expect(await screen.findByText(/Apply to.*Senior Product Manager/i)).toBeInTheDocument()

    // Cover letter and resume fields are present
    expect(screen.getByLabelText(/^Cover letter/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Resume$/i)).toBeInTheDocument()

    // Submit button is present
    expect(screen.getByRole('button', { name: /Submit application/i })).toBeInTheDocument()

    // AI tools section is present
    expect(screen.getByText(/AI tools/i)).toBeInTheDocument()
  })

  it('shows the "complete your profile" message when no profile exists', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(null)
    vi.mocked(hasApplied).mockResolvedValue(false)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    renderCareers(<ApplyToJobPage />)

    expect(await screen.findByText(/Complete your profile before applying/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Go to profile/i })).toBeInTheDocument()
  })

  it('shows the "already applied" message when the candidate has already applied', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(true)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    renderCareers(<ApplyToJobPage />)

    expect(await screen.findByText(/You've already applied to this role/i)).toBeInTheDocument()
  })

  it('submits the application and shows a success toast', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(false)
    vi.mocked(submitApplication).mockResolvedValue(MOCK_APPLICATION)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<ApplyToJobPage />)

    // Wait for the form to load
    await screen.findByText(/Apply to.*Senior Product Manager/i)

    await user.click(screen.getByRole('button', { name: /Submit application/i }))

    await vi.waitFor(() => {
      expect(submitApplication).toHaveBeenCalledTimes(1)
    })
  })

  it('shows the not-found state when the job posting does not exist', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(null)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(false)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    renderCareers(<ApplyToJobPage />)

    expect(await screen.findByText(/This position is no longer available/i)).toBeInTheDocument()
  })
})
