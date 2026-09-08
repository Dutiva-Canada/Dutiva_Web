import { useState } from 'react'
import { AlertCircle, FileText, Loader2, Mail, Target, Mic } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import {
  generateCoverLetter,
  interviewPrep,
  scoreMatch,
  tailorResume,
} from '@/features/careers/data/candidateAi'
import type {
  CoverLetterResult,
  InterviewPrepResult,
  MatchScoreResult,
  TailorResumeResult,
} from '@/features/careers/data/candidateAi'

interface AiToolsProps {
  resumeText: string
  jobTitle: string
  jobDescription: string
  requirements: string[]
  candidateName: string
  /** Called when the candidate accepts a tailored resume. */
  onUseTailoredResume: (text: string) => void
  /** Called when the candidate accepts a generated cover letter. */
  onUseCoverLetter: (text: string) => void
  /** Called when a match score is generated (so it can be submitted with the application). */
  onMatchScored: (score: number, suggestions: string[]) => void
}

type ToolState = 'idle' | 'loading' | 'done' | 'error'

/**
 * The four optional AI tool cards for the apply page. Each runs
 * independently; results are non-blocking (the candidate can still apply
 * without any AI assistance). Extracted so the apply page stays under the
 * line budget.
 */
export function AiTools({
  resumeText,
  jobTitle,
  jobDescription,
  requirements,
  candidateName,
  onUseTailoredResume,
  onUseCoverLetter,
  onMatchScored,
}: AiToolsProps) {
  const { x } = useI18n()

  const [tailorState, setTailorState] = useState<ToolState>('idle')
  const [tailoredResume, setTailoredResume] = useState<string | undefined>()

  const [coverState, setCoverState] = useState<ToolState>('idle')
  const [coverLetter, setCoverLetter] = useState<string | undefined>()

  const [matchState, setMatchState] = useState<ToolState>('idle')
  const [matchResult, setMatchResult] = useState<MatchScoreResult | undefined>()

  const [prepState, setPrepState] = useState<ToolState>('idle')
  const [prepResult, setPrepResult] = useState<InterviewPrepResult | undefined>()

  const runTailor = async () => {
    setTailorState('loading')
    try {
      const result: TailorResumeResult = await tailorResume({
        resumeText,
        jobTitle,
        jobDescription,
        requirements,
      })
      setTailoredResume(result.tailoredResume)
      setTailorState('done')
    } catch {
      setTailorState('error')
    }
  }

  const runCoverLetter = async () => {
    setCoverState('loading')
    try {
      const result: CoverLetterResult = await generateCoverLetter({
        resumeText,
        jobTitle,
        jobDescription,
        requirements,
        candidateName,
      })
      setCoverLetter(result.coverLetter)
      setCoverState('done')
    } catch {
      setCoverState('error')
    }
  }

  const runMatchScore = async () => {
    setMatchState('loading')
    try {
      const result: MatchScoreResult = await scoreMatch({
        resumeText,
        jobTitle,
        jobDescription,
        requirements,
      })
      setMatchResult(result)
      onMatchScored(result.score, result.suggestions)
      setMatchState('done')
    } catch {
      setMatchState('error')
    }
  }

  const runInterviewPrep = async () => {
    setPrepState('loading')
    try {
      const result: InterviewPrepResult = await interviewPrep({
        jobTitle,
        jobDescription,
        requirements,
        resumeText,
      })
      setPrepResult(result)
      setPrepState('done')
    } catch {
      setPrepState('error')
    }
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div>
        <h2 className="m-0 text-[17px] font-bold text-text">{x(M.careers_ai_section_title)}</h2>
        <p className="mt-[3px] text-[13.5px] text-text-muted">{x(M.careers_ai_section_subtitle)}</p>
      </div>

      <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
        {/* Tailor resume */}
        <AiToolCard
          icon={<FileText size={18} strokeWidth={2} aria-hidden="true" />}
          title={x(M.careers_ai_tailor_resume)}
          desc={x(M.careers_ai_tailor_resume_desc)}
          state={tailorState}
          onRun={runTailor}
        >
          {tailoredResume && (
            <div className="mt-[12px]">
              <textarea
                rows={10}
                readOnly
                value={tailoredResume}
                className="w-full rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[13px] text-text"
              />
              <button
                type="button"
                onClick={() => onUseTailoredResume(tailoredResume)}
                className="mt-[8px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
              >
                {x(M.careers_ai_use_tailored)}
              </button>
            </div>
          )}
        </AiToolCard>

        {/* Cover letter */}
        <AiToolCard
          icon={<Mail size={18} strokeWidth={2} aria-hidden="true" />}
          title={x(M.careers_ai_cover_letter)}
          desc={x(M.careers_ai_cover_letter_desc)}
          state={coverState}
          onRun={runCoverLetter}
        >
          {coverLetter && (
            <div className="mt-[12px]">
              <textarea
                rows={10}
                readOnly
                value={coverLetter}
                className="w-full rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[13px] text-text"
              />
              <button
                type="button"
                onClick={() => onUseCoverLetter(coverLetter)}
                className="mt-[8px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
              >
                {x(M.careers_ai_use_cover_letter)}
              </button>
            </div>
          )}
        </AiToolCard>

        {/* Match score */}
        <AiToolCard
          icon={<Target size={18} strokeWidth={2} aria-hidden="true" />}
          title={x(M.careers_ai_match_score)}
          desc={x(M.careers_ai_match_score_desc)}
          state={matchState}
          onRun={runMatchScore}
        >
          {matchResult && (
            <div className="mt-[12px]">
              <div className="flex items-center gap-[8px]">
                <span className="text-[13px] font-semibold text-text-2">
                  {x(M.careers_ai_match_score_label)}:
                </span>
                <span className="text-[20px] font-bold text-navy">{matchResult.score}</span>
                <span className="text-[13px] text-text-muted">/ 100</span>
              </div>
              {matchResult.suggestions.length > 0 && (
                <div className="mt-[10px]">
                  <div className="mb-[4px] text-[12px] font-semibold text-text-2">
                    {x(M.careers_ai_match_suggestions)}
                  </div>
                  <ul className="ml-[16px] list-disc space-y-[3px] text-[13px] text-text-2">
                    {matchResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </AiToolCard>

        {/* Interview prep */}
        <AiToolCard
          icon={<Mic size={18} strokeWidth={2} aria-hidden="true" />}
          title={x(M.careers_ai_interview_prep)}
          desc={x(M.careers_ai_interview_prep_desc)}
          state={prepState}
          onRun={runInterviewPrep}
        >
          {prepResult && (
            <div className="mt-[12px] space-y-[12px]">
              {prepResult.questions.length > 0 && (
                <div>
                  <div className="mb-[4px] text-[12px] font-semibold text-text-2">
                    {x(M.careers_ai_interview_questions)}
                  </div>
                  <ul className="ml-[16px] list-disc space-y-[3px] text-[13px] text-text-2">
                    {prepResult.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {prepResult.talkingPoints.length > 0 && (
                <div>
                  <div className="mb-[4px] text-[12px] font-semibold text-text-2">
                    {x(M.careers_ai_interview_talking_points)}
                  </div>
                  <ul className="ml-[16px] list-disc space-y-[3px] text-[13px] text-text-2">
                    {prepResult.talkingPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </AiToolCard>
      </div>

      <p className="m-0 text-[12px] leading-[1.5] text-text-muted">{x(M.careers_ai_disclaimer)}</p>
    </div>
  )
}

interface AiToolCardProps {
  icon: React.ReactNode
  title: string
  desc: string
  state: ToolState
  onRun: () => void
  children?: React.ReactNode
}

function AiToolCard({ icon, title, desc, state, onRun, children }: AiToolCardProps) {
  const { x } = useI18n()
  return (
    <div className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="flex items-start gap-[10px]">
        <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[14px] font-semibold text-text">{title}</h3>
          <p className="m-0 mt-[2px] text-[12.5px] leading-[1.45] text-text-muted">{desc}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRun}
        disabled={state === 'loading'}
        className="mt-[12px] flex w-full cursor-pointer items-center justify-center gap-[7px] rounded-[9px] border border-border bg-bg px-[12px] py-[8px] text-[13px] font-semibold text-text-2 transition-[background] duration-150 hover:bg-inset disabled:cursor-default disabled:opacity-60"
      >
        {state === 'loading' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {state === 'loading' ? x(M.careers_ai_generating) : title}
      </button>

      {state === 'error' && (
        <div className="mt-[10px] flex items-center gap-[6px] rounded-[8px] border border-risk-border bg-risk-bg px-[10px] py-[8px]">
          <AlertCircle size={14} className="text-risk-fg" strokeWidth={2} aria-hidden="true" />
          <span className="text-[12px] text-risk-fg">{x(M.careers_ai_error)}</span>
        </div>
      )}

      {state === 'done' && children}
    </div>
  )
}
