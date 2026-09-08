import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bi } from '@/i18n/core'

const { fromMock, builder, setNextResponse } = vi.hoisted(() => {
  let nextResponse: { data: unknown; error: unknown } = { data: null, error: null }

  const b = {
    select: vi.fn(() => b),
    eq: vi.fn(() => b),
    order: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    single: vi.fn(() => b),
    then: vi.fn((resolve: (value: unknown) => void) => resolve(nextResponse)),
  }

  return {
    fromMock: vi.fn(() => b),
    builder: b,
    setNextResponse: (value: { data: unknown; error: unknown }) => {
      nextResponse = value
    },
  }
})

vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: fromMock } }))

import {
  addContactToSegment,
  createSegment,
  deleteSegment,
  listSegmentMemberships,
  listSegments,
  removeContactFromSegment,
} from './segmentsApi'

const ORG_ID = 'org-1'
const SEGMENT_ID = 'seg-1'
const CONTACT_ID = 'contact-1'
const MEMBERSHIP_ID = 'mem-1'

const name: Bi = { en: 'Tier-1 Media', fr: 'Médias de premier plan' }
const description: Bi = { en: 'Top outlets', fr: 'Meilleurs médias' }

const segmentRow = {
  id: SEGMENT_ID,
  name,
  description,
  created_at: '2026-09-08T10:00:00Z',
  updated_at: '2026-09-08T10:00:00Z',
}

const membershipRow = {
  id: MEMBERSHIP_ID,
  comms_contact_id: CONTACT_ID,
  comms_segment_id: SEGMENT_ID,
  created_at: '2026-09-08T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  setNextResponse({ data: null, error: null })
})

describe('segmentsApi', () => {
  it('lists segments', async () => {
    setNextResponse({ data: [segmentRow], error: null })
    const result = await listSegments(ORG_ID)
    expect(fromMock).toHaveBeenCalledWith('comms_contact_segments')
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toEqual(name)
    expect(result[0]!.description).toEqual(description)
  })

  it('creates a segment', async () => {
    setNextResponse({ data: segmentRow, error: null })
    const result = await createSegment(ORG_ID, { name, description })
    expect(fromMock).toHaveBeenCalledWith('comms_contact_segments')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        name,
        description,
      }),
    )
    expect(result.name).toEqual(name)
  })

  it('deletes memberships before deleting the segment', async () => {
    setNextResponse({ data: null, error: null })
    await deleteSegment(ORG_ID, SEGMENT_ID)
    expect(fromMock.mock.calls).toEqual([
      ['comms_contact_segment_memberships'],
      ['comms_contact_segments'],
    ])
    expect(builder.delete).toHaveBeenCalledTimes(2)
    expect(builder.eq.mock.calls).toEqual([
      ['comms_segment_id', SEGMENT_ID],
      ['organization_id', ORG_ID],
      ['id', SEGMENT_ID],
      ['organization_id', ORG_ID],
    ])
  })

  it('lists segment memberships', async () => {
    setNextResponse({ data: [membershipRow], error: null })
    const result = await listSegmentMemberships(ORG_ID)
    expect(fromMock).toHaveBeenCalledWith('comms_contact_segment_memberships')
    expect(result).toHaveLength(1)
    expect(result[0]!.contactId).toBe(CONTACT_ID)
    expect(result[0]!.segmentId).toBe(SEGMENT_ID)
  })

  it('adds a contact to a segment', async () => {
    setNextResponse({ data: membershipRow, error: null })
    const result = await addContactToSegment(ORG_ID, CONTACT_ID, SEGMENT_ID)
    expect(fromMock).toHaveBeenCalledWith('comms_contact_segment_memberships')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        comms_contact_id: CONTACT_ID,
        comms_segment_id: SEGMENT_ID,
      }),
    )
    expect(result.contactId).toBe(CONTACT_ID)
  })

  it('removes a contact from a segment', async () => {
    setNextResponse({ data: null, error: null })
    await removeContactFromSegment(ORG_ID, MEMBERSHIP_ID)
    expect(fromMock).toHaveBeenCalledWith('comms_contact_segment_memberships')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', MEMBERSHIP_ID)
    expect(builder.eq).toHaveBeenCalledWith('organization_id', ORG_ID)
  })
})
