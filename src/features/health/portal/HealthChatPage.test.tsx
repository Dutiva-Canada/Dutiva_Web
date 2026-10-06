import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearHealthChat,
  loadHealthChatHistory,
  sendHealthChat,
} from '@/features/health/data/api'
import { HealthChatPage } from './HealthChatPage'

/* The page never reads the table directly — history, sending and clearing all
   go through the health-ai function, so the api module is the seam to mock. */
vi.mock('@/features/health/data/api', () => ({
  sendHealthChat: vi.fn(),
  loadHealthChatHistory: vi.fn(),
  clearHealthChat: vi.fn(),
}))

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

function renderPage(lang: Lang = 'en', state?: HealthState) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const health: HealthDataContextValue = {
    state,
    loading: false,
    error: undefined,
    refresh,
  }
  render(
    <LangContext value={langValue(lang)}>
      <HealthDataContext value={health}>
        <ToastsProvider>
          <MemoryRouter initialEntries={['/health/chat']}>
            <HealthChatPage />
          </MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
  return { refresh }
}

describe('HealthChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens with Mira’s greeting and the crisis note when there is no history', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage()

    expect(await screen.findByText(/I’m Mira/)).toBeInTheDocument()
    expect(screen.getByText(/How are you arriving today/)).toBeInTheDocument()
    expect(screen.getByText(/9-8-8/)).toBeInTheDocument()
  })

  it('personalizes the greeting with a live habit streak', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    const localDay = (ago: number) => {
      const d = new Date()
      d.setDate(d.getDate() - ago)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
    }
    const state: HealthState = {
      checkIns: [],
      entries: [],
      habits: [{ id: 'h1', name: 'Walk', createdAt: '2026-09-01T00:00:00Z' }],
      habitLogs: [0, 1, 2].map((ago, i) => ({
        id: `l${i}`,
        habitId: 'h1',
        day: localDay(ago),
        createdAt: new Date().toISOString(),
      })),
      lastLoadedAt: new Date().toISOString(),
    }
    renderPage('en', state)

    expect(await screen.findByText(/“Walk” is on a 3-day streak/)).toBeInTheDocument()
  })

  it('sends a message, renders the reply, and confirms the executed action', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(sendHealthChat).mockResolvedValue({
      reply: 'Done — marked for today.',
      action: { type: 'mark_habit_done', detail: 'Walk', ok: true, refId: 'h1' },
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Tell Mira/)

    fireEvent.change(screen.getByPlaceholderText(/Tell Mira/), {
      target: { value: 'mark Walk done' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendHealthChat).toHaveBeenCalledWith('mark Walk done', 'en'),
    )
    expect(await screen.findByText('Done — marked for today.')).toBeInTheDocument()
    expect(screen.getByText('Marked "Walk" done today')).toBeInTheDocument()
    /* A completed action writes to the health tables — the shared provider
       must refresh so Habits/Insights reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('renders stored history including a stored action', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'add a habit called Stretch',
        action: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Stretch is on your list now.',
        action: { type: 'add_habit', detail: 'Stretch', ok: true, refId: 'h9' },
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('add a habit called Stretch')).toBeInTheDocument()
    expect(screen.getByText('Stretch is on your list now.')).toBeInTheDocument()
    expect(screen.getByText('Now tracking "Stretch"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(clearHealthChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('hi')

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    await waitFor(() => expect(clearHealthChat).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByText('hi')).not.toBeInTheDocument(),
    )
  })

  it('renders the French chrome under lang fr', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/je suis Mira/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })
})
