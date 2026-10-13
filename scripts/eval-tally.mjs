#!/usr/bin/env node
/**
 * Tally golden-eval — live-model quality scoreboard for invest-ai.
 *
 * Network-bound, opt-in: NOT part of `npm run check` (same posture as
 * check:statute-drift). Runs the versioned case set
 * (supabase/functions/invest-ai/goldenCases.ts) through the production
 * prompt builders against a configured model, scores the replies with the
 * same verifyReplyClaims the repair pass uses, and writes a timestamped
 * JSON record to eval-results/.
 *
 * Requires an OpenAI-compatible endpoint, from env or .env:
 *   TALLY_EVAL_BASE_URL   e.g. https://api.openai.com/v1
 *   TALLY_EVAL_API_KEY    bearer key
 *   TALLY_EVAL_MODEL      model id
 * (OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_MODEL work as fallbacks.)
 *
 *   node scripts/eval-tally.mjs
 *
 * Exit codes: 0 = no failing checks (gaps are reported, tolerated);
 * 1 = any failing check; 2 = missing model config.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const resultsDir = join(root, 'eval-results')

function envFromFile() {
  try {
    return Object.fromEntries(
      readFileSync(join(root, '.env'), 'utf8')
        .split('\n')
        .map((l) => l.match(/^([A-Z_0-9]+)=(.*)$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2].trim()]),
    )
  } catch {
    return {}
  }
}

const envFile = envFromFile()
const pick = (primary, fallback) =>
  process.env[primary] ?? envFile[primary] ?? process.env[fallback] ?? envFile[fallback]

const BASE_URL = pick('TALLY_EVAL_BASE_URL', 'OPENAI_BASE_URL')
const API_KEY = pick('TALLY_EVAL_API_KEY', 'OPENAI_API_KEY')
const MODEL = pick('TALLY_EVAL_MODEL', 'OPENAI_MODEL')

if (!BASE_URL || !API_KEY || !MODEL) {
  console.error(
    'eval-tally: needs TALLY_EVAL_BASE_URL, TALLY_EVAL_API_KEY and TALLY_EVAL_MODEL ' +
      '(env or .env; OPENAI_* fallbacks accepted)',
  )
  process.exit(2)
}

mkdirSync(resultsDir, { recursive: true })
const recordPath = join(resultsDir, `tally-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)

try {
  execSync('npx vitest run supabase/functions/invest-ai/goldenEval.record.test.ts', {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      TALLY_EVAL_BASE_URL: BASE_URL,
      TALLY_EVAL_API_KEY: API_KEY,
      TALLY_EVAL_MODEL: MODEL,
      TALLY_EVAL_RECORD: recordPath,
    },
  })
} catch {
  console.error('eval-tally: FAILING CHECKS — see the record for details')
  process.exit(1)
}

const record = JSON.parse(readFileSync(recordPath, 'utf8'))
writeFileSync(join(resultsDir, 'tally-latest.json'), JSON.stringify(record, null, 2))
const { summary } = record
console.log(`eval-tally: record ${recordPath.replace(root, '.')}`)
console.log(
  `eval-tally: ${summary.pass} pass / ${summary.fail} fail / ${summary.gap} gap — ` +
    `accuracy ${(summary.accuracy * 100).toFixed(1)}%`,
)
for (const g of summary.coverageGaps) console.log(`  · gap: ${g}`)
