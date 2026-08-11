import { Search } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useSearch } from '@/features/app/search/searchContext'
import { SidebarTooltip } from './SidebarTooltip'

interface SidebarSearchProps {
  readonly expanded: boolean
}

export function SidebarSearch({ expanded }: SidebarSearchProps) {
  const { x } = useI18n()
  const { openSearch } = useSearch()

  if (!expanded) {
    return (
      <SidebarTooltip label={`${x(M.shell_search)} (⌘K)`} show>
        <button
          type="button"
          onClick={openSearch}
          aria-label={`${x(M.shell_search)} (⌘K)`}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent text-text-3 hover:bg-inset"
        >
          <Search size={16} strokeWidth={1.8} />
        </button>
      </SidebarTooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] font-medium text-text-3 hover:bg-inset"
    >
      <Search size={15} strokeWidth={1.8} className="shrink-0" />
      <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
        <span className="flex-1 text-left">{x(M.shell_search)}</span>
        <span className="hidden rounded-sm border border-border px-1.25 py-px text-[11px] text-text-faint sm:inline">
          ⌘K
        </span>
      </span>
    </button>
  )
}
