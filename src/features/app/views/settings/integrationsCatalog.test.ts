import { describe, expect, it } from 'vitest'
import { INTEGRATION_CATALOG, providerSpec } from './integrationsCatalog'

/**
 * The catalog is the source of truth the Settings UI renders — these checks
 * keep it consistent with the `workspace_integrations` provider CHECK
 * constraint (migration 0161, extended by 0164) and the honesty rules: only
 * providers with a real connect flow may leave 'planned', and PAT providers
 * always carry a token hint.
 */
describe('INTEGRATION_CATALOG', () => {
  it('uses only providers allowed by the workspace_integrations CHECK constraint', () => {
    const allowed = [
      'github',
      'gitlab',
      'gmail',
      'outlook',
      'smtp_email',
      'inbound_webhook',
      'inbound_email',
    ]
    for (const spec of INTEGRATION_CATALOG) {
      expect(allowed).toContain(spec.key)
    }
  })

  it('keeps provider keys unique', () => {
    const keys = INTEGRATION_CATALOG.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('marks github and gitlab as phase-1 connectable (pat)', () => {
    expect(providerSpec('github')?.auth).toBe('pat')
    expect(providerSpec('gitlab')?.auth).toBe('pat')
  })

  it('keeps OAuth providers planned until their flows exist', () => {
    for (const key of ['gmail', 'outlook'] as const) {
      expect(providerSpec(key)?.auth).toBe('planned')
    }
  })

  it('marks inbound_webhook as self-minting (no user credential)', () => {
    expect(providerSpec('inbound_webhook')?.auth).toBe('webhook')
  })

  it('requires a token hint on every PAT provider', () => {
    for (const spec of INTEGRATION_CATALOG) {
      if (spec.auth === 'pat') expect(spec.tokenHint).toBeTruthy()
    }
  })

  it('ships bilingual name and blurb on every provider', () => {
    for (const spec of INTEGRATION_CATALOG) {
      expect(spec.name.en).toBeTruthy()
      expect(spec.name.fr).toBeTruthy()
      expect(spec.blurb.en).toBeTruthy()
      expect(spec.blurb.fr).toBeTruthy()
    }
  })
})
