/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { PublicJobPosting } from './data/jobBoardApi'

const MOCK_POSTING: PublicJobPosting = {
  id: 'jp-1',
  organizationId: 'org-1',
  title: 'Senior Product Manager',
  department: 'Product',
  location: 'Toronto, ON',
  type: 'Full-time',
  description: 'Lead the product team and drive roadmap.',
  requirements: ['5+ years PM experience', 'B2B SaaS background'],
  status: 'active',
  postedDate: '2026-01-15',
  closingDate: null,
}

vi.mock('./data/jobBoardApi', () => ({
  listActiveJobPostings: vi.fn(),
  getPublicJobPosting: vi.fn(),
}))

const { getPublicJobPosting } = await import('./data/jobBoardApi')

/** Signed-in auth context value — bypasses the real AuthProvider for tests. */
const SIGNED_IN_AUTH: AuthContextValue = {
  status: 'signed-in',
  session: { user: { id: 'u1', email: 'candidate@example.com' } } as never,
  authorized: true,
  signInWithEmail: vi.fn(),
  verifyEmailCode: vi.fn(),
  signOut: vi.fn(),
}

function renderCareers(
  ui: ReactElement,
  { path = '/careers/jobs/:postingId', route = '/careers/jobs/jp-1', auth }: {
    path?: string
    route?: string
    auth?: AuthContextValue
  } = {},
) {
  return render(
    <ThemeProvider>
      <LangProvider>
        {auth ? (
          <AuthContext.Provider value={auth}>
            <ToastsProvider>
              <MemoryRouter initialEntries={[route]}>
                <Routes>
                  <Route path={path} element={ui} />
                </Routes>
              </MemoryRouter>
            </ToastsProvider>
          </AuthContext.Provider>
        ) : (
          <AuthProvider>
            <ToastsProvider>
              <MemoryRouter initialEntries={[route]}>
                <Routes>
                  <Route path={path} element={ui} />
                </Routes>
              </MemoryRouter>
            </ToastsProvider>
          </AuthProvider>
        )}
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('JobDetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders job details and the sign-in-to-apply CTA when signed out', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />)

    // Title renders as h1
    expect(await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' })).toBeInTheDocument()

    // Metadata
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument()
    expect(screen.getByText('Full-time')).toBeInTheDocument()

    // Description section
    expect(screen.getByRole('heading', { name: /About the role/i })).toBeInTheDocument()
    expect(screen.getByText(/Lead the product team/i)).toBeInTheDocument()

    // Requirements render as a list
    expect(screen.getByRole('heading', { name: /Requirements/i })).toBeInTheDocument()
    expect(screen.getByText('5+ years PM experience')).toBeInTheDocument()
    expect(screen.getByText('B2B SaaS background')).toBeInTheDocument()

    // Signed out → "Sign in to apply" CTA (not the apply button)
    expect(screen.getByRole('heading', { name: /Sign in to apply/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Apply to this role/i })).not.toBeInTheDocument()

    // The sign-in CTA links to the candidate portal
    expect(screen.getByRole('link', { name: /Sign in to apply/i })).toHaveAttribute('href', '/careers/portal')
  })

  it('renders the apply button when the candidate is signed in', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />, { auth: SIGNED_IN_AUTH })

    // Wait for the posting to load, then the apply CTA should be a direct link
    expect(await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' })).toBeInTheDocument()
    const applyLink = await screen.findByRole('link', { name: /Apply to this role/i })
    expect(applyLink).toHaveAttribute('href', '/careers/portal/jobs/jp-1/apply')
  })

  it('shows the not-found state when the posting does not exist', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(null)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />)

    expect(await screen.findByText(/no longer available/i)).toBeInTheDocument()
    expect(screen.getByText(/closed or filled/i)).toBeInTheDocument()
  })
})
