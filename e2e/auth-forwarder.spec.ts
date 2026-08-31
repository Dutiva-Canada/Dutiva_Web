import { test, expect } from '@playwright/test'
import { blockTrustedSite } from './block-trustedsite'

/**
 * index.html forwards Supabase auth redirects that land on the marketing root
 * to /app/auth/confirm — see public/bootstrap-auth.js and docs/AUTH_MAGIC_LINK.md.
 */
test.describe('magic-link forwarder', () => {
  test.beforeEach(async ({ page }) => {
    await blockTrustedSite(page)
  })
  test('redirects token_hash query params from / to the app confirm route', async ({ page }) => {
    await page.goto('/?token_hash=e2e-test-hash&type=magiclink')
    await expect(page).toHaveURL(/\/app\/auth\/confirm\?token_hash=e2e-test-hash/)
  })

  test('redirects implicit-flow hash tokens from /fr to the app confirm route', async ({
    page,
  }) => {
    await page.goto('/fr#access_token=e2e-token&refresh_token=e2e-refresh')
    await expect(page).toHaveURL(/\/app\/auth\/confirm#access_token=e2e-token/)
  })
})
