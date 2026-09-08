import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { Segments } from './Segments'

/**
 * `useSegments` is read-only in demo (`canWrite: false`, mutations no-op), so
 * the screen test swaps the hook for a stateful fake over the same fixtures.
 * `canWrite` is flipped per test: the render test exercises the real demo
 * read-only surface; the delete test exercises the production write path.
 * `useStakeholders` stays real — demo mode returns the fixture contacts.
 */
const segmentMockState = vi.hoisted(() => ({ canWrite: false }))

vi.mock('../data/useSegments', async () => {
  const { useState } = await vi.importActual<typeof import('react')>('react')
  const { initialCommsState } =
    await vi.importActual<typeof import('../data/fixtures')>('../data/fixtures')
  type Segment = (typeof initialCommsState.segments)[number]
  type Membership = (typeof initialCommsState.segmentMemberships)[number]
  return {
    useSegments: () => {
      const [segments, setSegments] = useState<Segment[]>(initialCommsState.segments)
      const [memberships, setMemberships] = useState<Membership[]>(
        initialCommsState.segmentMemberships,
      )
      return {
        segments,
        segmentMemberships: memberships,
        loading: false,
        canWrite: segmentMockState.canWrite,
        addSegment: async (item: Omit<Segment, 'id'>) => {
          const created: Segment = { id: `seg-new-${segments.length}`, ...item }
          setSegments((prev) => [created, ...prev])
          return created
        },
        updateSegment: async (id: string, patch: Partial<Segment>) => {
          setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
          return segments.find((s) => s.id === id) ?? null
        },
        removeSegment: async (id: string) => {
          setSegments((prev) => prev.filter((s) => s.id !== id))
          setMemberships((prev) => prev.filter((m) => m.segmentId !== id))
        },
        addContact: async (contactId: string, segmentId: string) => {
          const created: Membership = {
            id: `mem-new-${memberships.length}`,
            contactId,
            segmentId,
          }
          setMemberships((prev) => [created, ...prev])
          return created
        },
        removeContact: async (id: string) => {
          setMemberships((prev) => prev.filter((m) => m.id !== id))
        },
        refresh: async () => {},
      }
    },
  }
})

describe('Segments screen', () => {
  beforeEach(() => {
    segmentMockState.canWrite = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders fixture segments and their contacts in demo (read-only)', async () => {
    const user = userEvent.setup()
    renderApp(<Segments />, { route: '/app/comms/segments' })

    expect(screen.getByText('Tier-1 Media')).toBeInTheDocument()
    expect(screen.getByText('Bilingual Creators')).toBeInTheDocument()

    /* membership-1 links segment-1 (Tier-1 Media) to contact-1 (Samira). */
    await user.click(screen.getByRole('button', { name: /Tier-1 Media/ }))
    expect(screen.getByText('Samira Okonkwo')).toBeInTheDocument()

    /* Demo is read-only: no write affordances. */
    expect(screen.queryByRole('button', { name: 'Add segment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('deletes a segment after confirmation', async () => {
    segmentMockState.canWrite = true
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderApp(<Segments />, { route: '/app/comms/segments' })

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    expect(removeButtons).toHaveLength(2)
    await user.click(removeButtons[0]!)

    expect(window.confirm).toHaveBeenCalled()
    expect(screen.queryByText('Tier-1 Media')).not.toBeInTheDocument()
    expect(screen.getByText('Bilingual Creators')).toBeInTheDocument()
  })
})
