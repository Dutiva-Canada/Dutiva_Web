import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import type { NewJobPosting } from './productionApi'

/**
 * Inline form for creating or editing a job posting. Follows the same
 * patterns as the candidate add form in HiringProductionView.
 *
 * The public-facing fields added by migration 0186 (salary, responsibilities,
 * benefits, employer blurb) are all optional — leaving them blank stores
 * null/empty and the public detail page simply hides those sections.
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
  requirements: '',
  responsibilities: '',
  benefits: '',
  salaryMin: '',
  salaryMax: '',
  salaryPeriod: 'year' as 'year' | 'hour',
  employerBlurb: '',
  status: 'draft' as string,
}

/** Blank line-separated textarea text → trimmed string[] for the API. */
function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseSalary(raw: string): number | null {
  const n = Number(raw.trim())
  return raw.trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

interface JobPostingFormProps {
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
    requirements: (initial?.requirements ?? []).join('\n'),
    responsibilities: (initial?.responsibilities ?? []).join('\n'),
    benefits: (initial?.benefits ?? []).join('\n'),
    salaryMin: initial?.salaryMin != null ? String(initial.salaryMin) : EMPTY_FORM.salaryMin,
    salaryMax: initial?.salaryMax != null ? String(initial.salaryMax) : EMPTY_FORM.salaryMax,
    salaryPeriod: initial?.salaryPeriod ?? EMPTY_FORM.salaryPeriod,
    employerBlurb: initial?.employerBlurb ?? EMPTY_FORM.employerBlurb,
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
      requirements: linesToList(form.requirements),
      responsibilities: linesToList(form.responsibilities),
      benefits: linesToList(form.benefits),
      salaryMin: parseSalary(form.salaryMin),
      salaryMax: parseSalary(form.salaryMax),
      salaryPeriod: form.salaryPeriod,
      employerBlurb: form.employerBlurb.trim() || null,
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
          <label htmlFor="posting-salary-min" className={labelClass}>
            {x(M.hiring_posting_salary_min)}
          </label>
          <input
            id="posting-salary-min"
            type="number"
            min={0}
            value={form.salaryMin}
            onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="posting-salary-max" className={labelClass}>
            {x(M.hiring_posting_salary_max)}
          </label>
          <input
            id="posting-salary-max"
            type="number"
            min={0}
            value={form.salaryMax}
            onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="posting-salary-period" className={labelClass}>
            {x(M.hiring_posting_salary_period)}
          </label>
          <select
            id="posting-salary-period"
            value={form.salaryPeriod}
            onChange={(e) =>
              setForm((f) => ({ ...f, salaryPeriod: e.target.value as 'year' | 'hour' }))
            }
            className={inputClass}
          >
            <option value="year">{x(M.hiring_posting_salary_per_year)}</option>
            <option value="hour">{x(M.hiring_posting_salary_per_hour)}</option>
          </select>
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
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="posting-responsibilities" className={labelClass}>
            {x(M.hiring_posting_responsibilities_label)}
          </label>
          <textarea
            id="posting-responsibilities"
            rows={3}
            value={form.responsibilities}
            placeholder={x(M.hiring_posting_list_hint)}
            onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="posting-requirements" className={labelClass}>
            {x(M.hiring_posting_requirements_label)}
          </label>
          <textarea
            id="posting-requirements"
            rows={3}
            value={form.requirements}
            placeholder={x(M.hiring_posting_list_hint)}
            onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="posting-benefits" className={labelClass}>
            {x(M.hiring_posting_benefits_label)}
          </label>
          <textarea
            id="posting-benefits"
            rows={3}
            value={form.benefits}
            placeholder={x(M.hiring_posting_list_hint)}
            onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="posting-employer-blurb" className={labelClass}>
            {x(M.hiring_posting_employer_blurb)}
          </label>
          <textarea
            id="posting-employer-blurb"
            rows={2}
            value={form.employerBlurb}
            onChange={(e) => setForm((f) => ({ ...f, employerBlurb: e.target.value }))}
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
