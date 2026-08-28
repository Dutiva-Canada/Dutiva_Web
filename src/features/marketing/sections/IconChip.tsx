import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Small icon + label chip used by the template categories and modules rows.
 *
 * `note` appends a muted tag inside the chip — used to mark a module as
 * roadmap rather than shipped. It reads as part of the label, not as a
 * separate legend the eye can skip, because the claim it qualifies is the
 * one CANONICAL_FACTS §4 is about.
 *
 * When `to` is set, the chip links into the public demo workspace.
 */
export function IconChip({
  icon: Icon,
  label,
  note,
  highlighted,
  to,
}: {
  readonly icon: LucideIcon
  readonly label: string
  readonly note?: string
  readonly to?: string
  readonly highlighted?: boolean
}) {
  const baseClass =
    'inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-colors'
  const toneClass = highlighted
    ? 'border-gold-border bg-gold-subtle text-gold-strong'
    : 'border-border bg-bg-soft text-text-2'
  const linkClass = `${baseClass} ${toneClass} min-h-11 hover:border-gold-border/60 hover:text-text active:opacity-90`
  const content = (
    <>
      <Icon size={14} aria-hidden="true" />
      {label}
      {note !== undefined && (
        <span className="rounded-[6px] bg-bg-elevated px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.02em] text-text-muted uppercase">
          {note}
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={linkClass}>
        {content}
      </Link>
    )
  }

  return <span className={`${baseClass} ${toneClass}`}>{content}</span>
}
