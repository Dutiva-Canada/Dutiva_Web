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
  rateHealthChatTurn,
  sendHealthChat,
  undoHealthChatAction,
} from '@/features/health/data/api'
import { HealthChatPage } from './HealthChatPage'

/* The page never reads the table directly — history, sending, rating,
   undo and clearing all go through the health-ai function, so the api
   module is the seam to mock. */
vi.mock('@/features/health/data/api', () => ({
  sendHealthChat: vi.fn(),
  loadHealthChatHistory: vi.fn(),
  clearHealthChat: vi.fn(),
  rateHealthChatTurn: vi.fn(),
  undoHealthChatAction: vi.fn(),
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
      assistantId: '11111111-2222-3333-4444-555555555555',
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Tell Mira/)

    fireEvent.change(screen.getByPlaceholderText(/Tell Mira/), {
      target: { value: 'mark Walk done' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    /* The third argument is the streaming onDelta callback. */
    await waitFor(() =>
      expect(sendHealthChat).toHaveBeenCalledWith('mark Walk done', 'en', expect.any(Function)),
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
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Stretch is on your list now.',
        action: { type: 'add_habit', detail: 'Stretch', ok: true, refId: 'h9' },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('add a habit called Stretch')).toBeInTheDocument()
    expect(screen.getByText('Stretch is on your list now.')).toBeInTheDocument()
    expect(screen.getByText('Now tracking "Stretch"')).toBeInTheDocument()
    /* The undo affordance only rides on persisted (uuid-id) assistant turns
       — 'a1' is not one, so no Undo button appears. */
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('offers undo on a persisted action and marks it undone', async () => {
    const assistantId = '11111111-2222-3333-4444-555555555555'
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: assistantId,
        role: 'assistant',
        content: 'Marked Walk done.',
        action: {
          type: 'mark_habit_done',
          detail: 'Walk',
          ok: true,
          refId: 'h1',
          day: '2026-10-05',
        },
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(undoHealthChatAction).mockResolvedValue(undefined)
    const { refresh } = renderPage()
    await screen.findByText('Marked Walk done.')

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(undoHealthChatAction).toHaveBeenCalledWith(assistantId))
    /* The chip flips to Undone and the undo button is gone — the same state
       a reload would render from the stored action. */
    expect(await screen.findByText('Undone')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
  })

  it('does not offer undo on an action that already failed', async () => {
    const assistantId = '11111111-2222-3333-4444-555555555555'
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: assistantId,
        role: 'assistant',
        content: 'I tried.',
        action: { type: 'mark_habit_done', detail: 'Walk', ok: false },
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    renderPage()
    await screen.findByText('I tried.')

    expect(screen.getByText(/didn’t save/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        feedback: null,
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

  it('rates an assistant turn thumbs-up and persists it', async () => {
    const assistantId = '11111111-2222-3333-4444-555555555555'
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: assistantId,
        role: 'assistant',
        content: 'That sounds heavy.',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(rateHealthChatTurn).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('That sounds heavy.')

    const up = screen.getByRole('button', { name: 'Helpful' })
    fireEvent.click(up)
    await waitFor(() => expect(rateHealthChatTurn).toHaveBeenCalledWith(assistantId, 1))
    expect(up).toHaveAttribute('aria-pressed', 'true')
  })

  it('re-rating clears the thumbs on a second click', async () => {
    const assistantId = '11111111-2222-3333-4444-555555555555'
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: assistantId,
        role: 'assistant',
        content: 'One reply.',
        action: null,
        feedback: 1,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(rateHealthChatTurn).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('One reply.')

    const up = screen.getByRole('button', { name: 'Helpful' })
    expect(up).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(up)
    await waitFor(() => expect(rateHealthChatTurn).toHaveBeenCalledWith(assistantId, 0))
    expect(up).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders the French chrome under lang fr', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/je suis Mira/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })
})
