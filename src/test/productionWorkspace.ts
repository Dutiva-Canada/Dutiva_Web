/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { vi } from 'vitest'

/**
 * Builds the Supabase client mock that puts a view into **production mode**
 * with one organization: admin signed in, `workspace_preferences.mode` =
 * production, and `organization_members` resolving to `org-1`.
 *
 * Every production-mode view test needs the same four-table preamble before
 * it can assert anything about its own module, and seven test files had
 * copied it by hand before this existed. Pass handlers for the tables your
 * module actually touches; anything else throws, so a view that queries a
 * table the test did not expect fails loudly instead of returning undefined.
 *
 * The existing hand-rolled copies (policies, cases, employees, compliance,
 * tasks, calendar, reports, home) still work and were left alone — migrate
 * one when you are already editing it, not as a sweep.
 */

export const PRODUCTION_ORG_ID = 'org-1'

/**
 * Terminal stub for a list query, robust to how the boundary builds it:
 * awaiting the chain directly, adding more `.order()` calls, or ending in
 * `.range()` (the paginated readers — src/lib/supabasePagination.ts) all
 * resolve to the same rows. Mocks that stubbed `.order()` as a bare
 * Promise broke the moment a boundary gained a tie-break order or
 * pagination; this keeps them shape-agnostic.
 */
export function listChain(
  rows: unknown[],
  error: { code?: string; message?: string } | null = null,
): Record<string, unknown> {
  const result = { data: error ? null : rows, error }
  const chain: Record<string, unknown> = {
    order: () => chain,
    range: () => Promise.resolve(result),
    then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

export interface ProductionClientOptions {
  /** Per-table handlers for the module under test, keyed by table name. */
  tables: Record<string, () => unknown>
  /** Override the org id, or pass null to simulate a user with no org. */
  organizationId?: string | null
}

/**
 * Call inside the test, then `vi.resetModules()` and re-import the view so it
 * picks up the mock. Returns nothing — assert through the handlers you pass.
 */
export function mockProductionWorkspace({
  tables,
  organizationId = PRODUCTION_ORG_ID,
}: ProductionClientOptions): void {
  vi.doMock('@/lib/supabaseClient', () => ({
    supabase: {
      auth: {
        getSession: () =>
          Promise.resolve({
            data: { session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } } },
          }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      rpc: vi.fn((fn: string) =>
        Promise.resolve(
          fn === 'is_admin_user' ? { data: true, error: null } : { data: null, error: null },
        ),
      ),
      from: vi.fn((table: string) => {
        if (table === 'workspace_preferences') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { mode: 'production' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      legal_name: 'Dutiva Canada Inc.',
                      company_name: null,
                      primary_contact: 'Martin Constantineau',
                      province: 'Ontario',
                      city: 'Ottawa',
                    },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'organization_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: organizationId ? { organization_id: organizationId } : null,
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }
        }
        const handler = tables[table]
        if (handler) return handler()
        throw new Error(`unexpected table: ${table}`)
      }),
    },
  }))
}
