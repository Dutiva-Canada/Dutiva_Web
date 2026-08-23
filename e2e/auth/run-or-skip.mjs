/**
 * Entry for `npm run test:e2e:auth`. Skips cleanly when the service-role
 * secret is unset (fork PRs / unconfigured CI), matching the live-checks
 * posture — never fails the credential-free gate for missing auth secrets.
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon || !service) {
  console.log(
    'e2e-auth: skipping — need VITE_SUPABASE_URL (or SUPABASE_URL), VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY), and SUPABASE_SERVICE_ROLE_KEY',
  )
  process.exit(0)
}

const result = spawnSync(
  'npx',
  ['playwright', 'test', '-c', 'playwright.auth.config.ts'],
  { cwd: root, stdio: 'inherit', shell: true, env: process.env },
)

process.exit(result.status === null ? 1 : result.status)
