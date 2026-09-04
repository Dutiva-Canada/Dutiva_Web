import {
  CircleSlash,
  Globe,
  Heart,
  Lock,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkle,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { advisorWorkspaceMessages as M } from '@/i18n/messages/advisorWorkspace'
import { memoryMessages as MEM } from '@/i18n/messages/memory'
import { memoryPathForFact } from '@/features/app/views/memory/memoryRoutes'
import { AuthSignInForm } from '@/features/app/auth/AuthSignInForm'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { PROVINCE_CHIPS } from './advisorScenarios'
import { allowedSurfaces } from '@/features/app/advisor/contract'
import type {
  AdvisorResponse,
  ComplianceRisk,
  JurisdictionStatus,
  ProfessionalReviewType,
  ResponseMode,
  SafetyRisk,
  WebAuthority,
} from '@/features/app/advisor/contract'

/**
 * Compliance Workspace — the 384px right panel of the Advisor chat
 * (`Advisor Response Experience.dc.html`). Renders the engine's structured
 * payload; every block is gated on the matching `route.*Allowed` (handoff
 * rule 3: never render workspace / legal basis / retrieval / documents / web
 * results when the gate is false — a withheld block shows its reason instead).
 *
 * Four states: locked (signed out — preview mode), running (routing
 * skeleton), ready (populated payload), idle (thread with no engine turn).
 * On viewports ≥ lg the panel is on-demand (same as the mobile sheet):
 * hidden until opened, auto-shown while routing or when a payload lands.
 */

export type WorkspaceState =
  | { kind: 'locked' }
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ready'; response: AdvisorResponse; provincePrompt?: boolean }

export interface ComplianceWorkspaceProps {
  readonly state: WorkspaceState
  /** Province chips inside the jurisdiction card (jurisdiction-unknown turns). */
  readonly onPickProvince?: (province: Bi) => void
  /** Web-search toggle (current-info turns — present whenever webSearch ≠ null). */
  readonly onToggleWeb?: () => void
  /** Idle-state starters: send a prompt into the composer / thread. */
  readonly onIdleSend?: (text: string) => void
  /** Idle-state starters: navigate into the product (People, Studio). */
  readonly onIdleNavigate?: (to: string) => void
  /**
   * When true (Advisor home / empty thread), idle shows Getting-started
   * prompts. When false (active thread with messages but no structured
   * payload yet), idle stays a quiet empty state — no starter cards.
   */
  readonly showIdleStarters?: boolean
  /** When true, the workspace panel/sheet is visible. */
  readonly open: boolean
  readonly onClose: () => void
}

/* ------------------------------------------------------------- tone maps */

const MODE_CHIP: Record<ResponseMode, { chip: string; label: Bi; surface: Bi }> = {
  hr: {
    chip: 'border-gold-border bg-gold-bg text-gold-fg',
    label: M.advws_mode_hr,
    surface: M.advws_surface_hybrid,
  },
  escalation: {
    chip: 'border-risk-border bg-risk-bg text-risk-fg',
    label: M.advws_mode_escalation,
    surface: M.advws_surface_hybrid,
  },
  supportive: {
    chip: 'border-support-border bg-support-bg text-support-fg',
    label: M.advws_mode_supportive,
    surface: M.advws_surface_chat_only,
  },
}

const JUR_BADGE: Record<JurisdictionStatus, { chip: string; label: Bi }> = {
  known: { chip: 'border-ok-border bg-ok-bg text-ok-fg', label: M.advws_jur_known },
  assumed: { chip: 'border-gold-border bg-gold-bg text-gold-fg', label: M.advws_jur_assumed },
  unknown: { chip: 'border-warn-border bg-warn-bg text-warn-fg', label: M.advws_jur_unknown },
  conflict: { chip: 'border-risk-border bg-risk-bg text-risk-fg', label: M.advws_jur_conflict },
  not_applicable: { chip: 'border-border bg-inset text-text-muted', label: M.advws_jur_na },
}

interface MeterSpec {
  pct: number
  text: string
  bar: string
  label: Bi
}

const COMP_METER: Record<ComplianceRisk, MeterSpec> = {
  low: { pct: 26, text: 'text-ok-fg', bar: 'bg-ok-fg', label: M.advws_risk_low },
  medium: { pct: 56, text: 'text-warn-fg', bar: 'bg-warn-fg', label: M.advws_risk_medium },
  high: { pct: 82, text: 'text-risk-dot', bar: 'bg-risk-dot', label: M.advws_risk_high },
  critical: { pct: 100, text: 'text-risk-fg', bar: 'bg-risk-fg', label: M.advws_risk_critical },
}

const SAFE_METER: Record<SafetyRisk, MeterSpec> = {
  none: { pct: 10, text: 'text-ok-fg', bar: 'bg-ok-fg', label: M.advws_safe_none },
  watch: { pct: 42, text: 'text-warn-fg', bar: 'bg-warn-fg', label: M.advws_safe_watch },
  urgent: { pct: 76, text: 'text-risk-dot', bar: 'bg-risk-dot', label: M.advws_safe_urgent },
  critical: { pct: 100, text: 'text-risk-fg', bar: 'bg-risk-fg', label: M.advws_safe_critical },
}

const REVIEW_TONE: Record<ProfessionalReviewType, { card: string; fg: string; icon: LucideIcon }> =
  {
    legal: { card: 'border-risk-border bg-risk-bg', fg: 'text-risk-fg', icon: Scale },
    medical: { card: 'border-gold-border bg-gold-bg', fg: 'text-gold-fg', icon: Heart },
    hr: { card: 'border-ok-border bg-ok-bg', fg: 'text-ok-fg', icon: ShieldCheck },
    union: { card: 'border-gold-border bg-gold-bg', fg: 'text-gold-fg', icon: Users },
    emergency: { card: 'border-risk-border bg-risk-bg', fg: 'text-risk-fg', icon: TriangleAlert },
  }

const AUTHORITY_BADGE: Record<WebAuthority, { chip: string; label: Bi }> = {
  legislation: { chip: 'bg-ok-bg text-ok-fg', label: M.advws_auth_legislation },
  official: { chip: 'bg-ok-bg text-ok-fg', label: M.advws_auth_official },
  regulator: { chip: 'bg-gold-bg text-gold-fg', label: M.advws_auth_regulator },
  court: { chip: 'bg-gold-bg text-gold-fg', label: M.advws_auth_court },
  secondary: { chip: 'bg-warn-bg text-warn-fg', label: M.advws_auth_secondary },
  general: { chip: 'bg-inset text-text-muted', label: M.advws_auth_general },
}

/* -------------------------------------------------------------- component */

export function ComplianceWorkspace({
  state,
  onPickProvince,
  onToggleWeb,
  onIdleSend,
  onIdleNavigate,
  showIdleStarters = true,
  open,
  onClose,
}: ComplianceWorkspaceProps) {
  const { x } = useI18n()
  const { isPublicDemo } = useWorkspaceRoot()

  /* Public demo: banner already explains read-only — skip the 384px sign-in panel. */
  if (isPublicDemo && state.kind === 'locked') return null

  const aside = (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-2 border-b border-border-soft bg-surface-2 px-[18px] pt-[15px] pb-[13px]">
        <div className="flex items-center gap-[8px]">
          <ShieldCheck size={16} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
          <div className="font-display text-[14px] font-semibold text-text">{x(M.advws_title)}</div>
          {open && (
            <button
              type="button"
              onClick={onClose}
              aria-label={x(M.advws_close_workspace)}
              className="ml-auto flex cursor-pointer items-center rounded-[8px] border-none bg-inset p-[5px] text-text-2"
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="mt-[3px] text-[11px] text-text-faint">{x(M.advws_subtitle)}</div>
      </div>

      {state.kind === 'locked' && <LockedState />}
      {state.kind === 'running' && <RunningState />}
      {state.kind === 'idle' && (
        <IdleState
          onSend={onIdleSend}
          onNavigate={onIdleNavigate}
          showStarters={showIdleStarters}
        />
      )}
      {state.kind === 'ready' && (
        <ReadyState
          response={state.response}
          provincePrompt={state.provincePrompt === true}
          onPickProvince={onPickProvince}
          onToggleWeb={onToggleWeb}
        />
      )}
    </>
  )

  return (
    <>
      {open && (
        <aside
          aria-label={x(M.advws_title)}
          className="fixed inset-0 z-80 overflow-y-auto bg-surface-2 lg:static lg:inset-auto lg:z-auto lg:w-[384px] lg:shrink-0 lg:border-l lg:border-border"
        >
          {aside}
        </aside>
      )}
    </>
  )
}

/* ----------------------------------------------------------------- states */

function LockedState() {
  const { x } = useI18n()
  return (
    <div className="p-[18px]">
      <div className="rounded-[14px] border border-dashed border-border bg-surface px-[18px] py-[22px] text-center">
        <div className="mx-auto mb-[12px] flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-inset text-text-3">
          <Lock size={18} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <div className="mb-[5px] text-[14px] font-bold text-text">{x(M.advws_locked_title)}</div>
        <div className="text-[12.5px] leading-[1.55] text-text-muted">{x(M.advws_locked_body)}</div>
        <div className="mt-[14px] text-left">
          <AuthSignInForm idPrefix="workspace" />
        </div>
      </div>
      <div className="mt-[14px] opacity-50" aria-hidden="true">
        <div className="skel mb-[10px] h-[64px] rounded-[12px]" />
        <div className="skel mb-[10px] h-[88px] rounded-[12px]" />
        <div className="skel h-[72px] rounded-[12px]" />
      </div>
    </div>
  )
}

function RunningState() {
  const { x } = useI18n()
  const pulseDelay = ['pulse-dot-delay-0', 'pulse-dot-delay-1', 'pulse-dot-delay-2'] as const
  return (
    <div className="p-[18px]">
      <div className="mb-[14px] flex items-center gap-[8px] text-[12px] text-text-muted">
        <span className="flex gap-[3px]" aria-hidden="true">
          {pulseDelay.map((delayClass) => (
            <span
              key={delayClass}
              className={`h-[5px] w-[5px] rounded-full bg-gold-dot motion-safe:animate-[pulseDot_1.1s_ease-in-out_infinite] ${delayClass}`}
            />
          ))}
        </span>
        {x(M.advws_running)}
      </div>
      <div className="skel mb-[10px] h-[58px] rounded-[12px]" aria-hidden="true" />
      <div className="skel mb-[10px] h-[92px] rounded-[12px]" aria-hidden="true" />
      <div className="skel h-[76px] rounded-[12px]" aria-hidden="true" />
    </div>
  )
}

function IdleState({
  onSend,
  onNavigate,
  showStarters,
}: {
  readonly onSend?: (text: string) => void
  readonly onNavigate?: (to: string) => void
  readonly showStarters: boolean
}) {
  const { x } = useI18n()
  const starters = [
    {
      key: 'people',
      title: M.advws_idle_prompt_people,
      hint: M.advws_idle_prompt_people_hint,
      onClick: () => onNavigate?.('/app/employees?new=1'),
    },
    {
      key: 'notice',
      title: M.advws_idle_prompt_notice,
      hint: M.advws_idle_prompt_notice_hint,
      onClick: () => onSend?.(x(M.advws_idle_send_notice)),
    },
    {
      key: 'accommodate',
      title: M.advws_idle_prompt_accommodate,
      hint: M.advws_idle_prompt_accommodate_hint,
      onClick: () => onSend?.(x(M.advws_idle_send_accommodate)),
    },
  ]

  return (
    <div className="p-[18px]">
      <div className="rounded-[14px] border border-dashed border-border bg-surface px-[18px] py-[22px] text-center">
        <div className="mx-auto mb-[12px] flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-navy">
          <Sparkle size={18} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
        </div>
        <div className="mb-[5px] text-[14px] font-bold text-text">{x(M.advws_idle_title)}</div>
        <div className="text-[12.5px] leading-[1.55] text-text-muted">
          {x(showStarters ? M.advws_idle_body : M.advws_idle_thread_body)}
        </div>
      </div>
      {showStarters && (onSend || onNavigate) && (
        <div className="mt-[12px] flex flex-col gap-[8px]">
          {starters.map((starter) => (
            <button
              key={starter.key}
              type="button"
              onClick={starter.onClick}
              className="cursor-pointer rounded-[10px] border border-border bg-surface px-[12px] py-[10px] text-left hover:border-(--accent-soft-border)"
            >
              <div className="text-[12.5px] font-semibold text-text">{x(starter.title)}</div>
              <div className="mt-[2px] text-[11.5px] text-text-muted">{x(starter.hint)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------- populated payload */

interface ReadyStateProps {
  readonly response: AdvisorResponse
  readonly provincePrompt: boolean
  readonly onPickProvince?: (province: Bi) => void
  readonly onToggleWeb?: () => void
}

function ReadyState({ response, provincePrompt, onPickProvince, onToggleWeb }: ReadyStateProps) {
  const { x, lang } = useI18n()
  const gates = allowedSurfaces(response)
  const mode = MODE_CHIP[response.route.responseMode]
  const jur = JUR_BADGE[response.jurisdiction.status]
  const comp = COMP_METER[response.risk.compliance]
  const safe = SAFE_METER[response.risk.safety]
  const review = response.professionalReview
  const reviewTone = review ? REVIEW_TONE[review.type] : null
  const ReviewIcon = reviewTone?.icon ?? ShieldCheck
  const webOn = gates.webSearch

  const gatePills = [
    { label: M.advws_gate_workspace, on: gates.workspace },
    { label: M.advws_gate_retrieval, on: gates.retrieval },
    { label: M.advws_gate_legal, on: gates.legalBasis },
    { label: M.advws_gate_docs, on: gates.documents },
    { label: M.advws_gate_web, on: gates.webSearch },
  ]

  return (
    <div className="flex flex-col gap-[14px] px-[18px] pt-[16px] pb-[26px] motion-safe:animate-[slideInRight_.32s_cubic-bezier(.22,1,.36,1)]">
      {/* Response mode */}
      <div>
        <SectionEyebrow>{x(M.advws_sec_mode)}</SectionEyebrow>
        <div className="flex flex-wrap items-center gap-[8px]">
          <span
            className={`inline-flex items-center gap-[6px] rounded-[100px] border px-[11px] py-[5px] text-[12px] font-bold ${mode.chip}`}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-current" aria-hidden="true" />
            {x(mode.label)}
          </span>
          <span className="text-[11.5px] text-text-faint">{x(mode.surface)}</span>
        </div>
      </div>

      {/* Jurisdiction */}
      <Card>
        <div className="mb-[6px] flex items-center justify-between gap-[8px]">
          <div className="flex items-center gap-[7px]">
            <MapPin size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
            <span className="text-[12.5px] font-bold text-text">{x(M.advws_sec_jurisdiction)}</span>
          </div>
          <span
            className={`rounded-[100px] border px-[9px] py-[2px] text-[11px] font-bold ${jur.chip}`}
          >
            {x(jur.label)}
          </span>
        </div>
        <div className="text-[13px] font-semibold text-text">
          {pickL(response.jurisdiction.value, lang)}
        </div>
        {response.jurisdiction.note !== undefined && (
          <div className="mt-[5px] text-[11.5px] leading-normal text-text-3">
            {pickL(response.jurisdiction.note, lang)}
          </div>
        )}
        {provincePrompt && onPickProvince && (
          <div className="mt-[10px] flex flex-wrap gap-[7px]">
            {PROVINCE_CHIPS.map((p) => (
              <button
                key={p.en}
                type="button"
                onClick={() => onPickProvince(p)}
                className="cursor-pointer rounded-[8px] border border-border bg-surface-2 px-[11px] py-[6px] font-sans text-[12px] font-semibold text-text-2"
              >
                {pickL(p, lang)}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Risk read */}
      <Card>
        <div className="mb-[10px] text-[12.5px] font-bold text-text">{x(M.advws_sec_risk)}</div>
        <div className="flex flex-col gap-[11px]">
          <RiskMeter label={x(M.advws_risk_compliance)} meter={comp} levelLabel={x(comp.label)} />
          <RiskMeter label={x(M.advws_risk_safety)} meter={safe} levelLabel={x(safe.label)} />
        </div>
      </Card>

      {/* Professional review */}
      {review && reviewTone && (
        <div className={`rounded-[12px] border px-[14px] py-[13px] ${reviewTone.card}`}>
          <div className="flex items-start gap-[9px]">
            <ReviewIcon
              size={15}
              strokeWidth={1.7}
              className={`mt-px shrink-0 ${reviewTone.fg}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className={`text-[12.5px] font-bold ${reviewTone.fg}`}>
                {pickL(review.label, lang)}
              </div>
              <div className="mt-[3px] text-[11.5px] leading-normal text-text-3">
                {pickL(review.reason, lang)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support-mode notice (all gates off) */}
      {response.supportNotice && (
        <div className="rounded-[12px] border border-support-border bg-support-bg px-[14px] py-[13px]">
          <div className="mb-[6px] flex items-center gap-[8px]">
            <Heart size={14} strokeWidth={1.7} className="text-support-fg" aria-hidden="true" />
            <span className="text-[12.5px] font-bold text-support-fg">
              {x(M.advws_support_title)}
            </span>
          </div>
          <div className="text-[11.5px] leading-[1.55] text-support-text">
            {x(M.advws_support_body)}
          </div>
        </div>
      )}

      {/* Legal basis */}
      <Card>
        <div className="mb-[9px] flex items-center justify-between">
          <span className="text-[12.5px] font-bold text-text">{x(M.advws_sec_legal)}</span>
          <Scale size={14} strokeWidth={1.7} className="text-text-faint" aria-hidden="true" />
        </div>
        {gates.legalBasis ? (
          <div className="flex flex-col gap-[7px]">
            {response.legalBasis.items.map((item) => (
              <div
                key={keyOfL(item.label)}
                className="flex items-center justify-between gap-[8px] rounded-[8px] bg-surface-2 px-[10px] py-[8px]"
              >
                <span className="text-[12px] text-text">{pickL(item.label, lang)}</span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-[100px] border px-[8px] py-[2px] text-[10px] font-bold ${
                    item.valid
                      ? 'border-ok-border bg-ok-bg text-ok-fg'
                      : 'border-warn-border bg-warn-bg text-warn-fg'
                  }`}
                >
                  {x(item.valid ? M.advws_cite_valid : M.advws_cite_review)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <WithheldNote
            reason={
              response.legalBasis.withheldReason !== undefined
                ? pickL(response.legalBasis.withheldReason, lang)
                : ''
            }
          />
        )}
      </Card>

      {/* Retrieved guidance */}
      <Card>
        <div className="mb-[9px] text-[12.5px] font-bold text-text">{x(M.advws_sec_retrieval)}</div>
        {gates.retrieval ? (
          <>
            <div className="flex flex-wrap gap-[6px]">
              {response.retrieval.items.map((item) => (
                <span
                  key={keyOfL(item)}
                  className="rounded-[5px] bg-inset px-[8px] py-[3px] text-[10.5px] font-bold tracking-[0.02em] text-text-muted uppercase"
                >
                  {pickL(item, lang)}
                </span>
              ))}
            </div>
            {response.retrieval.note !== undefined && (
              <div className="mt-[8px] text-[11px] leading-normal text-text-faint">
                {pickL(response.retrieval.note, lang)}
              </div>
            )}
          </>
        ) : (
          <WithheldNote
            reason={
              response.retrieval.withheldReason !== undefined
                ? pickL(response.retrieval.withheldReason, lang)
                : ''
            }
          />
        )}
      </Card>

      {/* Organization memory used this turn */}
      {response.memory != null && response.memory.items.length > 0 && (
        <Card>
          <div className="mb-[9px] flex items-center justify-between gap-[8px]">
            <div className="text-[12.5px] font-bold text-text">{x(M.advws_sec_memory)}</div>
            <Link
              to="/app/settings/memory"
              className="shrink-0 text-[11.5px] font-semibold text-accent no-underline hover:underline"
            >
              {x(MEM.memory_manage_from_answer)}
            </Link>
          </div>
          <ul className="m-0 list-none space-y-[7px] p-0">
            {response.memory.items.map((item) => (
              <li key={item.factId ?? keyOfL(item.label)}>
                <Link
                  to={memoryPathForFact({
                    scope: item.scope,
                    entityId: item.entityId,
                    factId: item.factId,
                  })}
                  className="block rounded-[8px] border border-gold-border bg-gold-bg px-[10px] py-[8px] text-[12px] leading-normal text-text-2 no-underline hover:border-gold-dot"
                >
                  {pickL(item.label, lang)}
                </Link>
              </li>
            ))}
          </ul>
          {response.memory.note !== undefined && (
            <div className="mt-[8px] text-[11px] leading-normal text-text-faint">
              {pickL(response.memory.note, lang)}
            </div>
          )}
        </Card>
      )}

      {/* Live web sources */}
      {response.webSearch !== null && (
        <Card>
          <div className="mb-[9px] flex items-center justify-between">
            <div className="flex items-center gap-[7px]">
              <Globe size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
              <span className="text-[12.5px] font-bold text-text">{x(M.advws_sec_web)}</span>
            </div>
            {onToggleWeb && (
              <button
                type="button"
                onClick={onToggleWeb}
                aria-pressed={webOn}
                className={`cursor-pointer rounded-[100px] border px-[9px] py-[2px] font-sans text-[10.5px] font-bold ${
                  webOn
                    ? 'border-ok-border bg-ok-bg text-ok-fg'
                    : 'border-risk-border bg-risk-bg text-risk-fg'
                }`}
              >
                {x(webOn ? M.advws_web_on : M.advws_web_off)}
              </button>
            )}
          </div>
          {gates.webSearch ? (
            <>
              <div className="flex flex-col gap-[7px]">
                {response.webSearch.sources.map((source) => {
                  const badge = AUTHORITY_BADGE[source.authority]
                  return (
                    <div
                      key={source.domain + keyOfL(source.title)}
                      className="rounded-[9px] border border-inset px-[10px] py-[9px]"
                    >
                      <div className="mb-[3px] flex items-center justify-between gap-[8px]">
                        <span className="font-mono text-[11px] text-gold-fg">{source.domain}</span>
                        <span
                          className={`shrink-0 rounded-[5px] px-[7px] py-px text-[9.5px] font-bold tracking-[0.02em] uppercase ${badge.chip}`}
                        >
                          {x(badge.label)}
                        </span>
                      </div>
                      <div className="text-[12px] leading-[1.4] text-text">
                        {pickL(source.title, lang)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-[8px] text-[11px] leading-normal text-text-faint">
                {x(M.advws_web_note)}
              </div>
            </>
          ) : (
            <WithheldNote
              reason={
                response.webSearch.unavailableReason !== undefined
                  ? pickL(response.webSearch.unavailableReason, lang)
                  : ''
              }
            />
          )}
        </Card>
      )}

      {/* Confidence */}
      {response.confidence !== null && (
        <Card>
          <div className="mb-[7px] flex justify-between text-[12px]">
            <span className="font-bold text-text">{x(M.advws_sec_confidence)}</span>
            <span className={`font-bold ${comp.text}`}>
              {pickL(response.confidence.label, lang)}
            </span>
          </div>
          <div className="h-[6px] overflow-hidden rounded-[100px] bg-inset">
            <ProgressFill
              pct={response.confidence.pct}
              className={`h-full w-full rounded-[100px] ${comp.bar.replace('bg-', 'text-')}`}
            />
          </div>
          {response.confidence.note !== undefined && (
            <div className="mt-[7px] text-[11px] leading-normal text-text-faint">
              {pickL(response.confidence.note, lang)}
            </div>
          )}
        </Card>
      )}

      {/* Quality warnings */}
      {response.warnings.length > 0 && (
        <div className="rounded-[12px] border border-warn-border bg-warn-bg px-[13px] py-[12px]">
          <div className="mb-[7px] flex items-center gap-[7px]">
            <TriangleAlert
              size={13}
              strokeWidth={1.7}
              className="text-warn-fg"
              aria-hidden="true"
            />
            <span className="text-[12px] font-bold text-warn-fg">{x(M.advws_sec_warnings)}</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            {response.warnings.map((warning) => (
              <div key={keyOfL(warning)} className="text-[11.5px] leading-normal text-warn-fg">
                — {pickL(warning, lang)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route rendering gates */}
      <div>
        <SectionEyebrow>{x(M.advws_sec_gates)}</SectionEyebrow>
        <div className="flex flex-wrap gap-[6px]">
          {gatePills.map((gate) => (
            <span
              key={gate.label.en}
              className={`inline-flex items-center gap-[5px] rounded-[100px] border px-[9px] py-[3px] text-[10.5px] font-bold ${
                gate.on
                  ? 'border-ok-border bg-ok-bg text-ok-fg'
                  : 'border-border bg-inset text-text-faint'
              }`}
            >
              <span
                className={`h-[6px] w-[6px] rounded-full ${gate.on ? 'bg-ok-fg' : 'bg-ink'}`}
                aria-hidden="true"
              />
              {x(gate.label)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- primitives */

function Card({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-border-soft bg-surface px-[14px] py-[13px]">
      {children}
    </div>
  )
}

/** Gated-off block body: the slash icon + operator-facing withheld reason. */
function WithheldNote({ reason }: { readonly reason: string }) {
  return (
    <div className="flex items-start gap-[8px] rounded-[8px] bg-inset px-[11px] py-[9px]">
      <CircleSlash
        size={13}
        strokeWidth={1.7}
        className="mt-px shrink-0 text-text-faint"
        aria-hidden="true"
      />
      <span className="text-[11.5px] leading-normal text-text-3">{reason}</span>
    </div>
  )
}

function SectionEyebrow({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="mb-[7px] text-[10.5px] font-bold tracking-[0.07em] text-text-faint uppercase">
      {children}
    </div>
  )
}

function RiskMeter({
  label,
  meter,
  levelLabel,
}: {
  readonly label: string
  readonly meter: MeterSpec
  readonly levelLabel: string
}) {
  return (
    <div>
      <div className="mb-[5px] flex justify-between text-[11.5px]">
        <span className="text-text-muted">{label}</span>
        <span className={`font-bold ${meter.text}`}>{levelLabel}</span>
      </div>
      <div className="h-[7px] overflow-hidden rounded-[100px] bg-inset">
        <ProgressFill
          pct={meter.pct}
          className={`h-full w-full rounded-[100px] ${meter.bar.replace('bg-', 'text-')}`}
        />
      </div>
    </div>
  )
}
