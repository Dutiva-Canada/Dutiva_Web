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

vi.mock('@/features/careers/data/candidateApi', () => ({
  getMyCandidateProfile: vi.fn(),
  createCandidateProfile: vi.fn(),
  updateCandidateProfile: vi.fn(),
}))

const { getMyCandidateProfile, createCandidateProfile, updateCandidateProfile } = await import(
  '@/features/careers/data/candidateApi'
)

const MOCK_PROFILE: CandidateProfile = {
  id: 'p1',
  userId: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-1234',
  location: 'Toronto, ON',
  headline: 'Senior Product Manager',
  summary: 'Experienced PM with 8 years in B2B SaaS.',
  resumeText: 'Jane Doe — Senior PM',
  linkedin: 'https://linkedin.com/in/jane',
  website: null,
  yearsExperience: 8,
  workAuthorization: 'authorized',
  currentRole: 'Senior PM',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderCareers(
  ui: ReactElement,
  { path = '/careers/portal/profile', route = '/careers/portal/profile' } = {},
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

describe('CandidateProfilePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the profile form with existing profile data', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    const { CandidateProfilePage } = await import('./CandidateProfilePage')
    renderCareers(<CandidateProfilePage />)

    // Wait for the form to load and show the pre-filled name
    const nameInput = await screen.findByLabelText(/Full name/i)
    expect(nameInput).toHaveValue('Jane Doe')

    // Headline should be pre-filled
    expect(screen.getByLabelText(/Headline/i)).toHaveValue('Senior Product Manager')

    // Save button is present
    expect(screen.getByRole('button', { name: /Save profile/i })).toBeInTheDocument()
  })

  it('renders an empty form when no profile exists', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(null)
    const { CandidateProfilePage } = await import('./CandidateProfilePage')
    renderCareers(<CandidateProfilePage />)

    const nameInput = await screen.findByLabelText(/Full name/i)
    expect(nameInput).toHaveValue('')
  })

  it('creates a new profile on first save', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(null)
    vi.mocked(createCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    const { CandidateProfilePage } = await import('./CandidateProfilePage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<CandidateProfilePage />)

    const nameInput = await screen.findByLabelText(/Full name/i)
    await user.type(nameInput, 'Jane Doe')
    await user.type(screen.getByLabelText(/Location/i), 'Toronto')
    await user.type(screen.getByLabelText(/Headline/i), 'Senior PM')
    await user.type(screen.getByLabelText(/Summary/i), 'Experienced PM.')
    await user.type(screen.getByLabelText(/Resume/i), 'Jane Doe resume')

    await user.click(screen.getByRole('button', { name: /Save profile/i }))

    await vi.waitFor(() => {
      expect(createCandidateProfile).toHaveBeenCalledTimes(1)
    })
  })

  it('updates an existing profile on save', async () => {
    vi.mocked(getMyCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    vi.mocked(updateCandidateProfile).mockResolvedValue(MOCK_PROFILE)
    const { CandidateProfilePage } = await import('./CandidateProfilePage')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderCareers(<CandidateProfilePage />)

    // Wait for form to load
    await screen.findByLabelText(/Full name/i)

    await user.click(screen.getByRole('button', { name: /Save profile/i }))

    await vi.waitFor(() => {
      expect(updateCandidateProfile).toHaveBeenCalledTimes(1)
    })
  })

  it('shows the error state when the API fails to load', async () => {
    vi.mocked(getMyCandidateProfile).mockRejectedValue(new Error('network'))
    const { CandidateProfilePage } = await import('./CandidateProfilePage')
    renderCareers(<CandidateProfilePage />)

    expect((await screen.findAllByText(/Something went wrong/i)).length).toBeGreaterThan(0)
  })
})
