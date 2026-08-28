import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderSupportEmail } from './templates'
import type { EmailContext, NotificationKind } from './templates'

const ctx = (overrides: Partial<EmailContext> = {}): EmailContext => ({
  language: 'en',
  reference: 'DUT-2026-000001',
  ticketUrl: 'https://dutiva.ca/app/support/requests/abc',
  categoryLabel: 'Technical issue',
  responseTargetLabel: 'within 2 business days',
  priorityLabel: 'High',
  ...overrides,
})

const ALL_KINDS: NotificationKind[] = [
  'ticket_received',
  'agent_reply',
  'info_requested',
  'resolved',
  'closed',
  'call_proposed',
  'call_confirmed',
  'call_reminder',
  'call_followup_needed',
  'privacy_ack',
  'accessibility_ack',
  'security_ack',
  'complaint_ack',
  'operator_alert',
  'beta_signup',
  'beta_confirmation',
]

const TICKET_KINDS = ALL_KINDS.filter(
  (kind) => kind !== 'beta_signup' && kind !== 'beta_confirmation',
)

describe('renderSupportEmail', () => {
  it('renders every kind in EN and FR with a branded subject', () => {
    for (const kind of ALL_KINDS) {
      const en = renderSupportEmail(kind, ctx({ language: 'en' }))
      const fr = renderSupportEmail(kind, ctx({ language: 'fr' }))
      expect(en.subject).toContain('Dutiva Support')
      expect(fr.subject).toContain('Soutien Dutiva')
      // Subjects never carry body content / PII — only the reference.
      expect(en.subject).not.toContain('dutiva.ca/app')
      expect(en.text.length).toBeGreaterThan(0)
      expect(fr.text.length).toBeGreaterThan(0)
      expect(en.text).not.toBe(fr.text)
    }
  })

  it('keeps ticket notifications tied to their public reference', () => {
    for (const kind of TICKET_KINDS) {
      expect(renderSupportEmail(kind, ctx({ language: 'en' })).subject).toContain('DUT-2026-000001')
    }
  })

  it('customer templates link back to the authenticated ticket', () => {
    const linked: NotificationKind[] = [
      'ticket_received',
      'agent_reply',
      'info_requested',
      'resolved',
      'call_proposed',
      'call_confirmed',
      'call_reminder',
      'call_followup_needed',
      'privacy_ack',
      'accessibility_ack',
      'security_ack',
      'complaint_ack',
    ]
    for (const kind of linked) {
      expect(renderSupportEmail(kind, ctx()).text).toContain(
        'https://dutiva.ca/app/support/requests/abc',
      )
    }
  })

  it('ticket_received includes the target, resolution-varies note, and the no-secrets warning', () => {
    const r = renderSupportEmail('ticket_received', ctx())
    expect(r.text).toContain('within 2 business days')
    expect(r.text.toLowerCase()).toContain('resolution')
    expect(r.text.toLowerCase()).toContain('password')
  })

  it('operator_alert subject includes the priority label', () => {
    expect(
      renderSupportEmail('operator_alert', ctx({ priorityLabel: 'Critical' })).subject,
    ).toContain('Critical')
  })

  it('renders the beta signup operator alert without a ticket reference', () => {
    const r = renderSupportEmail(
      'beta_signup',
      ctx({
        reference: '',
        ticketUrl: 'https://dutiva.ca/app/support/admin',
        sourceLabel: 'Landing page',
        provinceLabel: 'Ontario',
      }),
    )
    expect(r.subject).toBe('Dutiva Support — New beta signup')
    expect(r.subject).not.toContain('DUT-2026')
    expect(r.text).toContain('A new beta signup was recorded.')
    expect(r.text).toContain('Source: Landing page')
    expect(r.text).toContain('Jurisdiction: Ontario')
    expect(r.text).toContain('https://dutiva.ca/app/support/admin')
  })

  it('renders the beta signup confirmation in the visitor language', () => {
    const r = renderSupportEmail(
      'beta_confirmation',
      ctx({
        language: 'fr',
        reference: '',
        ticketUrl: 'https://dutiva.ca/app/support/admin',
      }),
    )
    expect(r.subject).toBe('Soutien Dutiva — Inscription à la bêta reçue')
    expect(r.text).toContain('votre inscription à la bêta est enregistrée')
    expect(r.text).toContain('liste d’attente')
    expect(r.text).toContain('Dutiva offre un soutien pratique')
  })

  it('keeps the edge worker mirror aware of beta notification kinds', () => {
    const edgeWorker = readFileSync(
      new URL('../../../../supabase/functions/support-notify/index.ts', import.meta.url),
      'utf8',
    )
    expect(edgeWorker).toContain("case 'beta_signup'")
    expect(edgeWorker).toContain("case 'beta_confirmation'")
    expect(edgeWorker).toContain('SOURCE_LABELS')
    expect(edgeWorker).toContain('PROVINCE_LABELS')
  })
})
