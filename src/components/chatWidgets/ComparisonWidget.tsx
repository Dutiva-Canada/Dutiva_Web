import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import type { ComparisonSpec } from './widgetSpec'
import { WidgetFrame } from './WidgetFrame'

/**
 * Comparison cards — two or three side-by-side options (contractor vs.
 * employee, plan A vs. plan B). `recommended` gets the accent frame and a
 * badge; the grid collapses to a single column on phones via auto-fit.
 */
export function ComparisonWidget({ spec }: { readonly spec: ComparisonSpec }) {
  const { x, lang } = useI18n()
  const { options } = spec.data

  return (
    <WidgetFrame title={spec.title}>
      <div className="cw-compare">
        {options.map((option, i) => (
          <div className="cw-option" data-recommended={option.recommended ?? false} key={i}>
            <div className="cw-option-head">
              <div>
                <div className="cw-option-name">{pickL(option.name, lang)}</div>
                {option.tagline && (
                  <div className="cw-option-tagline">{pickL(option.tagline, lang)}</div>
                )}
              </div>
              {(option.recommended || option.badge) && (
                <span className="cw-badge">
                  {option.badge ? pickL(option.badge, lang) : x(CW.chatw_comparison_recommended)}
                </span>
              )}
            </div>
            <dl className="cw-option-rows">
              {option.rows.map((row, j) => (
                <div className="cw-option-row" key={j}>
                  <dt className="cw-row-label">{pickL(row.label, lang)}</dt>
                  <dd className="cw-row-value">{pickL(row.value, lang)}</dd>
                </div>
              ))}
            </dl>
            {option.footnote && (
              <div className="cw-option-foot">{pickL(option.footnote, lang)}</div>
            )}
          </div>
        ))}
      </div>
    </WidgetFrame>
  )
}
