import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Send, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  clearHealthChat,
  loadHealthChatHistory,
  sendHealthChat,
  type HealthChatAction,
  type HealthChatTurn,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDateTime } from './healthUi'
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
 * The portal assistant — a chat over the user's own aggregate numbers that
 * can also act: mark a habit done, add a habit, log a check-in, save a
 * journal entry. History persists server-side (health_chat_messages), so the
 * conversation follows the account across sessions. Actions refresh the
 * shared HealthDataContext, so every other page reflects them immediately.
 */
export function HealthChatPage() {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_chat, HM.health_seo_desc_chat)

  const [turns, setTurns] = useState<HealthChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
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
    try {
      const { reply, action } = await sendHealthChat(message, lang)
      setTurns((prev) => [
        ...(prev ?? []),
        {
          id: `u-${Date.now()}`,
          role: 'user',
          content: message,
          action: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          action,
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
            <p className="sbchat-empty">{x(HM.health_chat_empty)}</p>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={`sbchat-bubble ${t.role}`}>
                {t.content}
                {t.action && (
                  <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                    <Check size={11} aria-hidden="true" />
                    {t.action.ok ? actionLabel(t.action, x) : x(HM.health_chat_action_failed)}
                  </span>
                )}
                <span className="sbchat-bubble-meta">{fmtDateTime(t.createdAt, lang)}</span>
              </div>
            ))
          )}
          {sending && (
            <div className="sbchat-bubble assistant">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
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
