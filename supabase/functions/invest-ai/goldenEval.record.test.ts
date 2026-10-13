import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runTallyEval, type TallyChatMessage } from './goldenEval'

/**
 * Live-model audit record for the Tally golden set. Skipped in `npm run
 * test` — it needs an OpenAI-compatible endpoint:
 *
 *   TALLY_EVAL_BASE_URL   e.g. https://api.openai.com/v1 (no trailing slash)
 *   TALLY_EVAL_API_KEY    bearer key
 *   TALLY_EVAL_MODEL      model id
 *
 * scripts/eval-tally.mjs resolves those from env or .env and points
 * TALLY_EVAL_RECORD at eval-results/. One JSON record per run so every
 * model/prompt change leaves a verifiable trail — the same posture as the
 * advisor golden record.
 */
const BASE_URL = process.env.TALLY_EVAL_BASE_URL ?? process.env.OPENAI_BASE_URL
const API_KEY = process.env.TALLY_EVAL_API_KEY ?? process.env.OPENAI_API_KEY
const MODEL = process.env.TALLY_EVAL_MODEL ?? process.env.OPENAI_MODEL

describe.skipIf(!BASE_URL || !API_KEY || !MODEL)('tally golden eval — audit record', () => {
  it(
    'runs the live set and writes the record',
    async () => {
      const callChat = async (messages: TallyChatMessage[]): Promise<string> => {
        const res = await fetch(`${BASE_URL!.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL,
            messages,
            temperature: 0.2,
            max_tokens: 1200,
          }),
        })
        if (!res.ok) throw new Error(`model HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[]
        }
        return json.choices?.[0]?.message?.content ?? ''
      }
      const result = await runTallyEval(callChat)
      const recordPath = process.env.TALLY_EVAL_RECORD
      if (recordPath) {
        mkdirSync(dirname(recordPath), { recursive: true })
        writeFileSync(recordPath, JSON.stringify(result, null, 2))
      }
      const { summary } = result
      console.log(
        `[tally-eval] v${result.suiteVersion} — ${summary.pass} pass, ${summary.fail} fail, ` +
          `${summary.gap} gap, accuracy ${(summary.accuracy * 100).toFixed(1)}%`,
      )
      expect(summary.failedChecks, JSON.stringify(summary.failedChecks, null, 2)).toEqual([])
    },
    300_000,
  )
})
