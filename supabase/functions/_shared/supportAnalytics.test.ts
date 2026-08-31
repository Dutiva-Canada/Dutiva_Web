import { describe, expect, it } from 'vitest'
import { parseEvent, MAX_SEARCH_QUERY_LENGTH, MAX_VISITOR_ID_LENGTH } from './supportAnalytics'

const NOW = new Date('2026-08-06T12:00:00.000Z')

describe('parseEvent', () => {
  it('rejects non-object input', () => {
    expect(parseEvent(null, NOW)).toBeNull()
    expect(parseEvent('hello', NOW)).toBeNull()
    expect(parseEvent(42, NOW)).toBeNull()
    expect(parseEvent(undefined, NOW)).toBeNull()
  })

  it('rejects missing or invalid event_type', () => {
    expect(parseEvent({}, NOW)).toBeNull()
    expect(parseEvent({ event_type: 'unknown' }, NOW)).toBeNull()
    expect(parseEvent({ event_type: 42 }, NOW)).toBeNull()
  })

  it('parses a helpfulness_vote event', () => {
    const result = parseEvent(
      {
        event_type: 'helpfulness_vote',
        article_slug: 'resetting-your-password',
        vote_value: 'yes',
        anonymous_visitor_id: 'abc-123',
        locale: 'en',
      },
      NOW,
    )
    expect(result).toEqual({
      event_type: 'helpfulness_vote',
      article_slug: 'resetting-your-password',
      vote_value: 'yes',
      anonymous_visitor_id: 'abc-123',
      locale: 'en',
      occurred_at: '2026-08-06T12:00:00.000Z',
    })
  })

  it('rejects helpfulness_vote without article_slug or vote_value', () => {
    expect(parseEvent({ event_type: 'helpfulness_vote', vote_value: 'yes' }, NOW)).toBeNull()
    expect(parseEvent({ event_type: 'helpfulness_vote', article_slug: 'x' }, NOW)).toBeNull()
  })

  it('rejects helpfulness_vote with invalid vote_value', () => {
    expect(
      parseEvent({ event_type: 'helpfulness_vote', article_slug: 'x', vote_value: 'maybe' }, NOW),
    ).toBeNull()
  })

  it('parses a help_search event', () => {
    const result = parseEvent(
      {
        event_type: 'help_search',
        search_query: 'password reset',
        search_result_count: 3,
        anonymous_visitor_id: 'abc-123',
        locale: 'fr',
      },
      NOW,
    )
    expect(result).toEqual({
      event_type: 'help_search',
      search_query: 'password reset',
      search_result_count: 3,
      anonymous_visitor_id: 'abc-123',
      locale: 'fr',
      occurred_at: '2026-08-06T12:00:00.000Z',
    })
  })

  it('rejects help_search without search_query', () => {
    expect(parseEvent({ event_type: 'help_search' }, NOW)).toBeNull()
    expect(parseEvent({ event_type: 'help_search', search_result_count: 0 }, NOW)).toBeNull()
  })

  it('truncates a long search_query', () => {
    const longQuery = 'a'.repeat(MAX_SEARCH_QUERY_LENGTH + 50)
    const result = parseEvent({ event_type: 'help_search', search_query: longQuery }, NOW)
    expect(result?.search_query?.length).toBe(MAX_SEARCH_QUERY_LENGTH)
  })

  it('rejects negative search_result_count', () => {
    expect(
      parseEvent({ event_type: 'help_search', search_query: 'x', search_result_count: -1 }, NOW),
    ).toBeNull()
  })

  it('rejects non-integer search_result_count', () => {
    expect(
      parseEvent({ event_type: 'help_search', search_query: 'x', search_result_count: 1.5 }, NOW),
    ).toBeNull()
  })

  it('parses a help_article_view event', () => {
    const result = parseEvent(
      {
        event_type: 'help_article_view',
        article_slug: 'getting-started',
        anonymous_visitor_id: 'abc-123',
        locale: 'en',
      },
      NOW,
    )
    expect(result?.article_slug).toBe('getting-started')
  })

  it('rejects help_article_view without article_slug', () => {
    expect(parseEvent({ event_type: 'help_article_view' }, NOW)).toBeNull()
  })

  it('parses a ticket_submitted event with workspace_id', () => {
    const result = parseEvent(
      {
        event_type: 'ticket_submitted',
        workspace_id: 'org-uuid-123',
        ticket_reference: 'SUP-00042',
        ticket_category: 'technical',
        ticket_source: 'app_form',
        locale: 'en',
      },
      NOW,
    )
    expect(result).toEqual({
      event_type: 'ticket_submitted',
      workspace_id: 'org-uuid-123',
      ticket_reference: 'SUP-00042',
      ticket_category: 'technical',
      ticket_source: 'app_form',
      locale: 'en',
      occurred_at: '2026-08-06T12:00:00.000Z',
    })
  })

  it('rejects ticket_submitted missing required fields', () => {
    expect(
      parseEvent({ event_type: 'ticket_submitted', ticket_reference: 'SUP-001' }, NOW),
    ).toBeNull()
    expect(
      parseEvent(
        { event_type: 'ticket_submitted', ticket_reference: 'SUP-001', ticket_category: 'x' },
        NOW,
      ),
    ).toBeNull()
  })

  it('parses a ticket_status_changed event', () => {
    const result = parseEvent(
      {
        event_type: 'ticket_status_changed',
        ticket_reference: 'SUP-00042',
        ticket_category: 'technical',
        ticket_source: 'resolved',
        workspace_id: 'org-uuid-123',
      },
      NOW,
    )
    expect(result?.ticket_source).toBe('resolved')
  })

  it('truncates a long anonymous_visitor_id', () => {
    const longId = 'x'.repeat(MAX_VISITOR_ID_LENGTH + 20)
    const result = parseEvent(
      {
        event_type: 'help_article_view',
        article_slug: 'x',
        anonymous_visitor_id: longId,
      },
      NOW,
    )
    expect(result?.anonymous_visitor_id?.length).toBe(MAX_VISITOR_ID_LENGTH)
  })

  it('rejects invalid locale', () => {
    expect(
      parseEvent({ event_type: 'help_article_view', article_slug: 'x', locale: 'de' }, NOW),
    ).toBeNull()
  })

  it('rejects wrong-typed fields', () => {
    expect(parseEvent({ event_type: 'help_article_view', article_slug: 42 }, NOW)).toBeNull()
    expect(
      parseEvent({ event_type: 'help_article_view', article_slug: 'x', workspace_id: 42 }, NOW),
    ).toBeNull()
  })

  it('allows all optional fields to be absent', () => {
    const result = parseEvent({ event_type: 'help_article_view', article_slug: 'x' }, NOW)
    expect(result?.workspace_id).toBeUndefined()
    expect(result?.anonymous_visitor_id).toBeUndefined()
    expect(result?.locale).toBeUndefined()
  })

  it('parses a web_vital event', () => {
    const result = parseEvent(
      {
        event_type: 'web_vital',
        web_vital_name: 'LCP',
        web_vital_value: 2100,
        web_vital_rating: 'good',
        page_path: '/fr/guides',
        locale: 'fr',
      },
      NOW,
    )
    expect(result).toEqual({
      event_type: 'web_vital',
      web_vital_name: 'LCP',
      web_vital_value: 2100,
      web_vital_rating: 'good',
      page_path: '/fr/guides',
      locale: 'fr',
      occurred_at: '2026-08-06T12:00:00.000Z',
    })
  })

  it('rejects web_vital without required metric fields', () => {
    expect(
      parseEvent({ event_type: 'web_vital', web_vital_name: 'LCP', page_path: '/' }, NOW),
    ).toBeNull()
  })
})
