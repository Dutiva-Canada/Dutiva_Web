/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { RouteErrorPage } from './RouteErrorPage'
import { reportRouteError } from '@/lib/errorReporting'

vi.mock('@/lib/errorReporting', () => ({
  reportRouteError: vi.fn(),
}))

function Boom(): never {
  throw new Error('useTheme must be used within a ThemeProvider')
}

function renderAtError(pathname: string) {
  const router = createMemoryRouter(
    [{ element: <Boom />, errorElement: <RouteErrorPage />, path: '*' }],
    { initialEntries: [pathname] },
  )
  return render(<RouterProvider router={router} />)
}

describe('RouteErrorPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('replaces the router default screen with a recoverable page', () => {
    renderAtError('/')
    expect(screen.getByRole('heading', { name: /could not be displayed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload the page/i })).toBeInTheDocument()
    /* Diagnostics go to telemetry, not the visitor-facing page. */
    expect(screen.getByText(/error details may be used for troubleshooting/i)).toBeInTheDocument()
    expect(screen.queryByText(/useTheme must be used within a ThemeProvider/)).not.toBeInTheDocument()
  })

  it('speaks French under /fr', () => {
    renderAtError('/fr/a-propos')
    expect(screen.getByRole('heading', { name: /pas pu s’afficher/i })).toBeInTheDocument()
  })

  it('reports the caught error to the telemetry sink', () => {
    renderAtError('/')
    expect(reportRouteError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('useTheme') }),
    )
  })

  it('unregisters the service worker and drops every cache before reloading', async () => {
    const unregister = vi.fn().mockResolvedValue(true)
    const remove = vi.fn().mockResolvedValue(true)
    const reload = vi.fn()
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { getRegistrations: vi.fn().mockResolvedValue([{ unregister }]) },
    })
    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue(['dutiva-precache-1', 'dutiva-runtime-1']),
      delete: remove,
    })
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/',
      reload,
    } as unknown as Location)

    renderAtError('/')
    await userEvent.setup().click(screen.getByRole('button', { name: /clear the offline cache/i }))

    expect(unregister).toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('dutiva-precache-1')
    expect(remove).toHaveBeenCalledWith('dutiva-runtime-1')
    expect(reload).toHaveBeenCalled()
  })
})
