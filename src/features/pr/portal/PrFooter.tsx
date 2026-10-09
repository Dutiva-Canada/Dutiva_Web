import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'

const LINKS = [
  { to: '/pr/legal/terms', label: PM.pr_footer_terms },
  { to: '/pr/legal/privacy', label: PM.pr_footer_privacy },
  { to: '/pr/legal/support', label: PM.pr_footer_support },
] as const

/**
 * App footer — mounted inside the authenticated layout and on the sign-in
 * wall (the legal routes it links are public, so both contexts work), and
 * on the standalone legal pages themselves. Carries the same
 * plans-and-tracks-only line the Overview shows, verbatim.
 */
export function PrFooter() {
  const { x } = useI18n()
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[10px] px-[20px] py-[20px]">
        <nav
          aria-label={x(PM.pr_footer_nav)}
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
        <p className="m-0 text-[11.5px] leading-normal text-text-3">{x(PM.pr_note)}</p>
      </div>
    </footer>
  )
}
