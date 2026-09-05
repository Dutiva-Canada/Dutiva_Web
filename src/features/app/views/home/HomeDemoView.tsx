import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { homeMessages as M } from '@/i18n/messages/home'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { HomeBriefHero } from './HomeBriefHero'
import { HomeCompliancePanel } from './HomeCompliancePanel'
import { HomeActNowSection, HomeThisWeekSection, HomeWatchingSection } from './HomePriorityQueue'
import { HomeWorkflowCatalog } from './HomeWorkflowCatalog'
import { HomeWorkflowsMobileList, HomeWorkflowsRailCard } from './HomeWorkflowsCard'
import type { AdvisorStartFlowNavState } from '@/features/app/views/advisor/advisorNav'
import { useHomeActions } from './useHomeActions'
import { AppPage } from '@/features/app/shell/AppPage'

/** Northgate command centre — demo workspace and public `/demo` only. */
export function HomeDemoView() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()
  const runAction = useHomeActions()

  const sendToAdvisor = (text: string) => {
    navigate('/app/advisor', { state: { prompt: text } satisfies AdvisorStartFlowNavState })
  }

  return (
    <AppPage width="wide" responsivePad>
      <div className="mb-[16px]">
        <div className="mb-[6px] text-[10.5px] font-bold tracking-[0.09em] text-gold-dot uppercase">
          {x(M.home_date_label)}
        </div>
        <h2 className="m-0 mb-[4px] font-display text-[23px] font-semibold text-text">
          {x(M.home_greeting)}
        </h2>
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.home_sub)}</p>
      </div>

      <HomeBriefHero onAction={runAction} />

      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="flex min-w-0 flex-[1.6_1_360px] flex-col gap-[16px]">
          <HomeActNowSection onAction={runAction} />
          <HomeWorkflowsMobileList onAction={runAction} />
          <HomeThisWeekSection onAction={runAction} />
          <HomeWatchingSection onAction={runAction} />
          <HomeWorkflowCatalog onAction={runAction} />
        </div>

        <div className="flex max-w-[380px] min-w-[240px] flex-[1_1_240px] flex-col gap-[14px]">
          <HomeCompliancePanel onAction={runAction} />
          <HomeWorkflowsRailCard onAction={runAction} />
        </div>
      </div>

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
