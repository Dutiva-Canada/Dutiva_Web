import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import {
  clearHealthChat,
  deleteHealthChatThread,
  deleteHealthChatTurn,
  healthVoiceTranscribeAvailable,
  listHealthChatThreads,
  loadHealthChatHistory,
  newHealthChatThread,
  rateHealthChatTurn,
  regenerateHealthChat,
  renameHealthChatThread,
  sendHealthChat,
  transcribeHealthAudio,
  undoHealthChatAction,
} from '@/features/health/data/api'
import { HealthChatPage } from './HealthChatPage'

/* The page never reads the table directly — history, sending, rating,
   undo and clearing all go through the health-ai function, so the api
   module is the seam to mock. */
vi.mock('@/features/health/data/api', () => ({
  sendHealthChat: vi.fn(),
  regenerateHealthChat: vi.fn(),
  listHealthChatThreads: vi.fn(async () => ({ threads: [], activity: {} })),
  newHealthChatThread: vi.fn(),
  renameHealthChatThread: vi.fn(async () => undefined),
  deleteHealthChatThread: vi.fn(async () => undefined),
  deleteHealthChatTurn: vi.fn(async () => undefined),
  loadHealthChatHistory: vi.fn(),
  clearHealthChat: vi.fn(),
  rateHealthChatTurn: vi.fn(),
  undoHealthChatAction: vi.fn(),
  /* Server-transcription seam — the probe defaults to false so speech-API
     tests stay on the browser engine; server-engine tests opt in. */
  healthVoiceTranscribeAvailable: vi.fn(async () => false),
  transcribeHealthAudio: vi.fn(),
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

function renderPage(lang: Lang = 'en', state?: HealthState, auth: Partial<AuthContextValue> = {}) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const health: HealthDataContextValue = {
    state,
    loading: false,
    error: undefined,
    refresh,
  }
  const authValue: AuthContextValue = {
    status: 'signed-in',
    session: { user: { id: 'u1', email: 'client@acme.ca' } } as AuthContextValue['session'],
    authorized: true,
    signInWithEmail: vi.fn(async () => undefined),
    verifyEmailCode: vi.fn(async () => undefined),
    signOut: vi.fn(async () => {}),
    refreshAuthorization: vi.fn(async () => {}),
    ...auth,
  }
  render(
    <LangContext value={langValue(lang)}>
      <AuthContext.Provider value={authValue}>
        <HealthDataContext value={health}>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/wellness/chat']}>
              <HealthChatPage />
            </MemoryRouter>
            <ToastHost />
          </ToastsProvider>
        </HealthDataContext>
      </AuthContext.Provider>
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

  it('shows the generic subtitle to external accounts and the internal one to @dutiva.ca', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/not a person or a therapist/)).toBeInTheDocument()
    expect(screen.queryByText('Internal')).not.toBeInTheDocument()
  })

  it('swaps the subtitle and shows the Internal badge for @dutiva.ca', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage('en', undefined, {
      session: { user: { id: 'u9', email: 'staff@dutiva.ca' } } as AuthContextValue['session'],
    })
    /* The internal variant adds the plain-spoken clause but keeps the
       software disclaimer — the most directive tier still needs it. */
    expect(await screen.findByText(/on this internal account/)).toBeInTheDocument()
    expect(screen.getByText('Internal')).toBeInTheDocument()
    expect(screen.getByText(/not a person or a therapist/)).toBeInTheDocument()
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
      memories: [],
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
      userId: '11111111-2222-3333-4444-555555555556',
      assistantId: '11111111-2222-3333-4444-555555555555',
      suggests: [],
      reasoning: null,
      context: null,
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Tell Mira/)

    fireEvent.change(screen.getByPlaceholderText(/Tell Mira/), {
      target: { value: 'mark Walk done' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    /* The third argument is the streaming onDelta callback. */
    await waitFor(() =>
      expect(sendHealthChat).toHaveBeenCalledWith(
        'mark Walk done',
        'en',
        expect.any(Function),
        { signal: expect.anything(), threadId: null, onReasoning: expect.any(Function) },
      ),
    )
    expect(await screen.findByText('Done — marked for today.')).toBeInTheDocument()
    expect(screen.getByText('Marked “Walk” done today')).toBeInTheDocument()
    /* A completed action writes to the health tables — the shared provider
       must refresh so Habits/Insights reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('does not duplicate the user bubble when the poll lands the persisted pair', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const userRowId = '11111111-2222-3333-4444-555555555556'
      const assistantId = '11111111-2222-3333-4444-555555555555'
      vi.mocked(loadHealthChatHistory).mockResolvedValue([])
      vi.mocked(sendHealthChat).mockResolvedValue({
        reply: 'Noted.',
        action: null,
        userId: userRowId,
        assistantId,
        suggests: [],
        reasoning: null,
        context: null,
      })
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)

      fireEvent.change(screen.getByPlaceholderText(/Tell Mira/), {
        target: { value: 'ping' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
      expect(await screen.findByText('Noted.')).toBeInTheDocument()

      /* The 45s history poll lands the persisted rows — the optimistic
         bubble already carries the real row id, so nothing new appends.
         Without the adoption it would come back as a stranger and
         duplicate under the reply. */
      vi.mocked(loadHealthChatHistory).mockResolvedValue([
        {
          id: userRowId,
          role: 'user',
          content: 'ping',
          action: null,
          feedback: null,
          createdAt: '2026-10-13T10:01:00Z',
        },
        {
          id: assistantId,
          role: 'assistant',
          content: 'Noted.',
          action: null,
          reasoning: null,
          feedback: null,
          createdAt: '2026-10-13T10:01:01Z',
        },
      ])
      await vi.advanceTimersByTimeAsync(45_000)
      await waitFor(() => expect(screen.getAllByText('ping')).toHaveLength(1))
    } finally {
      vi.useRealTimers()
    }
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
    expect(screen.getByText('Now tracking “Stretch”')).toBeInTheDocument()
    /* The undo affordance only rides on persisted (uuid-id) assistant turns
       — 'a1' is not one, so no Undo button appears. */
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear this conversation' })).toBeInTheDocument()
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

  it('clears the conversation via the function after a two-tap confirm', async () => {
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

    /* First tap only arms — nothing is destroyed on one stray click. */
    fireEvent.click(screen.getByRole('button', { name: 'Clear this conversation' }))
    expect(
      await screen.findByRole('button', { name: 'Click again to confirm' }),
    ).toBeInTheDocument()
    expect(clearHealthChat).not.toHaveBeenCalled()
    expect(screen.getByText('hi')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Click again to confirm' }))
    await waitFor(() => expect(clearHealthChat).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('hi')).not.toBeInTheDocument())
  })

  it('disables the clear button while a send is in flight', async () => {
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
    let resolveSend: ((v: Awaited<ReturnType<typeof sendHealthChat>>) => void) | undefined
    vi.mocked(sendHealthChat).mockImplementation(
      () => new Promise((resolve) => (resolveSend = resolve)),
    )
    renderPage()
    await screen.findByText('hi')

    fireEvent.change(screen.getByPlaceholderText(/Tell Mira/), {
      target: { value: 'one more' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    /* Clearing mid-stream would resurrect the thread when the in-flight
       send persists — the button is inert until the send resolves. */
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Clear this conversation' })).toBeDisabled(),
    )
    resolveSend?.({
      reply: 'Noted.',
      action: null,
      userId: 'u2',
      assistantId: 'a2',
      suggests: [],
      reasoning: null,
      context: null,
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Clear this conversation' })).toBeEnabled(),
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

  it('restores the previous pair when a regenerate call fails', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: '11111111-2222-3333-4444-555555555551',
        role: 'user',
        content: 'first try',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: '11111111-2222-3333-4444-555555555552',
        role: 'assistant',
        content: 'First answer.',
        action: null,
        reasoning: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(regenerateHealthChat).mockRejectedValue(new Error('upstream down'))
    renderPage()
    await screen.findByText('First answer.')

    fireEvent.click(screen.getByRole('button', { name: 'Try another answer' }))

    /* The optimistic re-ask removes the pair locally; on failure the page
       reloads history so the preserved rows come back rather than leaving
       a bare question with no answer. */
    await waitFor(() => expect(screen.getByText('First answer.')).toBeInTheDocument())
    expect(loadHealthChatHistory).toHaveBeenCalledTimes(2)
  })

  it('ignores Enter while an IME composition is open', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(sendHealthChat).mockResolvedValue({
      reply: 'Noted.',
      action: null,
      userId: 'u2',
      assistantId: 'a2',
      suggests: [],
      reasoning: null,
      context: null,
    })
    renderPage()
    const input = await screen.findByPlaceholderText(/Tell Mira/)

    fireEvent.change(input, { target: { value: 'konnichi' } })
    /* Confirming a composed candidate fires Enter — it must not send. */
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(sendHealthChat).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(sendHealthChat).toHaveBeenCalled())
  })

  it('renders the French chrome under lang fr', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/je suis Mira/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })

  it('shows an honest error with retry when the history load fails', async () => {
    vi.mocked(loadHealthChatHistory)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([
        {
          id: 'u1',
          role: 'user',
          content: 'back again',
          action: null,
          feedback: null,
          createdAt: '2026-10-05T12:00:00Z',
        },
      ])
    renderPage()

    /* No greeting claiming a fresh start — the load failure owns the log. */
    expect(await screen.findByText('The conversation didn’t load.')).toBeInTheDocument()
    expect(screen.queryByText(/I’m Mira/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('back again')).toBeInTheDocument()
  })

  it('cannot send while the history is still loading', async () => {
    let resolveHistory: ((rows: Awaited<ReturnType<typeof loadHealthChatHistory>>) => void) | undefined
    vi.mocked(loadHealthChatHistory).mockImplementation(
      () => new Promise((resolve) => (resolveHistory = resolve)),
    )
    renderPage()
    const input = await screen.findByPlaceholderText(/Tell Mira/)
    fireEvent.change(input, { target: { value: 'early send' } })
    /* Send stays inert — a send now would be wiped when history resolves. */
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    expect(sendHealthChat).not.toHaveBeenCalled()

    resolveHistory?.([])
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled())
  })

  it('marks a stop mid-stream instead of passing the partial off as done', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(sendHealthChat).mockImplementation(async (_m, _l, onDelta) => {
      onDelta?.('I was saying')
      throw new DOMException('stopped', 'AbortError')
    })
    renderPage()
    const input = await screen.findByPlaceholderText(/Tell Mira/)
    fireEvent.change(input, { target: { value: 'hi' } })
    /* The composer mounts before history resolves — Send only ungates
       once the log does. */
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(sendHealthChat).toHaveBeenCalled())
    expect(await screen.findByText('I was saying')).toBeInTheDocument()
    expect(screen.getByText('Stopped early')).toBeInTheDocument()
  })

  it('echoes what the reply drew on under the answer', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(sendHealthChat).mockResolvedValue({
      reply: 'A steady week.',
      action: null,
      userId: 'u9',
      assistantId: '11111111-2222-3333-4444-555555555555',
      suggests: [],
      reasoning: null,
      context: { checkins: 4, habits: 0, memories: 1, journals: 0 },
    })
    renderPage()
    const input = await screen.findByPlaceholderText(/Tell Mira/)
    fireEvent.change(input, { target: { value: 'how was my week' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('A steady week.')).toBeInTheDocument()
    expect(screen.getByText('Drew on: 4 check-ins · 1 saved memory')).toBeInTheDocument()
  })

  it('deletes a user turn and its paired reply after the two-step confirm', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: '11111111-2222-3333-4444-555555555551',
        role: 'user',
        content: 'take this out',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        /* Stamped exactly 1ms after the user row — the server pairs them
           by that stamp, so one delete drops both. */
        id: '11111111-2222-3333-4444-555555555552',
        role: 'assistant',
        content: 'Gone with it.',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00.001Z',
      },
    ])
    renderPage()
    await screen.findByText('take this out')

    const del = screen.getAllByRole('button', { name: 'Delete this message' }).at(0)!
    fireEvent.click(del)
    expect(deleteHealthChatTurn).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Sure?' }))
    await waitFor(() =>
      expect(deleteHealthChatTurn).toHaveBeenCalledWith(
        '11111111-2222-3333-4444-555555555551',
      ),
    )
    await waitFor(() => {
      expect(screen.queryByText('take this out')).not.toBeInTheDocument()
      expect(screen.queryByText('Gone with it.')).not.toBeInTheDocument()
    })
  })

  it('pins the crisis line under a distress message and lets it be dismissed', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(sendHealthChat).mockResolvedValue({
      reply: 'I hear you.',
      action: null,
      userId: 'u9',
      assistantId: 'a9',
      suggests: [],
      reasoning: null,
      context: null,
    })
    renderPage()
    const input = await screen.findByPlaceholderText(/Tell Mira/)
    fireEvent.change(input, { target: { value: 'I want to die' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    /* The standing note is already under the composer — the pin adds a
       second one beside the bubble that asked for it. */
    await waitFor(() =>
      expect(screen.getAllByText(/9-8-8/).length).toBeGreaterThan(1),
    )
    const note = document.querySelector('.sbchat-crisis-inline')
    expect(note).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(document.querySelector('.sbchat-crisis-inline')).not.toBeInTheDocument()
  })

  it('copies the whole transcript from the header', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'first line',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'answer line',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()
    await screen.findByText('first line')

    fireEvent.click(screen.getByRole('button', { name: 'Copy conversation' }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    const text = writeText.mock.calls.at(0)![0] as string
    expect(text).toContain('You ·')
    expect(text).toContain('first line')
    expect(text).toContain('Mira ·')
    expect(text).toContain('answer line')
  })

  it('renames and deletes a named thread from the switcher', async () => {
    vi.mocked(listHealthChatThreads).mockResolvedValue({
      threads: [{ id: 't1', title: 'Sleep notes', createdAt: '2026-10-01T00:00:00Z' }],
      activity: {},
    })
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Main conversation/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }))
    const input = screen.getByRole('textbox', { name: 'Conversation name' })
    fireEvent.change(input, { target: { value: 'Mornings' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() =>
      expect(renameHealthChatThread).toHaveBeenCalledWith('t1', 'Mornings'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sure?' }))
    await waitFor(() => expect(deleteHealthChatThread).toHaveBeenCalledWith('t1'))
    expect(screen.queryByRole('menuitemradio', { name: 'Sleep notes' })).not.toBeInTheDocument()
  })

  it('resurfaces the starters on a conversation quiet for over a day', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'a while ago',
        action: null,
        feedback: null,
        createdAt: '2026-01-01T12:00:00Z',
      },
    ])
    renderPage()
    await screen.findByText('a while ago')
    expect(screen.getByText('Start with')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'How has my week been?' })).toBeInTheDocument()
  })

  it('hides the voice-call button where the browser lacks the speech APIs', async () => {
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    renderPage()
    await screen.findByPlaceholderText(/Tell Mira/)
    /* jsdom ships neither SpeechRecognition nor speechSynthesis — the
       gate must not advertise a call that can't start. */
    expect(screen.queryByRole('button', { name: 'Voice call' })).not.toBeInTheDocument()
  })

  it('runs a spoken turn through the normal send pipe and speaks the reply', async () => {
    /* Minimal Web Speech fakes — jsdom has neither half. The fake
       recognition records instances so the test can drive an utterance. */
    type Result = { isFinal: boolean; 0: { transcript: string } }
    class FakeRecognition {
      static instances: FakeRecognition[] = []
      lang = ''
      interimResults = false
      continuous = true
      onresult: ((e: { results: ArrayLike<Result> }) => void) | null = null
      onerror: ((e: { error?: string }) => void) | null = null
      onend: (() => void) | null = null
      start() {
        FakeRecognition.instances.push(this)
      }
      abort() {
        this.onend?.()
      }
      /* One finished utterance — continuous=false means onend is the send
         trigger, same as Chrome's behavior after a spoken pause. */
      emit(transcript: string) {
        this.onresult?.({ results: [{ isFinal: true, 0: { transcript } }] })
        this.onend?.()
      }
    }
    const speak = vi.fn((u: { onend?: (() => void) | null }) => u.onend?.())
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    vi.stubGlobal('speechSynthesis', {
      speak,
      cancel: vi.fn(),
      getVoices: () => [],
    })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        lang = ''
        voice: unknown = null
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(t: string) {
          this.text = t
        }
      },
    )
    try {
      vi.mocked(loadHealthChatHistory).mockResolvedValue([])
      vi.mocked(sendHealthChat).mockResolvedValue({
        reply: 'Glad you called.',
        action: null,
        userId: 'u9',
        assistantId: 'a9',
        suggests: [],
        reasoning: null,
        context: null,
      })
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)

      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }))
      /* The overlay opens straight into listening — one fake instance
         started. */
      expect(await screen.findByText('Listening…')).toBeInTheDocument()
      expect(FakeRecognition.instances).toHaveLength(1)
      expect(FakeRecognition.instances[0]!.lang).toBe('en-CA')

      /* Speak — the transcript flows through sendHealthChat like a typed
         message, so consent, persistence and distress checks all ride
         the same path. */
      FakeRecognition.instances[0]!.emit('hello by voice')
      await waitFor(() =>
        expect(sendHealthChat).toHaveBeenCalledWith(
          'hello by voice',
          'en',
          expect.any(Function),
          expect.anything(),
        ),
      )

      /* The reply is spoken, then the mic reopens for the next turn —
         one more recognition instance. */
      await waitFor(() => expect(speak).toHaveBeenCalled())
      expect(speak.mock.calls.at(0)![0]).toMatchObject({ text: 'Glad you called.' })
      await waitFor(() => expect(FakeRecognition.instances).toHaveLength(2))

      /* The spoken turns landed in the visible transcript like typed
         ones — the utterance also echoes in the overlay's last-said line,
         so scope the assertion to the bubble. */
      const bubbles = document.querySelectorAll('.sbchat-bubble.user')
      expect([...bubbles].some((b) => b.textContent?.includes('hello by voice'))).toBe(true)
      expect(screen.getByText('Glad you called.')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'End call' }))
      expect(screen.queryByText('Listening…')).not.toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('hides the voice-call button in Brave — the constructor exists but no service backs it', async () => {
    /* Brave ships navigator.brave and a SpeechRecognition stub whose
       start() can never succeed (the speech service endpoints are
       stripped). The gate must treat a constructor-that-can't-start as
       not-capable rather than dead-ending every Brave visitor. */
    Object.defineProperty(window.navigator, 'brave', { value: {}, configurable: true })
    class FakeRec {
      lang = ''
      onresult = null
      onerror = null
      onend = null
      start() {}
      abort() {}
    }
    vi.stubGlobal('SpeechRecognition', FakeRec)
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] })
    try {
      vi.mocked(loadHealthChatHistory).mockResolvedValue([])
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)
      expect(screen.queryByRole('button', { name: 'Voice call' })).not.toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
      delete (window.navigator as { brave?: unknown }).brave
    }
  })

  it('names a dead speech service honestly instead of blaming the mic permission', async () => {
    class FakeRec {
      static last: FakeRec | null = null
      lang = ''
      interimResults = false
      continuous = false
      onresult = null
      onerror: ((e: { error?: string }) => void) | null = null
      onend: (() => void) | null = null
      start() {
        FakeRec.last = this
        /* The failure Chrome-on-Brave-shape browsers emit — a service
           error, not a permission refusal. */
        this.onerror?.({ error: 'network' })
        this.onend?.()
      }
      abort() {
        this.onend?.()
      }
    }
    vi.stubGlobal('SpeechRecognition', FakeRec)
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] })
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(public text: string) {}
    })
    try {
      vi.mocked(loadHealthChatHistory).mockResolvedValue([])
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)
      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }))

      expect(
        await screen.findByText(/Voice isn’t working in this browser/),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Microphone blocked/)).not.toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  /* Browser-engine stubs — a fake SpeechRecognition whose instances the
     test can drive, plus a no-op speechSynthesis. Returns the fakes so a
     spec can emit utterances or watch the synthesizer. */
  function stubBrowserEngine() {
    type Result = { isFinal: boolean; 0: { transcript: string } }
    class FakeRecognition {
      static instances: FakeRecognition[] = []
      lang = ''
      interimResults = false
      continuous = true
      onresult: ((e: { results: ArrayLike<Result> }) => void) | null = null
      onerror: ((e: { error?: string }) => void) | null = null
      onend: (() => void) | null = null
      start() {
        FakeRecognition.instances.push(this)
      }
      abort() {
        this.onend?.()
      }
      emit(transcript: string) {
        this.onresult?.({ results: [{ isFinal: true, 0: { transcript } }] })
        this.onend?.()
      }
    }
    const speak = vi.fn((u: { onend?: (() => void) | null }) => u.onend?.())
    const cancel = vi.fn()
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        lang = ''
        voice: unknown = null
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(t: string) {
          this.text = t
        }
      },
    )
    return { FakeRecognition, speak, cancel }
  }

  /* Server-engine stubs — Brave-shaped browsers keep MediaRecorder even
     though their recognition constructor can't start. getUserMedia yields
     a one-track stream; the fake recorder emits its clip on stop(). */
  function stubServerEngine() {
    Object.defineProperty(window.navigator, 'brave', { value: {}, configurable: true })
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) },
      configurable: true,
    })
    class FakeMediaRecorder {
      static instances: FakeMediaRecorder[] = []
      mimeType = 'audio/webm'
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      constructor(public stream: unknown) {
        FakeMediaRecorder.instances.push(this)
      }
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob(['pcm'], { type: 'audio/webm' }) })
        this.onstop?.()
      }
    }
    const speak = vi.fn((u: { onend?: (() => void) | null }) => u.onend?.())
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        lang = ''
        voice: unknown = null
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(t: string) {
          this.text = t
        }
      },
    )
    return { FakeMediaRecorder, speak }
  }

  it('runs a tap-to-talk turn on the server engine where recognition can’t start', async () => {
    const { speak } = stubServerEngine()
    vi.mocked(healthVoiceTranscribeAvailable).mockResolvedValue(true)
    vi.mocked(transcribeHealthAudio).mockResolvedValue('hello by voice')
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(sendHealthChat).mockResolvedValue({
      reply: 'Glad you called.',
      action: null,
      userId: 'u9',
      assistantId: 'a9',
      suggests: [],
      reasoning: null,
      context: null,
    })
    try {
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)
      /* The probe is async — the button lands once it answers yes. */
      const callBtn = await screen.findByRole('button', { name: 'Voice call' })

      fireEvent.click(callBtn)
      /* The server engine rests on ready — no continuous listening. */
      expect(await screen.findByText('Tap the mic and talk')).toBeInTheDocument()

      /* Tap records, tap again hands the clip to transcription. */
      fireEvent.click(screen.getByTitle('Turn microphone off'))
      expect(await screen.findByText('Recording — tap the mic to send')).toBeInTheDocument()
      fireEvent.click(screen.getByTitle('Turn microphone off'))

      await waitFor(() => expect(transcribeHealthAudio).toHaveBeenCalled())
      await waitFor(() =>
        expect(sendHealthChat).toHaveBeenCalledWith(
          'hello by voice',
          'en',
          expect.any(Function),
          expect.anything(),
        ),
      )
      await waitFor(() => expect(speak).toHaveBeenCalled())
      expect(speak.mock.calls.at(0)![0]).toMatchObject({ text: 'Glad you called.' })
      /* Reply done — back to the resting state for the next tap. */
      expect(await screen.findByText('Tap the mic and talk')).toBeInTheDocument()

      const bubbles = document.querySelectorAll('.sbchat-bubble.user')
      expect([...bubbles].some((b) => b.textContent?.includes('hello by voice'))).toBe(true)
      expect(screen.getByText('Glad you called.')).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
      delete (window.navigator as { brave?: unknown }).brave
    }
  })

  it('keeps the call button hidden where the transcription route isn’t deployed', async () => {
    stubServerEngine()
    vi.mocked(healthVoiceTranscribeAvailable).mockResolvedValue(false)
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    try {
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)
      /* MediaRecorder exists but the edge function/route answered no —
         a dead-end button must not render. */
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Voice call' })).not.toBeInTheDocument(),
      )
    } finally {
      vi.unstubAllGlobals()
      delete (window.navigator as { brave?: unknown }).brave
    }
  })

  it('surfaces a transcription failure and keeps the call alive for a retry', async () => {
    stubServerEngine()
    vi.mocked(healthVoiceTranscribeAvailable).mockResolvedValue(true)
    vi.mocked(transcribeHealthAudio).mockRejectedValue(new Error('upstream 502'))
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    try {
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)
      fireEvent.click(await screen.findByRole('button', { name: 'Voice call' }))
      expect(await screen.findByText('Tap the mic and talk')).toBeInTheDocument()
      fireEvent.click(screen.getByTitle('Turn microphone off'))
      expect(await screen.findByText('Recording — tap the mic to send')).toBeInTheDocument()
      fireEvent.click(screen.getByTitle('Turn microphone off'))

      /* The clip failed to transcribe — a toast names it and the call
         parks on ready rather than dying. */
      expect(await screen.findByText(/Couldn’t transcribe that/)).toBeInTheDocument()
      expect(await screen.findByText('Tap the mic and talk')).toBeInTheDocument()
      expect(sendHealthChat).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
      delete (window.navigator as { brave?: unknown }).brave
    }
  })

  it('adopts the persisted reply in place of a stopped partial instead of stacking it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const userRowId = '11111111-2222-3333-4444-555555555556'
      const assistantId = '11111111-2222-3333-4444-555555555555'
      vi.mocked(loadHealthChatHistory).mockResolvedValue([])
      /* Stream a partial, then hang — Stop aborts before the reply finishes. */
      vi.mocked(sendHealthChat).mockImplementation(async (_m, _l, onDelta, opts) => {
        onDelta?.('Half a reply')
        return await new Promise<never>((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          })
        })
      })
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)

      fireEvent.change(screen.getByPlaceholderText(/Tell Mira/), {
        target: { value: 'ping' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
      expect(await screen.findByText('Half a reply')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
      /* The partial stays in the log, flagged so it can't pass for a
         finished answer. */
      expect(await screen.findByText('Stopped early')).toBeInTheDocument()

      /* The server still finished and persisted the full reply — the poll
         delivers it. The row is adopted into the partial's slot (real id,
         full text, finished state), not appended as a second reply. */
      vi.mocked(loadHealthChatHistory).mockResolvedValue([
        {
          id: userRowId,
          role: 'user',
          content: 'ping',
          action: null,
          feedback: null,
          createdAt: '2026-10-13T10:01:00Z',
        },
        {
          id: assistantId,
          role: 'assistant',
          content: 'Half a reply, finished.',
          action: null,
          reasoning: null,
          feedback: null,
          createdAt: '2026-10-13T10:01:01Z',
        },
      ])
      await vi.advanceTimersByTimeAsync(45_000)
      await waitFor(() =>
        expect(screen.getByText(/Half a reply, finished/)).toBeInTheDocument(),
      )
      /* One bubble carries the reply — the stopped marker and the
         un-persisted id are gone with the partial it replaced. */
      const bubbles = document.querySelectorAll('.sbchat-bubble.assistant')
      expect(
        [...bubbles].filter((b) => b.textContent?.includes('Half a reply')),
      ).toHaveLength(1)
      expect(screen.queryByText('Stopped early')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends the call when a new conversation starts from the switcher', async () => {
    stubBrowserEngine()
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    vi.mocked(newHealthChatThread).mockResolvedValue({
      id: 't-new',
      title: null,
      createdAt: '2026-10-15T12:00:00Z',
    })
    try {
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)
      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }))
      expect(await screen.findByText('Listening…')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Main conversation/ }))
      fireEvent.click(screen.getByRole('menuitem', { name: 'New conversation' }))

      /* The call belonged to the conversation it was opened in — a new
         thread ends it and the overlay unmounts. */
      await waitFor(() =>
        expect(screen.queryByText('Listening…')).not.toBeInTheDocument(),
      )
      await waitFor(() => expect(newHealthChatThread).toHaveBeenCalled())
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('ends the call when the active conversation is deleted', async () => {
    stubBrowserEngine()
    vi.mocked(listHealthChatThreads).mockResolvedValue({
      threads: [{ id: 't1', title: 'Sleep notes', createdAt: '2026-10-01T00:00:00Z' }],
      activity: {},
    })
    vi.mocked(loadHealthChatHistory).mockResolvedValue([])
    try {
      renderPage()
      await screen.findByPlaceholderText(/Tell Mira/)

      /* Sit inside the named thread, then open a call there. */
      fireEvent.click(screen.getByRole('button', { name: /Main conversation/ }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Sleep notes' }))
      await screen.findByPlaceholderText(/Tell Mira/)
      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }))
      expect(await screen.findByText('Listening…')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Sleep notes/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
      fireEvent.click(screen.getByRole('button', { name: 'Sure?' }))
      await waitFor(() => expect(deleteHealthChatThread).toHaveBeenCalledWith('t1'))
      /* The thread it was opened in is gone — so is the call. */
      await waitFor(() =>
        expect(screen.queryByText('Listening…')).not.toBeInTheDocument(),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
