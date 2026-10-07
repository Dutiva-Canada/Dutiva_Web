import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  clearHealthChat,
  loadHealthChatHistory,
  rateHealthChatTurn,
  sendHealthChat,
  undoHealthChatAction,
  type HealthChatAction,
  type HealthChatTurn,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { companionGreeting, fmtDateTime } from './healthUi'
import { useHealthHead } from './useHealthHead'

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in health-ai/handlers.ts. */
function actionLabel(
  action: HealthChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const slots = { name: action.detail }
  switch (action.type) {
    case 'mark_habit_done':
      return x(HM.health_chat_did_mark).replace('{name}', slots.name)
    case 'unmark_habit_done':
      return x(HM.health_chat_did_unmark).replace('{name}', slots.name)
    case 'add_habit':
      return x(HM.health_chat_did_habit).replace('{name}', slots.name)
    case 'add_checkin':
      return x(HM.health_chat_did_checkin).replace('{name}', slots.name)
    case 'add_journal_entry':
      return x(HM.health_chat_did_journal)
    default:
      return ''
  }
}

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
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_chat, HM.health_seo_desc_chat)

  const [turns, setTurns] = useState<HealthChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [undoing, setUndoing] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadHealthChatHistory()
      .then(setTurns)
      .catch(() => setTurns([]))
  }, [])

  useEffect(() => {
    /* scrollTo isn't in jsdom — and the catch-free optional call keeps any
       other minimal DOM from breaking the render. */
    logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight })
  }, [turns, sending])

  const send = async () => {
    const message = draft.trim()
    if (!message || sending) return
    setSending(true)
    setDraft('')
    setStreamed('')
    try {
      /* onDelta turns on SSE — the reply types into the pending bubble as
         it generates; the final payload stays authoritative. */
      const { reply, action, assistantId } = await sendHealthChat(message, lang, setStreamed)
      setTurns((prev) => [
        ...(prev ?? []),
        {
          id: `u-${Date.now()}`,
          role: 'user',
          content: message,
          action: null,
          feedback: null,
          createdAt: new Date().toISOString(),
        },
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
      /* The action already wrote to the health_* tables — refresh the shared
         state so Habits/Insights/Overview reflect it without a reload. */
      if (action?.ok) await refresh()
    } catch {
      showToast(HM.health_chat_error)
      setDraft(message)
    } finally {
      setSending(false)
      setStreamed('')
    }
  }

  /* Undo on an action chip — the server reverses the write and marks the
     action undone, so the chip doesn't offer it again after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoHealthChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(HM.health_chat_undo_failed)
    } finally {
      setUndoing(null)
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearHealthChat()
      setTurns([])
    } catch {
      showToast(HM.health_chat_error)
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
      await rateHealthChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
    }
  }

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_chat_title)}</h1>
        {turns !== null && turns.length > 0 && (
          <button
            type="button"
            className="sb-btn sb-btn-sm sb-btn-secondary"
            onClick={() => void clear()}
            disabled={clearing}
          >
            <Trash2 size={13} aria-hidden="true" />
            {x(HM.health_chat_clear)}
          </button>
        )}
      </div>
      <p className="sb-sub">{x(HM.health_chat_sub)}</p>

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log" ref={logRef} aria-live="polite">
          {turns === null ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : turns.length === 0 ? (
            /* She speaks first — a greeting built locally from HealthState,
               not a stored turn, so clearing history brings it back. */
            <div className="sbchat-bubble assistant">{companionGreeting(state, lang)}</div>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={`sbchat-bubble ${t.role}`}>
                {t.content}
                {t.action && (
                  <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                    <Check size={11} aria-hidden="true" />
                    {t.action.ok ? actionLabel(t.action, x) : x(HM.health_chat_action_failed)}
                    {t.action.ok &&
                      t.action.refId &&
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                        t.id,
                      ) &&
                      (t.action.undone ? (
                        <em className="sbchat-chip-undone">{x(HM.health_chat_undone)}</em>
                      ) : (
                        <button
                          type="button"
                          className="sbchat-chip-undo"
                          disabled={undoing === t.id}
                          onClick={() => void undo(t.id)}
                        >
                          {x(HM.health_chat_undo)}
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
                          aria-label={x(HM.health_chat_rate_up)}
                          aria-pressed={t.feedback === 1}
                          onClick={() => void rate(t.id, 1)}
                        >
                          <ThumbsUp size={12} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="sbchat-rate-btn"
                          aria-label={x(HM.health_chat_rate_down)}
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
            placeholder={x(HM.health_chat_placeholder)}
            maxLength={1200}
            rows={2}
            aria-label={x(HM.health_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            aria-label={x(HM.health_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="sbchat-note">{x(HM.health_crisis_note)}</p>
      </section>
    </div>
  )
}
