/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Minimal .env loader for repo scripts — no dependency, no overrides.
 * check:migrations and check:rls read credentials from process.env; without a
 * loader they silently skip their live half on any checkout where the vars
 * aren't exported into the shell. Side-effect import:
 *
 *   import './lib/env.mjs'
 *
 * Shell-exported values always win — the file only fills gaps, so CI is
 * unaffected whether or not a .env file exists.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../.env')

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!m || line.trimStart().startsWith('#')) continue
    const value = m[2].trim().replace(/^["'](.*)["']\s*$/, '$1')
    if (process.env[m[1]] === undefined) process.env[m[1]] = value
  }
}
