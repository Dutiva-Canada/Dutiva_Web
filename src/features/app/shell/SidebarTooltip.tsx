import type { ReactNode } from 'react'
import { cx } from './cx'

interface SidebarTooltipProps {
  readonly children: ReactNode
  readonly label: string
  readonly show: boolean
  readonly position?: 'right' | 'bottom'
}

/** Collapsed-rail label — positioned relative to the trigger (no inline coords). */
export function SidebarTooltip({ children, label, show, position = 'right' }: SidebarTooltipProps) {
  if (!show) return <>{children}</>

  return (
    <div className="group/tooltip relative flex">
      {children}
      <span
        role="tooltip"
        className={cx(
          'pointer-events-none absolute z-80 hidden whitespace-nowrap rounded-md bg-surface px-2 py-1 text-[11px] font-medium text-text shadow-[0_4px_16px_rgba(0,0,0,0.18)] ring-1 ring-border',
          'group-hover/tooltip:block group-focus-within/tooltip:block',
          position === 'right'
            ? 'left-full top-1/2 ml-2 -translate-y-1/2'
            : 'left-1/2 top-full mt-1.5 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </div>
  )
}
