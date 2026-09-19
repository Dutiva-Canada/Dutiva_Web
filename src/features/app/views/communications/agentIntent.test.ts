import { describe, expect, it } from 'vitest'
import { proposeCommsAction } from './agentIntent'

/** Deterministic communications parser — register entries and records only. */
describe('proposeCommsAction', () => {
  it('logs a sent communication from "log that we sent X"', () => {
    const proposal = proposeCommsAction('log that we sent the RTO policy update')
    expect(proposal?.toolId).toBe('communications.log')
    expect(proposal?.params).toEqual({ title: 'RTO policy update', status: 'sent' })
  })

  it('logs a sent communication from French phrasing', () => {
    const proposal = proposeCommsAction('consigne que nous avons envoyé la politique')
    expect(proposal?.toolId).toBe('communications.log')
    expect(proposal?.params).toEqual({ title: 'politique', status: 'sent' })
  })

  it('logs a draft communication from "log a communication to X"', () => {
    const proposal = proposeCommsAction('log a communication to all staff')
    expect(proposal?.toolId).toBe('communications.log')
    expect(proposal?.params).toEqual({ title: 'all staff' })
  })

  it('marks an existing entry sent from "mark X as sent"', () => {
    const proposal = proposeCommsAction('mark the RTO letter as sent')
    expect(proposal?.toolId).toBe('communications.mark_sent')
    expect(proposal?.params).toEqual({ title: 'RTO letter' })
  })

  it('marks an existing entry sent from French phrasing', () => {
    const proposal = proposeCommsAction('marque la lettre comme envoyée')
    expect(proposal?.toolId).toBe('communications.mark_sent')
    expect(proposal?.params).toEqual({ title: 'lettre' })
  })

  it('returns null for unrelated text', () => {
    expect(proposeCommsAction('what should the memo say')).toBeNull()
    expect(proposeCommsAction('mark the review as done')).toBeNull()
    expect(proposeCommsAction('log a call with Amara')).toBeNull()
  })
})
