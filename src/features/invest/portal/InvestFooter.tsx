import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'

const LINKS = [
  { to: '/invest/legal/terms', label: IM.invest_footer_terms },
  { to: '/invest/legal/privacy', label: IM.invest_footer_privacy },
  { to: '/invest/legal/risk', label: IM.invest_footer_risk },
  { to: '/invest/legal/support', label: IM.invest_footer_support },
] as const

/**
 * App footer — mounted inside the authenticated layout and on the sign-in
 * wall (the legal routes it links are public, so both contexts work), and on
 * the standalone legal pages themselves. Carries the same informational-only
 * line the Overview shows, verbatim.
 */
export function InvestFooter() {
  const { x } = useI18n()
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[10px] px-[20px] py-[20px]">
        <nav
          aria-label={x(IM.invest_footer_nav)}
          className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]"
        >
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex min-h-[32px] items-center text-[12.5px] font-semibold text-text-2 no-underline hover:text-text"
            >
              {x(item.label)}
            </Link>
          ))}
        </nav>
        <p className="m-0 text-[11.5px] leading-normal text-text-3">{x(IM.invest_info_note)}</p>
      </div>
    </footer>
  )
}
