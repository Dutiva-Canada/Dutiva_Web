import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import { cx } from '@/features/app/shell/cx'

/** Tabs shared by the support surfaces (new request / my requests). */
export function SupportSectionNav({ active }: { readonly active: 'new' | 'requests' }) {
  const { x } = useI18n()
  const tabClass = (isActive: boolean) =>
    cx(
      '-mb-px border-b-2 px-[4px] py-[10px] text-[14px] font-semibold whitespace-nowrap transition-colors',
      isActive ? 'border-gold-dot text-text' : 'border-transparent text-text-muted hover:text-text',
    )

  return (
    <nav className="mb-[20px] flex gap-[18px] border-b border-border" aria-label="Support">
      <NavLink to="/app/support" end className={() => tabClass(active === 'new')}>
        {x(M.support_new_request)}
      </NavLink>
      <NavLink to="/app/support/requests" className={() => tabClass(active === 'requests')}>
        {x(M.support_my_requests)}
      </NavLink>
    </nav>
  )
}
