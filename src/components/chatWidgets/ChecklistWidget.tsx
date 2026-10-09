import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import type { ChecklistSpec } from './widgetSpec'
import { WidgetFrame } from './WidgetFrame'

/**
 * Checklist — checkable items with a progress bar and a "copy summary"
 * button. Checked state is per-message React state: toggling a box never
 * writes anything server-side, and the copied text is a plain-text summary
 * built in the active locale at click time — so a FR clipboard gets French
 * labels even if the spec shipped both.
 *
 * A11y: real checkboxes inside <label> rows (44px touch target), a
 * role="progressbar" meter, and the copy result announced via aria-live.
 */
export function ChecklistWidget({ spec }: { readonly spec: ChecklistSpec }) {
  const { x, lang } = useI18n()
  const { items, showProgress = true, copySummary = true } = spec.data
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const item of items) init[item.id] = item.done ?? false
    return init
  })
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const doneCount = useMemo(
    () => items.filter((item) => checked[item.id]).length,
    [items, checked],
  )
  const total = items.length
  const progressText = x(CW.chatw_checklist_progress)
    .replace('{done}', String(doneCount))
    .replace('{total}', String(total))

  const copy = async () => {
    const title = spec.title ? `${pickL(spec.title, lang)}\n` : ''
    const lines = items.map(
      (item) => `${checked[item.id] ? '[x]' : '[ ]'} ${pickL(item.label, lang)}`,
    )
    const summary = `${title}${progressText}\n${lines.join('\n')}`
    try {
      await navigator.clipboard.writeText(summary)
      setCopyState('copied')
    } catch {
      /* navigator.clipboard needs a secure context + permission — when it's
         unavailable the button reports the failure instead of throwing. */
      setCopyState('failed')
    }
  }

  return (
    <WidgetFrame title={spec.title}>
      {showProgress && (
        <div className="cw-progress">
          <div className="cw-progress-label">
            <span>{progressText}</span>
            <span aria-hidden="true">{Math.round((doneCount / total) * 100)}%</span>
          </div>
          <div
            className="cw-progress-track"
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={progressText}
          >
            <div
              className="cw-progress-fill"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="cw-checklist">
        {items.map((item) => (
          <label className="cw-check-item" data-done={checked[item.id]} key={item.id}>
            <input
              type="checkbox"
              checked={checked[item.id] ?? false}
              onChange={(e) =>
                setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
              }
            />
            <span className="cw-check-label">{pickL(item.label, lang)}</span>
          </label>
        ))}
      </div>

      {copySummary && (
        <div className="cw-actions">
          <button type="button" className="cw-btn" onClick={() => void copy()}>
            {copyState === 'copied' ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            {copyState === 'copied' ? x(CW.chatw_checklist_copied) : x(CW.chatw_checklist_copy)}
          </button>
          <span className="sr-only" aria-live="polite">
            {copyState === 'failed' ? x(CW.chatw_checklist_copy_failed) : ''}
          </span>
        </div>
      )}
    </WidgetFrame>
  )
}
