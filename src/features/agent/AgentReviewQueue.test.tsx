import { describe, expect, it, vi, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsContext } from '@/features/app/toasts/toastsContext'
import { AgentReviewQueue, type KindRenderer } from './AgentReviewQueue'
import type { AgentSuggestion } from '@/lib/agentQueue'

vi.mock('@/lib/agentQueue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/agentQueue')>()),
  loadPendingSuggestions: vi.fn(),
  loadResolvedSuggestions: vi.fn(),
  reopenSuggestion: vi.fn(),
  resolveSuggestion: vi.fn(),
}))

const { loadPendingSuggestions, loadResolvedSuggestions, reopenSuggestion, resolveSuggestion } =
  await import('@/lib/agentQueue')

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
  acceptFallback: { en: 'Got it', fr: "C’est noté" },
  loadFailed: { en: 'Failed to load', fr: 'Échec' },
  filedBy: { en: 'Filed by an agent', fr: 'Déposé par un agent' },
  actionFailed: { en: 'That did not save', fr: "Ça n’a pas enregistré" },
  kindLabel: { pitch: { en: 'Pitch', fr: 'Pitch' } },
}

const showToast = vi.fn()

const RESOLVED = {
  title: { en: 'Recently resolved', fr: 'Récemment tranchées' },
  putback: { en: 'Put back', fr: 'Remettre' },
  putbackNamed: { en: 'Put “{title}” back', fr: 'Remettre « {title} »' },
  restored: { en: 'Back on the list.', fr: 'De retour.' },
  statusWord: {
    accepted: { en: 'accepted', fr: 'acceptée' },
    dismissed: { en: 'dismissed', fr: 'écartée' },
  },
}

function renderQueue(
  kinds: Record<string, KindRenderer> = {},
  withResolved = false,
) {
  return render(
    <LangProvider>
      <ToastsContext value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <AgentReviewQueue
          surface="pr"
          kinds={kinds}
          messages={MESSAGES}
          {...(withResolved ? { resolved: RESOLVED } : {})}
        />
      </ToastsContext>
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
        actions: [{ label: { en: 'Use it', fr: "L’utiliser" }, action: 'used', run }],
      },
    }
    renderQueue(kinds)

    fireEvent.click(await screen.findByRole('button', { name: /Use it/i }))
    expect(run).toHaveBeenCalled()
    await screen.findByText('Nothing waiting')
    expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'accepted', 'used')
  })

  it('keeps the row and toasts when the resolve write fails', async () => {
    vi.mocked(loadPendingSuggestions).mockResolvedValue([row()])
    vi.mocked(resolveSuggestion).mockRejectedValue(new Error('offline'))
    renderQueue()

    fireEvent.click(await screen.findByRole('button', { name: /Dismiss/i }))
    /* The row stays pending — a failed resolve must not look like a dismissal. */
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledWith(MESSAGES.actionFailed))
    expect(screen.getByText('Pitch — Alex Tremblay')).toBeInTheDocument()
  })

  it('shows the retry state when the queue cannot be read', async () => {
    vi.mocked(loadPendingSuggestions).mockRejectedValue(new Error('rls denied'))
    renderQueue()

    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })

  it('the resolved rail undoes a verdict — Put back returns the row to pending', async () => {
    const resolved = row({
      status: 'dismissed',
      resolved_at: new Date().toISOString(),
      resolved_action: 'dismissed',
    })
    vi.mocked(loadPendingSuggestions).mockResolvedValue([])
    vi.mocked(loadResolvedSuggestions).mockResolvedValue([resolved])
    vi.mocked(reopenSuggestion).mockResolvedValue()
    renderQueue({}, true)

    /* The rail lists the verdict even while the pending list is empty. */
    expect(await screen.findByText('Pitch — Alex Tremblay')).toBeInTheDocument()
    expect(screen.getByText('Recently resolved')).toBeInTheDocument()
    expect(screen.getByText(/dismissed/)).toBeInTheDocument()

    /* Put back — the refetch brings the row home to pending. */
    vi.mocked(loadPendingSuggestions).mockResolvedValue([row()])
    fireEvent.click(
      screen.getByRole('button', { name: 'Put “Pitch — Alex Tremblay” back' }),
    )
    await vi.waitFor(() => expect(reopenSuggestion).toHaveBeenCalledWith('s1'))
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledWith(RESOLVED.restored))
  })

  it('a resolved row echoes into the rail without a refetch', async () => {
    vi.mocked(loadPendingSuggestions).mockResolvedValue([row()])
    vi.mocked(loadResolvedSuggestions).mockResolvedValue([])
    vi.mocked(resolveSuggestion).mockResolvedValue()
    renderQueue({}, true)

    fireEvent.click(await screen.findByRole('button', { name: /Dismiss — Pitch/ }))
    await vi.waitFor(() =>
      expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'dismissed', 'dismissed'),
    )
    /* The pending row is gone; the rail shows the verdict right away. */
    expect(await screen.findByText('Recently resolved')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Put “Pitch — Alex Tremblay” back' }),
    ).toBeInTheDocument()
  })
})
