/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke layer. It runs the production build (scripts/build → dist/)
 * behind e2e/serve-dist.mjs, which mirrors the Vercel routing contract, and
 * drives it in a real Chromium. Deliberately small and hermetic: no live
 * Supabase, no third-party calls — every assertion is about what the shipped
 * bundle does on its own (routing, prerender + hydration, the consent gate).
 *
 * Chromium resolution differs by host. This Claude execution environment ships
 * a browser at /opt/pw-browsers; GitHub Actions does not and installs its own
 * with `npx playwright install --with-deps chromium`. Point at the preinstalled
 * binary only when it exists, so one config runs unchanged in both places.
 */
const preinstalledChromium = '/opt/pw-browsers/chromium'
const executablePath = existsSync(preinstalledChromium) ? preinstalledChromium : undefined

const PORT = 4173
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  /* Auth critical-path lives under e2e/auth/ and uses playwright.auth.config.ts. */
  testIgnore: ['**/auth/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
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
