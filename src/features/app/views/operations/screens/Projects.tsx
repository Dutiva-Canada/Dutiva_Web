import { useState } from 'react'
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
  const { projects, addProject } = useOperationsData()
  const [show, setShow] = useState(false)

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<OperationsProjectStatus>('planning')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [description, setDescription] = useState('')

  const reset = () => {
    setTitle('')
    setStatus('planning')
    setStartDate('')
    setTargetDate('')
    setDescription('')
  }

  const onSubmit = async () => {
    const newProject: OperationsProject = {
      id: generateId(),
      organization_id: '',
      title,
      owner_id: null,
      status,
      start_date: startDate || null,
      target_date: targetDate || null,
      description: description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addProject(newProject)
    reset()
    setShow(false)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show ? M.ops_cancel : M.ops_add_project)}
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
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.ops_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.ops_save)}
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
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
