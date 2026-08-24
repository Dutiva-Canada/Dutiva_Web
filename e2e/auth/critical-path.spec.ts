/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { test, expect, type Page } from '@playwright/test'

/**
 * Critical path: signed-in admin → Production mode → Employees empty →
 * create one employee → assert list → remove (teardown).
 *
 * Session comes from globalSetup storageState (no inbox / magic-link click).
 */

const EMPLOYEE_NAME = 'E2E Playwright Employee'
const CASE_TITLE = 'E2E Playwright Case'

async function enableProductionMode(page: Page) {
  await page.goto('/app/settings')
  const productionTab = page.getByRole('tab', { name: 'Production' })
  await expect(productionTab).toBeVisible({ timeout: 30_000 })
  await productionTab.click()
  await expect(productionTab).toHaveAttribute('aria-selected', 'true')
  /* Fail fast if org capacity blocks bootstrap (Add employee never appears). */
  await expect(page.getByRole('alert')).toHaveCount(0)
}

test.describe('auth + workspace mode + employees CRUD', () => {
  test('production empty → add employee → list shows row', async ({ page }) => {
    await page.goto('/app/home')
    await expect(page.locator('#root')).not.toBeEmpty()
    /* Signed-in admins land in the workspace shell, not the welcome gate. */
    await expect(page).not.toHaveURL(/\/app\/welcome/)

    await enableProductionMode(page)

    /* Capacity / bootstrap can take a beat before organizationId resolves. */
    await page.goto('/app/employees')
    await expect(page.getByRole('button', { name: 'Add employee' })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText('No employees yet')).toBeVisible()

    await page.getByRole('button', { name: 'Add employee' }).click()
    await page.getByLabel('Full name').fill(EMPLOYEE_NAME)
    await page.getByLabel('Job title').fill('E2E Coordinator')
    await page.getByRole('button', { name: 'Save employee' }).click()

    await expect(page.getByText(EMPLOYEE_NAME)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('1 employee')).toBeVisible()

    await page.getByRole('button', { name: `Remove — ${EMPLOYEE_NAME}` }).click()
    await expect(page.getByText(EMPLOYEE_NAME)).toHaveCount(0)
    await expect(page.getByText('No employees yet')).toBeVisible()
  })

  test('production search overlay opens from keyboard shortcut', async ({ page }) => {
    await enableProductionMode(page)

    await page.goto('/app/home')
    await expect(page).not.toHaveURL(/\/app\/welcome/)
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible({ timeout: 10_000 })
  })

  test('production documents repository shows honest empty state', async ({ page }) => {
    await enableProductionMode(page)

    await page.goto('/app/documents')
    await expect(page).not.toHaveURL(/\/app\/welcome/)
    await expect(page.getByText('No documents yet')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('production cases empty → create case → list shows row → remove', async ({ page }) => {
    await enableProductionMode(page)

    await page.goto('/app/cases')
    await expect(page).not.toHaveURL(/\/app\/welcome/)
    await expect(page.getByRole('button', { name: 'New case' })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText('No cases yet')).toBeVisible()

    await page.getByRole('button', { name: 'New case' }).click()
    await page.getByLabel('Case title').fill(CASE_TITLE)
    await page.getByRole('button', { name: 'Create case' }).click()

    await expect(page.getByText(CASE_TITLE)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('1 case')).toBeVisible()

    await page.getByRole('button', { name: `Remove — ${CASE_TITLE}` }).click()
    await expect(page.getByText(CASE_TITLE)).toHaveCount(0)
    await expect(page.getByText('No cases yet')).toBeVisible()
  })
})
