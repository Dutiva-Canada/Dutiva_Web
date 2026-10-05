import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { PrDataContext } from '@/features/pr/data/PrDataContext'
import type { PrDataContextValue } from '@/features/pr/data/PrDataContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearPrChat,
  loadPrChatHistory,
  sendPrChat,
} from '@/features/pr/data/api'
import { PrChatPage } from './PrChatPage'

/* The page never reads the table directly — history, sending and clearing
   all go through the pr-ai function, so the api module is the seam to mock. */
vi.mock('@/features/pr/data/api', () => ({
  sendPrChat: vi.fn(),
  loadPrChatHistory: vi.fn(),
  clearPrChat: vi.fn(),
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

function renderPage(lang: Lang = 'en') {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const pr: PrDataContextValue = {
    state: undefined,
    loading: false,
    error: undefined,
    refresh,
  }
  render(
    <LangContext value={langValue(lang)}>
      <PrDataContext value={pr}>
        <ToastsProvider>
          <MemoryRouter initialEntries={['/pr/chat']}>
            <PrChatPage />
          </MemoryRouter>
        </ToastsProvider>
      </PrDataContext>
    </LangContext>,
  )
  return { refresh }
}

describe('PrChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state when there is no history', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument()
  })

  it('sends a message, renders the reply, and confirms the executed action', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    vi.mocked(sendPrChat).mockResolvedValue({
      reply: 'Draft filed.',
      action: { type: 'add_media_contact', detail: 'Jo at CBC', ok: true, refId: 'c1' },
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Write a message/)

    fireEvent.change(screen.getByPlaceholderText(/Write a message/), {
      target: { value: 'add Jo at CBC to my contacts' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendPrChat).toHaveBeenCalledWith('add Jo at CBC to my contacts', 'en'),
    )
    expect(await screen.findByText('Draft filed.')).toBeInTheDocument()
    expect(screen.getByText('Contact "Jo at CBC" added')).toBeInTheDocument()
    /* A completed action writes to the pr_* tables — the shared provider
       must refresh so the other tabs reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('renders stored history including a stored action', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'track the keyword hr compliance',
        action: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Tracking it now.',
        action: { type: 'add_keyword', detail: 'hr compliance', ok: true, refId: 'k1' },
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('track the keyword hr compliance')).toBeInTheDocument()
    expect(screen.getByText('Tracking it now.')).toBeInTheDocument()
    expect(screen.getByText('Now tracking "hr compliance"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(clearPrChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('hi')

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    await waitFor(() => expect(clearPrChat).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('hi')).not.toBeInTheDocument())
  })

  it('renders the French chrome under lang fr', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/Rien pour l/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })
})
