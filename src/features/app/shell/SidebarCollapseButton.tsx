import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { SidebarTooltip } from './SidebarTooltip'
import { cx } from './cx'

interface SidebarCollapseButtonProps {
  readonly expanded: boolean
  readonly onToggle: () => void
}

export function SidebarCollapseButton({ expanded, onToggle }: SidebarCollapseButtonProps) {
  const { x } = useI18n()

  if (!expanded) {
    return (
      <SidebarTooltip label={x(M.shell_expand_sidebar)} show>
        <button
          type="button"
          onClick={onToggle}
          aria-label={x(M.shell_expand_sidebar)}
          aria-expanded={false}
          className={cx(
            'my-px flex w-full cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent p-2.25 text-text-2 hover:bg-inset hover:text-text min-h-11',
          )}
        >
          <PanelLeftOpen size={16} strokeWidth={1.7} />
        </button>
      </SidebarTooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={x(M.shell_collapse_sidebar)}
      aria-expanded={true}
      className={cx(
        'my-px flex w-full cursor-pointer items-center gap-2.5 rounded-[7px] border-none bg-transparent px-2.5 py-2 text-[13.5px] font-medium text-text-2 hover:bg-inset hover:text-text',
      )}
    >
      <PanelLeftClose size={16} strokeWidth={1.7} className="shrink-0" />
      {x(M.shell_collapse_sidebar)}
    </button>
  )
}
