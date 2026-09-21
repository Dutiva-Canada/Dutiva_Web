import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str } from '@/features/app/agent/match'
import { PRODUCTION_TASK_PRIORITIES } from './productionApi'
import type { NewTask, ProductionTask, ProductionTaskPriority } from './productionApi'

/**
 * Tasks agent tools — the checklist seam (docs/AGENT_LAYER.md).
 *
 * `complete` sets done true — idempotent, never a toggle back — matching the
 * checklist's own check-off. `create` exists only where the seam can accept
 * new rows: the demo checklist renders fixtures only, so its binding leaves
 * `create` unset and the tool fails with an explicit reason rather than
 * writing a task the view could never show.
 */

const MODULE = 'tasks'
const moduleLabel = M.agent_tasks_module

/** Checklist row normalized for the tools — the view localizes titles. */
export interface TasksAgentRow {
  id: string
  title: string
  done: boolean
  priority?: string
  dueDate?: string | null
}

export interface TasksAgentContext {
  list(): readonly TasksAgentRow[]
  create?(fields: NewTask): Promise<ProductionTask>
  setDone?(id: string, done: boolean): Promise<void> | void
}

type TasksCtx = TasksAgentContext

const LIST_FILTERS = ['open', 'done', 'all'] as const
type ListFilter = (typeof LIST_FILTERS)[number]

function unavailable() {
  return {
    status: 'failed',
    code: 'module_unavailable',
    message: M.agent_err_capability_demo,
  } as const
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<TasksCtx>({
  id: 'tasks.list',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_tasks_list_label,
  description: M.agent_tasks_list_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: LIST_FILTERS,
      description: M.agent_tasks_p_status,
    },
  ],
  run: (tasks, params) => {
    const filter = (str(params, 'status') as ListFilter | undefined) ?? 'open'
    const items = tasks.list().filter((row) => filter === 'all' || (filter === 'done') === row.done)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_tasks_result_none }
    }
    const titles = items
      .slice(0, 5)
      .map((row) => `${row.title}${row.dueDate ? ` (${row.dueDate})` : ''}`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} task${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} tâche${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<TasksCtx>({
  id: 'tasks.create',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_tasks_create_label,
  description: M.agent_tasks_create_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_tasks_p_title,
      maxLength: 200,
    },
    {
      name: 'priority',
      type: 'enum',
      enum: PRODUCTION_TASK_PRIORITIES,
      description: M.agent_tasks_p_priority,
    },
    { name: 'dueDate', type: 'date', description: M.agent_tasks_p_due },
  ],
  run: async (tasks, params) => {
    if (!tasks.create) return unavailable()
    const created = await tasks.create({
      title: str(params, 'title') ?? '',
      priority: (str(params, 'priority') as ProductionTaskPriority | undefined) ?? 'medium',
      dueDate: str(params, 'dueDate') ?? '',
    })
    return ok(
      {
        en: `Task created — ${created.title}.`,
        fr: `Tâche créée — ${created.title}.`,
      },
      created.id,
    )
  },
})

defineTool<TasksCtx>({
  id: 'tasks.complete',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  label: M.agent_tasks_complete_label,
  description: M.agent_tasks_complete_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_tasks_p_match_title,
      maxLength: 200,
    },
  ],
  run: async (tasks, params) => {
    if (!tasks.setDone) return unavailable()
    const row = findByName(tasks.list(), str(params, 'title'), (r) => r.title)
    if (!row) {
      return {
        status: 'failed',
        code: 'invalid_params',
        message: M.agent_tasks_result_not_found,
      }
    }
    if (row.done) {
      return ok({
        en: `Already done — ${row.title}.`,
        fr: `Déjà terminée — ${row.title}.`,
      })
    }
    await tasks.setDone(row.id, true)
    return ok(
      {
        en: `Task done — ${row.title}.`,
        fr: `Tâche terminée — ${row.title}.`,
      },
      row.id,
    )
  },
})
