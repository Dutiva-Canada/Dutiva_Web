import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { employees, orgRoot, orgStructure } from '@/data'
import type { Employee } from '@/data'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { dotToneClass, sourceChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'

/**
 * Org-chart mode of the Employees view — the prototype's `buildOrgGraph()`
 * (App v2.dc.html, 4150–4190) + markup 940–985: manager/report stat tiles,
 * the Advisor reporting-line watch banner when a manager is offboarding, the
 * workspace root, and one column per reporting branch.
 */

interface OrgBranchNode {
  manager: Employee
  dept: Bi
  reports: Employee[]
}

const byId = new Map(employees.map((e) => [e.id, e]))

const branches: OrgBranchNode[] = orgStructure.flatMap((b) => {
  const manager = byId.get(b.managerId)
  if (!manager) return []
  return [
    {
      manager,
      dept: b.dept,
      reports: b.reportIds.flatMap((id) => {
        const report = byId.get(id)
        return report ? [report] : []
      }),
    },
  ]
})

/** Org-chart chips downgrade the info tone to neutral (prototype 4162). */
function orgChipTone(tone: Employee['tone']): ChipTone {
  return tone === 'risk' || tone === 'warning' || tone === 'success' ? tone : 'neutral'
}

export function OrgChart() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()

  const openProfile = (id: string) => navigate(`/app/employees/${id}`)

  const managerCount = branches.length
  const reportCount = branches.reduce((n, b) => n + b.reports.length, 0)

  /* Prototype: a branch is "departing" when its manager is offboarding. The
     note is composed from live branch data, kept as a Bi pair (4177–4182). */
  const departing = branches.find((b) => b.manager.status.en === 'Offboarding')
  const advisorNote: Bi = departing
    ? bi(
        `${departing.manager.name} is being offboarded — their ${departing.reports.length} direct reports in ${departing.dept.en} will need a reporting line before the departure date.`,
        `${departing.manager.name} est en cours de départ — ses ${departing.reports.length} subordonnés directs en ${departing.dept.fr} auront besoin d’une ligne hiérarchique avant la date de départ.`,
      )
    : M.employees_org_note_current

  return (
    <>
      <div className="mb-[14px] flex flex-wrap gap-[12px]">
        <div className="min-w-[130px] flex-1 rounded-[12px] border border-border bg-surface px-[16px] py-[14px]">
          <div className="font-display text-[24px] font-bold text-text">{managerCount}</div>
          <div className="mt-[2px] text-[12px] text-text-muted">
            {x(M.employees_people_managers)}
          </div>
        </div>
        <div className="min-w-[130px] flex-1 rounded-[12px] border border-border bg-surface px-[16px] py-[14px]">
          <div className="font-display text-[24px] font-bold text-text">{reportCount}</div>
          <div className="mt-[2px] text-[12px] text-text-muted">
            {x(M.employees_direct_reports)}
          </div>
        </div>
      </div>

      {departing && (
        <div className="mb-[22px] flex items-start gap-[11px] rounded-[12px] border border-gold-border bg-gold-bg px-[16px] py-[13px]">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-navy">
            <Sparkle size={14} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
          </div>
          <div>
            <div className="mb-[2px] text-[11px] font-bold tracking-wider text-gold-dot uppercase">
              {x(M.employees_org_watch_eyebrow)}
            </div>
            <div className="text-[13px] leading-normal text-text-2">{x(advisorNote)}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-[11px] rounded-[12px] bg-navy px-[18px] py-[12px] shadow-[0_4px_14px_rgba(13,27,42,0.18)]">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(var(--gold-on-navy-rgb),0.16)] text-[12.5px] font-bold text-gold-on-navy">
            {orgRoot.initials}
          </div>
          <div className="text-left">
            <div className="text-[14px] font-bold text-white">{orgRoot.name}</div>
            <div className="text-[11.5px] text-[rgba(255,255,255,0.66)]">{x(orgRoot.role)}</div>
          </div>
        </div>
        <div className="h-[22px] w-[1.5px] bg-border" />
      </div>

      <div className="flex flex-wrap items-start justify-center gap-[16px]">
        {branches.map((b) => (
          <div key={b.manager.id} className="flex w-[232px] flex-col items-stretch">
            <div className="mx-auto h-[14px] w-[1.5px] bg-border" />
            <button
              type="button"
              onClick={() => openProfile(b.manager.id)}
              aria-label={`${x(M.employees_open_profile_for)} ${b.manager.name}`}
              className="flex cursor-pointer flex-col gap-[9px] rounded-[12px] border border-border bg-surface px-[14px] py-[13px] text-left font-sans hover:border-(--accent-soft-border)"
            >
              <div className="flex items-center gap-[10px]">
                <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                  {b.manager.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[6px]">
                    <span className="overflow-hidden text-[13.5px] font-bold text-ellipsis whitespace-nowrap text-text">
                      {b.manager.name}
                    </span>
                    <div
                      className={`h-[7px] w-[7px] shrink-0 rounded-full ${dotToneClass(b.manager.tone)}`}
                    />
                  </div>
                  <div className="overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-text-muted">
                    {x(b.manager.role)}
                  </div>
                </div>
              </div>
              <span className={sourceChipClass(orgChipTone(b.manager.tone))}>{x(b.dept)}</span>
            </button>
            <div className="mx-auto h-[14px] w-[1.5px] bg-border" />
            <div className="ml-[16px] flex flex-col gap-[8px] border-l-[1.5px] border-border pl-[12px]">
              {b.reports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openProfile(r.id)}
                  aria-label={`${x(M.employees_open_profile_for)} ${r.name}`}
                  className="flex cursor-pointer items-center gap-[9px] rounded-[10px] border border-border bg-surface px-[11px] py-[9px] text-left font-sans hover:border-(--accent-soft-border)"
                >
                  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-inset text-[10.5px] font-bold text-text-2">
                    {r.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-hidden text-[12.5px] font-semibold text-ellipsis whitespace-nowrap text-text">
                      {r.name}
                    </div>
                    <div className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-text-muted">
                      {x(r.role)}
                    </div>
                  </div>
                  <div
                    className={`h-[7px] w-[7px] shrink-0 rounded-full ${dotToneClass(r.tone)}`}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
