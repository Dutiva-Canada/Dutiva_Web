import { useId, useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { evaluateFormula } from './formula'
import { formatValue } from './formatValue'
import type { CalculatorSpec } from './widgetSpec'
import { WidgetFrame } from './WidgetFrame'

/**
 * Calculator — labeled numeric inputs + a declarative formula, computed
 * live on the client. State is per-message and never leaves the component:
 * no network call, no persistence, nothing a bot can trigger server-side.
 *
 * The formula is a FormulaExpr tree (see formula.ts), so the "compute" is an
 * interpreter over data — there is no code path from spec to eval.
 *
 * A11y: each input is a real <label>/<input> pair; the result region is
 * aria-live so a screen reader hears the recomputation.
 */
export function CalculatorWidget({ spec }: { readonly spec: CalculatorSpec }) {
  const { lang } = useI18n()
  const baseId = useId()
  const { inputs, formula, result, breakdown, regulated, note } = spec.data

  /* Raw field strings, not numbers — an empty or half-typed value has to
     round-trip through the input before it's a number. */
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const input of inputs) init[input.key] = input.default?.toString() ?? ''
    return init
  })

  const values = useMemo(() => {
    const vars: Record<string, number> = {}
    for (const input of inputs) {
      const raw = fields[input.key] ?? ''
      const parsed = raw.trim() === '' ? Number.NaN : Number(raw)
      let v = parsed
      if (Number.isFinite(v)) {
        if (input.min !== undefined) v = Math.max(input.min, v)
        if (input.max !== undefined) v = Math.min(input.max, v)
      }
      vars[input.key] = v
    }
    return vars
  }, [fields, inputs])

  const resultValue = useMemo(() => evaluateFormula(formula, values), [formula, values])
  const resultId = `${baseId}-result`

  return (
    <WidgetFrame title={spec.title} regulated={regulated} note={note}>
      <div className="cw-calc-inputs">
        {inputs.map((input) => {
          const id = `${baseId}-${input.key}`
          const helpText = input.help ? pickL(input.help, lang) : undefined
          const unitText = input.unit ? pickL(input.unit, lang) : undefined
          return (
            <div className="cw-calc-field" key={input.key}>
              <label className="cw-calc-label" htmlFor={id}>
                {pickL(input.label, lang)}
              </label>
              <div className="cw-calc-inputrow">
                <input
                  id={id}
                  className="cw-calc-input"
                  type="number"
                  inputMode="decimal"
                  value={fields[input.key] ?? ''}
                  min={input.min}
                  max={input.max}
                  step={input.step ?? 'any'}
                  aria-describedby={
                    [helpText ? `${id}-help` : undefined, resultId]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [input.key]: e.target.value }))
                  }
                />
                {unitText && <span className="cw-calc-unit">{unitText}</span>}
              </div>
              {helpText && (
                <span className="cw-calc-help" id={`${id}-help`}>
                  {helpText}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="cw-calc-result" id={resultId} aria-live="polite">
        <div className="cw-calc-result-label">{pickL(result.label, lang)}</div>
        <div className="cw-calc-result-value">{formatValue(resultValue, result.format, lang)}</div>
        {breakdown && breakdown.length > 0 && (
          <div className="cw-calc-breakdown">
            {breakdown.map((row, i) => (
              <div className="cw-calc-breakdown-row" key={i}>
                <span>{pickL(row.label, lang)}</span>
                <span>
                  {formatValue(evaluateFormula(row.value, values), row.format ?? 'number', lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetFrame>
  )
}
