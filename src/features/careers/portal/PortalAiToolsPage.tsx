import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, ClipboardPaste, Loader2, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { getMyCandidateProfile } from '@/features/careers/data/candidateApi'
import type { CandidateProfile } from '@/features/careers/data/candidateApi'
import { listMyApplications } from '@/features/careers/data/applicationsApi'
import type { CandidateApplication } from '@/features/careers/data/applicationsApi'
import { getPublicJobPosting } from '@/features/careers/data/jobBoardApi'
import { AiTools } from './AiTools'

type LoadState = 'loading' | 'ready' | 'failed'

interface JobContext {
  jobTitle: string
  jobDescription: string
  requirements: string[]
}

const fieldClass =
  'w-full rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[5px] block text-[12.5px] font-semibold text-text-2'

/**
 * Standalone AI-tools page. The apply page embeds the same tools per posting;
 * here the candidate picks the job context themselves — one of their
 * applications (full posting fetched from the public view) or a pasted job
 * description — so the tools stay reachable even when the board has no open
 * postings. Accepted outputs copy to the clipboard rather than filling a form.
 */
export function PortalAiToolsPage() {
  const { x } = useI18n()
  const { showToast } = useToasts()

  const [state, setState] = useState<LoadState>('loading')
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [applications, setApplications] = useState<CandidateApplication[]>([])

  const [context, setContext] = useState<JobContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [closedPosting, setClosedPosting] = useState(false)

  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteDescription, setPasteDescription] = useState('')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const [p, a] = await Promise.all([getMyCandidateProfile(), listMyApplications()])
      setProfile(p)
      setApplications(a)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pickApplication = async (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId)
    if (!app) return
    setLoadingContext(true)
    setClosedPosting(false)
    try {
      const posting = await getPublicJobPosting(app.jobPostingId)
      if (!posting) {
        setClosedPosting(true)
        setContext(null)
        return
      }
      setContext({
        jobTitle: posting.title,
        jobDescription: posting.description,
        requirements: posting.requirements,
      })
    } catch {
      setClosedPosting(true)
      setContext(null)
    } finally {
      setLoadingContext(false)
    }
  }

  const usePasted = () => {
    if (!pasteTitle.trim() || !pasteDescription.trim()) return
    setClosedPosting(false)
    setContext({
      jobTitle: pasteTitle.trim(),
      jobDescription: pasteDescription.trim(),
      requirements: [],
    })
  }

  const copyOutput = (text: string) => {
    void navigator.clipboard
      ?.writeText(text)
      .then(() => showToast(M.careers_ai_copied, 'ok'))
      .catch(() => showToast(M.careers_ai_error, 'info'))
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-[8px] text-[14px] text-text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {x(M.careers_loading)}
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.careers_error_generic)}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-[12px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          {x(M.careers_retry)}
        </button>
      </div>
    )
  }

  if (!profile || !profile.resumeText.trim()) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[48px] text-center">
        <div className="mx-auto mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-full bg-accent-soft text-accent">
          <Sparkles size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h1 className="m-0 text-[18px] font-semibold text-text">
          {x(M.careers_ai_tools_resume_required)}
        </h1>
        <p className="mx-auto mt-[6px] max-w-[420px] text-[13.5px] leading-[1.5] text-text-muted">
          {x(M.careers_ai_tools_resume_required_body)}
        </p>
        <Link
          to="/careers/portal/profile"
          className="mt-[18px] inline-flex items-center gap-[7px] rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[14px] font-semibold text-white no-underline"
        >
          {x(M.careers_portal_nav_profile)}
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <div>
        <h1 className="m-0 text-[22px] font-bold text-text">{x(M.careers_portal_nav_ai_tools)}</h1>
        <p className="mt-[4px] text-[14px] text-text-muted">{x(M.careers_ai_tools_lead)}</p>
      </div>

      {/* Job context picker */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="m-0 mb-[4px] flex items-center gap-[7px] text-[15px] font-semibold text-text">
          <Briefcase size={16} strokeWidth={2} aria-hidden="true" />
          {x(M.careers_ai_tools_pick_job)}
        </h2>
        <p className="m-0 mb-[14px] text-[13px] text-text-muted">
          {x(M.careers_ai_tools_pick_job_body)}
        </p>

        {applications.length > 0 && (
          <div className="mb-[16px]">
            <label className={labelClass} htmlFor="ai-tools-application">
              {x(M.careers_ai_tools_from_application)}
            </label>
            <select
              id="ai-tools-application"
              defaultValue=""
              disabled={loadingContext}
              onChange={(e) => {
                if (e.target.value) void pickApplication(e.target.value)
              }}
              className={fieldClass}
            >
              <option value="" disabled>
                {x(M.careers_ai_tools_choose_application)}
              </option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.jobPosting?.title ?? x(M.careers_applications_posting_closed)}
                </option>
              ))}
            </select>
            {loadingContext && (
              <div className="mt-[8px] flex items-center gap-[6px] text-[12.5px] text-text-muted">
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                {x(M.careers_loading)}
              </div>
            )}
            {closedPosting && (
              <div className="mt-[8px] text-[12.5px] text-text-muted">
                {x(M.careers_ai_tools_posting_closed)}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="mb-[8px] flex items-center gap-[6px] text-[12.5px] font-semibold text-text-2">
            <ClipboardPaste size={13} strokeWidth={2} aria-hidden="true" />
            {x(M.careers_ai_tools_or_paste)}
          </div>
          <input
            type="text"
            value={pasteTitle}
            onChange={(e) => setPasteTitle(e.target.value)}
            placeholder={x(M.careers_ai_tools_paste_title_placeholder)}
            className={`${fieldClass} mb-[8px]`}
          />
          <textarea
            rows={5}
            value={pasteDescription}
            onChange={(e) => setPasteDescription(e.target.value)}
            placeholder={x(M.careers_ai_tools_paste_placeholder)}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={usePasted}
            disabled={!pasteTitle.trim() || !pasteDescription.trim()}
            className="mt-[10px] cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[9px] text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-60"
          >
            {x(M.careers_ai_tools_use_posting)}
          </button>
        </div>
      </div>

      {context && (
        <AiTools
          key={context.jobTitle}
          resumeText={profile.resumeText}
          jobTitle={context.jobTitle}
          jobDescription={context.jobDescription}
          requirements={context.requirements}
          candidateName={profile.name}
          onUseTailoredResume={copyOutput}
          onUseCoverLetter={copyOutput}
          onMatchScored={() => {}}
        />
      )}
    </div>
  )
}
