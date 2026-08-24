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
      /content security policy|refused to execute inline script|refused to load the script/i.test(
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
  test('marketing home loads without CSP script violations', async ({ page }) => {
    const { cspViolations, pageErrors } = attachCspListeners(page)

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('button', { name: 'Accept' }).click()

    expect(cspViolations, `CSP violations: ${cspViolations.join('; ')}`).toEqual([])
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([])
  })

  test('app welcome shell loads without CSP script violations', async ({ page }) => {
    const { cspViolations, pageErrors } = attachCspListeners(page)

    const response = await page.goto('/app/welcome')
    expect(response?.status()).toBe(200)
    await expect(page.locator('#root')).not.toBeEmpty()

    expect(cspViolations, `CSP violations: ${cspViolations.join('; ')}`).toEqual([])
    expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([])
  })
})
