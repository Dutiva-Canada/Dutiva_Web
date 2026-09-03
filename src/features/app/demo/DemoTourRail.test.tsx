import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LangProvider } from '@/i18n/LangProvider'
import { PublicDemoProvider } from '@/features/app/workspaceRoot/PublicDemoProvider'
import { DemoTourRail } from './DemoTourRail'

function renderTour(pathname: string) {
  return render(
    <LangProvider>
      <PublicDemoProvider root="/demo">
        <MemoryRouter initialEntries={[pathname]}>
          <DemoTourRail />
        </MemoryRouter>
      </PublicDemoProvider>
    </LangProvider>,
  )
}

describe('DemoTourRail', () => {
  it('renders tour stops on the public demo workspace', () => {
    renderTour('/demo/home')
    expect(screen.getByRole('complementary', { name: /product tour/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dutiva Advisor/i })).toHaveAttribute(
      'href',
      '/demo/advisor',
    )
    expect(screen.getByRole('link', { name: /Templates/i })).toHaveAttribute(
      'href',
      '/demo/documents/studio',
    )
  })

  it('does not render outside the public demo surface', () => {
    render(
      <LangProvider>
        <MemoryRouter initialEntries={['/app/home']}>
          <DemoTourRail />
        </MemoryRouter>
      </LangProvider>,
    )
    expect(screen.queryByRole('complementary', { name: /product tour/i })).not.toBeInTheDocument()
  })
})
