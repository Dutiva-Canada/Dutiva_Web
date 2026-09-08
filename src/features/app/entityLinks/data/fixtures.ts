import type { EntityLink } from './types'

/**
 * Demo (Northgate Logistics) entity links. Target ids reference the demo
 * fixtures of each module: `rev-stream-*` / `rev-inv-*` (revenue), `deal-*`
 * (CRM) and `init-*` (Comms).
 */
export const entityLinksDemoOrgId = 'org-northgate-demo'

export const entityLinks: EntityLink[] = [
  {
    id: 'elink-1',
    organization_id: entityLinksDemoOrgId,
    from_table: 'revenue_streams',
    from_id: 'rev-stream-1',
    to_table: 'crm_deals',
    to_id: 'deal-1',
    relationship: 'relates_to',
    created_by: null,
    created_at: '2026-09-02T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
  },
  {
    id: 'elink-2',
    organization_id: entityLinksDemoOrgId,
    from_table: 'revenue_streams',
    from_id: 'rev-stream-2',
    to_table: 'comms_initiatives',
    to_id: 'init-1',
    relationship: 'relates_to',
    created_by: null,
    created_at: '2026-09-02T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
  },
  {
    id: 'elink-3',
    organization_id: entityLinksDemoOrgId,
    from_table: 'revenue_invoices',
    from_id: 'rev-inv-1',
    to_table: 'revenue_streams',
    to_id: 'rev-stream-1',
    relationship: 'relates_to',
    created_by: null,
    created_at: '2026-09-02T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
  },
]
