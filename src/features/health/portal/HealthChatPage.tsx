import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  clearHealthChat,
  deleteHealthChatThread,
  listHealthChatThreads,
  loadHealthChatHistory,
  newHealthChatThread,
  regenerateHealthChat,
  renameHealthChatThread,
  sendHealthChat,
  type HealthChatAction,
  type HealthChatContext,
  type HealthChatThread,
  type HealthChatTurn,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { ChipRow, JumpToLatest } from '@/components/chat/portalChat'
import {
  formatTurnDay,
  formatTurnTime,
  sameTurnDay,
  useAutoGrowTextarea,
  usePortalChatDraft,
  useStickToBottom,
} from '@/components/chat/portalChatUtils'
import { companionGreeting } from './healthUi'
import { DISTRESS_RE, isAbort } from './healthChatUi'
import { HealthChatComposer, HealthChatPendingBubble } from './HealthChatComposer'
import { HealthChatHeader } from './HealthChatHeader'
import { HealthChatTurnRow } from './HealthChatTurnRow'
import { useHealthChatTurnOps } from './useHealthChatTurnOps'
import { useHealthHead } from './useHealthHead'

const HISTORY_PAGE = 40
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/* Re-show the starter chips when the conversation's been quiet a day —
   a stale transcript offers nothing to tap. */
const STALE_AFTER_MS = 24 * 3_600_000
/* sessionStorage prefix for the last-opened stamp per conversation —
   the switcher dots a thread whose latest write the reader hasn't seen. */
const SEEN_PREFIX = 'dutiva:health-chat-seen:'

/**
 * Mira — the portal's emotional companion. She keeps company over the user's
 * own context (numbers, notes, journal excerpts, this conversation) and can
 * also act: mark a habit done, add a habit, log a check-in, save a journal
 * entry. History persists server-side (health_chat_messages), so the
 * conversation follows the account across sessions. Actions refresh the
 * shared HealthDataContext, so every other page reflects them immediately.
 */
export function HealthChatPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_chat, HM.health_seo_desc_chat)

  const [turns, setTurns] = useState<HealthChatTurn[] | null>(null)
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  /* The in-flight thinking trace — reasoning pieces land ahead of the
     reply, so the thinking panel fills while the bubble is still waiting. */
  const [streamedReasoning, setStreamedReasoning] = useState('')
  const [clearing, setClearing] = useState(false)
  const [clearArmed, setClearArmed] = useState(false)
  /* History-load failure — surfaced inline with retry instead of showing
     a greeting that claims a fresh start over turns that may exist. */
  const [loadError, setLoadError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Follow-up chips from the latest reply — ephemeral, cleared on send. */
  const [suggests, setSuggests] = useState<string[]>([])
  /* Named conversations — null threadId is the default ("main") one. */
  const [threads, setThreads] = useState<HealthChatThread[] | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  /* Last-write stamp per conversation ('main' key for the default thread),
     from chat_threads — drives the unseen-activity dots. */
  const [chatActivity, setChatActivity] = useState<Record<string, string>>({})
  /* The newest stamp the reader has actually opened, per conversation —
     kept in sessionStorage so a revisit in the same tab doesn't re-dot
     activity they already read. */
  const [seenAt, setSeenAt] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k?.startsWith(SEEN_PREFIX)) out[k.slice(SEEN_PREFIX.length)] = sessionStorage.getItem(k) ?? ''
      }
    } catch {
      /* storage blocked — the dots just never show */
    }
    return out
  })
  /* Distress-flagged turns already dismissed this session. */
  const [crisisDismissed, setCrisisDismissed] = useState<Set<string>>(new Set())
  /* The running send's abort handle — the Stop pill cancels the stream. */
  const abortRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = usePortalChatDraft(`dutiva:health-chat:${threadId ?? 'main'}`)
  /* Stick-to-bottom follows new turns + streamed deltas; scrolling up to
     read history releases it (farUp then drives the jump pill). */
  const { logRef, stickToBottom, capturePrepend, farUp, hasNew } = useStickToBottom([
    turns,
    sending,
    streamed,
    streamedReasoning,
  ])
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(inputRef, draft)

  const isInternal = isInternalDutivaAccount(session?.user?.email)

  /* Per-turn mutations — undo/delete/rate/reason + their armed and busy
     flags. The hook owns them; the row reports through the handlers. */
  const {
    undoing,
    delArmed,
    deleting,
    reasonFor,
    setReasonFor,
    undo,
    removeTurn,
    rate,
    pickReason,
  } = useHealthChatTurnOps(turns, setTurns)

  /* The conversation the reader has seen through — activity newer than
     this stamp dots the switcher. Persisted per thread in sessionStorage. */
  const markSeen = (id: string | null, at?: string) => {
    const key = id ?? 'main'
    const stamp = at ?? new Date().toISOString()
    setSeenAt((prev) => (prev[key] && prev[key] >= stamp ? prev : { ...prev, [key]: stamp }))
    try {
      const stored = sessionStorage.getItem(`${SEEN_PREFIX}${key}`)
      if (!stored || stamp > stored) sessionStorage.setItem(`${SEEN_PREFIX}${key}`, stamp)
    } catch {
      /* storage blocked — dots just won't persist */
    }
  }

  /* History reloads whenever the thread changes — skeleton shows while the
     scoped page loads. The thread list loads once. A failed fetch shows an
     inline error with retry — never a greeting over turns that may exist. */
  const loadHistory = async (id: string | null) => {
    setTurns(null)
    setSuggests([])
    setLoadError(false)
    try {
      const rows = await loadHealthChatHistory(HISTORY_PAGE, undefined, id)
      setTurns(rows)
      /* A full page back means older turns probably exist. */
      setHasMore(rows.length === HISTORY_PAGE)
      markSeen(id, rows[rows.length - 1]?.createdAt)
    } catch {
      setTurns([])
      setLoadError(true)
    }
  }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- loadHistory is scoped to the thread param it receives
  useEffect(() => {
    void loadHistory(threadId)
  }, [threadId])

  const refreshThreads = async () => {
    try {
      const { threads: rows, activity } = await listHealthChatThreads()
      setThreads(rows)
      setChatActivity(activity)
    } catch {
      /* Best-effort — the switcher simply shows what it had. */
    }
  }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- one-shot load on mount
  useEffect(() => {
    void refreshThreads()
  }, [])

  /* Composer focus on desktop — the page's one job is typing. Pointer-fine
     only: on touch, autofocus yanks the keyboard open over the history. */
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus()
  }, [])

  /* While the tab sits open, pick up turns another writer added — a
     reaction line from elsewhere in the portal lands in the default
     conversation without a send. Append-only merge on row ids; the same
     tick refreshes thread activity so a reaction in ANOTHER thread dots
     the switcher instead of going unseen. */
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || sending) return
      try {
        const rows = await loadHealthChatHistory(20, undefined, threadId)
        setTurns((prev) => {
          if (!prev) return prev
          const seen = new Set(prev.map((t) => t.id))
          /* A send stopped mid-stream keeps its local u-/a- ids while the
             server persists the real pair — dedupe those on role+content,
             not just the id they never got to adopt. */
          const localOnly = new Set(
            prev
              .filter((t) => !UUID_RE.test(t.id))
              .map((t) => `${t.role} ${t.content}`),
          )
          const fresh = rows.filter(
            (r) => !seen.has(r.id) && !localOnly.has(`${r.role} ${r.content}`),
          )
          /* The response is the server's whole tail — a persisted turn
             inside that window that's missing was deleted elsewhere (or
             the thread was cleared when the window came back empty), and
             the old append-only merge left the ghost on screen forever.
             Optimistic local rows sit outside the server's view; keep
             them. */
          const windowStart = rows[0]?.createdAt
          const windowIds = new Set(rows.map((r) => r.id))
          const kept = prev.filter(
            (t) =>
              !UUID_RE.test(t.id) ||
              (windowStart !== undefined &&
                (t.createdAt < windowStart || windowIds.has(t.id))),
          )
          if (fresh.length === 0 && kept.length === prev.length) return prev
          return [...kept, ...fresh].sort((a, b) =>
            a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
          )
        })
        /* Reading this thread now — its tail stamp is the seen marker, so
           the switcher never dots the conversation you're sitting in. */
        const newest = rows[rows.length - 1]
        if (newest) markSeen(threadId, newest.createdAt)
      } catch {
        /* The poll is best-effort — a miss just means next tick. */
      }
      void refreshThreads()
    }
    const t = setInterval(() => void poll(), 45_000)
    return () => clearInterval(t)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- refreshThreads is stable enough for a poll
  }, [sending, threadId])

  /* Older page — the server takes the oldest loaded turn's created_at as the
     cursor; capturePrepend keeps the viewport on the same message. */
  const loadEarlier = async () => {
    const oldest = turns?.[0]?.createdAt
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadHealthChatHistory(HISTORY_PAGE, oldest, threadId)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(HM.health_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  /* Shared tail of send + regenerate — appends the assistant turn, adopts
     its suggestions, and refreshes a named thread's freshly-set title. */
  const adoptReply = (
    result: {
      reply: string
      action: HealthChatAction | null
      userId: string | null
      assistantId: string | null
      suggests: string[]
      reasoning: string | null
      context: HealthChatContext | null
    },
    localUserId: string,
  ) => {
    setTurns((prev) => [
      /* The optimistic user turn trades its local id for the persisted row
         id — the history poll dedupes on ids, and a `u-…` turn would be
         re-added as a duplicate bubble once the stored row arrives. */
      ...(prev ?? []).map((t) =>
        result.userId && t.id === localUserId ? { ...t, id: result.userId } : t,
      ),
      {
        /* The persisted row id when the insert landed — rating needs it. */
        id: result.assistantId ?? `a-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        action: result.action,
        reasoning: result.reasoning,
        feedback: null,
        contextUsed: result.context,
        createdAt: new Date().toISOString(),
      },
    ])
    setSuggests(result.suggests)
    if (threadId) {
      void refreshThreads()
    }
    return result.action?.ok ? refresh() : Promise.resolve()
  }

  const sendText = async (message: string) => {
    /* turns===null means history is still loading — a send now would be
       wiped when the fetch resolves and the optimistic turn is replaced. */
    if (!message || sending || turns === null) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSending(true)
    setStreamed('')
    setStreamedReasoning('')
    setSuggests([])
    setReasonFor(null)
    /* Optimistic user turn — your message should appear the moment you send,
       not after the reply round-trips. Sending always returns to the end of
       the log even if the reader had scrolled up. */
    const userTurn: HealthChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      action: null,
      feedback: null,
      /* Distress words pin the crisis line under this bubble — a quiet
         in-log note, not a fake reply. */
      distress: DISTRESS_RE.test(message) || undefined,
      createdAt: new Date().toISOString(),
    }
    stickToBottom()
    markSeen(threadId)
    setTurns((prev) => [...(prev ?? []), userTurn])
    /* The abort catch can't see streamed state that landed after the send
       began — locals capture the cumulative text + trace. */
    let streamedSoFar = ''
    let reasoningSoFar = ''
    try {
      /* onDelta turns on SSE — the reply types into the pending bubble as
         it generates; the final payload stays authoritative. */
      const result = await sendHealthChat(
        message,
        lang,
        (t) => {
          streamedSoFar = t
          setStreamed(t)
        },
        {
          threadId,
          signal: ctrl.signal,
          onReasoning: (t) => {
            reasoningSoFar = t
            setStreamedReasoning(t)
          },
        },
      )
      await adoptReply(result, userTurn.id)
    } catch (err) {
      if (isAbort(err) || ctrl.signal.aborted) {
        /* Stop pressed — keep whatever streamed in as a local turn (the
           server may still persist the full reply; reload reconciles). The
           partial thinking trace rides the turn so it isn't lost, and the
           turn is flagged stopped so the partial text can't pass for a
           finished answer. */
        if (streamedSoFar) {
          setTurns((prev) => [
            ...(prev ?? []),
            {
              id: `a-${Date.now()}`,
              role: 'assistant' as const,
              content: streamedSoFar,
              action: null,
              reasoning: reasoningSoFar || null,
              feedback: null,
              stopped: true,
              createdAt: new Date().toISOString(),
            },
          ])
        }
      } else {
        showToast(HM.health_chat_error)
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
      setStreamedReasoning('')
    }
  }

  const send = () => {
    const message = draft.trim()
    if (!message || sending || turns === null) return
    setDraft('')
    void sendText(message)
  }

  /* A failed turn disappears and its text goes back through sendText —
     same pipe as a fresh send. */
  const retry = (turn: HealthChatTurn) => {
    if (sending) return
    setTurns((prev) => (prev ?? []).filter((t) => t.id !== turn.id))
    void sendText(turn.content)
  }

  /* Edit a failed send instead of retrying it verbatim — the text goes
     back to the composer and the failed bubble clears. */
  const editFailed = (turn: HealthChatTurn) => {
    setTurns((prev) => (prev ?? []).filter((t) => t.id !== turn.id))
    setDraft(turn.content)
    inputRef.current?.focus()
  }

  /* Try another answer — the server drops the last pair and re-asks, so
     locally the pair leaves too; the fresh reply streams into the pending
     bubble like a normal send. */
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
    setStreamedReasoning('')
    setSuggests([])
    setReasonFor(null)
    stickToBottom()
    /* The pair leaves the log — it's deleted server-side either way; the
       re-asked question re-appears as a fresh optimistic turn. */
    const pairIds = [last.id, prevUser.id]
    const reuserId = `u-${Date.now()}`
    setTurns((prev) => (prev ?? []).filter((t) => !pairIds.includes(t.id)))
    setTurns((prev) => [
      ...(prev ?? []),
      {
        id: reuserId,
        role: 'user',
        content: prevUser.content,
        action: null,
        feedback: null,
        createdAt: new Date().toISOString(),
      },
    ])
    try {
      const result = await regenerateHealthChat(lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
        onReasoning: setStreamedReasoning,
      })
      await adoptReply(result, reuserId)
    } catch (err) {
      if (!(isAbort(err) || ctrl.signal.aborted)) {
        showToast(HM.health_chat_error)
        /* The server never deleted the stale pair on failure — reload the
           thread so it returns instead of leaving a bare re-asked line. */
        loadHealthChatHistory(HISTORY_PAGE, undefined, threadId)
          .then((rows) => {
            setTurns(rows)
            setHasMore(rows.length === HISTORY_PAGE)
          })
          .catch(() => {})
      }
    } finally {
      abortRef.current = null
      setSending(false)
      setStreamed('')
      setStreamedReasoning('')
    }
  }

  /* Reuse — copies a sent turn back into the composer for editing; the
     original history row is untouched. */
  const reuse = (turn: HealthChatTurn) => {
    setDraft(turn.content)
    inputRef.current?.focus()
  }

  /* Switcher ops — rename keeps an empty string meaningful (resets to
     untitled, so the next message names it again); delete returns the
     reader to main if they were inside the removed thread. */
  const renameThread = async (id: string, title: string) => {
    try {
      await renameHealthChatThread(id, title)
      setThreads((prev) =>
        (prev ?? []).map((t) => (t.id === id ? { ...t, title: title || null } : t)),
      )
    } catch {
      showToast(HM.health_chat_error)
    }
  }
  const removeThread = async (id: string) => {
    try {
      await deleteHealthChatThread(id)
      setThreads((prev) => (prev ?? []).filter((t) => t.id !== id))
      if (threadId === id) setThreadId(null)
    } catch {
      showToast(HM.health_chat_error)
    }
  }

  /* Whole-transcript copy — data portability without a download file.
     Header lines carry the day chip wording the reader already sees.
     When the loaded page is only the tail, page backwards first so the
     pasted transcript isn't silently missing older turns. */
  const exportChat = async () => {
    const rows = turns ?? []
    if (!rows.length) return
    let all = rows
    if (hasMore) {
      try {
        const earlier: HealthChatTurn[] = []
        let cursor: string | undefined = rows[0]?.createdAt
        for (let i = 0; cursor && i < 25; i++) {
          const page = await loadHealthChatHistory(HISTORY_PAGE, cursor, threadId)
          if (page.length === 0) break
          earlier.unshift(...page)
          const next = page.at(0)?.createdAt
          if (page.length < HISTORY_PAGE || next === cursor) break
          cursor = next
        }
        all = [...earlier, ...rows]
      } catch {
        /* Fall back to what's loaded — a partial transcript beats none. */
      }
    }
    const who = (t: HealthChatTurn) => (t.role === 'user' ? youLabel : 'Mira')
    const text = all
      .map(
        (t) =>
          `${who(t)} · ${formatTurnDay(t.createdAt, lang, dayLabels)} ${formatTurnTime(t.createdAt, lang)}\n${t.content}`,
      )
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast(HM.health_chat_export_done)
    } catch {
      showToast(HM.health_chat_error)
    }
  }

  useEffect(() => {
    if (!clearArmed) return
    const t = window.setTimeout(() => setClearArmed(false), 3000)
    return () => window.clearTimeout(t)
  }, [clearArmed])

  const clear = async () => {
    if (clearing) return
    if (!clearArmed) {
      setClearArmed(true)
      return
    }
    setClearArmed(false)
    setClearing(true)
    try {
      await clearHealthChat(threadId)
      setTurns([])
      setHasMore(false)
      setSuggests([])
      markSeen(threadId)
      inputRef.current?.focus()
    } catch {
      showToast(HM.health_chat_error)
    } finally {
      setClearing(false)
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
    /* An untitled thread with no activity is empty — reuse it instead of
       stacking another "Untitled conversation" the reader can't tell apart
       or clean up. */
    const empty = (threads ?? []).find((t) => t.title === null && !t.lastActivityAt)
    if (empty) {
      setThreadId(empty.id)
      return
    }
    try {
      const t = await newHealthChatThread()
      setThreads((prev) => [...(prev ?? []), t])
      setThreadId(t.id)
      inputRef.current?.focus()
    } catch {
      showToast(HM.health_chat_error)
    }
  }

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a teaching one. */
  const starters = [
    x(HM.health_chat_starter_1),
    x(HM.health_chat_starter_2),
    x(isInternal ? HM.health_chat_starter_int : HM.health_chat_starter_ext),
  ]
  const reasonChips = [
    x(HM.health_chat_reason_wrong),
    x(HM.health_chat_reason_vague),
    x(HM.health_chat_reason_tone),
  ]
  const activeThread = threads?.find((t) => t.id === threadId)
  const threadName = threadId
    ? (activeThread?.title ?? x(HM.health_chat_thread_untitled))
    : x(HM.health_chat_thread_default)
  const dayLabels = { today: x(HM.health_chat_day_today), yesterday: x(HM.health_chat_day_yesterday) }
  const youLabel = lang === 'fr' ? 'Vous' : 'You'

  /* Threads (and 'main') with activity newer than the reader's last-opened
     stamp — dot on the switcher trigger and on the rows themselves. */
  const otherActive = new Set<string>()
  for (const [key, at] of Object.entries(chatActivity)) {
    if (key === (threadId ?? 'main')) continue
    if (at > (seenAt[key] ?? '')) otherActive.add(key)
  }

  /* Quiet a day? Offer the starters again under the tail — a stale
     transcript otherwise gives nothing to tap. */
  const lastTurnAt = turns?.length ? Date.parse(turns.at(-1)!.createdAt) : 0
  const stale = turns !== null && turns.length > 0 && !sending && Date.now() - lastTurnAt > STALE_AFTER_MS

  return (
    <div className="sb hb sb-page">
      <HealthChatHeader
        x={x}
        isInternal={isInternal}
        threadName={threadName}
        threads={threads ?? []}
        threadId={threadId}
        sending={sending}
        activity={otherActive}
        hasTurns={turns !== null && turns.length > 0}
        clearArmed={clearArmed}
        clearing={clearing}
        onOpen={openThread}
        onNew={() => void startThread()}
        onRename={(id, title) => void renameThread(id, title)}
        onDelete={(id) => void removeThread(id)}
        onExport={() => void exportChat()}
        onClear={() => void clear()}
      />

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log-wrap">
          <div
            className="sbchat-log"
            ref={logRef}
            role="log"
            aria-label={x(HM.health_chat_log_label)}
            aria-live="polite"
            aria-busy={turns === null || sending}
          >
            {hasMore && (
              <button
                type="button"
                className="sbchat-more"
                onClick={() => void loadEarlier()}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  x(HM.health_chat_load_earlier)
                )}
              </button>
            )}
            {turns === null ? (
              <>
                <div className="sbchat-bubble assistant sbchat-ghost sbchat-g-a" aria-hidden="true" />
                <div className="sbchat-bubble user sbchat-ghost sbchat-g-b" aria-hidden="true" />
                <span className="sr-only">{x(HM.health_chat_loading)}</span>
              </>
            ) : loadError ? (
              /* The greeting can't claim a fresh start over turns that may
                 exist — an honest error with a way back instead. */
              <div className="sbchat-loaderr" role="alert">
                <span>{x(HM.health_chat_load_failed)}</span>
                <button
                  type="button"
                  className="sbchat-retry"
                  onClick={() => void loadHistory(threadId)}
                >
                  {x(HM.health_chat_retry)}
                </button>
              </div>
            ) : turns.length === 0 ? (
              /* She speaks first — a greeting built locally from HealthState,
                 not a stored turn, so clearing history brings it back. The
                 chips are tappable sends — they teach the surface without
                 typing. */
              <>
                <div className="sbchat-bubble assistant">{companionGreeting(state, lang)}</div>
                <p className="sbchat-starters-label">{x(HM.health_chat_starters_label)}</p>
                <ChipRow
                  chips={starters}
                  className="sbchat-starters"
                  chipClass="sbchat-starter"
                  onPick={(s) => void sendText(s)}
                />
                <Link className="sbchat-recap" to="/health/insights?recap=1">
                  {x(HM.health_chat_recap_link)}
                </Link>
              </>
            ) : (
              turns.map((t, i) => {
                const prev = i > 0 ? turns[i - 1] : undefined
                return (
                  <HealthChatTurnRow
                    key={t.id}
                    t={t}
                    showDay={!prev || !sameTurnDay(prev.createdAt, t.createdAt)}
                    isLastAssistant={
                      t.role === 'assistant' && i === turns.length - 1 && UUID_RE.test(t.id)
                    }
                    x={x}
                    lang={lang}
                    dayLabels={dayLabels}
                    reasonChips={reasonChips}
                    sending={sending}
                    undoing={undoing}
                    deleting={deleting}
                    delArmed={delArmed}
                    reasonFor={reasonFor}
                    crisisDismissed={crisisDismissed.has(t.id)}
                    onRetry={retry}
                    onEditFailed={editFailed}
                    onReuse={reuse}
                    onRate={(id, rating) => void rate(id, rating)}
                    onPickReason={(id, r) => void pickReason(id, r)}
                    onDismissReasons={() => setReasonFor(null)}
                    onRegenerate={() => void regenerate()}
                    onUndo={(id) => void undo(id)}
                    onRemoveTurn={(turn) => void removeTurn(turn)}
                    onDismissCrisis={(id) =>
                      setCrisisDismissed((prev) => new Set(prev).add(id))
                    }
                  />
                )
              })
            )}
            {sending && (
              <HealthChatPendingBubble
                streamed={streamed}
                streamedReasoning={streamedReasoning}
                x={x}
                onStop={() => abortRef.current?.abort()}
              />
            )}
            {/* Follow-up chips — the reply's own suggested next asks. On a
                quiet-a-day transcript the starters resurface instead. */}
            {!sending && suggests.length > 0 && (
              <ChipRow
                chips={suggests}
                label={x(HM.health_chat_followup_label)}
                className="sbchat-starters"
                chipClass="sbchat-starter"
                onPick={(s) => void sendText(s)}
              />
            )}
            {!sending && suggests.length === 0 && stale && (
              <>
                <p className="sbchat-starters-label">{x(HM.health_chat_starters_label)}</p>
                <ChipRow
                  chips={starters}
                  label={x(HM.health_chat_starters_label)}
                  className="sbchat-starters"
                  chipClass="sbchat-starter"
                  onPick={(s) => void sendText(s)}
                />
              </>
            )}
          </div>
          {farUp && (
            <JumpToLatest
              label={x(HM.health_chat_jump)}
              hasNew={hasNew}
              className="sbchat-jump"
              dotClass="sbchat-jump-dot"
              onJump={stickToBottom}
            />
          )}
        </div>

        <HealthChatComposer
          inputRef={inputRef}
          draft={draft}
          onDraft={setDraft}
          onSend={send}
          disabled={sending || turns === null || !draft.trim()}
          x={x}
        />
      </section>
    </div>
  )
}
