import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bi } from '@/i18n/core'
import { moneyOrUnset } from '@/lib/money'
import { employeeDetails, employees } from '@/data'
import { compensationMessages as COMP } from '@/i18n/messages/compensation'
import { wellbeingMessages as WB } from '@/i18n/messages/wellbeing'
import { useRail } from './railContext'

/**
 * The per-employee "Ask Advisor about pay" and wellbeing check-in rails —
 * ports of the prototype's `askAboutComp(emp)` (App v2.dc.html 4554–4558) and
 * `askAboutWellbeing(emp)` (4618–4620). One implementation shared by Home,
 * the Advisor home priorities, and the Compensation / Wellbeing views. The
 * prototype opens these rails with EN-only strings; FR is self-authored.
 */

/** Pay-review rail (`askAboutComp`). No-op for unknown ids. */
export function usePayRail(): (employeeId: string) => void {
  const navigate = useNavigate()
  const { openRail, closeRail } = useRail()

  return useCallback(
    (employeeId: string) => {
      const emp = employees.find((e) => e.id === employeeId)
      const det = employeeDetails[employeeId]
      if (!emp || !det || det.salary == null || det.market == null) return
      const delta = Math.round(((det.salary - det.market) / det.market) * 100)
      const below = delta < -4
      const base = moneyOrUnset(det.salary)
      const market = moneyOrUnset(det.market)
      const sign = delta >= 0 ? '+' : ''
      openRail(
        bi(
          `${emp.name}${COMP.comp_rail_title_suffix.en}`,
          `${emp.name}${COMP.comp_rail_title_suffix.fr}`,
        ),
        {
          text: below
            ? bi(
                `${emp.name}’s base is sitting below the market midpoint for this role and jurisdiction. Here’s the picture.`,
                `Le salaire de base de ${emp.name} se situe sous le point milieu du marché pour ce poste et cette compétence. Voici le portrait.`,
              )
            : bi(
                `${emp.name}’s pay is within a healthy band for the role and jurisdiction.`,
                `La rémunération de ${emp.name} se situe dans une fourchette saine pour le poste et la compétence.`,
              ),
          cards: [
            {
              tone: below ? 'warning' : 'success',
              title: below ? COMP.comp_below_title : COMP.comp_within_title,
              body: bi(
                `Base ${base.en} vs market midpoint ${market.en} (${sign}${delta}%). Additional comparator data and HR/Finance review are recommended before making a compensation decision.`,
                `Salaire de base de ${base.fr} contre un point milieu du marché de ${market.fr} (${sign}${delta} %). Des données comparatives supplémentaires et un examen RH/Finances sont recommandés avant de prendre une décision de rémunération.`,
              ),
              citations: [{ label: COMP.comp_market_review_citation }],
              actions: [
                {
                  label: COMP.comp_open_comp_tab,
                  primary: true,
                  onClick: () => {
                    closeRail()
                    navigate(`/app/employees/${emp.id}`, { state: { tab: 'compensation' } })
                  },
                },
              ],
            },
          ],
        },
        {
          chips: [emp.jurisdiction, emp.role, COMP.comp_context_topic],
          initials: emp.initials,
        },
      )
    },
    [openRail, closeRail, navigate],
  )
}

/** Supportive, non-diagnostic wellbeing check-in rail (`askAboutWellbeing`). */
export function useWellbeingRail(): (employeeId: string) => void {
  const navigate = useNavigate()
  const { openRail, closeRail } = useRail()

  return useCallback(
    (employeeId: string) => {
      const emp = employees.find((e) => e.id === employeeId)
      if (!emp) return
      const firstName = emp.name.split(' ')[0] ?? emp.name
      openRail(
        bi(
          `${emp.name}${WB.wellbeing_rail_title_suffix.en}`,
          `${emp.name}${WB.wellbeing_rail_title_suffix.fr}`,
        ),
        {
          text: bi(
            `Here’s what I’m seeing in ${firstName}’s recent check-ins. I’ll keep this non-diagnostic.`,
            `Voici ce que j’observe dans les derniers suivis de ${firstName}. Je resterai non diagnostique.`,
          ),
          cards: [
            {
              tone: 'info',
              title: WB.wellbeing_handle_title,
              body: WB.wellbeing_handle_body,
              citations: [{ label: WB.wellbeing_handle_citation }],
              actions: [
                {
                  label: WB.wellbeing_draft_message_action,
                  primary: true,
                  onClick: () => {
                    closeRail()
                    navigate('/app/communications')
                  },
                },
              ],
            },
          ],
        },
        {
          chips: [emp.jurisdiction, emp.role, WB.wellbeing_context_topic],
          initials: emp.initials,
        },
      )
    },
    [openRail, closeRail, navigate],
  )
}
