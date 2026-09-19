import { describe, expect, it } from 'vitest'
import { proposeOperationsAction } from './agentIntent'

describe('proposeOperationsAction — vendor', () => {
  it('proposes add_vendor for "add a vendor …"', () => {
    const p = proposeOperationsAction('add a vendor Staples Business Advantage')
    expect(p?.toolId).toBe('operations.add_vendor')
    expect(p?.params).toEqual({ name: 'Staples Business Advantage' })
  })

  it('proposes add_vendor for "ajoute un fournisseur …"', () => {
    const p = proposeOperationsAction('ajoute un fournisseur Groupe Alimex')
    expect(p?.toolId).toBe('operations.add_vendor')
    expect(p?.params).toEqual({ name: 'Groupe Alimex' })
  })

  it('ignores "add a contact …" — that’s CRM phrasing', () => {
    expect(proposeOperationsAction('add a contact Jean Tremblay')).toBeNull()
  })
})

describe('proposeOperationsAction — delivery', () => {
  it('proposes deliver_shipment for "mark the … shipment as delivered"', () => {
    const p = proposeOperationsAction('mark the workstation shipment as delivered')
    expect(p?.toolId).toBe('operations.deliver_shipment')
    // The whole phrase becomes the match title — findByName resolves it.
    expect(p?.params).toEqual({ title: 'workstation shipment' })
  })

  it('proposes deliver_shipment for the noun-free form', () => {
    const p = proposeOperationsAction('mark the new workstation order as delivered')
    expect(p?.toolId).toBe('operations.deliver_shipment')
    expect(p?.params).toEqual({ title: 'new workstation order' })
  })

  it('proposes deliver_shipment for "marque la livraison … comme livrée"', () => {
    const p = proposeOperationsAction('marque la livraison postes comme livrée')
    expect(p?.toolId).toBe('operations.deliver_shipment')
    expect(p?.params).toEqual({ title: 'postes' })
  })

  it('ignores "mark … as sent" — that’s communications phrasing', () => {
    expect(proposeOperationsAction('mark the offer letter as sent')).toBeNull()
  })
})

describe('proposeOperationsAction — project status', () => {
  it('proposes update_project for "mark the project … as completed"', () => {
    const p = proposeOperationsAction('mark the project office relocation as completed')
    expect(p?.toolId).toBe('operations.update_project')
    expect(p?.params).toEqual({ title: 'office relocation', status: 'completed' })
  })

  it('maps "on hold" to on_hold', () => {
    const p = proposeOperationsAction('mark the project racking audit as on hold')
    expect(p?.params).toEqual({ title: 'racking audit', status: 'on_hold' })
  })

  it('maps "done" to completed — the phrasing tasks would otherwise steal', () => {
    const p = proposeOperationsAction('mark the project relocation as done')
    expect(p?.toolId).toBe('operations.update_project')
    expect(p?.params).toEqual({ title: 'relocation', status: 'completed' })
  })

  it('proposes update_project for "set the project … to cancelled"', () => {
    const p = proposeOperationsAction('set the project racking audit to cancelled')
    expect(p?.params).toEqual({ title: 'racking audit', status: 'cancelled' })
  })

  it('proposes update_project for "marque le projet … comme terminé"', () => {
    const p = proposeOperationsAction('marque le projet déménagement comme terminé')
    expect(p?.toolId).toBe('operations.update_project')
    expect(p?.params).toEqual({ title: 'déménagement', status: 'completed' })
  })

  it('maps "en pause" to on_hold', () => {
    const p = proposeOperationsAction('marque le projet déménagement comme en pause')
    expect(p?.params).toEqual({ title: 'déménagement', status: 'on_hold' })
  })

  it('ignores "mark the task … as done" — no project noun, stays with tasks', () => {
    expect(proposeOperationsAction('mark the task PIP check-in as done')).toBeNull()
  })

  it('ignores "mark the PIP check-in as done" — no noun at all', () => {
    expect(proposeOperationsAction('mark the PIP check-in as done')).toBeNull()
  })
})

describe('proposeOperationsAction — non-matches', () => {
  it('returns null for empty and unrelated input', () => {
    expect(proposeOperationsAction('')).toBeNull()
    expect(proposeOperationsAction('what’s the weather')).toBeNull()
  })
})
