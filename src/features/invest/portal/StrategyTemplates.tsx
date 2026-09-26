import { LayoutTemplate } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { STRATEGY_TEMPLATES, type StrategyTemplate } from '@/features/invest/data/strategyTemplates'
import type { InvestStrategy } from '@/features/invest/data/types'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'

const cadenceLabel = {
  daily: 'invest_cadence_daily',
  weekly: 'invest_cadence_weekly',
  monthly: 'invest_cadence_monthly',
} as const

/** The template gallery — one click seeds the strategy form. */
export function StrategyTemplates({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (seed: Omit<InvestStrategy, 'id'>) => void
}) {
  const { x } = useI18n()

  const pick = (t: StrategyTemplate) =>
    onPick({
      name: x(t.name),
      enabled: false,
      assetClasses: t.assetClasses,
      rules: t.rules.map((r) => ({ ...r })),
      autonomy: t.autonomy,
      cadence: t.cadence,
      template: `tpl:${t.slug}`,
    })

  return (
    <section className={cardClass}>
      <h2 className="m-0 flex items-center gap-[8px] text-[14px] font-semibold text-text">
        <LayoutTemplate size={15} aria-hidden="true" />
        {x(IM.invest_templates_title)}
      </h2>
      <p className="m-0 mt-[4px] text-[12px] text-text-muted">{x(IM.invest_templates_sub)}</p>
      <ul className="m-0 mt-[12px] grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[10px] p-0">
        {STRATEGY_TEMPLATES.map((t) => (
          <li
            key={t.slug}
            className="flex flex-col gap-[8px] rounded-[10px] border border-border bg-inset p-[12px]"
          >
            <div className="flex items-start justify-between gap-[8px]">
              <p className="m-0 text-[13px] font-semibold text-text">{x(t.name)}</p>
              <span className="shrink-0 rounded-full border border-border px-[7px] py-[1px] text-[10px] font-semibold text-text-2">
                {x(IM[cadenceLabel[t.cadence]])}
              </span>
            </div>
            <p className="m-0 flex-1 text-[11.5px] leading-normal text-text-muted">{x(t.blurb)}</p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => pick(t)}
              className="inline-flex h-[30px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-transparent text-[12px] font-semibold text-text-2 hover:bg-surface disabled:opacity-50"
            >
              {x(IM.invest_template_use)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
