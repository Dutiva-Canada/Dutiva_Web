import { useEffect, useState } from 'react'
import { Check, Square, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { ProductionEmployee, ProductionOnboardingTask } from './productionApi'
import { addOnboardingTask, listEmployeeOnboardingTasks, removeOnboardingTask, toggleOnboardingTask } from './productionApi'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function OnboardingTasks({
  employee,
  organizationId,
  roster,
  isOrgAdmin,
}: {
  readonly employee: ProductionEmployee
  readonly organizationId: string
  readonly roster: ProductionEmployee[]
  readonly isOrgAdmin: boolean
}) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [tasks, setTasks] = useState<ProductionOnboardingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listEmployeeOnboardingTasks(employee.id)
      .then((data) => {
        if (!cancelled) setTasks(data)
      })
      .catch(() => showToast(M.employees_prod_onboarding_load_failed, 'info'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [employee.id, showToast])

  const reset = () => {
    setTitle('')
    setDueDate('')
    setAssigneeId('')
    setNotes('')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const added = await addOnboardingTask(organizationId, employee.id, {
        title: title.trim(),
        dueDate: dueDate || null,
        assigneeId: assigneeId || undefined,
        notes: notes.trim(),
      })
      setTasks((prev) =>
        [...prev, added].sort((a, b) => Number(a.completed) - Number(b.completed) || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
      )
      reset()
      showToast(M.employees_prod_onboarding_added, 'ok')
    } catch {
      showToast(M.employees_prod_onboarding_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onToggle = async (task: ProductionOnboardingTask) => {
    try {
      await toggleOnboardingTask(task.id, !task.completed)
      setTasks((prev) =>
        prev
          .map((t) => (t.id === task.id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : new Date().toISOString() } : t))
          .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
      )
      showToast(M.employees_prod_onboarding_updated, 'ok')
    } catch {
      showToast(M.employees_prod_onboarding_update_failed, 'info')
    }
  }

  const onRemove = async (id: string) => {
    try {
      await removeOnboardingTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      showToast(M.employees_prod_onboarding_removed, 'ok')
    } catch {
      showToast(M.employees_prod_onboarding_remove_failed, 'info')
    }
  }

  return (
    <div className="space-y-[14px]">
      <div className="mb-[12px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
        {x(M.employees_prod_onboarding_title)}
      </div>

      {loading ? (
        <div className="text-[13px] text-text-muted">{x(M.employees_prod_loading)}</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.employees_prod_onboarding_empty)}</p>
        </div>
      ) : (
        <div className="mb-[14px] overflow-hidden rounded-[12px] border border-border bg-surface">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-start justify-between gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
            >
              <div className="flex min-w-0 flex-1 items-start gap-[10px]">
                <button
                  type="button"
                  onClick={() => void onToggle(task)}
                  className="mt-[2px] shrink-0 border-none bg-transparent p-0 text-text-muted"
                  aria-label={task.completed ? x(M.employees_prod_onboarding_mark_incomplete) : x(M.employees_prod_onboarding_mark_complete)}
                >
                  {task.completed ? (
                    <Check size={18} strokeWidth={1.7} aria-hidden="true" className="text-navy" />
                  ) : (
                    <Square size={18} strokeWidth={1.7} aria-hidden="true" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-[13.5px] font-semibold ${task.completed ? 'text-text-3 line-through' : 'text-text'}`}>
                    {task.title}
                  </div>
                  <div className="mt-[2px] text-[12px] text-text-muted">
                    {task.dueDate ? `${x(M.employees_prod_onboarding_due)} ${task.dueDate}` : x(M.employees_prod_onboarding_no_due)}
                    {task.assigneeName ? ` · ${task.assigneeName}` : null}
                  </div>
                  {task.notes ? (
                    <div className={`mt-[6px] text-[13px] leading-relaxed ${task.completed ? 'text-text-3' : 'text-text-2'}`}>{task.notes}</div>
                  ) : null}
                </div>
              </div>
              {isOrgAdmin && (
                <button
                  type="button"
                  onClick={() => void onRemove(task.id)}
                  className="shrink-0 border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                  aria-label={x(M.employees_prod_onboarding_remove)}
                >
                  <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOrgAdmin && (
        <form onSubmit={(e) => void onSubmit(e)} className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.employees_prod_onboarding_task)}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={x(M.employees_prod_onboarding_task_placeholder)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.employees_prod_onboarding_due)}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.employees_prod_onboarding_assignee)}</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={inputClass}
              >
                <option value="">{x(M.employees_prod_reviewer_unset)}</option>
                {roster.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.employees_prod_notes)}</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {x(M.employees_prod_onboarding_add)}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
