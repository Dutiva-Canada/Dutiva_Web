import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import {
  clearPrChat,
  loadPrChatHistory,
  ratePrChatTurn,
  sendPrChat,
  undoPrChatAction,
  type PrChatAction,
  type PrChatTurn,
} from '@/features/pr/data/chatApi'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDateTime, paigeGreeting } from './prUi'
import { usePrHead } from './usePrHead'

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in pr-ai/handlers.ts. */
function actionLabel(
  action: PrChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const name = action.detail
  switch (action.type) {
    case 'add_campaign':
      return x(PM.pr_chat_did_campaign).replace('{name}', name)
    case 'add_content_item':
      return x(PM.pr_chat_did_content).replace('{name}', name)
    case 'add_media_contact':
      return x(PM.pr_chat_did_contact).replace('{name}', name)
    case 'add_mention':
      return x(PM.pr_chat_did_mention).replace('{name}', name)
    case 'add_keyword':
      return x(PM.pr_chat_did_keyword).replace('{name}', name)
    case 'add_geo_prompt':
      return x(PM.pr_chat_did_geo).replace('{name}', name)
    case 'update_campaign_status':
      return x(PM.pr_chat_did_campstatus).replace('{name}', name)
    default:
      return ''
  }
}

/**
 * Paige — the desk's press specialist. A chat over the user's own PR data
 * that can also record what they ask for: a draft campaign, a content item,
 * a media contact, a logged mention, a keyword or GEO prompt to track.
 * Everything she writes lands as a draft or a log row — she never sends or
 * publishes. History persists server-side (pr_chat_messages); actions
 * refresh the shared PrDataContext so every other tab reflects them
 * immediately.
 */
export function PrChatPage() {
  const { x, lang } = useI18n()
  const { state, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_seo_title_chat, PM.pr_seo_desc_chat)

  const [turns, setTurns] = useState<PrChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [undoing, setUndoing] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadPrChatHistory()
      .then(setTurns)
      .catch(() => setTurns([]))
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight })
  }, [turns, sending])

  const send = async () => {
    const message = draft.trim()
    if (!message || sending) return
    setSending(true)
    setDraft('')
    setStreamed('')
    /* Optimistic user turn — your message should appear the moment you send,
       not after the reply round-trips. */
    const userTurn: PrChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      action: null,
      feedback: null,
      createdAt: new Date().toISOString(),
    }
    setTurns((prev) => [...(prev ?? []), userTurn])
    try {
      /* onDelta turns on SSE — the reply types into the pending bubble as
         it generates; the final payload stays authoritative. */
      const { reply, action, assistantId } = await sendPrChat(message, lang, setStreamed)
      setTurns((prev) => [
        ...(prev ?? []),
        {
          /* The persisted row id when the insert landed — rating needs it. */
          id: assistantId ?? `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          action,
          feedback: null,
          createdAt: new Date().toISOString(),
        },
      ])
      /* The action already wrote to the pr_* tables — refresh the shared
         state so Campaigns/Content/Media/SEO/Answers reflect it. */
      if (action?.ok) await refresh()
    } catch {
      showToast(PM.pr_chat_error)
      setDraft(message)
      /* Nothing reached the desk — pull the optimistic turn back out. */
      setTurns((prev) => (prev ?? []).filter((t) => t.id !== userTurn.id))
    } finally {
      setSending(false)
      setStreamed('')
    }
  }

  /* Undo on an action chip — the server deletes the row the action created
     and marks it undone, so the chip doesn't offer it again after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoPrChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(PM.pr_chat_undo_failed)
    } finally {
      setUndoing(null)
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearPrChat()
      setTurns([])
    } catch {
      showToast(PM.pr_chat_error)
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
      await ratePrChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
    }
  }

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_chat_title)}</h1>
        {turns !== null && turns.length > 0 && (
          <button
            type="button"
            className="sb-btn sb-btn-sm sb-btn-secondary"
            onClick={() => void clear()}
            disabled={clearing}
          >
            <Trash2 size={13} aria-hidden="true" />
            {x(PM.pr_chat_clear)}
          </button>
        )}
      </div>
      <p className="sb-sub">{x(PM.pr_chat_sub)}</p>

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log" ref={logRef} aria-live="polite">
          {turns === null ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : turns.length === 0 ? (
            /* She speaks first — a greeting built locally from PrState, not
               a stored turn, so clearing history brings it back. */
            <div className="sbchat-bubble assistant">{paigeGreeting(state, lang)}</div>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={`sbchat-bubble ${t.role}`}>
                {t.content}
                {t.action && (
                  <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                    <Check size={11} aria-hidden="true" />
                    {t.action.ok ? actionLabel(t.action, x) : x(PM.pr_chat_action_failed)}
                    {t.action.ok &&
                      t.action.refId &&
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                        t.id,
                      ) &&
                      (t.action.undone ? (
                        <em className="sbchat-chip-undone">{x(PM.pr_chat_undone)}</em>
                      ) : (
                        <button
                          type="button"
                          className="sbchat-chip-undo"
                          disabled={undoing === t.id}
                          onClick={() => void undo(t.id)}
                        >
                          {x(PM.pr_chat_undo)}
                        </button>
                      ))}
                  </span>
                )}
                <span className="sbchat-bubble-meta">
                  {fmtDateTime(t.createdAt, lang)}
                  {t.role === 'assistant' &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                      t.id,
                    ) && (
                      <span className="sbchat-rate">
                        <button
                          type="button"
                          className="sbchat-rate-btn"
                          aria-label={x(PM.pr_chat_rate_up)}
                          aria-pressed={t.feedback === 1}
                          onClick={() => void rate(t.id, 1)}
                        >
                          <ThumbsUp size={12} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="sbchat-rate-btn"
                          aria-label={x(PM.pr_chat_rate_down)}
                          aria-pressed={t.feedback === -1}
                          onClick={() => void rate(t.id, -1)}
                        >
                          <ThumbsDown size={12} aria-hidden="true" />
                        </button>
                      </span>
                    )}
                </span>
              </div>
            ))
          )}
          {sending && (
            <div className="sbchat-bubble assistant">
              {streamed || <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            </div>
          )}
        </div>

        <div className="sbchat-compose">
          <textarea
            className="sbchat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={x(PM.pr_chat_placeholder)}
            maxLength={1200}
            rows={2}
            aria-label={x(PM.pr_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            aria-label={x(PM.pr_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
