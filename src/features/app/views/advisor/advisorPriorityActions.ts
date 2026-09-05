/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { NavigateOptions, To } from 'react-router-dom'
import type { HomeAction } from '@/features/app/views/home/homeData'
import type { FlowKeyOrFallback } from './advisorFlows'
import type { LText } from '@/i18n/core'

interface PriorityActionRunnerOptions {
  navigate: (to: To, options?: NavigateOptions) => void
  selectChat: (chatId: string) => void
  startFlow: (flowKey: FlowKeyOrFallback, userText: LText) => void
  openCatalogueDocument: (templateKey: string) => void
  openCompRail: (employeeId: string) => void
  openWellbeingRail: (employeeId: string) => void
}

/** Resolve Home command-centre actions inside the Advisor view. */
export function createAdvisorPriorityActionRunner(options: PriorityActionRunnerOptions) {
  const {
    navigate,
    selectChat,
    startFlow,
    openCatalogueDocument,
    openCompRail,
    openWellbeingRail,
  } = options

  return (action: HomeAction) => {
    switch (action.kind) {
      case 'route':
        navigate(action.to)
        break
      case 'chat':
        selectChat(action.chatId)
        break
      case 'doc':
        openCatalogueDocument(action.templateKey)
        break
      case 'flow':
        startFlow(action.flowKey, action.prompt)
        break
      case 'comp-rail':
        openCompRail(action.employeeId)
        break
      case 'wellbeing-rail':
        openWellbeingRail(action.employeeId)
        break
    }
  }
}
