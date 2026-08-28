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

/** Dispatch shells with both *DemoView and *ProductionView siblings. */
const DISPATCH_SHELL_MAX_LINES = 45
const DISPATCH_SHELL_ALLOWLIST = new Set(['src/features/app/views/home/HomeView.tsx'])

const errors = []
const warnings = []

function hasValueDataImport(content) {
  const withoutTypeImports = content.replace(/^\s*import\s+type\s+.+$/gm, '')
  return /from\s+['"]@\/data(?:\/|['"])/.test(withoutTypeImports)
}

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
const fileSet = new Set(files.map((f) => rel(f)))
const contentByRel = new Map()

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const r = rel(file)
  contentByRel.set(r, content)

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

  if (
    r.startsWith('src/features/app/views/') &&
    r.endsWith('View.tsx') &&
    !r.endsWith('DemoView.tsx') &&
    !r.endsWith('ProductionView.tsx') &&
    hasValueDataImport(content)
  ) {
    errors.push(`${r}: *View.tsx shells must not import @/data — use *DemoView.tsx`)
  }

  const lines = content.split('\n').length
  if (lines > MAX_SOURCE_LINES && !SIZE_ALLOWLIST.has(r)) {
    warnings.push(`${r}: ${lines} lines (>${MAX_SOURCE_LINES}) — consider splitting`)
  }
}

for (const r of contentByRel.keys()) {
  if (!r.startsWith('src/features/app/views/') || !r.endsWith('View.tsx')) continue
  if (r.endsWith('DemoView.tsx') || r.endsWith('ProductionView.tsx')) continue

  const dir = path.posix.dirname(r)
  const base = path.basename(r, 'View.tsx')
  const demoRel = `${dir}/${base}DemoView.tsx`
  const prodRel = `${dir}/${base}ProductionView.tsx`
  if (!fileSet.has(demoRel) || !fileSet.has(prodRel)) continue

  const content = contentByRel.get(r)
  const lines = content.split('\n').length

  if (!content.includes('useWorkspaceMode')) {
    errors.push(`${r}: workspace dispatch must call useWorkspaceMode()`)
  }
  if (!content.includes('DemoView') || !content.includes('ProductionView')) {
    errors.push(`${r}: workspace dispatch must render *DemoView and *ProductionView`)
  }
  if (hasValueDataImport(content)) {
    errors.push(`${r}: workspace dispatch shells must not import @/data — use *DemoView.tsx`)
  }
  if (!DISPATCH_SHELL_ALLOWLIST.has(r) && lines > DISPATCH_SHELL_MAX_LINES) {
    errors.push(
      `${r}: ${lines} lines — workspace dispatch shells stay under ${DISPATCH_SHELL_MAX_LINES} (move logic to *DemoView / *ProductionView)`,
    )
  }
}

for (const r of contentByRel.keys()) {
  if (!r.endsWith('ProductionView.tsx')) continue
  const content = contentByRel.get(r)
  if (hasValueDataImport(content)) {
    errors.push(`${r}: production views must not import demo fixtures from @/data`)
  }
}

for (const r of contentByRel.keys()) {
  if (!r.startsWith('src/features/app/views/') || !r.endsWith('ProductionView.tsx')) continue
  const dir = path.posix.dirname(r)
  const base = path.basename(r, 'ProductionView.tsx')
  const demoRel = `${dir}/${base}DemoView.tsx`
  const viewRel = `${dir}/${base}View.tsx`
  if (!fileSet.has(demoRel)) {
    errors.push(`${r}: missing paired ${demoRel}`)
  }
  if (!fileSet.has(viewRel)) {
    errors.push(`${r}: missing dispatch shell ${viewRel}`)
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
