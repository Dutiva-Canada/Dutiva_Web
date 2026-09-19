import { describe, expect, it } from 'vitest'
/* Registers every shipped tool — the registry this catalog mirrors. */
import '@/features/app/agent/ingest'
import { listTools } from '@/features/app/agent/registry'
import { AGENT_TOOLS } from './agentCatalog'

/**
 * Drift guard — the edge function can't import the client registry, so
 * `agentCatalog.ts` carries a mirror of it. A tool added, renamed or
 * re-parameterized on the client without updating the mirror fails here.
 */
describe('agentCatalog — parity with the client registry', () => {
  it('mirrors every registered tool id — no missing, no invented', () => {
    const clientIds = listTools()
      .map((t) => t.id)
      .sort()
    const catalogIds = AGENT_TOOLS.map((t) => t.id).sort()
    expect(catalogIds).toEqual(clientIds)
  })

  it('mirrors every tool’s param schema — name, type, required, enum', () => {
    for (const client of listTools()) {
      const mirror = AGENT_TOOLS.find((t) => t.id === client.id)
      expect(mirror, `${client.id} missing from the catalog`).toBeDefined()
      const clientParams = client.params.map((p) => ({
        name: p.name,
        type: p.type,
        required: p.required === true,
        enum: p.enum ? [...p.enum] : undefined,
      }))
      const mirrorParams = (mirror?.params ?? []).map((p) => ({
        name: p.name,
        type: p.type,
        required: p.required === true,
        enum: p.enum ? [...p.enum] : undefined,
      }))
      expect(mirrorParams, `${client.id} params drifted`).toEqual(clientParams)
    }
  })
})
