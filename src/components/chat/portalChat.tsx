import { useState } from 'react'
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
