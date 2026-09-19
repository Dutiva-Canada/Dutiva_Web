import { describe, expect, it } from 'vitest'
import { proposeSecurityAction } from './agentIntent'

describe('proposeSecurityAction — report incident', () => {
  it('proposes report_incident for "report a security incident — …"', () => {
    const p = proposeSecurityAction('report a security incident — phishing email reported')
    expect(p?.toolId).toBe('security.report_incident')
    expect(p?.params).toEqual({ title: 'phishing email reported' })
  })

  it('proposes report_incident for "log an incident: …"', () => {
    const p = proposeSecurityAction('log an incident: stolen laptop')
    expect(p?.toolId).toBe('security.report_incident')
    expect(p?.params).toEqual({ title: 'stolen laptop' })
  })

  it('proposes report_incident for the trailing-noun form', () => {
    const p = proposeSecurityAction('report a phishing incident')
    expect(p?.toolId).toBe('security.report_incident')
    expect(p?.params).toEqual({ title: 'phishing' })
  })

  it('proposes report_incident for "consigne un incident de sécurité — …"', () => {
    const p = proposeSecurityAction('consigne un incident de sécurité — hameçonnage')
    expect(p?.toolId).toBe('security.report_incident')
    expect(p?.params).toEqual({ title: 'hameçonnage' })
  })

  it('proposes report_incident for "signale un incident de hameçonnage"', () => {
    const p = proposeSecurityAction('signale un incident de hameçonnage')
    expect(p?.toolId).toBe('security.report_incident')
    expect(p?.params).toEqual({ title: 'hameçonnage' })
  })
})

describe('proposeSecurityAction — resolve incident', () => {
  it('proposes resolve_incident for "resolve the incident …"', () => {
    const p = proposeSecurityAction('resolve the incident suspicious login')
    expect(p?.toolId).toBe('security.resolve_incident')
    expect(p?.params).toEqual({ title: 'suspicious login' })
  })

  it('proposes resolve_incident for the trailing-noun form', () => {
    const p = proposeSecurityAction('resolve the suspicious login incident')
    expect(p?.toolId).toBe('security.resolve_incident')
    expect(p?.params).toEqual({ title: 'suspicious login' })
  })

  it('proposes resolve_incident for "mark the incident … as resolved"', () => {
    const p = proposeSecurityAction('mark the incident phishing email as resolved')
    expect(p?.toolId).toBe('security.resolve_incident')
    expect(p?.params).toEqual({ title: 'phishing email' })
  })

  it('proposes resolve_incident for "mark the … incident as resolved"', () => {
    const p = proposeSecurityAction('mark the phishing incident as resolved')
    expect(p?.toolId).toBe('security.resolve_incident')
    expect(p?.params).toEqual({ title: 'phishing' })
  })

  it('proposes resolve_incident for "résous l\'incident …"', () => {
    const p = proposeSecurityAction("résous l'incident connexion suspecte")
    expect(p?.toolId).toBe('security.resolve_incident')
    expect(p?.params).toEqual({ title: 'connexion suspecte' })
  })

  it('proposes resolve_incident for "marque l\'incident … comme résolu"', () => {
    const p = proposeSecurityAction("marque l'incident hameçonnage comme résolu")
    expect(p?.toolId).toBe('security.resolve_incident')
    expect(p?.params).toEqual({ title: 'hameçonnage' })
  })
})

describe('proposeSecurityAction — access review', () => {
  it('proposes complete_access_review for "mark the access review … as done"', () => {
    const p = proposeSecurityAction('mark the access review Q3 admin as done')
    expect(p?.toolId).toBe('security.complete_access_review')
    expect(p?.params).toEqual({ title: 'Q3 admin' })
  })

  it('proposes complete_access_review for the trailing-noun form', () => {
    const p = proposeSecurityAction('mark the Q3 access review as done')
    expect(p?.toolId).toBe('security.complete_access_review')
    expect(p?.params).toEqual({ title: 'Q3' })
  })

  it('proposes complete_access_review for "complete the … access review"', () => {
    const p = proposeSecurityAction('complete the Q3 access review')
    expect(p?.toolId).toBe('security.complete_access_review')
    expect(p?.params).toEqual({ title: 'Q3' })
  })

  it('proposes complete_access_review for "termine la revue d\'accès …"', () => {
    const p = proposeSecurityAction("termine la revue d'accès T3")
    expect(p?.toolId).toBe('security.complete_access_review')
    expect(p?.params).toEqual({ title: 'T3' })
  })

  it('proposes complete_access_review for "marque la revue d\'accès … comme terminée"', () => {
    const p = proposeSecurityAction("marque la revue d'accès T3 comme terminée")
    expect(p?.toolId).toBe('security.complete_access_review')
    expect(p?.params).toEqual({ title: 'T3' })
  })
})

describe('proposeSecurityAction — noun guards', () => {
  it('ignores "mark the PIP check-in as done" — no security noun, stays with tasks', () => {
    expect(proposeSecurityAction('mark the PIP check-in as done')).toBeNull()
  })

  it('ignores "resolve the merger" — no incident noun', () => {
    expect(proposeSecurityAction('resolve the merger')).toBeNull()
  })

  it('ignores "complete the onboarding" — no access-review noun', () => {
    expect(proposeSecurityAction('complete the onboarding')).toBeNull()
  })

  it('ignores "report a bug" — no incident noun', () => {
    expect(proposeSecurityAction('report a bug')).toBeNull()
  })

  it('ignores "send the contract to jane@x.ca" — documents phrasing', () => {
    expect(proposeSecurityAction('send the contract to jane@x.ca')).toBeNull()
  })
})

describe('proposeSecurityAction — non-matches', () => {
  it('returns null for empty and unrelated input', () => {
    expect(proposeSecurityAction('')).toBeNull()
    expect(proposeSecurityAction('what’s the weather')).toBeNull()
  })
})
