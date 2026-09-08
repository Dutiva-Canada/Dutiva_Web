import type { FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import type { CandidateWorkAuthorization } from '@/features/careers/data/candidateApi'
import { ResumeUpload } from './ResumeUpload'
import { CoverLetterUpload } from './CoverLetterUpload'
import { MarkdownEditor } from '@/components/MarkdownEditor'

export interface CandidateProfileFormValues {
  name: string
  email: string
  phone: string
  location: string
  headline: string
  summary: string
  resumeText: string
  coverLetter: string
  linkedin: string
  website: string
  currentRole: string
  yearsExperience: string
  workAuthorization: CandidateWorkAuthorization
}

interface CandidateProfileFormProps {
  values: CandidateProfileFormValues
  onChange: (values: CandidateProfileFormValues) => void
  onSubmit: (values: CandidateProfileFormValues) => void
  saving: boolean
}

const fieldClass =
  'h-[42px] w-full rounded-[10px] border border-border bg-bg px-[12px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const textareaClass =
  'w-full rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[5px] block text-[12.5px] font-semibold text-text-2'

/** The profile editor form, extracted so the page stays under the line budget. */
export function CandidateProfileForm({
  values,
  onChange,
  onSubmit,
  saving,
}: CandidateProfileFormProps) {
  const { x } = useI18n()
  const set = <K extends keyof CandidateProfileFormValues>(
    key: K,
    value: CandidateProfileFormValues[K],
  ) => onChange({ ...values, [key]: value })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
      <div>
        <h1 className="m-0 text-[22px] font-bold text-text">{x(M.careers_profile_title)}</h1>
        <p className="mt-[4px] text-[14px] text-text-muted">{x(M.careers_profile_subtitle)}</p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
          {/* Full name */}
          <div>
            <label className={labelClass} htmlFor="cp-name">
              {x(M.careers_profile_name)}
            </label>
            <input
              id="cp-name"
              type="text"
              required
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Email (read-only from session) */}
          <div>
            <label className={labelClass} htmlFor="cp-email">
              {x(M.careers_profile_email)}
            </label>
            <input
              id="cp-email"
              type="email"
              readOnly
              value={values.email}
              className={`${fieldClass} cursor-not-allowed opacity-70`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass} htmlFor="cp-phone">
              {x(M.careers_profile_phone)}
            </label>
            <input
              id="cp-phone"
              type="tel"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Location */}
          <div>
            <label className={labelClass} htmlFor="cp-location">
              {x(M.careers_profile_location)}
            </label>
            <input
              id="cp-location"
              type="text"
              required
              value={values.location}
              onChange={(e) => set('location', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Headline */}
          <div>
            <label className={labelClass} htmlFor="cp-headline">
              {x(M.careers_profile_headline)}
            </label>
            <input
              id="cp-headline"
              type="text"
              required
              value={values.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder={x(M.careers_profile_headline_placeholder)}
              className={fieldClass}
            />
          </div>

          {/* Current role */}
          <div>
            <label className={labelClass} htmlFor="cp-current-role">
              {x(M.careers_profile_current_role)}
            </label>
            <input
              id="cp-current-role"
              type="text"
              value={values.currentRole}
              onChange={(e) => set('currentRole', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Years of experience */}
          <div>
            <label className={labelClass} htmlFor="cp-years">
              {x(M.careers_profile_years_experience)}
            </label>
            <input
              id="cp-years"
              type="number"
              min={0}
              value={values.yearsExperience}
              onChange={(e) => set('yearsExperience', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Work authorization */}
          <div>
            <label className={labelClass} htmlFor="cp-auth">
              {x(M.careers_profile_work_authorization)}
            </label>
            <select
              id="cp-auth"
              value={values.workAuthorization}
              onChange={(e) => set('workAuthorization', e.target.value as CandidateWorkAuthorization)}
              className={fieldClass}
            >
              <option value="authorized">{x(M.careers_profile_work_auth_authorized)}</option>
              <option value="needs_sponsorship">{x(M.careers_profile_work_auth_sponsorship)}</option>
              <option value="unknown">{x(M.careers_profile_work_auth_unknown)}</option>
            </select>
          </div>

          {/* LinkedIn */}
          <div>
            <label className={labelClass} htmlFor="cp-linkedin">
              {x(M.careers_profile_linkedin)}
            </label>
            <input
              id="cp-linkedin"
              type="url"
              value={values.linkedin}
              onChange={(e) => set('linkedin', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Website */}
          <div>
            <label className={labelClass} htmlFor="cp-website">
              {x(M.careers_profile_website)}
            </label>
            <input
              id="cp-website"
              type="url"
              value={values.website}
              onChange={(e) => set('website', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Summary (full width) */}
        <div className="mt-[16px]">
          <label className={labelClass} htmlFor="cp-summary">
            {x(M.careers_profile_summary)}
          </label>
          <textarea
            id="cp-summary"
            rows={4}
            value={values.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder={x(M.careers_profile_summary_placeholder)}
            className={textareaClass}
          />
        </div>

        {/* Resume (full width) */}
        <div className="mt-[16px]">
          <label className={labelClass} htmlFor="cp-resume">
            {x(M.careers_profile_resume)}
          </label>
          <div className="mb-[12px]">
            <ResumeUpload values={values} onChange={onChange} />
          </div>
          <MarkdownEditor
            value={values.resumeText}
            onChange={(value) => set('resumeText', value)}
            messages={{
              bold: M.careers_profile_resume_format_bold,
              italic: M.careers_profile_resume_format_italic,
              heading: M.careers_profile_resume_format_heading,
              bulletList: M.careers_profile_resume_format_bullet_list,
              numberedList: M.careers_profile_resume_format_numbered_list,
              link: M.careers_profile_resume_format_link,
              hint: M.careers_profile_resume_markdown_hint,
              write: M.careers_profile_resume_write,
              preview: M.careers_profile_resume_preview,
            }}
            textareaProps={{
              id: 'cp-resume',
              rows: 8,
              placeholder: x(M.careers_profile_resume_placeholder),
              className: textareaClass,
            }}
          />
        </div>

        {/* Default cover letter (full width) */}
        <div className="mt-[16px]">
          <label className={labelClass} htmlFor="cp-cover-letter">
            {x(M.careers_profile_cover_letter)}
          </label>
          <div className="mb-[12px]">
            <CoverLetterUpload value={values.coverLetter} onChange={(value) => set('coverLetter', value)} />
          </div>
          <MarkdownEditor
            value={values.coverLetter}
            onChange={(value) => set('coverLetter', value)}
            messages={{
              bold: M.careers_profile_resume_format_bold,
              italic: M.careers_profile_resume_format_italic,
              heading: M.careers_profile_resume_format_heading,
              bulletList: M.careers_profile_resume_format_bullet_list,
              numberedList: M.careers_profile_resume_format_numbered_list,
              link: M.careers_profile_resume_format_link,
              hint: M.careers_profile_resume_markdown_hint,
              write: M.careers_profile_resume_write,
              preview: M.careers_profile_resume_preview,
            }}
            textareaProps={{
              id: 'cp-cover-letter',
              rows: 6,
              placeholder: x(M.careers_profile_cover_letter_placeholder),
              className: textareaClass,
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex h-[46px] cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60"
      >
        {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {saving ? x(M.careers_profile_saving) : x(M.careers_profile_save)}
      </button>
    </form>
  )
}
