import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AppProviders } from '@/features/app/AppProviders'
import { PlanningLayout } from './PlanningLayout'

function renderPlanning(route: string) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppProviders>
            <Routes>
              <Route path="/app/planning" element={<PlanningLayout />}>
                <Route path="tasks" element={<div>Tasks pane</div>} />
                <Route path="calendar" element={<div>Calendar pane</div>} />
              </Route>
            </Routes>
          </AppProviders>
        </MemoryRouter>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PlanningLayout', () => {
  it('marks Tasks active on /app/planning/tasks and renders the child outlet', () => {
    renderPlanning('/app/planning/tasks')
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Calendar' })).not.toHaveAttribute('aria-current')
    expect(screen.getByText('Tasks pane')).toBeInTheDocument()
  })

  it('marks Calendar active on /app/planning/calendar', () => {
    renderPlanning('/app/planning/calendar')
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Tasks' })).not.toHaveAttribute('aria-current')
    expect(screen.getByText('Calendar pane')).toBeInTheDocument()
  })
})
