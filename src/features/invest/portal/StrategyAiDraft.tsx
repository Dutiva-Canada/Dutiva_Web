import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { draftStrategy } from '@/features/invest/data/api'
import type { InvestStrategy } from '@/features/invest/data/types'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const fieldClass =
  'w-full rounded-[9px] border border-border bg-bg px-[11px] py-[8px] text-[13px] text-text outline-none focus:border-navy'
const btnClass =
  'inline-flex h-[38px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border-none bg-navy px-[14px] text-[13px] font-semibold text-white disabled:opacity-50'

/**
 * The AI drafter — a plain-language goal becomes a reviewable draft. The
 * model authors; nothing reaches the book until the user saves and enables.
 */
export function StrategyAiDraft({
  disabled,
  onDraft,
}: {
  disabled: boolean
  onDraft: (seed: Omit<InvestStrategy, 'id'>) => void
}) {
  const { x, lang } = useI18n()
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const draft = await draftStrategy(goal, lang === 'fr' ? 'fr' : 'en')
      onDraft(draft)
      setGoal('')
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="m-0 flex items-center gap-[8px] text-[14px] font-semibold text-text">
        <Sparkles size={15} aria-hidden="true" />
        {x(IM.invest_ai_title)}
      </h2>
      <p className="m-0 mt-[4px] text-[12px] text-text-muted">{x(IM.invest_ai_sub)}</p>
      <div className="mt-[10px] flex flex-col gap-[8px]">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={x(IM.invest_ai_placeholder)}
          rows={2}
          className={fieldClass}
          aria-label={x(IM.invest_ai_title)}
        />
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            disabled={busy || disabled || goal.trim().length < 10}
            onClick={() => void submit()}
            className={btnClass}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={13} aria-hidden="true" />
            )}
            {busy ? x(IM.invest_ai_drafting) : x(IM.invest_ai_draft)}
          </button>
          {error && (
            <p role="alert" className="m-0 text-[12px] text-risk-fg">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
