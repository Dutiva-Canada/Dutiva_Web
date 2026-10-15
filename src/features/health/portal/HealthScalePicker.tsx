import './health.css'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'

/* A row of five labelled scale buttons — the check-in page's mood/energy
   picker, shared with the Overview's quick check-in. */
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
  return (
    <fieldset className="sb-field" disabled={disabled}>
      <legend className="sb-flabel">{legend}</legend>
      <div className="hb-scale" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            id={`${idPrefix}-${n}`}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`hb-scale-btn${value === n ? ' is-on' : ''}`}
            onClick={() => onPick(clearable && value === n ? null : n)}
          >
            <span className="hb-scale-num" aria-hidden="true">
              {n}
            </span>
            <span className="hb-scale-label">{x(labels[n] ?? { en: '', fr: '' })}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
