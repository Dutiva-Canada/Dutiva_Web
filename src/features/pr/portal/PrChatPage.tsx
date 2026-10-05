import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Send, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import {
  clearPrChat,
  loadPrChatHistory,
  sendPrChat,
  type PrChatAction,
  type PrChatTurn,
} from '@/features/pr/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDateTime } from './prUi'
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
    default:
      return ''
  }
}

/**
 * The desk assistant — a chat over the user's own PR data that can also
 * record what they ask for: a draft campaign, a content item, a media
 * contact, a logged mention, a keyword or GEO prompt to track. History
 * persists server-side (pr_chat_messages); actions refresh the shared
 * PrDataContext so every other tab reflects them immediately.
 */
export function PrChatPage() {
  const { x, lang } = useI18n()
  const { refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_seo_title_chat, PM.pr_seo_desc_chat)

  const [turns, setTurns] = useState<PrChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
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
    try {
      const { reply, action } = await sendPrChat(message, lang)
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
      /* The action already wrote to the pr_* tables — refresh the shared
         state so Campaigns/Content/Media/SEO/Answers reflect it. */
      if (action?.ok) await refresh()
    } catch {
      showToast(PM.pr_chat_error)
      setDraft(message)
    } finally {
      setSending(false)
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
            <p className="sbchat-empty">{x(PM.pr_chat_empty)}</p>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={`sbchat-bubble ${t.role}`}>
                {t.content}
                {t.action && (
                  <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                    <Check size={11} aria-hidden="true" />
                    {t.action.ok ? actionLabel(t.action, x) : x(PM.pr_chat_action_failed)}
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
