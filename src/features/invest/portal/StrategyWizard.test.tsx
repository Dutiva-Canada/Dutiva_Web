import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AgentSuggestion } from '@/lib/agentQueue'
import type { StrategyDraft } from './strategyDraft'
import { StrategyWizard } from './StrategyWizard'

type OnCreate = (draft: StrategyDraft, suggestionId?: string | null) => void

function strategySuggestion(over: Partial<AgentSuggestion> = {}): AgentSuggestion {
  return {
    id: 'sug-1',
    user_id: 'u1',
    surface: 'invest',
    kind: 'strategy',
    title: 'Book watch',
    payload: {
      title_fr: 'Surveillance du carnet',
      draft: {
        name: 'Book watch',
        cadence: 'daily',
        scope: { watchlist: true, symbols: ['ACME'] },
        rules: [
          {
            type: 'signal',
            metric: 'day_change_pct',
            op: 'lt',
            value: -5,
            title: 'Fell 5% today',
            severity: 'alert',
          },
        ],
      },
    },
    source: 'rule',
    dedupe_key: 'strategy:book-watch',
    status: 'pending',
    resolved_at: null,
    resolved_action: null,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function mount(extra: { suggestions?: AgentSuggestion[] } = {}) {
  const onCreate = vi.fn<OnCreate>()
  render(
    <LangProvider>
      <MemoryRouter>
        <ToastsProvider>
          <StrategyWizard
          trackedSymbols={['ACME']}
          onCancel={() => {}}
          onCreate={onCreate}
          busy={false}
          bookCurrency="CAD"
            suggestions={extra.suggestions ?? []}
          />
        </ToastsProvider>
      </MemoryRouter>
    </LangProvider>,
  )
  return { onCreate }
}

describe('StrategyWizard Tally picks', () => {
  it('hides the picks row when nothing is pending', () => {
    mount()
    expect(screen.queryByText(/Tally’s picks|picks from the last/i)).not.toBeInTheDocument()
  })

  it('loads a pick into step 2 and resolves its id on create', async () => {
    const user = userEvent.setup()
    const { onCreate } = mount({ suggestions: [strategySuggestion()] })
    await user.click(screen.getByRole('button', { name: 'Book watch' }))
    /* Step 2 — the pick's rules are loaded for review, no model call. */
    expect(await screen.findByText(/Fell 5% today/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continue/i }))
    await user.click(screen.getByRole('button', { name: /Create strategy/i }))
    expect(onCreate).toHaveBeenCalledTimes(1)
    const [draft, suggestionId] = onCreate.mock.calls[0]!
    expect(suggestionId).toBe('sug-1')
    expect(draft.enabled).toBe(false)
    expect(draft.rules).toHaveLength(1)
  })
})
