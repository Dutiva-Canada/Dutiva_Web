import { Link } from 'react-router-dom'
import { BellOff, Inbox, Mail } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useInvestData } from '@/features/invest/data/InvestDataContext'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const chipClass =
  'inline-flex items-center gap-[5px] rounded-full bg-inset px-[9px] py-[3px] text-[11px] font-semibold text-text-2'

/**
 * Where each strategy sends what it finds — a read view of the notify
 * destinations picked in the strategy form (in-app list, email, both, or
 * neither). Editing stays on the Bot tab where the toggles live; this card
 * links there rather than duplicating the control.
 */
export function StrategyDeliveryCard() {
  const { x } = useI18n()
  const { state } = useInvestData()

  return (
    <section className={cardClass}>
      <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_delivery_title)}</h2>
      <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
        {x(IM.invest_delivery_note)}
      </p>
      {state.strategies.length === 0 ? (
        <p className="m-0 mt-[12px] text-[12.5px] text-text-muted">{x(IM.invest_delivery_empty)}</p>
      ) : (
        <ul className="m-0 mt-[12px] flex list-none flex-col divide-y divide-border p-0">
          {state.strategies.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-[10px] py-[10px]"
            >
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold text-text">{s.name}</p>
                <p className="m-0 mt-[2px] text-[11.5px] text-text-muted">
                  {x(s.enabled ? IM.invest_strategy_enabled : IM.invest_strategy_disabled)}
                </p>
              </div>
              <span className="flex flex-wrap items-center gap-[6px]">
                {s.notify.inApp && (
                  <span className={chipClass}>
                    <Inbox size={11} strokeWidth={2} aria-hidden="true" />
                    {x(IM.invest_delivery_inapp)}
                  </span>
                )}
                {s.notify.email && (
                  <span className={chipClass}>
                    <Mail size={11} strokeWidth={2} aria-hidden="true" />
                    {x(IM.invest_delivery_email)}
                  </span>
                )}
                {!s.notify.inApp && !s.notify.email && (
                  <span className={chipClass}>
                    <BellOff size={11} strokeWidth={2} aria-hidden="true" />
                    {x(IM.invest_delivery_off)}
                  </span>
                )}
                <Link
                  to="/invest/strategies"
                  className="text-[12px] font-semibold text-accent no-underline hover:underline"
                >
                  {x(IM.invest_delivery_edit)}
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
