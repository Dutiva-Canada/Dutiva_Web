/**
 * /invest/plan — the book as one document. Assembles live state into a
 * readable plan: the objective and notes the holder wrote themselves, the
 * declared profile, goals, holdings with their theses, standing rules, the
 * watch board, what's waiting, and how review works.
 *
 * Interactive where a plan should be: the objective and notes edit in
 * place on invest_user_profile, and a "Mark as reviewed" stamp records the
 * last read-through. Everything else renders read-only — the document is
 * the sum of what the portal already holds, not a second source of truth.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Pencil, Printer, Stamp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { supabase } from '@/lib/supabaseClient'
import { useInvestData } from '../data/InvestDataContext'
import { convertFx, loadFxRates, type FxTable } from '../data/fx'
import { isQuoteStale } from '../data/freshness'
import { relTimeLabel } from './relTime'
import { PageHead } from './PageHead'
import { PROFILE_SELECTS, PROFILE_TAGS, PROFILE_FIELD } from './profileDims'
import {
  fmtDay,
  fmtPct,
  pl,
  strategyMeta,
  scopeSymbols,
  trackedUniverse,
  goalTargetLabel,
  ASSET_LABEL,
  SCAN_DIR_LABEL,
  SCAN_DIR_PILL,
} from './strategyUi'
import type { GoalMetric, InvestGoal, InvestThesis, ThesisIntent } from '../data/types'
import { useInvestHead } from './useInvestHead'
import './strategies.css'

/** Profile row — the dims read out beside the plan-owned fields. */
interface PlanProfileRow {
  risk_tolerance: string | null
  horizon: string | null
  goal: string | null
  experience: string | null
  answer_style: string | null
  sectors: string[] | null
  exclusions: string[] | null
  mandate: string | null
  plan_objective: string | null
  plan_notes: string | null
  plan_reviewed_at: string | null
}
const PLAN_PROFILE_SELECT =
  'risk_tolerance, horizon, goal, experience, answer_style, sectors, exclusions, mandate, plan_objective, plan_notes, plan_reviewed_at'

/** Materialized after a first write on a holder with no profile row yet —
    mirrors what the upsert created so the document updates in place. */
const EMPTY_PLAN_ROW: PlanProfileRow = {
  risk_tolerance: null,
  horizon: null,
  goal: null,
  experience: null,
  answer_style: null,
  sectors: null,
  exclusions: null,
  mandate: null,
  plan_objective: null,
  plan_notes: null,
  plan_reviewed_at: null,
}

const THESIS_PILL: Record<InvestThesis['status'], string> = {
  healthy: 'sb-pill-ok',
  drifting: 'sb-pill-warn',
  broken: 'sb-pill-fail',
}
const THESIS_LABEL: Record<InvestThesis['status'], keyof typeof IM> = {
  healthy: 'invest_thesis_status_healthy',
  drifting: 'invest_thesis_status_drifting',
  broken: 'invest_thesis_status_broken',
}
const INTENT_LABEL: Record<ThesisIntent, keyof typeof IM> = {
  core: 'invest_thesis_intent_core',
  growth: 'invest_thesis_intent_growth',
  income: 'invest_thesis_intent_income',
  speculative: 'invest_thesis_intent_speculative',
}
const GOAL_PILL: Record<InvestGoal['status'], string> = {
  on_track: 'sb-pill-ok',
  behind: 'sb-pill-warn',
  achieved: 'sb-pill-ok',
  missed: 'sb-pill-fail',
}
const GOAL_LABEL: Record<InvestGoal['status'], keyof typeof IM> = {
  on_track: 'invest_goal_status_on_track',
  behind: 'invest_goal_status_behind',
  achieved: 'invest_goal_status_achieved',
  missed: 'invest_goal_status_missed',
}
const GOAL_METRIC: Record<GoalMetric, keyof typeof IM> = {
  book_value: 'invest_goal_metric_book_value',
  cash_pct: 'invest_goal_metric_cash_pct',
  max_weight_pct: 'invest_goal_metric_max_weight_pct',
  unrealized_gain_pct: 'invest_goal_metric_unrealized_gain_pct',
  thesis_coverage: 'invest_goal_metric_thesis_coverage',
  position_count: 'invest_goal_metric_position_count',
}

export function InvestPlanPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, loading, error: loadError } = useInvestData()
  const { showToast } = useToasts()
  useInvestHead(IM.invest_seo_title_plan, IM.invest_seo_desc_plan)

  const [profile, setProfile] = useState<PlanProfileRow | null>(null)
  const [editing, setEditing] = useState<'plan_objective' | 'plan_notes' | null>(null)
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveErr, setSaveErr] = useState('')
  const [stampErr, setStampErr] = useState('')
  const [stamping, setStamping] = useState(false)
  const [fx, setFx] = useState<FxTable | null>(null)

  /* Money/quantity/date formatters — same Intl conventions the positions
     table uses (currency-styled amounts in the position's own currency,
     4-digit quantity precision for fractional crypto lots). */
  const fmtFor = useMemo(() => {
    const cache = new Map<string, Intl.NumberFormat>()
    return (cur: string) => {
      let f = cache.get(cur)
      if (!f) {
        f = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
          style: 'currency',
          currency: cur,
        })
        cache.set(cur, f)
      }
      return f
    }
  }, [lang])
  const fmtQty = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { maximumFractionDigits: 4 }),
    [lang],
  )
  const fmtDayShort = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        month: 'short',
        day: 'numeric',
      }),
    [lang],
  )

  useEffect(() => {
    void loadFxRates().then(setFx)
  }, [])

  /* Same whole-row read as the profile page — one select covers the dims
     readout and both plan fields; saves upsert only the column the editor
     owns so a concurrent Settings write can't be clobbered. */
  const loadProfile = useCallback(() => {
    if (!supabase || !session?.user.id) return
    let cancelled = false
    void supabase
      .from('invest_user_profile')
      .select(PLAN_PROFILE_SELECT)
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile((data as PlanProfileRow | null) ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user.id])
  useEffect(() => loadProfile(), [loadProfile])

  const userId = session?.user.id
  /* A holder with no profile row yet still gets a write — upsert creates
     the row server-side, so local state must materialize the same shape or
     the UI keeps saying "Never reviewed" after a successful stamp. */
  const savePlanField = async (field: 'plan_objective' | 'plan_notes', value: string) => {
    if (!supabase || !userId || saveState === 'saving') return
    setSaveState('saving')
    const next = value.trim().slice(0, 2000) || null
    const updatedAt = new Date().toISOString()
    const { error } = await supabase.from('invest_user_profile').upsert(
      field === 'plan_objective'
        ? { user_id: userId, plan_objective: next, updated_at: updatedAt }
        : { user_id: userId, plan_notes: next, updated_at: updatedAt },
    )
    if (error) {
      setSaveErr(error.message)
      setSaveState('error')
      return
    }
    setSaveState('saved')
    setEditing(null)
    setProfile((p) => ({ ...(p ?? EMPTY_PLAN_ROW), [field]: next }))
    showToast(IM.invest_saved)
    window.setTimeout(() => setSaveState('idle'), 1800)
  }

  const markReviewed = async () => {
    if (!supabase || !userId || stamping) return
    setStamping(true)
    setStampErr('')
    const now = new Date().toISOString()
    const { error } = await supabase.from('invest_user_profile').upsert({
      user_id: userId,
      plan_reviewed_at: now,
      updated_at: now,
    })
    setStamping(false)
    if (error) {
      /* Not saveErr — that one renders inside the editor card only, so a
         failed stamp in read mode would be invisible. */
      setStampErr(error.message)
      return
    }
    setProfile((p) => ({ ...(p ?? EMPTY_PLAN_ROW), plan_reviewed_at: now }))
    showToast(IM.invest_plan_reviewed_toast)
  }

  /* ── Book math — same snapshot/fx rule the positions table uses: real
     quotes only, '—' when nothing's on file, converted marks flagged.
     Display amounts stay in the position's own currency (the table's
     convention); only the weight denominator converts to book currency,
     and cash earns a printed line because it silently feeds it. ── */
  const bookCcy = state.accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD'
  const holdingRows = useMemo(
    () =>
      state.positions
        .map((p) => {
          const snap = state.snapshots.find(
            (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
          )
          const pxNative = snap?.price ?? p.lastPrice ?? null
          const pxAt = snap?.asOf ?? p.lastPriceAt
          const pxCur = snap?.currency ?? p.currency
          const px = pxNative === null ? null : convertFx(pxNative, pxCur, p.currency, fx)
          const pxBook = pxNative === null ? null : convertFx(pxNative, pxCur, bookCcy, fx)
          return {
            p,
            px,
            pxAt,
            converted: pxNative !== null && px !== null && pxCur !== p.currency,
            stale: isQuoteStale(pxAt),
            value: px === null ? null : p.quantity * px,
            valueBook: pxBook === null ? null : p.quantity * pxBook,
          }
        })
        /* A document reads by weight — largest holding first, unpriced
           (null) rows sink to the bottom rather than hiding mid-list. */
        .sort((a, b) => (b.valueBook ?? -1) - (a.valueBook ?? -1)),
    [state.positions, state.snapshots, fx, bookCcy],
  )
  const cashAccounts = useMemo(
    () => state.accounts.filter((a) => a.status === 'active' && a.cashBalance !== 0),
    [state.accounts],
  )
  const bookTotal = useMemo(
    () =>
      cashAccounts.reduce(
        (s, a) => s + (convertFx(a.cashBalance, a.baseCurrency, bookCcy, fx) ?? 0),
        0,
      ) + holdingRows.reduce((s, r) => s + (r.valueBook ?? 0), 0),
    [cashAccounts, holdingRows, bookCcy, fx],
  )
  /* The account tag earns its place only once holdings span accounts —
     same rule as the positions table's Account column. */
  const multiAccount = state.accounts.length > 1

  const thesisBySymbol = useMemo(() => {
    const m = new Map<string, InvestThesis>()
    for (const t of state.theses) m.set(`${t.assetClass}:${t.symbol}`, t)
    return m
  }, [state.theses])

  const universe = useMemo(() => trackedUniverse(state.positions, state.watchlist), [state.positions, state.watchlist])
  const openOrders = state.orders.filter((o) => o.status === 'draft' || o.status === 'queued')
  const newSignals = state.signals.filter((s) => s.status === 'new')
  const lastSweep = state.runs.find((r) => r.strategyId === null)
  const accountName = useMemo(() => {
    const m = new Map(state.accounts.map((a) => [a.id, a.name]))
    return m
  }, [state.accounts])

  /* Editable section — read mode renders the prose or the honest empty
     state; edit mode is a textarea over the same card. One editor at a
     time keeps "the document" legible. */
  const editableSection = (
    field: 'plan_objective' | 'plan_notes',
    value: string | null,
    placeholder: Bi,
    emptyCopy: Bi,
  ) =>
    editing === field ? (
      <>
        <textarea
          className="sb-input sb-plan-edit"
          value={draft}
          placeholder={x(placeholder)}
          aria-label={x(field === 'plan_objective' ? IM.invest_plan_s_objective : IM.invest_plan_s_notes)}
          maxLength={2000}
          rows={field === 'plan_objective' ? 3 : 5}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
        />
        {saveErr && <p className="sb-caption sb-plan-err">{saveErr}</p>}
        <div className="sb-row-actions sb-plan-edit-actions">
          <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setEditing(null)}>
            {x(IM.invest_cancel)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            disabled={saveState === 'saving'}
            onClick={() => void savePlanField(field, draft)}
          >
            {saveState === 'saving' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
            {x(IM.invest_save)}
          </button>
        </div>
      </>
    ) : (
      <>
        {value ? (
          <p className="sb-plan-prose">{value}</p>
        ) : (
          <p className="sb-plan-empty">{x(emptyCopy)}</p>
        )}
        <div className="sb-row-actions sb-plan-edit-actions">
          <button
            type="button"
            className="sb-btn sb-btn-ghost sb-plan-editbtn"
            onClick={() => {
              setDraft(value ?? '')
              setSaveErr('')
              setSaveState('idle')
              setEditing(field)
            }}
          >
            <Pencil size={13} aria-hidden="true" />
            {x(IM.invest_edit)}
          </button>
        </div>
      </>
    )

  return (
    /* `.sb` is the palette scope the whole strategy/portal surface gates
       itself behind — every shared rule and every --sb-* token lives
       under it, so the page root must carry it or the document renders
       chromeless (bare buttons, text-only pills, borderless cards). */
    <div className="sb sb-page sb-plan">
      <PageHead title={x(IM.invest_plan_title)} sub={x(IM.invest_plan_sub)}>
        <button
          type="button"
          className="sb-btn sb-btn-ghost sb-noprint"
          onClick={() => window.print()}
        >
          <Printer size={14} aria-hidden="true" />
          {x(IM.invest_plan_print)}
        </button>
        <button
          type="button"
          className="sb-btn sb-btn-primary sb-noprint"
          disabled={stamping}
          onClick={() => void markReviewed()}
        >
          {stamping ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Stamp size={14} aria-hidden="true" />
          )}
          {x(IM.invest_plan_mark_reviewed)}
        </button>
      </PageHead>

      <p className="sb-plan-stamp">
        {profile?.plan_reviewed_at
          ? fill(x(IM.invest_plan_reviewed), {
              date: fmtDay(lang, profile.plan_reviewed_at.slice(0, 10)),
            })
          : x(IM.invest_plan_never)}
      </p>
      {stampErr && (
        <p className="sb-plan-stamp sb-plan-err" role="alert">
          {stampErr}
        </p>
      )}

      {loadError && (
        <p className="sb-plan-stamp sb-plan-err" role="alert">
          {x(IM.invest_error_load)}
        </p>
      )}
      {loading ? (
        <p className="sb-empty">{x(IM.invest_loading)}</p>
      ) : (
      <>
      {/* § Objective — the line every other section answers to. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_objective)}>
        <h2 className="sb-h2">{x(IM.invest_plan_s_objective)}</h2>
        {editableSection(
          'plan_objective',
          profile?.plan_objective ?? null,
          IM.invest_plan_objective_ph,
          IM.invest_plan_objective_empty,
        )}
      </section>

      {/* § The investor — the declared profile Tally weighs, read-only
          here; edits belong on Profile so the mandate keeps one editor. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_investor)}>
        <div className="sb-plan-sect-head">
          <h2 className="sb-h2">{x(IM.invest_plan_s_investor)}</h2>
          <Link to="/invest/profile" className="sb-linklike sb-plan-sect-link">
            {x(IM.invest_plan_edit_profile)}
          </Link>
        </div>
        <p className="sb-caption">{x(IM.invest_plan_investor_sub)}</p>
        <dl className="sb-plan-dims">
          {PROFILE_SELECTS.filter((s) => s.key !== 'style').map((sel) => {
            const stored = profile?.[PROFILE_FIELD[sel.key]] ?? null
            const opt = sel.options.find(([v]) => v === stored)
            return (
              <div className="sb-plan-dim" key={sel.key}>
                <dt>{x(sel.label)}</dt>
                <dd>{opt ? x(opt[1]) : x(IM.invest_opt_not_set)}</dd>
              </div>
            )
          })}
        </dl>
        {PROFILE_TAGS.map(([field, label]) => {
          const tags = profile?.[field] ?? []
          return tags.length > 0 ? (
            <div className="sb-plan-tagrow" key={field}>
              <span className="sb-flabel">{x(label)}</span>
              {tags.map((t) => (
                <span className="sb-pill" key={t}>
                  {t}
                </span>
              ))}
            </div>
          ) : null
        })}
        <div className="sb-plan-mandate">
          <span className="sb-flabel">{x(IM.invest_plan_mandate)}</span>
          {profile?.mandate ? (
            <blockquote className="sb-plan-quote">{profile.mandate}</blockquote>
          ) : (
            <p className="sb-plan-empty">{x(IM.invest_plan_mandate_empty)}</p>
          )}
        </div>
      </section>

      {/* § Goals — SMART targets with the sweep's latest verdict. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_goals)}>
        <div className="sb-plan-sect-head">
          <h2 className="sb-h2">{x(IM.invest_plan_s_goals)}</h2>
          <Link to="/invest/analysis" className="sb-linklike sb-plan-sect-link">
            {x(IM.invest_plan_open_analysis)}
          </Link>
        </div>
        {state.goals.length === 0 ? (
          <p className="sb-plan-empty">{x(IM.invest_plan_goals_empty)}</p>
        ) : (
          <ul className="sb-plan-rows">
            {state.goals.map((g) => {
              const open = g.status === 'on_track' && !g.deadline
              const line = lang === 'fr' ? g.evalDetail?.line_fr : g.evalDetail?.line_en
              /* op earns its glyph — "target ≥ 100%" vs "target ≤ 10%"
                 are different promises. "open-ended" only fills the meta
                 when the sweep hasn't already said it in the eval line. */
              const meta = [
                x(IM[GOAL_METRIC[g.metric]]),
                `${x(IM.invest_plan_goal_target)} ${g.op === 'gte' ? '≥' : '≤'} ${goalTargetLabel(g, bookCcy, lang)}`,
                g.deadline
                  ? fill(x(IM.invest_plan_goal_due), { date: fmtDay(lang, g.deadline) })
                  : line
                    ? null
                    : x(IM.invest_plan_goal_open),
              ]
                .filter(Boolean)
                .join(' · ')
              return (
                <li className="sb-plan-row" key={g.id}>
                  <div className="sb-plan-row-main">
                    <strong>{g.title}</strong>
                    <span className="sb-plan-row-meta">{meta}</span>
                    {line && <span className="sb-plan-row-line">{line}</span>}
                  </div>
                  <span className={`sb-pill ${open ? 'sb-pill-paused' : GOAL_PILL[g.status]}`}>
                    {x(open ? IM.invest_goal_status_open : IM[GOAL_LABEL[g.status]])}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* § Holdings — each position and the thesis behind it. A holding
          without a filed thesis gets a named gap, not silence. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_holdings)}>
        <div className="sb-plan-sect-head">
          <h2 className="sb-h2">{x(IM.invest_plan_s_holdings)}</h2>
          <Link to="/invest/portfolio" className="sb-linklike sb-plan-sect-link">
            {x(IM.invest_plan_open_portfolios)}
          </Link>
        </div>
        {holdingRows.length === 0 ? (
          <p className="sb-plan-empty">{x(IM.invest_plan_holdings_empty)}</p>
        ) : (
          <ul className="sb-plan-rows">
            {holdingRows.map(({ p, px, pxAt, converted, stale, value, valueBook }) => {
              const t = thesisBySymbol.get(`${p.assetClass}:${p.symbol}`)
              const weight = valueBook !== null && bookTotal > 0 ? (valueBook / bookTotal) * 100 : null
              /* pl()'s 2-digit default would print a 0.0042-unit lot as
                 "0 units" — quantity words ride fmtQty's 4-digit rule. */
              const unit =
                lang === 'fr'
                  ? p.quantity <= 1
                    ? IM.invest_plan_unit_one
                    : IM.invest_plan_unit_many
                  : p.quantity === 1
                    ? IM.invest_plan_unit_one
                    : IM.invest_plan_unit_many
              return (
                <li className="sb-plan-row" key={p.id}>
                  <div className="sb-plan-row-main">
                    <strong>
                      {p.symbol}
                      <span className="sb-plan-holding-name">
                        {t?.name || p.name}
                        {multiAccount && accountName.get(p.accountId)
                          ? ` · ${accountName.get(p.accountId)}`
                          : ''}
                      </span>
                    </strong>
                    <span className="sb-plan-row-meta">
                      {fmtQty.format(p.quantity)} {x(unit)}
                      {p.assetClass !== 'equity' && p.assetClass !== 'etf'
                        ? ` · ${x(IM[ASSET_LABEL[p.assetClass]])}`
                        : ''}
                      {px !== null
                        ? ` · ${x(IM.invest_plan_at)} ${converted ? '≈ ' : ''}${fmtFor(p.currency).format(px)}`
                        : ''}
                      {stale && pxAt != null
                        ? ` · ${x(IM.invest_price_asof)} ${fmtDayShort.format(Date.parse(pxAt))}`
                        : ''}
                      {value !== null
                        ? ` · ${converted ? '≈ ' : ''}${fmtFor(p.currency).format(value)}`
                        : ''}
                      {weight !== null ? ` · ${fmtPct(lang, weight, { max: 1 })}` : ''}
                    </span>
                    {t ? (
                      <span className="sb-plan-row-line">
                        {x(IM[INTENT_LABEL[t.intent]])} — {t.thesis}
                      </span>
                    ) : (
                      <span className="sb-plan-row-line sb-plan-gap">
                        {x(IM.invest_plan_no_thesis)}{' '}
                        <Link to="/invest/theses" className="sb-linklike">
                          {x(IM.invest_plan_write_thesis)}
                        </Link>
                      </span>
                    )}
                  </div>
                  {t && (
                    <span className={`sb-pill ${THESIS_PILL[t.status]}`}>
                      {x(IM[THESIS_LABEL[t.status]])}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {(state.watchlist.length > 0 || cashAccounts.length > 0) && (
          <div className="sb-plan-foot">
            {cashAccounts.length > 0 && (
              <p>
                {x(IM.invest_plan_cash)}
                {' — '}
                {cashAccounts
                  .map(
                    (a) =>
                      `${multiAccount ? `${a.name}: ` : ''}${fmtFor(a.baseCurrency).format(a.cashBalance)}`,
                  )
                  .join(' · ')}
              </p>
            )}
            {state.watchlist.length > 0 && (
              <p>
                {x(IM.invest_plan_watchlist)}
                {' — '}
                {state.watchlist.map((w) => w.symbol).join(', ')}
              </p>
            )}
          </div>
        )}
      </section>

      {/* § Standing rules — what the sweep checks, and the standing
          promise that drafts are proposals, never executions. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_rules)}>
        <div className="sb-plan-sect-head">
          <h2 className="sb-h2">{x(IM.invest_plan_s_rules)}</h2>
          <Link to="/invest/strategies" className="sb-linklike sb-plan-sect-link">
            {x(IM.invest_plan_open_strategies)}
          </Link>
        </div>
        <p className="sb-caption">{x(IM.invest_plan_rules_sub)}</p>
        {state.strategies.length === 0 ? (
          <p className="sb-plan-empty">{x(IM.invest_plan_rules_empty)}</p>
        ) : (
          <ul className="sb-plan-rows">
            {state.strategies.map((s) => (
              <li className="sb-plan-row" key={s.id}>
                <div className="sb-plan-row-main">
                  <strong>{s.name || x(IM.invest_sb_untitled)}</strong>
                  <span className="sb-plan-row-meta">
                    {strategyMeta(lang, s, scopeSymbols(s.scope, universe).length)}
                  </span>
                </div>
                <span className={`sb-pill ${s.enabled ? 'sb-pill-ok' : 'sb-pill-paused'}`}>
                  {x(s.enabled ? IM.invest_sb_pill_enabled : IM.invest_sb_pill_paused)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* § Watch board — outside factors tied to the book. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_watch)}>
        <div className="sb-plan-sect-head">
          <h2 className="sb-h2">{x(IM.invest_plan_s_watch)}</h2>
          <Link to="/invest/analysis" className="sb-linklike sb-plan-sect-link">
            {x(IM.invest_plan_open_analysis)}
          </Link>
        </div>
        {state.scanItems.length === 0 ? (
          <p className="sb-plan-empty">{x(IM.invest_plan_watch_empty)}</p>
        ) : (
          <ul className="sb-plan-rows">
            {state.scanItems.map((w) => (
              <li className="sb-plan-row" key={w.id}>
                <div className="sb-plan-row-main">
                  <strong>{w.title}</strong>
                  <span className="sb-plan-row-meta">
                    {w.symbols.length > 0 ? w.symbols.join(', ') : x(IM.invest_plan_watch_book)}
                  </span>
                  {w.note && <span className="sb-plan-row-line">{w.note}</span>}
                </div>
                <span className={`sb-pill ${SCAN_DIR_PILL[w.direction]}`}>
                  {x(IM[SCAN_DIR_LABEL[w.direction]])}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* § Waiting on you — pending drafts and untriaged signals. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_open)}>
        <h2 className="sb-h2">{x(IM.invest_plan_s_open)}</h2>
        {openOrders.length === 0 && newSignals.length === 0 ? (
          <p className="sb-plan-empty">{x(IM.invest_plan_open_empty)}</p>
        ) : (
          <ul className="sb-plan-open">
            {openOrders.length > 0 && (
              <li>
                {pl(lang, openOrders.length, IM.invest_plan_open_order_one, IM.invest_plan_open_order_many)}
                {' — '}
                <Link to="/invest/orders" className="sb-linklike">
                  {x(IM.invest_plan_open_orders_link)}
                </Link>
              </li>
            )}
            {newSignals.length > 0 && (
              <li>
                {pl(lang, newSignals.length, IM.invest_plan_open_signal_one, IM.invest_plan_open_signal_many)}
                {' — '}
                <Link to="/invest/signals" className="sb-linklike">
                  {x(IM.invest_plan_open_signals_link)}
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* § Review — the sweep's cadence and when it last ran. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_review)}>
        <h2 className="sb-h2">{x(IM.invest_plan_s_review)}</h2>
        <p className="sb-plan-prose">{x(IM.invest_plan_review_line)}</p>
        <p className="sb-plan-foot">
          {lastSweep
            ? fill(x(IM.invest_plan_last_sweep), {
                time: relTimeLabel(lastSweep.ranAt, x) ?? '—',
              })
            : x(IM.invest_plan_last_sweep_none)}
        </p>
      </section>

      {/* § Notes — the holder's margin; nothing else reads it. */}
      <section className="sb-card sb-card-pad" aria-label={x(IM.invest_plan_s_notes)}>
        <h2 className="sb-h2">{x(IM.invest_plan_s_notes)}</h2>
        <p className="sb-caption">{x(IM.invest_plan_notes_sub)}</p>
        {editableSection(
          'plan_notes',
          profile?.plan_notes ?? null,
          IM.invest_plan_notes_ph,
          IM.invest_plan_notes_empty,
        )}
      </section>

      {/* The in-page copy isn't a dupe of the shell footer — @media print
          hides the shell chrome, so the document must carry its own
          disclaimer onto paper. */}
      <p className="sb-plan-disclaimer">{x(IM.invest_info_note)}</p>
      </>
      )}
    </div>
  )
}
