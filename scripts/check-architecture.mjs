/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Architecture guardrails for long-term maintainability.
 *
 * Run: npm run check:architecture
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src')

/** Marketing must not pull demo HR fixtures into the public bundle. */
const MARKETING_DATA_IMPORT = /from ['"]@\/data(?:\/|['"])/
const MARKETING_DATA_ALLOW = /from ['"]@\/data\/documents['"]/

/** Allowed oversized paths (generated catalogues, templates, fixtures). */
const SIZE_ALLOWLIST = new Set([
  'src/lib/supabase/database.types.ts',
  'src/features/app/documents/data/documents.ts',
  'src/data/chats.ts',
  'src/data/employees.ts',
  'src/features/app/views/advisor/advisorScenarios.ts',
  'src/features/app/views/analytics/AnalyticsProductionView.tsx',
  'src/features/app/documents/screens/DocumentDetailProductionView.tsx',
])

const MAX_SOURCE_LINES = 800

/** *View.tsx shells must not embed demo implementations inline. */
const INLINE_DEMO_VIEW = /(?:export\s+)?function\s+\w*DemoView\s*\(/

const errors = []
const warnings = []

async function walk(dir, acc = []) {
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name)
    const info = await stat(full)
    if (info.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue
      await walk(full, acc)
    } else if (/\.(ts|tsx)$/.test(name)) {
      acc.push(full)
    }
  }
  return acc
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/')
}

const files = await walk(src)

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const r = rel(file)

  if (r.startsWith('src/features/marketing/') && MARKETING_DATA_IMPORT.test(content)) {
    const allowed = MARKETING_DATA_ALLOW.test(content) && !/from ['"]@\/data['"]/.test(content)
    if (!allowed) {
      errors.push(`${r}: marketing code must not import @/data (use doclib catalogue or marketing/)`)
    }
  }

  if (r === 'src/i18n/messages/landing.ts') {
    errors.push('landing.ts monolith restored — use src/i18n/messages/landing/ section modules')
  }

  if (
    r.startsWith('src/features/app/views/') &&
    r.endsWith('View.tsx') &&
    !r.endsWith('DemoView.tsx') &&
    !r.endsWith('ProductionView.tsx') &&
    INLINE_DEMO_VIEW.test(content)
  ) {
    errors.push(`${r}: move demo UI to *DemoView.tsx (or WorkflowsDemoFixtures.tsx)`)
  }

  const lines = content.split('\n').length
  if (lines > MAX_SOURCE_LINES && !SIZE_ALLOWLIST.has(r)) {
    warnings.push(`${r}: ${lines} lines (>${MAX_SOURCE_LINES}) — consider splitting`)
  }
}

if (warnings.length > 0) {
  console.warn('check-architecture: warnings')
  for (const w of warnings) console.warn(`  ${w}`)
}

if (errors.length > 0) {
  console.error('check-architecture: FAIL')
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}

console.log(
  `check-architecture: OK (${files.length} source files scanned${warnings.length ? `, ${warnings.length} warning(s)` : ''})`,
)
