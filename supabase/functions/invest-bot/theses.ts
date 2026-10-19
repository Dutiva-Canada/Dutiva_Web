/**
 * Thesis evaluation — the standing-claim half of the invest portal. A
 * thesis row says "I own ARM because <story>, and I'm out when <rules>".
 * Every sweep evaluates the stored rules against the freshest snapshot
 * and returns a status + a per-rule detail the Theses page renders
 * straight from the row (no client-side engine twin).
 *
 * Two rule zones: break_rules invalidate the claim outright (any fired →
 * 'broken'); drift_rules flag it fraying early (any fired → 'drifting').
 * The recommended action lines are posture × tier: the intent field says
 * what role the position plays (a 'core' holding gets patience a
 * 'speculative' one doesn't), and the internal-staff tier is the only one
 * that hears a direct verb — external accounts get the state and a review
 * nudge, the same no-advice boundary every invest surface keeps.
 *
 * Pure + deterministic, same contract as planRun: no writes, no model.
 */
import type {
  AssetClass,
  MarketSnapshot,
  Position,
  RuleMetric,
  RunContext,
  StrategyRule,
} from './handlers.ts'
import { metricValue, opMatches, ruleIdent } from './handlers.ts'
import { convertFx, type FxTable } from './fx.ts'

export type ThesisStatus = 'healthy' | 'drifting' | 'broken'
export type ThesisIntent = 'core' | 'growth' | 'income' | 'speculative'
export type ThesisZone = 'break' | 'drift'

export interface Thesis {
  id: string
  asset_class: AssetClass
  symbol: string
  name: string
  thesis: string
  intent: ThesisIntent
  break_rules: StrategyRule[]
  drift_rules: StrategyRule[]
  status: ThesisStatus
  eval_detail?: ThesisEvalDetail | null
  last_evaluated_at?: string | null
}

export interface ThesisRuleEval {
  zone: ThesisZone
  /** ruleIdent of the stored rule — the row a user edits stays linked. */
  ident: string
  title: string
  metric: RuleMetric
  fired: boolean
  /** The observed metric — null when it can't compute (no ma50, no FX). */
  value: number | null
}

export interface ThesisEvalDetail {
  rules: ThesisRuleEval[]
  fired_break: number
  fired_drift: number
  /** Posture line in both locales — the card renders the locale pick. */
  action_en: string
  action_fr: string
}

export interface ThesisEval {
  id: string
  asset_class: AssetClass
  symbol: string
  name: string
  status: ThesisStatus
  /** Status moved since the persisted row — a transition emits a signal. */
  statusChanged: boolean
  /** The thesis has rules but no snapshot to evaluate them against —
      persisted status stays as-is and the card explains why. */
  noSnapshot: boolean
  detail: ThesisEvalDetail
}

/* The action lines — posture-shaped but never stronger than the tier
   allows. External accounts get a state + a review nudge; internal staff
   get the direct posture call. [FR self-authored] */
const ACTION_EXTERNAL: Record<Exclude<ThesisStatus, 'healthy'>, { en: string; fr: string }> = {
  drifting: {
    en: 'Drift conditions fired — the thesis needs a closer look.',
    fr: 'Conditions de dérive déclenchées — la thèse mérite un nouvel examen.',
  },
  broken: {
    en: 'A break condition fired — the thesis needs a decision.',
    fr: 'Une condition de cassure s’est déclenchée — la thèse exige une décision.',
  },
}

const ACTION_INTENT: Record<ThesisStatus, Record<ThesisIntent, { en: string; fr: string }>> = {
  healthy: {
    core: { en: 'Thesis intact — hold.', fr: 'Thèse intacte — conserver.' },
    growth: {
      en: 'Thesis intact — the growth case is on track.',
      fr: 'Thèse intacte — la thèse de croissance tient.',
    },
    income: {
      en: 'Thesis intact — keep collecting.',
      fr: 'Thèse intacte — continuer d’encaisser.',
    },
    speculative: {
      en: 'Thesis intact — a thin watch is enough here.',
      fr: 'Thèse intacte — une veille légère suffit.',
    },
  },
  drifting: {
    core: {
      en: 'Fraying — hold and watch the flagged conditions.',
      fr: 'Éraflure — conserver en surveillant les conditions signalées.',
    },
    growth: {
      en: 'Fraying — re-check the growth case before adding.',
      fr: 'Éraflure — revérifier la thèse de croissance avant d’ajouter.',
    },
    income: {
      en: 'Fraying — verify the payout story still holds.',
      fr: 'Éraflure — vérifier que le revenu tient toujours.',
    },
    speculative: {
      en: 'Fraying — trim candidate; speculative holds get no benefit of the doubt.',
      fr: 'Éraflure — candidate à l’allègement ; une position spéculative n’a pas le bénéfice du doute.',
    },
  },
  broken: {
    core: {
      en: 'Invalidated — decide whether the story changed; a break is a decision, not noise.',
      fr: 'Invalidée — trancher si l’histoire a changé ; une cassure exige une décision.',
    },
    growth: {
      en: 'Invalidated — the growth case no longer holds; review the position.',
      fr: 'Invalidée — la thèse de croissance ne tient plus ; revoir la position.',
    },
    income: {
      en: 'Invalidated — the income case broke; review the position.',
      fr: 'Invalidée — la thèse de revenu s’est brisée ; revoir la position.',
    },
    speculative: {
      en: 'Invalidated — exit candidate; a speculative hold lives and dies by its setup.',
      fr: 'Invalidée — candidate à la sortie ; une position spéculative vit de sa configuration.',
    },
  },
}

/** Posture line for a status × intent — external accounts hear the
    observational version on degraded states. */
export function thesisAction(
  status: ThesisStatus,
  intent: ThesisIntent,
  advice: boolean,
): { en: string; fr: string } {
  if (status === 'healthy' || advice) return ACTION_INTENT[status][intent]
  return ACTION_EXTERNAL[status]
}

/** The book-currency total weight_pct denominates against — positions
    marked via snapshots + cash, the same rule the strategy engine uses
    (FX-unconvertible legs drop out rather than blend at face value). */
export function thesisBookContext(
  positions: Position[],
  snapshots: MarketSnapshot[],
  cashTotal: number,
  fx: FxTable | null,
  bookCurrency: string,
): RunContext {
  const toBook = (amount: number, currency: string): number | null =>
    convertFx(amount, currency, bookCurrency, fx)
  let bookValue = cashTotal
  for (const p of positions) {
    const snap = snapshots.find(
      (s) => s.asset_class === p.asset_class && s.symbol === p.symbol,
    )
    /* A missing snapshot must not zero the position out of the mark —
       the portal headline falls back snapshot → last mirrored price →
       cost basis, and the permanent track record follows the same chain
       (a transient feed gap would otherwise etch a fake dip). */
    const px = snap?.price ?? p.last_price ?? (p.avg_cost > 0 ? p.avg_cost : null)
    if (px === null) continue
    const v = toBook(p.quantity * px, snap?.currency ?? p.currency ?? bookCurrency)
    if (v !== null) bookValue += v
  }
  return { bookValue, cashTotal, bookCurrency, toBook }
}

/** Evaluate every thesis against the freshest snapshots. A thesis with no
    snapshot keeps its persisted status — silence isn't a verdict. */
export function evaluateTheses(
  theses: Thesis[],
  snapshots: MarketSnapshot[],
  positions: Position[],
  ctx: RunContext,
  opts: { advice: boolean },
): ThesisEval[] {
  const out: ThesisEval[] = []
  for (const t of theses) {
    const snap = snapshots.find(
      (s) => s.asset_class === t.asset_class && s.symbol === t.symbol,
    )
    const position =
      positions.find(
        (p) => p.asset_class === t.asset_class && p.symbol === t.symbol,
      ) ?? null
    if (!snap) {
      const quietAction = thesisAction(t.status, t.intent, opts.advice)
      out.push({
        id: t.id,
        asset_class: t.asset_class,
        symbol: t.symbol,
        name: t.name,
        status: t.status,
        statusChanged: false,
        noSnapshot: true,
        detail: {
          rules: [],
          fired_break: 0,
          fired_drift: 0,
          action_en: quietAction.en,
          action_fr: quietAction.fr,
        },
      })
      continue
    }
    const rules: ThesisRuleEval[] = []
    let firedBreak = 0
    let firedDrift = 0
    for (const zone of ['break', 'drift'] as const) {
      const list = zone === 'break' ? t.break_rules : t.drift_rules
      for (const r of list) {
        const value = metricValue(r.metric, snap, position, ctx)
        const fired = value !== null && opMatches(r, value)
        if (fired && zone === 'break') firedBreak += 1
        if (fired && zone === 'drift') firedDrift += 1
        rules.push({
          zone,
          ident: ruleIdent(r),
          title: r.title,
          metric: r.metric,
          fired,
          value,
        })
      }
    }
    const status: ThesisStatus =
      firedBreak > 0 ? 'broken' : firedDrift > 0 ? 'drifting' : 'healthy'
    /* A first eval emits on any degraded status — a freshly-filed thesis
       that's already broken shouldn't wait a day to say so. */
    const statusChanged =
      status !== t.status ||
      (!t.last_evaluated_at && status !== 'healthy')
    const action = thesisAction(status, t.intent, opts.advice)
    out.push({
      id: t.id,
      asset_class: t.asset_class,
      symbol: t.symbol,
      name: t.name,
      status,
      statusChanged,
      noSnapshot: false,
      detail: {
        rules,
        fired_break: firedBreak,
        fired_drift: firedDrift,
        action_en: action.en,
        action_fr: action.fr,
      },
    })
  }
  return out
}

/** Signal title for a transition — the status word is the dedupe handle:
    an open 'drifting' row doesn't suppress the later 'broken' row. */
export function thesisSignalTitle(
  symbol: string,
  name: string,
  status: ThesisStatus,
): { en: string; fr: string } {
  const label = name ? `${symbol} (${name})` : symbol
  switch (status) {
    case 'broken':
      return {
        en: `${label} — thesis broken`,
        fr: `${label} — thèse brisée`,
      }
    case 'drifting':
      return {
        en: `${label} — thesis drifting`,
        fr: `${label} — thèse qui dérive`,
      }
    case 'healthy':
      return {
        en: `${label} — thesis intact again`,
        fr: `${label} — thèse de nouveau intacte`,
      }
  }
}
