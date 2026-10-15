import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowDown,
  Check,
  ChevronDown,
  Copy,
  MessagesSquare,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

/* Shared components for the four standalone portal chats (Tally, Mira,
   Paige, Claire). Formatting helpers and scroll/textarea hooks live in
   portalChatUtils.ts — a file that exports components should export only
   components so fast refresh stays clean. */

/**
 * Copy-the-reply control for assistant bubbles. Shows a check for a moment
 * after a successful copy; silently no-ops where the clipboard API is
 * unavailable (non-secure contexts, old WebViews).
 */
export function CopyTurnButton({
  text,
  label,
  className,
}: {
  text: string
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  /* Clipboard denied used to no-op silently — the icon now swaps to an X
     for a beat so the click isn't eaten without explanation. */
  const [failed, setFailed] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setFailed(true)
      setTimeout(() => setFailed(false), 1500)
    }
  }
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check size={12} aria-hidden="true" />
      ) : failed ? (
        <X size={12} aria-hidden="true" />
      ) : (
        <Copy size={12} aria-hidden="true" />
      )}
    </button>
  )
}

/**
 * "Jump to latest" pill — floats over the log while the reader is scrolled
 * up. `hasNew` flags that turns landed while they were away.
 */
export function JumpToLatest({
  label,
  hasNew,
  className,
  dotClass,
  onJump,
}: {
  label: string
  hasNew: boolean
  className?: string
  dotClass?: string
  onJump: () => void
}) {
  return (
    <button type="button" className={className} onClick={onJump}>
      <ArrowDown size={12} aria-hidden="true" />
      <span>{label}</span>
      {hasNew && <i className={dotClass} aria-hidden="true" />}
    </button>
  )
}

/**
 * The model's thinking on a turn — a disclosure sitting inside the
 * assistant bubble. While the route reasons (`live`), it opens itself and
 * grows with each streamed piece; once the reply lands it collapses back
 * to its summary line so a long trace doesn't crowd the answer. On a
 * persisted turn it renders collapsed — same `details`, reader's choice.
 */
export function ReasoningBlock({
  text,
  live,
  label,
  hint,
  className,
  bodyClass,
  children,
}: {
  text: string
  /* True for the whole in-flight turn — the panel stays open while
     reasoning *and* the reply stream, and only settles collapsed once the
     turn lands. */
  live: boolean
  label: string
  /* Tooltip on the summary — frames the trace as raw working so a guess
     mid-stream isn't read as a verified claim. */
  hint?: string
  className?: string
  bodyClass?: string
  /* Rendered body — pages pass their lazy ChatMarkdown so bullets/tables in
     the trace format like a reply does; plain `text` is the fallback while
     the chunk loads. */
  children?: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  /* Auto-follow: while live the box tracks the newest line — until the
     reader scrolls up inside it, which releases the pin so their position
     isn't yanked. Touching the bottom again re-pins. */
  const pinnedRef = useRef(true)
  /* `open` is driven by DOM mutation, not a prop — React never owns the
     attribute, so a reader's manual toggle survives re-renders and the
     live transition can't fight them. */
  useEffect(() => {
    if (ref.current) ref.current.open = live
  }, [live])
  useEffect(() => {
    const el = bodyRef.current
    if (live && el && pinnedRef.current) el.scrollTop = el.scrollHeight
  }, [text, live])
  if (!text) return null
  return (
    <details ref={ref} className={className} data-live={live || undefined}>
      <summary title={hint}>{label}</summary>
      <div
        ref={bodyRef}
        className={bodyClass}
        role="log"
        aria-live="polite"
        /* Busy while pieces stream — AT holds announcements until the trace
           settles instead of reading out every partial phrase. */
        aria-busy={live || undefined}
        aria-relevant="additions"
        onScroll={() => {
          const el = bodyRef.current
          if (el) pinnedRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
        }}
      >
        {children ?? text}
      </div>
    </details>
  )
}

/** One grounding source behind an assistant turn — label always renders;
    url present means the row carried a real link the reply leaned on. */
export interface ChatSource {
  label: string
  url?: string
}

/**
 * What the reply grounded on — a collapsed disclosure under the assistant
 * bubble listing the data behind it (market rows, headlines, coverage,
 * postings, corpus links). Always starts closed: sources are evidence on
 * request, not part of the reading flow. Every entry is a link when the row
 * carried one, plain text otherwise.
 */
export function SourcesBlock({
  sources,
  label,
  className,
  listClass,
  itemClass,
  linkClass,
}: {
  sources: readonly ChatSource[]
  label: string
  className?: string
  listClass?: string
  itemClass?: string
  linkClass?: string
}) {
  if (sources.length === 0) return null
  return (
    <details className={className}>
      <summary>
        {label} ({sources.length})
      </summary>
      <ul className={listClass}>
        {sources.map((s, i) => (
          <li key={`${s.url ?? ''}-${i}`} className={itemClass}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {s.label}
              </a>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}

/* A chat thread the switcher lists — the default conversation (null id)
   isn't in the array; the labels carry it. */
export interface ChatThreadRef {
  id: string
  title: string | null
}

/**
 * Conversation switcher — a button showing the active conversation's name
 * that opens a small menu: the default thread, each named one, and a
 * "new conversation" row. Styling classes come from the caller since the
 * portals use two systems (sb-* sheets vs Tailwind).
 *
 * Optional extras, off unless a portal wires them:
 * - `activity`: thread ids (plus 'main') with unseen activity — a dot on
 *   the row and on the trigger.
 * - `onRename`/`onDelete` + `opsLabels`: per-thread pencil/trash affordances
 *   with an inline rename input and a two-step delete.
 */
export function ThreadSwitcher({
  activeName,
  threads,
  activeId,
  labels,
  disabled,
  buttonClass,
  listClass,
  itemClass,
  newItemClass,
  onOpen,
  onNew,
  activity,
  activityLabel,
  opsLabels,
  onRename,
  onDelete,
  rowClass,
  opClass,
  dotClass,
  renameInputClass,
}: {
  activeName: string
  threads: ChatThreadRef[]
  activeId: string | null
  labels: { defaultThread: string; untitled: string; newThread: string }
  disabled?: boolean
  buttonClass?: string
  listClass?: string
  itemClass?: string
  newItemClass?: string
  onOpen: (id: string | null) => void
  onNew: () => void
  /** 'main' = the default conversation. */
  activity?: ReadonlySet<string>
  /** Accessible name for the unseen-activity dot — omit to keep it purely
      visual. */
  activityLabel?: string
  opsLabels?: { rename: string; delete: string; confirmDelete: string; name: string }
  onRename?: (id: string, title: string) => void
  onDelete?: (id: string) => void
  rowClass?: string
  opClass?: string
  dotClass?: string
  renameInputClass?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  /* Thread id mid-rename — its row swaps the pick button for the input. */
  const [renamingId, setRenamingId] = useState<string | null>(null)
  /* Two-step delete — first tap arms the row, second confirms. */
  const [deleteArmed, setDeleteArmed] = useState<string | null>(null)
  const ops = (onRename ?? onDelete) && opsLabels

  /* Outside press or Escape dismisses the menu; Escape returns focus to
     the trigger since menu items hold it while it's open. */
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  /* Closing the menu drops any half-finished rename/armed delete. */
  useEffect(() => {
    if (!open) {
      setRenamingId(null)
      setDeleteArmed(null)
    }
  }, [open])

  /* An armed delete disarms itself — the confirm can't linger. */
  useEffect(() => {
    if (!deleteArmed) return
    const t = window.setTimeout(() => setDeleteArmed(null), 3000)
    return () => window.clearTimeout(t)
  }, [deleteArmed])

  const pick = (id: string | null) => {
    setOpen(false)
    onOpen(id)
  }
  const dot = (key: string) =>
    activity?.has(key) ? (
      <i
        className={dotClass}
        role={activityLabel ? 'img' : undefined}
        aria-label={activityLabel}
        aria-hidden={activityLabel ? undefined : true}
      />
    ) : null
  return (
    <span ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        ref={triggerRef}
        className={buttonClass}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
      >
        <MessagesSquare size={13} aria-hidden="true" />
        {activeName}
        <ChevronDown size={12} aria-hidden="true" />
        {activity && [...activity].some((k) => k !== (activeId ?? 'main')) && (
          <i
            className={dotClass}
            role={activityLabel ? 'img' : undefined}
            aria-label={activityLabel}
            aria-hidden={activityLabel ? undefined : true}
          />
        )}
      </button>
      {open && (
        <div className={listClass} role="menu">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={activeId === null}
            className={itemClass}
            onClick={() => pick(null)}
          >
            {labels.defaultThread}
            {dot('main')}
          </button>
          {threads.map((t) =>
            ops ? (
              <span key={t.id} role="none" className={rowClass}>
                {renamingId === t.id ? (
                  <input
                    className={renameInputClass}
                    defaultValue={t.title ?? ''}
                    aria-label={opsLabels.name}
                    maxLength={80}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRename?.(t.id, e.currentTarget.value)
                        setRenamingId(null)
                      } else if (e.key === 'Escape') {
                        e.stopPropagation()
                        setRenamingId(null)
                      }
                    }}
                    onBlur={(e) => {
                      onRename?.(t.id, e.currentTarget.value)
                      setRenamingId(null)
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeId === t.id}
                    className={itemClass}
                    onClick={() => pick(t.id)}
                  >
                    {t.title ?? labels.untitled}
                    {dot(t.id)}
                  </button>
                )}
                {renamingId === t.id ? null : (
                  <>
                    {onRename && (
                      <button
                        type="button"
                        className={opClass}
                        aria-label={opsLabels.rename}
                        title={opsLabels.rename}
                        onClick={() => setRenamingId(t.id)}
                      >
                        <Pencil size={11} aria-hidden="true" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className={opClass}
                        aria-label={
                          deleteArmed === t.id ? opsLabels.confirmDelete : opsLabels.delete
                        }
                        title={deleteArmed === t.id ? opsLabels.confirmDelete : opsLabels.delete}
                        onClick={() => {
                          if (deleteArmed === t.id) {
                            setDeleteArmed(null)
                            onDelete(t.id)
                          } else {
                            setDeleteArmed(t.id)
                          }
                        }}
                      >
                        {deleteArmed === t.id ? (
                          <span>{opsLabels.confirmDelete}</span>
                        ) : (
                          <Trash2 size={11} aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </>
                )}
              </span>
            ) : (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={activeId === t.id}
                className={itemClass}
                onClick={() => pick(t.id)}
              >
                {t.title ?? labels.untitled}
                {dot(t.id)}
              </button>
            ),
          )}
          <button
            type="button"
            role="menuitem"
            className={`${itemClass ?? ''} ${newItemClass ?? ''}`.trim()}
            onClick={() => {
              setOpen(false)
              onNew()
            }}
          >
            {labels.newThread}
          </button>
        </div>
      )}
    </span>
  )
}

/**
 * A row of small tappable chips — starter prompts in the empty state and
 * the reply's suggested follow-ups share it.
 */
export function ChipRow({
  chips,
  label,
  className,
  chipClass,
  onPick,
}: {
  chips: string[]
  label?: string
  className?: string
  chipClass?: string
  onPick: (chip: string) => void
}) {
  /* Model-generated chips can repeat — dedupe and key by position so two
     identical suggestions can't collide on a text key. */
  const unique = [...new Set(chips)]
  return (
    <div className={className} role="group" aria-label={label}>
      {unique.map((c, i) => (
        <button key={`${i}-${c}`} type="button" className={chipClass} onClick={() => onPick(c)}>
          {c}
        </button>
      ))}
    </div>
  )
}

/**
 * One-tap reasons under a thumbs-down — stores the why with the rating so
 * the signal isn't a bare -1.
 */
export function ReasonChips({
  label,
  reasons,
  className,
  chipClass,
  labelClass,
  onPick,
  dismissLabel,
  onDismiss,
}: {
  label: string
  reasons: string[]
  className?: string
  chipClass?: string
  labelClass?: string
  onPick: (reason: string) => void
  /* A downvote that changes its mind needs an exit — without it the chips
     stay until a pick or a re-rate. */
  dismissLabel?: string
  onDismiss?: () => void
}) {
  return (
    <span className={className}>
      <em className={labelClass}>{label}</em>
      {reasons.map((r) => (
        <button key={r} type="button" className={chipClass} onClick={() => onPick(r)}>
          {r}
        </button>
      ))}
      {onDismiss && dismissLabel && (
        <button
          type="button"
          className={chipClass}
          aria-label={dismissLabel}
          title={dismissLabel}
          onClick={onDismiss}
        >
          <X size={11} aria-hidden="true" />
        </button>
      )}
    </span>
  )
}
