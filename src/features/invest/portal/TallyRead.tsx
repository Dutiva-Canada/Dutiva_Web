import { Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useChartReads } from './investPrefs'

/** Tally's one-line read of the numbers a computed card already shows —
    deterministic (the card hands her the sentence, no model call), and
    factual for every tier: she names the widest drift or the uncovered
    slice, never whether it's good or bad. The × is the same off-switch
    as Settings → chart reads; both write the one pref. */
export function TallyRead({ line }: { line: string | null }) {
  const { x } = useI18n()
  const [on, setOn] = useChartReads()
  if (!on || !line) return null
  return (
    <p className="sb-tally-read">
      <Sparkles size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong>{x(IM.invest_chat_title)}</strong> — {line}
      </span>
      <button
        type="button"
        className="sb-tally-read-mute"
        aria-label={x(IM.invest_reads_hide)}
        title={x(IM.invest_reads_hide)}
        onClick={() => setOn(false)}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </p>
  )
}
