import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runGoldenEval } from './goldenEval'

/**
 * The 2c audit trail: when GOLDEN_EVAL_RECORD points at a path, this run
 * writes the full timestamped GoldenRunResult there. scripts/check-advisor-
 * golden.mjs sets it under eval-results/ — one JSON record per run so every
 * model/prompt/corpus change leaves a verifiable trail. Exit fails on any
 * failing check; coverage gaps are written into the record, never hidden.
 */
describe('advisor golden eval — audit record', () => {
  it('runs the set, writes the record, and reports the summary', () => {
    const result = runGoldenEval()
    const recordPath = process.env.GOLDEN_EVAL_RECORD
    if (recordPath) {
      mkdirSync(dirname(recordPath), { recursive: true })
      writeFileSync(recordPath, JSON.stringify(result, null, 2))
    }
    const { summary } = result
    console.log(
      `[golden-eval] v${result.suiteVersion} — ${summary.pass} pass, ${summary.fail} fail, ` +
        `${summary.gap} gap, accuracy ${(summary.accuracy * 100).toFixed(1)}%`,
    )
    expect(summary.failedChecks, JSON.stringify(summary.failedChecks, null, 2)).toEqual([])
  })
})
