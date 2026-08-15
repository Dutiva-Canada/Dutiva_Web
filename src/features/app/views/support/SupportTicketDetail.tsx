import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import { STATUS_LABELS, supportCategory } from '@/config/support'
import {
  confirmScheduledCall,
  getScheduledCall,
  getSupportTicket,
  replyToSupportTicket,
} from '@/features/support/supportApi'
import type {
  ScheduledCallView,
  SupportMessageView,
  SupportTicketThread,
} from '@/features/support/supportApi'
import { SupportAttachments } from '@/features/support/SupportAttachments'

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'not_found' }
  | { kind: 'ready'; ticket: SupportTicketThread }

function formatDateTime(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Display label for a message author: you / Dutiva / system. */
function authorLabelForRole(
  role: SupportMessageView['authorRole'],
  x: LangContextValue['x'],
): string {
  if (role === 'customer') return x(M.support_author_you)
  if (role === 'agent') return x(M.support_author_dutiva)
  return x(M.support_author_system)
}

/** Proposed times to pick from, or the confirmed appointment once one is chosen. */
function ScheduledCallPanel({ ticketId }: { readonly ticketId: string }) {
  const { x, lang }: LangContextValue = useI18n()
  const [call, setCall] = useState<ScheduledCallView | null>(null)
  const [confirming, setConfirming] = useState<number | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setCall(await getScheduledCall(ticketId))
  }, [ticketId])

  useEffect(() => {
    void load()
  }, [load])

  async function confirm(index: number) {
    setConfirming(index)
    setError(false)
    try {
      await confirmScheduledCall(ticketId, index)
      await load()
    } catch (e) {
      console.error('support: confirm call failed', e)
      setError(true)
    } finally {
      setConfirming(null)
    }
  }

  if (!call) return null

  return (
    <div className="mb-5 rounded-xl border border-border bg-inset px-4 py-3.5">
      <h2 className="m-0 mb-2 text-[14px] font-semibold text-text">{x(M.support_call_heading)}</h2>

      {call.status === 'proposed' && (
        <>
          <p className="m-0 mb-2.5 text-[13px] text-text-2">{x(M.support_call_choose_intro)}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {call.proposedSlots.map((slot, i) => (
              <li key={slot.start} className="flex flex-wrap items-center gap-2.5">
                <span className="text-[13.5px] font-medium text-text">{formatDateTime(slot.start, lang)}</span>
                <button
                  type="button"
                  disabled={confirming !== null}
                  onClick={() => void confirm(i)}
                  className="cursor-pointer rounded-lg border-none bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
                >
                  {confirming === i ? x(M.support_call_confirming) : x(M.support_call_confirm_button)}
                </button>
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="m-0 mt-2 text-[12.5px] text-risk-fg">
              {x(M.support_call_error)}
            </p>
          )}
        </>
      )}

      {(call.status === 'confirmed' || call.status === 'completed') && call.confirmedStart && (
        <div>
          <p className="m-0 mb-1 text-[14px] font-semibold text-text">
            {x(M.support_call_confirmed_heading)}
          </p>
          <p className="m-0 text-[13.5px] text-text-2">{formatDateTime(call.confirmedStart, lang)}</p>
          {call.meetLink && (
            <a
              href={call.meetLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[13px] font-semibold text-navy underline"
            >
              {x(M.support_call_join_link)}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function SupportTicketDetail() {
  const { x, lang } = useI18n()
  const { ticketId } = useParams()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticketId) {
      setState({ kind: 'not_found' })
      return
    }
    let cancelled = false
    getSupportTicket(ticketId)
      .then((ticket) => {
        if (cancelled) return
        setState(ticket ? { kind: 'ready', ticket } : { kind: 'not_found' })
      })
      .catch((error: unknown) => {
        console.error('support: failed to load request', error)
        if (!cancelled) setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [ticketId])

  async function onReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.kind !== 'ready' || !reply.trim() || !ticketId) return
    setSending(true)
    setReplyError(null)
    try {
      const message: SupportMessageView = await replyToSupportTicket(ticketId, reply.trim())
      setReply('')
      setState({ kind: 'ready', ticket: { ...state.ticket, messages: [...state.ticket.messages, message] } })
    } catch (error) {
      console.error('support: reply failed', error)
      setReplyError(x(M.support_reply_error))
    } finally {
      setSending(false)
    }
  }

  const authorLabel = (role: SupportMessageView['authorRole']) => authorLabelForRole(role, x)

  return (
    <div className="mx-auto max-w-205 px-7 pt-2 pb-16 max-[640px]:px-4">
      <Link
        to="/app/support/requests"
        className="mb-4 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-text-muted hover:text-text"
      >
        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        {x(M.support_back_to_requests)}
      </Link>

      {state.kind === 'loading' && (
        <output className="m-0 text-[14px] text-text-3">
          {x(M.support_requests_loading)}
        </output>
      )}
      {state.kind === 'error' && (
        <p className="m-0 rounded-xl border border-risk-border bg-risk-bg px-4 py-3 text-[14px] text-risk-fg" role="alert">
          {x(M.support_requests_error)}
        </p>
      )}
      {state.kind === 'not_found' && (
        <p className="m-0 text-[14px] text-text-3">{x(M.support_ticket_not_found)}</p>
      )}

      {state.kind === 'ready' && (
        <>
          <header className="mb-4.5">
            <h1 className="m-0 mb-1.5 font-display text-[22px] font-semibold tracking-[-0.015em] text-text">
              {state.ticket.subject}
            </h1>
            <p className="m-0 text-[12.5px] text-text-muted">
              {state.ticket.publicReference} · {x(supportCategory(state.ticket.category).label)} ·{' '}
              {x(M.support_status_label)}: {x(STATUS_LABELS[state.ticket.status])}
            </p>
          </header>

          <ScheduledCallPanel ticketId={state.ticket.id} />

          <ol className="m-0 mb-5.5 flex list-none flex-col gap-3 p-0">
            {state.ticket.messages.map((msg) => {
              const mine = msg.authorRole === 'customer'
              return (
                <li
                  key={msg.id}
                  className={mine ? 'flex flex-col items-end' : 'flex flex-col items-start'}
                >
                  <div
                    className={
                      mine
                        ? 'max-w-[85%] rounded-xl rounded-br-0.75 bg-navy px-4 py-2.75 text-[14px] leading-normal whitespace-pre-wrap text-white'
                        : 'max-w-[85%] rounded-xl rounded-tl-0.75 border border-border bg-surface px-4 py-2.75 text-[14px] leading-normal whitespace-pre-wrap text-text'
                    }
                  >
                    {msg.body}
                  </div>
                  <span className="mt-0.75 text-[11px] text-text-faint">
                    {authorLabel(msg.authorRole)} · {formatDateTime(msg.createdAt, lang)}
                  </span>
                </li>
              )
            })}
          </ol>

          <SupportAttachments ticketId={state.ticket.id} canUpload={state.ticket.status !== 'closed'} />

          {state.ticket.status === 'closed' ? (
            <p className="m-0 rounded-xl border border-border bg-inset px-4 py-3 text-[13px] text-text-2">
              {x(M.support_reply_closed)}
            </p>
          ) : (
            <form onSubmit={onReply} className="flex flex-col gap-2.5">
              <label htmlFor="support-reply" className="text-[13px] font-semibold text-text-2">
                {x(M.support_reply_label)}
              </label>
              <textarea
                id="support-reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={20000}
                className="min-h-25 w-full resize-y rounded-[9px] border border-border bg-surface px-3 py-2.5 text-[14px] text-text"
              />
              {replyError && (
                <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
                  {replyError}
                </p>
              )}
              <div>
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="cursor-pointer rounded-[9px] border-none bg-navy px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
                >
                  {sending ? x(M.support_reply_sending) : x(M.support_reply_submit)}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
