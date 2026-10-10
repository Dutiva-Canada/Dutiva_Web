import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Loader2, RotateCcw, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
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
import { CopyTurnButton } from '@/components/chat/portalChat'
import {
  formatTurnDay,
  formatTurnTime,
  sameTurnDay,
  useAutoGrowTextarea,
  useStickToBottom,
} from '@/components/chat/portalChatUtils'

/* Markdown rendering is a lazy chunk (react-markdown + remark-gfm) — the
   bubble falls back to verbatim text while it loads. widgetSurface is null:
   Claire has no widget grammar, so a ```dutiva-widget fence stays a code
   block if one ever appears. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HISTORY_PAGE = 40
/* Show the running count only once the 1200-char cap is in sight. */
const COUNT_FROM = 1000

const bubbleClass = (role: CandidateChatTurn['role'], failed?: boolean) =>
  `max-w-[85%] rounded-[14px] px-[14px] py-[10px] text-[14px] leading-[1.55] whitespace-pre-wrap ${
    role === 'user'
      ? `self-end bg-navy text-white ${failed ? 'opacity-75 ring-1 ring-accent' : ''}`
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
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Stick-to-bottom follows new turns + streamed deltas; scrolling up to
     read history releases it. */
  const { logRef, stickToBottom, capturePrepend } = useStickToBottom([
    turns,
    sending,
    streamed,
  ])
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(inputRef, draft)

  const isInternal = isInternalDutivaAccount(session?.user?.email)

  useEffect(() => {
    loadCandidateChatHistory(HISTORY_PAGE)
      .then((rows) => {
        setTurns(rows)
        /* A full page back means older turns probably exist. */
        setHasMore(rows.length === HISTORY_PAGE)
      })
      .catch(() => setTurns([]))
  }, [])

  /* Older page — the server takes the oldest loaded turn's created_at as the
     cursor; capturePrepend keeps the viewport on the same message. */
  const loadEarlier = async () => {
    const oldest = turns?.[0]?.createdAt
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadCandidateChatHistory(HISTORY_PAGE, oldest)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(M.careers_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  const sendText = async (message: string) => {
    if (!message || sending) return
    setSending(true)
    setStreamed('')
    /* Optimistic user turn — your message should appear the moment you
       send, not after the reply round-trips. Sending always returns to the
       end of the log even if the reader had scrolled up. */
    const userTurn: CandidateChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      feedback: null,
      createdAt: new Date().toISOString(),
    }
    stickToBottom()
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
      showToast(
        err instanceof CandidateAiDailyLimitError ? M.careers_chat_daily_limit : M.careers_chat_error,
      )
      /* Keep the turn in the log flagged failed — the text stays visible
         and a Retry affordance resends it in place. */
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === userTurn.id ? { ...t, failed: true } : t)),
      )
    } finally {
      setSending(false)
      setStreamed('')
    }
  }

  const send = () => {
    const message = draft.trim()
    if (!message || sending) return
    setDraft('')
    void sendText(message)
  }

  /* A failed turn disappears and its text goes back through sendText —
     same pipe as a fresh send. */
  const retry = (turn: CandidateChatTurn) => {
    if (sending) return
    setTurns((prev) => (prev ?? []).filter((t) => t.id !== turn.id))
    void sendText(turn.content)
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearCandidateChat()
      setTurns([])
      setHasMore(false)
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

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a coaching one. */
  const starters = [
    x(M.careers_chat_starter_1),
    x(M.careers_chat_starter_2),
    x(isInternal ? M.careers_chat_starter_int : M.careers_chat_starter_ext),
  ]

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h1 className="m-0 text-[22px] font-bold text-text">
            {x(M.careers_chat_title)}
            {isInternal && (
              <span className="ml-[8px] inline-block rounded-full border border-border bg-inset px-[8px] py-[1px] align-middle text-[10.5px] font-bold uppercase tracking-wide text-accent">
                {x(M.careers_chat_internal_badge)}
              </span>
            )}
          </h1>
          {/* Internal-staff tier — the edge function advises @dutiva.ca
              accounts directly, so the coach-not-adviser subtitle would be
              untrue for them. */}
          <p className="mt-[4px] text-[14px] text-text-muted">
            {x(isInternal ? M.careers_chat_sub_internal : M.careers_chat_sub)}
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
          aria-busy={turns === null || sending}
          className="flex max-h-[52vh] min-h-[240px] flex-col gap-[10px] overflow-y-auto px-[2px]"
        >
          {hasMore && (
            <button
              type="button"
              onClick={() => void loadEarlier()}
              disabled={loadingMore}
              className="inline-flex cursor-pointer items-center gap-[6px] self-center rounded-full border border-border bg-transparent px-[12px] py-[5px] text-[11.5px] font-semibold text-text-muted hover:border-navy hover:text-navy disabled:opacity-60"
            >
              {loadingMore ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                x(M.careers_chat_load_earlier)
              )}
            </button>
          )}
          {turns === null ? (
            <>
              <div
                aria-hidden="true"
                className="h-[46px] w-[46%] animate-pulse self-start rounded-[14px] border border-border bg-surface"
              />
              <div
                aria-hidden="true"
                className="h-[34px] w-[30%] animate-pulse self-end rounded-[14px] bg-navy opacity-50"
              />
            </>
          ) : turns.length === 0 ? (
            /* She speaks first — a greeting built locally, not a stored
               turn, so clearing history brings it back. The chips are
               tappable sends — they teach the surface without typing. */
            <>
              <div className={bubbleClass('assistant')}>{x(M.careers_chat_greeting)}</div>
              <div className="flex max-w-[85%] flex-wrap gap-[8px] self-start">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendText(s)}
                    className="cursor-pointer rounded-full border border-border bg-surface px-[12px] py-[7px] text-[12.5px] font-medium text-text-2 hover:border-navy hover:text-navy"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            turns.map((t, i) => {
              const prev = i > 0 ? turns[i - 1] : undefined
              const showDay = !prev || !sameTurnDay(prev.createdAt, t.createdAt)
              return (
                <div key={t.id} className="contents">
                  {showDay && (
                    <div
                      role="separator"
                      className="my-[4px] self-center rounded-full border border-border bg-bg px-[10px] py-[2px] text-[10.5px] font-semibold text-text-muted"
                    >
                      {formatTurnDay(t.createdAt, lang)}
                    </div>
                  )}
                  <div className={bubbleClass(t.role, t.failed)}>
                    {t.role === 'assistant' ? (
                      <Suspense fallback={t.content}>
                        <ChatMarkdown widgetSurface={null}>{t.content}</ChatMarkdown>
                      </Suspense>
                    ) : (
                      t.content
                    )}
                    {t.failed ? (
                      <span className="mt-[6px] flex items-center justify-end gap-[6px] text-[10.5px] opacity-90">
                        {x(M.careers_chat_error)}
                        <button
                          type="button"
                          onClick={() => retry(t)}
                          className="inline-flex cursor-pointer items-center gap-[3px] border-none bg-transparent p-0 font-bold underline underline-offset-2"
                        >
                          <RotateCcw size={10} aria-hidden="true" /> {x(M.careers_chat_retry)}
                        </button>
                      </span>
                    ) : (
                      <span className="mt-[6px] flex items-center justify-end gap-[4px] text-[10.5px] opacity-80">
                        <time>{formatTurnTime(t.createdAt, lang)}</time>
                        {t.role === 'assistant' && UUID_RE.test(t.id) && (
                          <>
                            <CopyTurnButton
                              text={t.content}
                              label={x(M.careers_chat_copy)}
                              className="cursor-pointer rounded-[6px] border-none bg-transparent p-[3px] text-text-faint transition-colors hover:text-text-muted"
                            />
                            <button
                              type="button"
                              className={`cursor-pointer rounded-[6px] border-none bg-transparent p-[3px] transition-colors ${
                                t.feedback === 1
                                  ? 'text-accent'
                                  : 'text-text-faint hover:text-text-muted'
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
                                t.feedback === -1
                                  ? 'text-accent'
                                  : 'text-text-faint hover:text-text-muted'
                              }`}
                              aria-label={x(M.careers_chat_rate_down)}
                              aria-pressed={t.feedback === -1}
                              onClick={() => void rate(t.id, -1)}
                            >
                              <ThumbsDown size={12} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {sending && (
            <div className={bubbleClass('assistant')}>
              {streamed ? (
                <Suspense fallback={streamed}>
                  <ChatMarkdown widgetSurface={null} streaming>
                    {streamed}
                  </ChatMarkdown>
                </Suspense>
              ) : (
                <Loader2 size={14} className="animate-spin text-text-muted" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="mt-[12px] flex items-end gap-[8px] border-t border-border pt-[12px]">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={x(M.careers_chat_placeholder)}
            maxLength={1200}
            rows={1}
            aria-label={x(M.careers_chat_placeholder)}
            className="max-h-[160px] w-full flex-1 resize-none self-start overflow-y-auto rounded-[10px] border border-border bg-bg px-[12px] py-[10px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label={x(M.careers_chat_send)}
            className="inline-flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-navy text-white disabled:cursor-default disabled:opacity-60"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-[6px] flex justify-between text-[10.5px] text-text-faint">
          <span>{x(M.careers_chat_enter_hint)}</span>
          {draft.length > COUNT_FROM && <span>{draft.length}/1200</span>}
        </div>
      </section>
    </div>
  )
}
