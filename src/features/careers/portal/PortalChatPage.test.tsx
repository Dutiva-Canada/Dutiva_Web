import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearCandidateChat,
  loadCandidateChatHistory,
  rateCandidateChatTurn,
  sendCandidateChat,
} from '@/features/careers/data/candidateChat'
import { PortalChatPage } from './PortalChatPage'

/* The page never reads the table directly — history, sending, rating and
   clearing all go through the candidate-ai function, so the api module is
   the seam. */
vi.mock('@/features/careers/data/candidateChat', () => ({
  sendCandidateChat: vi.fn(),
  regenerateCandidateChat: vi.fn(),
  listCandidateChatThreads: vi.fn(async () => []),
  newCandidateChatThread: vi.fn(),
  loadCandidateChatHistory: vi.fn(),
  clearCandidateChat: vi.fn(),
  rateCandidateChatTurn: vi.fn(),
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
  const authValue: AuthContextValue = {
    status: 'signed-in',
    session: { user: { id: 'u1', email: 'candidate@example.ca' } } as AuthContextValue['session'],
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
        <ToastsProvider>
          <MemoryRouter initialEntries={['/careers/portal/chat']}>
            <PortalChatPage />
          </MemoryRouter>
        </ToastsProvider>
      </AuthContext.Provider>
    </LangContext>,
  )
}

const ASSISTANT_ID = 'b2c3d4e5-0000-4000-8000-000000000002'

describe('PortalChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('greets on an empty conversation — Claire speaks first', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Hi — I’m Claire/)).toBeInTheDocument()
    expect(screen.getByText(/What do you want to work on\?/)).toBeInTheDocument()
  })

  it('sends a message and renders the reply', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    vi.mocked(sendCandidateChat).mockResolvedValue({
      reply: 'Your strongest match is the Globex role.',
      assistantId: ASSISTANT_ID,
      suggests: [],
    })
    renderPage()
    await screen.findByPlaceholderText(/Ask about your search/)

    fireEvent.change(screen.getByPlaceholderText(/Ask about your search/), {
      target: { value: 'which posting should I chase first' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendCandidateChat).toHaveBeenCalledWith(
        'which posting should I chase first',
        'en',
        expect.any(Function),
        { signal: expect.anything(), threadId: null },
      
      ),
    )
    expect(await screen.findByText('Your strongest match is the Globex role.')).toBeInTheDocument()
  })

  it('renders stored history', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'how does my resume read',
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Strong on the frontend, thin on outcomes.',
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()
    expect(await screen.findByText('how does my resume read')).toBeInTheDocument()
    expect(screen.getByText('Strong on the frontend, thin on outcomes.')).toBeInTheDocument()
    expect(screen.queryByText(/Hi — I’m Claire/)).not.toBeInTheDocument()
  })

  it('toggles a thumbs rating on an assistant turn', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'A frank read.',
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(rateCandidateChatTurn).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('A frank read.')

    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }))
    await waitFor(() => expect(rateCandidateChatTurn).toHaveBeenCalledWith(ASSISTANT_ID, 1))
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Old reply.',
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(clearCandidateChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Old reply.')

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(clearCandidateChat).toHaveBeenCalled())
    expect(await screen.findByText(/Hi — I’m Claire/)).toBeInTheDocument()
  })

  it('shows the coach subtitle to external accounts and the internal one to @dutiva.ca', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/not a person or a recruiter/)).toBeInTheDocument()
    expect(screen.queryByText(/Internal staff account/)).not.toBeInTheDocument()
  })

  it('swaps the subtitle for an internal @dutiva.ca session', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    renderPage('en', {
      session: { user: { id: 'u9', email: 'martin@dutiva.ca' } } as AuthContextValue['session'],
    })
    expect(await screen.findByText(/Internal staff account: she also advises/)).toBeInTheDocument()
    expect(screen.queryByText(/not a person or a recruiter/)).not.toBeInTheDocument()
  })

  it('sends a starter chip as a message from the empty state', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    vi.mocked(sendCandidateChat).mockResolvedValue({
      reply: 'Start with the strongest match.',
      assistantId: ASSISTANT_ID,
      suggests: [],
    })
    renderPage()
    await screen.findByText(/Hi — I’m Claire/)

    fireEvent.click(
      screen.getByRole('button', { name: 'Which discovered jobs fit me best?' }),
    )
    await waitFor(() =>
      expect(sendCandidateChat).toHaveBeenCalledWith(
        'Which discovered jobs fit me best?',
        'en',
        expect.any(Function),
        { signal: expect.anything(), threadId: null },
      
      ),
    )
  })

  it('flags a failed send in place and retries it', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    vi.mocked(sendCandidateChat)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ reply: 'Back on.', assistantId: ASSISTANT_ID , suggests: []})
    renderPage()
    await screen.findByPlaceholderText(/Ask about your search/)

    fireEvent.change(screen.getByPlaceholderText(/Ask about your search/), {
      target: { value: 'ping' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByText('ping')).toBeInTheDocument()

    fireEvent.click(retry)
    await waitFor(() => expect(sendCandidateChat).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Back on.')).toBeInTheDocument()
  })

  it('offers a Load earlier page when history fills the window', async () => {
    const page = Array.from({ length: 40 }, (_, i) => ({
      id: `h${i}`,
      role: 'user' as const,
      content: `message ${i}`,
      feedback: null,
      createdAt: `2026-10-0${(i % 9) + 1}T12:00:00Z`,
    }))
    vi.mocked(loadCandidateChatHistory).mockResolvedValueOnce(page).mockResolvedValueOnce([])
    renderPage()

    const more = await screen.findByRole('button', { name: 'Load earlier messages' })
    fireEvent.click(more)
    await waitFor(() =>
      expect(loadCandidateChatHistory).toHaveBeenLastCalledWith(40, '2026-10-01T12:00:00Z', null),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Load earlier messages' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('renders the French chrome and greeting under lang fr', async () => {
    vi.mocked(loadCandidateChatHistory).mockResolvedValue([])
    renderPage('fr')
    expect(await screen.findByText(/je suis Claire, votre coach de recherche/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Posez une question sur votre recherche/)).toBeInTheDocument()
  })
})
