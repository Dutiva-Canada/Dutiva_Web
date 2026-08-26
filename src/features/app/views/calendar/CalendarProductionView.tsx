import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { calendarMessages as M } from '@/i18n/messages/calendar'
import { chipToneClass } from '@/components/chips'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { listCases } from '@/features/app/views/cases/productionApi'
import { listTasks } from '@/features/app/views/tasks/productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Calendar in production mode — the demo's month grid, rebuilt over the
 * real due dates of open cases and tasks (no table of its own; loads
 * through the modules' productionApi boundaries like Reports/Home). The
 * grid navigates month to month from today; chips and the deadline list
 * link to the owning module.
 */

interface Deadline {
  key: string
  title: string
  /** YYYY-MM-DD */
  date: string
  tone: 'info' | 'warning'
  to: string
}

interface MonthCursor {
  year: number
  monthIndex: number
}

type DayCell = { day: number | null; id: string }

function buildWeeks(cursor: MonthCursor): DayCell[][] {
  const firstDow = new Date(cursor.year, cursor.monthIndex, 1).getDay()
  const daysInMonth = new Date(cursor.year, cursor.monthIndex + 1, 0).getDate()
  let cellId = 0
  const cells: DayCell[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, id: `cell-${cellId++}` })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, id: `cell-${cellId++}` })
  while (cells.length % 7 !== 0) cells.push({ day: null, id: `cell-${cellId++}` })
  const weeks: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** YYYY-MM prefix for a cursor, matching the deadlines' date strings. */
function monthPrefix(cursor: MonthCursor): string {
  return `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}`
}

const DAY_LABELS: Bi[] = [
  M.calendar_d_sun,
  M.calendar_d_mon,
  M.calendar_d_tue,
  M.calendar_d_wed,
  M.calendar_d_thu,
  M.calendar_d_fri,
  M.calendar_d_sat,
]

export function CalendarProductionView() {
  const { x, lang } = useI18n()
  const { organizationId } = useWorkspaceMode()

  const now = new Date()
  const [cursor, setCursor] = useState<MonthCursor>({
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  })
  const [deadlines, setDeadlines] = useState<Deadline[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      const [cases, tasks] = await Promise.all([
        listCases(organizationId),
        listTasks(organizationId),
      ])
      setDeadlines([
        ...cases
          .filter((c) => c.status !== 'resolved' && c.dueDate !== null)
          .map((c) => ({
            key: `case-${c.id}`,
            title: c.title,
            date: c.dueDate ?? '',
            tone: 'info' as const,
            to: '/app/cases',
          })),
        ...tasks
          .filter((t) => !t.done && t.dueDate !== null)
          .map((t) => ({
            key: `task-${t.id}`,
            title: t.title,
            date: t.dueDate ?? '',
            tone: 'warning' as const,
            to: '/app/planning/tasks',
          })),
      ])
    } catch {
      setDeadlines([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const weeks = useMemo(() => buildWeeks(cursor), [cursor])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.calendar_prod_deadlines)} />
  }

  const monthLabel = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(cursor.year, cursor.monthIndex, 1))

  const prefix = monthPrefix(cursor)
  const monthDeadlines = (deadlines ?? [])
    .filter((d) => d.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date))

  const byDay = new Map<number, Deadline[]>()
  for (const d of monthDeadlines) {
    const day = Number(d.date.slice(8, 10))
    const list = byDay.get(day)
    if (list) list.push(d)
    else byDay.set(day, [d])
  }

  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.monthIndex === now.getMonth()
  const todayDay = isCurrentMonth ? now.getDate() : null

  const moveMonth = (delta: number) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.monthIndex + delta, 1)
      return { year: next.getFullYear(), monthIndex: next.getMonth() }
    })
  }

  return (
    <AppPage width="default">
        <div className="mb-[4px] flex items-center justify-between gap-[12px]">
          <div className="font-display text-[22px] font-semibold text-text capitalize">
            {monthLabel}
          </div>
          <div className="flex gap-[6px]">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label={x(M.calendar_prod_prev_month)}
              className="cursor-pointer rounded-[8px] border border-border bg-surface p-[7px] text-text-3"
            >
              <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label={x(M.calendar_prod_next_month)}
              className="cursor-pointer rounded-[8px] border border-border bg-surface p-[7px] text-text-3"
            >
              <ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mb-[18px] text-[12px] text-text-muted">
          {deadlines === null ? x(M.calendar_prod_loading) : x(M.calendar_prod_source_note)}
        </div>

        {loadFailed && (
          <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.calendar_prod_error)}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.calendar_prod_retry)}
            </button>
          </div>
        )}

        {/* Month grid — desktop/tablet only, matching the demo. */}
        <div className="hidden md:block">
          <div className="mb-[6px] grid grid-cols-7 gap-[8px]">
            {DAY_LABELS.map((label) => (
              <div key={label.en} className="text-center text-[11px] font-bold text-text-muted">
                {x(label)}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div
              key={week.map((c) => c.id).join('-')}
              className="mb-[8px] grid grid-cols-7 gap-[8px]"
            >
              {week.map((cell) =>
                cell.day === null ? (
                  <div key={cell.id} />
                ) : (
                  <div
                    key={cell.id}
                    className={`flex min-h-[76px] min-w-0 flex-col gap-[4px] overflow-hidden rounded-[9px] border px-[7px] py-[6px] ${
                      cell.day === todayDay
                        ? 'border-(--accent-soft-border) bg-accent-soft'
                        : 'border-border-soft bg-surface'
                    }`}
                  >
                    <div
                      className={`text-[12px] ${
                        cell.day === todayDay
                          ? 'font-bold text-accent'
                          : 'font-semibold text-text-2'
                      }`}
                    >
                      {cell.day}
                    </div>
                    {(byDay.get(cell.day) ?? []).map((d) => (
                      <Link
                        key={d.key}
                        to={d.to}
                        className={`inline-flex w-full overflow-hidden rounded-[100px] px-[10px] py-[3px] text-left font-sans text-[12px] leading-tight font-semibold text-ellipsis whitespace-nowrap ${chipToneClass(d.tone)}`}
                      >
                        {d.title}
                      </Link>
                    ))}
                  </div>
                ),
              )}
            </div>
          ))}
        </div>

        {/* Deadlines list (all viewports) */}
        <div className="mt-[24px]">
          <div className="mb-[10px] text-[13px] font-bold text-text-3">
            {x(M.calendar_prod_deadlines)}
          </div>
          {deadlines !== null && monthDeadlines.length === 0 && !loadFailed && (
            <div className="rounded-[10px] border border-border bg-surface px-[15px] py-[14px] text-[13px] text-text-muted">
              {x(M.calendar_prod_none_month)}
            </div>
          )}
          <div className="flex flex-col gap-[8px]">
            {monthDeadlines.map((d) => (
              <Link
                key={d.key}
                to={d.to}
                className="flex items-center gap-[12px] rounded-[10px] border border-border bg-surface px-[15px] py-[11px] text-left font-sans hover:bg-inset"
              >
                <span className="w-[80px] shrink-0 text-[12.5px] font-bold text-text-muted">
                  {d.date.slice(5)}
                </span>
                <span className="flex-1 truncate text-[13.5px] text-text">{d.title}</span>
              </Link>
            ))}
          </div>
        </div>
    </AppPage>
  )
}
