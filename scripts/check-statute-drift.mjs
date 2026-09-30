#!/usr/bin/env node
/**
 * Statute-drift check — periodic re-verification that the sections the
 * Advisor registry and corpus cite still exist in the official consolidated
 * texts (e-Laws, LégisQuébec, laws-lois FullText). The golden eval proves
 * internal consistency; this catches the world changing underneath it —
 * repealed sections, renumbering, amended figures.
 *
 * Network-bound and intentionally OUT of `npm run check`: government sites
 * rate-limit and occasionally interstitial bots, so it belongs to the
 * cadence pipeline (.woodpecker/statute-drift.yml, cron + manual), not the
 * deterministic pre-commit gate.
 *
 *   node scripts/check-statute-drift.mjs
 *
 * Exit codes: 0 = every check verified; 1 = drift (a cited section or its
 * figure marker is absent — investigate before the next corpus refresh);
 * 2 = inconclusive (a source could not be fetched — transient or the site
 * changed its access rules; nothing verified, nothing drifted).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const resultsDir = join(root, 'eval-results')

mkdirSync(resultsDir, { recursive: true })
const recordPath = join(resultsDir, `statute-drift-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)

try {
  execSync('npx vitest run src/features/app/advisor/eval/statuteDrift.record.test.ts', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, STATUTE_DRIFT_RECORD: recordPath },
  })
} catch {
  console.error('check-statute-drift: runner failed — see vitest output above')
  process.exit(2)
}

const report = JSON.parse(readFileSync(recordPath, 'utf8'))
writeFileSync(join(resultsDir, 'statute-drift-latest.json'), JSON.stringify(report, null, 2))

const { summary } = report
console.log(`check-statute-drift: record ${recordPath.replace(root, '.')}`)
for (const s of report.sources) {
  console.log(`  ${s.status === 'fetched' ? 'ok  ' : 'FAIL'} ${s.url}${s.detail ? ` — ${s.detail}` : ''}`)
}
console.log(
  `check-statute-drift: ${summary.ok}/${summary.checked} verified, ` +
    `${summary.drift} drifted, ${summary.unverified} unverified`,
)

if (report.findings.length > 0) {
  for (const f of report.findings) {
    console.log(`  · ${f.kind}${f.ref ? ` ${f.ref}` : ''}${f.row ? ` [${f.row}]` : ''} — ${f.detail}`)
  }
}

if (summary.drift > 0) {
  console.error('check-statute-drift: DRIFT — cited sections or figures no longer match the consolidated texts')
  process.exit(1)
}
/* Unreachable sources mean the check couldn't vouch — flag loudly but don't
   report drift; an offline statute site is not an amendment. */
if (report.sources.some((s) => s.status === 'failed')) {
  console.error('check-statute-drift: INCONCLUSIVE — one or more sources unreachable')
  process.exit(2)
}
console.log('check-statute-drift: OK')
