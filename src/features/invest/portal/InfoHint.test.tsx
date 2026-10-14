import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InfoHint } from './InfoHint'

describe('InfoHint', () => {
  it('opens on click, exposes the note, and reflects aria-expanded', async () => {
    const user = userEvent.setup()
    render(<InfoHint label="About targets" text="Weights are targets, not orders." />)
    const btn = screen.getByRole('button', { name: 'About targets' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('note')).toHaveTextContent('Weights are targets')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<InfoHint label="About targets" text="Weights are targets." />)
    await user.click(screen.getByRole('button'))
    expect(screen.queryByRole('note')).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('closes when focus leaves — an open hint must not linger over the card', async () => {
    const user = userEvent.setup()
    render(
      <>
        <InfoHint label="About targets" text="Weights are targets." />
        <button type="button">Elsewhere</button>
      </>,
    )
    const btn = screen.getByRole('button', { name: 'About targets' })
    await user.click(btn)
    await user.tab()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('end-aligns the popover when the trigger can sit near a card edge', () => {
    render(
      <InfoHint label="About kinds" text="Live means real money." align="end" />,
    )
    expect(document.querySelector('.sb-hint--end')).not.toBeNull()
  })
})
