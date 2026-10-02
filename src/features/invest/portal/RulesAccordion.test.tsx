import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '@/i18n/LangProvider'
import type { SignalRule } from '../data/types'
import { RulesAccordion } from './RulesAccordion'
import { toDrafts } from './ruleDrafts'
import type { RuleDraft } from './ruleDrafts'

const r1: SignalRule = {
  type: 'signal',
  metric: 'day_change_pct',
  op: 'lt',
  value: -5,
  severity: 'alert',
  title: 'First',
}
const r2: SignalRule = { ...r1, metric: 'vs_ma50', value: -10, title: 'Second' }

function Host({ initial }: { initial: RuleDraft[] }) {
  const [drafts, setDrafts] = useState(initial)
  return (
    <LangProvider>
      <RulesAccordion drafts={drafts} onChange={setDrafts} idPrefix="t" />
    </LangProvider>
  )
}

describe('RulesAccordion', () => {
  it('shows generated title, label, and action chip on collapsed rows', async () => {
    render(<Host initial={toDrafts([r1, r2])} />)
    /* First rule starts expanded; second is collapsed with its chip. */
    expect(screen.getAllByText(/Notify · Alert/).length).toBeGreaterThan(0)
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('keeps only one rule expanded at a time', async () => {
    const user = userEvent.setup()
    render(<Host initial={toDrafts([r1, r2])} />)
    await user.click(screen.getByRole('button', { name: 'Expand rule' }))
    const expanded = screen
      .getAllByRole('button', { name: /Expand rule|Collapse rule/ })
      .filter((b) => b.getAttribute('aria-expanded') === 'true')
    expect(expanded).toHaveLength(1)
  })

  it('reorders rules with the up/down arrows (order = priority)', async () => {
    const user = userEvent.setup()
    render(<Host initial={toDrafts([r1, r2])} />)
    const ups = screen.getAllByRole('button', { name: 'Move rule up' })
    await user.click(ups[1]!) // 'Second' up — first row's button is disabled
    const heads = screen.getAllByText(/^(First|Second)$/)
    expect(heads[0]!.textContent).toBe('Second')
  })

  it('requires two taps to remove a rule', async () => {
    const user = userEvent.setup()
    render(<Host initial={toDrafts([r1])} />)
    const remove = screen.getByRole('button', { name: 'Remove rule' })
    await user.click(remove)
    expect(screen.getByRole('button', { name: 'Click again to confirm' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Click again to confirm' }))
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })

  it('adds a blank rule and caps the label at 60 chars with a live counter', async () => {
    const user = userEvent.setup()
    render(<Host initial={toDrafts([])} />)
    await user.click(screen.getByRole('button', { name: /Add rule/i }))
    const label = screen.getByLabelText(/label/i)
    expect(screen.getByText(/0 \/ 60/)).toBeInTheDocument()
    await user.type(label, 'x'.repeat(70))
    expect((label as HTMLInputElement).value).toHaveLength(60)
    expect(screen.getByText(/60 \/ 60/)).toBeInTheDocument()
  })
})
