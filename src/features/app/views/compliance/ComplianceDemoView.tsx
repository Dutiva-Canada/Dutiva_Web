import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import {
  complianceCategories,
  complianceItems,
  obligationStatusMeta,
  obligations,
  regulatoryWatchlist,
} from '@/data'
import type { ComplianceItem, Obligation, Tone } from '@/data'
import { statusChipClass } from '@/components/chips'
import { useRail } from '@/features/app/rail/railContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { complianceMessages as M } from '@/i18n/messages/compliance'
import { common } from '@/i18n/messages/common'
import { AppPage } from '@/features/app/shell/AppPage'

/** Category bar/score colours (prototype `scoreColor` / `fillStyle`). */
const barFillClasses: Record<Tone, string> = {
  risk: 'bg-risk-dot',
  warning: 'bg-gold-dot',
  success: 'bg-ok-fg',
  info: 'bg-ok-fg',
  suggestion: 'bg-ok-fg',
}

const scoreColorClasses: Record<Tone, string> = {
  risk: 'text-risk-dot',
  warning: 'text-gold-dot',
  success: 'text-ok-fg',
  info: 'text-ok-fg',
  suggestion: 'text-ok-fg',
}

/** Prototype jurisdiction tabs: `['All', 'Ontario', 'Quebec', 'British Columbia', 'Federal']`. */
const JURISDICTIONS: { key: string; label: Bi }[] = [
  { key: 'All', label: M.compliance_jur_all },
  { key: 'Ontario', label: M.compliance_jur_ontario },
  { key: 'Quebec', label: M.compliance_jur_quebec },
  { key: 'British Columbia', label: M.compliance_jur_bc },
  { key: 'Federal', label: M.compliance_jur_federal },
]

const sectionLabelClass = 'text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase'

const flagRowLabelClass = 'w-[96px] shrink-0 text-[11px] font-bold tracking-[0.03em] uppercase'

/**
 * Compliance view — port of the prototype's `buildComplianceView()` markup:
 * jurisdiction filter, stat cards, obligation register (with evidence
 * toggles), posture-by-area score bars, active risk flags and the regulatory
 * watchlist. Rendered inside the shell outlet (no own topbar/surface).
 *
 * Production renders the real findings register (ComplianceProductionView,
 * the backend's public.compliance_findings) instead of the Northgate
 * fixtures below.
 */
/** Northgate fixtures — demo workspace and public `/demo` only. */
export function ComplianceDemoView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { openRail, closeRail } = useRail()
  const { showToast } = useToasts()
  const [jur, setJur] = useState('All')
  /** Prototype `state.obligationEvidence` — ids marked "evidence on file". */
  const [evidence, setEvidence] = useState<Record<string, boolean>>({})

  const matchJur = (p: string) =>
    jur === 'All' || p === jur || p === 'Multi-jurisdiction' || p === 'Multi-province'
  const filteredItems = complianceItems.filter((it) => matchJur(it.province.en))
  const visibleObligations = obligations.filter((o) => matchJur(o.jur))
  /* Counters run over the full register, not the filtered view (prototype). */
  const obligationsOpen = obligations.filter((o) => !evidence[o.id] && o.status !== 'ok').length
  const dueSoon = obligations.filter((o) => o.dueSoon && !evidence[o.id]).length
  const openCount = complianceItems.filter((i) => i.severity !== 'Resolved').length

  const stats: { value: number; label: Bi }[] = [
    { value: obligationsOpen, label: M.compliance_stat_open_obligations },
    { value: dueSoon, label: M.compliance_stat_due_soon },
    { value: openCount, label: M.compliance_stat_open_risk },
    { value: 5, label: M.compliance_stat_provinces },
  ]

  /** Prototype `markEvidence(id)` — flip to "on file" + audit-trail toast. */
  const markEvidence = (id: string) => {
    setEvidence((prev) => ({ ...prev, [id]: true }))
    showToast(M.compliance_toast_evidence, 'ok')
  }

  /** Prototype `explainObligation(o)` — rail briefing on what the obligation covers. */
  const explainObligation = (o: Obligation) => {
    openRail(o.title, {
      text: M.compliance_explain_text,
      cards: [
        {
          tone: 'info',
          title: o.statute,
          body: bi(`${o.area.en} — ${o.evidence.en}`, `${o.area.fr} — ${o.evidence.fr}`),
        },
        {
          tone: 'warning',
          title: M.compliance_not_legal_advice,
          body: common.disclaimer_full,
        },
      ],
    })
  }

  /** Prototype `askAdvisorAboutRisk(item)` — rail detail + "Open full case". */
  const resolveFlag = (item: ComplianceItem) => {
    openRail(item.title, {
      text: M.compliance_flag_rail_text,
      cards: [
        {
          tone: item.tone,
          title: item.title,
          body: item.detail,
          citations: item.citations,
          actions: [
            {
              label: M.compliance_open_full_case,
              primary: true,
              onClick: () => {
                closeRail()
                navigate('/app/advisor', {
                  state: { chatId: item.chatId } satisfies AdvisorSearchNavState,
                })
              },
            },
          ],
        },
      ],
    })
  }

  return (
    <AppPage width="default">
      {/* Jurisdiction filter */}
      <div
        role="tablist"
        aria-label={x(M.compliance_jur_filter_aria)}
        className="mb-[20px] flex w-fit flex-wrap gap-[4px] rounded-[10px] bg-inset p-[4px]"
      >
        {JURISDICTIONS.map((j) => {
          const active = jur === j.key
          return (
            <button
              key={j.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setJur(j.key)}
              className={`cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] text-[12.5px] font-semibold ${
                active
                  ? 'bg-surface text-text shadow-(--shadow-sm)'
                  : 'bg-transparent text-text-muted'
              }`}
            >
              {x(j.label)}
            </button>
          )
        })}
      </div>

      {/* Stat cards */}
      <div className="mb-[24px] flex flex-wrap gap-[14px]">
        {stats.map((stat) => (
          <div
            key={stat.label.en}
            className="min-w-[140px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]"
          >
            <div className="font-display text-[28px] font-bold text-text">{stat.value}</div>
            <div className="mt-[2px] text-[12.5px] text-text-muted">{x(stat.label)}</div>
          </div>
        ))}
      </div>

      {/* Obligation register */}
      <div className="mb-[24px]">
        <div className="mb-[12px] flex flex-wrap items-baseline justify-between gap-[12px]">
          <div className={sectionLabelClass}>{x(M.compliance_register)}</div>
          <div className="text-[11.5px] text-text-faint">{x(M.compliance_oriented_note)}</div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[4px]">
          {visibleObligations.map((o) => {
            const recorded = evidence[o.id] === true
            const status = recorded ? 'ok' : o.status
            const meta = obligationStatusMeta[status]
            return (
              <div key={o.id} className="border-b border-inset py-[14px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] leading-[1.45] font-semibold text-text">
                      {x(o.title)}
                    </div>
                    <div className="mt-[3px] text-[12px] text-text-muted">
                      {x(o.area)} · {x(o.statute)} · {x(o.jurLabel)}
                    </div>
                  </div>
                  <span className={statusChipClass(meta.tone)}>{x(meta.label)}</span>
                </div>
                <div className="mt-[8px] flex flex-wrap gap-[14px] text-[12px] text-text-3">
                  <span>
                    <span className="font-bold text-text-muted">{x(M.compliance_owner)} · </span>
                    {o.owner}
                  </span>
                  <span>
                    <span className="font-bold text-text-muted">{x(M.compliance_due)} · </span>
                    {x(o.due)}
                  </span>
                  <span>
                    <span className="font-bold text-text-muted">
                      {x(M.compliance_recurrence)} ·{' '}
                    </span>
                    {x(o.recurrence)}
                  </span>
                </div>
                <div className="mt-[6px] text-[12.5px] leading-normal text-text-3">
                  {recorded ? x(M.compliance_evidence_recorded) : x(o.evidence)}
                </div>
                <div className="mt-[9px] flex flex-wrap gap-[8px]">
                  {status !== 'ok' && (
                    <button
                      type="button"
                      onClick={() => markEvidence(o.id)}
                      className="cursor-pointer rounded-[8px] border border-gold-border bg-gold-bg px-[12px] py-[6px] text-[12px] font-bold text-gold-fg"
                    >
                      {x(M.compliance_mark_evidence)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => explainObligation(o)}
                    className="cursor-pointer rounded-[8px] border-none bg-accent-soft px-[12px] py-[6px] text-[12px] font-semibold text-accent"
                  >
                    {x(M.compliance_explain_advisor)}
                  </button>
                </div>
              </div>
            )
          })}
          <div className="flex items-start gap-[7px] py-[12px] text-[11px] leading-normal text-text-faint">
            <Shield size={12} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />
            <span>{x(M.compliance_audit_note)}</span>
          </div>
        </div>
      </div>

      {/* Posture by area */}
      <div className="mb-[24px] rounded-[12px] border border-border bg-surface p-[18px]">
        <div className={`mb-[14px] ${sectionLabelClass}`}>{x(M.compliance_posture)}</div>
        <div className="flex flex-col gap-[14px]">
          {complianceCategories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-[14px]">
              <div className="w-[190px] shrink-0 text-[13px] font-semibold text-text-2">
                {x(cat.label)}
              </div>
              <div className="h-[6px] flex-1 overflow-hidden rounded-[100px] bg-inset">
                <ProgressFill
                  pct={cat.score}
                  className={`h-full w-full rounded-[100px] ${barFillClasses[cat.tone].replace('bg-', 'text-')}`}
                />
              </div>
              <div
                className={`w-[70px] shrink-0 text-right text-[13px] font-bold ${scoreColorClasses[cat.tone]}`}
              >
                {cat.score}
                <span className="text-[11px] font-normal text-text-faint">/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active risk flags */}
      <div className={`mb-[12px] ${sectionLabelClass}`}>{x(M.compliance_flags)}</div>
      <div className="flex flex-col gap-[12px]">
        {filteredItems.map((it) => (
          <div
            key={it.id}
            className="flex flex-col gap-[10px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]"
          >
            <div className="flex flex-wrap items-center justify-between gap-[12px]">
              <div className="flex min-w-0 items-center gap-[10px]">
                <span className={statusChipClass(it.tone)}>{x(it.severityLabel)}</span>
                <span className="text-[14px] font-semibold text-text">{x(it.title)}</span>
              </div>
              <span className="shrink-0 text-[12px] text-text-faint">{x(it.province)}</span>
            </div>
            <div className="text-[13px] leading-[1.55] text-text-3">{x(it.detail)}</div>
            <div className="flex flex-col gap-[7px] rounded-[9px] bg-inset px-[14px] py-[12px]">
              <div className="flex gap-[8px]">
                <span className={`${flagRowLabelClass} text-text-muted`}>
                  {x(M.compliance_jurisdiction)}
                </span>
                <span className="text-[12.5px] text-text-2">{x(it.province)}</span>
              </div>
              {it.citations.length > 0 && (
                <div className="flex gap-[8px]">
                  <span className={`${flagRowLabelClass} text-text-muted`}>
                    {x(M.compliance_legislation)}
                  </span>
                  <span className="text-[12.5px] text-text-2">
                    {it.citations.map((c) => x(c.label)).join(' · ')}
                  </span>
                </div>
              )}
              <div className="flex gap-[8px]">
                <span className={`${flagRowLabelClass} text-gold-dot`}>
                  {x(M.compliance_next_action)}
                </span>
                <span className="text-[12.5px] text-text-2">{x(it.action)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => resolveFlag(it)}
              className="mt-[2px] cursor-pointer self-start rounded-[8px] border-none bg-accent-soft px-[13px] py-[7px] text-[12.5px] font-bold text-accent"
            >
              {x(M.compliance_resolve_advisor)}
            </button>
          </div>
        ))}
      </div>

      {/* Regulatory watchlist */}
      <div className="mt-[24px]">
        <div className={`mb-[12px] ${sectionLabelClass}`}>{x(M.compliance_watchlist)}</div>
        <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[4px]">
          {regulatoryWatchlist.map((w) => (
            <div
              key={w.title.en}
              className="flex flex-wrap items-start justify-between gap-[12px] border-b border-inset py-[13px]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] leading-[1.45] font-semibold text-text">
                  {x(w.title)}
                </div>
                <div className="mt-[3px] text-[12.5px] text-text-3">{x(w.note)}</div>
              </div>
              <span className={statusChipClass(w.tone)}>{x(w.status)}</span>
            </div>
          ))}
        </div>
      </div>
    </AppPage>
  )
}
