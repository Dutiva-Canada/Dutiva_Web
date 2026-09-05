import { useCallback } from 'react'
import { useRail } from '@/features/app/rail/railContext'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import type { Employee } from '@/data'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'

/**
 * "Ask Advisor about this employee" — the prototype's
 * `askAdvisorAboutEmployee(emp)` (App v2.dc.html, 3299–3301): opens the rail
 * on the employee with their insight line and, when a risk flag exists, a
 * tone card whose primary action opens the backing Advisor case thread.
 */
export function useAskAdvisorAboutEmployee(): (emp: Employee) => void {
  const { openRail, closeRail } = useRail()
  const navigate = useWorkspaceNavigate()

  return useCallback(
    (emp: Employee) => {
      const risk = emp.risk
      const chatId = risk?.chatId ?? null
      openRail(
        emp.name,
        {
          text: emp.insight,
          cards: risk
            ? [
                {
                  tone: risk.tone,
                  title: risk.title,
                  body: risk.body,
                  actions: chatId
                    ? [
                        {
                          label: M.employees_open_full_case,
                          primary: true,
                          onClick: () => {
                            closeRail()
                            navigate('/app/advisor', {
                              state: { chatId } satisfies AdvisorSearchNavState,
                            })
                          },
                        },
                      ]
                    : [],
                },
              ]
            : [],
        },
        { initials: emp.initials },
      )
    },
    [openRail, closeRail, navigate],
  )
}
