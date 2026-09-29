import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { getPublicJobPosting } from '@/features/careers/data/jobBoardApi'
import type { PublicJobPosting } from '@/features/careers/data/jobBoardApi'
import { getMyCandidateProfile } from '@/features/careers/data/candidateApi'
import type { CandidateProfile } from '@/features/careers/data/candidateApi'
import { hasApplied, submitApplication } from '@/features/careers/data/applicationsApi'
import { DuplicateApplicationError } from '@/features/careers/data/applicationsApi'
import { useCareersPath } from '@/features/careers/useCareersPath'
import { AiTools } from './AiTools'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { CoverLetterUpload } from './CoverLetterUpload'

type LoadState = 'loading' | 'ready' | 'failed'
/* form → confirm → submitted: submission is always a deliberate second
   click, never silent. */
type Phase = 'form' | 'confirm' | 'submitted'

const fieldClass =
  'w-full rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[5px] block text-[12.5px] font-semibold text-text-2'

function fill(template: Bi, name: string, value: string): Bi {
  return { en: template.en.replace(`{${name}}`, value), fr: template.fr.replace(`{${name}}`, value) }
}

/**
 * Apply-to-job page — combines the application form with optional AI tools.
 * Pre-checks: requires a candidate profile (guided completion returns here
 * via ?next=), and blocks if already applied. Submitting is a two-step
 * confirmation; the result is a rendered confirmation state, not just a
 * toast, and failures stay inline with a retry.
 */
export function ApplyToJobPage() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const location = useLocation()
  const paths = useCareersPath()
  const { postingId } = useParams<{ postingId: string }>()

  const [state, setState] = useState<LoadState>('loading')
  const [job, setJob] = useState<PublicJobPosting | null>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  const [coverLetter, setCoverLetter] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [aiMatchScore, setAiMatchScore] = useState<number | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [submitting, setSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)

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
      if (p) {
        setResumeText(p.resumeText)
        setCoverLetter(p.coverLetter ?? '')
      }
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [postingId])

  useEffect(() => {
    void load()
  }, [load])

  /* Step 1: validate the form, then move to the review/confirm panel. */
  const handleReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting || !resumeText.trim()) return
    setSubmitFailed(false)
    setPhase('confirm')
  }

  /* Step 2: the actual submission. Guarded against double-fire. */
  const handleConfirm = async () => {
    if (!postingId || submitting || phase !== 'confirm') return
    setSubmitting(true)
    setSubmitFailed(false)
    try {
      await submitApplication({
        jobPostingId: postingId,
        coverLetter: coverLetter.trim() || null,
        submittedResume: resumeText.trim(),
        aiMatchScore,
        aiSuggestions,
      })
      setPhase('submitted')
      showToast(M.careers_apply_submitted, 'ok')
    } catch (err) {
      // Unique constraint — a race or a stale tab double-submitted.
      if (err instanceof DuplicateApplicationError) {
        setAlreadyApplied(true)
        showToast(M.careers_apply_already_applied, 'info')
      } else {
        /* Inline error in the confirm panel — the candidate can retry
           without losing anything they typed. */
        setSubmitFailed(true)
      }
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
          to={paths.board}
          className="mt-[14px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:underline"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {x(M.careers_detail_back)}
        </Link>
      </div>
    )
  }

  /* Pre-check: no profile → guided completion that returns here via ?next=. */
  if (!profile) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return (
      <div className="flex flex-col gap-[16px]">
        <JobSummary job={job} />
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[40px] text-center">
          <p className="m-0 text-[14.5px] font-semibold text-text">
            {x(M.careers_apply_profile_required)}
          </p>
          <p className="mx-auto mt-[6px] max-w-[46ch] text-[13px] text-text-muted">
            {x(fill(M.careers_apply_profile_next_body, 'job', job.title))}
          </p>
          <Link
            to={`/careers/portal/profile?next=${next}`}
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

  /* Terminal state: the application is recorded — render a real
     confirmation panel with the obvious next actions. */
  if (phase === 'submitted') {
    return (
      <div className="flex flex-col gap-[16px]">
        <JobSummary job={job} />
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[40px] text-center">
          <CheckCircle2 size={28} className="mx-auto text-gold-strong" aria-hidden="true" />
          <p className="m-0 mt-[10px] text-[15px] font-semibold text-text">
            {x(M.careers_apply_submitted)}
          </p>
          <p className="mx-auto mt-[6px] max-w-[46ch] text-[13px] text-text-muted">
            {x(fill(M.careers_apply_submitted_body, 'employer', job.organizationName))}
          </p>
          <div className="mt-[16px] flex flex-wrap items-center justify-center gap-[10px]">
            <Link
              to="/careers/portal/applications"
              className="inline-flex items-center gap-[7px] rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[14px] font-semibold text-white no-underline"
            >
              {x(M.careers_applications_title)}
            </Link>
            <Link
              to={paths.board}
              className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:underline"
            >
              {x(M.careers_detail_back)}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <JobSummary job={job} />

      {phase === 'confirm' ? (
        /* Step 2 — review exactly what will be sent, then confirm. */
        <section
          aria-labelledby="apply-confirm-title"
          className="rounded-[12px] border border-border bg-surface p-[20px]"
        >
          <h2 id="apply-confirm-title" className="m-0 text-[16px] font-bold text-text">
            {x(M.careers_apply_confirm_title)}
          </h2>
          <p className="m-0 mt-[8px] max-w-[60ch] text-[13.5px] leading-[1.6] text-text-2">
            {x(fill(M.careers_apply_confirm_body, 'employer', job.organizationName))}
          </p>
          <ul className="m-0 mt-[12px] flex list-none flex-col gap-[6px] p-0 text-[13.5px] text-text-2">
            <li className="flex items-center gap-[8px]">
              <CheckCircle2 size={15} className="text-gold-strong" aria-hidden="true" />
              {x(M.careers_apply_confirm_resume)}
            </li>
            <li className="flex items-center gap-[8px]">
              {coverLetter.trim() ? (
                <CheckCircle2 size={15} className="text-gold-strong" aria-hidden="true" />
              ) : (
                <span
                  className="inline-block h-[15px] w-[15px] rounded-full border border-border"
                  aria-hidden="true"
                />
              )}
              {coverLetter.trim()
                ? x(M.careers_apply_confirm_cover_included)
                : x(M.careers_apply_confirm_cover_skipped)}
            </li>
            {aiMatchScore != null && (
              <li className="flex items-center gap-[8px]">
                <CheckCircle2 size={15} className="text-gold-strong" aria-hidden="true" />
                {x(M.careers_apply_confirm_score_included)}
              </li>
            )}
          </ul>
          {submitFailed && (
            <p
              role="alert"
              className="mt-[14px] flex items-center gap-[8px] rounded-[10px] border border-risk-border bg-risk-bg px-[12px] py-[10px] text-[13px] text-risk-fg"
            >
              <TriangleAlert size={15} aria-hidden="true" />
              {x(M.careers_apply_submit_error)}
            </p>
          )}
          <div className="mt-[16px] flex flex-wrap gap-[10px]">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex h-[46px] min-w-[180px] cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy px-[18px] text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? x(M.careers_apply_submitting) : x(M.careers_apply_confirm_submit)}
            </button>
            <button
              type="button"
              onClick={() => setPhase('form')}
              disabled={submitting}
              className="cursor-pointer rounded-[11px] border border-border bg-surface px-[18px] text-[14px] font-semibold text-text disabled:opacity-60"
            >
              {x(M.careers_apply_confirm_edit)}
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleReview} className="flex flex-col gap-[16px]">
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

          {/* AI tools sit inside the form above the submit button so candidates
              discover them before submitting — all their controls are type="button". */}
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

          <button
            type="submit"
            disabled={submitting || !resumeText.trim()}
            className="flex h-[46px] cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60"
          >
            {x(M.careers_apply_submit)}
          </button>
        </form>
      )}
    </div>
  )
}

/** Compact job posting summary shown at the top of the apply page. */
function JobSummary({ job }: { job: PublicJobPosting }) {
  const { x } = useI18n()
  const paths = useCareersPath()
  return (
    <div>
      <Link
        to={paths.jobDetail(job.slug)}
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
