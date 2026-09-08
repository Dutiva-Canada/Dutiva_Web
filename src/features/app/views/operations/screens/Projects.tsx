import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsProject, OperationsProjectStatus } from '../data/types'

const STATUS_LABELS: Record<OperationsProjectStatus, keyof typeof M> = {
  planning: 'ops_project_status_planning',
  active: 'ops_project_status_active',
  on_hold: 'ops_project_status_on_hold',
  completed: 'ops_project_status_completed',
  cancelled: 'ops_project_status_cancelled',
}

const STATUS_TONE: Record<OperationsProjectStatus, 'warning' | 'success' | 'neutral' | 'neutral' | 'neutral'> = {
  planning: 'warning',
  active: 'success',
  on_hold: 'neutral',
  completed: 'success',
  cancelled: 'neutral',
}

function ProjectRow({ project }: { readonly project: OperationsProject }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{project.title}</div>
        <div className="text-[12px] text-text-muted">
          {project.start_date ? `${project.start_date}` : null}
          {project.target_date ? ` → ${project.target_date}` : null}
          {project.description ? ` · ${project.description}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[project.status])}>{x(M[STATUS_LABELS[project.status]])}</span>
    </div>
  )
}

export function Projects() {
  const { x } = useI18n()
  const { projects } = useOperationsData()

  if (projects.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </div>
  )
}
