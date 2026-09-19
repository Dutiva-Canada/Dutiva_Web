import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LText } from '@/i18n/core'
import { advisorCore } from '@/i18n/messages/advisorCore'
import type { AdvisorTurnSpec, ChatAttachmentChip, ChatMessage } from './types'

/**
 * Shared Advisor streaming engine — the port of the prototype's chat
 * lifecycle (`pushAdvisorTurn` / `runMessageLifecycle` / `retryMessage`):
 *
 *   append user bubble → thinking dots (850ms) → stream text 3 chars / 16ms
 *   (blinking caret) → done (cards, docs, chips render).
 *
 * The Advisor view (Phase C) and the contextual rail share this hook. When
 * the user prefers reduced motion the thinking delay and character streaming
 * are skipped and turns land fully rendered.
 */

/** Prototype timings — exported so tests and views stay in sync. */
export const ADVISOR_THINK_MS = 850
export const ADVISOR_STREAM_TICK_MS = 16
export const ADVISOR_STREAM_CHARS_PER_TICK = 3

/**
 * Streaming target length: the longest localization, so a live language
 * toggle mid-stream never truncates the reply (slicing past the end of the
 * shorter string is a no-op).
 */
function maxLenOf(text: LText): number {
  return typeof text === 'string' ? text.length : Math.max(text.en.length, text.fr.length)
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function markError(id: string, messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => (m.id === id ? { ...m, status: 'error', streaming: false } : m))
}

function markStreaming(id: string, messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => (m.id === id ? { ...m, status: 'streaming' } : m))
}

function updateStreamedMessage(
  id: string,
  shown: number,
  finished: boolean,
  messages: ChatMessage[],
): ChatMessage[] {
  return messages.map((m) => {
    if (m.id !== id) return m
    if (finished) {
      return { ...m, streamedLen: shown, status: 'done', streaming: false }
    }
    return { ...m, streamedLen: shown }
  })
}

function streamedMessageUpdater(
  id: string,
  shown: number,
  finished: boolean,
): (messages: ChatMessage[]) => ChatMessage[] {
  return (messages) => updateStreamedMessage(id, shown, finished, messages)
}

export interface AdvisorEngine {
  messages: ChatMessage[]
  /** True while a reply is thinking or streaming (composer-busy state). */
  busy: boolean
  /** Append a user bubble (optionally with structured answer chips). */
  sendUser: (text: LText, chips?: LText[], attachments?: ChatAttachmentChip[]) => void
  /** Append an assistant turn and run thinking → streaming → done. */
  pushTurn: (spec: AdvisorTurnSpec) => void
  /** Re-run a failed turn with its `retryText` (prototype `retryMessage`). */
  retryTurn: (messageId: string) => void
  /** Replace the transcript (e.g. when the rail opens on a new subject). */
  reset: (messages?: ChatMessage[]) => void
}

export interface AdvisorEngineOptions {
  /** Message-id prefix, to keep parallel transcripts distinct (e.g. 'rail'). */
  idPrefix?: string
  /** Seed transcript (already-done fixture messages). */
  initial?: ChatMessage[]
}

export function useAdvisorEngine(options: AdvisorEngineOptions = {}): AdvisorEngine {
  const { idPrefix = 'msg' } = options
  const [messages, setMessages] = useState<ChatMessage[]>(options.initial ?? [])

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const uid = useRef(1)
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const clearTimers = useCallback(() => {
    for (const handle of timers.current) {
      clearTimeout(handle)
      clearInterval(handle)
    }
    timers.current.clear()
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  /** thinking → streaming → done (or → error) for one assistant message. */
  const runLifecycle = useCallback((id: string, text: LText, isError: boolean) => {
    const think = setTimeout(() => {
      timers.current.delete(think)
      if (isError) {
        setMessages((prev) => markError(id, prev))
        return
      }
      setMessages((prev) => markStreaming(id, prev))
      const total = maxLenOf(text)
      let shown = 0
      const tick = setInterval(() => {
        shown = Math.min(shown + ADVISOR_STREAM_CHARS_PER_TICK, total)
        const finished = shown >= total
        if (finished) {
          clearInterval(tick)
          timers.current.delete(tick)
        }
        setMessages(streamedMessageUpdater(id, shown, finished))
      }, ADVISOR_STREAM_TICK_MS)
      timers.current.add(tick)
    }, ADVISOR_THINK_MS)
    timers.current.add(think)
  }, [])

  const sendUser = useCallback(
    (text: LText, chips?: LText[], attachments?: ChatAttachmentChip[]) => {
      const message: ChatMessage = {
        id: `${idPrefix}-${uid.current++}`,
        author: 'user',
        text,
        userChips: chips,
        attachments,
        status: 'done',
      }
      setMessages((prev) => [...prev, message])
    },
    [idPrefix],
  )

  const pushTurn = useCallback(
    (spec: AdvisorTurnSpec) => {
      const id = `${idPrefix}-${uid.current++}`
      const base: ChatMessage = {
        id,
        author: 'assistant',
        text: spec.text,
        reasoning: spec.reasoning,
        cards: spec.cards,
        citations: spec.citations,
        proposedActions: spec.proposedActions,
        errorText: spec.errorText,
        retryText: spec.retryText,
      }
      if (prefersReducedMotion()) {
        setMessages((prev) => [
          ...prev,
          spec.isError
            ? { ...base, status: 'error', streaming: false }
            : { ...base, status: 'done', streaming: false, streamedLen: maxLenOf(spec.text) },
        ])
        return
      }
      setMessages((prev) => [
        ...prev,
        { ...base, status: 'thinking', streaming: true, streamedLen: 0 },
      ])
      runLifecycle(id, spec.text, spec.isError === true)
    },
    [idPrefix, runLifecycle],
  )

  const retryTurn = useCallback(
    (messageId: string) => {
      const current = messagesRef.current.find((m) => m.id === messageId)
      if (current?.status !== 'error') return
      const text = current.retryText ?? advisorCore.advisor_retry_resolved
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, status: 'thinking', streaming: true, text, streamedLen: 0 }
            : m,
        ),
      )
      if (prefersReducedMotion()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, status: 'done', streaming: false, streamedLen: maxLenOf(text) }
              : m,
          ),
        )
        return
      }
      runLifecycle(messageId, text, false)
    },
    [runLifecycle],
  )

  const reset = useCallback(
    (next?: ChatMessage[]) => {
      clearTimers()
      setMessages(next ?? [])
    },
    [clearTimers],
  )

  const busy = useMemo(
    () => messages.some((m) => m.status === 'thinking' || m.status === 'streaming'),
    [messages],
  )

  return useMemo(
    () => ({ messages, busy, sendUser, pushTurn, retryTurn, reset }),
    [messages, busy, sendUser, pushTurn, retryTurn, reset],
  )
}
