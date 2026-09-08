import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsProject, OperationsProjectStatus } from '../data/types'

const STATUSES: OperationsProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'cancelled']

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

function generateId() {
  return `op-${Math.random().toString(36).slice(2, 9)}`
}

function emptyProject(): OperationsProject {
  return {
    id: generateId(),
    organization_id: '',
    title: '',
    owner_id: null,
    status: 'planning',
    start_date: null,
    target_date: null,
    description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function ProjectRow({
  project,
  onEdit,
  onRemove,
}: {
  readonly project: OperationsProject
  readonly onEdit: (project: OperationsProject) => void
  readonly onRemove: (id: string) => void
}) {
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
      <div className="flex items-center gap-[10px]">
        <span className={statusChipClass(STATUS_TONE[project.status])}>{x(M[STATUS_LABELS[project.status]])}</span>
        <button
          type="button"
          onClick={() => onEdit(project)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.ops_edit)}
        </button>
        <button
          type="button"
          onClick={() => onRemove(project.id)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.ops_remove)}
        </button>
      </div>
    </div>
  )
}

export function Projects() {
  const { x } = useI18n()
  const { projects, addProject, updateProject, removeProject } = useOperationsData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<OperationsProject | null>(null)

  const initial = editing ?? emptyProject()
  const [title, setTitle] = useState(initial.title)
  const [status, setStatus] = useState<OperationsProjectStatus>(initial.status)
  const [startDate, setStartDate] = useState(initial.start_date ?? '')
  const [targetDate, setTargetDate] = useState(initial.target_date ?? '')
  const [description, setDescription] = useState(initial.description ?? '')

  useEffect(() => {
    const base = editing ?? emptyProject()
    setTitle(base.title)
    setStatus(base.status)
    setStartDate(base.start_date ?? '')
    setTargetDate(base.target_date ?? '')
    setDescription(base.description ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyProject()
    setTitle(base.title)
    setStatus(base.status)
    setStartDate(base.start_date ?? '')
    setTargetDate(base.target_date ?? '')
    setDescription(base.description ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const project: OperationsProject = {
      ...(editing ?? emptyProject()),
      title,
      status,
      start_date: startDate || null,
      target_date: targetDate || null,
      description: description || null,
      updated_at: now,
    }
    if (editing) {
      await updateProject(project)
    } else {
      await addProject({ ...project, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.ops_cancel : M.ops_add_project)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.ops_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.ops_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as OperationsProjectStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_start_date)}>
            <FormInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_target_date)}>
            <FormInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_description)} className="sm:col-span-2">
            <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.ops_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.ops_save_changes : M.ops_save)}
            </button>
          </div>
        </div>
      ) : null}

      {projects.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onEdit={(p) => { setEditing(p); setShow(true) }}
              onRemove={(id) => removeProject(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
