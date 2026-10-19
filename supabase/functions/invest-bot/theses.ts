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
  /** Consecutive evals where the computed status came back better than
      the stored one — a degraded status only heals once that repeats, so
      a threshold-hugging metric can't flip the card every sweep. 0 means
      settled. */
  recovery_streak: number
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

/* Healing hysteresis — status severity ranks. A computed status better
   than the stored one has to repeat on consecutive evals before it
   applies; a metric wobbling ±0.2% across a line can't produce two clean
   reads in a row, so the flutter never reaches the card. Trips are never
   delayed — a worse computed status applies on first fire. */
const STATUS_RANK: Record<ThesisStatus, number> = { healthy: 0, drifting: 1, broken: 2 }
export const THESIS_HEAL_EVALS = 2

/* The action lines — posture-shaped but never stronger than the tier
   allows. External accounts get a state + a review nudge; internal staff
   get the direct posture call. [FR self-authored] */
const ACTION_EXTERNAL: Record<Exclude<ThesisStatus, 'healthy'>, { en: string; fr: string }> = {
  drifting: {
    en: 'Drift conditions fired — the thesis needs a closer look.',
    fr: 'Conditions de dérive déclenchées — la thèse mérite un nouvel examen.',
  },
  broken: {
    en: 'A break condition fired — the line tripped; whether the story still holds is your call.',
    fr: 'Une condition de cassure s’est déclenchée — la ligne a été franchie ; à vous de dire si la thèse tient toujours.',
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
      en: 'Break line crossed — decide whether the story still holds; the line reads price, not fundamentals.',
      fr: 'Ligne franchie — tranchez si l’histoire tient toujours ; la ligne lit le cours, pas les fondamentaux.',
    },
    growth: {
      en: 'Break line crossed — re-check the growth case before calling it dead; the line reads price, not the story.',
      fr: 'Ligne franchie — revérifiez la thèse de croissance avant de la déclarer morte ; la ligne lit le cours, pas l’histoire.',
    },
    income: {
      en: 'Break line crossed — verify the payout story still holds; a price line can’t read fundamentals.',
      fr: 'Ligne franchie — vérifiez que le revenu tient toujours ; une ligne de cours ne lit pas les fondamentaux.',
    },
    speculative: {
      en: 'Break line crossed — exit candidate; a speculative setup lives by its line — if the story still holds, say so.',
      fr: 'Ligne franchie — candidate à la sortie ; une configuration spéculative vit de sa ligne — si l’histoire tient encore, dites-le.',
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
          /* The pending recovery survives a silent eval — neither proven
             nor disproven by a mark that isn't there. */
          recovery_streak: t.eval_detail?.recovery_streak ?? 0,
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
    const computed: ThesisStatus =
      firedBreak > 0 ? 'broken' : firedDrift > 0 ? 'drifting' : 'healthy'
    let status = computed
    let streak = 0
    if (STATUS_RANK[computed] < STATUS_RANK[t.status]) {
      /* The read improved on the stored state — believe the recovery only
         once it repeats. One tick back over a line is flutter, not a heal. */
      streak = (t.eval_detail?.recovery_streak ?? 0) + 1
      if (streak < THESIS_HEAL_EVALS) status = t.status
      else streak = 0
    }
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
        recovery_streak: streak,
        action_en: action.en,
        action_fr: action.fr,
      },
    })
  }
  return out
}

/** Signal title for a transition — the per-status pseudo rule_id is the
    dedupe handle: an open 'drifting' row doesn't suppress the later
    'broken' row. The title names the line that tripped, never a verdict
    on the story — a crossed break line is technicals, not a dead thesis. */
export function thesisSignalTitle(
  symbol: string,
  name: string,
  status: ThesisStatus,
): { en: string; fr: string } {
  const label = name ? `${symbol} (${name})` : symbol
  switch (status) {
    case 'broken':
      return {
        en: `${label} — break line crossed`,
        fr: `${label} — ligne de cassure franchie`,
      }
    case 'drifting':
      return {
        en: `${label} — thesis fraying`,
        fr: `${label} — la thèse s’effiloche`,
      }
    case 'healthy':
      return {
        en: `${label} — thesis intact again`,
        fr: `${label} — thèse de nouveau intacte`,
      }
  }
}
