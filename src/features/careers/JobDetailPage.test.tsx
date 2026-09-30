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
import { makePosting } from './postingFixtures'

const MOCK_POSTING: PublicJobPosting = makePosting({
  id: 'jp-1',
  slug: 'senior-product-manager-jp-1',
  title: 'Senior Product Manager',
  department: 'Product',
  location: 'Toronto, ON',
  type: 'Full-time',
  description: 'Lead the product team and drive roadmap.',
  requirements: ['5+ years PM experience', 'B2B SaaS background'],
  responsibilities: ['Own the roadmap', 'Talk to customers'],
  benefits: ['Health and dental', 'Four weeks vacation'],
  salaryMin: 120000,
  salaryMax: 150000,
  employerBlurb: 'Northgate moves freight across Ontario and Quebec.',
  postedDate: '2026-01-15',
  closingDate: '2026-03-01',
})

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
    refreshAuthorization: vi.fn(async () => {}),
}

function renderCareers(
  ui: ReactElement,
  {
    path = '/careers/jobs/:postingId',
    route = '/careers/jobs/senior-product-manager-jp-1',
    auth,
    state,
  }: {
    path?: string
    route?: string
    auth?: AuthContextValue
    state?: unknown
  } = {},
) {
  return render(
    <ThemeProvider>
      <LangProvider>
        {auth ? (
          <AuthContext.Provider value={auth}>
            <ToastsProvider>
              <MemoryRouter initialEntries={[{ pathname: route, state }]}>
                <Routes>
                  <Route path={path} element={ui} />
                </Routes>
              </MemoryRouter>
            </ToastsProvider>
          </AuthContext.Provider>
        ) : (
          <AuthProvider>
            <ToastsProvider>
              <MemoryRouter initialEntries={[{ pathname: route, state }]}>
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

  it('renders the full posting and the sign-in-to-apply CTA when signed out', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />)

    // Title renders as h1
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' }),
    ).toBeInTheDocument()

    // Metadata — labels and values
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument()
    expect(screen.getByText('Full-time')).toBeInTheDocument()
    expect(screen.getByText(/\$120,000–\$150,000\/yr/)).toBeInTheDocument()

    // All the posting sections render
    expect(screen.getByRole('heading', { name: /About the role/i })).toBeInTheDocument()
    expect(screen.getByText(/Lead the product team/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Responsibilities/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Talk to customers')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Requirements/i })).toBeInTheDocument()
    expect(screen.getByText('B2B SaaS background')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Benefits$/i })).toBeInTheDocument()
    expect(screen.getByText('Four weeks vacation')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /About Northgate Logistics Inc\./i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/freight across Ontario/i)).toBeInTheDocument()

    // Signed out → "Sign in to apply" CTA (not the apply button)
    expect(screen.getByRole('heading', { name: /Sign in to apply/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Apply to this role/i })).not.toBeInTheDocument()

    // The sign-in CTA links to the candidate portal
    expect(screen.getByRole('link', { name: /Sign in to apply/i })).toHaveAttribute(
      'href',
      '/careers/portal',
    )
  })

  it('resolves a bare-uuid URL and canonicalizes to the slug', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />, { route: '/careers/jobs/jp-1' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' }),
    ).toBeInTheDocument()
    expect(getPublicJobPosting).toHaveBeenCalledWith('jp-1')
  })

  it('renders the apply button when the candidate is signed in', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />, { auth: SIGNED_IN_AUTH })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' }),
    ).toBeInTheDocument()
    const applyLink = await screen.findByRole('link', { name: /Apply to this role/i })
    expect(applyLink).toHaveAttribute('href', '/careers/portal/jobs/jp-1/apply')
  })

  it('back link preserves the board filter state from link state', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />, { state: { boardSearch: '?q=engineer&location=Toronto' } })

    await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' })
    const back = screen.getAllByRole('link', { name: /All jobs/i })[0]!
    expect(back).toHaveAttribute('href', '/careers?q=engineer&location=Toronto')
  })

  it('shows the not-found state when the posting does not exist', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(null)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />)

    expect(await screen.findByText(/no longer available/i)).toBeInTheDocument()
    expect(screen.getByText(/closed or filled/i)).toBeInTheDocument()
  })

  it('emits JobPosting JSON-LD with only rendered facts', async () => {
    vi.mocked(getPublicJobPosting).mockResolvedValue(MOCK_POSTING)
    const { JobDetailPage } = await import('./JobDetailPage')
    renderCareers(<JobDetailPage />)

    await screen.findByRole('heading', { level: 1, name: 'Senior Product Manager' })
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThan(0)
    const doc = JSON.parse(scripts[scripts.length - 1]!.textContent!)
    const job = doc['@graph'].find((n: { '@type'?: string }) => n['@type'] === 'JobPosting')
    expect(job).toBeDefined()
    expect(job.title).toBe('Senior Product Manager')
    expect(job.hiringOrganization.name).toBe('Northgate Logistics Inc.')
    expect(job.baseSalary.currency).toBe('CAD')
    expect(job.baseSalary.value.minValue).toBe(120000)
    expect(job.employmentType).toBe('FULL_TIME')
    expect(job.jobLocation.address.addressLocality).toBe('Toronto')
    expect(job.datePosted).toBe('2026-01-15')
    expect(job.validThrough).toBe('2026-03-01')
    // Internal screening fields must never leak into structured data
    expect(JSON.stringify(job)).not.toContain('knockout')
    expect(JSON.stringify(job)).not.toContain('workSample')
  })
})
