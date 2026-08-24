import { test, expect, type Page } from '@playwright/test'

/**
 * CSP regression — inline script bootstraps were externalized; these smoke
 * tests fail when the bundle triggers script-src violations on load.
 */

function attachCspListeners(page: Page) {
  const cspViolations: string[] = []
  const pageErrors: string[] = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (
      msg.type() === 'error' &&
      /content security policy|refused to execute inline script|refused to load the script|refused to apply inline style|violates the following Content Security Policy directive.*style-src/i.test(
        text,
      )
    ) {
      cspViolations.push(text)
    }
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  return { cspViolations, pageErrors }
}

test.describe('content security policy', () => {
  test('marketing home loads without CSP violations before analytics consent', async ({ page }) => {
    const { cspViolations, pageErrors } = attachCspListeners(page)

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    /* Consent banner proves hydration; do not accept — GA4 only loads after opt-in. */
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()

    expect(cspViolations, `CSP violations: ${cspViolations.join('; ')}`).toEqual([])
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([])
  })

  test('app welcome shell loads without CSP violations', async ({ page }) => {
    const { cspViolations, pageErrors } = attachCspListeners(page)

    const response = await page.goto('/app/welcome')
    expect(response?.status()).toBe(200)
    await expect(page.locator('#root')).not.toBeEmpty()

    expect(cspViolations, `CSP violations: ${cspViolations.join('; ')}`).toEqual([])
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([])
  })
})
