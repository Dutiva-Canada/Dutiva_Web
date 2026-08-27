import { test, expect } from '@playwright/test'
import { blockTrustedSite } from './block-trustedsite'

/**
 * Public marketing surface — the prerendered pages every visitor hits first.
 * Hermetic: the static server has no backend, so nothing here depends on
 * Supabase, and the assertions are about routing, prerender + hydration, and
 * the consent gate the bundle enforces on its own.
 */

test.describe('marketing surface', () => {
  test.beforeEach(async ({ page }) => {
    await blockTrustedSite(page)
  })
  test('home page loads, hydrates, and gates analytics behind the consent banner', async ({
    page,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    await page.goto('/')

    // Prerendered content is present.
    await expect(page).toHaveTitle(/Dutiva/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/compliance/i)

    // The consent banner is client-only (renders after mount), so its
    // appearance proves hydration ran — and it proves analytics are off by
    // default, since nothing was recorded before this point.
    const accept = page.getByRole('button', { name: 'Accept' })
    await expect(accept).toBeVisible()
    await expect(
      page.evaluate(() => localStorage.getItem('dutiva.analytics.consent')),
    ).resolves.toBeNull()

    // Accepting records consent and dismisses the banner.
    await accept.click()
    await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0)
    await expect(
      page.evaluate(() => localStorage.getItem('dutiva.analytics.consent')),
    ).resolves.toBe('true')

    // The choice persists across a reload — the banner does not return.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0)

    expect(crashes, `uncaught errors: ${crashes.join('; ')}`).toEqual([])
  })

  test('serves the French homepage with a localized banner', async ({ page }) => {
    await page.goto('/fr')
    await expect(page).toHaveTitle(/conformité RH/i)
    // The banner reads its copy from the URL-scoped language provider.
    await expect(page.getByRole('button', { name: 'Accepter' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept', exact: true })).toHaveCount(0)
  })

  test('navigates to a prerendered subpage', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle(/About Dutiva/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('returns a 404 status and page for an unknown URL', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
    await expect(page).toHaveTitle(/Page not found/)
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the homepage is fully prerendered (content without hydration)', async ({ page }) => {
    await page.goto('/')
    // No client runtime at all, yet the marketing copy is present — proof the
    // page is prerendered, not client-rendered into an empty shell.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/compliance/i)
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})
