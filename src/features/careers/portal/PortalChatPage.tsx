import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { CandidateAiDailyLimitError } from '@/features/careers/data/candidateAi'
import {
  clearCandidateChat,
  loadCandidateChatHistory,
  rateCandidateChatTurn,
  sendCandidateChat,
  type CandidateChatTurn,
} from '@/features/careers/data/candidateChat'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const bubbleClass = (role: CandidateChatTurn['role']) =>
  `max-w-[85%] rounded-[14px] px-[14px] py-[10px] text-[14px] leading-[1.55] whitespace-pre-wrap ${
    role === 'user'
      ? 'self-end bg-navy text-white'
      : 'self-start border border-border bg-surface text-text'
  }`

/**
 * Claire — the search coach. A chat over the candidate's own portal rows
 * (profile, applications, discovered jobs, agent settings) that advises but
 * never acts: applying stays on the apply page, profile edits on the
 * profile page. History persists server-side (candidate_chat_messages);
 * verified @dutiva.ca accounts get the direct-advice register from the
 * edge function, so the subtitle tier swaps with them.
 */
export function PortalChatPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { showToast } = useToasts()

  const [turns, setTurns] = useState<CandidateChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [clearing, setClearing] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadCandidateChatHistory()
      .then(setTurns)
      .catch(() => setTurns([]))
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight })
  }, [turns, sending, streamed])

  const send = async () => {
    const message = draft.trim()
    if (!message || sending) return
    setSending(true)
    setDraft('')
    setStreamed('')
    /* Optimistic user turn — your message should appear the moment you
       send, not after the reply round-trips. */
    const userTurn: CandidateChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      feedback: null,
      createdAt: new Date().toISOString(),
    }
    setTurns((prev) => [...(prev ?? []), userTurn])
    try {
      /* onDelta turns on SSE — the reply types into the pending bubble as
         it generates; the final payload stays authoritative. */
      const { reply, assistantId } = await sendCandidateChat(message, lang, setStreamed)
      setTurns((prev) => [
        ...(prev ?? []),
        {
          /* The persisted row id when the insert landed — rating needs it. */
          id: assistantId ?? `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          feedback: null,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (err) {
      showToast(err instanceof CandidateAiDailyLimitError ? M.careers_chat_daily_limit : M.careers_chat_error)
      setDraft(message)
      /* Nothing reached the server — pull the optimistic turn back out. */
      setTurns((prev) => (prev ?? []).filter((t) => t.id !== userTurn.id))
    } finally {
      setSending(false)
      setStreamed('')
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearCandidateChat()
      setTurns([])
    } catch {
      showToast(M.careers_chat_error)
    } finally {
      setClearing(false)
    }
  }

  /* Thumbs on an assistant turn — only real rows (uuid ids) can hold a
     rating; optimistic, reverted if the write fails. */
  const rate = async (turnId: string, rating: 1 | -1) => {
    const before = turns?.find((t) => t.id === turnId)?.feedback ?? null
    const next = before === rating ? 0 : rating
    setTurns((prev) =>
      (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: next || null } : t)),
    )
    try {
      await rateCandidateChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
    }
  }

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h1 className="m-0 text-[22px] font-bold text-text">{x(M.careers_chat_title)}</h1>
          {/* Internal-staff tier — the edge function advises @dutiva.ca
              accounts directly, so the coach-not-adviser subtitle would be
              untrue for them. */}
          <p className="mt-[4px] text-[14px] text-text-muted">
            {x(
              isInternalDutivaAccount(session?.user?.email)
                ? M.careers_chat_sub_internal
                : M.careers_chat_sub,
            )}
          </p>
        </div>
        {turns !== null && turns.length > 0 && (
          <button
            type="button"
            onClick={() => void clear()}
            disabled={clearing}
            className="mt-[4px] inline-flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset disabled:opacity-60"
          >
            <Trash2 size={13} aria-hidden="true" />
            {x(M.careers_chat_clear)}
          </button>
        )}
      </div>

      <section className="rounded-[12px] border border-border bg-surface p-[14px]">
        <div
          ref={logRef}
          aria-live="polite"
          className="flex max-h-[52vh] min-h-[240px] flex-col gap-[10px] overflow-y-auto px-[2px]"
        >
          {turns === null ? (
            <Loader2 size={18} className="animate-spin self-center text-text-muted" aria-hidden="true" />
          ) : turns.length === 0 ? (
            /* She speaks first — a greeting built locally, not a stored
               turn, so clearing history brings it back. */
            <div className={bubbleClass('assistant')}>{x(M.careers_chat_greeting)}</div>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={bubbleClass(t.role)}>
                {t.content}
                {t.role === 'assistant' && UUID_RE.test(t.id) && (
                  <span className="mt-[6px] flex justify-end gap-[4px]">
                    <button
                      type="button"
                      className={`cursor-pointer rounded-[6px] border-none bg-transparent p-[3px] transition-colors ${
                        t.feedback === 1 ? 'text-accent' : 'text-text-faint hover:text-text-muted'
                      }`}
                      aria-label={x(M.careers_chat_rate_up)}
                      aria-pressed={t.feedback === 1}
                      onClick={() => void rate(t.id, 1)}
                    >
                      <ThumbsUp size={12} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`cursor-pointer rounded-[6px] border-none bg-transparent p-[3px] transition-colors ${
                        t.feedback === -1 ? 'text-accent' : 'text-text-faint hover:text-text-muted'
                      }`}
                      aria-label={x(M.careers_chat_rate_down)}
                      aria-pressed={t.feedback === -1}
                      onClick={() => void rate(t.id, -1)}
                    >
                      <ThumbsDown size={12} aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className={bubbleClass('assistant')}>
              {streamed || (
                <Loader2 size={14} className="animate-spin text-text-muted" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="mt-[12px] flex items-end gap-[8px] border-t border-border pt-[12px]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={x(M.careers_chat_placeholder)}
            maxLength={1200}
            rows={2}
            aria-label={x(M.careers_chat_placeholder)}
            className="w-full flex-1 resize-none rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            aria-label={x(M.careers_chat_send)}
            className="inline-flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-navy text-white disabled:cursor-default disabled:opacity-60"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
