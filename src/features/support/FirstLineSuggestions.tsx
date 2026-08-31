import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, LifeBuoy, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import { helpDocPath } from '@/seo/routes'
import type { SupportCategory } from '@/config/support'
import { suggestFirstLine } from './firstLineAssist'
import { FirstLineAnswerError, getFirstLineAnswer } from './firstLineApi'

/**
 * First-line self-service hint shown inside the intake forms (public Contact
 * form + in-app request form). As the requester types, it offers the Help
 * Centre articles most likely to answer them — except for the human-only
 * categories, where it plainly says a person will handle it (see
 * firstLineAssist for the escalation policy). Cross-surface safe tokens only.
 * Article links are plain `<a target="_blank">` (open the public help pages in a
 * new tab, so the draft is never lost, and no router context is required).
 *
 * `allowGenerative` (in-app, authenticated form only) adds an opt-in "Get an
 * instant answer" button: the model drafts a short answer grounded in the same
 * articles. It is advisory — labelled AI-generated, not legal advice — and the
 * user still sends their request. Never enabled for human-only categories (they
 * return `escalate` above) or on the public form.
 */
export function FirstLineSuggestions({
  query,
  category,
  allowGenerative = false,
}: {
  readonly query: string
  readonly category: SupportCategory | ''
  readonly allowGenerative?: boolean
}) {
  const { x, lang } = useI18n()
  const result = useMemo(() => suggestFirstLine(query, category, lang), [query, category, lang])
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)

  // Editing the request after an answer invalidates it — reset so the stale
  // answer is cleared and the button reappears.
  useEffect(() => {
    setAnswer(null)
    setAnswerError(null)
  }, [query, category])

  async function onAsk() {
    setAsking(true)
    setAnswerError(null)
    try {
      const res = await getFirstLineAnswer(query, category, result.articles, lang)
      if (res.escalate || !res.answer.trim()) setAnswerError(x(M.support_firstline_answer_error))
      else setAnswer(res.answer)
    } catch (error) {
      const limited = error instanceof FirstLineAnswerError && error.code === 'rate_limited'
      setAnswerError(
        x(limited ? M.support_firstline_answer_limited : M.support_firstline_answer_error),
      )
    } finally {
      setAsking(false)
    }
  }

  if (result.escalate) {
    return (
      <div
        role="note"
        className="flex items-start gap-[10px] rounded-[10px] border border-border bg-bg px-[14px] py-[12px]"
      >
        <LifeBuoy size={16} aria-hidden="true" className="mt-px flex-none text-gold-strong" />
        <p className="m-0 text-[13px] leading-[1.5] text-text-2">{x(M.support_firstline_human)}</p>
      </div>
    )
  }

  if (result.articles.length === 0) return null

  return (
    <div className="rounded-[10px] border border-border bg-bg px-[14px] py-[12px]">
      <p className="m-0 mb-[8px] flex items-center gap-[6px] text-[12.5px] font-semibold text-text-2">
        <Sparkles size={14} aria-hidden="true" className="text-gold-strong" />
        {x(M.support_firstline_title)}
      </p>
      <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
        {result.articles.map((a) => (
          <li key={a.slug}>
            <a
              href={helpDocPath(a, lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[6px] text-[13px] font-medium text-gold-strong hover:opacity-80"
            >
              {x(a.title)}
              <ExternalLink size={12} aria-hidden="true" className="flex-none" />
            </a>
          </li>
        ))}
      </ul>

      {allowGenerative && (
        <div className="mt-[10px]">
          {answer === null ? (
            <button
              type="button"
              onClick={onAsk}
              disabled={asking}
              className="inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-bg px-[12px] py-[7px] text-[12.5px] font-semibold text-text-2 hover:text-text disabled:opacity-60"
            >
              <Sparkles size={13} aria-hidden="true" className="text-gold-strong" />
              {asking ? x(M.support_firstline_asking) : x(M.support_firstline_ask)}
            </button>
          ) : (
            <div
              aria-live="polite"
              className="rounded-[9px] border border-border bg-bg px-[12px] py-[10px]"
            >
              <p className="m-0 mb-[4px] text-[11px] font-semibold tracking-[0.04em] text-text-3 uppercase">
                {x(M.support_firstline_answer_label)}
              </p>
              <p className="m-0 text-[13px] leading-[1.55] whitespace-pre-wrap text-text">
                {answer}
              </p>
              <p className="m-0 mt-[8px] border-t border-border pt-[6px] text-[11.5px] leading-[1.45] text-text-3">
                {x(M.support_firstline_disclaimer)}
              </p>
            </div>
          )}
          {answerError && (
            <p role="alert" className="m-0 mt-[8px] text-[12px] text-risk-fg">
              {answerError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
