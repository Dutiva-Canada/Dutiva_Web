import { Copy, Phone, Trash2 } from 'lucide-react'
import { healthMessages as HM } from '@/i18n/messages/health'
import type { HealthChatThread } from '@/features/health/data/api'
import { ThreadSwitcher } from '@/components/chat/portalChat'

/**
 * The chat page chrome above the card — title row (thread switcher,
 * transcript copy, scoped clear), the tier-aware subtitle, and the
 * data-source disclosure. Rendered stateless; every action reports up.
 */
export function HealthChatHeader({
  x,
  isInternal,
  threadName,
  threads,
  threadId,
  sending,
  activity,
  hasTurns,
  clearArmed,
  clearing,
  onOpen,
  onNew,
  onRename,
  onDelete,
  onExport,
  onClear,
  onCall,
  voiceCapable,
  canCall,
}: {
  x: (m: { en: string; fr: string }) => string
  isInternal: boolean
  threadName: string
  threads: HealthChatThread[]
  threadId: string | null
  sending: boolean
  /** Thread ids (plus 'main') carrying writes the reader hasn't opened. */
  activity: ReadonlySet<string>
  hasTurns: boolean
  clearArmed: boolean
  clearing: boolean
  onOpen: (id: string | null) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onExport: () => void
  onClear: () => void
  onCall: () => void
  /* The browser supports both halves of the call (speech recognition +
     synthesis) — when false the phone button never renders. */
  voiceCapable: boolean
  /* History resolved — a call opened over a loading log would drop the
     first spoken turn when the fetch lands. */
  canCall: boolean
}) {
  return (
    <>
      <div className="sb-head-row">
        <h1>{x(HM.health_chat_title)}</h1>
        <div className="sbchat-head-actions">
          <ThreadSwitcher
            activeName={threadName}
            threads={threads}
            activeId={threadId}
            disabled={sending}
            labels={{
              defaultThread: x(HM.health_chat_thread_default),
              untitled: x(HM.health_chat_thread_untitled),
              newThread: x(HM.health_chat_thread_new),
            }}
            buttonClass="sb-btn sb-btn-sm sb-btn-secondary"
            listClass="sbchat-thread-list"
            itemClass="sbchat-thread-item"
            newItemClass="sbchat-thread-new"
            activity={activity}
            activityLabel={x(HM.health_chat_thread_activity)}
            opsLabels={{
              rename: x(HM.health_chat_thread_rename),
              delete: x(HM.health_chat_thread_delete),
              confirmDelete: x(HM.health_chat_sure),
              name: x(HM.health_chat_thread_name),
            }}
            rowClass="sbchat-thread-row"
            opClass="sbchat-thread-op"
            dotClass="sbchat-thread-dot"
            renameInputClass="sbchat-thread-rename"
            onOpen={onOpen}
            onNew={onNew}
            onRename={onRename}
            onDelete={onDelete}
          />
          {voiceCapable && (
            <button
              type="button"
              className="sb-btn sb-btn-sm sb-btn-secondary"
              onClick={onCall}
              disabled={sending || !canCall}
              title={x(HM.health_chat_call)}
            >
              <Phone size={13} aria-hidden="true" />
              {x(HM.health_chat_call)}
            </button>
          )}
          {hasTurns && (
            <>
              <button
                type="button"
                className="sb-btn sb-btn-sm sb-btn-secondary"
                onClick={onExport}
                disabled={sending}
              >
                <Copy size={13} aria-hidden="true" />
                {x(HM.health_chat_export)}
              </button>
              <button
                type="button"
                className="sb-btn sb-btn-sm sb-btn-secondary"
                onClick={onClear}
                disabled={clearing || sending}
              >
                <Trash2 size={13} aria-hidden="true" />
                {x(clearArmed ? HM.health_chat_clear_confirm : HM.health_chat_clear)}
              </button>
            </>
          )}
        </div>
      </div>
      {/* Internal-staff tier — the edge function advises @dutiva.ca accounts
          directly, so the not-a-therapist subtitle is joined by a badge that
          makes the active register scannable. */}
      <p className="sb-sub">
        {x(isInternal ? HM.health_chat_sub_internal : HM.health_chat_sub)}
        {isInternal && <span className="sbchat-tier">{x(HM.health_chat_internal_badge)}</span>}
      </p>
      {/* Data-source disclosure — she says what she reads, and how a reply
          happens (writes are undoable, memories wait for review). */}
      <details className="sbchat-sees">
        <summary>{x(HM.health_chat_sees)}</summary>
        <p>{x(HM.health_chat_sees_list)}</p>
        <p>{x(HM.health_chat_how)}</p>
      </details>
    </>
  )
}
