/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { test, expect, type Page } from '@playwright/test'

/**
 * Critical path: signed-in admin → Production mode → module CRUD matrices.
 *
 * Covers employees, cases, tasks, communications, and memory (manager facts +
 * case resume summary). Session comes from globalSetup storageState (no inbox /
 * magic-link click).
 */

const EMPLOYEE_NAME = 'E2E Playwright Employee'
const CASE_TITLE = 'E2E Playwright Case'
const TASK_TITLE = 'E2E Playwright Task'
const COMM_TITLE = 'E2E Playwright Message'
const COMM_TITLE_EDITED = 'E2E Playwright Message (edited)'
const MEMORY_STATEMENT = 'E2E Playwright memory fact'
const MEMORY_STATEMENT_CORRECTED = 'E2E Playwright memory fact (corrected)'
const CASE_NARRATIVE_SUMMARY = 'E2E case resume summary'

async function enableProductionMode(page: Page) {
  await page.goto('/app/settings')
  const productionTab = page.getByRole('tab', { name: 'Production' })
  await expect(productionTab).toBeVisible({ timeout: 30_000 })
  await productionTab.click()
  await expect(productionTab).toHaveAttribute('aria-selected', 'true')
  /* Fail fast if org capacity blocks bootstrap (Add employee never appears). */
  await expect(page.getByRole('alert')).toHaveCount(0)
}

async function createEmployee(page: Page, name: string, title: string) {
  await page.goto('/app/employees')
  await expect(page.getByRole('button', { name: 'Add employee' })).toBeVisible({
    timeout: 45_000,
  })
  await page.getByRole('button', { name: 'Add employee' }).click()
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Job title').fill(title)
  await page.getByRole('button', { name: 'Save employee' }).click()
  await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 })
}

async function removeEmployee(page: Page, name: string) {
  await page.getByRole('button', { name: `Remove — ${name}` }).click()
  await expect(page.getByText(name)).toHaveCount(0)
}

async function createCase(page: Page, title: string) {
  await page.goto('/app/cases')
  await expect(page.getByRole('button', { name: 'New case' })).toBeVisible({
    timeout: 45_000,
  })
  await page.getByRole('button', { name: 'New case' }).click()
  await page.getByLabel('Case title').fill(title)
  await page.getByRole('button', { name: 'Create case' }).click()
  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 })
}

async function removeCase(page: Page, title: string) {
  await page.getByRole('button', { name: `Remove — ${title}` }).click()
  await expect(page.getByText(title)).toHaveCount(0)
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

    await createEmployee(page, EMPLOYEE_NAME, 'E2E Coordinator')
    await expect(page.getByText('1 employee')).toBeVisible()

    await removeEmployee(page, EMPLOYEE_NAME)
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

    await createCase(page, CASE_TITLE)
    await expect(page.getByText('1 case')).toBeVisible()

    await removeCase(page, CASE_TITLE)
    await expect(page.getByText('No cases yet')).toBeVisible()
  })
})

test.describe('auth + workspace mode + tasks CRUD', () => {
  test('production empty → add task → toggle done → remove', async ({ page }) => {
    await enableProductionMode(page)

    await page.goto('/app/planning/tasks')
    await expect(page).not.toHaveURL(/\/app\/welcome/)
    await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText('No tasks yet')).toBeVisible()

    await page.getByRole('button', { name: 'Add task' }).click()
    await page.getByLabel('Task').fill(TASK_TITLE)
    await page.getByRole('button', { name: 'Save task' }).click()

    await expect(page.getByText(TASK_TITLE)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('1 open')).toBeVisible()

    const toggle = page.getByRole('button', { name: 'Toggle task done' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('0 open')).toBeVisible()

    await page.getByRole('button', { name: `Remove — ${TASK_TITLE}` }).click()
    await expect(page.getByText(TASK_TITLE)).toHaveCount(0)
    await expect(page.getByText('No tasks yet')).toBeVisible()
  })
})

test.describe('auth + workspace mode + communications CRUD', () => {
  test('production empty → log message → edit → mark sent → remove', async ({ page }) => {
    await enableProductionMode(page)

    await page.goto('/app/communications')
    await expect(page).not.toHaveURL(/\/app\/welcome/)
    await expect(page.getByRole('button', { name: 'Log a message' })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText('No messages logged yet')).toBeVisible()

    await page.getByRole('button', { name: 'Log a message' }).click()
    await page.getByLabel('Title').fill(COMM_TITLE)
    await page.getByLabel('Audience').fill('All staff')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText(COMM_TITLE)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('1 message')).toBeVisible()

    await page.getByRole('button', { name: `Edit — ${COMM_TITLE}` }).click()
    await page.getByLabel('Title').fill(COMM_TITLE_EDITED)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(COMM_TITLE_EDITED)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(COMM_TITLE)).toHaveCount(0)

    await page.getByRole('button', { name: 'Mark as sent' }).click()
    await expect(page.getByText('Sent', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark as sent' })).toHaveCount(0)

    await page.getByRole('button', { name: `Remove — ${COMM_TITLE_EDITED}` }).click()
    await expect(page.getByText('Remove this message from the log?')).toBeVisible()
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page.getByText(COMM_TITLE_EDITED)).toHaveCount(0)
    await expect(page.getByText('No messages logged yet')).toBeVisible()
  })
})

test.describe('auth + workspace mode + memory CRUD', () => {
  test('manager → add fact → correct → forget (requires employee)', async ({ page }) => {
    await enableProductionMode(page)
    await createEmployee(page, EMPLOYEE_NAME, 'E2E Coordinator')

    await page.goto('/app/settings/memory')
    await expect(page).not.toHaveURL(/\/app\/welcome/)
    await expect(page.getByRole('button', { name: 'Add memory fact' })).toBeVisible({
      timeout: 45_000,
    })

    await page.getByRole('button', { name: 'Add memory fact' }).click()
    await page.getByLabel('Person').selectOption({ label: EMPLOYEE_NAME })
    await page.getByLabel('Statement (English)').fill(MEMORY_STATEMENT)
    await page.getByRole('button', { name: 'Save fact' }).click()

    await expect(page.getByText(MEMORY_STATEMENT)).toBeVisible({ timeout: 15_000 })

    const factRow = page.locator('div.group').filter({ hasText: MEMORY_STATEMENT })
    await factRow.getByRole('button', { name: 'Correct' }).click()
    await page.getByLabel('Correct this memory').fill(MEMORY_STATEMENT_CORRECTED)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(MEMORY_STATEMENT_CORRECTED)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(MEMORY_STATEMENT)).toHaveCount(0)

    const correctedRow = page.locator('div.group').filter({ hasText: MEMORY_STATEMENT_CORRECTED })
    await correctedRow.getByRole('button', { name: 'Forget' }).click()
    await expect(page.getByText(MEMORY_STATEMENT_CORRECTED)).toHaveCount(0)

    await page.goto('/app/employees')
    await removeEmployee(page, EMPLOYEE_NAME)
  })

  test('case memory → edit resume summary (requires case)', async ({ page }) => {
    await enableProductionMode(page)
    await createCase(page, CASE_TITLE)

    await page.goto('/app/settings/memory')
    await expect(page.getByRole('link', { name: CASE_TITLE })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('link', { name: CASE_TITLE }).click()
    await expect(page).toHaveURL(/\/app\/settings\/memory\/cases\//)

    await page.getByRole('button', { name: 'Edit resume summary' }).click()
    await page.getByLabel('Summary (English)').fill(CASE_NARRATIVE_SUMMARY)
    await page.getByRole('button', { name: 'Save resume summary' }).click()

    await expect(page.getByText(CASE_NARRATIVE_SUMMARY)).toBeVisible({ timeout: 15_000 })

    await page.goto('/app/cases')
    await removeCase(page, CASE_TITLE)
  })
})
