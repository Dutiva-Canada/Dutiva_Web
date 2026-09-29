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
import { makePosting } from '@/features/careers/postingFixtures'

vi.mock('@/features/careers/data/candidateApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/careers/data/candidateApi')>()),
  getMyCandidateProfile: vi.fn(),
  createCandidateProfile: vi.fn(),
  updateCandidateProfile: vi.fn(),
  deleteMyCandidateProfile: vi.fn(),
}))
vi.mock('@/features/careers/data/applicationsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/careers/data/applicationsApi')>()),
  listMyApplications: vi.fn(),
  hasApplied: vi.fn(),
  submitApplication: vi.fn(),
  withdrawApplication: vi.fn(),
  deleteApplication: vi.fn(),
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

const MOCK_JOB = makePosting({
  id: 'jp-1',
  slug: 'senior-product-manager-jp-1',
  title: 'Senior Product Manager',
  department: 'Product',
  location: 'Toronto, ON',
  type: 'Full-time',
  description: 'Lead the product team.',
  requirements: ['5+ years PM experience', 'B2B SaaS background'],
  postedDate: '2026-01-15',
})

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
  {
    path = '/careers/portal/jobs/:postingId/apply',
    route = '/careers/portal/jobs/jp-1/apply',
  } = {},
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

  it('shows the "complete your profile" message with a ?next= return link when no profile exists', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(null)
    vi.mocked(hasApplied).mockResolvedValue(false)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    renderCareers(<ApplyToJobPage />)

    expect(await screen.findByText(/Complete your profile before applying/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Go to profile/i })
    expect(link).toHaveAttribute(
      'href',
      `/careers/portal/profile?next=${encodeURIComponent('/careers/portal/jobs/jp-1/apply')}`,
    )
  })

  it('shows the "already applied" message when the candidate has already applied', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(true)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    renderCareers(<ApplyToJobPage />)

    expect(await screen.findByText(/You've already applied to this role/i)).toBeInTheDocument()
  })

  it('requires an explicit confirm step — submit does not fire on the first click', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(false)
    vi.mocked(submitApplication).mockResolvedValue(MOCK_APPLICATION)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<ApplyToJobPage />)

    await screen.findByText(/Apply to.*Senior Product Manager/i)

    // First click: review/confirm panel, NOT a submission
    await user.click(screen.getByRole('button', { name: /Submit application/i }))
    expect(submitApplication).not.toHaveBeenCalled()
    expect(
      screen.getByRole('heading', { name: /Review and submit/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/sent to Northgate Logistics Inc\.|go to Northgate/i)).toBeInTheDocument()

    // Second click: the actual submission
    await user.click(screen.getByRole('button', { name: /Confirm and submit/i }))
    await vi.waitFor(() => {
      expect(submitApplication).toHaveBeenCalledTimes(1)
    })

    // Confirmation state renders in place
    expect(
      await screen.findByRole('link', { name: /Your applications/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/went to Northgate Logistics Inc\./i)).toBeInTheDocument()
  })

  it('back-to-edit returns to the form without submitting', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(false)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<ApplyToJobPage />)

    await screen.findByText(/Apply to.*Senior Product Manager/i)
    await user.click(screen.getByRole('button', { name: /Submit application/i }))
    await user.click(screen.getByRole('button', { name: /Back to edit/i }))

    expect(submitApplication).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Resume$/i)).toBeInTheDocument()
  })

  it('surfaces a submission failure inline and keeps the confirm step retryable', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_JOB)
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(hasApplied).mockResolvedValue(false)
    vi.mocked(submitApplication)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(MOCK_APPLICATION)
    const { ApplyToJobPage } = await import('./ApplyToJobPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<ApplyToJobPage />)

    await screen.findByText(/Apply to.*Senior Product Manager/i)
    await user.click(screen.getByRole('button', { name: /Submit application/i }))
    await user.click(screen.getByRole('button', { name: /Confirm and submit/i }))

    // Inline error — the confirm panel stays put so nothing typed is lost
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Could not submit application/i,
    )
    expect(
      screen.getByRole('heading', { name: /Review and submit/i }),
    ).toBeInTheDocument()

    // Retry works
    await user.click(screen.getByRole('button', { name: /Confirm and submit/i }))
    await vi.waitFor(() => {
      expect(submitApplication).toHaveBeenCalledTimes(2)
    })
    expect(
      await screen.findByRole('link', { name: /Your applications/i }),
    ).toBeInTheDocument()
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
