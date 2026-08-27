import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { homeMessages as M } from '@/i18n/messages/home'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { HomeBriefHero } from './HomeBriefHero'
import { HomeCompliancePanel } from './HomeCompliancePanel'
import { HomeActNowSection, HomeThisWeekSection, HomeWatchingSection } from './HomePriorityQueue'
import { HomeWorkflowCatalog } from './HomeWorkflowCatalog'
import { HomeWorkflowsMobileList, HomeWorkflowsRailCard } from './HomeWorkflowsCard'
import { HomeProductionView } from './HomeProductionView'
import type { AdvisorStartFlowNavState } from '@/features/app/views/advisor/advisorNav'
import { useHomeActions } from './useHomeActions'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Home — Command Centre (prototype `App v2.dc.html` markup 335–547,
 * `buildHomeView()` in its default "brief" hero emphasis). Order: AdvisorBrief
 * hero (with MetricChips) → PriorityQueue (Act now / mobile WorkflowCards /
 * This week / Watching) → WorkflowLauncher → right rail (CompliancePrediction
 * + desktop WorkflowCards) → AdvisorComposer.
 *
 * In production mode (admin-only, see WorkspaceModeProvider) this renders
 * HomeProductionView instead — the real command centre (live counts, due
 * soon, policy attention), or the welcome state while the workspace is
 * empty. The Northgate Logistics Inc. fixtures below stay demo-only.
 */
export function HomeView() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()
  const runAction = useHomeActions()
  const { mode } = useWorkspaceMode()

  /* Prototype `onHomeSend` — free-typed text keeps keyword routing (no key). */
  const sendToAdvisor = (text: string) => {
    navigate('/app/advisor', { state: { prompt: text } satisfies AdvisorStartFlowNavState })
  }

  /* Production Home is not PlanGated: welcome / first steps and live counts
     must stay reachable on free plans. Paid widgets elsewhere keep their own
     gates. */
  if (mode === 'production') {
    return <HomeProductionView onSend={sendToAdvisor} />
  }

  return (
    <AppPage width="wide" responsivePad>
        {/* Header */}
        <div className="mb-[16px]">
          <div className="mb-[6px] text-[10.5px] font-bold tracking-[0.09em] text-gold-dot uppercase">
            {x(M.home_date_label)}
          </div>
          <h1 className="m-0 mb-[4px] font-display text-[23px] font-semibold text-text">
            {x(M.home_greeting)}
          </h1>
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.home_sub)}</p>
        </div>

        <HomeBriefHero onAction={runAction} />

        <div className="flex flex-wrap items-start gap-[18px]">
          {/* PriorityQueue column */}
          <div className="flex min-w-0 flex-[1.6_1_360px] flex-col gap-[16px]">
            <HomeActNowSection onAction={runAction} />
            <HomeWorkflowsMobileList onAction={runAction} />
            <HomeThisWeekSection onAction={runAction} />
            <HomeWatchingSection onAction={runAction} />
            <HomeWorkflowCatalog onAction={runAction} />
          </div>

          {/* Right rail: CompliancePrediction + WorkflowCards (desktop) */}
          <div className="flex max-w-[380px] min-w-[240px] flex-[1_1_240px] flex-col gap-[14px]">
            <HomeCompliancePanel onAction={runAction} />
            <HomeWorkflowsRailCard onAction={runAction} />
          </div>
        </div>

        {/* AdvisorComposer */}
        <div className="mx-auto mt-[24px] max-w-[760px]">
          <ChatComposer
            variant="home"
            placeholder={x(M.home_composer_placeholder)}
            onSend={sendToAdvisor}
          />
          <Disclaimer className="mt-[8px] text-center" />
        </div>
    </AppPage>
  )
}
