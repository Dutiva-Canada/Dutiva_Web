import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import type { NewJobPosting } from './productionApi'

/**
 * Inline form for creating or editing a job posting. Follows the same
 * patterns as the candidate add form in HiringProductionView.
 */

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  title: '',
  department: '',
  location: '',
  type: '',
  description: '',
  status: 'draft' as string,
}

export interface JobPostingFormProps {
  /** Pre-fill the form when editing; omit for a fresh create form. */
  initial?: Partial<NewJobPosting>
  saving: boolean
  onSubmit: (values: NewJobPosting) => void
  onCancel: () => void
}

export function JobPostingForm({ initial, saving, onSubmit, onCancel }: JobPostingFormProps) {
  const { x } = useI18n()
  const [form, setForm] = useState(() => ({
    title: initial?.title ?? EMPTY_FORM.title,
    department: initial?.department ?? EMPTY_FORM.department,
    location: initial?.location ?? EMPTY_FORM.location,
    type: initial?.type ?? EMPTY_FORM.type,
    description: initial?.description ?? EMPTY_FORM.description,
    status: initial?.status ?? EMPTY_FORM.status,
  }))

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title.trim() || !form.department.trim() || saving) return
    onSubmit({
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      type: form.type.trim(),
      description: form.description.trim(),
      status: form.status,
    })
  }

  return (
    <form
      onSubmit={submit}
      className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
    >
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="posting-title" className={labelClass}>
            {x(M.hiring_posting_title)}
          </label>
          <input
            id="posting-title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="posting-department" className={labelClass}>
            {x(M.hiring_posting_department)}
          </label>
          <input
            id="posting-department"
            required
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="posting-location" className={labelClass}>
            {x(M.hiring_posting_location)}
          </label>
          <input
            id="posting-location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="posting-type" className={labelClass}>
            {x(M.hiring_posting_type)}
          </label>
          <input
            id="posting-type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="posting-status" className={labelClass}>
            {x(M.hiring_posting_status)}
          </label>
          <select
            id="posting-status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={inputClass}
          >
            <option value="draft">{x(M.hiring_posting_draft)}</option>
            <option value="active">{x(M.hiring_posting_active)}</option>
            <option value="closed">{x(M.hiring_posting_closed)}</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="posting-description" className={labelClass}>
            {x(M.hiring_posting_description)}
          </label>
          <textarea
            id="posting-description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
          {x(M.hiring_posting_save)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
        >
          {x(M.hiring_posting_cancel)}
        </button>
      </div>
    </form>
  )
}
