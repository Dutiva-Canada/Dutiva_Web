import { describe, expect, it } from 'vitest'
import { proposeDocumentsAction } from './agentIntent'

describe('proposeDocumentsAction — approve', () => {
  it('proposes approve for "approve the offer letter for …"', () => {
    const p = proposeDocumentsAction('approve the offer letter for Chen')
    expect(p?.toolId).toBe('documents.approve')
    /* "for X" names the recipient — the title is what precedes it. */
    expect(p?.params).toEqual({ title: 'offer letter' })
  })

  it('proposes approve when the noun sits inside the title — "approve the termination letter"', () => {
    const p = proposeDocumentsAction('approve the termination letter')
    expect(p?.toolId).toBe('documents.approve')
    expect(p?.params).toEqual({ title: 'termination letter' })
  })

  it('proposes approve for "approve the document titled …"', () => {
    const p = proposeDocumentsAction('approve the document titled remote work policy')
    expect(p?.toolId).toBe('documents.approve')
    expect(p?.params).toEqual({ title: 'remote work policy' })
  })

  it('proposes approve for "approuve le contrat …"', () => {
    const p = proposeDocumentsAction('approuve le contrat de travail')
    expect(p?.toolId).toBe('documents.approve')
    expect(p?.params).toEqual({ title: 'de travail' })
  })

  it('proposes approve for "approuve la lettre …"', () => {
    const p = proposeDocumentsAction('approuve la lettre d’offre')
    expect(p?.toolId).toBe('documents.approve')
    expect(p?.params).toEqual({ title: 'd’offre' })
  })

  it('ignores "approve the decision …" — that’s governance phrasing', () => {
    expect(proposeDocumentsAction('approve the decision on the lease')).toBeNull()
  })

  it('ignores "approve the request for …" — that’s finance phrasing', () => {
    expect(proposeDocumentsAction('approve the request for laptops')).toBeNull()
  })

  it('ignores a bare "approve …" with no document noun', () => {
    expect(proposeDocumentsAction('approve the new hire')).toBeNull()
  })
})

describe('proposeDocumentsAction — send for signature', () => {
  it('proposes send_for_signature for "send … to EMAIL for signature"', () => {
    const p = proposeDocumentsAction('send the contract to jane@northgate.ca for signature')
    expect(p?.toolId).toBe('documents.send_for_signature')
    expect(p?.params).toEqual({ title: 'contract', email: 'jane@northgate.ca' })
  })

  it('captures a recipient name before the email', () => {
    const p = proposeDocumentsAction('send the offer to Jane Doe jane@northgate.ca')
    expect(p?.toolId).toBe('documents.send_for_signature')
    expect(p?.params).toEqual({
      title: 'offer',
      name: 'Jane Doe',
      email: 'jane@northgate.ca',
    })
  })

  it('proposes send_for_signature for "envoie … à EMAIL pour signature"', () => {
    const p = proposeDocumentsAction('envoie le contrat à jane@northgate.ca pour signature')
    expect(p?.toolId).toBe('documents.send_for_signature')
    expect(p?.params).toEqual({ title: 'contrat', email: 'jane@northgate.ca' })
  })

  it('captures a FR recipient name before the email', () => {
    const p = proposeDocumentsAction('envoie la lettre à Jane Doe jane@northgate.ca')
    expect(p?.toolId).toBe('documents.send_for_signature')
    expect(p?.params).toEqual({
      title: 'lettre',
      name: 'Jane Doe',
      email: 'jane@northgate.ca',
    })
  })

  it('ignores "send" with no email — a signature request needs a recipient', () => {
    expect(proposeDocumentsAction('send the contract to Jane')).toBeNull()
  })

  it('still proposes for a non-document title — the tool refuses the no-match honestly', () => {
    /* "send an email to …" isn't noun-guarded away: the confirm card shows
       exactly what it would do, and the executor fails "no document matches"
       if confirmed. Same trade-off as the other free-form parsers. */
    const p = proposeDocumentsAction('send an email to jane@northgate.ca')
    expect(p?.toolId).toBe('documents.send_for_signature')
    expect(p?.params).toEqual({ title: 'email', email: 'jane@northgate.ca' })
  })
})
