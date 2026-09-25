import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Check, MessageCircle, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { tasksMessages as M } from '@/i18n/messages/tasks'
import { cases, chats, taskPriorityLabels, taskPriorityTones, tasks } from '@/data'
import type { Task, Tone } from '@/data'
import { statusChipClass } from '@/components/chips'
import { Disclaimer } from '@/components/Disclaimer'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { AppPage } from '@/features/app/shell/AppPage'
import { WorkspaceLink } from '@/features/app/workspaceRoot/WorkspaceLink'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'

interface DemoNote {
  id: string
  text: string
  at: string
}

/* Demo notes persist per device so a note survives navigation during a demo
   session — same spirit as the checklist's local done state, but typed text
   vanishing on back-nav would make the feature look broken. */
const NOTES_KEY = 'dutiva-demo-task-notes'

function loadNotes(): Record<string, DemoNote[]> {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DemoNote[]>) : {}
  } catch {
    return {}
  }
}

function linkedFor(task: Task): Bi | null {
  const linkedCase = cases.find((c) => c.chatId === task.chatId)
  if (linkedCase) return linkedCase.title
  const linkedChat = chats.find((c) => c.id === task.chatId)
  return linkedChat ? linkedChat.title : null
}

/** Northgate task detail — fixture plan + per-device notes. `/demo` and demo mode. */
export function TaskDetailDemoView() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()
  const { taskId } = useParams<{ taskId: string }>()
  const task = tasks.find((t) => t.id === taskId)

  const [notesById, setNotesById] = useState<Record<string, DemoNote[]>>(loadNotes)
  const [draft, setDraft] = useState('')

  if (!task) {
    return (
      <AppPage width="comfort">
        <WorkspaceLink
          to="/app/planning/tasks"
          className="mb-[14px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {x(M.tasks_detail_back)}
        </WorkspaceLink>
        <div className="rounded-[11px] border border-border bg-surface px-[16px] py-[24px] text-[13px] text-text-muted">
          {x(M.tasks_detail_not_found)}
        </div>
      </AppPage>
    )
  }

  const linked = linkedFor(task)
  const notes = notesById[task.id] ?? []

  let statusTone: Tone = 'info'
  let statusLabel = M.tasks_status_open
  if (task.done) {
    statusTone = 'success'
    statusLabel = M.tasks_status_done
  } else if (task.blocked) {
    statusTone = 'warning'
    statusLabel = M.tasks_status_blocked
  }

  const openChat = () => {
    navigate('/app/advisor', { state: { chatId: task.chatId } satisfies AdvisorSearchNavState })
  }

  const addNote = (e: SubmitEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const note: DemoNote = { id: crypto.randomUUID(), text, at: new Date().toISOString() }
    setNotesById((prev) => {
      const next = { ...prev, [task.id]: [...(prev[task.id] ?? []), note] }
      try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(next))
      } catch {
        /* storage full/blocked — the in-memory note still renders */
      }
      return next
    })
    setDraft('')
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

      <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
        <div className="flex flex-wrap items-start justify-between gap-[10px]">
          <div className="flex min-w-0 items-start gap-[10px]">
            <span
              className={`mt-[3px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[6px] ${
                task.done ? 'bg-ok-fg' : 'border-[1.5px] border-border'
              }`}
              aria-hidden="true"
            >
              {task.done && <Check size={12} strokeWidth={3} className="text-white" />}
            </span>
            <h1
              className={`m-0 text-[17px] font-bold ${
                task.done ? 'text-text-faint line-through' : 'text-text'
              }`}
            >
              {x(task.title)}
            </h1>
          </div>
          <div className="flex shrink-0 gap-[6px]">
            <span className={statusChipClass(statusTone)}>{x(statusLabel)}</span>
            <span className={statusChipClass(taskPriorityTones[task.priority])}>
              {x(taskPriorityLabels[task.priority])}
            </span>
          </div>
        </div>
        <div className="mt-[8px] text-[12.5px] text-text-muted">
          {x(task.due)} · {x(M.tasks_owner)}: {task.owner} · {x(task.jur)}
        </div>
        {task.blocked && (
          <div className="mt-[6px] text-[12.5px] font-semibold text-warn-fg">
            {x(task.blocked)}
          </div>
        )}
        {task.evidence && (
          <div className="mt-[6px] text-[12.5px] text-ok-fg">{x(task.evidence)}</div>
        )}
        {linked && (
          <div className="mt-[6px] text-[12.5px] text-text-muted">
            {x(M.tasks_linked_prefix)}
            {x(linked)}
          </div>
        )}
        <button
          type="button"
          onClick={openChat}
          className="mt-[12px] inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
        >
          <MessageCircle size={13} strokeWidth={1.9} aria-hidden="true" />
          {x(M.tasks_detail_linked_chat)}
        </button>
      </div>

      <div className="mt-[14px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
        <div className="mb-[8px] flex items-center gap-[6px] text-[12px] font-bold tracking-wide text-text-3 uppercase">
          <Sparkle size={13} strokeWidth={1.9} className="text-gold-fg" aria-hidden="true" />
          {x(M.tasks_detail_plan_title)}
        </div>
        <p className="m-0 text-[13.5px] leading-[1.65] text-text-2">
          {task.detail ? x(task.detail) : x(M.tasks_detail_plan_empty)}
        </p>
        <Disclaimer variant="inline" className="mt-[10px]" />
      </div>

      <div className="mt-[14px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
        <div className="mb-[10px] text-[12px] font-bold tracking-wide text-text-3 uppercase">
          {x(M.tasks_detail_notes_title)}
        </div>
        {notes.length === 0 ? (
          <p className="m-0 mb-[10px] text-[13px] text-text-muted">
            {x(M.tasks_detail_notes_empty)}
          </p>
        ) : (
          <ul className="m-0 mb-[12px] flex list-none flex-col gap-[8px] p-0">
            {notes.map((note) => (
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
        <form onSubmit={addNote} className="flex flex-col gap-[8px] sm:flex-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={x(M.tasks_detail_note_placeholder)}
            aria-label={x(M.tasks_detail_notes_title)}
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-bg px-[12px] py-[9px] font-sans text-[13px] text-text"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="cursor-pointer rounded-[9px] border-none bg-navy px-[14px] py-[9px] font-sans text-[12.5px] font-semibold text-white disabled:opacity-60"
          >
            {x(M.tasks_detail_note_add)}
          </button>
        </form>
      </div>
    </AppPage>
  )
}
