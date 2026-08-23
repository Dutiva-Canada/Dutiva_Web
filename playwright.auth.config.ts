/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * Authenticated critical-path e2e — requires a Supabase-aware `dist/` build
 * (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` at build time) and
 * `SUPABASE_SERVICE_ROLE_KEY` for globalSetup session minting.
 *
 * Keep this separate from playwright.config.ts so the hermetic smoke suite
 * stays credential-free.
 */

const preinstalledChromium = '/opt/pw-browsers/chromium'
const executablePath = existsSync(preinstalledChromium) ? preinstalledChromium : undefined

const PORT = 4173
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e/auth',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './e2e/auth/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    storageState: 'e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: 'node e2e/serve-dist.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
