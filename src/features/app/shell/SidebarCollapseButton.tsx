import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { cx } from './cx'

interface SidebarCollapseButtonProps {
  readonly expanded: boolean
  readonly onToggle: () => void
}

export function SidebarCollapseButton({ expanded, onToggle }: SidebarCollapseButtonProps) {
  const { x } = useI18n()

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={x(M.shell_expand_sidebar)}
        aria-expanded={false}
        className={cx(
          'mt-auto flex w-full cursor-pointer items-center justify-center border-none bg-transparent py-2 text-text-3 hover:bg-inset min-h-11',
        )}
      >
        <PanelLeftOpen size={18} strokeWidth={1.8} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={x(M.shell_collapse_sidebar)}
      aria-expanded={true}
      className={cx(
        'flex w-full cursor-pointer items-center justify-center gap-2 border-none bg-transparent py-2 text-[12px] font-medium text-text-3 hover:bg-inset',
      )}
    >
      <PanelLeftClose size={18} strokeWidth={1.8} />
      {x(M.shell_collapse_sidebar)}
    </button>
  )
}
