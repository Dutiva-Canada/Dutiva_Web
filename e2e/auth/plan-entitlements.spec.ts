/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { test } from '@playwright/test'

/**
 * Plan entitlements / Advisor usage — stub only.
 *
 * Full coverage needs a signed-in production org (migrations 0107–0111 are
 * applied; `advisor_usage_summary` exists). Do not invent credentials here.
 * The auth suite already gates on Supabase service-role env (`e2e/README.md`);
 * extend this spec when a plan/org fixture pattern exists.
 */
test.describe('plan entitlements (org usage)', () => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.E2E_PLAN_ENTITLEMENTS,
    'Needs auth env + E2E_PLAN_ENTITLEMENTS=1 after org billing migrations apply',
  )

  test('Settings shows Advisor usage when org summary RPC is live', async () => {
    /* Placeholder: navigate /app/settings in Production, assert usage panel
       copy once OA21 migrations + fixture org are available. */
    test.skip(true, 'No plan-entitlement fixture yet')
  })
})
