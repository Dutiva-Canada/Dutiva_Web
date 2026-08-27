import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useWorkspaceContext } from '@/features/app/workspaceContext/workspaceContextStore'
import type { WorkspaceEntityType } from '@/features/app/workspaceContext/workspaceContextStore'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'

const ENTITY_LABELS: Record<WorkspaceEntityType, Bi> = {
  employee: M.shell_ctx_employee,
  document: M.shell_ctx_document,
  compliance: M.shell_ctx_compliance,
  compensation: M.shell_ctx_compensation,
  wellbeing: M.shell_ctx_wellbeing,
  case: M.shell_ctx_case,
}

/**
 * "Advisor is using · …" workspace-context banner — prototype `contextBanner`
 * (markup 309–326): gold strip pinned under the topbar while an entity record
 * is the Advisor's working context. Meta chips are individually removable;
 * "Open record" jumps to the employee profile; × clears the context.
 * Chips + Open record are desktop/tablet-only, per the prototype's frame gate.
 */
export function WorkspaceContextBanner() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { root } = useWorkspaceRoot()
  const { context, clearContext, removeContextMeta } = useWorkspaceContext()

  if (!context) return null

  return (
    <div className="flex shrink-0 items-center gap-[12px] border-b border-gold-border bg-gold-bg px-[22px] py-[10px]">
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-navy text-[11.5px] font-bold text-gold-on-navy">
        {context.initials}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-[8px]">
        <span className="text-[11px] font-bold tracking-wider text-gold-dot uppercase">
          {x(M.shell_ctx_using)}
          {x(ENTITY_LABELS[context.entityType])}
        </span>
        <span className="text-[13.5px] font-bold text-text">{context.subject}</span>
        <span className="hidden flex-wrap items-center gap-[6px] md:inline-flex">
          {context.meta.map((m, i) => (
            <span
              key={typeof m === 'string' ? m : m.en}
              className="inline-flex items-center gap-[4px] rounded-[100px] border border-gold-border bg-surface py-[2px] pr-[4px] pl-[9px] text-[11.5px] font-semibold text-gold-fg"
            >
              {typeof m === 'string' ? m : x(m)}
              <button
                type="button"
                onClick={() => removeContextMeta(i)}
                aria-label={x(M.shell_ctx_remove_aria)}
                className="flex cursor-pointer border-none bg-transparent p-[2px] text-gold-fg"
              >
                <X size={10} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </span>
          ))}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-[6px]">
        {context.empId !== undefined && (
          <button
            type="button"
            onClick={() => navigate(workspacePath(root, `employees/${context.empId}`))}
            className="hidden cursor-pointer rounded-[7px] border border-gold-border bg-transparent px-[11px] py-[5px] font-sans text-[12px] font-semibold text-gold-fg md:block"
          >
            {x(M.shell_open_record)}
          </button>
        )}
        <button
          type="button"
          onClick={clearContext}
          aria-label={x(M.shell_ctx_clear_aria)}
          className="flex cursor-pointer border-none bg-transparent p-[5px] text-gold-fg"
        >
          <X size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
