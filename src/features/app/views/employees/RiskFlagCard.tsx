import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { cardToneStyles } from '@/features/app/advisor/toneStyles'
import type { Tone } from '@/data'

/**
 * The risk-flag card rendered on the employee profile overview and the quick
 * drawer — the prototype's `prepCard()` subset those surfaces use (dot +
 * title row, body, action buttons; no confidence/citations/trust note —
 * markup 1467–1473 and 1989–1997).
 */
interface RiskFlagAction {
  label: LText
  primary?: boolean
  onClick: () => void
}

interface RiskFlagCardProps {
  readonly tone: Tone
  readonly title: LText
  readonly body: LText
  readonly actions?: RiskFlagAction[]
}

export function RiskFlagCard({ tone, title, body, actions = [] }: RiskFlagCardProps) {
  const { lang } = useI18n()
  const styles = cardToneStyles[tone]

  return (
    <div
      className={`flex min-w-0 flex-col gap-[8px] rounded-[12px] border px-[16px] py-[14px] ${styles.card}`}
    >
      <div className="flex items-center gap-[8px]">
        <div className={`h-[7px] w-[7px] shrink-0 rounded-full ${styles.dot}`} />
        <div className={`text-[13.5px] font-bold ${styles.title}`}>{pickL(title, lang)}</div>
      </div>
      <div className="text-[13.5px] leading-[1.55] text-text-2">{pickL(body, lang)}</div>
      {actions.length > 0 && (
        <div className="flex gap-[8px]">
          {actions.map((action) => (
            <button
              key={pickL(action.label, 'en')}
              type="button"
              onClick={action.onClick}
              className={
                action.primary
                  ? `cursor-pointer rounded-[7px] border-none px-[13px] py-[7px] text-[12.5px] font-semibold text-white ${styles.primaryBtn}`
                  : `cursor-pointer rounded-[7px] border bg-transparent px-[13px] py-[7px] text-[12.5px] font-semibold ${styles.outline}`
              }
            >
              {pickL(action.label, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
