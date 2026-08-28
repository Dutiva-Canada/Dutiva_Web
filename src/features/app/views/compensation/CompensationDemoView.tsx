import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import { compChanges, compEquityCard, employeeDetails, employees } from '@/data'
import type { Employee } from '@/data'
import { statusChipClass } from '@/components/chips'
import { money } from '@/lib/money'
import { useRail } from '@/features/app/rail/railContext'
import { usePayRail } from '@/features/app/rail/useEntityRails'
import { compensationMessages as M } from '@/i18n/messages/compensation'
import { AppPage } from '@/features/app/shell/AppPage'

interface CompRow {
  employee: Employee
  salary: number | null
  market: number | null
  band: string
  delta: number
}

const rows: CompRow[] = employees.map((employee) => {
  const det = employeeDetails[employee.id]
  const delta =
    det?.salary && det.market ? Math.round(((det.salary - det.market) / det.market) * 100) : 0
  return {
    employee,
    salary: det ? det.salary : null,
    market: det ? det.market : null,
    band: det ? det.band : '—',
    delta,
  }
})

const totalPayroll = rows.reduce((sum, row) => sum + (row.salary ?? 0), 0)
const belowMarketCount = rows.filter((row) => row.delta < -4).length

const GRID_COLS = 'grid-cols-[2.2fr_1.6fr_0.9fr_1.1fr_1fr_34px]'

/** Northgate compensation fixtures — demo workspace and public `/demo` only. */
export function CompensationDemoView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { openRail } = useRail()

  const openCompensationTab = (employeeId: string) => {
    navigate(`/app/employees/${employeeId}`, { state: { tab: 'compensation' } })
  }

  const reviewChange = (change: (typeof compChanges)[number]) => {
    openRail(change.title, {
      text: M.comp_change_review_intro,
      cards: [
        {
          tone: change.tone,
          title: change.status,
          body: bi(
            `${change.note.en} ${M.comp_change_review_suffix.en}`,
            `${change.note.fr} ${M.comp_change_review_suffix.fr}`,
          ),
          citations: [{ label: M.comp_pay_equity_citation }],
        },
      ],
    })
  }

  const openPayRail = usePayRail()

  const onAsk = (e: MouseEvent, row: CompRow) => {
    e.stopPropagation()
    openPayRail(row.employee.id)
  }

  return (
    <AppPage width="default">
      <div className="mb-[18px] flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[14px] py-[11px]">
        <Lock
          size={14}
          strokeWidth={1.8}
          className="mt-px shrink-0 text-gold-fg"
          aria-hidden="true"
        />
        <span className="text-[12.5px] leading-[1.55] font-semibold text-gold-fg">
          {x(M.comp_banner)}
        </span>
      </div>

      <div className="mb-[22px] flex flex-wrap gap-[14px]">
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="font-display text-[26px] font-bold text-text">
            ${Math.round(totalPayroll / 1000)}K
          </div>
          <div className="mt-[2px] text-[12.5px] text-text-muted">{x(M.comp_annual_payroll)}</div>
        </div>
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="font-display text-[26px] font-bold text-gold-dot">{belowMarketCount}</div>
          <div className="mt-[2px] text-[12.5px] text-text-muted">{x(M.comp_below_midpoint)}</div>
        </div>
        <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="font-display text-[26px] font-bold text-text">{rows.length}</div>
          <div className="mt-[2px] text-[12.5px] text-text-muted">{x(M.comp_people)}</div>
        </div>
      </div>

      <div className="mb-[24px]">
        <div className="mb-[12px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
          {x(M.comp_changes_label)}
        </div>
        <div className="flex flex-col gap-[10px]">
          {compChanges.map((change) => (
            <div
              key={change.id}
              className="rounded-[12px] border border-border bg-surface px-[17px] py-[15px]"
            >
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-text">{x(change.title)}</div>
                  <div className="mt-[3px] text-[12.5px] text-text-3">{x(change.detail)}</div>
                  <div className="mt-[3px] text-[12px] text-text-muted">
                    {x(M.comp_requested_by)} · {change.requestedBy}
                  </div>
                </div>
                <span className={statusChipClass(change.tone)}>{x(change.status)}</span>
              </div>
              <div className="mt-[8px] text-[12.5px] leading-normal text-text-3">{x(change.note)}</div>
              <button
                type="button"
                onClick={() => reviewChange(change)}
                className="mt-[10px] cursor-pointer rounded-[8px] border-none bg-accent-soft px-[12px] py-[6px] font-sans text-[12px] font-semibold text-accent"
              >
                {x(M.comp_review_with_advisor)}
              </button>
            </div>
          ))}
          <div className="rounded-[12px] border border-gold-border bg-gold-bg px-[17px] py-[15px]">
            <div className="text-[13px] font-bold text-gold-fg">{x(compEquityCard.title)}</div>
            <div className="mt-[5px] text-[12.5px] leading-[1.55] text-gold-fg">
              {x(compEquityCard.body)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-[12px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
        {x(M.comp_overview_label)}
      </div>

      <div className="flex flex-col gap-[10px] md:hidden">
        {rows.map((row) => (
          <div
            key={row.employee.id}
            className="flex items-center gap-[12px] rounded-[11px] border border-border bg-surface px-[14px] py-[13px]"
          >
            <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
              {row.employee.initials}
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                aria-label={`${x(M.comp_open_aria)} ${row.employee.name}`}
                onClick={(ev) => {
                  ev.stopPropagation()
                  openCompensationTab(row.employee.id)
                }}
                className="block w-full cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left font-sans text-[13.5px] font-semibold text-ellipsis whitespace-nowrap text-text"
              >
                {row.employee.name}
              </button>
              <div className="mt-[2px] text-[12px] text-text-muted">
                {row.band} · {row.salary !== null ? x(money(row.salary)) : '—'}
              </div>
            </div>
            <span className={statusChipClass(row.delta < -4 ? 'warning' : 'success')}>
              {row.delta >= 0 ? '+' : ''}
              {row.delta}%
            </span>
            <button
              type="button"
              onClick={(e) => onAsk(e, row)}
              aria-label={x(M.comp_ask_aria)}
              className="flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-none bg-gold-bg"
            >
              <Sparkle
                size={13}
                strokeWidth={0}
                fill="currentColor"
                className="text-gold-fg"
                aria-hidden="true"
              />
            </button>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[12px] border border-border bg-surface md:block">
        <div
          className={`grid ${GRID_COLS} gap-[10px] bg-inset px-[16px] py-[11px] text-[11.5px] font-bold tracking-[0.03em] text-text-muted uppercase`}
        >
          <div>{x(M.comp_th_name)}</div>
          <div>{x(M.comp_th_role)}</div>
          <div>{x(M.comp_th_band)}</div>
          <div>{x(M.comp_th_base)}</div>
          <div>{x(M.comp_th_vs_market)}</div>
          <div />
        </div>
        {rows.map((row) => (
          <div
            key={row.employee.id}
            className={`grid ${GRID_COLS} items-center gap-[10px] border-t border-inset px-[16px] py-[12px]`}
          >
            <div className="flex min-w-0 items-center gap-[10px]">
              <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                {row.employee.initials}
              </div>
              <button
                type="button"
                aria-label={`${x(M.comp_open_aria)} ${row.employee.name}`}
                onClick={(ev) => {
                  ev.stopPropagation()
                  openCompensationTab(row.employee.id)
                }}
                className="cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left font-sans text-[13.5px] font-semibold text-ellipsis whitespace-nowrap text-text"
              >
                {row.employee.name}
              </button>
            </div>
            <div className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-text-2">
              {x(row.employee.role)}
            </div>
            <div className="text-[13px] text-text-2">{row.band}</div>
            <div className="text-[13px] font-semibold text-text">
              {row.salary !== null ? x(money(row.salary)) : '—'}
            </div>
            <div>
              <span className={statusChipClass(row.delta < -4 ? 'warning' : 'success')}>
                {row.delta >= 0 ? '+' : ''}
                {row.delta}%
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => onAsk(e, row)}
              aria-label={x(M.comp_ask_aria)}
              className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-gold-bg"
            >
              <Sparkle
                size={13}
                strokeWidth={0}
                fill="currentColor"
                className="text-gold-fg"
                aria-hidden="true"
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-[14px] text-[11px] text-text-faint">{x(M.comp_separation_note)}</div>
    </AppPage>
  )
}
