#!/usr/bin/env node
/**
 * Advisor golden-eval — deterministic compliance-harness runner (audit 2c).
 *
 * Runs the versioned golden set (src/features/app/advisor/eval/goldenCases.ts)
 * through the same deterministic layers a live Advisor turn uses — jurisdiction
 * detection, the committed corpus snapshot, response-gate construction, and the
 * statutory-figure cross-check — then writes a timestamped JSON audit record to
 * eval-results/ for every run.
 *
 * Exit codes: 0 = no failing checks (coverage gaps are reported, tolerated);
 * 1 = any failing check — a regression that must not ship; 2 = usage error.
 *
 *   node scripts/check-advisor-golden.mjs              run + write audit record
 *   node scripts/check-advisor-golden.mjs --export-corpus
 *     refresh advisorCorpusSnapshot.ts from the live project via the
 *     Management API (SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF)
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

/* --export-corpus: pull the live advisor_guidance_chunks table and rewrite
   the committed snapshot — corpus changes land as reviewable diffs, never
   silent drift. */
async function exportCorpus() {
  const env = envFromFile()
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? env.SUPABASE_ACCESS_TOKEN
  const ref = process.env.SUPABASE_PROJECT_REF ?? env.SUPABASE_PROJECT_REF
  if (!token || !ref) {
    console.error('check-advisor-golden: --export-corpus needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF')
    process.exit(2)
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query:
        'select jurisdiction, topic, title, content, source_url, source_name, effective_note, review_status, status ' +
        'from advisor_guidance_chunks order by jurisdiction, topic',
    }),
  })
  if (!res.ok) {
    console.error(`check-advisor-golden: Management API ${res.status} — ${await res.text()}`)
    process.exit(2)
  }
  const rows = await res.json()
  const ts = `/**
 * Read-only snapshot of the live advisor_guidance_chunks corpus (${rows.length} rows),
 * exported via the Supabase Management API on ${new Date().toISOString()}.
 *
 * The golden eval grounds every case against this committed snapshot so the
 * suite is deterministic and runs without credentials. Re-export with
 * scripts/check-advisor-golden.mjs --export-corpus to refresh it when the
 * live corpus changes deliberately; the file is versioned so every corpus
 * change is reviewed.
 */

import type { GuidanceChunk } from '../../../../../supabase/functions/advisor-chat/responsePayload'

export interface CorpusSnapshotRow extends GuidanceChunk {
  readonly status?: string | null
}

export const ADVISOR_CORPUS_SNAPSHOT: readonly CorpusSnapshotRow[] = ${JSON.stringify(rows, null, 2)}\n`
  writeFileSync(join(root, 'src/features/app/advisor/eval/advisorCorpusSnapshot.ts'), ts)
  console.log(`check-advisor-golden: snapshot refreshed — ${rows.length} chunks`)
}

async function main() {
  if (process.argv.includes('--export-corpus')) {
    await exportCorpus()
    return
  }

  mkdirSync(resultsDir, { recursive: true })
  const recordPath = join(resultsDir, `golden-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  try {
    execSync('npx vitest run src/features/app/advisor/eval/goldenEval.record.test.ts', {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, GOLDEN_EVAL_RECORD: recordPath },
    })
  } catch {
    console.error('check-advisor-golden: FAILING CHECKS — this regression must not ship')
    process.exit(1)
  }

  const record = JSON.parse(readFileSync(recordPath, 'utf8'))
  /* Latest record is committed as the audit evidence; the timestamped run
     history stays local (gitignored) so the tree doesn't accumulate JSON. */
  writeFileSync(join(resultsDir, 'golden-latest.json'), JSON.stringify(record, null, 2))
  const { summary } = record
  console.log(`check-advisor-golden: record ${recordPath.replace(root, '.')}`)
  console.log(
    `check-advisor-golden: ${summary.pass} pass / ${summary.fail} fail / ${summary.gap} gap — ` +
      `accuracy ${(summary.accuracy * 100).toFixed(1)}%`,
  )
  if (summary.coverageGaps.length > 0) {
    console.log(`check-advisor-golden: ${summary.coverageGaps.length} coverage gap(s):`)
    for (const g of summary.coverageGaps) console.log(`  · ${g.caseId} — ${g.name}: ${g.detail}`)
  }
}

await main()
