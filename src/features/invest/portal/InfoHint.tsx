import { useId, useState } from 'react'
import { Info } from 'lucide-react'

/* Tiny inline "ⓘ" affordance — explains a term where it's displayed, not
   just where it's chosen. Renders a button; the note opens beside it and
   closes on Escape or the next click outside nothing fancier is needed for
   one-line glosses. label = the aria-label ("About account types"). */
export function InfoHint({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false)
  const popId = useId()
  return (
    <span className="sb-hint">
      <button
        type="button"
        className="sb-hint-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((v) => !v)}
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
