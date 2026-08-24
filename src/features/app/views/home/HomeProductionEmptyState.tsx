import { FileStack, Route, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { homeMessages as M } from '@/i18n/messages/home'
import { flowsMessages as F } from '@/i18n/messages/flows'
import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Home in production mode — the app's "reset stage": no Northgate Logistics
 * Inc. sample data, just a real, empty workspace and concrete first steps
 * (people, Studio, guided processes) plus the Advisor composer.
 */
export function HomeProductionEmptyState({
  identity,
  onSend,
}: {
  readonly identity: WorkspaceIdentity
  readonly onSend: (text: string) => void
}) {
  const { x } = useI18n()

  return (
    <AppPage width="narrow" responsivePad innerClassName="pt-[48px] text-center">
        <div className="mx-auto mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-accent-soft">
          <Sparkles size={20} strokeWidth={1.7} className="text-accent" aria-hidden="true" />
        </div>
        <div className="mb-[10px] text-[11px] font-bold tracking-[0.09em] text-text-faint uppercase">
          {x(M.home_production_workspace_label)}: {identity.companyName}
        </div>
        <h1 className="m-0 mb-[10px] font-display text-[22px] font-semibold text-text">
          {x(M.home_production_title)}
        </h1>
        <p className="m-0 mb-[24px] text-[13.5px] leading-[1.6] text-text-muted">
          {x(M.home_production_body)}
        </p>

        <div className="mb-[22px] flex flex-wrap justify-center gap-[10px]">
          <Link
            to="/app/employees"
            className="inline-flex items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] text-[13px] font-semibold text-text hover:border-(--accent-soft-border)"
          >
            <Users size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.home_production_cta_employees)}
          </Link>
          <Link
            to="/app/documents/studio"
            className="inline-flex items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] text-[13px] font-semibold text-text hover:border-(--accent-soft-border)"
          >
            <FileStack size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.home_production_cta_studio)}
          </Link>
          <Link
            to="/app/workflows"
            className="inline-flex items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] text-[13px] font-semibold text-text hover:border-(--accent-soft-border)"
          >
            <Route size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.home_production_cta_workflows)}
          </Link>
        </div>

        <div className="mb-[8px] text-left text-[11px] font-bold tracking-wider text-text-muted uppercase">
          {x(M.home_production_pinned_label)}
        </div>
        <div className="mb-[24px] grid grid-cols-1 gap-[8px] text-left sm:grid-cols-3">
          <Link
            to="/app/workflows/statutory-notice-ontario"
            className="rounded-[10px] border border-border bg-surface px-[12px] py-[11px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
          >
            {x(F.flows_pin_notice_on)}
          </Link>
          <Link
            to="/app/workflows/severance-eligibility-ontario"
            className="rounded-[10px] border border-border bg-surface px-[12px] py-[11px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
          >
            {x(F.flows_pin_severance)}
          </Link>
          <Link
            to="/app/workflows/duty-to-accommodate"
            className="rounded-[10px] border border-border bg-surface px-[12px] py-[11px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
          >
            {x(F.flows_pin_accommodate)}
          </Link>
        </div>

        <div className="rounded-[14px] shadow-float">
          <ChatComposer
            variant="chat"
            placeholder={x(M.home_composer_placeholder)}
            onSend={onSend}
            autoFocus
          />
        </div>
        <Disclaimer className="mt-[8px] text-center" />
    </AppPage>
  )
}
