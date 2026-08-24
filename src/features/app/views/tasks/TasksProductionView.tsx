import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Check, ListChecks, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { tasksMessages as M } from '@/i18n/messages/tasks'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import {
  PRODUCTION_TASK_PRIORITIES,
  addTask,
  listTasks,
  removeTask,
  setTaskDone,
} from './productionApi'
import type { ProductionTask, ProductionTaskPriority } from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Tasks in production mode — the checklist on the backend's own
 * public.compliance_tasks table (no new schema: the table, its RLS and its
 * automation hooks already exist). Add / toggle done / remove; priority
 * chips reuse the demo checklist's visual language.
 */

const PRIORITY_LABEL: Record<ProductionTaskPriority, (typeof M)[keyof typeof M]> = {
  low: M.tasks_prod_priority_low,
  medium: M.tasks_prod_priority_medium,
  high: M.tasks_prod_priority_high,
  critical: M.tasks_prod_priority_critical,
}

const PRIORITY_TONE: Record<ProductionTaskPriority, 'neutral' | 'info' | 'warning' | 'risk'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'risk',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = { title: '', priority: 'medium' as ProductionTaskPriority, dueDate: '' }

export function TasksProductionView() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionTask[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      setRows(await listTasks(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.tasks_prod_empty_title)} />
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      const added = await addTask(organizationId, { ...form, title: form.title.trim() })
      setRows((prev) => [added, ...(prev ?? [])])
      setForm(EMPTY_FORM)
      setFormOpen(false)
      showToast(M.tasks_prod_added, 'ok')
    } catch {
      showToast(M.tasks_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onToggle = async (task: ProductionTask) => {
    const done = !task.done
    try {
      await setTaskDone(task.id, done)
      setRows((prev) =>
        (prev ?? []).map((r) =>
          r.id === task.id ? { ...r, done, status: done ? 'completed' : 'open' } : r,
        ),
      )
    } catch {
      showToast(M.tasks_prod_toggle_failed, 'info')
    }
  }

  const onRemove = async (task: ProductionTask) => {
    try {
      await removeTask(task.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== task.id))
      showToast(M.tasks_prod_removed, 'ok')
    } catch {
      showToast(M.tasks_prod_remove_failed, 'info')
    }
  }

  const openCount = rows?.filter((t) => !t.done).length ?? 0

  return (
    <AppPage width="comfort">
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
          <div className="text-[13px] text-text-muted">
            {rows === null ? x(M.tasks_prod_loading) : `${openCount} ${x(M.tasks_prod_count_open)}`}
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              {x(M.tasks_prod_add)}
            </button>
          )}
        </div>

        {loadFailed && (
          <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.tasks_prod_error)}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.tasks_prod_retry)}
            </button>
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
          >
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="task-title" className={labelClass}>
                  {x(M.tasks_prod_title_label)}
                </label>
                <input
                  id="task-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="task-priority" className={labelClass}>
                  {x(M.tasks_prod_priority)}
                </label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value as ProductionTaskPriority }))
                  }
                  className={inputClass}
                >
                  {PRODUCTION_TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {x(PRIORITY_LABEL[p])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-due" className={labelClass}>
                  {x(M.tasks_prod_due)}
                </label>
                <input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-[16px] flex gap-[8px]">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {x(M.tasks_prod_save)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  setForm(EMPTY_FORM)
                }}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
              >
                {x(M.tasks_prod_cancel)}
              </button>
            </div>
          </form>
        )}

        {rows !== null && rows.length === 0 && !loadFailed && !formOpen && (
          <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
            <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
              <ListChecks
                size={20}
                strokeWidth={1.7}
                className="text-text-muted"
                aria-hidden="true"
              />
            </div>
            <div className="mb-[6px] text-[15px] font-semibold text-text">
              {x(M.tasks_prod_empty_title)}
            </div>
            <p className="m-0 text-[13px] text-text-muted">{x(M.tasks_prod_empty_body)}</p>
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            {rows.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-[12px] rounded-[11px] border border-border bg-surface px-[16px] py-[13px]"
              >
                <button
                  type="button"
                  onClick={() => void onToggle(task)}
                  aria-label={x(M.tasks_toggle_aria)}
                  aria-pressed={task.done}
                  className={`relative flex h-[19px] w-[19px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] after:absolute after:inset-[-13px] after:content-[''] ${
                    task.done ? 'border-none bg-ok-fg' : 'border-[1.5px] border-border bg-surface'
                  }`}
                >
                  {task.done && (
                    <Check size={13} strokeWidth={3} className="text-white" aria-hidden="true" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13.5px] font-semibold ${
                      task.done ? 'text-text-faint line-through' : 'text-text'
                    }`}
                  >
                    {task.title}
                  </div>
                  {task.dueDate && (
                    <div className="mt-[3px] text-[12px] text-text-muted">{task.dueDate}</div>
                  )}
                </div>
                <span className={statusChipClass(PRIORITY_TONE[task.priority])}>
                  {x(PRIORITY_LABEL[task.priority])}
                </span>
                <button
                  type="button"
                  onClick={() => void onRemove(task)}
                  aria-label={`${x(M.tasks_prod_remove)} — ${task.title}`}
                  className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                >
                  <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
    </AppPage>
  )
}
