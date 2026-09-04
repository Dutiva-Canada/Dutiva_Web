import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import type { WorkspaceIdentity, WorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { SidebarTooltip } from './SidebarTooltip'
import { cx } from './cx'

interface SidebarHeaderProps {
  readonly expanded: boolean
  readonly inDrawer: boolean
  readonly identity: WorkspaceIdentity
  readonly workspaceMode: WorkspaceMode
  readonly onCloseDrawer?: () => void
  readonly focusCloseOnMount?: boolean
}

export function SidebarHeader({
  expanded,
  inDrawer,
  identity,
  workspaceMode,
  onCloseDrawer,
  focusCloseOnMount = false,
}: SidebarHeaderProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusCloseOnMount && inDrawer) {
      closeRef.current?.focus()
    }
  }, [focusCloseOnMount, inDrawer])
  const { x } = useI18n()
  const subtitle = workspaceMode === 'demo' ? x(M.shell_demo_workspace) : x(M.shell_hr_workspace)

  return (
    <div
      className={cx(
        'flex shrink-0 items-center gap-2.25 pt-3 pb-2.5',
        expanded ? 'px-3.5' : 'justify-center px-2',
      )}
    >
      <SidebarTooltip label={identity.companyName} show={!expanded}>
        <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-navy text-[14px] font-bold text-gold-on-navy">
          {identity.companyName.charAt(0)}
        </div>
      </SidebarTooltip>
      {!expanded && <span className="sr-only">{identity.companyName}</span>}
      <div
        aria-hidden={!expanded}
        className={cx(
          'min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none',
          expanded
            ? 'max-w-45 translate-x-0 opacity-100 delay-100 duration-150'
            : 'max-w-0 -translate-x-1 opacity-0 delay-0 duration-100',
        )}
      >
        <div
          className="truncate text-[14px] leading-[1.2] font-bold text-text"
          title={identity.companyName}
        >
          {identity.companyName}
        </div>
        <div className="truncate text-[11px] text-text-muted">{subtitle}</div>
      </div>
      {inDrawer && (
        <button
          ref={closeRef}
          type="button"
          onClick={onCloseDrawer}
          aria-label={x(M.shell_close_menu)}
          className="ml-auto flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-none bg-transparent"
        >
          <X size={18} strokeWidth={1.8} className="text-text-3" />
        </button>
      )}
    </div>
  )
}
