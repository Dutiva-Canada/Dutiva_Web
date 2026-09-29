import { useState } from 'react'
import {
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Coins,
  LayoutTemplate,
  LineChart,
  PieChart,
  Scale,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { RULE_METRIC_LABELS, ruleSentence } from '@/features/invest/data/strategyRules'
import { STRATEGY_TEMPLATES, type StrategyTemplate } from '@/features/invest/data/strategyTemplates'
import type { InvestStrategy, StrategyCadence } from '@/features/invest/data/types'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const fieldClass =
  'rounded-[7px] border border-border bg-bg px-[7px] py-[3px] text-[11px] text-text outline-none focus:border-navy'

const cadenceLabel: Record<StrategyCadence, keyof typeof IM> = {
  daily: 'invest_cadence_daily',
  weekly: 'invest_cadence_weekly',
  monthly: 'invest_cadence_monthly',
}

/** Visual anchor per template — keyed by slug so the data file stays
    icon-free. */
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  'rebalance-drift': Scale,
  'concentration-cap': PieChart,
  'buy-the-dip': TrendingDown,
  'momentum-guard': LineChart,
  'trim-winners': TrendingUp,
  'cash-sweep': Coins,
  'monthly-accumulate': CalendarPlus,
}

/** The template gallery — each card previews its rules and lets the user
    tune the cadence before seeding the create form. */
export function StrategyTemplates({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (seed: Omit<InvestStrategy, 'id'>) => void
}) {
  const { x } = useI18n()
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [cadenceBySlug, setCadenceBySlug] = useState<Record<string, StrategyCadence>>({})

  const pick = (t: StrategyTemplate) =>
    onPick({
      name: x(t.name),
      enabled: false,
      /* Watchlist scope is the safe default — the user narrows it to
         explicit symbols in the form before saving. */
      scope: { watchlist: true, symbols: [] },
      rules: t.rules.map((r) => ({ ...r })),
      notify: { inApp: true, email: false },
      cadence: cadenceBySlug[t.slug] ?? t.cadence,
      template: `tpl:${t.slug}`,
    })

  return (
    <section className={cardClass}>
      <h2 className="m-0 flex items-center gap-[8px] text-[14px] font-semibold text-text">
        <LayoutTemplate size={15} aria-hidden="true" />
        {x(IM.invest_templates_title)}
      </h2>
      <p className="m-0 mt-[4px] text-[12px] text-text-muted">{x(IM.invest_templates_sub)}</p>
      <ul className="m-0 mt-[12px] grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[10px] p-0">
        {STRATEGY_TEMPLATES.map((t) => {
          const cadence = cadenceBySlug[t.slug] ?? t.cadence
          const open = openSlug === t.slug
          const Icon = TEMPLATE_ICONS[t.slug] ?? LayoutTemplate
          return (
            <li
              key={t.slug}
              className="flex flex-col gap-[8px] rounded-[10px] border border-border bg-inset p-[12px]"
            >
              <p className="m-0 flex items-center gap-[7px] text-[13.5px] font-semibold text-text">
                <Icon size={14} className="shrink-0 text-gold-fg" aria-hidden="true" />
                {x(t.name)}
              </p>
              <p className="m-0 flex-1 text-[11.5px] leading-normal text-text-muted">
                {x(t.blurb)}
              </p>
              <label className="flex items-center justify-between gap-[8px] text-[10.5px] font-semibold text-text-2">
                {x(IM.invest_cadence_label)}
                <select
                  aria-label={x(IM.invest_cadence_label)}
                  value={cadence}
                  onChange={(e) =>
                    setCadenceBySlug((prev) => ({
                      ...prev,
                      [t.slug]: e.target.value as StrategyCadence,
                    }))
                  }
                  className={fieldClass}
                >
                  {(['daily', 'weekly', 'monthly'] as const).map((c) => (
                    <option key={c} value={c}>
                      {x(IM[cadenceLabel[c]])}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenSlug(open ? null : t.slug)}
                className="inline-flex cursor-pointer items-center gap-[4px] self-start border-none bg-transparent p-0 text-[11px] font-semibold text-text-2 hover:text-text"
              >
                {open ? (
                  <ChevronUp size={12} aria-hidden="true" />
                ) : (
                  <ChevronDown size={12} aria-hidden="true" />
                )}
                {x(IM.invest_template_preview)}
              </button>
              {open && (
                <ul className="m-0 flex list-none flex-col gap-[4px] rounded-[8px] border border-border bg-surface p-[8px]">
                  {t.rules.map((r, i) => (
                    <li key={i} className="text-[11.5px] leading-normal text-text-2">
                      {x(ruleSentence(r, (m) => IM[RULE_METRIC_LABELS[m] as keyof typeof IM]))}
                      {r.type === 'order_proposal' &&
                        ` — ${x(r.side === 'buy' ? IM.invest_order_buy : IM.invest_order_sell)} ${r.qty} ${x(
                          r.qtyUnit === 'shares'
                            ? IM.invest_unit_shares
                            : r.qtyUnit === 'percent_of_position'
                              ? IM.invest_unit_pct
                              : IM.invest_unit_currency,
                        ).toLowerCase()}`}
                    </li>
                  ))}
                </ul>
              )}
              {/* A disabled button can't take focus or hover, so the reason
                  rides on the wrapper — screen readers get aria-disabled. */}
              <span title={disabled ? x(IM.invest_template_busy) : undefined}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(t)}
                  className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-[8px] border border-border bg-transparent text-[12px] font-semibold text-text-2 hover:bg-surface disabled:opacity-50"
                >
                  {x(IM.invest_template_use)}
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
