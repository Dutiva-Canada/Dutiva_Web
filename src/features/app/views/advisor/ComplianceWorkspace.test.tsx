import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { advisorScenarios } from './advisorScenarios'
import { ComplianceWorkspace } from './ComplianceWorkspace'
import type { AdvisorResponse } from '@/features/app/advisor/contract'

const noop = () => {}

function renderWorkspace(props: Partial<React.ComponentProps<typeof ComplianceWorkspace>>) {
  return renderApp(
    <ComplianceWorkspace
      state={{ kind: 'idle' }}
      mobileOpen={false}
      onCloseMobile={noop}
      {...props}
    />,
    { route: '/app/advisor' },
  )
}

describe('ComplianceWorkspace', () => {
  it('locked (signed out): preview mode with the sign-in form, no payload blocks', () => {
    renderWorkspace({ state: { kind: 'locked' } })
    expect(screen.getByText('Preview mode')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByText('Risk read')).not.toBeInTheDocument()
  })

  it('running: shows the routing skeleton, no payload blocks', () => {
    renderWorkspace({ state: { kind: 'running' } })
    expect(screen.getByText('Checking jurisdiction · retrieving guidance · validating…')).toBeInTheDocument()
    expect(screen.queryByText('Risk read')).not.toBeInTheDocument()
  })

  it('renders the full HR payload when all gates allow (s1)', () => {
    renderWorkspace({ state: { kind: 'ready', response: advisorScenarios.s1.turn.response } })

    expect(screen.getByText('HR compliance advisor')).toBeInTheDocument()
    expect(screen.getByText('Known')).toBeInTheDocument()
    expect(screen.getByText('Ontario · Provincially regulated')).toBeInTheDocument()
    /* Dual risk meters. */
    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('Personal safety')).toBeInTheDocument()
    /* Legal basis rows with per-citation validation badges. */
    expect(screen.getByText('ESA s.57 — Notice of termination')).toBeInTheDocument()
    expect(screen.getAllByText('Valid')).toHaveLength(2)
    expect(screen.getByText('Needs review')).toBeInTheDocument()
    /* Counsel recommendation + retrieval + confidence + quality warning. */
    expect(screen.getByText('Recommended: employment counsel')).toBeInTheDocument()
    expect(screen.getByText('Termination · ON')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText(/1 raw citation was unvetted/)).toBeInTheDocument()
  })

  it('withholds legal basis when the gate is false (s4 — jurisdiction unknown)', () => {
    renderWorkspace({ state: { kind: 'ready', response: advisorScenarios.s4.turn.response } })

    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(
      screen.getByText('Legal basis withheld — jurisdiction is not confirmed.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('ESA s.57 — Notice of termination')).not.toBeInTheDocument()
    /* Retrieval still allowed — jurisdiction-neutral only. */
    expect(screen.getByText('Notice · jurisdiction-neutral')).toBeInTheDocument()
  })

  it('shows province chips on a jurisdiction-unknown payload and reports the pick', () => {
    const onPickProvince = vi.fn()
    renderWorkspace({
      state: { kind: 'ready', response: advisorScenarios.s4.turn.response, provincePrompt: true },
      onPickProvince,
    })
    screen.getByRole('button', { name: 'Quebec' }).click()
    expect(onPickProvince).toHaveBeenCalledWith({ en: 'Quebec', fr: 'Québec' })
  })

  it('supportive triage: support notice shown, every structured surface withheld (s5)', () => {
    renderWorkspace({ state: { kind: 'ready', response: advisorScenarios.s5.turn.response } })

    expect(screen.getByText('Supportive triage')).toBeInTheDocument()
    expect(screen.getByText('Support mode — workspace intentionally off')).toBeInTheDocument()
    expect(screen.getByText('No legal basis in support mode.')).toBeInTheDocument()
    expect(screen.getByText('No HR retrieval in support mode.')).toBeInTheDocument()
    expect(screen.queryByText('Valid')).not.toBeInTheDocument()
  })

  it('current-info: authority-ranked web sources with the not-legal-citations note (s6)', () => {
    renderWorkspace({
      state: { kind: 'ready', response: advisorScenarios.s6.turn.response },
      onToggleWeb: noop,
    })

    expect(screen.getByText('Live web sources')).toBeInTheDocument()
    expect(screen.getByText('ontario.ca/laws')).toBeInTheDocument()
    expect(screen.getAllByText('Legislation').length).toBeGreaterThan(0)
    expect(screen.getByText('Secondary')).toBeInTheDocument()
    expect(screen.getByText(/Web results are not legal citations/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search on' })).toBeInTheDocument()
    /* Internal legal basis is held back in favour of live sources. */
    expect(screen.getByText(/Internal legal basis withheld/)).toBeInTheDocument()
  })

  it('web search off: bounded state with the unavailable reason (s6 toggled)', () => {
    const webOff = advisorScenarios.s6.webOff!
    renderWorkspace({
      state: { kind: 'ready', response: webOff.response },
      onToggleWeb: noop,
    })

    expect(screen.getByRole('button', { name: 'Search off' })).toBeInTheDocument()
    expect(screen.getByText(/Live web search is disabled for this request/)).toBeInTheDocument()
    expect(screen.queryByText('ontario.ca/laws')).not.toBeInTheDocument()
    expect(screen.getByText('Bounded')).toBeInTheDocument()
    expect(screen.getByText(/WEB_SEARCH_ENABLED=false/)).toBeInTheDocument()
  })

  it('isCrisis withholds every surface even when route gates are true', () => {
    const crisis: AdvisorResponse = { ...advisorScenarios.s1.turn.response, isCrisis: true }
    renderWorkspace({ state: { kind: 'ready', response: crisis } })

    expect(screen.queryByText('ESA s.57 — Notice of termination')).not.toBeInTheDocument()
    expect(screen.queryByText('Termination · ON')).not.toBeInTheDocument()
  })

  it('idle with starters: Getting-started prompts on empty home', () => {
    renderWorkspace({
      state: { kind: 'idle' },
      showIdleStarters: true,
      onIdleSend: noop,
      onIdleNavigate: noop,
    })
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText('Go to People')).toBeInTheDocument()
    expect(screen.getByText(/Start with a question/)).toBeInTheDocument()
  })

  it('idle without starters: quiet empty state for an active thread', () => {
    renderWorkspace({ state: { kind: 'idle' }, showIdleStarters: false })
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.queryByText('Go to People')).not.toBeInTheDocument()
    expect(screen.getByText(/Ask a follow-up to refresh/)).toBeInTheDocument()
  })
})
