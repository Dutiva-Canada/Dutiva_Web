import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { HealthDataPage } from './HealthDataPage'

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  exportHealthData: vi.fn(),
  listAllJournalEntries: vi.fn(),
  deleteAllHealthData: vi.fn(),
}))

vi.mock('@/lib/notifications/notifyPrefs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/notifications/notifyPrefs')>()),
  remindersAvailable: vi.fn(),
  loadReminderPref: vi.fn(),
  setReminderPref: vi.fn(),
}))

const api = await import('@/features/health/data/api')
const prefs = await import('@/lib/notifications/notifyPrefs')

function langValue(lang: Lang): LangContextValue {
  return {
    lang,
    setLang: vi.fn(),
    catalogue: {},
    t: ((key: string) => key) as LangContextValue['t'],
    L: (en: string, fr: string) => (lang === 'fr' ? fr : en),
    x: (m: { en: string; fr: string }) => (lang === 'fr' ? m.fr : m.en),
  }
}

function stateWith(over: Partial<HealthState> = {}): HealthState {
  return {
    checkIns: [],
    entries: [],
    habits: [],
    memories: [],
    habitLogs: [],
    lastLoadedAt: new Date().toISOString(),
    ...over,
  }
}

function renderPage(lang: Lang = 'en') {
  const health: HealthDataContextValue = {
    state: stateWith(),
    loading: false,
    error: undefined,
    refresh: vi.fn().mockResolvedValue(undefined),
  }
  return {
    refresh: health.refresh,
    ...render(
      <LangContext value={langValue(lang)}>
        <HealthDataContext value={health}>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/health/data']}>
              <HealthDataPage />
              <ToastHost />
            </MemoryRouter>
          </ToastsProvider>
        </HealthDataContext>
      </LangContext>,
    ),
  }
}

const createUrl = vi.fn(() => 'blob:mock')
const revokeUrl = vi.fn()

beforeAll(() => {
  /* jsdom has no blob URLs — the download helper only needs them to exist. */
  Object.defineProperty(URL, 'createObjectURL', {
    value: createUrl,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: revokeUrl,
    writable: true,
    configurable: true,
  })
})

describe('HealthDataPage', () => {
  beforeEach(() => {
    /* Default: migration 0227 not applied — the reminder card stays away. */
    vi.mocked(prefs.remindersAvailable).mockResolvedValue(false)
    vi.mocked(api.exportHealthData).mockResolvedValue({
      exportedAt: '2026-10-15T00:00:00Z',
      checkIns: [],
      journalEntries: [],
      habits: [],
      habitLogs: [],
      memories: [],
      chatThreads: [],
      chatMessages: [],
    })
    vi.mocked(api.deleteAllHealthData).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('hides the reminder card when the reminder column does not exist yet', async () => {
    renderPage()
    expect(await screen.findByText('Take it with you')).toBeInTheDocument()
    await waitFor(() => expect(prefs.remindersAvailable).toHaveBeenCalled())
    expect(screen.queryByText('Evening reminder')).not.toBeInTheDocument()
  })

  it('downloads the full JSON export', async () => {
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Download everything (JSON)' }),
    )
    await waitFor(() => expect(api.exportHealthData).toHaveBeenCalled())
    expect(createUrl).toHaveBeenCalled()
    expect(
      await screen.findByText('Download started — check your downloads folder.'),
    ).toBeInTheDocument()
  })

  it('writes a readable journal file only when entries exist', async () => {
    vi.mocked(api.listAllJournalEntries).mockResolvedValue([])
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Journal as readable text (.md)' }),
    )
    expect(
      await screen.findByText('No journal entries yet — nothing to write out.'),
    ).toBeInTheDocument()
    expect(createUrl).not.toHaveBeenCalled()
  })

  it('shows and toggles the reminder once the migration has landed', async () => {
    vi.mocked(prefs.remindersAvailable).mockResolvedValue(true)
    vi.mocked(prefs.loadReminderPref).mockResolvedValue(false)
    renderPage()
    const box = await screen.findByRole('checkbox', {
      name: /Email me in the evening if I haven’t checked in today/,
    })
    expect(box).not.toBeChecked()
    fireEvent.click(box)
    await waitFor(() =>
      expect(prefs.setReminderPref).toHaveBeenCalledWith('health', true),
    )
    expect(await screen.findByText(/Reminder on/)).toBeInTheDocument()
  })

  it('arms, then deletes everything and refreshes the cached state', async () => {
    const { refresh } = renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete all my health data' }),
    )
    /* First press only arms — the delete must take a second, deliberate click. */
    expect(api.deleteAllHealthData).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', { name: 'No undo — click again to delete' }),
    )
    await waitFor(() => expect(api.deleteAllHealthData).toHaveBeenCalled())
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(await screen.findByText('Your health data is deleted.')).toBeInTheDocument()
  })

  it('reports a failed delete instead of claiming success', async () => {
    vi.mocked(api.deleteAllHealthData).mockRejectedValue(new Error('boom'))
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete all my health data' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'No undo — click again to delete' }),
    )
    expect(
      await screen.findByText('Couldn’t delete everything — try again.'),
    ).toBeInTheDocument()
  })

  it('renders in French', async () => {
    renderPage('fr')
    expect(await screen.findByText('Vos données')).toBeInTheDocument()
    expect(screen.getByText('Emportez vos données')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Effacer toutes mes données Santé' }),
    ).toBeInTheDocument()
  })
})
