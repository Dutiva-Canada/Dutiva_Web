import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChipRow, ReasonChips, ThreadSwitcher } from './portalChat'

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

  it('dots threads with unseen activity — and the trigger while another thread is hot', () => {
    renderSwitcher({
      activeId: null,
      activity: new Set(['t2']),
      activityLabel: 'New activity',
    })
    /* Trigger dot — the reader is in Main but t2 moved. */
    const trigger = screen.getByRole('button', { name: /Main/ })
    expect(trigger.querySelector('[role="img"]')).toBeInTheDocument()

    fireEvent.click(trigger)
    const row = screen.getByRole('menuitemradio', { name: /Untitled/ })
    expect(row.querySelector('[aria-label="New activity"]')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitemradio', { name: 'Morning check' }).querySelector('[role="img"]'),
    ).not.toBeInTheDocument()
  })

  it('no trigger dot when the only hot thread is the one already open', () => {
    renderSwitcher({
      activeId: 't2',
      activeName: 'Untitled',
      activity: new Set(['t2']),
      activityLabel: 'New activity',
    })
    expect(
      screen.getByRole('button', { name: /Untitled/ }).querySelector('[role="img"]'),
    ).not.toBeInTheDocument()
  })

  it('rename swaps the row for an input and reports the new title', () => {
    const { onRename } = renderSwitcher({
      onRename: vi.fn(),
      onDelete: vi.fn(),
      opsLabels: { rename: 'Rename', delete: 'Delete', confirmDelete: 'Sure?', name: 'Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    /* Two threads with ops → two rename buttons; take the first. */
    fireEvent.click(screen.getAllByRole('button', { name: 'Rename' }).at(0)!)
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'Evening notes' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('t1', 'Evening notes')
    expect(screen.getByRole('menuitemradio', { name: /Morning check/ })).toBeInTheDocument()
  })

  it('rename Escape cancels — the unmount blur must not commit it', () => {
    const { onRename } = renderSwitcher({
      onRename: vi.fn(),
      opsLabels: { rename: 'Rename', delete: 'Delete', confirmDelete: 'Sure?', name: 'Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Rename' }).at(0)!)
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'Should not save' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('menuitemradio', { name: /Morning check/ })).toBeInTheDocument()
  })

  it('rename Enter commits exactly once — the unmount blur must not double it', () => {
    const { onRename } = renderSwitcher({
      onRename: vi.fn(),
      opsLabels: { rename: 'Rename', delete: 'Delete', confirmDelete: 'Sure?', name: 'Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Rename' }).at(0)!)
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'Evening notes' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledTimes(1)
    expect(onRename).toHaveBeenCalledWith('t1', 'Evening notes')
  })

  it('focus lands on the active item and arrows cycle the menu', () => {
    renderSwitcher({ activeId: 't1', activeName: 'Morning check' })
    fireEvent.click(screen.getByRole('button', { name: /Morning check/ }))
    expect(screen.getByRole('menuitemradio', { name: 'Morning check' })).toHaveFocus()

    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitemradio', { name: 'Untitled' })).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: 'New conversation' })).toHaveFocus()
    /* Past the last item wraps to the first. */
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitemradio', { name: 'Main' })).toHaveFocus()
    /* And ArrowUp from the first wraps back to the last. */
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(screen.getByRole('menuitem', { name: 'New conversation' })).toHaveFocus()
  })

  it('delete is a two-step arm-then-confirm', () => {
    const { onDelete } = renderSwitcher({
      onDelete: vi.fn(),
      opsLabels: { rename: 'Rename', delete: 'Delete', confirmDelete: 'Sure?', name: 'Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Main/ }))
    const del = screen.getAllByRole('button', { name: 'Delete' }).at(0)!
    fireEvent.click(del)
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('button', { name: 'Sure?' }).at(0)!)
    expect(onDelete).toHaveBeenCalledWith('t1')
  })
})

describe('ChipRow', () => {
  it('dedupes repeated suggestions instead of rendering key-colliding twins', () => {
    const onPick = vi.fn()
    render(
      <ChipRow chips={['Sleep?', 'Sleep?', 'Walk?']} chipClass="chip" onPick={onPick} />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button').at(0)!)
    expect(onPick).toHaveBeenCalledWith('Sleep?')
  })
})

describe('ReasonChips', () => {
  it('reports a pick and offers a dismiss exit when wired', () => {
    const onPick = vi.fn()
    const onDismiss = vi.fn()
    render(
      <ReasonChips
        label="Why?"
        reasons={['Wrong', 'Vague']}
        chipClass="chip"
        onPick={onPick}
        dismissLabel="Dismiss"
        onDismiss={onDismiss}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Vague' }))
    expect(onPick).toHaveBeenCalledWith('Vague')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('renders no dismiss affordance when the caller does not wire one', () => {
    render(<ReasonChips label="Why?" reasons={['Wrong']} chipClass="chip" onPick={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
