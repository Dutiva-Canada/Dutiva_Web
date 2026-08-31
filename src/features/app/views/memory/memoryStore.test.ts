import { beforeEach, describe, expect, it } from 'vitest'
import { seedMemoryFacts } from '@/data'
import { memoryActions, resetMemoryStore, useMemoryStore } from './memoryStore'
import { renderHook } from '@testing-library/react'
import { act } from 'react'

function current() {
  const { result } = renderHook(() => useMemoryStore())
  return result
}

describe('memoryStore', () => {
  beforeEach(() => {
    resetMemoryStore()
  })

  it('seeds from the fixtures', () => {
    const store = current()
    expect(store.current.facts).toHaveLength(seedMemoryFacts.length)
    expect(store.current.audit).toHaveLength(0)
  })

  it('confirm promotes inferred → confirmed, stamps the date, and audit-logs it', () => {
    const store = current()
    act(() => memoryActions.confirm('p7'))
    const fact = store.current.facts.find((f) => f.id === 'p7')!
    expect(fact.confidence).toBe('confirmed')
    expect(fact.confirmedAt).toBe('2026-07-11')
    expect(store.current.audit[0]).toMatchObject({ action: 'confirm' })
    /* The fixture itself is untouched (session-scoped edits only). */
    expect(seedMemoryFacts.find((f) => f.id === 'p7')!.confidence).toBe('inferred')
  })

  it('confirm is a no-op on an already-confirmed fact', () => {
    const store = current()
    act(() => memoryActions.confirm('p1'))
    expect(store.current.audit).toHaveLength(0)
  })

  it('correct replaces the statement inline; the source stays untouched', () => {
    const store = current()
    act(() => memoryActions.correct('p9', 'Booked vacation Jul 21–25'))
    const fact = store.current.facts.find((f) => f.id === 'p9')!
    expect(fact.statement).toEqual({
      en: 'Booked vacation Jul 21–25',
      fr: 'Booked vacation Jul 21–25',
    })
    expect(fact.source).toEqual(seedMemoryFacts.find((f) => f.id === 'p9')!.source)
    expect(store.current.audit[0]).toMatchObject({ action: 'correct' })
  })

  it('correct rejects an empty statement', () => {
    const store = current()
    act(() => memoryActions.correct('p9', '   '))
    expect(store.current.facts.find((f) => f.id === 'p9')!.statement.en).toBe(
      'Booked vacation Jul 14–18',
    )
  })

  it('forget removes the memory and audit-logs it', () => {
    const store = current()
    act(() => memoryActions.forget('p9'))
    expect(store.current.facts.find((f) => f.id === 'p9')).toBeUndefined()
    expect(store.current.audit[0]).toMatchObject({ action: 'forget' })
  })
})
