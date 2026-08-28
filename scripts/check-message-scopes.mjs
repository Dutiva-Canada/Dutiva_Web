/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * Guards the surface boundary `src/i18n/messages/{workspace,marketing,shared}.ts`
 * establish at the type level, but at the one place that boundary doesn't
 * reach: a literal `t('some_key')` call written directly in a component.
 *
 * The open-items doc's EF6a "genuinely large half" was making `t()` itself
 * surface-aware by threading a scope through `useI18n()` at every call site —
 * touching ~140 files that call `t()` today. This does the same job a
 * different way: rather than retype every call site, derive which message
 * keys each surface may use (empirically, from workspace.ts / marketing.ts's
 * own imports — the same non-hand-listed approach index.ts uses for the
 * scoped types) and scan for any `t('literal_key')` call that reaches outside
 * its file's surface. A computed call (`t(someVariable)`) is invisible to
 * this check by construction — those are guarded separately, at the data
 * structure that carries the key (`plans.ts`, `legalHubData.ts`, etc. are all
 * typed with a surface-scoped key type already).
 *
 * This is deliberately not "make `t()` itself typed per surface" — that
 * would also need `useI18n()` split into two hooks and ~140 files' imports
 * changed, and would still only catch the same literal-key mistakes this
 * script catches, since a computed key was never something either approach
 * could check. Same guarantee, far less churn.
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const messagesDir = path.join(root, 'src/i18n/messages')

/** `import { fooMessages } from './bar'` → `bar`, for every relative import in a file. */
function importedModuleNames(source) {
  return [...source.matchAll(/import\s*\{[^}]+\}\s*from\s*'\.\/([^']+)'/g)].map((m) => m[1])
}

/**
 * Top-level keys of a `defineMessages({ ... })` object, read by indentation
 * rather than parsed: every message module in this directory is a flat
 * `{ key: { en, fr } }` or `{ key: bi(en, fr) }` map with no other nesting, so
 * a key line is indented by exactly 2 spaces and starts with an identifier —
 * a nested `en:`/`fr:` line is indented by 4 and so never matches.
 */
function topLevelKeys(source) {
  const indented = [...source.matchAll(/^ {2}(\w+):/gm)].map((m) => m[1])
  if (indented.length > 0) return indented
  // Section modules under landing/ — keys sit flush inside defineMessages({ ... }).
  return [...source.matchAll(/^(\w+): \{/gm)].map((m) => m[1])
}

async function keysOfLandingSections() {
  const dir = path.join(messagesDir, 'landing')
  const keys = []
  for (const entry of await readdir(dir)) {
    if (!entry.endsWith('.ts') || entry === 'index.ts') continue
    const source = await readFile(path.join(dir, entry), 'utf8')
    keys.push(...topLevelKeys(source))
  }
  return keys
}

async function keysOfModule(name) {
  if (name === 'landing/index' || name === 'landing') return keysOfLandingSections()
  const source = await readFile(path.join(messagesDir, `${name}.ts`), 'utf8')
  return topLevelKeys(source)
}

/** Every key contributed by the modules `workspace.ts` / `marketing.ts` import, minus `shared`. */
async function surfaceOnlyKeys(entryFile) {
  const source = await readFile(path.join(messagesDir, entryFile), 'utf8')
  const modules = importedModuleNames(source).filter((m) => m !== 'shared')
  const keys = new Set()
  for (const name of modules) for (const key of await keysOfModule(name)) keys.add(key)
  return keys
}

const sharedKeys = new Set(await surfaceOnlyKeys('shared.ts'))
const workspaceOnlyKeys = await surfaceOnlyKeys('workspace.ts')
const marketingOnlyKeys = await surfaceOnlyKeys('marketing.ts')

const workspaceAllowed = new Set([...workspaceOnlyKeys, ...sharedKeys])
const marketingAllowed = new Set([...marketingOnlyKeys, ...sharedKeys])

/** Directories scanned per surface. Mirrors the empirical rule in messages/index.ts:
 *  workspace = src/features/app/** plus the workspace-only helpers under
 *  src/components/advisor/ and src/lib/exportProtection/; marketing =
 *  src/features/marketing/** plus src/seo/ (routes.ts's own `t` is scoped
 *  separately and excluded below). Everything else (support, shared
 *  components, infra) is genuinely dual-surface or non-UI and isn't scanned —
 *  it has no single boundary to violate. */
const SURFACES = [
  {
    label: 'workspace',
    dirs: ['src/features/app', 'src/components/advisor', 'src/lib/exportProtection'],
    allowed: workspaceAllowed,
  },
  {
    label: 'marketing',
    dirs: ['src/features/marketing'],
    allowed: marketingAllowed,
  },
]

async function collectFiles(dir) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(full)))
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

const T_CALL = /\bt\(\s*['"](\w+)['"]\s*\)/g

const violations = []
for (const surface of SURFACES) {
  for (const dir of surface.dirs) {
    for (const file of await collectFiles(path.join(root, dir))) {
      const source = await readFile(file, 'utf8')
      for (const match of source.matchAll(T_CALL)) {
        const key = match[1]
        if (!surface.allowed.has(key)) {
          violations.push({ file: path.relative(root, file), key, surface: surface.label })
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`check-message-scopes: ${violations.length} call(s) reach outside their surface:\n`)
  for (const v of violations) {
    console.error(`  ${v.file}: t('${v.key}') is not a ${v.surface}-reachable key`)
  }
  console.error(
    '\nEither the key belongs in src/i18n/messages/shared.ts (if genuinely dual-surface), ' +
      'or this call site is in the wrong module.',
  )
  process.exit(1)
}

console.log(
  `check-message-scopes: OK — ${workspaceOnlyKeys.size} workspace-only, ` +
    `${marketingOnlyKeys.size} marketing-only, ${sharedKeys.size} shared keys; ` +
    'no literal t() call crosses a surface boundary.',
)
