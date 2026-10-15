import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThreadSwitcher } from './portalChat'

const labels = { defaultThread: 'Main', untitled: 'Untitled', newThread: 'New conversation' }

function renderSwitcher(overrides: Partial<Parameters<typeof ThreadSwitcher>[0]> = {}) {
  const props = {
    activeName: 'Main',
    threads: [
      { id: 't1', title: 'Morning check' },
      { id: 't2', title: null },
    ],
    activeId: null as string | null,
    labels,
    onOpen: vi.fn(),
    onNew: vi.fn(),
    ...overrides,
  }
  render(
    <div>
      <ThreadSwitcher {...props} />
      <button type="button">elsewhere</button>
    </div>,
  )
  return props
}

describe('ThreadSwitcher', () => {
  it('opens the menu and reports a pick', () => {
    const { onOpen } = renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Morning check' }))
    expect(onOpen).toHaveBeenCalledWith('t1')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on an outside press', () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'elsewhere' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', () => {
    renderSwitcher()
    const trigger = screen.getByRole('button', { name: /Main/ })
    fireEvent.click(trigger)
    const item = screen.getByRole('menuitemradio', { name: 'Untitled' })
    item.focus()
    expect(item).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('marks the active thread as the checked radio', () => {
    renderSwitcher({ activeId: 't1' })
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    expect(screen.getByRole('menuitemradio', { name: 'Morning check' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Main' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })
})
