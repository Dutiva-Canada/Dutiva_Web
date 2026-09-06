import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { CommsView } from './CommsView'
import { Overview } from './screens/Overview'
import { Initiatives } from './screens/Initiatives'
import { ContentCalendar } from './screens/ContentCalendar'
import { Relationships } from './screens/Relationships'
import { Engagement } from './screens/Engagement'
import { Intelligence } from './screens/Intelligence'
import { Results } from './screens/Results'
import { Settings } from './screens/Settings'

function renderAt(route: string) {
  return renderApp(
    <Routes>
      <Route path="/app/comms/*" element={<CommsView />}>
        <Route path="overview" element={<Overview />} />
        <Route path="initiatives" element={<Initiatives />} />
        <Route path="content" element={<ContentCalendar />} />
        <Route path="relationships" element={<Relationships />} />
        <Route path="engagement" element={<Engagement />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="results" element={<Results />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>,
    { route, path: '*' },
  )
}

describe('CommsView', () => {
  it('renders the workspace shell with all navigation tabs', () => {
    renderAt('/app/comms/overview')

    expect(screen.getByRole('heading', { name: 'Communications' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Initiatives' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Content & calendar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Relationships' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Engagement' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Intelligence & issues' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Results' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('shows the pilot launch initiative on the overview', () => {
    renderAt('/app/comms/overview')

    expect(screen.getByText('Bilingual product launch')).toBeInTheDocument()
    expect(screen.getByText('Federal AI-in-HR consultation')).toBeInTheDocument()
  })

  it('lists the launch content items on the content tab', () => {
    renderAt('/app/comms/content')

    expect(screen.getByText('English launch announcement')).toBeInTheDocument()
    expect(screen.getByText('French launch announcement')).toBeInTheDocument()
    expect(screen.getByText('Press pitch')).toBeInTheDocument()
  })

  it('shows the restricted HR handoff issue without leaking the underlying case', () => {
    renderAt('/app/comms/intelligence')

    expect(screen.getByText('HR handoff — conduct review')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This issue is restricted. The communications workspace cannot open the underlying HR case.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the policy consultation as a separate public-affairs initiative', () => {
    renderAt('/app/comms/initiatives')

    expect(screen.getByText('Federal AI-in-HR consultation')).toBeInTheDocument()
  })
})
