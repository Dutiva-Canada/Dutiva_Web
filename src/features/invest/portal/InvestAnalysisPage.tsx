/**
 * /invest/analysis — Tally's analytical layer for the book.
 *
 * Three frameworks that earn their place here rather than imitate a
 * research terminal:
 *   Goals  — SMART objectives measured on real book metrics (value, cash
 *            share, concentration, thesis coverage, breadth, average
 *            gain). The sweep re-measures every run; the page renders
 *            the verdict it stamped — progress, days left, status line.
 *   Watch  — the environmental-scan board (AnalysisScan): theme-level
 *            factors the sweep connects to a degrading thesis.
 *   SWOT   — the qualitative quadrant beside each thesis (AnalysisSwot).
 *
 * Everything Tally authors — goals, scan items, quadrants — flows
 * through agent_suggestions and lands on the pending strip; nothing
 * reaches a row without the user saving it.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import { deleteGoal, saveGoal, saveScanItem, saveSwot } from '../data/api'
import { loadPendingSuggestions, resolveSuggestion, type AgentSuggestion } from '@/lib/agentQueue'
import type {
  GoalMetric,
  GoalOp,
  InvestGoal,
  ScanDirection,
  ScanTheme,
} from '../data/types'
import { GOAL_METRICS } from '../data/types'
import { relTimeLabel } from './relTime'
import { useInvestHead } from './useInvestHead'
import { AnalysisScan } from './AnalysisScan'
import { AnalysisSwot } from './AnalysisSwot'
import './strategies.css'

const GOAL_STATUS_PILL: Record<InvestGoal['status'], string> = {
  on_track: 'sb-pill-ok',
  behind: 'sb-pill-warn',
  achieved: 'sb-pill-ok',
  missed: 'sb-pill-fail',
}
const GOAL_STATUS_LABEL: Record<InvestGoal['status'], keyof typeof IM> = {
  on_track: 'invest_goal_status_on_track',
  behind: 'invest_goal_status_behind',
  achieved: 'invest_goal_status_achieved',
  missed: 'invest_goal_status_missed',
}
const GOAL_METRIC_LABEL: Record<GoalMetric, keyof typeof IM> = {
  book_value: 'invest_goal_metric_book_value',
  cash_pct: 'invest_goal_metric_cash_pct',
  max_weight_pct: 'invest_goal_metric_max_weight_pct',
  unrealized_gain_pct: 'invest_goal_metric_unrealized_gain_pct',
  thesis_coverage: 'invest_goal_metric_thesis_coverage',
  position_count: 'invest_goal_metric_position_count',
}

interface GoalDraftState {
  id: string | null
  title: string
  detail: string
  metric: GoalMetric
  op: GoalOp
  target: string
  deadline: string
}
const emptyGoal = (): GoalDraftState => ({
  id: null,
  title: '',
  detail: '',
  metric: 'book_value',
  op: 'gte',
  target: '',
  deadline: '',
})

/** Current value for a metric formatted for the card — % metrics render
    percents, book_value renders book currency, counts render bare. */
function goalCurrentLabel(g: InvestGoal, ccy: string): string | null {
  const cur = g.evalDetail?.current
  if (cur === null || cur === undefined || !Number.isFinite(cur)) return null
  if (g.metric === 'book_value') return `${Math.round(cur).toLocaleString('en-CA')} ${ccy}`
  if (g.metric === 'position_count') return `${Math.round(cur)}`
  return `${Math.round(cur * 10) / 10}%`
}

function goalTargetLabel(g: InvestGoal, ccy: string): string {
  if (g.metric === 'book_value') return `${Math.round(g.target).toLocaleString('en-CA')} ${ccy}`
  if (g.metric === 'position_count') return `${Math.round(g.target)}`
  return `${Math.round(g.target * 10) / 10}%`
}

export function InvestAnalysisPage() {
  const { x, lang } = useI18n()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()

  useInvestHead(IM.invest_seo_title_analysis, IM.invest_seo_desc_analysis)

  const [pending, setPending] = useState<AgentSuggestion[]>([])
  const [pendingBusy, setPendingBusy] = useState<string | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [goal, setGoal] = useState<GoalDraftState>(emptyGoal)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const bookCurrency = useMemo(
    () =>
      (state.accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD').toUpperCase(),
    [state.accounts],
  )

  const loadPending = useCallback(() => {
    loadPendingSuggestions('invest')
      .then((rows) =>
        setPending(rows.filter((r) => r.kind === 'goal' || r.kind === 'scan' || r.kind === 'swot')),
      )
      .catch(() => {})
  }, [])
  useEffect(loadPending, [loadPending])

  const dismissPending = useCallback(async (s: AgentSuggestion) => {
    setPending((cur) => cur.filter((r) => r.id !== s.id))
    await resolveSuggestion(s.id, 'dismissed', 'dismissed').catch(() => {})
  }, [])

  /* Each kind accepts into its own row type — the queue row resolves the
     moment the save lands. */
  const acceptPending = useCallback(
    async (s: AgentSuggestion) => {
      if (pendingBusy) return
      setPendingBusy(s.id)
      const p = (s.payload ?? {}) as Record<string, unknown>
      try {
        if (s.kind === 'goal') {
          const seed = (p.seed ?? {}) as Record<string, unknown>
          await saveGoal({
            title: typeof seed.title === 'string' ? seed.title : s.title,
            detail: typeof seed.detail === 'string' ? seed.detail : '',
            metric: (typeof seed.metric === 'string' ? seed.metric : 'book_value') as GoalMetric,
            op: seed.op === 'lte' ? 'lte' : 'gte',
            target: Number(seed.target) || 0,
            deadline: typeof seed.deadline === 'string' ? seed.deadline : null,
          })
        } else if (s.kind === 'scan') {
          await saveScanItem({
            theme: (typeof p.theme === 'string' ? p.theme : 'sector') as ScanTheme,
            direction: (typeof p.direction === 'string'
              ? p.direction
              : 'monitor') as ScanDirection,
            title: typeof p.title === 'string' && p.title ? p.title : s.title,
            note: typeof p.note === 'string' ? p.note : '',
            symbols: Array.isArray(p.symbols)
              ? (p.symbols as unknown[]).filter((v): v is string => typeof v === 'string')
              : [],
          })
        } else if (s.kind === 'swot') {
          const assetClass = typeof p.asset_class === 'string' ? p.asset_class : ''
          const symbol = typeof p.symbol === 'string' ? p.symbol.toUpperCase() : ''
          const thesis = state.theses.find(
            (t) => t.assetClass === assetClass && t.symbol.toUpperCase() === symbol,
          )
          const swot = (p.swot ?? null) as Record<string, unknown> | null
          if (!thesis || !swot) return
          const list = (v: unknown): string[] =>
            Array.isArray(v) ? v.filter((i): i is string => typeof i === 'string') : []
          await saveSwot(thesis.id, {
            strengths: list(swot['strengths']),
            weaknesses: list(swot['weaknesses']),
            opportunities: list(swot['opportunities']),
            threats: list(swot['threats']),
          })
        }
        void resolveSuggestion(s.id, 'accepted', 'added').catch(() => {})
        setPending((cur) => cur.filter((r) => r.id !== s.id))
        await refresh()
      } catch (e) {
        showToast(
          fill(x(IM.invest_goal_failed), { error: e instanceof Error ? e.message : String(e) }),
        )
        loadPending()
      } finally {
        setPendingBusy(null)
      }
    },
    [pendingBusy, state.theses, refresh, showToast, x, loadPending],
  )

  const saveGoalDraft = useCallback(async () => {
    if (busy || !goal.title.trim() || !goal.target.trim()) return
    setBusy('goal')
    try {
      await saveGoal({
        ...(goal.id ? { id: goal.id } : {}),
        title: goal.title,
        detail: goal.detail,
        metric: goal.metric,
        op: goal.op,
        target: Number(goal.target) || 0,
        deadline: goal.deadline || null,
      })
      showToast(IM.invest_goal_saved)
      setGoal(emptyGoal())
      setGoalOpen(false)
      await refresh()
    } catch (e) {
      showToast(
        fill(x(IM.invest_goal_failed), { error: e instanceof Error ? e.message : String(e) }),
      )
    } finally {
      setBusy(null)
    }
  }, [busy, goal, refresh, showToast, x])

  const removeGoal = useCallback(
    async (g: InvestGoal) => {
      if (busy) return
      setBusy(g.id)
      try {
        await deleteGoal(g.id)
        showToast(IM.invest_goal_deleted)
        await refresh()
      } finally {
        setBusy(null)
        setConfirmDelete(null)
      }
    },
    [busy, refresh, showToast],
  )

  return (
    <div className="sb sb-col">
      <div className="sb-list">
        <h1>{x(IM.invest_analysis_title)}</h1>
        <p className="sub">{x(IM.invest_analysis_sub)}</p>

        {pending.length > 0 && (
          <div className="sb-mini-list" style={{ marginBottom: 16 }}>
            <p className="sb-caption" style={{ marginTop: 0 }}>
              {x(IM.invest_analysis_pending)}
            </p>
            {pending.map((s) => {
              const p = (s.payload ?? {}) as Record<string, unknown>
              const title =
                lang === 'fr' && typeof p.title_fr === 'string' ? p.title_fr : s.title
              const detail =
                (lang === 'fr' && typeof p.detail_fr === 'string'
                  ? p.detail_fr
                  : typeof p.detail_en === 'string'
                    ? p.detail_en
                    : null) ??
                (typeof p.note === 'string' ? p.note : null)
              return (
                <div
                  key={s.id}
                  className="sb-notify-row"
                  style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong>{title}</strong>
                    {detail && <span className="sb-notify-hint">{detail}</span>}
                  </span>
                  <span className="sb-row-actions" style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      disabled={pendingBusy !== null}
                      onClick={() => void acceptPending(s)}
                    >
                      {s.kind === 'goal'
                        ? x(IM.invest_goal_suggest_accept)
                        : s.kind === 'scan'
                          ? x(IM.invest_scan_suggest_accept)
                          : x(IM.invest_swot_suggest_apply)}
                    </button>
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      disabled={pendingBusy !== null}
                      onClick={() => void dismissPending(s)}
                    >
                      {x(IM.invest_dismiss)}
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Goals ─────────────────────────────────────────────────── */}
        <section className="sb-section" aria-label={x(IM.invest_analysis_goals)}>
          <div className="sb-section-head">
            <div>
              <h2>{x(IM.invest_analysis_goals)}</h2>
              <p className="sub">{x(IM.invest_analysis_goals_sub)}</p>
            </div>
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              onClick={() => {
                setGoal(emptyGoal())
                setGoalOpen((o) => !o)
              }}
            >
              <Plus size={15} aria-hidden="true" />
              {x(IM.invest_goal_new)}
            </button>
          </div>

          {goalOpen && (
            <div className="sb-card" style={{ marginBottom: 14 }}>
              <div className="sb-card-pad">
                <div className="sb-field">
                  <label className="sb-flabel" htmlFor="an-goal-title">
                    {x(IM.invest_goal_new)}
                  </label>
                  <input
                    className="sb-input"
                    id="an-goal-title"
                    value={goal.title}
                    maxLength={100}
                    placeholder={x(IM.invest_goal_title_ph)}
                    onChange={(e) => setGoal((cur) => ({ ...cur, title: e.target.value }))}
                  />
                </div>
                <div className="sb-field">
                  <label className="sb-flabel" htmlFor="an-goal-detail">
                    {x(IM.invest_goal_detail_ph)}
                  </label>
                  <input
                    className="sb-input"
                    id="an-goal-detail"
                    value={goal.detail}
                    maxLength={200}
                    onChange={(e) => setGoal((cur) => ({ ...cur, detail: e.target.value }))}
                  />
                </div>
                <div className="sb-goal-compose">
                  <div className="sb-field">
                    <label className="sb-flabel" htmlFor="an-goal-metric">
                      {x(IM.invest_goal_metric)}
                    </label>
                    <select
                      className="sb-input"
                      id="an-goal-metric"
                      value={goal.metric}
                      onChange={(e) =>
                        setGoal((cur) => ({ ...cur, metric: e.target.value as GoalMetric }))
                      }
                    >
                      {GOAL_METRICS.map((m) => (
                        <option key={m} value={m}>
                          {x(IM[GOAL_METRIC_LABEL[m]])}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sb-field">
                    <label className="sb-flabel" htmlFor="an-goal-op">
                      {x(IM.invest_goal_op_gte)} / {x(IM.invest_goal_op_lte)}
                    </label>
                    <select
                      className="sb-input"
                      id="an-goal-op"
                      value={goal.op}
                      onChange={(e) =>
                        setGoal((cur) => ({ ...cur, op: e.target.value as GoalOp }))
                      }
                    >
                      <option value="gte">{x(IM.invest_goal_op_gte)}</option>
                      <option value="lte">{x(IM.invest_goal_op_lte)}</option>
                    </select>
                  </div>
                  <div className="sb-field">
                    <label className="sb-flabel" htmlFor="an-goal-target">
                      {x(IM.invest_goal_target)}
                    </label>
                    <input
                      className="sb-input"
                      id="an-goal-target"
                      type="number"
                      value={goal.target}
                      onChange={(e) => setGoal((cur) => ({ ...cur, target: e.target.value }))}
                    />
                  </div>
                  <div className="sb-field">
                    <label className="sb-flabel" htmlFor="an-goal-deadline">
                      {x(IM.invest_goal_deadline)}
                    </label>
                    <input
                      className="sb-input"
                      id="an-goal-deadline"
                      type="date"
                      value={goal.deadline}
                      onChange={(e) => setGoal((cur) => ({ ...cur, deadline: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="sb-row-actions" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="sb-btn sb-btn-primary sb-btn-sm"
                    disabled={!goal.title.trim() || !goal.target.trim() || busy !== null}
                    onClick={() => void saveGoalDraft()}
                  >
                    {busy === 'goal' ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Check size={14} aria-hidden="true" />
                    )}
                    {x(IM.invest_goal_save)}
                  </button>
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    onClick={() => setGoalOpen(false)}
                  >
                    {x(IM.invest_thesis_cancel)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.goals.length === 0 ? (
            <div className="sb-empty">{x(IM.invest_goal_empty)}</div>
          ) : (
            <div className="sb-goal-grid">
              {state.goals.map((g) => {
                const current = goalCurrentLabel(g, bookCurrency)
                const target = goalTargetLabel(g, bookCurrency)
                const line = lang === 'fr' ? g.evalDetail?.line_fr : g.evalDetail?.line_en
                const pct = g.evalDetail?.progress_pct
                const when = g.lastEvaluatedAt ? relTimeLabel(g.lastEvaluatedAt, x) : null
                return (
                  <article key={g.id} className="sb-goal">
                    <header className="sb-goal-head">
                      <strong>{g.title}</strong>
                      <span className={`sb-pill ${GOAL_STATUS_PILL[g.status]}`}>
                        {x(IM[GOAL_STATUS_LABEL[g.status]])}
                      </span>
                    </header>
                    {g.detail && <p className="sb-goal-detail">{g.detail}</p>}
                    <div className="sb-goal-metric">
                      <span>{x(IM[GOAL_METRIC_LABEL[g.metric]])}</span>
                      <span>
                        {current !== null
                          ? fill(x(IM.invest_goal_current), { value: current })
                          : x(IM.invest_goal_never)}
                        {' · '}
                        {x(IM.invest_goal_target)} {target}
                      </span>
                    </div>
                    {pct !== null && pct !== undefined && (
                      <div
                        className="sb-goalbar"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span className="sb-goalbar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {line && <p className="sb-goal-line">{line}</p>}
                    <footer className="sb-thesis-foot">
                      <span className="sb-thesis-when">
                        {g.deadline
                          ? `${x(IM.invest_goal_deadline)} ${g.deadline}`
                          : x(IM.invest_goal_deadline_none)}
                        {when ? ` · ${fill(x(IM.invest_goal_evaluated), { when })}` : ''}
                      </span>
                      <span className="sb-row-actions">
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => {
                            setGoal({
                              id: g.id,
                              title: g.title,
                              detail: g.detail,
                              metric: g.metric,
                              op: g.op,
                              target: String(g.target),
                              deadline: g.deadline ?? '',
                            })
                            setGoalOpen(true)
                            window.scrollTo({ top: 0 })
                          }}
                        >
                          {x(IM.invest_goal_edit)}
                        </button>
                        <button
                          type="button"
                          className={`sb-btn sb-btn-danger sb-btn-sm${confirmDelete === g.id ? ' sb-armed' : ''}`}
                          disabled={busy !== null}
                          onClick={() => {
                            if (confirmDelete === g.id) void removeGoal(g)
                            else setConfirmDelete(g.id)
                          }}
                        >
                          {confirmDelete === g.id
                            ? x(IM.invest_thesis_delete_confirm)
                            : x(IM.invest_goal_delete)}
                        </button>
                      </span>
                    </footer>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <AnalysisScan />
        <AnalysisSwot theses={state.theses} />
      </div>
    </div>
  )
}
