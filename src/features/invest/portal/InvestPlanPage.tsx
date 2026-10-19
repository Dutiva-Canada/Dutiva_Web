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
import { relTimeLabel } from './relTime'
import { PageHead } from './PageHead'
import { PROFILE_SELECTS, PROFILE_TAGS, PROFILE_FIELD } from './profileDims'
import {
  fmtDay,
  fmtNum,
  fmtPct,
  fmtCad,
  pl,
  strategyMeta,
  trackedUniverse,
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

/** The plan doc's goal target — same metric rules the Analysis editor
    uses, kept local so the document stays a pure reader. */
function planGoalTarget(g: InvestGoal, ccy: string, lang: 'en' | 'fr'): string {
  if (g.metric === 'book_value') return `${fmtNum(lang, Math.round(g.target))} ${ccy}`
  if (g.metric === 'position_count') return fmtNum(lang, Math.round(g.target))
  return fmtPct(lang, g.target, { max: 1 })
}

export function InvestPlanPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, loading } = useInvestData()
  const { showToast } = useToasts()
  useInvestHead(IM.invest_seo_title_plan, IM.invest_seo_desc_plan)

  const [profile, setProfile] = useState<PlanProfileRow | null>(null)
  const [editing, setEditing] = useState<'plan_objective' | 'plan_notes' | null>(null)
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveErr, setSaveErr] = useState('')
  const [fx, setFx] = useState<FxTable | null>(null)

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
    setProfile((p) => (p ? { ...p, [field]: next } : p))
    window.setTimeout(() => setSaveState('idle'), 1800)
  }

  const markReviewed = async () => {
    if (!supabase || !userId) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('invest_user_profile').upsert({
      user_id: userId,
      plan_reviewed_at: now,
      updated_at: now,
    })
    if (error) {
      setSaveErr(error.message)
      return
    }
    setProfile((p) => (p ? { ...p, plan_reviewed_at: now } : p))
    showToast(IM.invest_plan_reviewed_toast)
  }

  /* ── Book math — same snapshot/fx rule the positions table uses: real
     quotes only, '—' when nothing's on file, converted marks flagged. ── */
  const bookCcy = state.accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD'
  const holdingRows = useMemo(
    () =>
      state.positions.map((p) => {
        const snap = state.snapshots.find(
          (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
        )
        const pxNative = snap?.price ?? p.lastPrice ?? null
        const px = pxNative === null ? null : convertFx(pxNative, snap?.currency ?? p.currency, bookCcy, fx)
        return { p, px, value: px === null ? null : p.quantity * px }
      }),
    [state.positions, state.snapshots, fx, bookCcy],
  )
  const bookTotal = useMemo(() => {
    const cash = state.accounts
      .filter((a) => a.status === 'active')
      .reduce((s, a) => s + (convertFx(a.cashBalance, a.baseCurrency, bookCcy, fx) ?? 0), 0)
    return holdingRows.reduce((s, r) => s + (r.value ?? 0), 0) + cash
  }, [state.accounts, holdingRows, bookCcy, fx])

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
    <div className="sb-page sb-plan">
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
          onClick={() => void markReviewed()}
        >
          <Stamp size={14} aria-hidden="true" />
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
              return (
                <li className="sb-plan-row" key={g.id}>
                  <div className="sb-plan-row-main">
                    <strong>{g.title}</strong>
                    <span className="sb-plan-row-meta">
                      {x(IM[GOAL_METRIC[g.metric]])} · {x(IM.invest_plan_goal_target)}{' '}
                      {planGoalTarget(g, bookCcy, lang)}
                      {' · '}
                      {g.deadline
                        ? fill(x(IM.invest_plan_goal_due), { date: fmtDay(lang, g.deadline) })
                        : x(IM.invest_plan_goal_open)}
                    </span>
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
            {holdingRows.map(({ p, px, value }) => {
              const t = thesisBySymbol.get(`${p.assetClass}:${p.symbol}`)
              const weight = value !== null && bookTotal > 0 ? (value / bookTotal) * 100 : null
              return (
                <li className="sb-plan-row sb-plan-holding" key={p.id}>
                  <div className="sb-plan-row-main">
                    <strong>
                      {p.symbol}
                      <span className="sb-plan-holding-name">
                        {t?.name || p.name}
                        {accountName.get(p.accountId)
                          ? ` · ${accountName.get(p.accountId)}`
                          : ''}
                      </span>
                    </strong>
                    <span className="sb-plan-row-meta">
                      {pl(lang, Math.round(p.quantity * 100) / 100, IM.invest_plan_unit_one, IM.invest_plan_unit_many)}
                      {p.assetClass !== 'equity' && p.assetClass !== 'etf'
                        ? ` · ${x(IM[ASSET_LABEL[p.assetClass]])}`
                        : ''}
                      {px !== null ? ` · ${x(IM.invest_plan_at)} ${fmtCad(lang, px, bookCcy)}` : ''}
                      {value !== null ? ` · ${fmtCad(lang, value, bookCcy)}` : ''}
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
        {state.watchlist.length > 0 && (
          <p className="sb-plan-foot">
            {x(IM.invest_plan_watchlist)}
            {' — '}
            {state.watchlist.map((w) => w.symbol).join(', ')}
          </p>
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
                    {strategyMeta(lang, s, s.scope.watchlist ? universe.length : s.scope.symbols.length)}
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

      <p className="sb-plan-disclaimer">{x(IM.invest_info_note)}</p>
      {loading && <p className="sb-empty">{x(IM.invest_loading)}</p>}
    </div>
  )
}
