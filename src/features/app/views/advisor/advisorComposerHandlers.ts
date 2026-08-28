/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { LText } from '@/i18n/core'
import type { AuthStatus } from '@/features/app/auth/authContext'
import type { FlowKeyOrFallback } from './advisorFlows'
import type { SuggestChipSpec } from './advisorFlows'
import { routeScenarioFromText } from './advisorScenarios'
import type { ScenarioId } from './advisorScenarios'

interface ComposerHandlersOptions {
  authStatus: AuthStatus
  startCrisisThread: (text: string) => boolean
  startFlow: (flowKey: FlowKeyOrFallback, userText: LText) => void
  startScenario: (scenarioId: ScenarioId, userText?: LText) => void
}

/** Idle/home composer sends and suggest-chip routing. */
export function createAdvisorComposerHandlers(options: ComposerHandlersOptions) {
  const { authStatus, startCrisisThread, startFlow, startScenario } = options

  const idleSend = (prompt: string) => {
    if (startCrisisThread(prompt)) return
    if (authStatus === 'signed-in') startFlow('fallback', prompt)
    else startScenario(routeScenarioFromText(prompt), prompt)
  }

  const homeSend = (text: string) => {
    if (startCrisisThread(text)) return
    if (authStatus === 'signed-in') startFlow('fallback', text)
    else startScenario(routeScenarioFromText(text), text)
  }

  const onSuggestChip = (chip: SuggestChipSpec) => startFlow(chip.flowKey, chip.label)

  return { idleSend, homeSend, onSuggestChip }
}
