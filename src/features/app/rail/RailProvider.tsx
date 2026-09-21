import { useCallback, useMemo, useState } from 'react'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import type { ReactNode } from 'react'

import type { LText } from '@/i18n/core'
import { advisorCore as M } from '@/i18n/messages/advisorCore'
import { advisorViewMessages } from '@/i18n/messages/advisorView'
import { agentMessages } from '@/i18n/messages/agent'
import { proposeAgentAction } from '@/features/app/agent/intent'
import type { AdvisorTurnSpec } from '@/features/app/advisor/types'
import { useAdvisorEngine } from '@/features/app/advisor/useAdvisorEngine'
import { detectCrisisSignal } from '@/features/app/advisor/safety'
import { reportSafetyEvent } from '@/features/app/advisor/safetyTelemetry'
import { RailContext } from './railContext'
import type { RailContextMeta, RailState } from './railContext'

interface RailHead {
  open: boolean
  title: LText
  meta: RailContextMeta
}

const CLOSED: RailHead = { open: false, title: '', meta: {} }

/**
 * Contextual Advisor rail state — port of the prototype's `openRail` /
 * `closeRail` / `sendRailMessage`. Assistant turns run through the shared
 * streaming engine (thinking dots → streamed text → tone cards). Closing
 * keeps the transcript (prototype behaviour); opening on a new subject
 * resets it.
 */
export function RailProvider({ children }: { readonly children: ReactNode }) {
  const [head, setHead] = useState<RailHead>(CLOSED)
  const engine = useAdvisorEngine({ idPrefix: 'rail' })
  const navigate = useWorkspaceNavigate()
  const { reset, pushTurn, sendUser } = engine

  const openRail = useCallback(
    (title: LText, spec: AdvisorTurnSpec, meta: RailContextMeta = {}) => {
      setHead({ open: true, title, meta })
      reset()
      pushTurn(spec)
    },
    [reset, pushTurn],
  )

  const closeRail = useCallback(() => {
    setHead((prev) => (prev.open ? { ...prev, open: false } : prev))
  }, [])

  const sendRailMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !head.open) return
      sendUser(trimmed)
      /* Crisis intercept (AGENT.md §8): the maintained resource, no cards,
         and no routing back into an HR flow — the rail is a free-text entry
         point like any other. */
      if (detectCrisisSignal(trimmed)) {
        pushTurn({ text: advisorViewMessages.advisorview_crisis_support })
        void reportSafetyEvent({ conversationId: null, actions: ['crisis-intercept'] })
        return
      }
      /* Agent intent (docs/AGENT_LAYER.md): deterministic parsers propose a
         tool call — the confirm card decides whether anything runs. Until
         the Advisor engine emits `proposedActions` over the wire, this is
         the live end-to-end path. */
      const proposal = proposeAgentAction(trimmed)
      if (proposal) {
        pushTurn({
          text: agentMessages.agent_rail_proposal_ack,
          proposedActions: [proposal],
        })
        return
      }
      /* Canned acknowledgement + "Continue in Advisor Home" card — verbatim
         from the prototype's `sendRailMessage`. */
      pushTurn({
        text: M.advisor_rail_ack,
        cards: [
          {
            tone: 'suggestion',
            title: M.advisor_rail_continue_title,
            body: M.advisor_rail_continue_body,
            actions: [
              {
                label: M.advisor_rail_open_home,
                primary: true,
                onClick: () => {
                  closeRail()
                  navigate('/app/advisor')
                },
              },
            ],
          },
        ],
      })
    },
    [head.open, sendUser, pushTurn, closeRail, navigate],
  )

  const rail = useMemo<RailState>(
    () => ({ open: head.open, title: head.title, meta: head.meta, messages: engine.messages }),
    [head, engine.messages],
  )

  const value = useMemo(
    () => ({ rail, openRail, closeRail, sendRailMessage }),
    [rail, openRail, closeRail, sendRailMessage],
  )

  return <RailContext value={value}>{children}</RailContext>
}
