/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * RLS regression guard.
 *
 * On 2026-08-08 an audit found three tables that the anonymous PostgREST role
 * could read in full — beta_signups (every waitlist email), hr_documents, and
 * signatures — because a world-open `using (true)` SELECT policy had been
 * applied straight to the database with no migration behind it. Migration 0073
 * closed the holes. Nothing, though, would have caught them: the schema in the
 * repo looked correct, every test passed, and the only evidence was rows coming
 * back from a request nobody in CI was making.
 *
 * This script makes that request. As the anonymous role — the same role an
 * unauthenticated browser uses — it reads each table that must never expose
 * rows to the public and fails if any of them do. It is the runtime mirror of
 * check-migrations.mjs: that one asks whether the database's migration history
 * matches the repo, this one asks whether the database's actual access control
 * matches what we believe it to be, which a migration file cannot prove because
 * a policy can be changed out-of-band exactly as this one was.
 *
 * Two things make the check trustworthy rather than merely green:
 *
 *   - A POSITIVE CONTROL. An expired or malformed anon key makes PostgREST
 *     answer 401 to everything, which would otherwise read as "every table is
 *     locked down — pass". So we first confirm the key can read a table that is
 *     meant to be public (service_status). If that read fails, the key or the
 *     endpoint is wrong and every negative result below is meaningless, so we
 *     error out instead of reporting a false all-clear.
 *   - LOUD SKIPPING. With no credentials the check cannot run; on GitHub Actions
 *     that skip is announced as a warning annotation and a job-summary entry so
 *     a green check is never mistaken for a verified one — the same discipline
 *     check-migrations.mjs uses.
 *
 * Dependency-free on purpose: Node's global fetch only, so this cannot rot
 * behind a package upgrade, and it needs only the PUBLIC anon key (safe to hold
 * as a repository variable) plus the project URL.
 */

import { appendFile } from 'node:fs/promises'
import { cleanSecret, describeSecret } from './lib/secrets.mjs'

/**
 * Tables the anonymous role must never return rows from. Every entry is a place
 * where a row leaking to the public is a data-exposure incident: personal
 * contact details, HR documents, or e-signatures. Add a table here the moment
 * it starts holding anything a logged-out visitor must not see — the cost of a
 * spurious entry (a table that is legitimately empty) is nothing, since an empty
 * table passes; the cost of a missing one is the incident this file exists to
 * prevent.
 */
const SENSITIVE_TABLES = [
  'beta_signups',
  'hr_documents',
  'signatures',
  'platform_capacity_config',
  'organization_admission_waitlist',
  'organization_admission_log',
  'hr_generated_documents',
  'hr_document_versions',
  'hr_document_audit_events',
  'hr_document_signatures',
  'hr_document_recipients',
  'hr_document_exports',
  'ai_advisor_credits',
  'ai_advisor_overage_months',
]

/**
 * A table the anonymous role is MEANT to read, with at least one row. Its only
 * job is to prove the anon key is valid and PostgREST honours it — so that a
 * "no rows" result on the sensitive tables above means "RLS blocked the read",
 * not "the key was rejected and everything 401s". service_status is public by
 * design (the app reads it before a user signs in) and is seeded, so it always
 * has rows.
 */
const POSITIVE_CONTROL = 'service_status'

/**
 * A skipped check must not read as a passed one — same reasoning as
 * check-migrations.mjs. Locally the console line is the whole audience; in CI a
 * silent skip is a green required check whose real meaning is "unverified", so
 * we surface it where results are actually read.
 */
async function announceSkippedCheck(message) {
  if (process.env.GITHUB_ACTIONS !== 'true') return

  console.log(`::warning title=RLS regression unchecked::${message}`)

  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return
  try {
    await appendFile(
      summaryPath,
      '### RLS regression: UNCHECKED\n\n' +
        `${message}\n\n` +
        'Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the public anon key is safe ' +
        'as a repository variable) to turn this step into a real check.\n\n',
    )
  } catch (error) {
    console.log(`check-rls: could not write the CI job summary — ${error.message}`)
  }
}

/* Cleaned for the same reason the drift check cleans its token: a pasted value
   with a trailing newline or wrapping quotes fails as an opaque 401, which on
   THIS check would be doubly bad — the positive control would trip and report
   a broken key rather than the RLS answer it exists to give. */
const rawUrl = cleanSecret(process.env.SUPABASE_URL)
const anonKey = cleanSecret(process.env.SUPABASE_ANON_KEY)

if (!rawUrl || !anonKey) {
  const message =
    'Nothing read the tables as the anonymous role, so a green result here means ' +
    '"RLS unchecked", not "RLS holds". A world-open SELECT policy applied straight ' +
    'to the database — exactly the 2026-08-08 incident — would leak every row to ' +
    'the public and this check would still be green.'
  console.log(
    'check-rls: skipped — set SUPABASE_URL and SUPABASE_ANON_KEY to read the ' +
      'sensitive tables as the anonymous role.',
  )
  await announceSkippedCheck(message)
  process.exit(0)
}

let base = rawUrl
while (base.endsWith('/')) {
  base = base.slice(0, -1)
}

/**
 * Read at most one row from a table as the anonymous role, asking PostgREST for
 * an exact count so we can report how many rows are actually exposed. Returns
 * the HTTP status and the visible-row count (or null when the body/headers do
 * not carry one).
 */
async function probe(table) {
  const response = await fetch(`${base}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      /* Ask for the total row count visible under RLS; PostgREST returns it in
         the Content-Range header, formatted as start-end then a slash then the
         total (the start-end is a bare asterisk when the range is unsatisfied). */
      Prefer: 'count=exact',
    },
  })

  let count = null
  const range = response.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    if (total && total !== '*') count = Number(total)
  }

  let body = ''
  try {
    body = await response.text()
  } catch {
    /* Body is a diagnostic nicety; never fail the probe over reading it. */
  }

  /* Fall back to the returned array length when no count header came back. */
  if (count === null && response.ok) {
    try {
      const rows = JSON.parse(body)
      if (Array.isArray(rows)) count = rows.length
    } catch {
      /* Non-JSON body on a 200 is itself odd, but the caller decides. */
    }
  }

  return { status: response.status, count, body: body.slice(0, 200) }
}

const problems = []

/* ── 1. Positive control: prove the key can read what it should ───────────── */

try {
  const control = await probe(POSITIVE_CONTROL)
  if (![200, 206].includes(control.status)) {
    console.error(
      `check-rls: positive control ${POSITIVE_CONTROL} returned ${control.status} — ` +
        `the anon key or SUPABASE_URL is wrong, so every result below is meaningless.\n` +
        `  SUPABASE_ANON_KEY ${describeSecret(process.env.SUPABASE_ANON_KEY)}` +
        (control.body ? `\n  body: ${control.body}` : ''),
    )
    process.exit(1)
  }
  if (!control.count || control.count < 1) {
    console.error(
      `check-rls: positive control ${POSITIVE_CONTROL} returned 0 rows — either the ` +
        'anon read path is broken or the table is unexpectedly empty. Cannot trust a ' +
        '"no rows" result on the sensitive tables, so failing rather than passing blind.',
    )
    process.exit(1)
  }
  console.log(`check-rls: positive control ${POSITIVE_CONTROL} readable (${control.count} row(s)) — anon key valid`)
} catch (error) {
  /* A network failure must not read as "all locked down". */
  console.error(`check-rls: could not reach ${base} — ${error.message}`)
  process.exit(1)
}

/* ── 2. Negative controls: sensitive tables must expose nothing ───────────── */

for (const table of SENSITIVE_TABLES) {
  let result
  try {
    result = await probe(table)
  } catch (error) {
    console.error(`check-rls: could not probe ${table} — ${error.message}`)
    process.exit(1)
  }

  /* A permission-denied answer is the strongest safe result: the anon role
     cannot even attempt the read. An empty 200 is also safe — RLS returned no
     rows. Any other status is unexpected on a table we know exists, so treat it
     as a failure to determine rather than a pass. */
  if (result.status === 401 || result.status === 403) {
    console.log(`check-rls: ${table} denied to anon (${result.status}) — OK`)
    continue
  }
  if (![200, 206].includes(result.status)) {
    const bodyHint = result.body ? ` (body: ${result.body})` : ''
    problems.push(
      `${table}: unexpected status ${result.status} as anon — cannot confirm it is ` +
        'locked down' +
        bodyHint,
    )
    continue
  }
  if (result.count && result.count > 0) {
    problems.push(
      `${table}: readable by the anonymous role — ${result.count} row(s) exposed to the ` +
        'public. A world-open RLS policy is live; revoke it (see migration 0073).',
    )
    continue
  }
  console.log(`check-rls: ${table} returns no rows to anon — OK`)
}

if (problems.length > 0) {
  console.error('\ncheck-rls: FAILED')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error(
    '\nA sensitive table readable by the anonymous role is a data-exposure incident: ' +
      'anyone on the internet can read it with the public anon key. Close the policy ' +
      'with a migration before merging.',
  )
  process.exit(1)
}

console.log(`check-rls: OK — ${SENSITIVE_TABLES.length} sensitive table(s) locked down, control verified`)
