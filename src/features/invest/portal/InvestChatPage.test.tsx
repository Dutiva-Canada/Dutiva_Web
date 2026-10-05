import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { InvestDataContext } from '@/features/invest/data/InvestDataContext'
import { EMPTY_INVEST_STATE } from '@/features/invest/data/InvestDataContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearInvestChat,
  loadInvestChatHistory,
  sendInvestChat,
} from '@/features/invest/data/api'
import { InvestChatPage } from './InvestChatPage'

/* The page never reads the table directly — history, sending and clearing
   all go through the invest-ai function, so the api module is the seam. */
vi.mock('@/features/invest/data/api', () => ({
  sendInvestChat: vi.fn(),
  loadInvestChatHistory: vi.fn(),
  clearInvestChat: vi.fn(),
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
  render(
    <LangContext value={langValue(lang)}>
      <InvestDataContext
        value={{ state: EMPTY_INVEST_STATE, loading: false, refresh }}
      >
        <ToastsProvider>
          <MemoryRouter initialEntries={['/invest/chat']}>
            <InvestChatPage />
          </MemoryRouter>
        </ToastsProvider>
      </InvestDataContext>
    </LangContext>,
  )
  return { refresh }
}

describe('InvestChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state when there is no history', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument()
  })

  it('sends a message, renders the reply, and confirms the executed action', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    vi.mocked(sendInvestChat).mockResolvedValue({
      reply: 'Queued a draft order for review.',
      action: { type: 'create_order', detail: 'buy 5 XEQT', ok: true, refId: 'o1' },
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Write a message/)

    fireEvent.change(screen.getByPlaceholderText(/Write a message/), {
      target: { value: 'queue a buy of 5 XEQT' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendInvestChat).toHaveBeenCalledWith('queue a buy of 5 XEQT', 'en'),
    )
    expect(await screen.findByText('Queued a draft order for review.')).toBeInTheDocument()
    expect(screen.getByText('Draft order queued — buy 5 XEQT')).toBeInTheDocument()
    /* A completed action writes to the invest_* tables — the shared provider
       must refresh so Orders/Signals/Watchlist reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('renders stored history including a stored action', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'watch XEQT',
        action: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Watching it.',
        action: { type: 'add_watch_symbol', detail: 'XEQT', ok: true },
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('watch XEQT')).toBeInTheDocument()
    expect(screen.getByText('Watching it.')).toBeInTheDocument()
    expect(screen.getByText('Now watching "XEQT"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(clearInvestChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('hi')

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    await waitFor(() => expect(clearInvestChat).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('hi')).not.toBeInTheDocument())
  })

  it('renders the French chrome under lang fr', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/Rien pour l/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })
})
