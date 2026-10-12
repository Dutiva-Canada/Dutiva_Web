import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, ChevronDown, Copy, MessageSquarePlus } from 'lucide-react'

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
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* Clipboard denied — leave the affordance silent. */
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
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
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
  className,
  bodyClass,
}: {
  text: string
  live: boolean
  label: string
  className?: string
  bodyClass?: string
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  /* `open` is driven by DOM mutation, not a prop — React never owns the
     attribute, so a reader's manual toggle survives re-renders and the
     live transition can't fight them. */
  useEffect(() => {
    if (ref.current) ref.current.open = live
  }, [live])
  if (!text) return null
  return (
    <details ref={ref} className={className} data-live={live || undefined}>
      <summary>{label}</summary>
      <div className={bodyClass}>{text}</div>
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
}) {
  const [open, setOpen] = useState(false)
  const pick = (id: string | null) => {
    setOpen(false)
    onOpen(id)
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
      >
        <MessageSquarePlus size={13} aria-hidden="true" />
        {activeName}
        <ChevronDown size={12} aria-hidden="true" />
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
          </button>
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={activeId === t.id}
              className={itemClass}
              onClick={() => pick(t.id)}
            >
              {t.title ?? labels.untitled}
            </button>
          ))}
          <button
            type="button"
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
  return (
    <div className={className} aria-label={label}>
      {chips.map((c) => (
        <button key={c} type="button" className={chipClass} onClick={() => onPick(c)}>
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
}: {
  label: string
  reasons: string[]
  className?: string
  chipClass?: string
  labelClass?: string
  onPick: (reason: string) => void
}) {
  return (
    <span className={className}>
      <em className={labelClass}>{label}</em>
      {reasons.map((r) => (
        <button key={r} type="button" className={chipClass} onClick={() => onPick(r)}>
          {r}
        </button>
      ))}
    </span>
  )
}
