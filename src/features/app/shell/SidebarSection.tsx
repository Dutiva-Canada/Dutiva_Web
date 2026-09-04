import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { cx } from './cx'

interface SidebarSectionProps {
  readonly id: string
  readonly heading: string
  readonly expanded: boolean
  readonly open: boolean
  readonly itemCount: number
  readonly onToggle: () => void
  readonly children: ReactNode
}

export function SidebarSection({
  id,
  heading,
  expanded,
  open,
  itemCount,
  onToggle,
  children,
}: SidebarSectionProps) {
  const { x } = useI18n()
  const panelId = `${id}-panel`
  const countLabel = x(M.shell_section_item_count).replace('{n}', String(itemCount))
  const toggleLabel = open ? heading : `${heading}, ${countLabel}`

  return (
    <div className="flex flex-col">
      {expanded && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={toggleLabel}
          className="flex w-full cursor-pointer items-center justify-between gap-2 border-none bg-transparent px-2.5 pt-3.5 pb-1.5 text-left"
        >
          <span className="min-w-0 truncate text-[11px] font-semibold tracking-[0.04em] text-text-muted uppercase">
            {heading}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {!open && (
              <span className="text-[11px] font-medium tabular-nums text-text-faint" aria-hidden="true">
                {itemCount}
              </span>
            )}
            {open ? (
              <ChevronDown
                size={14}
                strokeWidth={1.8}
                className="text-text-muted"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                size={14}
                strokeWidth={1.8}
                className="text-text-muted"
                aria-hidden="true"
              />
            )}
          </span>
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
