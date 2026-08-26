import { FileStack, Inbox, Route, Settings, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { workspaceModeMessages as M } from '@/i18n/messages/workspaceMode'

/**
 * The shared production-mode empty state ModeGate renders in place of a
 * fixture-driven view: the module's title, the "starts empty" explainer, and
 * concrete entry points (people, Studio, guided processes) plus Settings for
 * Demo. Home and Advisor have their own tailored variants.
 */
export function ProductionEmptyState({ title }: { readonly title: string }) {
  const { x } = useI18n()

  const linkClass =
    'inline-flex items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] text-[13px] font-semibold text-text hover:border-(--accent-soft-border)'

  return (
    <div className="flex-1 overflow-y-auto px-[24px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[560px] pt-[48px] text-center">
        <div className="mx-auto mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
          <Inbox size={20} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
        </div>
        <div className="mb-[10px] text-[11px] font-bold tracking-[0.09em] text-text-faint uppercase">
          {x(M.wsmode_empty_eyebrow)}
        </div>
        <h1 className="m-0 mb-[10px] font-display text-[22px] font-semibold text-text">{title}</h1>
        <p className="m-0 mb-[16px] text-[14px] leading-[1.6] text-text-muted">
          {x(M.wsmode_empty_body)}
        </p>
        <div className="mb-[20px] rounded-[12px] border border-border-soft bg-inset p-[16px] text-left">
          <p className="m-0 text-[13px] leading-[1.6] text-text-muted">
            <span className="font-bold text-text">{x(M.wsmode_empty_why)}</span>
            <br />
            {x(M.wsmode_empty_hint)}
          </p>
        </div>
        <div className="mb-[14px] flex flex-wrap justify-center gap-[10px]">
          <Link to="/app/employees?new=1" className={linkClass}>
            <Users size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.wsmode_empty_cta_employees)}
          </Link>
          <Link to="/app/documents/studio" className={linkClass}>
            <FileStack size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.wsmode_empty_cta_studio)}
          </Link>
          <Link to="/app/workflows" className={linkClass}>
            <Route size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.wsmode_empty_cta_workflows)}
          </Link>
        </div>
        <Link
          to="/app/settings"
          className="inline-flex items-center gap-[7px] text-[13px] font-semibold text-accent"
        >
          <Settings size={14} strokeWidth={1.9} aria-hidden="true" />
          {x(M.wsmode_empty_settings_link)}
        </Link>
      </div>
    </div>
  )
}
