import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { getPublicJobPosting } from '@/features/careers/data/jobBoardApi'
import type { PublicJobPosting } from '@/features/careers/data/jobBoardApi'
import { getMyCandidateProfile } from '@/features/careers/data/candidateApi'
import type { CandidateProfile } from '@/features/careers/data/candidateApi'
import { hasApplied, submitApplication } from '@/features/careers/data/applicationsApi'
import { AiTools } from './AiTools'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { CoverLetterUpload } from './CoverLetterUpload'

type LoadState = 'loading' | 'ready' | 'failed'

const fieldClass =
  'w-full rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[5px] block text-[12.5px] font-semibold text-text-2'

/**
 * Apply-to-job page — combines the application form with optional AI tools.
 * Pre-checks: requires a candidate profile, and blocks if already applied.
 * On submit, redirects to the applications list.
 */
export function ApplyToJobPage() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const navigate = useNavigate()
  const { postingId } = useParams<{ postingId: string }>()

  const [state, setState] = useState<LoadState>('loading')
  const [job, setJob] = useState<PublicJobPosting | null>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  const [coverLetter, setCoverLetter] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [aiMatchScore, setAiMatchScore] = useState<number | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!postingId) return
    setState('loading')
    try {
      const [j, p, applied] = await Promise.all([
        getPublicJobPosting(postingId),
        getMyCandidateProfile(),
        hasApplied(postingId),
      ])
      setJob(j)
      setProfile(p)
      setAlreadyApplied(applied)
      if (p) setResumeText(p.resumeText)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [postingId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!postingId || submitting) return
    setSubmitting(true)
    try {
      await submitApplication({
        jobPostingId: postingId,
        coverLetter: coverLetter.trim() || null,
        submittedResume: resumeText.trim(),
        aiMatchScore,
        aiSuggestions,
      })
      showToast(M.careers_apply_submitted, 'ok')
      navigate('/careers/portal/applications')
    } catch {
      showToast(M.careers_apply_submit_error, 'info')
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-[8px] text-[14px] text-text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {x(M.careers_loading)}
      </div>
    )
  }

  if (state === 'failed' || !job) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.careers_detail_not_found)}
        </div>
        <p className="m-0 text-[13px] text-text-muted">{x(M.careers_detail_not_found_body)}</p>
        <Link
          to="/careers"
          className="mt-[14px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:underline"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {x(M.careers_detail_back)}
        </Link>
      </div>
    )
  }

  /* Pre-check: no profile → show "complete your profile" message. */
  if (!profile) {
    return (
      <div className="flex flex-col gap-[16px]">
        <JobSummary job={job} />
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[40px] text-center">
          <p className="m-0 text-[14.5px] font-semibold text-text">
            {x(M.careers_apply_profile_required)}
          </p>
          <Link
            to="/careers/portal/profile"
            className="mt-[16px] inline-flex items-center gap-[7px] rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[14px] font-semibold text-white no-underline"
          >
            {x(M.careers_apply_profile_required_cta)}
          </Link>
        </div>
      </div>
    )
  }

  /* Pre-check: already applied → show "already applied" message. */
  if (alreadyApplied) {
    return (
      <div className="flex flex-col gap-[16px]">
        <JobSummary job={job} />
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[40px] text-center">
          <p className="m-0 text-[14.5px] font-semibold text-text">
            {x(M.careers_apply_already_applied)}
          </p>
          <Link
            to="/careers/portal/applications"
            className="mt-[14px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:underline"
          >
            {x(M.careers_applications_title)}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <JobSummary job={job} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h2 className="m-0 text-[16px] font-bold text-text">{x(M.careers_apply_subtitle)}</h2>

          <div className="mt-[16px]">
            <label className={labelClass} htmlFor="apply-cover-letter">
              {x(M.careers_apply_cover_letter)}
            </label>
            <div className="mb-[12px]">
              <CoverLetterUpload value={coverLetter} onChange={setCoverLetter} />
            </div>
            <MarkdownEditor
              value={coverLetter}
              onChange={setCoverLetter}
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
                id: 'apply-cover-letter',
                rows: 6,
                placeholder: x(M.careers_apply_cover_letter_placeholder),
                className: fieldClass,
              }}
            />
          </div>

          <div className="mt-[16px]">
            <label className={labelClass} htmlFor="apply-resume">
              {x(M.careers_apply_resume)}
            </label>
            <MarkdownEditor
              value={resumeText}
              onChange={setResumeText}
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
                id: 'apply-resume',
                rows: 10,
                required: true,
                className: fieldClass,
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !resumeText.trim()}
          className="flex h-[46px] cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {submitting ? x(M.careers_apply_submitting) : x(M.careers_apply_submit)}
        </button>
      </form>

      <AiTools
        resumeText={resumeText || profile.resumeText}
        jobTitle={job.title}
        jobDescription={job.description}
        requirements={job.requirements}
        candidateName={profile.name}
        onUseTailoredResume={(text) => setResumeText(text)}
        onUseCoverLetter={(text) => setCoverLetter(text)}
        onMatchScored={(score, suggestions) => {
          setAiMatchScore(score)
          setAiSuggestions(suggestions)
        }}
      />
    </div>
  )
}

/** Compact job posting summary shown at the top of the apply page. */
function JobSummary({ job }: { job: PublicJobPosting }) {
  const { x } = useI18n()
  return (
    <div>
      <Link
        to={`/careers/jobs/${job.id}`}
        className="mb-[10px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        {x(M.careers_apply_back)}
      </Link>
      <h1 className="m-0 text-[22px] font-bold text-text">
        {x(M.careers_apply_title)} {job.title}
      </h1>
      <div className="mt-[4px] flex flex-wrap gap-[10px] text-[13px] text-text-muted">
        <span>{job.department}</span>
        <span aria-hidden="true">·</span>
        <span>{job.location}</span>
        <span aria-hidden="true">·</span>
        <span>{job.type}</span>
      </div>
    </div>
  )
}
