import { Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { homeMessages as M } from '@/i18n/messages/home'
import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Home in production mode — the app's "reset stage": no Northgate Logistics
 * Inc. sample data, just a real, empty workspace and a way to start using
 * the Advisor. Only ever rendered for the signed-in admin who has switched
 * to production in Settings (see WorkspaceModeProvider).
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
        <p className="m-0 mb-[28px] text-[13.5px] leading-[1.6] text-text-muted">
          {x(M.home_production_body)}
        </p>

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
