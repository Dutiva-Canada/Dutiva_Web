import { useEffect, useRef, useState, type DependencyList, type RefObject } from 'react'

/* Shared bits for the four standalone portal chats (Tally, Mira, Paige,
   Claire). Each page keeps its own styling system — the sb-* sheets for
   invest/health/pr, Tailwind for careers — so this module only carries the
   pieces that are identical everywhere: time/day formatting, the
   stick-to-bottom scroll model, and textarea auto-grow. Components that
   share the pages (e.g. the copy control) live in portalChat.tsx so this
   file stays component-free for fast refresh. */

type Lang = 'en' | 'fr'

const dateFmt = (lang: Lang, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', opts)

/** "3:41 p.m." — the per-bubble timestamp; the date rides on separators. */
export function formatTurnTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, { hour: 'numeric', minute: '2-digit' }).format(d)
}

/** "Oct 10, 2026" — the day-separator chip between turns. */
export function formatTurnDay(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

/** True when two ISO stamps land on the same local calendar day. */
export function sameTurnDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

/* The distance from the bottom (px) that still counts as "at the bottom" —
   beyond it the reader is deliberately scrolling history and new content
   must not yank them back down. */
const STICK_RANGE_PX = 56

/**
 * Stick-to-bottom scrolling. The log follows new turns and streamed deltas
 * only while the reader is near the end; scrolling up releases it until they
 * come back down (or send a message — `stickToBottom()` forces it). Callers
 * pass the turn/sending/streamed values as deps so every change re-evaluates.
 */
export function useStickToBottom(deps: DependencyList): {
  logRef: RefObject<HTMLDivElement | null>
  stickToBottom: () => void
  capturePrepend: () => void
  /** True while the reader has scrolled up away from the tail — drives the
      "jump to latest" pill. */
  farUp: boolean
  /** True when content grew while the reader was scrolled up — the pill
      can flag that something new landed. */
  hasNew: boolean
} {
  const logRef = useRef<HTMLDivElement | null>(null)
  /* Whether the next render should hold the scroll at the bottom. Starts
     true so the initial history load lands at the newest turn. */
  const stuckRef = useRef(true)
  const prevHeightRef = useRef(0)
  const lastHeightRef = useRef(0)
  const [farUp, setFarUp] = useState(false)
  const [hasNew, setHasNew] = useState(false)

  /* Track stickiness off the user's scroll events — farUp mirrors it as
     state so the pill can render, while stuckRef stays a ref for the
     scroll effect below. */
  useEffect(() => {
    const el = logRef.current
    if (!el?.addEventListener) return
    const onScroll = () => {
      const stuck = el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_RANGE_PX
      stuckRef.current = stuck
      setFarUp(el.scrollHeight > el.clientHeight && !stuck)
      if (stuck) setHasNew(false)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- caller-supplied trigger list is the hook's contract
  useEffect(() => {
    const el = logRef.current
    if (!el?.scrollTo) return
    /* Content arrived while scrolled up (not a prepend) — mark the pill. */
    if (
      !stuckRef.current &&
      prevHeightRef.current === 0 &&
      el.scrollHeight !== lastHeightRef.current
    ) {
      setHasNew(true)
    }
    if (prevHeightRef.current > 0 && !stuckRef.current) {
      /* A prepend grew the log — keep the same messages in view. */
      el.scrollTo({ top: el.scrollTop + (el.scrollHeight - prevHeightRef.current) })
    } else if (stuckRef.current) {
      el.scrollTo({ top: el.scrollHeight })
    }
    prevHeightRef.current = 0
    lastHeightRef.current = el.scrollHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the caller-supplied trigger list, the hook's contract
  }, deps)

  const stickToBottom = () => {
    stuckRef.current = true
    setFarUp(false)
    setHasNew(false)
    logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight })
  }

  /* Call just before prepending older turns — remembers the height so the
     effect can hold the viewport on the same message. */
  const capturePrepend = () => {
    prevHeightRef.current = logRef.current?.scrollHeight ?? 0
    stuckRef.current = false
    setFarUp(true)
  }

  return { logRef, stickToBottom, capturePrepend, farUp, hasNew }
}

/**
 * Draft that survives navigation — kept in sessionStorage keyed by surface
 * (and thread), so leaving the page mid-sentence doesn't lose the text.
 * Returns the same pair useState would.
 */
export function usePortalChatDraft(
  storageKey: string,
): [string, (v: string) => void] {
  const [draft, setDraftState] = useState<string>(() => {
    try {
      return sessionStorage.getItem(storageKey) ?? ''
    } catch {
      return ''
    }
  })
  /* Switching keys (e.g. switching threads) reloads that key's draft. */
  useEffect(() => {
    try {
      setDraftState(sessionStorage.getItem(storageKey) ?? '')
    } catch {
      setDraftState('')
    }
  }, [storageKey])
  const setDraft = (v: string) => {
    setDraftState(v)
    try {
      if (v) sessionStorage.setItem(storageKey, v)
      else sessionStorage.removeItem(storageKey)
    } catch {
      /* storage full or blocked — the draft still lives in state */
    }
  }
  return [draft, setDraft]
}

/**
 * Grow a textarea with its content as the draft lengthens — capped by the
 * CSS max-height, then scrolls internally. Pass the controlled `draft` so
 * every keystroke re-measures; resets to one line when the draft empties.
 */
export function useAutoGrowTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [ref, value])
}
