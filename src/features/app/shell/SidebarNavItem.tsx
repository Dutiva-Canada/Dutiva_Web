import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import type { NavItem } from './navConfig'
import { cx } from './cx'
import { SidebarBadge } from './SidebarBadge'
import { SidebarTooltip } from './SidebarTooltip'
import { usePrefetchIntent } from './viewPrefetch'

interface SidebarNavItemProps {
  readonly item: NavItem
  readonly expanded: boolean
  readonly active: boolean
  readonly onClick?: () => void
}

/** Shared active chrome — accent rail in both expanded and compact widths. */
export function navItemActiveClasses(active: boolean): string {
  return active
    ? 'border-l-2 border-accent bg-accent-soft font-semibold text-accent'
    : 'border-l-2 border-transparent font-medium text-text-2 hover:bg-inset hover:text-text'
}

export function SidebarNavItem({ item, expanded, active, onClick }: SidebarNavItemProps) {
  const { x } = useI18n()
  const prefetch = usePrefetchIntent(item.key)
  const Icon = item.icon
  const label = x(item.label)
  const badgeValue = item.badge?.value
  const compactAria =
    !expanded && badgeValue ? `${label} (${badgeValue})` : expanded ? undefined : label

  return (
    <SidebarTooltip label={label} show={!expanded}>
      <Link
        to={item.to}
        onClick={onClick}
        {...prefetch}
        aria-label={compactAria}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'group relative my-px flex w-full items-center gap-2.5 rounded-[7px] text-[13.5px] transition-colors duration-150',
          expanded ? 'px-2.5 py-2' : 'justify-center p-2.25',
          navItemActiveClasses(active),
        )}
      >
        <Icon size={16} strokeWidth={1.7} className="shrink-0" />
        {!expanded && badgeValue && (
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent"
            aria-hidden="true"
          />
        )}
        <span
          aria-hidden={!expanded}
          className={cx(
            'flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none',
            expanded
              ? 'max-w-47.5 flex-1 translate-x-0 opacity-100 delay-100 duration-150'
              : 'max-w-0 -translate-x-1 opacity-0 delay-0 duration-100',
          )}
        >
          <span className={badgeValue ? 'flex-1 text-left' : undefined}>{label}</span>
          {badgeValue && (
            <SidebarBadge itemKey={item.key} value={badgeValue} tone={item.badge!.tone} />
          )}
        </span>
      </Link>
    </SidebarTooltip>
  )
}
