import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { useOpenCreateFormFromQuery } from './useOpenCreateFormFromQuery'

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="search">
      {location.pathname}
      {location.search}
    </div>
  )
}

describe('useOpenCreateFormFromQuery', () => {
  it('opens the form when ?new=1 is present and strips the query', async () => {
    const { result } = renderHook(() => useOpenCreateFormFromQuery(true), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/app/employees?new=1']}>
          <Routes>
            <Route
              path="/app/employees"
              element={
                <>
                  {children}
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      ),
    })

    await waitFor(() => {
      expect(result.current.formOpen).toBe(true)
    })
    expect(screen.getByTestId('search')).toHaveTextContent('/app/employees')
    expect(screen.getByTestId('search').textContent).not.toContain('new=1')
  })

  it('does not open when enabled is false', async () => {
    const { result } = renderHook(() => useOpenCreateFormFromQuery(false), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/app/employees?new=1']}>
          <Routes>
            <Route path="/app/employees" element={children} />
          </Routes>
        </MemoryRouter>
      ),
    })

    expect(result.current.formOpen).toBe(false)
  })
})

describe('useOpenCreateFormFromQuery via renderApp', () => {
  it('keeps form closed without the query', () => {
    function Probe() {
      const { formOpen } = useOpenCreateFormFromQuery(true)
      return <div>{formOpen ? 'open' : 'closed'}</div>
    }
    renderApp(<Probe />, { route: '/app/employees' })
    expect(screen.getByText('closed')).toBeInTheDocument()
  })
})
