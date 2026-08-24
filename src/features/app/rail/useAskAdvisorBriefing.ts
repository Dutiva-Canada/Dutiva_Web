import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LText } from '@/i18n/core'
import { advisorCore as M } from '@/i18n/messages/advisorCore'
import type { AdvisorTurnSpec } from '@/features/app/advisor/types'
import { cases } from '@/data'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useRail } from './railContext'

/**
 * Per-view "Ask Advisor" briefings — the port of the prototype's
 * `openRailGeneral()` byView map. The topbar's Ask Advisor button calls the
 * returned function with the active view key; the rail opens with that view's
 * canned Advisor summary and tone cards, whose actions really navigate
 * (chat ids resolve to case routes via the `cases` fixtures' `chatId`).
 *
 * In production mode the Northgate fixture briefings are skipped — an empty
 * org must not see sample case CTAs. The rail opens a generic prompt with
 * links to live surfaces (Workflows, Studio).
 */

/** Resolve a prototype chat id ('c1' …) to its case-detail route. */
function caseRouteForChat(chatId: string): string {
  const match = cases.find((c) => c.chatId === chatId)
  return match ? `/app/cases/${match.id}` : '/app/cases'
}

/** First path segment under /app — the briefing key for a location. */
export function railViewKeyFromPathname(pathname: string): string {
  const match = /^\/app\/([^/]+)/.exec(pathname)
  return match?.[1] ?? ''
}

interface Briefing {
  title: LText
  spec: AdvisorTurnSpec
}

export function useAskAdvisorBriefing(): (viewKey: string) => void {
  const { openRail, closeRail } = useRail()
  const navigate = useNavigate()
  const { openDocFromLibrary } = useDocStudio()
  const { mode } = useWorkspaceMode()

  return useCallback(
    (viewKey: string) => {
      const go = (to: string, state?: unknown) => () => {
        closeRail()
        navigate(to, state === undefined ? undefined : { state })
      }
      /** Open a document overlay directly — no page navigation needed. */
      const openDoc = (docKey: string) => () => {
        closeRail()
        openDocFromLibrary(docKey)
      }

      if (mode === 'production') {
        openRail(M.advisor_brief_title_fallback, {
          text: M.advisor_brief_prod_text,
          cards: [
            {
              tone: 'suggestion',
              title: M.advisor_brief_prod_card_title,
              body: M.advisor_brief_prod_card_body,
              actions: [
                {
                  label: M.advisor_action_start_process,
                  primary: true,
                  onClick: go('/app/workflows'),
                },
                {
                  label: M.advisor_action_open_studio,
                  onClick: go('/app/documents/studio'),
                },
              ],
            },
          ],
        })
        return
      }

      const byView: Record<string, Briefing> = {
        employees: {
          title: M.advisor_brief_title_employees,
          spec: {
            text: M.advisor_brief_employees_text,
            cards: [
              {
                tone: 'risk',
                title: M.advisor_brief_employees_risk_title,
                body: M.advisor_brief_employees_risk_body,
                actions: [
                  {
                    label: M.advisor_action_open_case,
                    primary: true,
                    onClick: go(caseRouteForChat('c1')),
                  },
                ],
              },
              {
                tone: 'warning',
                title: M.advisor_brief_employees_warn_title,
                body: M.advisor_brief_employees_warn_body,
                actions: [
                  { label: M.advisor_action_view_compliance, onClick: go('/app/compliance') },
                ],
              },
            ],
          },
        },
        compliance: {
          title: M.advisor_brief_title_compliance,
          spec: {
            text: M.advisor_brief_compliance_text,
            cards: [
              {
                tone: 'risk',
                title: M.advisor_brief_compliance_card_title,
                body: M.advisor_brief_compliance_card_body,
                actions: [
                  {
                    label: M.advisor_action_open_case,
                    primary: true,
                    onClick: go(caseRouteForChat('c1')),
                  },
                ],
              },
            ],
          },
        },
        policies: {
          title: M.advisor_brief_title_policies,
          spec: {
            text: M.advisor_brief_policies_text,
            cards: [
              {
                tone: 'warning',
                title: M.advisor_brief_policies_card_title,
                body: M.advisor_brief_policies_card_body,
                /* Open the Remote Work Policy draft directly in the overlay —
                   no page navigation needed now that the resolver handles tids. */
                actions: [
                  {
                    label: M.advisor_action_draft_refresh,
                    primary: true,
                    onClick: openDoc('T10'),
                  },
                ],
              },
            ],
          },
        },
        /* /app/planning is the unified Planning view (Tasks + Calendar sub-tabs).
           The briefing reuses the tasks content — planning lands on tasks by default. */
        planning: {
          title: M.advisor_brief_title_tasks,
          spec: {
            text: M.advisor_brief_tasks_text,
            cards: [
              {
                tone: 'suggestion',
                title: M.advisor_brief_tasks_card_title,
                body: M.advisor_brief_tasks_card_body,
                actions: [
                  {
                    label: M.advisor_action_open_case,
                    primary: true,
                    onClick: go(caseRouteForChat('c1')),
                  },
                ],
              },
            ],
          },
        },
        tasks: {
          title: M.advisor_brief_title_tasks,
          spec: {
            text: M.advisor_brief_tasks_text,
            cards: [
              {
                tone: 'suggestion',
                title: M.advisor_brief_tasks_card_title,
                body: M.advisor_brief_tasks_card_body,
                actions: [
                  {
                    label: M.advisor_action_open_case,
                    primary: true,
                    onClick: go(caseRouteForChat('c1')),
                  },
                ],
              },
            ],
          },
        },
        calendar: {
          title: M.advisor_brief_title_calendar,
          spec: { text: M.advisor_brief_calendar_text },
        },
        reports: {
          title: M.advisor_brief_title_reports,
          spec: { text: M.advisor_brief_reports_text },
        },
        templates: {
          title: M.advisor_brief_title_templates,
          spec: { text: M.advisor_brief_templates_text },
        },
        /* All three tabs of the unified HR Library (/app/documents/*) share
           the same document-focused briefing content. */
        documents: {
          title: M.advisor_brief_title_templates,
          spec: { text: M.advisor_brief_templates_text },
        },
        knowledge: {
          title: M.advisor_brief_title_knowledge,
          spec: { text: M.advisor_brief_knowledge_text },
        },
        settings: {
          title: M.advisor_brief_title_settings,
          spec: { text: M.advisor_brief_settings_text },
        },
      }

      const content = byView[viewKey] ?? {
        title: M.advisor_brief_title_fallback,
        spec: { text: M.advisor_brief_fallback_text },
      }
      openRail(content.title, content.spec)
    },
    [openRail, closeRail, navigate, openDocFromLibrary, mode],
  )
}
