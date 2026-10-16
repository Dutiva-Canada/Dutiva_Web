import { useLocation } from 'react-router-dom'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useWorkspaceContext } from '@/features/app/workspaceContext/workspaceContextStore'
import { workspaceSegments } from '@/features/app/workspaceRoot/workspaceRootContext'

/**
 * "Advisor mode" module banner — prototype `moduleContext` (markup 328–333,
 * specialties at logic 4954–4961): on views with an Advisor specialty, a
 * strip under the topbar states which specialist mode the Advisor is in.
 * Hidden on case detail (prototype gates on `!activeCaseId`).
 */
const SPECIALTIES: Record<string, { specialty: Bi; note: Bi }> = {
  compensation: { specialty: M.shell_mod_compensation, note: M.shell_mod_compensation_note },
  compliance: { specialty: M.shell_mod_compliance, note: M.shell_mod_compliance_note },
  wellbeing: { specialty: M.shell_mod_wellbeing, note: M.shell_mod_wellbeing_note },
  communications: { specialty: M.shell_mod_communications, note: M.shell_mod_communications_note },
  templates: { specialty: M.shell_mod_templates, note: M.shell_mod_templates_note },
  cases: { specialty: M.shell_mod_cases, note: M.shell_mod_cases_note },
}

export function ModuleContextBanner() {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const { context } = useWorkspaceContext()

  const parts = workspaceSegments(pathname)
  const segment = parts[0] ?? ''
  /* Prototype: module banner only without a pinned workspace context and
     without an active case (list, not detail). */
  const detail = Boolean(parts[1])
  const mod = context || detail ? undefined : SPECIALTIES[segment]
  if (!mod) return null

  return (
    <div className="flex shrink-0 items-center gap-[10px] border-b border-border bg-inset px-[22px] py-[9px]">
      <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-navy">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            className="fill-gold-on-navy"
          />
        </svg>
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-[8px]">
        <span className="text-[11px] font-bold tracking-wider text-gold-dot uppercase">
          {x(M.shell_advisor_mode)}
        </span>
        <span className="text-[13px] font-bold text-text">{x(mod.specialty)}</span>
        <span className="text-[12.5px] text-text-muted">{x(mod.note)}</span>
      </div>
    </div>
  )
}
