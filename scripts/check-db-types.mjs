/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Generated database types parity guard.
 *
 * `npm run db:types` writes the same generated file to two places —
 * `src/lib/supabase/database.types.ts` for the Vite app and
 * `supabase/functions/_shared/database.types.ts` for the Deno edge
 * functions — because neither side can reach across the boundary. The copies
 * must stay byte-identical; a regenerate that writes only one (or a manual
 * edit to one) silently puts the app and the edge functions on different
 * table schemas, and nothing else in the gate would notice.
 *
 * Run: npm run check:db-types (part of `npm run check`)
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP = 'src/lib/supabase/database.types.ts'
const EDGE = 'supabase/functions/_shared/database.types.ts'

const [appSrc, edgeSrc] = await Promise.all([
  readFile(path.join(root, APP), 'utf8'),
  readFile(path.join(root, EDGE), 'utf8'),
])

if (appSrc === edgeSrc) {
  console.log(`check-db-types: OK — ${APP} and ${EDGE} identical`)
  process.exit(0)
}

/* Diagnose where they diverge so the fix is obvious: usually one copy was
   regenerated without the other, or one was edited by hand. */
const appLines = appSrc.split('\n')
const edgeLines = edgeSrc.split('\n')
let firstDiff = -1
const max = Math.max(appLines.length, edgeLines.length)
for (let i = 0; i < max; i++) {
  if (appLines[i] !== edgeLines[i]) {
    firstDiff = i + 1
    break
  }
}
console.error(`check-db-types: ${APP} and ${EDGE} differ (first diff at line ${firstDiff})`)
console.error('  app copy:  ' + (appLines[firstDiff - 1] ?? '<missing>'))
console.error('  edge copy: ' + (edgeLines[firstDiff - 1] ?? '<missing>'))
console.error('  Fix: run `npm run db:types` to regenerate both from the linked project.')
process.exit(1)
