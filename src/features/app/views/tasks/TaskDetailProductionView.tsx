import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Check, Handshake, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { tasksMessages as M } from '@/i18n/messages/tasks'
import { statusChipClass } from '@/components/chips'
import { Disclaimer } from '@/components/Disclaimer'
import { sendAdvisorMessage } from '@/features/app/advisor/chatApi'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { AppPage } from '@/features/app/shell/AppPage'
import { WorkspaceLink } from '@/features/app/workspaceRoot/WorkspaceLink'
import { addTaskNote, getTask, setTaskDone, updateTaskDescription } from './productionApi'
import type { ProductionTask, ProductionTaskPriority } from './productionApi'

/**
 * Task detail in production mode — one row of public.compliance_tasks. The
 * Advisor-authored plan lives in the row's own `description` column (written
 * by tasks.create's details param, or drafted here on demand through the
 * advisor-chat function and saved back). User notes append to the row's
 * jsonb metadata.notes — no new schema.
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

export function TaskDetailProductionView() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()
  const { taskId } = useParams<{ taskId: string }>()

  const [task, setTask] = useState<ProductionTask | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [draft, setDraft] = useState('')
  const [generating, setGenerating] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const load = useCallback(async () => {
    if (!taskId) return
    setLoadState('loading')
    try {
      setTask(await getTask(taskId))
      setLoadState('ready')
    } catch {
      setTask(null)
      setLoadState('failed')
    }
  }, [taskId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.tasks_prod_empty_title)} />
  }

  const onToggleDone = async () => {
    if (!task) return
    const done = !task.done
    try {
      await setTaskDone(task.id, done)
      setTask((prev) =>
        prev ? { ...prev, done, status: done ? 'completed' : 'open' } : prev,
      )
    } catch {
      showToast(M.tasks_prod_toggle_failed, 'info')
    }
  }

  /* On-demand plan: one advisor-chat turn, reply saved to the row's
     description column so the detail survives reloads and list views. */
  const onGenerate = async () => {
    if (!task || generating) return
    setGenerating(true)
    try {
      const result = await sendAdvisorMessage(
        x(M.tasks_detail_generate_prompt).replace('{title}', task.title),
        null,
        organizationId,
      )
      await updateTaskDescription(task.id, result.reply)
      setTask((prev) => (prev ? { ...prev, description: result.reply } : prev))
    } catch {
      showToast(M.tasks_detail_generate_failed, 'info')
    } finally {
      setGenerating(false)
    }
  }

  const onAddNote = async (e: SubmitEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!task || !text || savingNote) return
    setSavingNote(true)
    try {
      const note = await addTaskNote(task.id, text)
      setTask((prev) => (prev ? { ...prev, notes: [...prev.notes, note] } : prev))
      setDraft('')
    } catch {
      showToast(M.tasks_detail_note_failed, 'info')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <AppPage width="comfort">
      <WorkspaceLink
        to="/app/planning/tasks"
        className="mb-[14px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        {x(M.tasks_detail_back)}
      </WorkspaceLink>

      {loadState === 'loading' && (
        <div className="text-[13px] text-text-muted">{x(M.tasks_prod_loading)}</div>
      )}

      {loadState === 'failed' && (
        <div className="rounded-[11px] border border-border bg-surface px-[16px] py-[24px]">
          <span className="text-[13px] text-text-muted">{x(M.tasks_detail_load_failed)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="ml-[10px] cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.tasks_prod_retry)}
          </button>
        </div>
      )}

      {loadState === 'ready' && task && (
        <>
          <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
            <div className="flex flex-wrap items-start justify-between gap-[10px]">
              <h1
                className={`m-0 min-w-0 text-[17px] font-bold ${
                  task.done ? 'text-text-faint line-through' : 'text-text'
                }`}
              >
                {task.title}
              </h1>
              <div className="flex shrink-0 items-center gap-[6px]">
                <span className={statusChipClass(task.done ? 'success' : 'info')}>
                  {x(task.done ? M.tasks_status_done : M.tasks_status_open)}
                </span>
                <span className={statusChipClass(PRIORITY_TONE[task.priority])}>
                  {x(PRIORITY_LABEL[task.priority])}
                </span>
              </div>
            </div>
            <div className="mt-[8px] text-[12.5px] text-text-muted">
              {[
                task.dueDate,
                task.assignedTo ? `${x(M.tasks_owner)}: ${task.assignedTo}` : null,
                task.jurisdiction,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {/* Deal follow-up — the task was created from a pipeline row and
                metadata.deal_id is the link back. */}
            {task.linkedDealId && (
              <WorkspaceLink
                to="/app/finance/deals"
                className="mt-[8px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-accent hover:underline"
              >
                <Handshake size={13} strokeWidth={2} aria-hidden="true" />
                {x(M.tasks_detail_related_deal)}
              </WorkspaceLink>
            )}
            <button
              type="button"
              onClick={() => void onToggleDone()}
              className="mt-[12px] inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
            >
              <Check size={13} strokeWidth={2} aria-hidden="true" />
              {x(task.done ? M.tasks_detail_reopen : M.tasks_detail_mark_done)}
            </button>
          </div>

          <div className="mt-[14px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
            <div className="mb-[8px] flex flex-wrap items-center justify-between gap-[8px]">
              <div className="flex items-center gap-[6px] text-[12px] font-bold tracking-wide text-text-3 uppercase">
                <Sparkle size={13} strokeWidth={1.9} className="text-gold-fg" aria-hidden="true" />
                {x(M.tasks_detail_plan_title)}
              </div>
              <button
                type="button"
                disabled={generating}
                onClick={() => void onGenerate()}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[11px] py-[6px] font-sans text-[12px] font-semibold text-text hover:border-(--accent-soft-border) disabled:opacity-60"
              >
                {generating
                  ? x(M.tasks_detail_generating)
                  : x(task.description ? M.tasks_detail_regenerate : M.tasks_detail_generate)}
              </button>
            </div>
            <p className="m-0 text-[13.5px] leading-[1.65] whitespace-pre-wrap text-text-2">
              {task.description ?? x(M.tasks_detail_plan_empty)}
            </p>
            <Disclaimer variant="inline" className="mt-[10px]" />
          </div>

          <div className="mt-[14px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
            <div className="mb-[10px] text-[12px] font-bold tracking-wide text-text-3 uppercase">
              {x(M.tasks_detail_notes_title)}
            </div>
            {task.notes.length === 0 ? (
              <p className="m-0 mb-[10px] text-[13px] text-text-muted">
                {x(M.tasks_detail_notes_empty)}
              </p>
            ) : (
              <ul className="m-0 mb-[12px] flex list-none flex-col gap-[8px] p-0">
                {task.notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-[9px] border border-border-soft bg-inset px-[12px] py-[9px] text-[13px] leading-[1.55] text-text-2"
                  >
                    {note.text}
                    <div className="mt-[4px] text-[11px] text-text-faint">
                      {new Date(note.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={(e) => void onAddNote(e)} className="flex flex-col gap-[8px] sm:flex-row">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={x(M.tasks_detail_note_placeholder)}
                aria-label={x(M.tasks_detail_notes_title)}
                className="min-w-0 flex-1 rounded-[9px] border border-border bg-bg px-[12px] py-[9px] font-sans text-[13px] text-text"
              />
              <button
                type="submit"
                disabled={!draft.trim() || savingNote}
                className="cursor-pointer rounded-[9px] border-none bg-navy px-[14px] py-[9px] font-sans text-[12.5px] font-semibold text-white disabled:opacity-60"
              >
                {x(M.tasks_detail_note_add)}
              </button>
            </form>
          </div>
        </>
      )}
    </AppPage>
  )
}
