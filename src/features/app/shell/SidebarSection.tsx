import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from './cx'

interface SidebarSectionProps {
  readonly id: string
  readonly heading: string
  readonly expanded: boolean
  readonly open: boolean
  readonly onToggle: () => void
  readonly children: ReactNode
}

export function SidebarSection({
  id,
  heading,
  expanded,
  open,
  onToggle,
  children,
}: SidebarSectionProps) {
  const panelId = `${id}-panel`

  return (
    <div className="flex flex-col">
      {expanded && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-2.5 pt-3.5 pb-1.5 text-left"
        >
          <span className="text-[11px] font-semibold tracking-[0.04em] text-text-muted uppercase">
            {heading}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className={cx(
              'shrink-0 text-text-muted transition-transform duration-150 ease-in-out motion-reduce:transition-none',
              open ? 'rotate-180' : 'rotate-0',
            )}
            aria-hidden="true"
          />
        </button>
      )}
      {expanded ? (
        <div
          id={panelId}
          className={cx(
            'grid transition-[grid-template-rows,opacity] duration-150 ease-in-out motion-reduce:transition-none',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">{children}</div>
        </div>
      ) : (
        <div className="block opacity-100">{children}</div>
      )}
    </div>
  )
}
