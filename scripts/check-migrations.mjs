/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * Migration integrity + drift check.
 *
 * Three features have now shipped inert because nothing compared what the repo
 * contains against what the project has actually applied:
 *
 *   - 0019_client_error_reports was never applied, so `report-error` posted
 *     crash reports to a table and RPC that did not exist. The README
 *     documented the feature as live.
 *   - The CHECK constraints on ai_telemetry_events never learned the
 *     vocabulary the edge functions write, so support-firstline's rate limit
 *     counted rows Postgres refused to store and never fired once.
 *   - advisor-safety-event returned 500 on every call for the same reason.
 *
 * Each was invisible: the code was merged, CI was green, and the failure only
 * showed up as an absence. This script makes that class of failure loud.
 *
 * Two halves, deliberately separable:
 *
 *   1. LOCAL (always runs, no credentials) — filename discipline. Catches a
 *      duplicated or malformed sequence number before it becomes an ordering
 *      ambiguity between two developers' branches.
 *   2. DRIFT (runs only when credentials are present) — every local migration
 *      compared against supabase_migrations.schema_migrations on the real
 *      project. Skips cleanly on forks and local checkouts rather than failing
 *      them, so it is safe in `npm run check`.
 *
 * Drift needs SUPABASE_ACCESS_TOKEN (a personal access token) and
 * SUPABASE_PROJECT_REF. In CI, add them as repository secrets and the step
 * starts enforcing on its own — no code change needed. Until they exist the
 * drift half skips, and on GitHub Actions that skip is announced as a warning
 * annotation and a job-summary entry so a green check is never mistaken for a
 * verified one (see announceSkippedDriftCheck).
 *
 * Dependency-free on purpose: Node's global fetch only, so this cannot rot
 * behind a package upgrade.
 */

import { appendFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ACCESS_TOKEN_HELP, cleanSecret, describeSecret } from './lib/secrets.mjs'
import {
  ACCEPTED_DUPLICATE_SEQUENCES,
  acceptedDuplicateSequenceNumbers,
} from './migration-ledger.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = path.join(root, 'supabase', 'migrations')

const FILENAME_RE = /^(\d{4})_([a-z0-9_]+)\.sql$/

const ACCEPTED_DUPLICATES = acceptedDuplicateSequenceNumbers()

/**
 * Slugs present in the repo that are deliberately not applied under their own
 * name on the live project. Keep this list short and justified — every entry
 * is a place where the repo and the database disagree on purpose.
 */
const ACCEPTED_UNAPPLIED = new Map([
  [
    'add_billing_profiles',
    'superseded by 0024_reconcile_billing_schema, which reconciled the live billing schema directly',
  ],
  [
    'doclib_seed',
    'applied as the split pair doclib_seed_window_open / doclib_seed_window_close (both present)',
  ],
  [
    'drop_doclib_demo_schema',
    'the demo objects are already absent from the project (verified via to_regclass)',
  ],
])

/**
 * Where this repository's migration history starts. Everything applied before
 * it is pre-repo scaffolding — 56 migrations that legitimately have no file
 * here, the same lineage as supabase/legacy-migrations/. Without this baseline
 * the reverse check below would report every one of them and be useless.
 */
const REPO_HISTORY_BEGINS_AT = 'doclib_schema'

/**
 * Applied migrations at or after the baseline that deliberately have no repo
 * file. The mirror of ACCEPTED_UNAPPLIED, and kept just as short: every entry
 * is a place the database knows something the repo does not.
 */
const ACCEPTED_UNTRACKED = new Map([
  ['doclib_seed_window_open', 'the applied half of the split pair for 0002_doclib_seed.sql'],
  ['doclib_seed_window_close', 'the applied half of the split pair for 0002_doclib_seed.sql'],
  [
    'hr_signing_reminder_schedule_part2',
    'intermediate MCP apply slice of 0083_hr_signing_reminder_schedule.sql; live schema matches the repo file',
  ],
])

const problems = []
const notes = []

/* ── 1. Local filename discipline ─────────────────────────────────────────── */

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()

if (files.length === 0) {
  console.error('check-migrations: no .sql files under supabase/migrations')
  process.exit(1)
}

const bySequence = new Map()
const localSlugs = new Map()

for (const file of files) {
  const match = FILENAME_RE.exec(file)
  if (!match) {
    problems.push(`${file}: filename must match NNNN_lower_snake_case.sql`)
    continue
  }
  const [, sequence, slug] = match
  bySequence.set(sequence, [...(bySequence.get(sequence) ?? []), file])
  if (localSlugs.has(slug)) {
    problems.push(`${slug}: slug used by both ${localSlugs.get(slug)} and ${file}`)
  }
  localSlugs.set(slug, file)
}

for (const [sequence, ledger] of ACCEPTED_DUPLICATE_SEQUENCES) {
  for (const file of ledger.files) {
    if (!files.includes(file)) {
      problems.push(`${file}: listed in migration ledger for ${sequence} but missing from supabase/migrations`)
    }
  }
}

for (const [sequence, owners] of bySequence) {
  if (owners.length > 1 && !ACCEPTED_DUPLICATES.has(sequence)) {
    problems.push(
      `${sequence}: sequence number used by ${owners.length} files (${owners.join(', ')}) — ` +
        'pick the next free number, or document it in scripts/migration-ledger.mjs if both are already applied',
    )
  }
  const ledger = ACCEPTED_DUPLICATE_SEQUENCES.get(sequence)
  if (ledger && owners.length > 1) {
    const expected = [...ledger.files].sort()
    const actual = [...owners].sort()
    if (expected.join('|') !== actual.join('|')) {
      problems.push(
        `${sequence}: accepted duplicate file set drift — expected ${expected.join(', ')}, got ${actual.join(', ')}`,
      )
    }
  }
}

const filenameProblems = problems.length
if (filenameProblems === 0) {
  console.log(`check-migrations: ${files.length} local migrations, filenames OK`)
}

/* ── 2. Drift against the live project ────────────────────────────────────── */

/**
 * A skipped drift check must not read as a passed one.
 *
 * Locally the console line below is the whole audience and that is fine. In CI
 * it is not: the step exits 0, the required check goes green, and the single
 * line saying nothing was compared sits in a log nobody opens. That is this
 * script's own failure mode reproduced in its reporting — a green signal whose
 * real meaning is "unchecked", which is exactly the class of silence the header
 * comment above says this file exists to end.
 *
 * So on GitHub Actions, put it where results are actually read: a warning
 * annotation (surfaced on the run and on the PR) plus a job-summary entry.
 * Neither fails the build — forks and local checkouts legitimately hold no
 * credentials, and failing them would be worse — but neither can be missed.
 */
async function announceSkippedDriftCheck(message) {
  if (process.env.GITHUB_ACTIONS !== 'true') return

  /* Workflow-command syntax; GitHub renders this as an annotation. */
  console.log(`::warning title=Migration drift unchecked::${message}`)

  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return
  try {
    await appendFile(
      summaryPath,
      '### Migration drift: UNCHECKED\n\n' +
        `${message}\n\n` +
        'Set `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` as repository ' +
        'secrets to turn this step into a real check.\n\n',
    )
  } catch (error) {
    /* The summary file is a convenience. Never fail a build over it. */
    console.log(`check-migrations: could not write the CI job summary — ${error.message}`)
  }
}

/* Cleaned, because a pasted secret carrying a trailing newline, wrapping
   quotes, or a "Bearer " prefix is the difference between this check working
   and a 401 nobody can read (see scripts/lib/secrets.mjs). */
const token = cleanSecret(process.env.SUPABASE_ACCESS_TOKEN)
const projectRef = cleanSecret(process.env.SUPABASE_PROJECT_REF)

if (!token || !projectRef) {
  const message =
    'Nothing compared the repo against the live project, so a green result on ' +
    'this step means "drift unchecked", not "no drift". A migration present in ' +
    'the repo but never applied leaves the feature that depends on it silently ' +
    'inert in production.'
  console.log(
    'check-migrations: drift check skipped — set SUPABASE_ACCESS_TOKEN and ' +
      'SUPABASE_PROJECT_REF to compare the repo against the live project.',
  )
  await announceSkippedDriftCheck(message)
} else {
  let applied
  let appliedRows
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query:
            'select version, name from supabase_migrations.schema_migrations order by version',
        }),
      },
    )
    if (!response.ok) {
      const body = (await response.text()).slice(0, 200)
      /* GitHub masks the secret inside the provider's reply, so a bad token
         reads as `401 {"message":"Format is Authorization: ***"}` — a message
         that names neither the cause nor the fix. Say both, describing the
         value's shape rather than the value. The body stays in the message so a
         403 that is NOT about the token (an egress proxy, say) is still legible
         rather than misdiagnosed. */
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `${response.status} ${body}\n` +
            `  SUPABASE_ACCESS_TOKEN ${describeSecret(process.env.SUPABASE_ACCESS_TOKEN)}.\n` +
            `  ${ACCESS_TOKEN_HELP}`,
        )
      }
      throw new Error(`${response.status} ${body}`)
    }
    appliedRows = await response.json()
    applied = new Set(appliedRows.map((row) => row.name))
  } catch (error) {
    /* A credentials or network failure must not read as "no drift". */
    console.error(`check-migrations: could not read applied migrations — ${error.message}`)
    process.exit(1)
  }

  for (const [slug, file] of localSlugs) {
    if (applied.has(slug)) continue
    const reason = ACCEPTED_UNAPPLIED.get(slug)
    if (reason) notes.push(`${file}: not applied — ${reason}`)
    else problems.push(`${file}: present in the repo but NOT applied to ${projectRef}`)
  }

  /* Reverse drift: applied on the project, absent from the repo.
   *
   * This direction was missing until 2026-08-06, when a migration
   * (purge_support_analytics_rate_limit) was applied straight to the project
   * with no file committed. The check was green throughout, because it only
   * ever asked whether repo files had been applied — never whether the
   * database was running something nobody could read. That is the worse
   * direction: an unapplied migration makes a feature inert and someone
   * eventually notices, while an uncommitted one is schema that exists only in
   * production and vanishes on any rebuild from source. */
  const baselineIndex = appliedRows.findIndex((row) => row.name === REPO_HISTORY_BEGINS_AT)
  if (baselineIndex === -1) {
    notes.push(
      `could not find "${REPO_HISTORY_BEGINS_AT}" on ${projectRef} — reverse drift not checked`,
    )
  } else {
    for (const row of appliedRows.slice(baselineIndex)) {
      if (localSlugs.has(row.name)) continue
      const reason = ACCEPTED_UNTRACKED.get(row.name)
      if (reason) notes.push(`${row.name}: applied, no repo file — ${reason}`)
      else
        problems.push(
          `${row.name} (version ${row.version}): applied to ${projectRef} but NOT in the repo`,
        )
    }
  }

  console.log(
    `check-migrations: ${applied.size} applied on ${projectRef}, ` +
      `${localSlugs.size} in the repo, ${notes.length} accepted difference(s)`,
  )
}

for (const note of notes) console.log(`  note: ${note}`)

if (problems.length > 0) {
  console.error('\ncheck-migrations: FAILED')
  for (const problem of problems) console.error(`  - ${problem}`)
  /* Only the drift failures carry this consequence; a malformed filename is
     just a filename. */
  if (problems.length > filenameProblems) {
    console.error(
      '\nA migration in the repo but not on the project means the feature that ' +
        'depends on it is silently inert in production.',
    )
  }
  process.exit(1)
}

console.log('check-migrations: OK')
