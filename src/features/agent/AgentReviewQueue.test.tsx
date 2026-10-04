import { describe, expect, it, vi, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { AgentReviewQueue, type KindRenderer } from './AgentReviewQueue'
import type { AgentSuggestion } from '@/lib/agentQueue'

vi.mock('@/lib/agentQueue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/agentQueue')>()),
  loadPendingSuggestions: vi.fn(),
  resolveSuggestion: vi.fn(),
}))

const { loadPendingSuggestions, resolveSuggestion } = await import('@/lib/agentQueue')

function row(over: Partial<AgentSuggestion> = {}): AgentSuggestion {
  return {
    id: 's1',
    user_id: 'u1',
    surface: 'pr',
    kind: 'pitch',
    title: 'Pitch — Alex Tremblay',
    payload: {},
    source: 'model',
    status: 'pending',
    dedupe_key: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolved_action: null,
    ...over,
  } as AgentSuggestion
}

const MESSAGES = {
  empty: { en: 'Nothing waiting', fr: 'Rien en attente' },
  dismiss: { en: 'Dismiss', fr: 'Écarter' },
  acceptFallback: { en: 'Got it', fr: "C'est noté" },
  loadFailed: { en: 'Failed to load', fr: 'Échec' },
  filedBy: { en: 'Filed by an agent', fr: 'Déposé par un agent' },
  kindLabel: { pitch: { en: 'Pitch', fr: 'Pitch' } },
}

function renderQueue(kinds: Record<string, KindRenderer> = {}) {
  return render(
    <LangProvider>
      <AgentReviewQueue surface="pr" kinds={kinds} messages={MESSAGES} />
    </LangProvider>,
  )
}

describe('AgentReviewQueue', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lists pending rows with the kind label, and dismiss resolves the row', async () => {
    vi.mocked(loadPendingSuggestions).mockResolvedValue([row()])
    vi.mocked(resolveSuggestion).mockResolvedValue()
    renderQueue()

    expect(await screen.findByText('Pitch — Alex Tremblay')).toBeInTheDocument()
    expect(screen.getByText(/Filed by an agent · Pitch/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'dismissed', 'dismissed')
    /* The row leaves the pending list once resolved. */
    expect(await screen.findByText('Nothing waiting')).toBeInTheDocument()
  })

  it('runs the kind action then marks the row accepted — a failed run stays pending', async () => {
    vi.mocked(loadPendingSuggestions).mockResolvedValue([row()])
    vi.mocked(resolveSuggestion).mockResolvedValue()
    const run = vi.fn().mockResolvedValue(undefined)
    const kinds: Record<string, KindRenderer> = {
      pitch: {
        actions: [{ label: { en: 'Use it', fr: "L'utiliser" }, action: 'used', run }],
      },
    }
    renderQueue(kinds)

    fireEvent.click(await screen.findByRole('button', { name: /Use it/i }))
    expect(run).toHaveBeenCalled()
    await screen.findByText('Nothing waiting')
    expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'accepted', 'used')
  })

  it('shows the retry state when the queue cannot be read', async () => {
    vi.mocked(loadPendingSuggestions).mockRejectedValue(new Error('rls denied'))
    renderQueue()

    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })
})
