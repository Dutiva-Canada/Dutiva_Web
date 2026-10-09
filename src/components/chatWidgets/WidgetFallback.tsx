import { useI18n } from '@/i18n/context'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'

/**
 * What an invalid widget spec renders: a quiet one-line note. The raw source
 * is never echoed back — a malformed fence degrades to a sentence, not a
 * wall of broken JSON or (worse) interpreted markup.
 */
export function WidgetFallback() {
  const { x } = useI18n()
  return (
    <div className="cw-root">
      <div className="cw-card cw-fallback" role="note">
        {x(CW.chatw_fallback)}
      </div>
    </div>
  )
}
