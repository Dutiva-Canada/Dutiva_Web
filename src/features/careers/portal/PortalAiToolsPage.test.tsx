import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { CandidateProfile } from '@/features/careers/data/candidateApi'

vi.mock('@/features/careers/data/candidateApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/careers/data/candidateApi')>()),
  getMyCandidateProfile: vi.fn(),
}))
vi.mock('@/features/careers/data/applicationsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/careers/data/applicationsApi')>()),
  listMyApplications: vi.fn(),
}))
vi.mock('@/features/careers/data/jobBoardApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/careers/data/jobBoardApi')>()),
  getPublicJobPosting: vi.fn(),
}))

const { getMyCandidateProfile } = await import('@/features/careers/data/candidateApi')
const { listMyApplications } = await import('@/features/careers/data/applicationsApi')
const { getPublicJobPosting } = await import('@/features/careers/data/jobBoardApi')

const MOCK_PROFILE: CandidateProfile = {
  id: 'p1',
  userId: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: null,
  location: 'Toronto',
  headline: 'Senior PM',
  summary: 'Experienced product manager.',
  resumeText: 'Jane Doe — Senior PM — 8 years',
  coverLetter: null,
  linkedin: null,
  website: null,
  yearsExperience: 8,
  workAuthorization: 'authorized',
  currentRole: 'Senior PM',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderPage(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/careers/portal/ai-tools']}>
              <Routes>
                <Route path="/careers/portal/ai-tools" element={ui} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PortalAiToolsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gates on a resume — no profile or empty resumeText sends the user to Profile', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(null)
    vi.mocked(listMyApplications).mockResolvedValue([])
    const { PortalAiToolsPage } = await import('./PortalAiToolsPage')
    renderPage(<PortalAiToolsPage />)

    expect(await screen.findByText(/Add your resume first/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Profile/i })).toHaveAttribute(
      'href',
      '/careers/portal/profile',
    )
  })

  it('renders the context picker and unlocks the tools from a pasted posting', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(listMyApplications).mockResolvedValue([])
    const { PortalAiToolsPage } = await import('./PortalAiToolsPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage(<PortalAiToolsPage />)

    expect(await screen.findByText(/Choose a job/i)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/Job title/i), 'Warehouse Lead')
    await user.type(screen.getByPlaceholderText(/Paste the job description/i), 'Run the floor.')
    await user.click(screen.getByRole('button', { name: /Use this posting/i }))

    /* The shared AiTools section renders — the four apply-page tools are now
       reachable without an open posting. (Each tool name appears in both its
       card heading and its run button, hence *AllBy*.) */
    expect((await screen.findAllByText(/Tailor my resume/i)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Draft a cover letter/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Check my match/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Interview prep/i).length).toBeGreaterThan(0)
  })

  it('hydrates context from an existing application via the public posting', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(listMyApplications).mockResolvedValue([
      {
        id: 'a1',
        candidateId: 'p1',
        jobPostingId: 'jp-1',
        status: 'submitted',
        coverLetter: null,
        submittedResume: 'x',
        aiMatchScore: null,
        aiSuggestions: null,
        appliedAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
        jobPosting: { id: 'jp-1', title: 'Senior PM', department: 'P', location: 'T', type: 'FT' },
      },
    ])
    vi.mocked(getPublicJobPosting).mockResolvedValue({
      id: 'jp-1',
      organizationId: 'o1',
      organizationName: 'Acme',
      title: 'Senior PM',
      department: 'Product',
      location: 'Toronto',
      type: 'Full-time',
      description: 'Lead the roadmap.',
      requirements: ['5+ years'],
      status: 'active',
      postedDate: null,
      closingDate: null,
    })
    const { PortalAiToolsPage } = await import('./PortalAiToolsPage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage(<PortalAiToolsPage />)

    const select = await screen.findByLabelText(/From my applications/i)
    await user.selectOptions(select, 'a1')

    expect(vi.mocked(getPublicJobPosting)).toHaveBeenCalledWith('jp-1')
    expect((await screen.findAllByText(/Tailor my resume/i)).length).toBeGreaterThan(0)
  })
})
