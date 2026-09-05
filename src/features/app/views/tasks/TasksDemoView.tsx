import { useState } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { tasksMessages as M } from '@/i18n/messages/tasks'
import { cases, chats, taskPriorityLabels, taskPriorityTones, tasks } from '@/data'
import type { Task, Tone } from '@/data'
import { statusChipClass } from '@/components/chips'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { AppPage } from '@/features/app/shell/AppPage'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'

function linkedFor(task: Task): Bi | null {
  const linkedCase = cases.find((c) => c.chatId === task.chatId)
  if (linkedCase) return linkedCase.title
  const linkedChat = chats.find((c) => c.id === task.chatId)
  return linkedChat ? linkedChat.title : null
}

/** Northgate task checklist — demo workspace and public `/demo` only. */
export function TasksDemoView() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()
  const [doneById, setDoneById] = useState<Record<string, boolean>>({})

  const isDone = (task: Task) => doneById[task.id] ?? task.done
  const toggleTask = (task: Task) =>
    setDoneById((prev) => ({ ...prev, [task.id]: !(prev[task.id] ?? task.done) }))

  const openChat = (task: Task) => {
    navigate('/app/advisor', { state: { chatId: task.chatId } satisfies AdvisorSearchNavState })
  }

  const openCount = tasks.filter((task) => !isDone(task)).length

  return (
    <AppPage width="comfort">
      <div className="mb-[18px] text-[13px] text-text-muted">
        {openCount} {x(M.tasks_open_label)}
      </div>
      <div className="flex flex-col gap-[10px]">
        {tasks.map((task) => {
          const done = isDone(task)
          const linked = linkedFor(task)
          let statusTone: Tone = 'info'
          let statusLabel = M.tasks_status_open
          if (done) {
            statusTone = 'success'
            statusLabel = M.tasks_status_done
          } else if (task.blocked) {
            statusTone = 'warning'
            statusLabel = M.tasks_status_blocked
          }
          return (
            <div
              key={task.id}
              className="flex items-start gap-[12px] rounded-[11px] border border-border bg-surface px-[16px] py-[13px]"
            >
              <button
                type="button"
                onClick={() => toggleTask(task)}
                aria-label={x(M.tasks_toggle_aria)}
                aria-pressed={done}
                className={`relative flex h-[19px] w-[19px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] after:absolute after:inset-[-13px] after:content-[''] ${
                  done ? 'border-none bg-ok-fg' : 'border-[1.5px] border-border bg-surface'
                }`}
              >
                {done && (
                  <Check size={13} strokeWidth={3} className="text-white" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => openChat(task)}
                aria-label={x(M.tasks_open_chat_aria).replace('{title}', x(task.title))}
                className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left font-sans"
              >
                <div
                  className={`text-[13.5px] font-semibold ${
                    done ? 'text-text-faint line-through' : 'text-text'
                  }`}
                >
                  {x(task.title)}
                </div>
                <div className="mt-[3px] text-[12px] text-text-muted">
                  {x(task.due)} · {x(M.tasks_owner)}: {task.owner} · {x(task.jur)}
                </div>
                {linked && (
                  <div className="mt-[2px] text-[12px] text-text-muted">
                    {x(M.tasks_linked_prefix)}
                    {x(linked)}
                  </div>
                )}
                {task.blocked && (
                  <div className="mt-[4px] text-[12px] font-semibold text-warn-fg">
                    {x(task.blocked)}
                  </div>
                )}
                {task.evidence && (
                  <div className="mt-[4px] text-[12px] text-ok-fg">{x(task.evidence)}</div>
                )}
              </button>
              <div className="flex shrink-0 flex-col items-end gap-[6px]">
                <span className={statusChipClass(statusTone)}>{x(statusLabel)}</span>
                <span className={statusChipClass(taskPriorityTones[task.priority])}>
                  {x(taskPriorityLabels[task.priority])}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {tasks.length === 0 && (
        <div className="px-[20px] py-[48px] text-center text-text-muted">
          <div className="text-[14.5px] font-semibold text-text">{x(M.tasks_empty)}</div>
          <div className="mt-[4px] text-[13px]">{x(M.tasks_empty_sub)}</div>
        </div>
      )}
    </AppPage>
  )
}
