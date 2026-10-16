import { test, expect } from '@playwright/test'
import { blockTrustedSite } from './block-trustedsite'

/**
 * The workspace surface is a client-rendered SPA shell: dist/app.html ships an
 * empty root, and the server rewrites /workspace and /workspace/* to it
 * (vercel.json). These smoke tests prove that rewrite and that the shell
 * boots. They stop at the sign-in gate — the authenticated workspace needs a
 * backend and is out of scope for a hermetic build. Legacy /app/* paths serve
 * the same shell; the app redirects them to /workspace/* client-side.
 */

test.describe('app surface', () => {
  test.beforeEach(async ({ page }) => {
    await blockTrustedSite(page)
  })
  test('rewrites /workspace/* to the SPA shell and boots the client app', async ({ page }) => {
    const response = await page.goto('/workspace/welcome')

    // The /workspace/* → app.html rewrite serves the shell, not a 404.
    expect(response?.status()).toBe(200)

    // The empty root mounts into a running app.
    await expect(page.locator('#root')).not.toBeEmpty()

    // It is the app shell, not the prerendered marketing home leaking through
    // the rewrite.
    await expect(page.getByText('Canadian HR compliance support')).toHaveCount(0)
  })

  test('rewrites an arbitrary deep /workspace path to the shell', async ({ page }) => {
    const response = await page.goto('/workspace/this/does/not/matter')
    expect(response?.status()).toBe(200)
    await expect(page.locator('#root')).toBeAttached()
  })

  test('legacy /app/* still serves the shell and redirects to /workspace/*', async ({ page }) => {
    const response = await page.goto('/app/welcome')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/workspace\/welcome/)
    await expect(page.locator('#root')).not.toBeEmpty()
  })
})
