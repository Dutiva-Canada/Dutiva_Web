import './strategies.css'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Send, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  clearInvestChat,
  loadInvestChatHistory,
  sendInvestChat,
  type InvestChatAction,
  type InvestChatTurn,
} from '@/features/invest/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestHead } from './useInvestHead'

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
    default:
      return ''
  }
}

/**
 * The book assistant — a chat over the user's own portfolio rows that can
 * also act: watch/unwatch a symbol, queue a draft order, update a signal's
 * status, or file a strategy draft for review. Orders land 'queued' — the
 * only fill path stays the manual execute action. History persists server-
 * side (invest_chat_messages); actions refresh the shared InvestDataContext
 * so every other tab reflects them immediately.
 */
export function InvestChatPage() {
  const { x, lang } = useI18n()
  const { refresh } = useInvestData()
  const { showToast } = useToasts()
  useInvestHead(IM.invest_seo_title_chat, IM.invest_seo_desc_chat)

  const [turns, setTurns] = useState<InvestChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadInvestChatHistory()
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
    try {
      const { reply, action } = await sendInvestChat(message, lang)
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
      /* The action already wrote to the invest_* tables — refresh the shared
         state so Orders/Signals/Watchlist reflect it without a reload. */
      if (action?.ok) await refresh()
    } catch {
      showToast(IM.invest_chat_error)
      setDraft(message)
    } finally {
      setSending(false)
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearInvestChat()
      setTurns([])
    } catch {
      showToast(IM.invest_chat_error)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="sb sb-page">
      <div className="sb-head-row">
        <h1>{x(IM.invest_chat_title)}</h1>
        {turns !== null && turns.length > 0 && (
          <button
            type="button"
            className="sb-btn sb-btn-sm sb-btn-secondary"
            onClick={() => void clear()}
            disabled={clearing}
          >
            <Trash2 size={13} aria-hidden="true" />
            {x(IM.invest_chat_clear)}
          </button>
        )}
      </div>
      <p className="sb-sub">{x(IM.invest_chat_sub)}</p>

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log" ref={logRef} aria-live="polite">
          {turns === null ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : turns.length === 0 ? (
            <p className="sbchat-empty">{x(IM.invest_chat_empty)}</p>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={`sbchat-bubble ${t.role}`}>
                {t.content}
                {t.action && (
                  <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                    <Check size={11} aria-hidden="true" />
                    {t.action.ok ? actionLabel(t.action, x) : x(IM.invest_chat_action_failed)}
                  </span>
                )}
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
            placeholder={x(IM.invest_chat_placeholder)}
            maxLength={1200}
            rows={2}
            aria-label={x(IM.invest_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            aria-label={x(IM.invest_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
