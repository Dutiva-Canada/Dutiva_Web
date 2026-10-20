import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { PrDataContext } from '@/features/pr/data/PrDataContext'
import type { PrDataContextValue } from '@/features/pr/data/PrDataContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearPrChat,
  listPrChatThreads,
  loadPrChatHistory,
  ratePrChatTurn,
  sendPrChat,
  undoPrChatAction,
} from '@/features/pr/data/chatApi'
import type { PrChatTurn } from '@/features/pr/data/chatApi'
import { PrChatPage } from './PrChatPage'

/* The page never reads the table directly — history, sending, undo and
   clearing all go through the pr-ai function, so the api module is the
   seam to mock. */
vi.mock('@/features/pr/data/chatApi', () => ({
  sendPrChat: vi.fn(),
  regeneratePrChat: vi.fn(),
  listPrChatThreads: vi.fn(async () => []),
  newPrChatThread: vi.fn(),
  renamePrChatThread: vi.fn(),
  deletePrChatThread: vi.fn(),
  loadPrChatHistory: vi.fn(),
  clearPrChat: vi.fn(),
  ratePrChatTurn: vi.fn(),
  undoPrChatAction: vi.fn(),
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

function renderPage(lang: Lang = 'en', auth: Partial<AuthContextValue> = {}) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const pr: PrDataContextValue = {
    state: undefined,
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
        <PrDataContext value={pr}>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/pr/chat']}>
              <PrChatPage />
            </MemoryRouter>
          </ToastsProvider>
        </PrDataContext>
      </AuthContext.Provider>
    </LangContext>,
  )
  return { refresh }
}

const ASSISTANT_ID = 'a1b2c3d4-0000-4000-8000-000000000001'
const USER_ROW_ID = 'a1b2c3d4-0000-4000-8000-000000000002'

describe('PrChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('greets on an empty conversation — Paige speaks first', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Hi — I’m Paige/)).toBeInTheDocument()
    expect(screen.getByText(/What are we working on today\?/)).toBeInTheDocument()
  })

  it('swaps the subtitle and shows the Internal badge for @dutiva.ca', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage('en', {
      session: { user: { id: 'u9', email: 'staff@dutiva.ca' } } as AuthContextValue['session'],
    })
    expect(await screen.findByText(/Internal staff account: she also advises/)).toBeInTheDocument()
    expect(screen.getByText('Internal')).toBeInTheDocument()
  })

  it('sends a message, renders the reply, and confirms the executed action', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    vi.mocked(sendPrChat).mockResolvedValue({
      reply: 'Draft filed.',
      action: { type: 'add_media_contact', detail: 'Jo at CBC', ok: true, refId: 'c1' },
      userId: USER_ROW_ID,
      assistantId: ASSISTANT_ID,
      suggests: [],
      reasoning: null,
      sources: [],
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Ask Paige/)

    fireEvent.change(screen.getByPlaceholderText(/Ask Paige/), {
      target: { value: 'add Jo at CBC to my contacts' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendPrChat).toHaveBeenCalledWith(
        'add Jo at CBC to my contacts',
        'en',
        expect.any(Function),
        { signal: expect.anything(), threadId: null, onReasoning: expect.any(Function), onStatus: expect.any(Function) },
      ),
    )
    expect(await screen.findByText('Draft filed.')).toBeInTheDocument()
    expect(screen.getByText('Contact “Jo at CBC” added')).toBeInTheDocument()
    /* A completed action writes to the pr_* tables — the shared provider
       must refresh so the other tabs reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('does not duplicate the user bubble when the poll lands the persisted pair', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(loadPrChatHistory).mockResolvedValue([])
      vi.mocked(sendPrChat).mockResolvedValue({
        reply: 'Noted.',
        action: null,
        userId: USER_ROW_ID,
        assistantId: ASSISTANT_ID,
        suggests: [],
        reasoning: null,
        sources: [],
      })
      renderPage()
      await screen.findByPlaceholderText(/Ask Paige/)

      fireEvent.change(screen.getByPlaceholderText(/Ask Paige/), {
        target: { value: 'ping' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
      expect(await screen.findByText('Noted.')).toBeInTheDocument()

      /* The 45s history poll lands the persisted rows — the optimistic
         bubble already carries the real row id, so nothing new appends.
         Without the adoption it would come back as a stranger and
         duplicate under the reply. */
      vi.mocked(loadPrChatHistory).mockResolvedValue([
        {
          id: USER_ROW_ID,
          role: 'user',
          content: 'ping',
          action: null,
          feedback: null,
          createdAt: '2026-10-13T10:01:00Z',
        },
        {
          id: ASSISTANT_ID,
          role: 'assistant',
          content: 'Noted.',
          action: null,
          reasoning: null,
          sources: [],
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
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'track the keyword hr compliance',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Tracking it now.',
        action: { type: 'add_keyword', detail: 'hr compliance', ok: true, refId: 'k1' },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('track the keyword hr compliance')).toBeInTheDocument()
    expect(screen.getByText('Tracking it now.')).toBeInTheDocument()
    expect(screen.getByText('Now tracking “hr compliance”')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('offers undo on a successful action chip and marks it undone', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Tracking it now.',
        action: { type: 'add_keyword', detail: 'hr compliance', ok: true, refId: 'k1' },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(undoPrChatAction).mockResolvedValue(undefined)
    const { refresh } = renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(undoPrChatAction).toHaveBeenCalledWith(ASSISTANT_ID))
    expect(await screen.findByText('Undone')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
  })

  it('toggles a thumbs rating on an assistant turn', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'On it.',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(ratePrChatTurn).mockResolvedValue(undefined)
    renderPage()

    const up = await screen.findByRole('button', { name: 'Helpful' })
    expect(up).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(up)
    await waitFor(() => expect(ratePrChatTurn).toHaveBeenCalledWith(ASSISTANT_ID, 1))
    expect(up).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(clearPrChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('hi')

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    expect(
      await screen.findByRole('button', { name: 'Click again to confirm' }),
    ).toBeInTheDocument()
    expect(clearPrChat).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Click again to confirm' }))
    await waitFor(() => expect(clearPrChat).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('hi')).not.toBeInTheDocument())
  })

  it('renders the French chrome and greeting under lang fr', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/Bonjour — je suis Paige/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })

  it('ignores a stale history load that resolves after a thread switch', async () => {
    /* The default thread's fetch was still in flight when the reader
       opened Alpha — without the generation guard its rows would land on
       top of Alpha's conversation. */
    vi.mocked(listPrChatThreads).mockResolvedValue([
      { id: 't-alpha', title: 'Alpha', createdAt: '2026-10-10T00:00:00Z' },
    ])
    let resolveStale!: (rows: PrChatTurn[]) => void
    vi.mocked(loadPrChatHistory).mockImplementation((_limit, _before, tid) =>
      tid === 't-alpha'
        ? Promise.resolve([
            {
              id: 'a1',
              role: 'user' as const,
              content: 'alpha message',
              action: null,
              feedback: null,
              createdAt: '2026-10-10T09:00:00Z',
            },
          ])
        : new Promise<PrChatTurn[]>((r) => (resolveStale = r)),
    )
    renderPage()
    /* Mount history is pending — the switcher still lists threads. */
    fireEvent.click(await screen.findByRole('button', { name: /Main conversation/ }))
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Alpha' }))
    expect(await screen.findByText('alpha message')).toBeInTheDocument()

    /* The stale fetch resolves late — its rows must be dropped. */
    resolveStale([
      {
        id: 's1',
        role: 'user',
        content: 'stale default message',
        action: null,
        feedback: null,
        createdAt: '2026-10-09T09:00:00Z',
      },
    ])
    await waitFor(() =>
      expect(screen.queryByText('stale default message')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('alpha message')).toBeInTheDocument()
  })

  it('drops Load earlier on a thread switch instead of inheriting it', async () => {
    /* hasMore belonged to the previous conversation — a short thread must
       not inherit a dead pagination affordance. */
    vi.mocked(listPrChatThreads).mockResolvedValue([
      { id: 't-alpha', title: 'Alpha', createdAt: '2026-10-10T00:00:00Z' },
    ])
    const fullPage = Array.from({ length: 40 }, (_, i) => ({
      id: `h${i}`,
      role: 'user' as const,
      content: `message ${i}`,
      action: null,
      feedback: null,
      createdAt: `2026-10-0${(i % 9) + 1}T12:00:00Z`,
    }))
    vi.mocked(loadPrChatHistory).mockImplementation((_limit, _before, tid) =>
      Promise.resolve(
        tid === 't-alpha'
          ? [
              {
                id: 'a1',
                role: 'user' as const,
                content: 'alpha message',
                action: null,
                feedback: null,
                createdAt: '2026-10-10T09:00:00Z',
              },
            ]
          : fullPage,
      ),
    )
    renderPage()
    expect(
      await screen.findByRole('button', { name: 'Load earlier messages' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Main conversation/ }))
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Alpha' }))
    await screen.findByText('alpha message')
    expect(
      screen.queryByRole('button', { name: 'Load earlier messages' }),
    ).not.toBeInTheDocument()
  })

  it('does not send — or eat the draft — while history is still loading', async () => {
    /* turns === null means the thread fetch hasn't resolved; a send here
       would be wiped by setTurns(rows) when it lands. The draft must stay
       put so nothing the reader typed silently vanishes. */
    vi.mocked(loadPrChatHistory).mockImplementation(() => new Promise(() => {}))
    renderPage()
    const box = await screen.findByPlaceholderText(/Ask Paige/)
    fireEvent.change(box, { target: { value: 'ping' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(sendPrChat).not.toHaveBeenCalled()
    expect(box).toHaveValue('ping')
  })

  it('adopts the persisted reply in place when a stopped send resolves via poll', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(loadPrChatHistory).mockResolvedValue([])
      /* The reader hits Stop mid-stream: the partial goes out via onDelta,
         then the transport aborts. The server still persists the full pair
         — the poll must not stack it next to the local stub. */
      vi.mocked(sendPrChat).mockImplementation(async (_m, _l, onDelta) => {
        onDelta?.('Half a reply')
        throw new DOMException('stopped', 'AbortError')
      })
      renderPage()
      const box = await screen.findByPlaceholderText(/Ask Paige/)
      fireEvent.change(box, { target: { value: 'ping' } })
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
      /* The stopped partial parks in the log flagged stopped. */
      await screen.findByText('Half a reply')

      vi.mocked(loadPrChatHistory).mockResolvedValue([
        {
          id: USER_ROW_ID,
          role: 'user',
          content: 'ping',
          action: null,
          feedback: null,
          createdAt: '2026-10-13T10:01:00Z',
        },
        {
          id: ASSISTANT_ID,
          role: 'assistant',
          content: 'Half a reply, finished.',
          action: null,
          reasoning: null,
          sources: [],
          feedback: null,
          createdAt: '2026-10-13T10:01:01Z',
        },
      ])
      await vi.advanceTimersByTimeAsync(45_000)
      /* The persisted row replaced the local partial — one reply, full text. */
      await waitFor(() =>
        expect(screen.getByText(/Half a reply, finished\./)).toBeInTheDocument(),
      )
      expect(screen.queryByText('Half a reply', { exact: true })).not.toBeInTheDocument()
      expect(screen.getAllByText('ping')).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
