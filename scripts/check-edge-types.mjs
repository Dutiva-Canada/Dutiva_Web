/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Edge-function typecheck.
 *
 * `supabase/functions/**` runs on Deno, outside `tsc -b` — the app compiler
 * never sees those files, so a type error in an edge function only surfaces
 * at deploy time. This script runs `deno check` on every function entrypoint
 * when the Deno toolchain is available, and skips (like check:migrations
 * does without credentials) when it is not — a skip is reported loudly so
 * CI environments without Deno do not produce a false sense of coverage.
 *
 * Run: npm run check:edge-types (part of `npm run check`)
 */

import { spawnSync } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const functionsDir = path.join(root, 'supabase', 'functions')

const deno = spawnSync('deno', ['--version'], { encoding: 'utf8' })
if (deno.error || deno.status !== 0) {
  console.log(
    'check-edge-types: skipped — `deno` not on PATH. ' +
      'Edge functions are Deno-only and outside `tsc -b`; ' +
      'install Deno to typecheck them locally.',
  )
  process.exit(0)
}

const entrypoints = []
for (const name of await readdir(functionsDir)) {
  const dir = path.join(functionsDir, name)
  if (!(await stat(dir)).isDirectory() || name === '_shared') continue
  const entry = path.join(dir, 'index.ts')
  try {
    await stat(entry)
    entrypoints.push(entry)
  } catch {
    /* directory without an index.ts — not a function */
  }
}

let failures = 0
for (const entry of entrypoints) {
  const rel = path.relative(root, entry)
  const res = spawnSync('deno', ['check', entry], {
    cwd: functionsDir,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  })
  if (res.status === 0) {
    console.log(`check-edge-types: ok   ${rel}`)
  } else {
    failures++
    console.error(`check-edge-types: FAIL ${rel}`)
    console.error((res.stderr || res.stdout || '').trim())
  }
}

if (failures > 0) {
  console.error(`check-edge-types: ${failures} function(s) failed deno check`)
  process.exit(1)
}
console.log(`check-edge-types: OK — ${entrypoints.length} function(s) typechecked`)
