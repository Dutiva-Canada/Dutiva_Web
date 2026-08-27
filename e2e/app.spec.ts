import { test, expect } from '@playwright/test'
import { blockTrustedSite } from './block-trustedsite'

/**
 * The /app surface is a client-rendered SPA shell: dist/app.html ships an empty
 * root, and the server rewrites /app and /app/* to it (vercel.json). These
 * smoke tests prove that rewrite and that the shell boots. They stop at the
 * sign-in gate — the authenticated workspace needs a backend and is out of
 * scope for a hermetic build.
 */

test.describe('app surface', () => {
  test.beforeEach(async ({ page }) => {
    await blockTrustedSite(page)
  })
  test('rewrites /app/* to the SPA shell and boots the client app', async ({ page }) => {
    const response = await page.goto('/app/welcome')

    // The /app/* → app.html rewrite serves the shell, not a 404.
    expect(response?.status()).toBe(200)

    // The empty root mounts into a running app.
    await expect(page.locator('#root')).not.toBeEmpty()

    // It is the app shell, not the prerendered marketing home leaking through
    // the rewrite.
    await expect(page.getByText('Canadian HR compliance support')).toHaveCount(0)
  })

  test('rewrites an arbitrary deep /app path to the shell', async ({ page }) => {
    const response = await page.goto('/app/this/does/not/matter')
    expect(response?.status()).toBe(200)
    await expect(page.locator('#root')).toBeAttached()
  })
})
