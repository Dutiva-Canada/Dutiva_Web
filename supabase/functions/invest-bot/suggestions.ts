/**
 * Tally's proactive suggestion pass — the "don't make me think" half of the
 * strategy builder. A pure planner inspects the book the sweep just loaded
 * (positions, snapshots, cash, strategies) plus the outcome history
 * (suggestion resolutions, dismissed signals, expired drafts), and emits a
 * small ranked set of suggestion candidates. fileBookSuggestions persists
 * them to agent_suggestions, the durable review queue the portal renders.
 *
 * Deterministic by design: the candidates are the same book math the rules
 * engine runs — a model outage must not silence the suggestions, and every
 * generator stays unit-testable. Learning is honest, not mystical: what the
 * user keeps dismissing stops being re-proposed, what they keep ignoring
 * gets a tune-up suggestion instead of another copy of itself.
 *
 * Kinds filed (all payload shapes the portal's accept paths consume):
 *   'strategy'  — a whole seeded strategy draft for a book with no enabled
 *                 strategy (payload.draft mirrors the invest-ai draft shape,
 *                 so the existing "Add it" path accepts it unchanged)
 *   'rule_add'  — a gap rule for an existing strategy: concentration, big
 *                 gains, cash drag, or a fast mover with no watcher
 *   'scope_add' — held symbols no enabled strategy covers → add to scope
 *   'rule_tune' — an existing rule demonstrably misfits: its signals keep
 *                 getting dismissed (loosen it) or its draft orders keep
 *                 expiring unapproved (propose a signal instead)
 *   'thesis'    — a held symbol with no thesis row yet → a seeded tracker:
 *                 the story line stays blank for the user, the drift/break
 *                 conditions come pre-filled with modest defaults
 *   'goal'      — a measurable book objective (concentration cap, thesis
 *                 coverage, idle-cash ceiling) seeded with real numbers —
 *                 for the "I don't know what goals to add" case
 */
import { fileSuggestion } from '../_shared/agentQueue.ts'
import { isInternalDutivaAccount } from '../_shared/adminAccess.ts'
import type { PostgrestSingleResponse } from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient } from './botShared.ts'
import { convertFx, type FxTable } from './fx.ts'
import type {
  MarketSnapshot,
  Position,
  SignalRule,
  Strategy,
  StrategyRule,
} from './handlers.ts'
import { ruleIdent } from './handlers.ts'

/* ── Public types ─────────────────────────────────────────────────────────── */

export interface SuggestionContext {
  strategies: Strategy[]
  positions: (Position & { name?: string })[]
  snapshots: MarketSnapshot[]
  cashTotal: number
  fx: FxTable | null
  bookCurrency: string
  /** Symbols already carrying a thesis row — held positions missing from
      this set are 'thesis' suggestion candidates. */
  theses?: { asset_class: string; symbol: string }[]
  /** Metrics the user's goals already measure — a metric absent here is
      a 'goal' suggestion candidate when the book exposes the gap. */
  goals?: { metric: string }[]
  /** The declared investor profile — blank dimensions are 'profile'
      nudge candidates. null row and missing field both mean unset. */
  profile?: {
    risk: string | null
    horizon: string | null
    goal: string | null
    mandate: string | null
  } | null
  /** Confirmed-memory and user-chat counts — the 'review memories' nudge
      only earns a slot once there's actually something said. */
  memoryCount?: number
  chatTurns?: number
  /** Outcome history the learning rules read — see loadOutcomes. */
  outcomes: OutcomeHistory
  /** Internal-staff tier: order-proposal artifacts only file here. */
  advice: boolean
  /** An explicit scan regenerates regardless of the refile window. */
  force?: boolean
  now?: number
}

/** Resolved-suggestion and signal/order dispositions — the feedback the
    pass learns from. All maps are already grouped; the planner only reads. */
export interface OutcomeHistory {
  /** dedupe_key → resolution epoch ms, for rows the user dismissed — a
      dismissed shape stays suppressed for DISMISS_COOLDOWN_MS. */
  dismissedKeys: Map<string, number>
  /** kind → resolve tallies — a kind the user dismisses ~always gets a
      whole-kind cooldown rather than a per-key one. */
  kindStats: Map<string, { accepted: number; dismissed: number; lastResolved: number }>
  /** `${strategyId}::${ident}` → dismissed signal count. */
  dismissedSignals: Map<string, number>
  /** `${strategyId}::${ident}` → expired draft count. */
  expiredDrafts: Map<string, number>
}

export interface SuggestionCandidate {
  kind:
    | 'strategy'
    | 'rule_add'
    | 'rule_tune'
    | 'scope_add'
    | 'thesis'
    | 'goal'
    | 'profile'
  dedupeKey: string
  /** English title — the row's `title` column (schema default). */
  title_en: string
  /** French twin — rides the payload for the locale pick. */
  title_fr: string
  detail_en: string
  detail_fr: string
  payload: Record<string, unknown>
  /** Rank inside the pass — higher scores file first when the cap bites. */
  score: number
}

/* ── Tuning knobs ─────────────────────────────────────────────────────────── */

/** One pass files at most this many fresh rows — the review queue is a
    worklist, not a feed. */
const MAX_FILINGS = 5
/** A dismissed suggestion shape can't re-file inside this window. */
const DISMISS_COOLDOWN_MS = 30 * 86_400_000
/** A kind dismissed this often (with enough resolves) cools down entirely. */
const KIND_DISMISS_MIN = 3
const KIND_DISMISS_RATE = 0.8
/** The pass itself only regenerates about daily — the newest filed row
    younger than this skips the whole pass (a force-scan bypasses). */
const REFILE_WINDOW_MS = 20 * 3_600_000
/** Outcome reads' lookback windows. */
const RESOLVED_LOOKBACK_MS = 90 * 86_400_000
const SIGNAL_LOOKBACK_MS = 60 * 86_400_000
const DRAFT_LOOKBACK_MS = 60 * 86_400_000
/** Learning thresholds — counts that earn a tune-up suggestion. */
const DISMISSED_SIGNALS_FOR_TUNE = 3
const EXPIRED_DRAFTS_FOR_TUNE = 2
/** Book-analysis thresholds the gap generators read. */
const CONCENTRATION_PCT = 25
const TRIM_PCT = 35 /* advice tier: the level a trim proposal is suggested */
const BIG_GAIN_PCT = 40
const CASH_DRAG_PCT = 15
const MOVER_PCT = 4

/* ── Pure planner ─────────────────────────────────────────────────────────── */

/** Rule → wire object the portal's normalizeRules accepts (qty_unit
    snake_case; ids omitted — the accept path stamps a fresh one so the
    suggested rule never shares a dedupe slot with a sibling). */
function wireRule(rule: StrategyRule): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: rule.type,
    metric: rule.metric,
    op: rule.op,
    value: rule.value,
    ...(rule.op === 'between' ? { value2: rule.value2 } : {}),
    title: rule.title,
  }
  if (rule.type === 'signal') {
    return { ...base, severity: rule.severity }
  }
  return {
    ...base,
    side: rule.side,
    qty: rule.qty,
    qty_unit: rule.qty_unit,
  }
}

/** Strategy whose enabled scope covers the most of `symbols` — the natural
    home for a book-wide rule suggestion. watchlist-scope strategies already
    resolve to the full tracked universe, so they win ties by size. */
function bestTarget(strategies: Strategy[], symbols: string[]): Strategy | null {
  const want = new Set(symbols.map((s) => s.toUpperCase()))
  let best: Strategy | null = null
  let bestCover = -1
  for (const s of strategies) {
    if (!s.enabled) continue
    const scope = new Set(s.scope_symbols.map((x) => x.toUpperCase()))
    const cover = [...want].filter((x) => scope.has(x)).length + s.scope_symbols.length / 10_000
    if (cover > bestCover) {
      best = s
      bestCover = cover
    }
  }
  return best
}

/** The enabled strategies' combined resolved universe. */
function coveredSymbols(strategies: Strategy[]): Set<string> {
  const out = new Set<string>()
  for (const s of strategies) {
    if (!s.enabled) continue
    for (const sym of s.scope_symbols) out.add(sym.toUpperCase())
  }
  return out
}

interface PositionStats {
  weightPct: number | null
  gainPct: number | null
  dayChangePct: number | null
}

/** Per-position book math — same FX-aware weight/gain rules the engine and
    the insight pass use, so a suggestion never contradicts a rule's math. */
function positionStats(ctx: SuggestionContext): Map<string, PositionStats> {
  const out = new Map<string, PositionStats>()
  const bookCurrency = ctx.bookCurrency.toUpperCase()
  const priceBySymbol = new Map<string, MarketSnapshot>()
  for (const s of ctx.snapshots) priceBySymbol.set(`${s.asset_class}:${s.symbol}`, s)

  let bookValue = ctx.cashTotal
  const markByPosition = new Map<string, number>()
  for (const p of ctx.positions) {
    const snap = priceBySymbol.get(`${p.asset_class}:${p.symbol}`)
    if (!snap) continue
    const v = convertFx(p.quantity * snap.price, snap.currency, bookCurrency, ctx.fx)
    if (v !== null) {
      markByPosition.set(`${p.asset_class}:${p.symbol}`, v)
      bookValue += v
    }
  }
  for (const p of ctx.positions) {
    const key = `${p.asset_class}:${p.symbol}`
    const snap = priceBySymbol.get(key)
    const mark = markByPosition.get(key) ?? null
    let gainPct: number | null = null
    if (snap && p.avg_cost > 0) {
      const pxBook = convertFx(snap.price, snap.currency, bookCurrency, ctx.fx)
      const costBook = convertFx(p.avg_cost, p.currency ?? snap.currency, bookCurrency, ctx.fx)
      if (pxBook !== null && pxBook > 0 && costBook !== null && costBook > 0) {
        gainPct = ((pxBook - costBook) / costBook) * 100
      }
    }
    out.set(key, {
      weightPct: mark !== null && bookValue > 0 ? (mark / bookValue) * 100 : null,
      gainPct,
      dayChangePct: snap?.day_change_pct ?? null,
    })
  }
  return out
}

/** Any enabled strategy already carrying a rule on `metric`? */
function hasMetricRule(strategies: Strategy[], metric: string): boolean {
  return strategies.some((s) => s.enabled && s.rules.some((r) => r.metric === metric))
}

/** Loosen a threshold so the rule fires ~25% less eagerly — gt/between move
    up/out, lt moves down. */
function loosened(rule: StrategyRule): StrategyRule {
  const base = { ...rule }
  if (rule.op === 'gt') base.value = Math.round(rule.value * 1.25 * 100) / 100
  else if (rule.op === 'lt') {
    /* lt -5 fires on change < -5; -6.25 fires less. For positive lt values
       (lt 3 = "under 3%") less eager is a LOWER bound — same direction. */
    base.value = Math.round(rule.value * (rule.value < 0 ? 1.25 : 0.8) * 100) / 100
  } else if (rule.op === 'between' && rule.value2 !== undefined) {
    const span = (rule.value2 - rule.value) * 0.15
    base.value = Math.round((rule.value - span) * 100) / 100
    base.value2 = Math.round((rule.value2 + span) * 100) / 100
  }
  return base as StrategyRule
}

/** planSuggestions — the deterministic review. Each generator is a small,
    honest observation about the book; suppression rules apply at the end
    so every candidate can be unit-tested pre-filter. */
export function planSuggestions(ctx: SuggestionContext): SuggestionCandidate[] {
  const now = ctx.now ?? Date.now()
  const bookEmpty = ctx.positions.length === 0 && ctx.cashTotal <= 0
  const out: SuggestionCandidate[] = []

  /* ── profile — the "get to know you" nudges ─────────────────────────────
     The book tells Tally what the holder holds; these tell her who they
     are. There is nothing to apply — the accept is a link to the profile
     surface, and the row resolves 'opened'. Kept quiet deliberately: each
     nudge exists only while the gap does, and the scores stay under the
     book's own work. Hoisted above the empty-book return — a holder with
     no positions is exactly who the first nudge serves. */
  const profileSeed = (seed: {
    dedupeKey: string
    title_en: string
    title_fr: string
    detail_en: string
    detail_fr: string
    section: string
    score: number
  }) => {
    out.push({
      kind: 'profile',
      dedupeKey: seed.dedupeKey,
      title_en: seed.title_en,
      title_fr: seed.title_fr,
      detail_en: seed.detail_en,
      detail_fr: seed.detail_fr,
      payload: {
        title_fr: seed.title_fr,
        detail_en: seed.detail_en,
        detail_fr: seed.detail_fr,
        section: seed.section,
      },
      score: seed.score,
    })
  }
  const prof = ctx.profile ?? null
  const dimsSet = Boolean(prof?.risk || prof?.horizon || prof?.goal)
  if (!dimsSet) {
    profileSeed({
      dedupeKey: 'profile:dims',
      title_en: 'Tell Tally what you’re optimizing for',
      title_fr: 'Dites à Tally ce que vous optimisez',
      detail_en:
        'Risk, horizon and goal shape every draft and posture line — a 30-second answer on your profile page.',
      detail_fr:
        'Risque, horizon et objectif orientent chaque brouillon — trente secondes sur votre page profil.',
      section: 'declared',
      score: 30,
    })
  } else if (!prof?.mandate?.trim()) {
    profileSeed({
      dedupeKey: 'profile:mandate',
      title_en: 'Your mandate, in your words',
      title_fr: 'Votre mandat, dans vos mots',
      detail_en:
        'One or two sentences of philosophy — Tally weighs it more than any dropdown when she drafts.',
      detail_fr:
        'Une phrase ou deux de philosophie — Tally l’accorde plus de poids que tout menu déroulant.',
      section: 'mandate',
      score: 25,
    })
  }
  if ((ctx.chatTurns ?? 0) > 0 && (ctx.memoryCount ?? 0) === 0) {
    profileSeed({
      dedupeKey: 'profile:memories',
      title_en: 'Let Tally review what she’s learned',
      title_fr: 'Laissez Tally réviser ce qu’elle a retenu',
      detail_en:
        'You’ve talked with Tally — one review turns the durable parts into memories you approve.',
      detail_fr:
        'Vous avez échangé avec Tally — une révision transforme ce qui dure en souvenirs que vous approuvez.',
      section: 'memories',
      score: 20,
    })
  }

  if (bookEmpty) return out

  const enabled = ctx.strategies.filter((s) => s.enabled)
  const stats = positionStats(ctx)
  const heldSymbols = [...new Set(ctx.positions.map((p) => p.symbol.toUpperCase()))]

  /* ── strategy — a book with nothing watching it ─────────────────────────
     The seeded draft is deliberately boring: one watcher and one drift
     guard (plus a trim proposal for the advice tier), all disabled until
     the person reviews — the same autonomy contract every draft honors. */
  if (enabled.length === 0) {
    const rules: StrategyRule[] = [
      {
        type: 'signal',
        metric: 'day_change_pct',
        op: 'lt',
        value: -5,
        title: 'Fell 5% today',
        severity: 'alert',
      },
      {
        type: 'signal',
        metric: 'weight_pct',
        op: 'gt',
        value: CONCENTRATION_PCT,
        title: `Above ${CONCENTRATION_PCT}% of book`,
        severity: 'insight',
      },
    ]
    if (ctx.advice) {
      rules.push({
        type: 'order_proposal',
        metric: 'weight_pct',
        op: 'gt',
        value: TRIM_PCT,
        title: `Trim above ${TRIM_PCT}% of book`,
        side: 'sell',
        qty: 10,
        qty_unit: 'percent_of_position',
      })
    }
    out.push({
      kind: 'strategy',
      dedupeKey: 'strategy:book-watch',
      title_en: 'Book watch',
      title_fr: 'Surveillance du carnet',
      detail_en:
        'Nothing watches this book yet — a starting set covering big day moves and concentration, off until you enable it.',
      detail_fr:
        'Rien ne surveille encore ce carnet — un ensemble de départ couvrant les fortes variations quotidiennes et la concentration, inactif tant que vous ne l’activez pas.',
      payload: {
        title_fr: 'Surveillance du carnet',
        detail_en:
          'Nothing watches this book yet — a starting set covering big day moves and concentration, off until you enable it.',
        detail_fr:
          'Rien ne surveille encore ce carnet — un ensemble de départ couvrant les fortes variations quotidiennes et la concentration, inactif tant que vous ne l’activez pas.',
        draft: {
          name: 'Book watch',
          cadence: 'daily',
          scope: { watchlist: true, symbols: heldSymbols.slice(0, 30) },
          rules: rules.map(wireRule),
        },
      },
      score: 90,
    })
    /* No enabled strategy means rule_add/scope_add have nowhere to land —
       the draft above is the whole answer. */
    return out
  }

  /* ── rule_add — coverage gaps on the live book ────────────────────────── */
  const target = bestTarget(ctx.strategies, heldSymbols)
  if (target) {
    /* Concentration — a fat position with no weight rule anywhere. */
    const heaviest = ctx.positions
      .map((p) => ({ p, w: stats.get(`${p.asset_class}:${p.symbol}`)?.weightPct ?? null }))
      .filter((x) => x.w !== null)
      .sort((a, b) => (b.w ?? 0) - (a.w ?? 0))[0]
    if (heaviest && (heaviest.w ?? 0) >= CONCENTRATION_PCT && !hasMetricRule(ctx.strategies, 'weight_pct')) {
      const sym = heaviest.p.symbol.toUpperCase()
      const w = (heaviest.w ?? 0).toFixed(0)
      /* Advice tier gets the trim as a draft-order rule at the higher bar —
         everyone else gets the watcher. */
      const proposalTier = ctx.advice && (heaviest.w ?? 0) >= TRIM_PCT
      const rule: StrategyRule = proposalTier
        ? {
            type: 'order_proposal',
            metric: 'weight_pct',
            op: 'gt',
            value: TRIM_PCT,
            title: `Trim above ${TRIM_PCT}% of book`,
            side: 'sell',
            qty: 10,
            qty_unit: 'percent_of_position',
          }
        : {
            type: 'signal',
            metric: 'weight_pct',
            op: 'gt',
            value: CONCENTRATION_PCT,
            title: `Above ${CONCENTRATION_PCT}% of book`,
            severity: 'alert',
          }
      out.push({
        kind: 'rule_add',
        dedupeKey: `rule_add:${target.id}:weight_pct:gt:${proposalTier ? TRIM_PCT : CONCENTRATION_PCT}`,
        title_en: proposalTier
          ? `${sym} is ${w}% of your book — draft a trim when it passes ${TRIM_PCT}%`
          : `${sym} is ${w}% of your book — flag it above ${CONCENTRATION_PCT}%`,
        title_fr: proposalTier
          ? `${sym} représente ${w} % du carnet — proposer un allègement au-delà de ${TRIM_PCT} %`
          : `${sym} représente ${w} % du carnet — signaler au-delà de ${CONCENTRATION_PCT} %`,
        detail_en: `Adds one rule to “${target.name ?? 'strategy'}”.`,
        detail_fr: `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`,
        payload: {
          title_fr: proposalTier
            ? `${sym} représente ${w} % du carnet — proposer un allègement au-delà de ${TRIM_PCT} %`
            : `${sym} représente ${w} % du carnet — signaler au-delà de ${CONCENTRATION_PCT} %`,
          detail_en: `Adds one rule to “${target.name ?? 'strategy'}”.`,
          detail_fr: `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`,
          strategy_id: target.id,
          strategy_name: target.name ?? '',
          rule: wireRule(rule),
        },
        score: 80,
      })
    }

    /* Unrealized gains — a position deep in the money with no profit rule. */
    const winner = ctx.positions
      .map((p) => ({ p, g: stats.get(`${p.asset_class}:${p.symbol}`)?.gainPct ?? null }))
      .filter((x) => x.g !== null)
      .sort((a, b) => (b.g ?? 0) - (a.g ?? 0))[0]
    if (winner && (winner.g ?? 0) >= BIG_GAIN_PCT && !hasMetricRule(ctx.strategies, 'unrealized_gain_pct')) {
      const sym = winner.p.symbol.toUpperCase()
      const g = (winner.g ?? 0).toFixed(0)
      const rule: StrategyRule = {
        type: 'signal',
        metric: 'unrealized_gain_pct',
        op: 'gt',
        value: BIG_GAIN_PCT,
        title: `Gain above ${BIG_GAIN_PCT}%`,
        severity: 'insight',
      }
      out.push({
        kind: 'rule_add',
        dedupeKey: `rule_add:${target.id}:unrealized_gain_pct:gt:${BIG_GAIN_PCT}`,
        title_en: `${sym} is up ${g}% — mark the level before it isn't`,
        title_fr: `${sym} est en hausse de ${g} % — noter le niveau`,
        detail_en: `Adds one rule to “${target.name ?? 'strategy'}”.`,
        detail_fr: `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`,
        payload: {
          title_fr: `${sym} est en hausse de ${g} % — noter le niveau`,
          detail_en: `Adds one rule to “${target.name ?? 'strategy'}”.`,
          detail_fr: `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`,
          strategy_id: target.id,
          strategy_name: target.name ?? '',
          rule: wireRule(rule),
        },
        score: 60,
      })
    }

    /* Cash drag — idle cash a cash_above rule would flag. The share uses
       the same FX-aware marks the weight math does. */
    const marks = positionsMark(ctx)
    const cashShare = ctx.cashTotal > 0 ? (ctx.cashTotal / (ctx.cashTotal + marks)) * 100 : 0
    if (cashShare >= CASH_DRAG_PCT && !hasMetricRule(ctx.strategies, 'cash_above')) {
      const threshold = Math.max(100, Math.round(ctx.cashTotal * 0.75 / 100) * 100)
      const rule: StrategyRule = {
        type: 'signal',
        metric: 'cash_above',
        op: 'gt',
        value: threshold,
        title: `Cash above ${threshold.toLocaleString('en-CA')} ${ctx.bookCurrency}`,
        severity: 'insight',
      }
      out.push({
        kind: 'rule_add',
        dedupeKey: `rule_add:${target.id}:cash_above:gt:${threshold}`,
        title_en: `${cashShare.toFixed(0)}% of the book is cash — flag it past ${threshold.toLocaleString('en-CA')} ${ctx.bookCurrency}`,
        title_fr: `${cashShare.toFixed(0)} % du carnet est en espèces — signaler au-delà de ${threshold.toLocaleString('fr-CA')} ${ctx.bookCurrency}`,
        detail_en: `Adds one rule to “${target.name ?? 'strategy'}”.`,
        detail_fr: `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`,
        payload: {
          title_fr: `${cashShare.toFixed(0)} % du carnet est en espèces — signaler au-delà de ${threshold.toLocaleString('fr-CA')} ${ctx.bookCurrency}`,
          detail_en: `Adds one rule to “${target.name ?? 'strategy'}”.`,
          detail_fr: `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`,
          strategy_id: target.id,
          strategy_name: target.name ?? '',
          rule: wireRule(rule),
        },
        score: 50,
      })
    }

    /* Fast mover — a held symbol swung today with no day-move watcher. */
    const mover = ctx.positions
      .map((p) => ({ p, d: stats.get(`${p.asset_class}:${p.symbol}`)?.dayChangePct ?? null }))
      .filter((x) => x.d !== null && Math.abs(x.d ?? 0) >= MOVER_PCT)
      .sort((a, b) => Math.abs(b.d ?? 0) - Math.abs(a.d ?? 0))[0]
    if (mover && !hasMetricRule(ctx.strategies, 'day_change_pct')) {
      const rule: StrategyRule = {
        type: 'signal',
        metric: 'day_change_pct',
        op: 'lt',
        value: -5,
        title: 'Fell 5% today',
        severity: 'alert',
      }
      /* A day-move rule on a weekly/monthly strategy can never catch a
         mover — the accept path applies payload.cadence, so the copy must
         disclose the switch instead of just wishing for daily. */
      const slower = target.cadence !== 'daily'
      const moverName = target.name ?? 'strategy'
      const detailEn = slower
        ? `Adds one rule to “${moverName}” and switches it to daily — a ${target.cadence} run can't catch day moves.`
        : `Adds one rule to “${moverName}”.`
      const detailFr = slower
        ? `Ajoute une règle à « ${target.name ?? 'stratégie'} » et la passe en quotidien — un balayage ${target.cadence === 'weekly' ? 'hebdomadaire' : 'mensuel'} ne peut capter les variations du jour.`
        : `Ajoute une règle à « ${target.name ?? 'stratégie'} ».`
      out.push({
        kind: 'rule_add',
        dedupeKey: `rule_add:${target.id}:day_change_pct:lt:-5`,
        title_en: `${mover.p.symbol.toUpperCase()} moved ${mover.d!.toFixed(1)}% today — a daily watcher would catch the next one`,
        title_fr: `${mover.p.symbol.toUpperCase()} a bougé de ${mover.d!.toFixed(1).replace('.', ',')} % aujourd’hui — une veille quotidienne capterait la prochaine`,
        detail_en: detailEn,
        detail_fr: detailFr,
        payload: {
          title_fr: `${mover.p.symbol.toUpperCase()} a bougé de ${mover.d!.toFixed(1).replace('.', ',')} % aujourd’hui — une veille quotidienne capterait la prochaine`,
          detail_en: detailEn,
          detail_fr: detailFr,
          strategy_id: target.id,
          strategy_name: target.name ?? '',
          cadence: slower ? 'daily' : undefined,
          rule: wireRule(rule),
        },
        score: 40,
      })
    }
  }

  /* ── scope_add — held symbols no enabled strategy watches ─────────────── */
  const covered = coveredSymbols(ctx.strategies)
  const uncovered = heldSymbols.filter((s) => !covered.has(s))
  if (uncovered.length > 0) {
    const home = bestTarget(ctx.strategies, uncovered)
    if (home) {
      const list = uncovered.slice(0, 8)
      out.push({
        kind: 'scope_add',
        dedupeKey: `scope_add:${home.id}:${[...list].sort().join(',')}`,
        title_en: `${list.join(', ')} ${list.length > 1 ? 'are' : 'is'} held but unwatched — add to “${home.name ?? 'strategy'}” scope`,
        title_fr: `${list.join(', ')} ${list.length > 1 ? 'sont détenus' : 'est détenu'} mais non surveillés — ajouter à la portée de « ${home.name ?? 'stratégie'} »`,
        detail_en: 'Scope rules only scan the symbols you give them.',
        detail_fr: 'Les règles de portée ne balayent que les symboles indiqués.',
        payload: {
          title_fr: `${list.join(', ')} ${list.length > 1 ? 'sont détenus' : 'est détenu'} mais non surveillés — ajouter à la portée de « ${home.name ?? 'stratégie'} »`,
          detail_en: 'Scope rules only scan the symbols you give them.',
          detail_fr: 'Les règles de portée ne balayent que les symboles indiqués.',
          strategy_id: home.id,
          strategy_name: home.name ?? '',
          symbols: list,
        },
        score: 70,
      })
    }
  }

  /* ── thesis — held symbols with no standing claim yet ───────────────────
     One suggestion per untracked holding (capped so a fresh book doesn't
     flood). The seed ships modest defaults — the story line stays blank:
     Tally proposes the scaffolding, the human writes the claim. */
  const thesised = new Set(
    (ctx.theses ?? []).map((t) => `${t.asset_class}:${t.symbol.toUpperCase()}`),
  )
  const untracked = ctx.positions.filter(
    (p) => !thesised.has(`${p.asset_class}:${p.symbol.toUpperCase()}`),
  )
  for (const p of untracked.slice(0, 3)) {
    const sym = p.symbol.toUpperCase()
    const seedDrift: StrategyRule[] = [
      {
        type: 'signal',
        metric: 'vs_ma50',
        op: 'lt',
        value: -5,
        title: '5% under the 50-day average',
        severity: 'insight',
      },
    ]
    const seedBreak: StrategyRule[] = [
      {
        type: 'signal',
        metric: 'unrealized_gain_pct',
        op: 'lt',
        value: -30,
        title: 'Position down 30% from cost',
        severity: 'alert',
      },
    ]
    /* Per-holding facts in the detail so scaffold rows aren't identical —
       the drafted row (draft-thesis, same dedupe key) supersedes this. */
    const cur = (p.currency ?? '').toUpperCase()
    const basis =
      p.avg_cost > 0 && cur
        ? {
            en: `You hold ${p.quantity} ${sym} at an average cost of ${p.avg_cost} ${cur}. `,
            fr: `Vous détenez ${p.quantity} ${sym} au coût moyen de ${p.avg_cost} ${cur}. `,
          }
        : { en: '', fr: '' }
    const detailEn = `${basis.en}A thesis names the story and the conditions that break it — Tally watches them every sweep.`
    const detailFr = `${basis.fr}Une thèse nomme l’histoire et les conditions qui l’invalident — Tally les surveille à chaque balayage.`
    out.push({
      kind: 'thesis',
      dedupeKey: `thesis:${p.asset_class}:${sym}`,
      title_en: `${sym} has no thesis — track what would change your mind`,
      title_fr: `${sym} n’a pas de thèse — suivre ce qui vous ferait changer d’avis`,
      detail_en: detailEn,
      detail_fr: detailFr,
      payload: {
        title_fr: `${sym} n’a pas de thèse — suivre ce qui vous ferait changer d’avis`,
        detail_en: detailEn,
        detail_fr: detailFr,
        asset_class: p.asset_class,
        symbol: sym,
        name: p.name ?? '',
        seed: {
          thesis: '',
          intent: 'core',
          break_rules: seedBreak.map(wireRule),
          drift_rules: seedDrift.map(wireRule),
        },
      },
      score: 65,
    })
  }

  /* ── goal — measurable starters for a book without any ──────────────────
     "I don't know what goals to add" is the motivating case: each seed is
     a real metric at a real threshold, not a wish. The goals themselves
     re-measure every sweep once accepted. */
  const goalMetrics = new Set((ctx.goals ?? []).map((g) => g.metric))
  const seedGoal = (seed: {
    title_en: string
    title_fr: string
    detail_en: string
    detail_fr: string
    title: string
    detail: string
    metric: string
    op: 'gte' | 'lte'
    target: number
    score: number
    dedupeKey: string
  }) => {
    out.push({
      kind: 'goal',
      dedupeKey: seed.dedupeKey,
      title_en: seed.title_en,
      title_fr: seed.title_fr,
      detail_en: seed.detail_en,
      detail_fr: seed.detail_fr,
      payload: {
        title_fr: seed.title_fr,
        detail_en: seed.detail_en,
        detail_fr: seed.detail_fr,
        seed: {
          title: seed.title,
          detail: seed.detail,
          metric: seed.metric,
          op: seed.op,
          target: seed.target,
          deadline: null,
        },
      },
      score: seed.score,
    })
  }
  if (ctx.positions.length > 0) {
    /* Concentration — the heaviest position has no ceiling goal and no
       weight rule already watching the same concern (a rule is the
       louder guard; the goal would be duplicate noise). */
    if (!goalMetrics.has('max_weight_pct') && !hasMetricRule(ctx.strategies, 'weight_pct')) {
      const heaviest = ctx.positions
        .map((p) => stats.get(`${p.asset_class}:${p.symbol}`)?.weightPct ?? null)
        .filter((w): w is number => w !== null)
        .sort((a, b) => b - a)[0]
      if (heaviest !== undefined && heaviest >= 20) {
        const cap = Math.round(heaviest / 5) * 5
        seedGoal({
          title_en: `Cap the biggest position near ${cap}% of book`,
          title_fr: `Plafonner la plus grosse position vers ${cap} % du carnet`,
          detail_en: `The largest position sits at ${heaviest.toFixed(0)}% — a ceiling goal re-measures every sweep.`,
          detail_fr: `La plus grosse position est à ${heaviest.toFixed(0)} % — un plafond se remesure à chaque balayage.`,
          title: `Keep any single position at or under ${cap}%`,
          detail: 'Concentration ceiling — Tally measures it every sweep.',
          metric: 'max_weight_pct',
          op: 'lte',
          target: cap,
          dedupeKey: 'goal:max_weight_pct:lte',
          score: 45,
        })
      }
    }
    /* Coverage — held symbols still untracked by a thesis. */
    if (!goalMetrics.has('thesis_coverage') && untracked.length > 0) {
      seedGoal({
        title_en: 'Every holding gets a thesis',
        title_fr: 'Une thèse pour chaque position',
        detail_en: `${untracked.length} holding${untracked.length > 1 ? 's' : ''} still untracked — a coverage goal nudges until every position carries a claim.`,
        detail_fr: `${untracked.length} position${untracked.length > 1 ? 's' : ''} sans thèse — l’objectif de couverture relance jusqu’à ce que chaque position en ait une.`,
        title: 'Thesis on every holding',
        detail: 'Coverage goal — the share of held symbols carrying a thesis.',
        metric: 'thesis_coverage',
        op: 'gte',
        target: 100,
        dedupeKey: 'goal:thesis_coverage:gte',
        score: 42,
      })
    }
    /* Idle cash — a ceiling on the cash share. */
    if (!goalMetrics.has('cash_pct') && ctx.cashTotal > 0) {
      const marks = positionsMark(ctx)
      const share = (ctx.cashTotal / (ctx.cashTotal + marks)) * 100
      if (share >= 20) {
        const cap = Math.max(5, Math.round((share - 5) / 5) * 5)
        seedGoal({
          title_en: `Put idle cash on a clock — under ${cap}% of book`,
          title_fr: `Un échéancier pour les liquidités — sous ${cap} % du carnet`,
          detail_en: `Cash sits at ${share.toFixed(0)}% of the book — a ceiling goal tracks the draw-down.`,
          detail_fr: `Les liquidités représentent ${share.toFixed(0)} % du carnet — un plafond suit la baisse.`,
          title: `Cash under ${cap}% of book`,
          detail: 'Idle-cash ceiling — measured every sweep.',
          metric: 'cash_pct',
          op: 'lte',
          target: cap,
          dedupeKey: 'goal:cash_pct:lte',
          score: 38,
        })
      }
    }
  }

  /* ── rule_tune — the feedback loop ────────────────────────────────────── */
  for (const strategy of ctx.strategies) {
    if (!strategy.enabled) continue
    for (const rule of strategy.rules) {
      const ident = ruleIdent(rule)
      const key = `${strategy.id}::${ident}`
      const dismissed = ctx.outcomes.dismissedSignals.get(key) ?? 0
      const expired = ctx.outcomes.expiredDrafts.get(key) ?? 0

      if (dismissed >= DISMISSED_SIGNALS_FOR_TUNE && rule.type === 'signal') {
        const tuned = loosened(rule)
        out.push({
          kind: 'rule_tune',
          dedupeKey: `rule_tune:${strategy.id}:${ident}:dismissed`,
          title_en: `“${rule.title}” keeps firing and you keep dismissing — loosen it?`,
          title_fr: `« ${rule.title} » se déclenche souvent et vous l’écartez — l’assouplir ?`,
          detail_en: `${dismissed} dismissed alerts in ~2 months. Thresholds move about 25% — nothing else changes.`,
          detail_fr: `${dismissed} alertes écartées en ~2 mois. Les seuils bougent d’environ 25 % — rien d’autre ne change.`,
          payload: {
            title_fr: `« ${rule.title} » se déclenche souvent et vous l’écartez — l’assouplir ?`,
            detail_en: `${dismissed} dismissed alerts in ~2 months. Thresholds move about 25% — nothing else changes.`,
            detail_fr: `${dismissed} alertes écartées en ~2 mois. Les seuils bougent d’environ 25 % — rien d’autre ne change.`,
            strategy_id: strategy.id,
            strategy_name: strategy.name ?? '',
            rule_id: rule.id ?? null,
            rule_ident: ident,
            reason: 'dismissed',
            count: dismissed,
            rule: wireRule(tuned),
          },
          score: 75,
        })
      }
      if (expired >= EXPIRED_DRAFTS_FOR_TUNE && rule.type === 'order_proposal') {
        const asSignal: SignalRule = {
          type: 'signal',
          metric: rule.metric,
          op: rule.op,
          value: rule.value,
          ...(rule.op === 'between' && rule.value2 !== undefined
            ? { value2: rule.value2 }
            : {}),
          title: rule.title,
          severity: 'alert',
        }
        out.push({
          kind: 'rule_tune',
          dedupeKey: `rule_tune:${strategy.id}:${ident}:ignored`,
          title_en: `“${rule.title}” drafts orders you never approve — make it a watch instead?`,
          title_fr: `« ${rule.title} » rédige des ordres jamais approuvés — en faire une veille ?`,
          detail_en: `${expired} draft orders expired unapproved. The signal version flags the same condition without queueing work.`,
          detail_fr: `${expired} ordres brouillon ont expiré sans approbation. La version veille signale la même condition sans créer de travail.`,
          payload: {
            title_fr: `« ${rule.title} » rédige des ordres jamais approuvés — en faire une veille ?`,
            detail_en: `${expired} draft orders expired unapproved. The signal version flags the same condition without queueing work.`,
            detail_fr: `${expired} ordres brouillon ont expiré sans approbation. La version veille signale la même condition sans créer de travail.`,
            strategy_id: strategy.id,
            strategy_name: strategy.name ?? '',
            rule_id: rule.id ?? null,
            rule_ident: ident,
            reason: 'ignored',
            count: expired,
            rule: wireRule(asSignal),
          },
          score: 75,
        })
      }
    }
  }

  /* ── Learned suppression + ranking ────────────────────────────────────── */
  const cooled = out.filter((c) => {
    const dismissedAt = ctx.outcomes.dismissedKeys.get(c.dedupeKey)
    if (dismissedAt !== undefined && now - dismissedAt < DISMISS_COOLDOWN_MS) return false
    const ks = ctx.outcomes.kindStats.get(c.kind)
    if (
      ks &&
      ks.accepted + ks.dismissed >= KIND_DISMISS_MIN &&
      ks.dismissed / (ks.accepted + ks.dismissed) >= KIND_DISMISS_RATE &&
      now - ks.lastResolved < DISMISS_COOLDOWN_MS
    ) {
      return false
    }
    return true
  })
  return cooled.sort((a, b) => b.score - a.score).slice(0, MAX_FILINGS)
}

/** Positions' marks in book currency — the cash-share denominator. */
function positionsMark(ctx: SuggestionContext): number {
  let sum = 0
  for (const p of ctx.positions) {
    const snap = ctx.snapshots.find((s) => s.asset_class === p.asset_class && s.symbol === p.symbol)
    if (!snap) continue
    const v = convertFx(p.quantity * snap.price, snap.currency, ctx.bookCurrency, ctx.fx)
    if (v !== null) sum += v
  }
  return sum
}

/* ── Outcome loading + filing ─────────────────────────────────────────────── */

/** Read the learning inputs — resolved suggestions (90d), dismissed rule
    signals (60d), expired draft orders (60d). Older schemas missing rule_id
    retry column-set down, matching the dedupe reads' fallback contract. */
async function loadOutcomes(
  adminClient: SupabaseClient,
  userId: string,
  now: number,
): Promise<OutcomeHistory> {
  const outcomes: OutcomeHistory = {
    dismissedKeys: new Map(),
    kindStats: new Map(),
    dismissedSignals: new Map(),
    expiredDrafts: new Map(),
  }
  const resolvedCutoff = new Date(now - RESOLVED_LOOKBACK_MS).toISOString()
  const signalCutoff = new Date(now - SIGNAL_LOOKBACK_MS).toISOString()
  const draftCutoff = new Date(now - DRAFT_LOOKBACK_MS).toISOString()

  const { data: resolved } = await adminClient
    .from('agent_suggestions')
    .select('kind, status, dedupe_key, resolved_at')
    .eq('user_id', userId)
    .eq('surface', 'invest')
    .neq('status', 'pending')
    .gte('resolved_at', resolvedCutoff)
  for (const row of (resolved ?? []) as {
    kind: string
    status: string
    dedupe_key: string | null
    resolved_at: string | null
  }[]) {
    const at = row.resolved_at ? Date.parse(row.resolved_at) : now
    if (row.status === 'dismissed' && row.dedupe_key) {
      const prev = outcomes.dismissedKeys.get(row.dedupe_key) ?? 0
      outcomes.dismissedKeys.set(row.dedupe_key, Math.max(prev, at))
    }
    const ks = outcomes.kindStats.get(row.kind) ?? {
      accepted: 0,
      dismissed: 0,
      lastResolved: 0,
    }
    if (row.status === 'accepted') ks.accepted += 1
    else ks.dismissed += 1
    ks.lastResolved = Math.max(ks.lastResolved, at)
    outcomes.kindStats.set(row.kind, ks)
  }

  let signalsRes: PostgrestSingleResponse<
    { strategy_id: string | null; rule_id?: string | null; title: string }[]
  > = await adminClient
    .from('invest_signals')
    .select('strategy_id, rule_id, title')
    .eq('user_id', userId)
    .eq('status', 'dismissed')
    .gte('created_at', signalCutoff)
  if (signalsRes.error && /rule_id/.test(signalsRes.error.message)) {
    signalsRes = (await adminClient
      .from('invest_signals')
      .select('strategy_id, title')
      .eq('user_id', userId)
      .eq('status', 'dismissed')
      .gte('created_at', signalCutoff)) as unknown as typeof signalsRes
  }
  for (const row of ((signalsRes.data ?? []) as unknown) as {
    strategy_id: string | null
    rule_id?: string | null
    title: string
  }[]) {
    if (!row.strategy_id) continue /* insight rows tune nothing */
    const key = `${row.strategy_id}::${row.rule_id ?? row.title}`
    outcomes.dismissedSignals.set(key, (outcomes.dismissedSignals.get(key) ?? 0) + 1)
  }

  let ordersRes: PostgrestSingleResponse<
    { strategy_id: string | null; rule_id?: string | null; note: string | null }[]
  > = await adminClient
    .from('invest_orders')
    .select('strategy_id, rule_id, note')
    .eq('user_id', userId)
    .eq('status', 'expired')
    .gte('created_at', draftCutoff)
  if (ordersRes.error && /rule_id/.test(ordersRes.error.message)) {
    ordersRes = (await adminClient
      .from('invest_orders')
      .select('strategy_id, note')
      .eq('user_id', userId)
      .eq('status', 'expired')
      .gte('created_at', draftCutoff)) as unknown as typeof ordersRes
  }
  for (const row of ((ordersRes.data ?? []) as unknown) as {
    strategy_id: string | null
    rule_id?: string | null
    note: string | null
  }[]) {
    if (!row.strategy_id) continue
    const ident = row.rule_id ?? (row.note ?? '').replace(/^Order proposal — /, '')
    if (!ident) continue
    const key = `${row.strategy_id}::${ident}`
    outcomes.expiredDrafts.set(key, (outcomes.expiredDrafts.get(key) ?? 0) + 1)
  }
  return outcomes
}

/**
 * File the plan's candidates to agent_suggestions. Bounded twice: the pass
 * regenerates at most every REFILE_WINDOW (newest filed row younger skips —
 * a force-scan bypasses for an explicit ask), and each candidate carries a
 * dedupe key so repeated passes never pile up pending twins.
 * Returns the number of fresh rows filed.
 */
export async function fileBookSuggestions(
  adminClient: SupabaseClient,
  userId: string,
  ctx: Omit<SuggestionContext, 'outcomes' | 'advice'> & { advice?: boolean },
): Promise<number> {
  const now = Date.now()
  /* An empty book still runs the plan — every book-shaped generator gates
     on positions/cash itself, and the 'profile' nudges ("tell Tally what
     you're optimizing for") are the empty book's best first action. The
     refile window below keeps the repeated sweeps cheap. */
  const { data: newest } = await adminClient
    .from('agent_suggestions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('surface', 'invest')
    .order('created_at', { ascending: false })
    .limit(1)
  const lastFiled = newest?.[0]?.created_at ? Date.parse(newest[0].created_at) : 0
  if (ctx.force !== true && lastFiled > 0 && now - lastFiled < REFILE_WINDOW_MS) return 0

  /* The advice tier resolves only once the pass will actually file — a
     gate-skipped sweep pays no auth lookup. Callers that already know it
     (runUser resolved the email for insights) pass it straight through. */
  let advice = ctx.advice
  if (advice === undefined) {
    const { data: userData } = await adminClient.auth.admin.getUserById(userId)
    advice = isInternalDutivaAccount(userData?.user?.email ?? null)
  }

  const outcomes = await loadOutcomes(adminClient, userId, now)

  /* Profile + memory/chat counts — the 'profile' nudges' inputs. Loaded
     here (after the refile gate) for the same reason outcomes are: a
     skipped pass pays nothing. Callers that already hold them pass them
     in — undefined means load, null/0 means genuinely unset. */
  const [profile, memoryCount, chatTurns] = await Promise.all([
    ctx.profile === undefined
      ? adminClient
          .from('invest_user_profile')
          .select('risk_tolerance, horizon, goal, mandate')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) =>
            data
              ? {
                  risk: (data.risk_tolerance as string | null) ?? null,
                  horizon: (data.horizon as string | null) ?? null,
                  goal: (data.goal as string | null) ?? null,
                  mandate: (data.mandate as string | null) ?? null,
                }
              : null,
          )
      : Promise.resolve(ctx.profile),
    ctx.memoryCount === undefined
      ? adminClient
          .from('invest_memories')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(ctx.memoryCount),
    ctx.chatTurns === undefined
      ? adminClient
          .from('invest_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('role', 'user')
          .then(({ count }) => count ?? 0)
      : Promise.resolve(ctx.chatTurns),
  ])

  const candidates = planSuggestions({
    ...ctx,
    advice,
    outcomes,
    profile,
    memoryCount,
    chatTurns,
  })
  let filed = 0
  for (const c of candidates) {
    const res = await fileSuggestion(adminClient, {
      userId,
      surface: 'invest',
      kind: c.kind,
      title: c.title_en,
      payload: c.payload,
      source: 'rule',
      dedupeKey: c.dedupeKey,
    })
    if (res?.fresh) filed += 1
  }
  return filed
}
