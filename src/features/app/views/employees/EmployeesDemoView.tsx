import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { employees } from '@/data'
import type { Employee } from '@/data'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { statusChipClass } from '@/components/chips'
import { AppPage } from '@/features/app/shell/AppPage'
import { OrgChart } from './OrgChart'
import { useAskAdvisorAboutEmployee } from './useAskAdvisorAboutEmployee'

/** Northgate employee roster — demo workspace and public `/demo` only. */
export function EmployeesDemoView() {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const askAdvisor = useAskAdvisorAboutEmployee()
  const [mode, setMode] = useState<'list' | 'org'>('list')
  const [filter, setFilter] = useState('')

  const q = filter.toLowerCase()
  const rows = employees.filter(
    (e) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      pick(e.role, lang).toLowerCase().includes(q) ||
      pick(e.province, lang).toLowerCase().includes(q),
  )

  const openProfile = (e: Employee) => navigate(`/app/employees/${e.id}`)
  const onAsk = (e: Employee) => (ev: ReactMouseEvent) => {
    ev.stopPropagation()
    askAdvisor(e)
  }

  const segTabClass = (on: boolean) =>
    `cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] font-sans text-[12.5px] font-semibold ${
      on ? 'bg-surface text-text shadow-(--shadow-sm)' : 'bg-transparent text-text-muted'
    }`

  return (
    <AppPage width="default">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
        <div
          role="tablist"
          aria-label={x(M.employees_view_toggle_aria)}
          className="inline-flex gap-[2px] rounded-[10px] border border-border bg-inset p-[3px]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'list'}
            onClick={() => setMode('list')}
            className={segTabClass(mode === 'list')}
          >
            {x(M.employees_tab_people)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'org'}
            onClick={() => setMode('org')}
            className={segTabClass(mode === 'org')}
          >
            {x(M.employees_tab_org)}
          </button>
        </div>
        {mode === 'list' && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={x(M.employees_filter_placeholder)}
            aria-label={x(M.employees_filter_placeholder)}
            className="min-w-[240px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13.5px] text-text"
          />
        )}
      </div>

      {mode === 'list' && (
        <>
          <div className="mb-[14px] text-[13px] text-text-muted">
            {x(M.employees_showing)} {rows.length} {x(M.employees_of_sample)}
          </div>

          {rows.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto rounded-[12px] border border-border bg-surface md:block">
                <div className="grid min-w-[700px] grid-cols-[2.4fr_1.7fr_0.9fr_1fr_0.8fr_34px] gap-[10px] bg-inset px-[16px] py-[11px] text-[11.5px] font-bold tracking-[0.03em] text-text-muted uppercase">
                  <div>{x(M.employees_th_name)}</div>
                  <div>{x(M.employees_th_role)}</div>
                  <div>{x(M.employees_th_province)}</div>
                  <div>{x(M.employees_th_status)}</div>
                  <div>{x(M.employees_th_tenure)}</div>
                  <div />
                </div>
                {rows.map((e) => (
                  <div
                    key={e.id}
                    className="grid min-w-[700px] grid-cols-[2.4fr_1.7fr_0.9fr_1fr_0.8fr_34px] items-center gap-[10px] border-t border-t-inset px-[16px] py-[12px]"
                  >
                    <div className="flex min-w-0 items-center gap-[10px]">
                      <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                        {e.initials}
                      </div>
                      <button
                        type="button"
                        aria-label={`${x(M.employees_open_profile_for)} ${e.name}`}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          openProfile(e)
                        }}
                        className="cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left font-sans text-[13.5px] font-semibold text-ellipsis whitespace-nowrap text-text"
                      >
                        {e.name}
                      </button>
                    </div>
                    <div className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-text-2">
                      {x(e.role)}
                    </div>
                    <div className="text-[13px] text-text-2">{x(e.province)}</div>
                    <div>
                      <span className={statusChipClass(e.tone)}>{x(e.status)}</span>
                    </div>
                    <div className="text-[13px] text-text-2">{x(e.tenure)}</div>
                    <button
                      type="button"
                      onClick={onAsk(e)}
                      aria-label={x(M.employees_ask_about_aria)}
                      className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-gold-bg text-gold-fg"
                    >
                      <Sparkle size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-[10px] md:hidden">
                {rows.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-col gap-[10px] rounded-[11px] border border-border bg-surface p-[14px]"
                  >
                    <div className="flex items-center gap-[10px]">
                      <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                        {e.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          aria-label={`${x(M.employees_open_profile_for)} ${e.name}`}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            openProfile(e)
                          }}
                          className="block cursor-pointer border-none bg-transparent p-0 text-left font-sans text-[14.5px] font-semibold text-text"
                        >
                          {e.name}
                        </button>
                        <div className="text-[12.5px] text-text-muted">{x(e.role)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={onAsk(e)}
                        aria-label={x(M.employees_ask_about_aria)}
                        className="flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-none bg-gold-bg text-gold-fg"
                      >
                        <Sparkle
                          size={14}
                          fill="currentColor"
                          strokeWidth={0}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span className={statusChipClass(e.tone)}>{x(e.status)}</span>
                      <span className="text-[12px] text-text-muted">
                        {x(e.province)} · {x(e.tenure)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
              <div className="mb-[4px] text-[14.5px] font-semibold text-text">
                {x(M.employees_no_results)}
              </div>
              <div className="mb-[14px] text-[13px] text-text-muted">
                {x(M.employees_no_results_sub)}
              </div>
              <button
                type="button"
                onClick={() => setFilter('')}
                className="cursor-pointer rounded-[8px] border border-(--accent-soft-border) bg-accent-soft px-[16px] py-[8px] font-sans text-[13px] font-semibold text-accent"
              >
                {x(M.employees_clear_filter)}
              </button>
            </div>
          )}
        </>
      )}

      {mode === 'org' && <OrgChart />}
    </AppPage>
  )
}
