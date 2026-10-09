import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import { Disclaimer } from '@/components/Disclaimer'

/**
 * Shared widget chrome — the bordered card every widget renders inside, with
 * an optional title bar, footnote, and the regulated-domain estimate line.
 * `role="region"` + aria-label keeps the widget a named landmark in the
 * thread; the label falls back to the generic "interactive tool" string so
 * untitled widgets still announce as content, not decoration.
 */
interface WidgetFrameProps {
  readonly title?: LText
  readonly regionLabel?: string
  readonly regulated?: boolean
  readonly note?: LText
  readonly children: ReactNode
}

export function WidgetFrame({ title, regionLabel, regulated, note, children }: WidgetFrameProps) {
  const { x, lang } = useI18n()
  const titleText = title ? pickL(title, lang) : undefined
  return (
    <div
      className="cw-root"
      role="region"
      aria-label={titleText ?? regionLabel ?? x(CW.chatw_region_label)}
    >
      <div className="cw-card">
        {titleText && <div className="cw-title">{titleText}</div>}
        <div className="cw-body">{children}</div>
      </div>
      {(regulated || note) && (
        <div className="cw-disclaimer">
          <Info size={13} strokeWidth={2} aria-hidden="true" />
          <span>
            {regulated ? x(CW.chatw_calc_estimate_disclaimer) : null}
            {regulated && note ? ' ' : null}
            {note ? pickL(note, lang) : null}
          </span>
        </div>
      )}
      {regulated && <Disclaimer variant="inline" className="mt-[6px]" />}
    </div>
  )
}
