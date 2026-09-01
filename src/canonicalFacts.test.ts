/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import { BETA_COHORT_LIMIT } from '@/config/beta'
import {
  ADVISOR_MONTHLY_INCLUDED,
  ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
  ADVISOR_PACK_50_PRICE_CAD,
  ADVISOR_PACK_50_REPLIES,
  ADVISOR_PACK_200_PRICE_CAD,
  ADVISOR_PACK_200_REPLIES,
} from '@/config/advisorUsage'
import {
  ANNUAL_MONTHS_BILLED,
  FREE_PLAN_ACCESS_MONTHS,
  PAID_PLANS_DISABLED_DURING_BETA,
  PLAN_FEATURE_GATES_ENABLED,
  PLANS,
} from '@/config/plans'
import { allTemplates } from '@/features/app/documents/catalogue'
import {
  COVERAGE_AUDITED_ON,
  MONITORING_COVERAGE,
  noSupportedJurisdictionCovered,
} from '@/features/app/guidance/monitoringCoverage'

/**
 * Drift guard for `docs/CANONICAL_FACTS.md`.
 *
 * That file is the source of record for Dutiva's load-bearing facts, and it
 * states its own precedence rule: *where this file disagrees with the code,
 * the code wins and this file gets corrected*. Until now nothing checked
 * that. A source of record whose accuracy decays silently is worse than no
 * source of record, because everyone still trusts it — and the file exists
 * precisely because seven facts had already diverged across the company Drive
 * with no document marked authoritative.
 *
 * So: every row of the "Verified against the product" table that can be
 * derived from code is derived here and compared against the prose. The
 * comparison is **bidirectional** where a set is involved — the doc must not
 * omit a real value, and must not carry one the code no longer has. A stale
 * figure fails `npm run check` instead of reaching a reader.
 *
 * Same trick as `advisor/safety/crisisSignalsDrift.test.ts`: turn a
 * "keep these in sync" instruction into an enforced invariant.
 *
 * When one of these fails, fix whichever side is wrong — usually the doc,
 * per its own precedence rule.
 */

/* Files are pulled in with Vite's `?raw` glob rather than `node:fs`: the app
   project is deliberately typed for the browser (`types: ["vite/client"]`, no
   `@types/node`), and a test living under `src/` should not be the thing that
   drags Node globals into that scope. */
function raw(glob: Record<string, string>, suffix: string): string {
  const hit = Object.entries(glob).find(([path]) => path.endsWith(suffix))
  if (!hit) throw new Error(`${suffix} not found`)
  return hit[1]
}

const DOC = raw(
  import.meta.glob('../docs/CANONICAL_FACTS.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'CANONICAL_FACTS.md',
)

/** Cells of a markdown table row, trimmed. `[]` for a non-table line. */
function cells(line: string): string[] {
  if (!line.trimStart().startsWith('|')) return []
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

/**
 * The single markdown table row whose first cell is `label`.
 *
 * Cells are parsed rather than prefix-matched: Prettier formats this repo's
 * markdown and pads table columns to align them, so `| Pricing |` becomes
 * `| Pricing   |` the moment a longer label joins the table.
 */
function row(label: string): string {
  const match = DOC.split('\n').find((line) => cells(line)[0] === label)
  if (!match) throw new Error(`docs/CANONICAL_FACTS.md has no "${label}" row`)
  return match
}

/** Every integer inside `**bold**` spans in a row — the doc bolds its facts. */
function boldNumbers(text: string): number[] {
  return [...text.matchAll(/\*\*\$?(\d+)\*\*/g)].map((m) => Number(m[1]))
}

describe('docs/CANONICAL_FACTS.md matches the code it claims to describe', () => {
  it('states the shipped template count and range', () => {
    const templates = row('Templates shipped')

    /* Counted from the whole catalogue (`catalogue.ts`), not from
       `data/templates/` alone — the split between that folder and
       customTemplates.ts is provenance, and a customer sees one library. */
    expect(boldNumbers(templates)).toContain(allTemplates.length)

    /* "T01…T24" — the advertised range must span the real tids. */
    const tids = allTemplates.map((t) => t.tid)
    expect(templates).toContain(tids[0])
    expect(templates).toContain(tids[tids.length - 1])
  })

  it('has no duplicate template ids across the two catalogue sources', () => {
    /* DocStudioProvider resolves `templateByTid.get(k) ?? customTemplateByTid.get(k)`,
       so a tid reused in data/templates/ shadows the customTemplates.ts entry
       silently — the fixtures in src/data/employees.ts and chats.ts would
       resolve to the wrong document with nothing failing. */
    const tids = allTemplates.map((t) => t.tid)
    expect(tids).toEqual([...new Set(tids)])

    const ids = allTemplates.map((t) => t.id)
    expect(ids).toEqual([...new Set(ids)])
  })

  it('states the supported jurisdiction count and exactly those codes', () => {
    const jurisdictions = row('Jurisdictions')
    expect(boldNumbers(jurisdictions)).toContain(MONITORING_COVERAGE.length)

    /* Compared as a set against the backticked codes in the source cell, not
       with `toContain` per code: substring checks pass while the row also
       lists a jurisdiction the product dropped, which is the direction that
       actually misleads — claiming coverage that does not exist. */
    const documented = [...(cells(jurisdictions)[2] ?? '').matchAll(/`([A-Z]{2,3})`/g)]
      .map((m) => m[1])
      .sort()
    const supported = MONITORING_COVERAGE.map((c) => c.jurisdiction).sort()

    expect(documented).toEqual(supported)
  })

  it('states every paid plan price, and no price that is not a plan', () => {
    const pricing = row('Pricing')
    const paid = PLANS.filter((plan) => plan.monthlyPrice > 0).map((plan) => plan.monthlyPrice)

    /* Bidirectional: the doc's set of bolded dollar figures must be exactly
       the set of paid monthly prices — catches both a plan the doc forgot and
       a price the code no longer charges. */
    expect(boldNumbers(pricing).sort()).toEqual([...paid].sort())
    expect(pricing).toContain(`${FREE_PLAN_ACCESS_MONTHS}-month access`)
  })

  it('states the annual billing ratio', () => {
    /* Not bolded in the doc — matched as the phrase it actually reads,
       "10 of 12 months charged". */
    expect(row('Annual billing')).toContain(`${ANNUAL_MONTHS_BILLED} of 12`)
  })

  it('describes the beta paid-plan state the flags actually produce', () => {
    /* Paid plans are sold; product gates stay off. If either flag flips, the
       Beta state row and Launch status section have to be revisited. */
    const beta = row('Beta state').toLowerCase()
    expect(PAID_PLANS_DISABLED_DURING_BETA).toBe(false)
    expect(PLAN_FEATURE_GATES_ENABLED).toBe(false)
    expect(beta).toContain('sold')
    expect(beta).not.toContain('not sold')
    expect(beta).toContain('waitlist')
  })

  it('states the Advisor included amount and pack SKUs', () => {
    const replies = row('Advisor replies')
    expect(boldNumbers(replies).sort()).toEqual(
      [
        ADVISOR_MONTHLY_INCLUDED,
        ADVISOR_PACK_50_REPLIES,
        ADVISOR_PACK_50_PRICE_CAD,
        ADVISOR_PACK_200_REPLIES,
        ADVISOR_PACK_200_PRICE_CAD,
        ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
      ].sort(),
    )
    expect(replies.toLowerCase()).toContain('not a plan feature')

    const aiUsage = raw(
      import.meta.glob('../supabase/functions/_shared/aiUsage.ts', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      'aiUsage.ts',
    )
    expect(aiUsage).toContain(`envInt('AI_MONTHLY_CHAT_LIMIT', ${ADVISOR_MONTHLY_INCLUDED})`)
    expect(aiUsage).toContain(`envInt('AI_OVERAGE_MONTHLY_CAP', ${ADVISOR_OVERAGE_MONTHLY_REPLY_CAP})`)
  })

  it('states the beta cohort capacity, in every copy of the number', () => {
    /* The capacity lives in places that cannot import each other:
       BETA_COHORT_LIMIT (which the marketing copy interpolates, so the copy
       itself cannot drift), the SQL gate that enforces admission, the
       signup endpoint that reports whether the cohort is full, and the
       public waitlist copy. A
       mismatch means the site promises one number and the gate enforces
       another — exactly the defect class this file exists to prevent. */
    expect(boldNumbers(row('Beta capacity'))).toContain(BETA_COHORT_LIMIT)

    const gate = raw(
      import.meta.glob('../supabase/migrations/0067_beta_cohort_capacity.sql', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      '0067_beta_cohort_capacity.sql',
    )
    expect(gate).toContain(`limit ${BETA_COHORT_LIMIT}`)

    const paidGate = raw(
      import.meta.glob('../supabase/migrations/0089_paid_subscribers_are_workspace_members.sql', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      '0089_paid_subscribers_are_workspace_members.sql',
    )
    expect(paidGate).toContain(`limit ${BETA_COHORT_LIMIT}`)
    expect(paidGate).toContain("plan in ('starter', 'growth', 'pro')")

    const signup = raw(
      import.meta.glob('../supabase/functions/create-beta-signup/index.ts', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      'create-beta-signup/index.ts',
    )
    expect(signup).toContain(`const BETA_COHORT_LIMIT = ${BETA_COHORT_LIMIT}`)

    const cohortStatus = raw(
      import.meta.glob('../supabase/functions/beta-cohort-status/index.ts', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      'beta-cohort-status/index.ts',
    )
    expect(cohortStatus).toContain(`const BETA_COHORT_LIMIT = ${BETA_COHORT_LIMIT}`)
  })

  it('states the law-monitoring claim the coverage data actually supports', () => {
    const monitoring = row('Law-change monitoring')
    expect(monitoring).toContain(COVERAGE_AUDITED_ON)

    /* The date alone is not the load-bearing part. The row asserts that *no*
       supported jurisdiction has confirmed detection, and that is the
       sentence customers and the Knowledge panel rely on. The day a source
       strategy lands and a jurisdiction flips to `active`, this row becomes
       false in the reassuring direction — the one a compliance product can
       least afford — so the claim is checked against the data, not just
       dated. */
    if (noSupportedJurisdictionCovered()) {
      expect(monitoring.toLowerCase()).toContain('not confirmed working')
    } else {
      /* At least one supported jurisdiction has confirmed detection. The row
         must name which jurisdictions are confirmed and which are not, rather
         than claiming blanket coverage or blanket failure. */
      const active = MONITORING_COVERAGE.filter((c) => c.status === 'active').map(
        (c) => c.jurisdiction,
      )
      const unavailable = MONITORING_COVERAGE.filter((c) => c.status === 'unavailable').map(
        (c) => c.jurisdiction,
      )
      for (const j of active) {
        expect(monitoring.toLowerCase()).toContain(j.toLowerCase())
      }
      expect(monitoring.toLowerCase()).toContain('confirmed working')
      /* If some supported jurisdictions are still unavailable, they are named
         in the CANONICAL_FACTS row (or §5 paragraph); otherwise the row lists
         only the confirmed ones. */
      if (unavailable.length > 0) {
        expect(monitoring.toLowerCase()).toContain('unavailable')
      }
    }
  })
})

/* The brand rows (`Brand gold`, `Brand navy`) are checked by
   `scripts/check-canonical-facts.mjs` instead, not here: Vitest runs with
   `css: false` (vite.config.ts), which stubs every .css file to an empty
   string — `?raw` included — so a test cannot read a token value at all. */

describe('retired contact addresses stay retired', () => {
  /* CANONICAL_FACTS §6: publish support@dutiva.ca; retire these. A retired
     address that creeps back into a page is a real support failure — mail to
     it goes nowhere — so this is enforced rather than remembered. */
  const RETIRED = ['info@dutiva', 'hello@dutiva', 'dutivacanada@dutiva']

  const sourceFiles = import.meta.glob('./**/*.{ts,tsx,css,html}', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  it('no retired address appears anywhere in src/', () => {
    const offenders: string[] = []

    for (const [path, contents] of Object.entries(sourceFiles)) {
      if (path.endsWith('canonicalFacts.test.ts')) continue
      const text = (contents as string).toLowerCase()
      for (const address of RETIRED) {
        if (text.includes(address)) offenders.push(`${path} → ${address}`)
      }
    }

    expect(offenders).toEqual([])
  })
})
