import { Link } from 'react-router-dom'
import { BellOff, Inbox, Mail } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useInvestData } from '@/features/invest/data/InvestDataContext'

/**
 * Where each strategy sends what it finds — a read view of the notify
 * destinations picked in the strategy form (in-app list, email, both, or
 * neither). Editing stays on the Agent tab where the toggles live; this
 * card links there rather than duplicating the control.
 */
export function StrategyDeliveryCard() {
  const { x } = useI18n()
  const { state } = useInvestData()

  return (
    <section className="sb-section" aria-label={x(IM.invest_delivery_title)}>
      <div className="sb-section-head">
        <div>
          <h2>{x(IM.invest_delivery_title)}</h2>
          <p className="sub">{x(IM.invest_delivery_note)}</p>
        </div>
      </div>
      <div className="sb-card sb-card-pad">
        {state.strategies.length === 0 ? (
          <p className="sb-empty" style={{ marginTop: 0 }}>{x(IM.invest_delivery_empty)}</p>
        ) : (
          <ul className="sb-mini-list">
            {state.strategies.map((s) => (
              <li key={s.id}>
                <div style={{ minWidth: 0 }}>
                  <p className="sb-sig-title" style={{ margin: 0, fontSize: 14.5 }}>
                    {s.name}
                  </p>
                  <span
                    className={`sb-pill ${s.enabled ? 'sb-pill-ok' : 'sb-pill-draft'}`}
                    style={{ marginTop: 4 }}
                  >
                    {x(s.enabled ? IM.invest_strategy_enabled : IM.invest_strategy_disabled)}
                  </span>
                </div>
                <span className="sb-row-actions" style={{ justifyContent: 'flex-end' }}>
                  {s.notify.inApp && (
                    <span className="sb-pill">
                      <Inbox size={11} strokeWidth={2} aria-hidden="true" />
                      {x(IM.invest_delivery_inapp)}
                    </span>
                  )}
                  {s.notify.email && (
                    <span className="sb-pill">
                      <Mail size={11} strokeWidth={2} aria-hidden="true" />
                      {x(IM.invest_delivery_email)}
                    </span>
                  )}
                  {!s.notify.inApp && !s.notify.email && (
                    <span className="sb-pill">
                      <BellOff size={11} strokeWidth={2} aria-hidden="true" />
                      {x(IM.invest_delivery_off)}
                    </span>
                  )}
                  <Link
                    to="/invest/strategies"
                    aria-label={fill(x(IM.invest_delivery_edit_aria), { name: s.name })}
                    className="sb-notif-open"
                  >
                    {x(IM.invest_delivery_edit)}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
