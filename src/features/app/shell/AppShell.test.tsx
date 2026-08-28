import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AppProviders } from '@/features/app/AppProviders'
import { AppShell } from './AppShell'

const SIDEBAR_EXPANDED_KEY = 'dutiva.sidebar.expanded.v1'

type LayoutMode = 'desktop' | 'tablet' | 'mobile'

function stubLayoutMode(mode: LayoutMode) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      let matches = false
      if (query === '(min-width: 1024px)') matches = mode === 'desktop'
      else if (query === '(min-width: 768px)') matches = mode === 'desktop' || mode === 'tablet'
      return {
        matches,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }
    }),
  )
}

function renderShell(route = '/app/home') {
  return render(
    <ThemeProvider>
      <LangProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppProviders>
            <Routes>
              <Route path="/app" element={<AppShell />}>
                <Route path="home" element={<div>Home outlet</div>} />
                <Route path="employees" element={<div>People outlet</div>} />
              </Route>
            </Routes>
          </AppProviders>
        </MemoryRouter>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear()
    stubLayoutMode('desktop')
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders desktop chrome with route title, topbar, and outlet content', () => {
    renderShell('/app/home')

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()
    expect(screen.getByText('Home outlet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
  })

  it('persists sidebar expanded preference on desktop', async () => {
    localStorage.setItem(SIDEBAR_EXPANDED_KEY, 'true')
    const user = userEvent.setup()
    renderShell('/app/home')

    expect(screen.getByRole('button', { name: /Create/i })).toHaveTextContent('Create')

    await user.click(screen.getAllByRole('button', { name: 'Collapse sidebar' })[0]!)

    expect(localStorage.getItem(SIDEBAR_EXPANDED_KEY)).toBe('false')
    expect(screen.getByRole('button', { name: /Create/i })).not.toHaveTextContent('Create')
  })

  it('allows sidebar expand on tablet with persisted preference', async () => {
    localStorage.setItem(SIDEBAR_EXPANDED_KEY, 'false')
    stubLayoutMode('tablet')
    const user = userEvent.setup()
    renderShell('/app/home')

    expect(screen.getAllByRole('button', { name: /Expand sidebar/i })[0]).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Expand sidebar' })[0]!)
    expect(localStorage.getItem(SIDEBAR_EXPANDED_KEY)).toBe('true')
    expect(screen.getByRole('button', { name: /Create/i })).toHaveTextContent('Create')
  })

  it('opens and closes the mobile drawer around primary navigation', () => {
    stubLayoutMode('mobile')
    renderShell('/app/home')

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('link', { name: 'People' }))
    expect(screen.getByText('People outlet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the mobile drawer when the scrim is clicked', () => {
    stubLayoutMode('mobile')
    renderShell('/app/home')

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'true')

    const scrim = document.querySelector('.fixed.inset-0.z-60')
    expect(scrim).toBeTruthy()
    fireEvent.click(scrim!)

    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'false')
  })
})
