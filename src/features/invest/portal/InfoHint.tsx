import { useId, useState } from 'react'
import { Info } from 'lucide-react'

/* Tiny inline "ⓘ" affordance — explains a term where it's displayed, not
   just where it's chosen. The note opens beside it and closes on Escape
   or when focus/click leaves — the popover is a non-focusable note, so a
   blur on the trigger is the outside-click close. */
export function InfoHint({
  label,
  text,
  align = 'start',
}: {
  label: string
  text: string
  /* 'end' anchors the popover's right edge to the trigger — use when the
     trigger can sit near a card's right edge (account tiles). */
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const popId = useId()
  return (
    <span className={align === 'end' ? 'sb-hint sb-hint--end' : 'sb-hint'}>
      <button
        type="button"
        className="sb-hint-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        <Info size={12} strokeWidth={2.4} aria-hidden="true" />
      </button>
      {open && (
        <span id={popId} role="note" className="sb-hint-pop">
          {text}
        </span>
      )}
    </span>
  )
}
