import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Send,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { CandidateAiDailyLimitError } from '@/features/careers/data/candidateAi'
import {
  clearCandidateChat,
  listCandidateChatThreads,
  loadCandidateChatHistory,
  newCandidateChatThread,
  rateCandidateChatTurn,
  regenerateCandidateChat,
  sendCandidateChat,
  type CandidateChatThread,
  type CandidateChatTurn,
} from '@/features/careers/data/candidateChat'
import {
  ChipRow,
  CopyTurnButton,
  JumpToLatest,
  ReasonChips,
  ThreadSwitcher,
} from '@/components/chat/portalChat'
import {
  formatTurnDay,
  formatTurnTime,
  sameTurnDay,
  useAutoGrowTextarea,
  usePortalChatDraft,
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

/** True when a failed send was the reader's own stop — an aborted stream
    keeps its partial text instead of flagging the turn failed. */
function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

const bubbleClass = (role: CandidateChatTurn['role'], failed?: boolean) =>
  `max-w-[85%] rounded-[14px] px-[14px] py-[10px] text-[14px] leading-[1.55] whitespace-pre-wrap ${
    role === 'user'
      ? `self-end bg-navy text-white ${failed ? 'opacity-75 ring-1 ring-accent' : ''}`
      : 'self-start border border-border bg-surface text-text'
  }`

const rateBtn = (pressed: boolean) =>
  `cursor-pointer rounded-[6px] border-none bg-transparent p-[3px] transition-colors ${
    pressed ? 'text-accent' : 'text-text-faint hover:text-text-muted'
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
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [clearing, setClearing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Follow-up chips from the latest reply — ephemeral, cleared on send. */
  const [suggests, setSuggests] = useState<string[]>([])
  /* Named conversations — null threadId is the default ("main") one. */
  const [threads, setThreads] = useState<CandidateChatThread[] | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  /* Turn id whose downvote is waiting on a reason chip pick. */
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  /* The external daily rail spent itself — a pinned notice outlives the
     toast so the composer doesn't look merely broken. */
  const [limitHit, setLimitHit] = useState(false)
  /* The running send's abort handle — the Stop button cancels the stream. */
  const abortRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = usePortalChatDraft(`dutiva:careers-chat:${threadId ?? 'main'}`)
  /* Stick-to-bottom follows new turns + streamed deltas; scrolling up to
     read history releases it (farUp then drives the jump pill). */
  const { logRef, stickToBottom, capturePrepend, farUp, hasNew } = useStickToBottom([
    turns,
    sending,
    streamed,
  ])
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(inputRef, draft)

  const isInternal = isInternalDutivaAccount(session?.user?.email)

  /* History reloads whenever the thread changes — skeleton shows while the
     scoped page loads. The thread list loads once. */
  useEffect(() => {
    setTurns(null)
    setSuggests([])
    loadCandidateChatHistory(HISTORY_PAGE, undefined, threadId)
      .then((rows) => {
        setTurns(rows)
        /* A full page back means older turns probably exist. */
        setHasMore(rows.length === HISTORY_PAGE)
      })
      .catch(() => setTurns([]))
  }, [threadId])

  useEffect(() => {
    listCandidateChatThreads()
      .then(setThreads)
      .catch(() => setThreads([]))
  }, [])

  /* Older page — the server takes the oldest loaded turn's created_at as the
     cursor; capturePrepend keeps the viewport on the same message. */
  const loadEarlier = async () => {
    const oldest = turns?.[0]?.createdAt
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadCandidateChatHistory(HISTORY_PAGE, oldest, threadId)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(M.careers_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  /* Shared tail of send + regenerate — appends the assistant turn, adopts
     its suggestions, and refreshes a named thread's freshly-set title. */
  const adoptReply = (result: {
    reply: string
    assistantId: string | null
    suggests: string[]
  }) => {
    setTurns((prev) => [
      ...(prev ?? []),
      {
        /* The persisted row id when the insert landed — rating needs it. */
        id: result.assistantId ?? `a-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        feedback: null,
        createdAt: new Date().toISOString(),
      },
    ])
    setSuggests(result.suggests)
    if (threadId) {
      void listCandidateChatThreads()
        .then(setThreads)
        .catch(() => {})
    }
  }

  const sendText = async (message: string) => {
    if (!message || sending) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSending(true)
    setStreamed('')
    setSuggests([])
    setReasonFor(null)
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
      const result = await sendCandidateChat(message, lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
      })
      adoptReply(result)
    } catch (err) {
      if (isAbort(err) || ctrl.signal.aborted) {
        /* Stop pressed — keep whatever streamed in as a local turn (the
           server may still persist the full reply; reload reconciles). */
        setStreamed((partial) => {
          if (partial) {
            setTurns((prev) => [
              ...(prev ?? []),
              {
                id: `a-${Date.now()}`,
                role: 'assistant' as const,
                content: partial,
                feedback: null,
                createdAt: new Date().toISOString(),
              },
            ])
          }
          return ''
        })
      } else {
        if (err instanceof CandidateAiDailyLimitError) setLimitHit(true)
        showToast(
          err instanceof CandidateAiDailyLimitError ? M.careers_chat_daily_limit : M.careers_chat_error,
        )
        /* Keep the turn in the log flagged failed — the text stays visible
           and a Retry affordance resends it in place. */
        setTurns((prev) =>
          (prev ?? []).map((t) => (t.id === userTurn.id ? { ...t, failed: true } : t)),
        )
      }
    } finally {
      abortRef.current = null
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

  /* Try another answer — the server drops the last pair and re-asks, so
     locally the pair leaves too; the fresh reply streams into the pending
     bubble like a normal send. Costs a daily call for external accounts. */
  const regenerate = async () => {
    if (sending) return
    const list = turns ?? []
    const last = list[list.length - 1]
    const prevUser = list[list.length - 2]
    if (!last || last.role !== 'assistant' || !prevUser || prevUser.role !== 'user') return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSending(true)
    setStreamed('')
    setSuggests([])
    setReasonFor(null)
    stickToBottom()
    const pairIds = [last.id, prevUser.id]
    setTurns((prev) => (prev ?? []).filter((t) => !pairIds.includes(t.id)))
    setTurns((prev) => [
      ...(prev ?? []),
      {
        id: `u-${Date.now()}`,
        role: 'user',
        content: prevUser.content,
        feedback: null,
        createdAt: new Date().toISOString(),
      },
    ])
    try {
      const result = await regenerateCandidateChat(lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
      })
      adoptReply(result)
    } catch (err) {
      if (isAbort(err) || ctrl.signal.aborted) {
        /* stopped mid-regen — nothing more to show */
      } else {
        if (err instanceof CandidateAiDailyLimitError) setLimitHit(true)
        showToast(
          err instanceof CandidateAiDailyLimitError ? M.careers_chat_daily_limit : M.careers_chat_error,
        )
      }
    } finally {
      abortRef.current = null
      setSending(false)
      setStreamed('')
    }
  }

  /* Reuse — copies a sent turn back into the composer for editing; the
     original history row is untouched. */
  const reuse = (turn: CandidateChatTurn) => {
    setDraft(turn.content)
    inputRef.current?.focus()
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearCandidateChat(threadId)
      setTurns([])
      setHasMore(false)
      setSuggests([])
    } catch {
      showToast(M.careers_chat_error)
    } finally {
      setClearing(false)
    }
  }

  /* Thumbs on an assistant turn — only real rows (uuid ids) can hold a
     rating; optimistic, reverted if the write fails. A downvote opens the
     one-tap reason chips. */
  const rate = async (turnId: string, rating: 1 | -1) => {
    const before = turns?.find((t) => t.id === turnId)?.feedback ?? null
    const next = before === rating ? 0 : rating
    setTurns((prev) =>
      (prev ?? []).map((t) =>
        t.id === turnId ? { ...t, feedback: next || null, feedbackReason: null } : t,
      ),
    )
    setReasonFor(next === -1 ? turnId : null)
    try {
      await rateCandidateChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
      setReasonFor(null)
    }
  }

  /* Reason chip under a downvote — stores the why with the rating. */
  const pickReason = async (turnId: string, reason: string) => {
    setReasonFor(null)
    setTurns((prev) =>
      (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedbackReason: reason } : t)),
    )
    try {
      await rateCandidateChatTurn(turnId, -1, reason)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedbackReason: null } : t)),
      )
    }
  }

  /* Thread switching — the list holds the named conversations; the default
     (null) is always selectable as the main one. */
  const openThread = (id: string | null) => {
    if (sending || id === threadId) return
    setThreadId(id)
  }
  const startThread = async () => {
    if (sending) return
    try {
      const t = await newCandidateChatThread()
      setThreads((prev) => [...(prev ?? []), t])
      setThreadId(t.id)
    } catch {
      showToast(M.careers_chat_error)
    }
  }

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a coaching one. */
  const starters = [
    x(M.careers_chat_starter_1),
    x(M.careers_chat_starter_2),
    x(isInternal ? M.careers_chat_starter_int : M.careers_chat_starter_ext),
  ]
  const reasonChips = [
    x(M.careers_chat_reason_wrong),
    x(M.careers_chat_reason_vague),
    x(M.careers_chat_reason_tone),
  ]
  const activeThread = threads?.find((t) => t.id === threadId)
  const threadName = threadId
    ? (activeThread?.title ?? x(M.careers_chat_thread_untitled))
    : x(M.careers_chat_thread_default)

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
          {/* Data-source disclosure — a coach says what she reads. */}
          <details className="mt-[4px] text-[11.5px] text-text-faint">
            <summary className="cursor-pointer font-semibold">{x(M.careers_chat_sees)}</summary>
            <p className="mt-[4px] max-w-[560px] leading-[1.5]">{x(M.careers_chat_sees_list)}</p>
          </details>
        </div>
        <div className="mt-[4px] flex shrink-0 items-center gap-[8px]">
          <ThreadSwitcher
            activeName={threadName}
            threads={threads ?? []}
            activeId={threadId}
            disabled={sending}
            labels={{
              defaultThread: x(M.careers_chat_thread_default),
              untitled: x(M.careers_chat_thread_untitled),
              newThread: x(M.careers_chat_thread_new),
            }}
            buttonClass="inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset disabled:opacity-60"
            listClass="absolute right-0 top-[calc(100%+6px)] z-30 flex min-w-[210px] max-w-[300px] flex-col gap-[2px] rounded-[12px] border border-border bg-surface p-[6px] shadow-[0_12px_32px_rgb(0_0_0/0.18)]"
            itemClass="block w-full cursor-pointer truncate rounded-[8px] border-none bg-transparent px-[10px] py-[7px] text-left text-[12.5px] text-text hover:bg-inset aria-checked:font-semibold aria-checked:text-accent"
            newItemClass="mt-[2px] border-t border-border !rounded-b-[8px] !rounded-t-none font-semibold !text-accent"
            onOpen={openThread}
            onNew={() => void startThread()}
          />
          {turns !== null && turns.length > 0 && (
            <button
              type="button"
              onClick={() => void clear()}
              disabled={clearing}
              className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset disabled:opacity-60"
            >
              <Trash2 size={13} aria-hidden="true" />
              {x(M.careers_chat_clear)}
            </button>
          )}
        </div>
      </div>

      <section className="rounded-[12px] border border-border bg-surface p-[14px]">
        <div className="relative">
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
                  <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  x(M.careers_chat_load_earlier)
                )}
              </button>
            )}
            {turns === null ? (
              <>
                <div
                  aria-hidden="true"
                  className="h-[46px] w-[46%] self-start rounded-[14px] border border-border bg-surface motion-safe:animate-pulse"
                />
                <div
                  aria-hidden="true"
                  className="h-[34px] w-[30%] self-end rounded-[14px] bg-navy opacity-50 motion-safe:animate-pulse"
                />
              </>
            ) : turns.length === 0 ? (
              /* She speaks first — a greeting built locally, not a stored
                 turn, so clearing history brings it back. The chips are
                 tappable sends — they teach the surface without typing. */
              <>
                <div className={bubbleClass('assistant')}>{x(M.careers_chat_greeting)}</div>
                <ChipRow
                  chips={starters}
                  className="flex max-w-[85%] flex-wrap gap-[8px] self-start"
                  chipClass="cursor-pointer rounded-full border border-border bg-surface px-[12px] py-[7px] text-[12.5px] font-medium text-text-2 hover:border-navy hover:text-navy"
                  onPick={(s) => void sendText(s)}
                />
              </>
            ) : (
              turns.map((t, i) => {
                const prev = i > 0 ? turns[i - 1] : undefined
                const showDay = !prev || !sameTurnDay(prev.createdAt, t.createdAt)
                const isLastAssistant =
                  t.role === 'assistant' && i === turns.length - 1 && UUID_RE.test(t.id)
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
                          {t.role === 'user' && (
                            <button
                              type="button"
                              className={rateBtn(false)}
                              aria-label={x(M.careers_chat_reuse)}
                              title={x(M.careers_chat_reuse)}
                              onClick={() => reuse(t)}
                            >
                              <Pencil size={12} aria-hidden="true" />
                            </button>
                          )}
                          {t.role === 'assistant' && UUID_RE.test(t.id) && (
                            <>
                              <CopyTurnButton
                                text={t.content}
                                label={x(M.careers_chat_copy)}
                                className="cursor-pointer rounded-[6px] border-none bg-transparent p-[3px] text-text-faint transition-colors hover:text-text-muted"
                              />
                              <button
                                type="button"
                                className={rateBtn(t.feedback === 1)}
                                aria-label={x(M.careers_chat_rate_up)}
                                aria-pressed={t.feedback === 1}
                                onClick={() => void rate(t.id, 1)}
                              >
                                <ThumbsUp size={12} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className={rateBtn(t.feedback === -1)}
                                aria-label={x(M.careers_chat_rate_down)}
                                aria-pressed={t.feedback === -1}
                                onClick={() => void rate(t.id, -1)}
                              >
                                <ThumbsDown size={12} aria-hidden="true" />
                              </button>
                              {isLastAssistant && !sending && (
                                <button
                                  type="button"
                                  className={rateBtn(false)}
                                  aria-label={x(M.careers_chat_regenerate)}
                                  title={x(M.careers_chat_regenerate)}
                                  onClick={() => void regenerate()}
                                >
                                  <RefreshCw size={12} aria-hidden="true" />
                                </button>
                              )}
                            </>
                          )}
                        </span>
                      )}
                      {reasonFor === t.id && !t.feedbackReason && (
                        <ReasonChips
                          label={x(M.careers_chat_reason_label)}
                          reasons={reasonChips}
                          className="mt-[6px] flex flex-wrap items-center gap-[6px]"
                          labelClass="text-[10.5px] not-italic text-text-faint"
                          chipClass="cursor-pointer rounded-full border border-border bg-transparent px-[9px] py-[3px] text-[11px] text-text-muted hover:border-navy hover:text-navy"
                          onPick={(r) => void pickReason(t.id, r)}
                        />
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
                  <span className="inline-flex items-center gap-[7px] text-[12px] text-text-muted">
                    <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden="true" />
                    {x(M.careers_chat_typing)}
                  </span>
                )}
                <span className="mt-[6px] flex justify-end text-[10.5px] opacity-80">
                  <button
                    type="button"
                    className={rateBtn(false)}
                    aria-label={x(M.careers_chat_stop)}
                    title={x(M.careers_chat_stop)}
                    onClick={() => abortRef.current?.abort()}
                  >
                    <Square size={11} aria-hidden="true" />
                  </button>
                </span>
              </div>
            )}
            {/* Follow-up chips — the reply's own suggested next asks. */}
            {!sending && suggests.length > 0 && (
              <ChipRow
                chips={suggests}
                label={x(M.careers_chat_followup_label)}
                className="flex max-w-[85%] flex-wrap gap-[8px] self-start"
                chipClass="cursor-pointer rounded-full border border-border bg-surface px-[12px] py-[7px] text-[12.5px] font-medium text-text-2 hover:border-navy hover:text-navy"
                onPick={(s) => void sendText(s)}
              />
            )}
          </div>
          {farUp && (
            <JumpToLatest
              label={x(M.careers_chat_jump)}
              hasNew={hasNew}
              className="absolute bottom-[16px] left-1/2 z-10 inline-flex -translate-x-1/2 cursor-pointer items-center gap-[6px] rounded-full border border-border bg-surface px-[12px] py-[6px] text-[11.5px] font-semibold text-text shadow-[0_6px_18px_rgb(0_0_0/0.14)] hover:border-navy hover:text-navy"
              dotClass="h-[6px] w-[6px] rounded-full bg-accent"
              onJump={stickToBottom}
            />
          )}
        </div>

        {/* Daily rail spent — a pinned notice outlives the toast. */}
        {limitHit && (
          <p
            role="status"
            className="mt-[10px] rounded-[8px] border border-border bg-inset px-[12px] py-[8px] text-[12px] font-medium text-text-2"
          >
            {x(M.careers_chat_daily_limit)}
          </p>
        )}

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
