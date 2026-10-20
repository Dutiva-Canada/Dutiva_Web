import './strategies.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  CornerDownLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Send,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { advisorCore as AM } from '@/i18n/messages/advisorCore'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  clearInvestChat,
  listInvestChatThreads,
  loadInvestChatHistory,
  newInvestChatThread,
  rateInvestChatTurn,
  regenerateInvestChat,
  sendInvestChat,
  splitAttachmentManifest,
  undoInvestChatAction,
  type InvestChatAction,
  type InvestChatThread,
  type InvestChatTurn,
} from '@/features/invest/data/chatApi'
import {
  ATTACHMENT_ACCEPT,
  AttachmentError,
  MAX_ATTACHMENTS,
  attachmentFromFile,
  type AdvisorAttachment,
  type AttachmentIssue,
} from '@/features/app/advisor/attachments'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  ChipRow,
  CopyTurnButton,
  JumpToLatest,
  ReasonChips,
  ReasoningBlock,
  SourcesBlock,
  ThreadSwitcher,
} from '@/components/chat/portalChat'
import {
  formatTurnDay,
  formatTurnTime,
  sameTurnDay,
  useAutoGrowTextarea,
  usePortalChatDraft,
  useStickToBottom,
  type ChatSourceRow,
} from '@/components/chat/portalChatUtils'
import { tallyGreeting } from './strategyUi'
import { useInvestHead } from './useInvestHead'
import { PageHead } from './PageHead'

/* Markdown + widget-fence rendering is a lazy chunk (react-markdown,
   remark-gfm, the widget spec parser) — the bubble falls back to verbatim
   text while it loads. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in invest-ai/handlers.ts. */
function actionLabel(
  action: InvestChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const name = action.detail
  switch (action.type) {
    case 'add_watch_symbol':
      return x(IM.invest_chat_did_watch).replace('{name}', name)
    case 'remove_watch_symbol':
      return x(IM.invest_chat_did_unwatch).replace('{name}', name)
    case 'create_order':
      return x(IM.invest_chat_did_order).replace('{name}', name)
    case 'update_signal':
      return x(IM.invest_chat_did_signal).replace('{name}', name)
    case 'draft_strategy':
      return x(IM.invest_chat_did_strategy).replace('{name}', name)
    case 'add_position':
      return x(IM.invest_chat_did_position).replace('{name}', name)
    case 'draft_thesis':
      return x(IM.invest_chat_did_thesis).replace('{name}', name)
    case 'set_goal':
      return x(IM.invest_chat_did_goal).replace('{name}', name)
    case 'record_cash':
      return x(IM.invest_chat_did_cash).replace('{name}', name)
    case 'set_recurring':
      return x(IM.invest_chat_did_recurring).replace('{name}', name)
    case 'record_dividend':
      return x(IM.invest_chat_did_dividend).replace('{name}', name)
    case 'record_split':
      return x(IM.invest_chat_did_split).replace('{name}', name)
    default:
      return ''
  }
}

/** The portal page the action's write lands on — the chip's "View" link. */
function actionRoute(action: InvestChatAction): string | null {
  switch (action.type) {
    case 'create_order':
      return '/invest/orders'
    case 'add_watch_symbol':
    case 'remove_watch_symbol':
    case 'add_position':
      return '/invest/portfolio'
    case 'update_signal':
      return '/invest/signals'
    case 'draft_strategy':
      return '/invest/strategies'
    case 'draft_thesis':
      return '/invest/theses'
    case 'set_goal':
      return '/invest/analysis'
    case 'record_cash':
    case 'set_recurring':
    case 'record_dividend':
    case 'record_split':
      return '/invest/portfolio'
    default:
      return null
  }
}

const HISTORY_PAGE = 40
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/* Show the running count only once the 1200-char cap is in sight. */
const COUNT_FROM = 1000

/** True when a failed send was the reader's own stop — an aborted stream
    keeps its partial text instead of flagging the turn failed. */
function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

/**
 * Tally — the book's watch clerk. A chat over the user's own portfolio rows
 * that can also act: watch/unwatch a symbol, queue a draft order, update a
 * signal's status, or file a strategy draft for review. Orders land
 * 'queued' — the only fill path stays the manual execute action. History
 * persists server-side (invest_chat_messages); actions refresh the shared
 * InvestDataContext so every other tab reflects them immediately.
 */
export function InvestChatPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()
  useInvestHead(IM.invest_seo_title_chat, IM.invest_seo_desc_chat)

  const [turns, setTurns] = useState<InvestChatTurn[] | null>(null)
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  /* The in-flight thinking trace — reasoning pieces land ahead of the
     reply, so the thinking panel fills while the bubble is still waiting. */
  const [streamedReasoning, setStreamedReasoning] = useState('')
  /* True while the model's live web lookup runs — the pending bubble
     swaps its typing line for a "searching" status until the reply
     starts streaming. */
  const [searching, setSearching] = useState(false)
  const [undoing, setUndoing] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  /* Clear wipes the thread — two-tap like every other destructive control
     in the portal; auto-disarms so an armed button never lingers. */
  const [clearArmed, setClearArmed] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Follow-up chips from the latest reply — ephemeral, cleared on send. */
  const [suggests, setSuggests] = useState<string[]>([])
  /* Named conversations — null threadId is the default ("main") one. */
  const [threads, setThreads] = useState<InvestChatThread[] | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  /* Turn id whose downvote is waiting on a reason chip pick. */
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  /* The running send's abort handle — the Stop pill cancels the stream. */
  const abortRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = usePortalChatDraft(`dutiva:invest-chat:${threadId ?? 'main'}`)
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
  /* Files staged on the composer — cleared on send, capped at
     MAX_ATTACHMENTS. Images ride as data URLs, documents as extracted
     text; the server re-validates everything. */
  const [pendingAtt, setPendingAtt] = useState<AdvisorAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isInternal = isInternalDutivaAccount(session?.user?.email)

  /* History reloads whenever the thread changes — skeleton shows while the
     scoped page loads. The thread list loads once. */
  const historyGen = useRef(0)
  useEffect(() => {
    const gen = ++historyGen.current
    setTurns(null)
    setSuggests([])
    setHasMore(false)
    loadInvestChatHistory(HISTORY_PAGE, undefined, threadId)
      .then((rows) => {
        /* A stale load must never land — a fast thread switch would show
           the previous conversation's turns under the new selection. */
        if (gen !== historyGen.current) return
        setTurns(rows)
        /* A full page back means older turns probably exist. */
        setHasMore(rows.length === HISTORY_PAGE)
      })
      .catch(() => {
        if (gen !== historyGen.current) return
        setTurns([])
      })
  }, [threadId])

  useEffect(() => {
    listInvestChatThreads()
      .then(setThreads)
      .catch(() => setThreads([]))
  }, [])

  /* While the tab sits open, pick up turns another writer added — the
     scheduled invest-bot insight lands in the default conversation without
     a send. The merge dedupes on ids, on role+content for local stubs that
     never adopted a server id, and drops persisted rows that vanished —
     a poll never reorders local turns. */
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || sending) return
      try {
        const rows = await loadInvestChatHistory(20, undefined, threadId)
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
          /* A stopped send keeps its partial as a local turn while the
             server finishes the same reply — the poll then delivers the
             persisted row. Adopt it in place (full text, real id) rather
             than stacking the reply twice; the streamed partial is always
             a prefix of the persisted reply since the server buffers the
             text before the delta leaves. */
          const stoppedLocal = prev.filter(
            (t) => !UUID_RE.test(t.id) && t.role === 'assistant' && t.stopped && t.content,
          )
          const adopted = new Map<string, InvestChatTurn>()
          const fresh = rows.filter((r) => {
            if (seen.has(r.id) || localOnly.has(`${r.role} ${r.content}`)) return false
            if (r.role === 'assistant') {
              const stop = stoppedLocal.find(
                (t) => !adopted.has(t.id) && r.content.startsWith(t.content),
              )
              if (stop) {
                adopted.set(stop.id, r)
                return false
              }
            }
            return true
          })
          /* The response is the server's whole tail — a persisted turn
             inside that window that's missing was deleted elsewhere (or
             the thread was cleared when the window came back empty), and
             the old append-only merge left the ghost on screen forever.
             Optimistic local rows sit outside the server's view; keep
             them. */
          const windowStart = rows[0]?.createdAt
          const windowIds = new Set(rows.map((r) => r.id))
          const kept = prev
            .filter(
              (t) =>
                !UUID_RE.test(t.id) ||
                (windowStart !== undefined &&
                  (t.createdAt < windowStart || windowIds.has(t.id))),
            )
            .map((t) => adopted.get(t.id) ?? t)
          if (fresh.length === 0 && adopted.size === 0 && kept.length === prev.length) return prev
          return [...kept, ...fresh].sort((a, b) =>
            a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
          )
        })
      } catch {
        /* The poll is best-effort — a miss just means next tick. */
      }
    }
    const t = setInterval(() => void poll(), 45_000)
    return () => clearInterval(t)
  }, [sending, threadId])

  /* Older page — the server takes the oldest loaded turn's created_at as the
     cursor; capturePrepend keeps the viewport on the same message. */
  const loadEarlier = async () => {
    const oldest = turns?.[0]?.createdAt
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadInvestChatHistory(HISTORY_PAGE, oldest, threadId)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(IM.invest_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  /* Shared tail of send + regenerate — appends the assistant turn, adopts
     its suggestions, and refreshes a named thread's freshly-set title. */
  const adoptReply = (
    result: {
      reply: string
      action: InvestChatAction | null
      userId: string | null
      assistantId: string | null
      suggests: string[]
      reasoning: string | null
      sources: ChatSourceRow[]
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
        sources: result.sources,
        feedback: null,
        createdAt: new Date().toISOString(),
      },
    ])
    setSuggests(result.suggests)
    if (threadId) {
      void listInvestChatThreads()
        .then(setThreads)
        .catch(() => {})
    }
    return result.action?.ok ? refresh() : Promise.resolve()
  }

  /* Refused attachments surface as toasts — the file never entered the
     transcript, so there is no turn to hang the message on. Same chrome
     strings as the Advisor's composer. */
  const attachIssueToast = (issue: AttachmentIssue) => {
    showToast(
      issue === 'unsupported_type'
        ? AM.advisor_attach_issue_unsupported
        : issue === 'too_large'
          ? AM.advisor_attach_issue_too_large
          : issue === 'empty'
            ? AM.advisor_attach_issue_empty
            : issue === 'too_many'
              ? AM.advisor_attach_issue_too_many
              : AM.advisor_attach_issue_read,
      'info',
    )
  }
  const attachFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (pendingAtt.length >= MAX_ATTACHMENTS) {
        attachIssueToast('too_many')
        break
      }
      void attachmentFromFile(file)
        .then((a) =>
          setPendingAtt((prev) => (prev.length >= MAX_ATTACHMENTS ? prev : [...prev, a])),
        )
        .catch((e: unknown) =>
          attachIssueToast(e instanceof AttachmentError ? e.issue : 'read_failed'),
        )
    }
  }

  const sendText = async (message: string, atts?: AdvisorAttachment[]) => {
    /* turns === null means the thread's history hasn't resolved — a send
       here would be wiped the moment the fetch lands. */
    if ((!message && !atts?.length) || sending || turns === null) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSending(true)
    setStreamed('')
    setStreamedReasoning('')
    setSearching(false)
    setSuggests([])
    setReasonFor(null)
    /* Optimistic user turn — your message should appear the moment you send,
       not after the reply round-trips. Sending always returns to the end of
       the log even if the reader had scrolled up. */
    const userTurn: InvestChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      action: null,
      feedback: null,
      attachments: atts?.length ? atts : undefined,
      createdAt: new Date().toISOString(),
    }
    stickToBottom()
    setTurns((prev) => [...(prev ?? []), userTurn])
    /* The abort catch can't see streamedReasoning state that landed after
       the send began — a local captures the cumulative trace. */
    let reasoningSoFar = ''
    try {
      /* onDelta turns on SSE — the reply types into the pending bubble as
         it generates; the final payload stays authoritative. */
      const result = await sendInvestChat(message, lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
        attachments: atts,
        onReasoning: (t) => {
          reasoningSoFar = t
          setStreamedReasoning(t)
        },
        onStatus: (code) => {
          if (code === 'web_search') setSearching(true)
        },
      })
      await adoptReply(result, userTurn.id)
    } catch (err) {
      if (isAbort(err) || ctrl.signal.aborted) {
        /* Stop pressed — keep whatever streamed in as a local turn flagged
           stopped so the history poll adopts the persisted full reply into
           this slot instead of stacking a second bubble. The partial
           thinking trace rides the turn so it isn't lost. */
        const partialReasoning = reasoningSoFar || null
        setStreamed((partial) => {
          if (partial) {
            setTurns((prev) => [
              ...(prev ?? []),
              {
                id: `a-${Date.now()}`,
                role: 'assistant' as const,
                content: partial,
                action: null,
                reasoning: partialReasoning,
                feedback: null,
                stopped: true,
                createdAt: new Date().toISOString(),
              },
            ])
          }
          return ''
        })
      } else {
        /* A modality refusal deserves its own words — the turn still
           fails, but the toast says why (the route's model can't see
           the file) rather than a bare "something went wrong". */
        showToast(
          (err as { code?: string }).code === 'modality_unsupported'
            ? AM.advisor_attach_modality
            : IM.invest_chat_error,
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
      setStreamedReasoning('')
      setSearching(false)
    }
  }

  const send = () => {
    const message = draft.trim()
    const atts = pendingAtt
    /* turns === null is checked here too — sendText's guard must not run
       after the draft has already been cleared. */
    if ((!message && atts.length === 0) || sending || turns === null) return
    setDraft('')
    setPendingAtt([])
    void sendText(message, atts.length ? atts : undefined)
  }

  /* A failed turn disappears and its text goes back through sendText —
     same pipe as a fresh send. Live attachment objects ride along so a
     retried image actually re-sends it (a manifest-only persisted row
     can't — its bytes are gone). */
  const retry = (turn: InvestChatTurn) => {
    if (sending) return
    setTurns((prev) => (prev ?? []).filter((t) => t.id !== turn.id))
    void sendText(turn.content, turn.attachments)
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
    setSearching(false)
    setSuggests([])
    setReasonFor(null)
    stickToBottom()
    /* Locally the pair stays — the pending bubble shows the re-asked
       question's progress; the old answer swaps out only when the new one
       lands or the call fails (the pair is gone server-side either way). */
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
      const result = await regenerateInvestChat(lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
        onReasoning: setStreamedReasoning,
        onStatus: (code) => {
          if (code === 'web_search') setSearching(true)
        },
      })
      await adoptReply(result, reuserId)
    } catch (err) {
      if (!(isAbort(err) || ctrl.signal.aborted)) {
        showToast(IM.invest_chat_error)
        /* The server never deleted the stale pair on failure — reload the
           thread so it returns instead of leaving a bare re-asked line. */
        loadInvestChatHistory(HISTORY_PAGE, undefined, threadId)
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
      setSearching(false)
    }
  }

  /* Reuse — copies a sent turn back into the composer for editing; the
     original history row is untouched. */
  const reuse = (turn: InvestChatTurn) => {
    setDraft(turn.content)
    inputRef.current?.focus()
  }

  /* Undo on an action chip — the server reverses the write while it's still
     reversible and marks it undone, so the chip doesn't offer it again
     after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoInvestChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(IM.invest_chat_undo_failed)
    } finally {
      setUndoing(null)
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
      await clearInvestChat(threadId)
      setTurns([])
      setHasMore(false)
      setSuggests([])
    } catch {
      showToast(IM.invest_chat_error)
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
      await rateInvestChatTurn(turnId, next)
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
      await rateInvestChatTurn(turnId, -1, reason)
    } catch {
      /* The rating itself already landed — a failed reason just leaves the
         downvote unexplained. */
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
      const t = await newInvestChatThread()
      setThreads((prev) => [...(prev ?? []), t])
      setThreadId(t.id)
    } catch {
      showToast(IM.invest_chat_error)
    }
  }

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a teaching one. */
  const starters = [
    x(IM.invest_chat_starter_1),
    x(IM.invest_chat_starter_2),
    x(isInternal ? IM.invest_chat_starter_int : IM.invest_chat_starter_ext),
  ]
  const reasonChips = [
    x(IM.invest_chat_reason_wrong),
    x(IM.invest_chat_reason_vague),
    x(IM.invest_chat_reason_tone),
  ]
  const activeThread = threads?.find((t) => t.id === threadId)
  const threadName = threadId
    ? (activeThread?.title ?? x(IM.invest_chat_thread_untitled))
    : x(IM.invest_chat_thread_default)
  const dayLabels = {
    today: x(IM.invest_chat_day_today),
    yesterday: x(IM.invest_chat_day_yesterday),
  }

  return (
    <div className="sb sb-page">
      {/* Internal-staff tier — the edge function advises @dutiva.ca
          accounts directly, so the "never investment advice" subtitle would
          be untrue for them; the badge makes the active register scannable. */}
      <PageHead
        title={x(IM.invest_chat_title)}
        actions={
          <div className="sbchat-head-actions">
            <ThreadSwitcher
              activeName={threadName}
              threads={threads ?? []}
              activeId={threadId}
              disabled={sending}
              labels={{
                defaultThread: x(IM.invest_chat_thread_default),
                untitled: x(IM.invest_chat_thread_untitled),
                newThread: x(IM.invest_chat_thread_new),
              }}
              buttonClass="sb-btn sb-btn-sm sb-btn-secondary"
              listClass="sbchat-thread-list"
              itemClass="sbchat-thread-item"
              newItemClass="sbchat-thread-new"
              onOpen={openThread}
              onNew={() => void startThread()}
            />
            {turns !== null && turns.length > 0 && (
              <button
                type="button"
                className="sb-btn sb-btn-sm sb-btn-secondary"
                onClick={() => void clear()}
                disabled={clearing || sending}
              >
                <Trash2 size={13} aria-hidden="true" />
                {x(clearArmed ? IM.invest_sb_tap_confirm : IM.invest_chat_clear)}
              </button>
            )}
          </div>
        }
        sub={
          <>
            {x(isInternal ? IM.invest_chat_sub_internal : IM.invest_chat_sub)}
            {isInternal && (
              <span className="sbchat-tier">{x(IM.invest_chat_internal_badge)}</span>
            )}
          </>
        }
      />
      {/* Data-source disclosure — an advice surface says what it reads. */}
      <details className="sbchat-sees">
        <summary>{x(IM.invest_chat_sees)}</summary>
        <p>{x(IM.invest_chat_sees_list)}</p>
      </details>
      {/* The review-loop contract in four lines — the least obvious mental
          model in the portal, explained where the person meets Tally. */}
      <details className="sbchat-sees">
        <summary>{x(IM.invest_tally_how_title)}</summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          <li>{x(IM.invest_tally_how_1)}</li>
          <li>{x(IM.invest_tally_how_2)}</li>
          <li>{x(IM.invest_tally_how_3)}</li>
          <li>{x(IM.invest_tally_how_4)}</li>
        </ul>
      </details>

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log-wrap">
          <div
            className="sbchat-log"
            ref={logRef}
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
                  x(IM.invest_chat_load_earlier)
                )}
              </button>
            )}
            {turns === null ? (
              <>
                <div className="sbchat-bubble assistant sbchat-ghost sbchat-g-a" aria-hidden="true" />
                <div className="sbchat-bubble user sbchat-ghost sbchat-g-b" aria-hidden="true" />
              </>
            ) : turns.length === 0 ? (
              /* She speaks first — a greeting built locally from InvestState,
                 not a stored turn, so clearing history brings it back. The
                 chips are tappable sends — they teach the surface without
                 typing. */
              <>
                <div className="sbchat-bubble assistant">{tallyGreeting(state, lang)}</div>
                <ChipRow
                  chips={starters}
                  className="sbchat-starters"
                  chipClass="sbchat-starter"
                  onPick={(s) => void sendText(s)}
                />
              </>
            ) : (
              turns.map((t, i) => {
                const prev = i > 0 ? turns[i - 1] : undefined
                const showDay = !prev || !sameTurnDay(prev.createdAt, t.createdAt)
                const route = t.action?.ok ? actionRoute(t.action) : null
                const isLastAssistant =
                  t.role === 'assistant' && i === turns.length - 1 && UUID_RE.test(t.id)
                /* User turns: live attachments on a fresh send render from
                   their objects; a reloaded row only has the "[Attached …]"
                   manifest lines — split them into the same chips so the two
                   states read identically. */
                const manifest = t.role === 'user' ? splitAttachmentManifest(t.content) : null
                const bubbleAtts = t.attachments?.length
                  ? t.attachments.map((a) => ({ kind: a.kind, name: a.name }))
                  : (manifest?.attachments ?? [])
                const userText = manifest && !t.attachments?.length ? manifest.text : t.content
                return (
                  <div key={t.id} style={{ display: 'contents' }}>
                    {showDay && (
                      <div className="sbchat-day" role="separator">
                        <span>{formatTurnDay(t.createdAt, lang, dayLabels)}</span>
                      </div>
                    )}
                    <div className={`sbchat-bubble ${t.role}`} data-failed={t.failed || undefined}>
                      {t.role === 'assistant' && t.reasoning && (
                        <ReasoningBlock
                          text={t.reasoning}
                          live={false}
                          label={x(IM.invest_chat_reasoning)}
                          hint={x(IM.invest_chat_reasoning_hint)}
                          className="sbchat-sees sbchat-think"
                          bodyClass="sbchat-think-body"
                        >
                          <Suspense fallback={t.reasoning}>
                            <ChatMarkdown widgetSurface="invest">{t.reasoning}</ChatMarkdown>
                          </Suspense>
                        </ReasoningBlock>
                      )}
                      {t.role === 'assistant' ? (
                        <Suspense fallback={t.content}>
                          <ChatMarkdown widgetSurface="invest">{t.content}</ChatMarkdown>
                        </Suspense>
                      ) : (
                        <>
                          {bubbleAtts.length > 0 && (
                            <span className="sbchat-attachments">
                              {bubbleAtts.map((a) => (
                                <span key={a.name} className="sbchat-attach">
                                  {a.kind === 'image' ? (
                                    <ImageIcon size={11} aria-hidden="true" />
                                  ) : (
                                    <FileText size={11} aria-hidden="true" />
                                  )}
                                  {a.name}
                                </span>
                              ))}
                            </span>
                          )}
                          {userText}
                        </>
                      )}
                      {t.role === 'assistant' && t.sources && t.sources.length > 0 && (
                        <SourcesBlock
                          sources={t.sources}
                          label={x(IM.invest_chat_sources)}
                          className="sbchat-sees sbchat-src"
                          listClass="sbchat-src-list"
                          itemClass="sbchat-src-item"
                          linkClass="sbchat-src-link"
                        />
                      )}
                      {t.failed && (
                        <span className="sbchat-bubble-meta">
                          {x(IM.invest_chat_error)}
                          <button
                            type="button"
                            className="sbchat-retry"
                            onClick={() => retry(t)}
                          >
                            <RotateCcw size={10} aria-hidden="true" /> {x(IM.invest_chat_retry)}
                          </button>
                        </span>
                      )}
                      {t.action && (
                        <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                          <Check size={11} aria-hidden="true" />
                          {t.action.ok ? actionLabel(t.action, x) : x(IM.invest_chat_action_failed)}
                          {route && (
                            <Link className="sbchat-chip-link" to={route}>
                              {x(IM.invest_chat_view)}
                            </Link>
                          )}
                          {t.action.ok &&
                            t.action.refId &&
                            UUID_RE.test(t.id) &&
                            (t.action.undone ? (
                              <em className="sbchat-chip-undone">{x(IM.invest_chat_undone)}</em>
                            ) : (
                              <button
                                type="button"
                                className="sbchat-chip-undo"
                                disabled={undoing === t.id}
                                onClick={() => void undo(t.id)}
                              >
                                {x(IM.invest_chat_undo)}
                              </button>
                            ))}
                        </span>
                      )}
                      {!t.failed && (
                        <span className="sbchat-bubble-meta">
                          <time>{formatTurnTime(t.createdAt, lang)}</time>
                          {t.role === 'user' && (
                            <button
                              type="button"
                              className="sbchat-rate-btn"
                              aria-label={x(IM.invest_chat_reuse)}
                              title={x(IM.invest_chat_reuse)}
                              onClick={() => reuse(t)}
                            >
                              <CornerDownLeft size={12} aria-hidden="true" />
                            </button>
                          )}
                          {t.role === 'assistant' && UUID_RE.test(t.id) && (
                            <span className="sbchat-rate">
                              <CopyTurnButton
                                text={t.content}
                                label={x(IM.invest_chat_copy)}
                                className="sbchat-rate-btn"
                              />
                              <button
                                type="button"
                                className="sbchat-rate-btn"
                                aria-label={x(IM.invest_chat_rate_up)}
                                aria-pressed={t.feedback === 1}
                                onClick={() => void rate(t.id, 1)}
                              >
                                <ThumbsUp size={12} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="sbchat-rate-btn"
                                aria-label={x(IM.invest_chat_rate_down)}
                                aria-pressed={t.feedback === -1}
                                onClick={() => void rate(t.id, -1)}
                              >
                                <ThumbsDown size={12} aria-hidden="true" />
                              </button>
                              {isLastAssistant && !sending && (
                                <button
                                  type="button"
                                  className="sbchat-rate-btn"
                                  aria-label={x(IM.invest_chat_regenerate)}
                                  title={x(IM.invest_chat_regenerate)}
                                  onClick={() => void regenerate()}
                                >
                                  <RefreshCw size={12} aria-hidden="true" />
                                </button>
                              )}
                            </span>
                          )}
                        </span>
                      )}
                      {/* One-tap reason chips after a downvote — the rating
                          alone learns nothing; these say why. */}
                      {reasonFor === t.id && !t.feedbackReason && (
                        <ReasonChips
                          label={x(IM.invest_chat_reason_label)}
                          reasons={reasonChips}
                          className="sbchat-reasons"
                          chipClass="sbchat-reason"
                          onPick={(r) => void pickReason(t.id, r)}
                        />
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {sending && (
              <div className="sbchat-bubble assistant">
                {streamedReasoning && (
                  <ReasoningBlock
                    text={streamedReasoning}
                    live={sending}
                    label={x(IM.invest_chat_reasoning)}
                    hint={x(IM.invest_chat_reasoning_hint)}
                    className="sbchat-sees sbchat-think"
                    bodyClass="sbchat-think-body"
                  >
                    <Suspense fallback={streamedReasoning}>
                      <ChatMarkdown widgetSurface="invest" streaming>
                        {streamedReasoning}
                      </ChatMarkdown>
                    </Suspense>
                  </ReasoningBlock>
                )}
                {streamed ? (
                  <Suspense fallback={streamed}>
                    <ChatMarkdown widgetSurface="invest" streaming>
                      {streamed}
                    </ChatMarkdown>
                  </Suspense>
                ) : searching ? (
                  <span className="sbchat-typing">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    {x(IM.invest_chat_searching)}
                  </span>
                ) : streamedReasoning ? null : (
                  <span className="sbchat-typing">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    {x(IM.invest_chat_typing)}
                  </span>
                )}
                <span className="sbchat-bubble-meta">
                  <button
                    type="button"
                    className="sbchat-rate-btn sbchat-stop"
                    aria-label={x(IM.invest_chat_stop)}
                    title={x(IM.invest_chat_stop)}
                    onClick={() => abortRef.current?.abort()}
                  >
                    <Square size={11} aria-hidden="true" />
                    {x(IM.invest_chat_stop)}
                  </button>
                </span>
              </div>
            )}
            {/* Follow-up chips — the reply's own suggested next asks. */}
            {!sending && suggests.length > 0 && (
              <ChipRow
                chips={suggests}
                label={x(IM.invest_chat_followup_label)}
                className="sbchat-starters"
                chipClass="sbchat-starter"
                onPick={(s) => void sendText(s)}
              />
            )}
          </div>
          {farUp && (
            <JumpToLatest
              label={x(IM.invest_chat_jump)}
              hasNew={hasNew}
              className="sbchat-jump"
              dotClass="sbchat-jump-dot"
              onJump={stickToBottom}
            />
          )}
        </div>

        {pendingAtt.length > 0 && (
          <div className="sbchat-attachrow">
            {pendingAtt.map((a) => (
              <span key={a.id} className="sbchat-attach">
                {a.kind === 'image' ? (
                  <ImageIcon size={11} aria-hidden="true" />
                ) : (
                  <FileText size={11} aria-hidden="true" />
                )}
                <span className="sbchat-attach-name">{a.name}</span>
                {a.truncated ? (
                  <span className="sbchat-attach-trunc">{x(AM.advisor_attach_truncated)}</span>
                ) : null}
                <button
                  type="button"
                  aria-label={`${x(AM.advisor_attach_remove)} ${a.name}`}
                  onClick={() => setPendingAtt((prev) => prev.filter((p) => p.id !== a.id))}
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="sbchat-compose">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="sbchat-file"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              attachFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="sbchat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label={x(AM.advisor_attach)}
          >
            <Paperclip size={15} aria-hidden="true" />
          </button>
          <textarea
            ref={inputRef}
            className="sbchat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              /* isComposing — an IME candidate confirmation Enter must not
                 send the half-composed line. */
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={x(IM.invest_chat_placeholder)}
            maxLength={1200}
            rows={1}
            aria-label={x(IM.invest_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={send}
            disabled={sending || (!draft.trim() && pendingAtt.length === 0)}
            aria-label={x(IM.invest_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="sbchat-compose-meta">
          <span>{x(IM.invest_chat_enter_hint)}</span>
          {draft.length > COUNT_FROM && <span>{draft.length}/1200</span>}
        </div>
      </section>
    </div>
  )
}
