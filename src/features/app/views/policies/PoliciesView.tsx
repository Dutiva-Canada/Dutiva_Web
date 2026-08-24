import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { policies } from '@/data'
import type { Policy } from '@/data'
import { statusChipClass } from '@/components/chips'
import { useRail } from '@/features/app/rail/railContext'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { policiesMessages as M } from '@/i18n/messages/policies'
import { PoliciesProductionView } from './PoliciesProductionView'
import { AppPage, AppPageLead } from '@/features/app/shell/AppPage'

const lcFirst = (s: string): string => (s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s)

/**
 * "Last reviewed {updated}" — the prototype markup hardcodes the EN prefix;
 * FR composition is self-authored ("Dernière révision : il y a 14 mois").
 */
const lastReviewed = (updated: Bi): Bi =>
  bi(
    `${M.policies_last_reviewed_prefix.en}${updated.en}`,
    `${M.policies_last_reviewed_prefix.fr}${lcFirst(updated.fr)}`,
  )

/**
 * Policies view — port of the prototype's policies register markup +
 * `buildPoliciesView()`: status rows (Up to date / Needs review / Missing)
 * with "Review with Advisor" opening the rail; the rail card's primary action
 * drafts the policy in Document Studio ("Draft it now" when Missing).
 *
 * Production renders the real register (PoliciesProductionView,
 * public.hr_policies) instead of the Northgate fixtures below.
 */
export function PoliciesView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <PoliciesProductionView />
  return <PoliciesDemoView />
}

function PoliciesDemoView() {
  const { x } = useI18n()
  const { openRail, closeRail } = useRail()
  const { openDocStudio } = useDocStudio()

  /** Prototype `buildPoliciesView().onReview`. */
  const reviewPolicy = (p: Policy) => {
    const missing = p.status.en === 'Missing'
    const reviewedLine = lastReviewed(p.updated)
    openRail(p.title, {
      text: missing ? M.policies_rail_missing_text : M.policies_rail_take_text,
      cards: [
        {
          tone: p.tone,
          title: p.status,
          body: bi(`${reviewedLine.en}.`, `${reviewedLine.fr}.`),
          actions: [
            {
              label: missing ? M.policies_draft_now : M.policies_review_advisor,
              primary: true,
              onClick: () => {
                closeRail()
                openDocStudio(p.title.en)
              },
            },
          ],
        },
      ],
    })
  }

  return (
    <AppPage width="comfort">
        <AppPageLead>{x(M.policies_subtitle)}</AppPageLead>
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[15px]"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-text">{x(p.title)}</div>
                <div className="mt-[2px] text-[12px] text-text-muted">
                  {x(lastReviewed(p.updated))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-[10px]">
                <span className={statusChipClass(p.tone)}>{x(p.status)}</span>
                <button
                  type="button"
                  onClick={() => reviewPolicy(p)}
                  className="cursor-pointer rounded-[8px] border-none bg-accent-soft px-[13px] py-[7px] text-[12.5px] font-bold whitespace-nowrap text-accent"
                >
                  {x(M.policies_review_advisor)}
                </button>
              </div>
            </div>
          ))}
        </div>
    </AppPage>
  )
}
