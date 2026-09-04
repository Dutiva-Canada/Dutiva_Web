import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { appendExportAudit, clearExportAudit } from '@/lib/exportProtection'
import { SettingsView } from './SettingsView'

describe('SettingsView', () => {
  it('renders workspace, team, retention, billing, and audit content', () => {
    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })

    // No workspace-mode toggle for a signed-out / non-admin visitor.
    expect(screen.queryByRole('tablist', { name: 'Workspace mode' })).not.toBeInTheDocument()

    // Workspace card
    expect(screen.getByText('Northgate Logistics Inc.')).toBeInTheDocument()
    expect(screen.getByText('Federally regulated')).toBeInTheDocument()
    expect(screen.getByText('Ottawa (HQ) · Montréal · Vancouver')).toBeInTheDocument()

    // Team + preference toggles
    expect(screen.getByText('Riley Summers')).toBeInTheDocument()
    expect(screen.getByText('Partner counsel (external)')).toBeInTheDocument()
    expect(screen.getByText('Daily email digest')).toBeInTheDocument()
    expect(screen.getByText('Use workspace context in Advisor')).toBeInTheDocument()

    // Retention, security, billing, audit
    expect(screen.getByText('7 years after employment ends (ESA/CRA)')).toBeInTheDocument()
    expect(screen.getByText('Canada (Montréal region)')).toBeInTheDocument()
    expect(
      screen.getByText('Growth plan — sample invoice line for the demo walkthrough'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Riley Summers viewed compensation — Jordan Mensah'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('These switches remember your choice on this browser. Delivery isn’t live yet.'),
    ).toBeInTheDocument()
  })

  it('shows the device export trail: empty state, then real recorded exports', () => {
    clearExportAudit()
    const { unmount } = renderApp(<SettingsView />, {
      route: '/app/settings',
      path: '/app/settings',
    })
    expect(screen.getByText('No exports recorded on this device yet.')).toBeInTheDocument()
    unmount()

    appendExportAudit({
      exportId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      surface: 'docstudio',
      kind: 'pdf',
      title: 'Termination Letter',
      contentSha256: 'a'.repeat(64),
      contentChars: 1200,
      lang: 'en',
      actorLabel: 'Amara Osei (amara@northgate.ca)',
      at: '2026-07-30T18:04:30Z',
      recordedRemotely: false,
    })
    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })
    expect(
      screen.getByText(/Termination Letter · PDF · by Amara Osei \(amara@northgate\.ca\)/),
    ).toBeInTheDocument()
    expect(screen.getByText('2026-07-30 18:04')).toBeInTheDocument()
    clearExportAudit()
  })

  it('flips a preference toggle on click (autoEscalate starts off)', async () => {
    const user = userEvent.setup()
    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })

    const toggle = screen.getByRole('switch', { name: 'Auto-suggest legal escalation' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    const emailDigest = screen.getByRole('switch', { name: 'Daily email digest' })
    expect(emailDigest).toHaveAttribute('aria-checked', 'true')
  })

  it('clears the calendar-sync error state via Retry', async () => {
    const user = userEvent.setup()
    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })

    // Prototype starts with integrationError: true — two Connected + one error.
    expect(screen.getByText('Connection error')).toBeInTheDocument()
    expect(screen.getAllByText('Connected')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.queryByText('Connection error')).not.toBeInTheDocument()
    expect(screen.getAllByText('Connected')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })

  it('points demo billing at Pricing instead of a fake portal toast', () => {
    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })
    expect(screen.getByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/pricing')
  })

  it('persists preference toggles on this device', async () => {
    const user = userEvent.setup()
    localStorage.removeItem('dutiva.settings.prefs.v1')
    const { unmount } = renderApp(<SettingsView />, {
      route: '/app/settings',
      path: '/app/settings',
    })
    const toggle = screen.getByRole('switch', { name: 'Auto-suggest legal escalation' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    unmount()

    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })
    expect(screen.getByRole('switch', { name: 'Auto-suggest legal escalation' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    localStorage.removeItem('dutiva.settings.prefs.v1')
  })

  it('switches the app language from the Language segment', async () => {
    const user = userEvent.setup()
    renderApp(<SettingsView />, { route: '/app/settings', path: '/app/settings' })

    expect(screen.getByText('Appearance')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Français' }))

    expect(screen.getByText('Apparence')).toBeInTheDocument()
    expect(screen.getByText('Données et confidentialité')).toBeInTheDocument()
    expect(screen.getByText('Sous réglementation fédérale')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'English' }))
    expect(screen.getByText('Appearance')).toBeInTheDocument()
  })
})

describe('SettingsView workspace-mode toggle (admin only)', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('lets a confirmed admin switch to production and back', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    let storedMode: 'demo' | 'production' = 'demo'

    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn((fn: string) => {
          if (fn === 'is_admin_user') return Promise.resolve({ data: true, error: null })
          if (fn === 'create_organization') {
            return Promise.resolve({ data: { id: 'org-1' }, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn((table: string) => {
          if (table === 'workspace_preferences') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { mode: storedMode }, error: null }),
                }),
              }),
              upsert: (row: { mode: 'demo' | 'production' }) => {
                storedMode = row.mode
                return upsert(row)
              },
            }
          }
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      legal_name: 'Dutiva Canada Inc.',
                      company_name: null,
                      primary_contact: 'Martin Constantineau',
                      province: 'Ontario',
                      city: 'Ottawa',
                    },
                    error: null,
                  }),
              }),
            }),
          }
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { SettingsView: SettingsViewFresh } = await import('./SettingsView')
    const user = userEvent.setup()

    renderAppFresh(<SettingsViewFresh />, { route: '/app/settings', path: '/app/settings' })

    const tablist = await screen.findByRole('tablist', { name: 'Workspace mode' })
    expect(tablist).toBeInTheDocument()
    // Still demo until the admin explicitly switches.
    expect(screen.getByText('Northgate Logistics Inc.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Production' }))

    expect(await screen.findByDisplayValue('Dutiva Canada Inc.')).toBeInTheDocument()
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', mode: 'production' }),
    )

    /* Workspace card swaps to the real region; the Northgate fixture
       sections (team, audit log, integrations & billing) disappear. */
    expect(screen.getByDisplayValue('Ottawa')).toBeInTheDocument()
    expect(screen.queryByText('Ottawa (HQ) · Montréal · Vancouver')).not.toBeInTheDocument()
    expect(screen.queryByText('Riley Summers')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Riley Summers viewed compensation — Jordan Mensah'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Integrations & billing')).not.toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See plans' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Demo' }))
    expect(await screen.findByText('Northgate Logistics Inc.')).toBeInTheDocument()
    expect(screen.getByText('Riley Summers')).toBeInTheDocument()
  })
})
