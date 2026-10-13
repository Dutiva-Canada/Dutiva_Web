/**
 * Tally golden-eval engine — runs TALLY_GOLDEN_CASES against a model.
 *
 * `callChat` is injected so the same engine runs live (record test calls the
 * configured provider) and deterministically in unit tests (a canned model).
 * Each case builds the production system prompt via investChatPrompt, gets
 * one model turn, parses the strict-JSON reply with parseInvestChatReply,
 * then scores the structural expectations — including the same
 * verifyReplyClaims the production repair pass runs, so an invented figure
 * fails here exactly the way it would fail the user.
 */

import {
  chatSources,
  investChatPrompt,
  parseInvestChatReply,
  verifyReplyClaims,
} from './handlers'
import {
  TALLY_GOLDEN_CASES,
  TALLY_GOLDEN_VERSION,
  type TallyGoldenCase,
} from './goldenCases'

export interface TallyChatMessage {
  role: 'system' | 'user'
  content: string
}

export type TallyCallChat = (messages: TallyChatMessage[]) => Promise<string>

export interface TallyCheck {
  name: string
  pass: boolean
  detail: string
}

export interface TallyCaseResult {
  id: string
  name: string
  outcome: 'pass' | 'fail' | 'gap'
  checks: TallyCheck[]
  reply: string
}

export interface TallyEvalResult {
  suiteVersion: number
  ranAt: string
  cases: TallyCaseResult[]
  summary: {
    pass: number
    fail: number
    gap: number
    accuracy: number
    failedChecks: string[]
    coverageGaps: string[]
  }
}

const check = (name: string, pass: boolean, detail: string): TallyCheck => ({
  name,
  pass,
  detail,
})

export async function runTallyEval(
  callChat: TallyCallChat,
  cases: TallyGoldenCase[] = TALLY_GOLDEN_CASES,
): Promise<TallyEvalResult> {
  const results: TallyCaseResult[] = []

  for (const c of cases) {
    const checks: TallyCheck[] = []
    let reply = ''
    try {
      const raw = await callChat([
        investChatPrompt(c.ctx, c.lang, { advice: c.advice }),
        { role: 'user', content: c.user },
      ])
      const parsed = parseInvestChatReply(raw)
      checks.push(
        check('parse', parsed !== null, parsed ? 'strict-JSON reply parsed' : 'unparseable reply'),
      )
      if (parsed) {
        reply = parsed.reply
        const ex = c.expect
        if (ex.replyRequired !== false) {
          checks.push(check('reply', reply !== '', reply === '' ? 'empty reply' : 'reply present'))
        }
        for (const s of ex.mustContain ?? []) {
          checks.push(check(`contains "${s}"`, reply.includes(s), reply.includes(s) ? 'found' : 'missing'))
        }
        for (const s of ex.mustNotContain ?? []) {
          checks.push(check(`excludes "${s}"`, !reply.toLowerCase().includes(s.toLowerCase()), reply.toLowerCase().includes(s.toLowerCase()) ? 'present — boundary breach' : 'absent'))
        }
        for (const re of ex.mustMatch ?? []) {
          checks.push(check(`matches ${re}`, re.test(reply), re.test(reply) ? 'matched' : 'no match'))
        }
        if (ex.actionType !== undefined) {
          const a = parsed.action
          checks.push(
            check(
              'action type',
              a?.type === ex.actionType,
              a ? `action ${a.type}` : 'no action emitted',
            ),
          )
          if (ex.actionSymbol !== undefined && a) {
            const sym = 'symbol' in a ? a.symbol : undefined
            checks.push(check('action symbol', sym === ex.actionSymbol, `symbol ${sym ?? 'none'}`))
          }
        }
        if (ex.sourcesMin !== undefined && reply !== '') {
          const n = chatSources(c.ctx, reply).length
          checks.push(check('sources', n >= ex.sourcesMin, `${n} source(s) vs need ${ex.sourcesMin}`))
        }
        const claimsClean = ex.claimsClean ?? true
        if (claimsClean) {
          if (reply === '') {
            checks.push(check('claims', true, 'gap: no reply to verify'))
          } else {
            const mismatches = verifyReplyClaims(reply, c.ctx.market)
            checks.push(
              check(
                'claims',
                mismatches.length === 0,
                mismatches.length === 0
                  ? 'all cited figures verify'
                  : `unverified: ${mismatches.map((m) => m.detail ?? `${m.metric} ${m.claimed} vs ${m.actual}`).join('; ')}`,
              ),
            )
          }
        }
      }
    } catch (err) {
      checks.push(check('call', false, `model call failed: ${err instanceof Error ? err.message : String(err)}`))
    }

    const failed = checks.filter((ch) => !ch.pass).length
    /* A fetch-only response where the case allows it is protocol-valid but
       scored nothing — count it as a gap, not a pass. */
    const unscored = reply === '' && c.expect.replyRequired === false
    results.push({
      id: c.id,
      name: c.name,
      outcome: failed > 0 ? 'fail' : unscored ? 'gap' : 'pass',
      checks,
      reply: reply.slice(0, 500),
    })
  }

  const pass = results.filter((r) => r.outcome === 'pass').length
  const fail = results.filter((r) => r.outcome === 'fail').length
  const gap = results.filter((r) => r.outcome === 'gap').length
  return {
    suiteVersion: TALLY_GOLDEN_VERSION,
    ranAt: new Date().toISOString(),
    cases: results,
    summary: {
      pass,
      fail,
      gap,
      accuracy: results.length === 0 ? 0 : pass / results.length,
      failedChecks: results.flatMap((r) =>
        r.checks.filter((ch) => !ch.pass).map((ch) => `${r.id} — ${ch.name}: ${ch.detail}`),
      ),
      coverageGaps: results.filter((r) => r.outcome === 'gap').map((r) => `${r.id} — ${r.name}: model answered fetch-first, nothing scored`),
    },
  }
}
