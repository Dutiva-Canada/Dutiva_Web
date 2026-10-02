import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { dismissOnboarding, onboardingDismissed } from './onboarding'

const STEPS = [
  { title: IM.invest_tour_step1_title, body: IM.invest_tour_step1_body },
  { title: IM.invest_tour_step2_title, body: IM.invest_tour_step2_body },
  { title: IM.invest_tour_step3_title, body: IM.invest_tour_step3_body },
  { title: IM.invest_tour_step4_title, body: IM.invest_tour_step4_body },
] as const

/**
 * First-run tour — four steps explaining what Invest does (and does not),
 * the auto-provisioned paper account, watching a symbol, and turning on a
 * template. Renders only for a genuinely fresh book (no positions,
 * strategies, or watched symbols yet) until dismissed; re-openable from
 * Settings.
 */
export function InvestOnboarding() {
  const { x } = useI18n()
  const { state, loading } = useInvestData()
  const [dismissed, setDismissed] = useState(() => onboardingDismissed())

  if (loading || dismissed) return null
  const fresh =
    state.positions.length === 0 && state.strategies.length === 0 && state.watchlist.length === 0
  if (!fresh) return null

  const close = () => {
    dismissOnboarding()
    setDismissed(true)
  }

  return (
    <section
      aria-label={x(IM.invest_tour_title)}
      className="relative mt-[16px] rounded-[14px] border border-gold-border bg-gold-bg p-[18px]"
    >
      <button
        type="button"
        onClick={close}
        aria-label={x(IM.invest_tour_dismiss)}
        className="absolute top-[12px] right-[12px] inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-2 hover:bg-surface"
      >
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>

      <h2 className="m-0 pr-[36px] text-[14px] font-semibold text-text">
        {x(IM.invest_tour_title)}
      </h2>

      <ol className="m-0 mt-[14px] flex list-none flex-col gap-[12px] p-0">
        {STEPS.map((step, i) => (
          <li key={i} className="flex items-start gap-[10px]">
            <span
              aria-hidden="true"
              className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-navy text-[10.5px] font-bold text-white"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-semibold text-text">{x(step.title)}</p>
              <p className="m-0 mt-[2px] text-[12.5px] leading-[1.5] text-text-2">{x(step.body)}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-[14px] flex flex-wrap gap-[10px]">
        <Link
          to="/invest/portfolio"
          onClick={close}
          className="inline-flex min-h-[40px] items-center justify-center rounded-[9px] border-none bg-navy px-[14px] text-[12.5px] font-semibold text-white no-underline"
        >
          {x(IM.invest_tour_cta_portfolio)}
        </Link>
        <Link
          to="/invest/strategies"
          onClick={close}
          className="inline-flex min-h-[40px] items-center justify-center rounded-[9px] border border-border bg-transparent px-[14px] text-[12.5px] font-semibold text-text-2 no-underline hover:bg-surface"
        >
          {x(IM.invest_tour_cta_strategies)}
        </Link>
      </div>
    </section>
  )
}
