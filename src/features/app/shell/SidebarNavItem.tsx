import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import type { NavItem } from './navConfig'
import { cx } from './cx'
import { SidebarBadge } from './SidebarBadge'
import { SidebarTooltip } from './SidebarTooltip'

interface SidebarNavItemProps {
  readonly item: NavItem
  readonly expanded: boolean
  readonly active: boolean
  readonly onClick?: () => void
}

export function SidebarNavItem({ item, expanded, active, onClick }: SidebarNavItemProps) {
  const { x } = useI18n()
  const Icon = item.icon
  const label = x(item.label)

  const activeClasses = active
    ? cx(
        'border-l-2 font-semibold',
        expanded
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-transparent bg-navy text-gold-on-navy',
      )
    : 'border-l-2 border-transparent font-medium text-text-2 hover:bg-inset hover:text-text'

  return (
    <SidebarTooltip label={label} show={!expanded}>
      <Link
        to={item.to}
        onClick={onClick}
        aria-label={expanded ? undefined : label}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'group my-px flex w-full items-center gap-2.5 rounded-[7px] text-[13.5px] transition-colors duration-150',
          expanded ? 'px-2.5 py-2' : 'justify-center p-2.25',
          activeClasses,
        )}
      >
        <Icon size={16} strokeWidth={1.7} className="shrink-0" />
        <span
          aria-hidden={!expanded}
          className={cx(
            'flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none',
            expanded
              ? 'max-w-47.5 flex-1 translate-x-0 opacity-100 delay-75'
              : 'max-w-0 -translate-x-1 opacity-0',
          )}
        >
          <span className={item.badge ? 'flex-1 text-left' : undefined}>{label}</span>
          {item.badge?.value && (
            <SidebarBadge itemKey={item.key} value={item.badge.value} tone={item.badge.tone} />
          )}
        </span>
      </Link>
    </SidebarTooltip>
  )
}
