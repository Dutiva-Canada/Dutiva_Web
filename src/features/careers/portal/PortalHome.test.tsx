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

const { getMyCandidateProfile } = await import('@/features/careers/data/candidateApi')
const { listMyApplications } = await import('@/features/careers/data/applicationsApi')

const MOCK_PROFILE: CandidateProfile = {
  id: 'p1',
  userId: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: null,
  location: 'Toronto',
  headline: 'Senior PM',
  summary: 'Experienced product manager.',
  resumeText: 'Jane Doe — Senior PM',
  linkedin: null,
  website: null,
  yearsExperience: 8,
  workAuthorization: 'authorized',
  currentRole: 'Senior PM',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

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
]

function renderCareers(ui: ReactElement, { path = '/careers/portal', route = '/careers/portal' } = {}) {
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

describe('PortalHome', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the "complete your profile" CTA when no profile exists', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(null)
    vi.mocked(listMyApplications).mockResolvedValue([])
    const { PortalHome } = await import('./PortalHome')
    renderCareers(<PortalHome />)

    expect(await screen.findByText(/Complete your profile to start applying/i)).toBeInTheDocument()
  })

  it('shows the dashboard with profile completeness and recent applications when a profile exists', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(listMyApplications).mockResolvedValue(MOCK_APPLICATIONS)
    const { PortalHome } = await import('./PortalHome')
    renderCareers(<PortalHome />)

    // Profile headline shows
    expect((await screen.findAllByText('Senior PM')).length).toBeGreaterThan(0)
    // Recent application title shows
    expect(screen.getAllByText('Senior PM').length).toBeGreaterThan(0)
    // Browse jobs CTA is present
    expect(screen.getByRole('link', { name: /Browse jobs/i })).toBeInTheDocument()
  })

  it('shows the empty applications message when there are no applications', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(listMyApplications).mockResolvedValue([])
    const { PortalHome } = await import('./PortalHome')
    renderCareers(<PortalHome />)

    expect(await screen.findByText(/You haven't applied to any roles yet/i)).toBeInTheDocument()
  })

  it('shows the error state when the API fails', async () => {
    vi.mocked(getMyCandidateProfile).mockRejectedValue(new Error('network'))
    vi.mocked(listMyApplications).mockResolvedValue([])
    const { PortalHome } = await import('./PortalHome')
    renderCareers(<PortalHome />)

    expect((await screen.findAllByText(/Something went wrong/i)).length).toBeGreaterThan(0)
  })
})
