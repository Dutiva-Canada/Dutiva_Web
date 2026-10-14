/**
 * /invest/profile — the "knows you" surface (0222). Three layers, all
 * holder-controlled:
 *
 *   Declared — the Settings profile rendered as the readout Tally sees
 *              (dimension pills + an Edit-in-Settings link), plus the
 *              free-text mandate she weighs heaviest in drafts.
 *   Remembered — confirmed memories (ProfileMemories): added by hand, or
 *              proposed by the review-memories pass and accepted here.
 *   Observed — an honest readout of how the holder answers suggestions
 *              and signals — patterns, stated as patterns.
 *
 * Nothing here grants access or advice — the server-side email tier is
 * untouched; this page only calibrates depth, weighting and wording.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2, UserRound } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { supabase } from '@/lib/supabaseClient'
import { useInvestData } from '../data/InvestDataContext'
import { saveMemory } from '../data/api'
import {
  loadPendingSuggestions,
  loadResolvedSuggestions,
  resolveSuggestion,
  type AgentSuggestion,
} from '@/lib/agentQueue'
import { useInvestHead } from './useInvestHead'
import { PROFILE_SELECTS, PROFILE_TAGS } from './profileDims'
import { ProfileMemories } from './ProfileMemories'
import { fmtPct } from './strategyUi'
import { MEMORY_KINDS, type MemoryKind } from '../data/types'
import './strategies.css'

interface ProfileRow {
  risk_tolerance: string | null
  horizon: string | null
  goal: string | null
  experience: string | null
  answer_style: string | null
  sectors: string[] | null
  exclusions: string[] | null
  mandate: string | null
}
const EMPTY_ROW: ProfileRow = {
  risk_tolerance: null,
  horizon: null,
  goal: null,
  experience: null,
  answer_style: null,
  sectors: null,
  exclusions: null,
  mandate: null,
}
const PROFILE_FIELD: Record<string, keyof ProfileRow> = {
  risk: 'risk_tolerance',
  horizon: 'horizon',
  goal: 'goal',
  experience: 'experience',
  style: 'answer_style',
}

/** Suggestion-kind labels for the observed readout — kinds that resolve
    past the profile page too, so the map covers the whole surface. */
const SUGGESTION_KIND_LABEL: Record<string, Bi> = {
  strategy: IM.invest_sugg_kind_strategy,
  rule_add: IM.invest_sugg_kind_rule_add,
  rule_tune: IM.invest_sugg_kind_rule_tune,
  scope_add: IM.invest_sugg_kind_scope_add,
  thesis: IM.invest_sugg_kind_thesis,
  goal: IM.invest_sugg_kind_goal,
  scan: IM.invest_sugg_kind_scan,
  swot: IM.invest_sugg_kind_swot,
  memory: IM.invest_sugg_kind_memory,
  profile: IM.invest_sugg_kind_profile,
}

export function InvestProfilePage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, loading, refresh } = useInvestData()
  const { showToast } = useToasts()
  useInvestHead(IM.invest_seo_title_profile, IM.invest_seo_desc_profile)

  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [mandate, setMandate] = useState('')
  const [mandateSave, setMandateSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [mandateErr, setMandateErr] = useState('')
  const [pending, setPending] = useState<AgentSuggestion[]>([])
  const [pendingBusy, setPendingBusy] = useState<string | null>(null)
  const [resolved, setResolved] = useState<AgentSuggestion[]>([])

  /* The whole row loads once — dims for the readout, mandate for the
     editor; saves upsert all of it so blanks stay blank rather than
     resurrecting a stale column. */
  useEffect(() => {
    if (!supabase || !session?.user.id) return
    let cancelled = false
    void supabase
      .from('invest_user_profile')
      .select('risk_tolerance, horizon, goal, experience, answer_style, sectors, exclusions, mandate')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (cancelled) return
          const row = (data as ProfileRow | null) ?? EMPTY_ROW
          setProfile(row)
          setMandate(row.mandate ?? '')
        },
        /* A failed read degrades to the empty row — dims read "Not set" and
           the mandate editor still works, rather than spinning forever. */
        () => {
          if (!cancelled) setProfile(EMPTY_ROW)
        },
      )
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  const loadPending = useCallback(() => {
    loadPendingSuggestions('invest')
      .then((rows) =>
        setPending(rows.filter((r) => r.kind === 'memory' || r.kind === 'profile')),
      )
      .catch(() => {})
  }, [])
  useEffect(loadPending, [loadPending])

  /* Ninety days of outcomes — same window the server-side pass learns on,
     so the readout says what the suggestion engine actually sees. */
  useEffect(() => {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    loadResolvedSuggestions('invest', since)
      .then(setResolved)
      .catch(() => {})
  }, [])

  const saveMandate = async () => {
    if (!supabase || !session?.user.id || mandateSave === 'saving') return
    setMandateSave('saving')
    /* Upsert only the column this editor owns — a full-row write would
       resurrect the mount-time snapshot over a concurrent Settings edit
       (PostgREST updates only the provided columns on conflict). */
    /* slice(0, 800) mirrors the textarea's maxLength — maxLength is a UI
       hint only, the write still needs the ceiling. */
    const next = mandate.trim().slice(0, 800) || null
    const { error } = await supabase.from('invest_user_profile').upsert({
      user_id: session.user.id,
      mandate: next,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      setMandateErr(error.message)
      setMandateSave('error')
      return
    }
    setMandateSave('saved')
    setProfile({ ...(profile ?? EMPTY_ROW), mandate: next })
  }

  /* 'memory' accepts write the real row (source 'tally'); 'profile' nudges
     accept by opening the section — scroll + resolve 'opened', nothing to
     save. */
  const acceptPending = useCallback(
    async (s: AgentSuggestion) => {
      if (pendingBusy) return
      setPendingBusy(s.id)
      const p = (s.payload ?? {}) as Record<string, unknown>
      try {
        if (s.kind === 'memory') {
          const text = typeof p.text === 'string' ? p.text : s.title
          const kind = MEMORY_KINDS.includes(p.kind as MemoryKind)
            ? (p.kind as MemoryKind)
            : 'fact'
          /* If the insert already landed but the resolve failed, a retry
             must not write a twin — same normalized compare as the
             review pass. */
          const key = text.trim().toLowerCase().replace(/\s+/g, ' ')
          if (!state.memories.some((m) => m.text.trim().toLowerCase().replace(/\s+/g, ' ') === key)) {
            await saveMemory({
              kind,
              text,
              symbol: typeof p.symbol === 'string' ? p.symbol : null,
              source: 'tally',
            })
          }
          await resolveSuggestion(s.id, 'accepted', 'added')
          await refresh()
        } else {
          const section = typeof p.section === 'string' ? p.section : 'declared'
          document.getElementById(`prof-${section}`)?.scrollIntoView?.({ behavior: 'smooth' })
          await resolveSuggestion(s.id, 'accepted', 'opened')
        }
        setPending((cur) => cur.filter((r) => r.id !== s.id))
      } catch (e) {
        showToast(
          fill(x(IM.invest_mem_failed), { error: e instanceof Error ? e.message : String(e) }),
        )
        loadPending()
      } finally {
        setPendingBusy(null)
      }
    },
    [pendingBusy, refresh, showToast, x, loadPending, state.memories],
  )

  const dismissPending = useCallback(async (s: AgentSuggestion) => {
    setPending((cur) => cur.filter((r) => r.id !== s.id))
    await resolveSuggestion(s.id, 'dismissed', 'dismissed').catch(() => {})
  }, [])

  /* The observed lines — each one is a pattern derived from outcome data,
     never a label pinned on the holder. Lines only appear with evidence. */
  const observedLines = useMemo(() => {
    const lines: string[] = []
    const accepted = resolved.filter((r) => r.status === 'accepted').length
    const total = resolved.length
    if (total >= 3) {
      lines.push(
        fill(x(IM.invest_obs_accept_rate), {
          rate: fmtPct(lang, (accepted / total) * 100, 0),
          accepted: String(accepted),
          total: String(total),
        }),
      )
    }
    /* Whole-kind cooling — same threshold the suggestion pass applies,
       so the line names a behavior that actually happened. */
    const byKind = new Map<string, { a: number; d: number }>()
    for (const r of resolved) {
      const k = byKind.get(r.kind) ?? { a: 0, d: 0 }
      if (r.status === 'accepted') k.a += 1
      else k.d += 1
      byKind.set(r.kind, k)
    }
    for (const [kind, stat] of byKind) {
      if (stat.d >= 3 && stat.d / (stat.a + stat.d) >= 0.8) {
        const label = SUGGESTION_KIND_LABEL[kind]
        if (!label) continue
        lines.push(fill(x(IM.invest_obs_kind_dismiss), { kind: x(label) }))
      }
    }
    /* Same 60-day window the suggestion pass learns on — the copy says
       "~2 months", so the count must be one. */
    const signalCutoff = Date.now() - 60 * 24 * 60 * 60 * 1000
    const dismissedSignals = state.signals.filter(
      (s) => s.status === 'dismissed' && Date.parse(s.createdAt) >= signalCutoff,
    ).length
    if (dismissedSignals > 0) {
      lines.push(
        fill(
          x(
            dismissedSignals === 1
              ? IM.invest_obs_signals_dismissed_one
              : IM.invest_obs_signals_dismissed_many,
          ),
          { n: String(dismissedSignals) },
        ),
      )
    }
    if (state.memories.length > 0) {
      lines.push(
        fill(
          x(
            state.memories.length === 1
              ? IM.invest_obs_memories_one
              : IM.invest_obs_memories_many,
          ),
          { n: String(state.memories.length) },
        ),
      )
    }
    return lines
  }, [resolved, state.signals, state.memories, x, lang])

  /* Same gate as every sibling tab — the provider mounts children on
     EMPTY_INVEST_STATE, so without it the page flashes "No memories yet"
     and the accept twin-check would run against an empty shelf. */
  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="sb sb-col">
      <div className="sb-list">
        <h1>{x(IM.invest_prof_title)}</h1>
        <p className="sub">{x(IM.invest_prof_sub)}</p>

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
                    : null) ?? null
              return (
                <div
                  key={s.id}
                  className="sb-notify-row"
                  style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {s.kind === 'memory' && (
                      <span className="sb-notify-hint">{x(IM.invest_mem_suggest_label)}</span>
                    )}
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
                      {pendingBusy === s.id && (
                        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      )}
                      {s.kind === 'memory'
                        ? x(IM.invest_mem_suggest_accept)
                        : x(IM.invest_prof_open)}
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

        {/* ── Declared ─────────────────────────────────────────────── */}
        <section className="sb-section" id="prof-declared" aria-labelledby="prof-declared-h">
          <div className="sb-section-head">
            <div>
              <h2 id="prof-declared-h">{x(IM.invest_prof_declared)}</h2>
              <p className="sub">{x(IM.invest_prof_declared_sub)}</p>
            </div>
            <div className="sb-row-actions">
              <Link to="/invest/settings" className="sb-btn sb-btn-secondary sb-btn-sm">
                {x(IM.invest_prof_edit_settings)}
              </Link>
            </div>
          </div>
          <div className="sb-card">
            <div className="sb-card-pad">
              {profile === null ? (
                <div className="flex items-center justify-center py-[28px]">
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
                </div>
              ) : (
              <div className="sb-prof-dims">
                {PROFILE_SELECTS.map((sel) => {
                  const field = PROFILE_FIELD[sel.key]
                  const raw = field ? profile?.[field] : undefined
                  const label = sel.options.find(([v]) => v === raw)?.[1]
                  return (
                    <span key={sel.key} className="sb-prof-dim">
                      <span className="sb-notify-hint">{x(sel.label)}</span>
                      <span className={`sb-pill${label ? '' : ' sb-pill-paused'}`}>
                        {label ? x(label) : x(IM.invest_prof_unset)}
                      </span>
                    </span>
                  )
                })}
                {PROFILE_TAGS.map(([key, label]) => {
                  const tags = profile?.[key] ?? []
                  return (
                    <span key={key} className="sb-prof-dim">
                      <span className="sb-notify-hint">{x(label)}</span>
                      {tags.length > 0 ? (
                        <span className="sb-pills">
                          {tags.map((t) => (
                            <span key={t} className="sb-pill">
                              {t}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="sb-pill sb-pill-paused">{x(IM.invest_prof_unset)}</span>
                      )}
                    </span>
                  )
                })}
              </div>
              )}
            </div>
          </div>

          <div className="sb-card" id="prof-mandate" style={{ marginTop: 14 }}>
            <div className="sb-card-pad">
              <h3 className="sb-flabel" style={{ marginTop: 0 }}>
                <UserRound size={15} strokeWidth={1.9} aria-hidden="true" />{' '}
                {x(IM.invest_prof_mandate)}
              </h3>
              <p className="sb-notify-hint" style={{ margin: '4px 0 10px' }}>
                {x(IM.invest_prof_mandate_sub)}
              </p>
              <textarea
                className="sb-input sb-mandate"
                value={mandate}
                maxLength={800}
                rows={3}
                disabled={profile === null}
                onChange={(e) => {
                  setMandate(e.target.value)
                  setMandateSave('idle')
                }}
                placeholder={x(IM.invest_prof_mandate_ph)}
                aria-label={x(IM.invest_prof_mandate)}
              />
              <div className="sb-row-actions" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="sb-btn sb-btn-primary sb-btn-sm"
                  /* The write trims — compare normalized so a trailing
                     space doesn't leave a live Save button after it lands. */
                  disabled={
                    profile === null ||
                    mandateSave === 'saving' ||
                    mandate.trim() === (profile?.mandate ?? '')
                  }
                  onClick={() => void saveMandate()}
                >
                  {mandateSave === 'saving' ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                  )}
                  {x(IM.invest_save)}
                </button>
                {mandateSave === 'saved' && (
                  <span className="sb-notify-hint">{x(IM.invest_prof_mandate_saved)}</span>
                )}
                {mandateSave === 'error' && (
                  <span className="sb-notify-hint">
                    {fill(x(IM.invest_prof_mandate_failed), { error: mandateErr })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Remembered ───────────────────────────────────────────── */}
        <div id="prof-memories">
          <ProfileMemories onFiled={loadPending} />
        </div>

        {/* ── Observed ─────────────────────────────────────────────── */}
        <section className="sb-section" id="prof-observed" aria-labelledby="prof-observed-h">
          <div className="sb-section-head">
            <div>
              <h2 id="prof-observed-h">{x(IM.invest_prof_observed)}</h2>
              <p className="sub">{x(IM.invest_prof_observed_sub)}</p>
            </div>
          </div>
          <div className="sb-card">
            <div className="sb-card-pad">
              {observedLines.length === 0 ? (
                <p className="sb-notify-hint" style={{ margin: 0 }}>
                  {x(IM.invest_obs_empty)}
                </p>
              ) : (
                <div className="sb-mini-list">
                  {observedLines.map((line, i) => (
                    <p key={i} className="sb-obs-line">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
