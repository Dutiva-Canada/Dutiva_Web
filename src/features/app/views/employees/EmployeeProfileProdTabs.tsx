import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { employeesMessages as M } from '@/i18n/messages/employees'

/**
 * Tab strip and shared types for the production employee profile.
 * Mirrors the demo view's eight tabs (Overview, Timeline, Documents,
 * Leave, Compensation, Wellbeing, Compliance, Cases) so both modes
 * present the same sections — only the data source differs.
 */

export type ProfileTab =
  | 'overview'
  | 'timeline'
  | 'documents'
  | 'leave'
  | 'compensation'
  | 'wellbeing'
  | 'compliance'
  | 'cases'

const PROFILE_TABS: ReadonlyArray<{ key: ProfileTab; label: Bi }> = [
  { key: 'overview', label: M.employees_tab_overview },
  { key: 'timeline', label: M.employees_tab_timeline },
  { key: 'documents', label: M.employees_tab_documents },
  { key: 'leave', label: M.employees_tab_leave },
  { key: 'compensation', label: M.employees_tab_compensation },
  { key: 'wellbeing', label: M.employees_tab_wellbeing },
  { key: 'compliance', label: M.employees_tab_compliance },
  { key: 'cases', label: M.employees_tab_cases },
]

export function ProfileTabStrip({
  active,
  onSelect,
}: Readonly<{ active: ProfileTab; onSelect: (tab: ProfileTab) => void }>) {
  const { x } = useI18n()
  return (
    <div
      role="tablist"
      aria-label={x(M.employees_profile_tabs_aria)}
      className="mb-[18px] flex gap-[2px] overflow-x-auto border-b border-border"
    >
      {PROFILE_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onSelect(t.key)}
          className={`cursor-pointer border-0 border-b-2 bg-transparent px-[14px] py-[9px] font-sans text-[13px] font-semibold whitespace-nowrap ${
            active === t.key ? 'border-b-navy text-text' : 'border-b-transparent text-text-muted'
          }`}
        >
          {x(t.label)}
        </button>
      ))}
    </div>
  )
}

/** Empty-state panel for tabs that don't have a production data source yet. */
export function ProfileEmptyTab({
  title,
  body,
}: Readonly<{ title: Bi; body: Bi }>) {
  const { x } = useI18n()
  return (
    <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[48px] text-center">
      <div className="mb-[4px] text-[14px] font-semibold text-text">{x(title)}</div>
      <div className="mx-auto max-w-[400px] text-[13px] text-text-muted">{x(body)}</div>
    </div>
  )
}
