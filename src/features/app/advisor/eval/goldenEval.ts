/**
 * § Advisor golden-eval — the deterministic harness (Part 2a–2c of the
 * product-hardening audit).
 *
 * `runGoldenEval()` executes every case in goldenCases.ts against the three
 * deterministic layers that ground a real Advisor turn:
 *
 *   1. `detectJurisdictions` — jurisdiction read from the question text
 *      (never assumed; conflict/unknown closes the legal-basis gate),
 *   2. the committed corpus snapshot — the same 42 rows
 *      `match_advisor_guidance` serves in production, frozen for review,
 *   3. `buildAdvisorResponse` + `crossCheckNoticeFigure` — the gates,
 *      warnings and statutory-figure cross-check the real turn runs.
 *
 * The citation verifier does two things per `requiredCitations` ref: the ref
 * must exist in statuteRegistry (a wrong ref is a case defect, not a pass),
 * and `corpus-cited` refs must have an alias present in the grounding
 * chunk's text — the Advisor may not lean on a section the corpus doesn't
 * name. `canonical` refs absent from chunk text are recorded as *coverage
 * gaps*: the answer is grounded, but cites at statute level only.
 *
 * No LLM runs here — the suite is deterministic and hermetic, so it can gate
 * `npm run check` on every model/prompt/corpus change (2c). Results are
 * timestamped per run (2c audit trail) via scripts/check-advisor-golden.mjs.
 */

import {
  buildAdvisorResponse,
  detectJurisdictions,
  type GuidanceChunk,
  type AdvisorResponsePayload,
} from '../../../../../supabase/functions/advisor-chat/responsePayload'
import { normalizeText } from '../safety/text'
import { crossCheckNoticeFigure } from '../safety/statutoryCrossCheck'
import { applySafetyBackstop } from '../safety/safetyBackstop'
import type { AdvisorResponse } from '../contract'
import { ADVISOR_CORPUS_SNAPSHOT, type CorpusSnapshotRow } from './advisorCorpusSnapshot'
import { statuteByRef } from './statuteRegistry'
import {
  GOLDEN_CASES,
  GOLDEN_SET_VERSION,
  type GoldenCase,
} from './goldenCases'

/* ------------------------------------------------------------------ types */

export type CheckStatus = 'pass' | 'fail' | 'gap'

export interface GoldenCheck {
  name: string
  status: CheckStatus
  detail: string
}

export interface GoldenCaseResult {
  caseId: string
  v: number
  kind: GoldenCase['kind']
  /** fail > gap > pass; a 'gap' case never reports 'pass'. */
  status: 'pass' | 'fail' | 'gap'
  checks: GoldenCheck[]
  payload: AdvisorResponsePayload
}

export interface GoldenRunSummary {
  total: number
  pass: number
  fail: number
  gap: number
  /** Checks that failed — each one is a product defect or a stale case. */
  failedChecks: { caseId: string; name: string; detail: string }[]
  /** Coverage holes — corpus lacks the proposition or section citation. */
  coverageGaps: { caseId: string; name: string; detail: string }[]
  /** pass / (pass + fail) — gaps excluded; they are documented absences. */
  accuracy: number
}

export interface GoldenRunResult {
  suiteVersion: string
  ranAt: string
  summary: GoldenRunSummary
  cases: GoldenCaseResult[]
}

/* ---------------------------------------------------------- chunk helpers */

/** Chunks the corpus offers for a case — jurisdiction + topic, active rows
    only (the snapshot mirrors the live table, which serves active rows). */
export function groundingChunksFor(c: GoldenCase): CorpusSnapshotRow[] {
  if (!c.jurisdiction || !c.topic) return []
  return ADVISOR_CORPUS_SNAPSHOT.filter(
    (row) =>
      row.jurisdiction === c.jurisdiction &&
      row.topic === c.topic &&
      (row.status === undefined || row.status === 'active'),
  )
}

function chunkText(chunks: readonly GuidanceChunk[]): string {
  return normalizeText(
    chunks.map((c) => `${c.title} ${c.content} ${c.effective_note ?? ''}`).join(' '),
  )
}

/* ----------------------------------------------------------- one case run */

export function runGoldenCase(c: GoldenCase): GoldenCaseResult {
  const checks: GoldenCheck[] = []
  const pass = (name: string, detail = ''): void => {
    checks.push({ name, status: 'pass', detail })
  }
  const fail = (name: string, detail: string): void => {
    checks.push({ name, status: 'fail', detail })
  }
  const gap = (name: string, detail: string): void => {
    checks.push({ name, status: 'gap', detail })
  }
  const isGapCase = c.kind === 'gap'

  /* 1 — jurisdiction read ------------------------------------------------ */
  const detected = detectJurisdictions(c.question)
  const expectedStatus =
    c.expectJurisdictionStatus ?? (c.jurisdiction ? 'known' : 'unknown')
  const detectedStatus =
    detected.length === 1 ? 'known' : detected.length > 1 ? 'conflict' : 'unknown'
  if (detectedStatus === expectedStatus && (c.jurisdiction === null || detected[0] === c.jurisdiction)) {
    pass('jurisdiction.detect', `${expectedStatus}${detected[0] ? ` (${detected[0]})` : ''}`)
  } else {
    fail(
      'jurisdiction.detect',
      `expected ${expectedStatus}${c.jurisdiction ? ` (${c.jurisdiction})` : ''}, got ${detectedStatus}${detected.length ? ` (${detected.join('+')})` : ''}`,
    )
  }

  /* 2 — grounding -------------------------------------------------------- */
  const chunks = groundingChunksFor(c)
  const text = chunkText(chunks)
  if (c.topic && c.jurisdiction) {
    if (chunks.length > 0) {
      pass('grounding.chunk', `${chunks.length} ${c.jurisdiction}/${c.topic} chunk(s)`)
    } else {
      (isGapCase ? gap : fail)(
        'grounding.chunk',
        `no ${c.jurisdiction}/${c.topic} chunk in the corpus — the Advisor answers ungrounded`,
      )
    }
  }

  /* 3 — engine payload ---------------------------------------------------- */
  const payload = buildAdvisorResponse({
    message: c.question,
    reply: c.figureCheck?.reply ?? c.question,
    chunks,
  })
  const expect = c.expect ?? {}
  if (expect.legalBasisAllowed !== undefined) {
    if (payload.route.legalBasisAllowed === expect.legalBasisAllowed) {
      pass('route.legalBasisAllowed', String(expect.legalBasisAllowed))
    } else {
      fail(
        'route.legalBasisAllowed',
        `expected ${expect.legalBasisAllowed}, got ${payload.route.legalBasisAllowed}`,
      )
    }
  }
  if (expect.responseMode !== undefined) {
    if (payload.route.responseMode === expect.responseMode) {
      pass('route.responseMode', expect.responseMode)
    } else {
      fail('route.responseMode', `expected ${expect.responseMode}, got ${payload.route.responseMode}`)
    }
  }
  if (expect.isCrisis !== undefined) {
    if (payload.isCrisis === expect.isCrisis) {
      pass('payload.isCrisis', String(expect.isCrisis))
    } else {
      fail('payload.isCrisis', `expected ${expect.isCrisis}, got ${payload.isCrisis}`)
    }
  }
  if (expect.professionalReview !== undefined) {
    if ((payload.professionalReview !== null) === expect.professionalReview) {
      pass('payload.professionalReview', String(expect.professionalReview))
    } else {
      fail(
        'payload.professionalReview',
        `expected ${expect.professionalReview}, got ${payload.professionalReview !== null}`,
      )
    }
  }
  /* The client backstop is the layer an actual reply passes through — the
     payload type is zod-contract-compatible by construction (validated by
     responsePayload.test.ts). */
  if (expect.safetyActions) {
    const { actions } = applySafetyBackstop({
      userMessage: c.question,
      reply: c.figureCheck?.reply ?? c.question,
      response: payload as AdvisorResponse,
    })
    for (const expected of expect.safetyActions) {
      if (actions.includes(expected)) {
        pass('backstop.action', expected)
      } else {
        fail('backstop.action', `expected ${expected}, got [${actions.join(', ') || 'none'}]`)
      }
    }
  }

  /* 4 — propositions the grounding chunk must contain -------------------- */
  c.expectedPropositions.forEach((prop, i) => {
    const needle = normalizeText(prop)
    if (text.includes(needle)) {
      pass(`grounding.proposition.${i}`, `"${prop}"`)
    } else {
      ;(isGapCase ? gap : fail)(
        `grounding.proposition.${i}`,
        `grounding chunk does not contain “${prop}” — an answer asserting it would be ungrounded`,
      )
    }
  })

  /* 5 — citation verification -------------------------------------------- */
  for (const ref of c.requiredCitations) {
    const entry = statuteByRef(ref)
    if (!entry) {
      fail(`citation.registry.${ref}`, 'not in statuteRegistry — fix the case or the registry')
      continue
    }
    pass(`citation.registry.${ref}`, entry.citation.en)
    if (chunks.length === 0) continue
    const cited = entry.aliases.some((a) => text.includes(normalizeText(a)))
    if (cited) {
      pass(`citation.grounded.${ref}`, 'named by the grounding chunk')
    } else if (entry.confidence === 'corpus-cited') {
      (isGapCase ? gap : fail)(
        `citation.grounded.${ref}`,
        'registry marks this section corpus-cited but the grounding chunk does not name it',
      )
    } else {
      gap(
        `citation.grounded.${ref}`,
        'chunk cites at statute level only — section-level citation unavailable',
      )
    }
  }
  for (const ref of c.expectedCitations ?? []) {
    const entry = statuteByRef(ref)
    if (!entry) {
      fail(`citation.registry.${ref}`, 'not in statuteRegistry — fix the case or the registry')
      continue
    }
    const cited = chunks.length > 0 && entry.aliases.some((a) => text.includes(normalizeText(a)))
    if (!cited) {
      gap(`citation.expected.${ref}`, 'expected section-level citation absent from grounding chunk')
    } else {
      pass(`citation.expected.${ref}`, 'named by the grounding chunk')
    }
  }

  /* 6 — statutory-figure cross-check -------------------------------------- */
  if (c.figureCheck && c.jurisdiction) {
    const result = crossCheckNoticeFigure({
      jurisdiction: c.jurisdiction,
      userMessage: c.question,
      reply: c.figureCheck.reply,
    })
    if (result.verdict === c.figureCheck.expectedVerdict) {
      pass(
        'figure.verdict',
        `${result.verdict}${result.expectedWeeks !== undefined ? ` (expected ${result.expectedWeeks}w)` : ''}`,
      )
    } else {
      fail(
        'figure.verdict',
        `expected ${c.figureCheck.expectedVerdict}, got ${result.verdict}` +
          (result.statedWeeks !== undefined ? ` (reply stated ${result.statedWeeks}w)` : ''),
      )
    }
    if (
      c.figureCheck.expectedWeeks !== undefined &&
      result.expectedWeeks !== undefined &&
      result.expectedWeeks !== c.figureCheck.expectedWeeks
    ) {
      fail(
        'figure.schedule',
        `schedule lookup returned ${result.expectedWeeks}w; case declares ${c.figureCheck.expectedWeeks}w`,
      )
    }
  }

  /* Case status: fail dominates; a gap-kind case is a gap unless it fails. */
  const status: GoldenCaseResult['status'] = checks.some((x) => x.status === 'fail')
    ? 'fail'
    : isGapCase || checks.some((x) => x.status === 'gap')
      ? 'gap'
      : 'pass'
  return { caseId: c.id, v: c.v, kind: c.kind, status, checks, payload }
}

/* ----------------------------------------------------------------- runner */

export function runGoldenEval(ranAt = new Date().toISOString()): GoldenRunResult {
  const cases = GOLDEN_CASES.map(runGoldenCase)
  const failedChecks = cases.flatMap((r) =>
    r.checks.filter((x) => x.status === 'fail').map((x) => ({ caseId: r.caseId, name: x.name, detail: x.detail })),
  )
  const coverageGaps = cases.flatMap((r) =>
    r.checks.filter((x) => x.status === 'gap').map((x) => ({ caseId: r.caseId, name: x.name, detail: x.detail })),
  )
  const pass = cases.filter((r) => r.status === 'pass').length
  const fail = cases.filter((r) => r.status === 'fail').length
  const gap = cases.filter((r) => r.status === 'gap').length
  return {
    suiteVersion: GOLDEN_SET_VERSION,
    ranAt,
    summary: {
      total: cases.length,
      pass,
      fail,
      gap,
      failedChecks,
      coverageGaps,
      accuracy: pass + fail === 0 ? 1 : pass / (pass + fail),
    },
    cases,
  }
}
