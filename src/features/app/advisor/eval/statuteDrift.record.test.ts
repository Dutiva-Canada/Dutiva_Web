import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runStatuteDriftCheck } from './statuteDrift'

/**
 * Statute-drift audit runner. Gated on STATUTE_DRIFT_RECORD: without it this
 * file is inert in the normal suite (the check hits live government sites —
 * e-Laws, LégisQuébec, laws-lois — and must never run inside `npm run test`).
 * scripts/check-statute-drift.mjs sets the env var and interprets the report;
 * the test itself only asserts the report was written — drift is data in the
 * report, not a test failure, so an unreachable government site can't wedge
 * the suite mid-write.
 */
const recordPath = process.env.STATUTE_DRIFT_RECORD

describe.skipIf(!recordPath)('statute drift — live source verification', () => {
  it('fetches every registry source and verifies cited sections still exist', async () => {
    const report = await runStatuteDriftCheck()
    mkdirSync(dirname(recordPath!), { recursive: true })
    writeFileSync(recordPath!, JSON.stringify(report, null, 2))
    const { summary } = report
    console.log(
      `[statute-drift] ${summary.ok}/${summary.checked} verified, ` +
        `${summary.drift} drifted, ${summary.unverified} unverified — ` +
        `${report.sources.filter((s) => s.status === 'fetched').length}/${report.sources.length} sources fetched`,
    )
    expect(summary.checked).toBeGreaterThan(0)
  }, 120_000)
})
