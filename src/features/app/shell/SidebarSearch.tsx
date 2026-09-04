import { Search } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useSearch } from '@/features/app/search/searchContext'
import { searchShortcutLabel } from '@/lib/keyboardShortcut'
import { SidebarTooltip } from './SidebarTooltip'
import { cx } from './cx'

interface SidebarSearchProps {
  readonly expanded: boolean
  /** Softer chrome when Create should stay the dominant empty-workspace action. */
  readonly quiet?: boolean
}

export function SidebarSearch({ expanded, quiet = false }: SidebarSearchProps) {
  const { x } = useI18n()
  const { openSearch } = useSearch()
  const shortcut = searchShortcutLabel()

  if (!expanded) {
    return (
      <SidebarTooltip label={`${x(M.shell_search)} (${shortcut})`} show>
        <button
          type="button"
          onClick={openSearch}
          aria-label={`${x(M.shell_search)} (${shortcut})`}
          className={cx(
            'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-text-3 hover:bg-inset',
            quiet ? 'border border-transparent' : 'border border-border bg-transparent',
          )}
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
      className={cx(
        'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-inset',
        quiet
          ? 'border border-transparent text-text-faint hover:text-text-3'
          : 'border border-border bg-transparent text-text-3',
      )}
    >
      <Search size={15} strokeWidth={1.8} className="shrink-0" />
      <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
        <span className="flex-1 text-left">{x(M.shell_search)}</span>
        {!quiet && (
          <span className="hidden rounded-sm border border-border px-1.25 py-px text-[11px] text-text-faint sm:inline">
            {shortcut}
          </span>
        )}
      </span>
    </button>
  )
}
