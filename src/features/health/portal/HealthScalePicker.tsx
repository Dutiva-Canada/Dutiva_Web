import './health.css'
import { useId, useRef, type KeyboardEvent } from 'react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { healthMessages as HM } from '@/i18n/messages/health'

/* A row of five labelled scale buttons — the check-in page's mood/energy
   picker, shared with the Overview's quick check-in. Real radiogroup
   semantics: roving tabindex, arrow/Home/End move the selection, and the
   fieldset legend names the group. */
export function HealthScalePicker({
  idPrefix,
  legend,
  labels,
  value,
  onPick,
  clearable,
  disabled,
}: {
  idPrefix: string
  legend: string
  labels: Record<number, Bi>
  value: number | null
  onPick: (v: number | null) => void
  clearable?: boolean
  disabled?: boolean
}) {
  const { x } = useI18n()
  const legendId = useId()
  const groupRef = useRef<HTMLDivElement>(null)

  const move = (e: KeyboardEvent<HTMLButtonElement>, current: number) => {
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? Math.min(5, current + 1)
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? Math.max(1, current - 1)
          : e.key === 'Home'
            ? 1
            : e.key === 'End'
              ? 5
              : null
    if (next == null) return
    e.preventDefault()
    onPick(next)
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>('.hb-scale-btn')
      [next - 1]?.focus()
  }

  /* Exactly one tab stop: the picked value, else the first button. */
  const tabbable = value ?? 1
  return (
    <fieldset className="sb-field" disabled={disabled}>
      <legend className="sb-flabel" id={legendId}>
        {legend}
      </legend>
      <div className="hb-scale" role="radiogroup" aria-labelledby={legendId} ref={groupRef}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            id={`${idPrefix}-${n}`}
            type="button"
            role="radio"
            aria-checked={value === n}
            tabIndex={n === tabbable ? 0 : -1}
            className={`hb-scale-btn${value === n ? ' is-on' : ''}`}
            onClick={() => onPick(clearable && value === n ? null : n)}
            onKeyDown={(e) => move(e, n)}
          >
            <span className="hb-scale-num" aria-hidden="true">
              {n}
            </span>
            <span className="hb-scale-label">{x(labels[n] ?? { en: '', fr: '' })}</span>
          </button>
        ))}
      </div>
      {clearable && value != null && (
        <p className="sb-helper" style={{ marginTop: 6 }}>
          {x(HM.health_checkin_clear_hint)}
        </p>
      )}
    </fieldset>
  )
}
