import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import type { TimelineSpec } from './widgetSpec'
import { WidgetFrame } from './WidgetFrame'

/**
 * Timeline — dated steps on a connector rail. Vertical on phones, a
 * horizontal scrollable rail at >=640px (see chatWidgets.css). A step's
 * status drives the dot (done = filled, current = accented ring, upcoming
 * = outline) and an sr-only status word so state isn't color-only.
 *
 * `date` accepts an ISO date or a short label ("Week 12") — ISO values are
 * reformatted in the active locale, labels pass through.
 */
function stepDate(date: string, lang: 'en' | 'fr'): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

export function TimelineWidget({ spec }: { readonly spec: TimelineSpec }) {
  const { x, lang } = useI18n()
  const { steps } = spec.data

  const statusLabel = (status: 'done' | 'current' | 'upcoming' | undefined) => {
    if (status === 'done') return x(CW.chatw_timeline_done)
    if (status === 'current') return x(CW.chatw_timeline_current)
    if (status === 'upcoming') return x(CW.chatw_timeline_upcoming)
    return null
  }

  return (
    <WidgetFrame title={spec.title}>
      <ol className="cw-timeline">
        {steps.map((step, i) => (
          <li className="cw-step" data-status={step.status ?? 'upcoming'} key={i}>
            <span className="cw-step-dot" aria-hidden="true" />
            <div className="cw-step-label">
              {pickL(step.label, lang)}
              {statusLabel(step.status) && (
                <span className="sr-only"> — {statusLabel(step.status)}</span>
              )}
            </div>
            {step.date && <div className="cw-step-date">{stepDate(step.date, lang)}</div>}
            {step.description && (
              <div className="cw-step-desc">{pickL(step.description, lang)}</div>
            )}
          </li>
        ))}
      </ol>
    </WidgetFrame>
  )
}
