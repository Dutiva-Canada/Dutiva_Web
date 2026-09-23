import { useLocation } from 'react-router-dom'
import { Menu, Search, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useSearch } from '@/features/app/search/searchContext'
import { AuthMenuButton } from '@/features/app/auth/AuthMenuButton'
import { cx } from './cx'
import { isNavActive } from './navConfig'
import {
  useAskAdvisorBriefing,
  railViewKeyFromPathname,
} from '@/features/app/rail/useAskAdvisorBriefing'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { usePrefetchIntent } from './viewPrefetch'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'

/**
 * Mobile (<768px) chrome — branded app bar, horizontal primary navigation and
 * a floating Ask action. The mobile web layout deliberately avoids a fixed
 * bottom nav so the browser's own chrome has room to breathe.
 */

export function MobileTopbar({
  onOpenDrawer,
  triggerRef,
}: {
  readonly onOpenDrawer: () => void
  readonly triggerRef?: React.RefObject<HTMLButtonElement | null>
}) {
  const { x } = useI18n()
  const { openSearch } = useSearch()
  const { pathname } = useLocation()
  const { root } = useWorkspaceRoot()
  const askAdvisor = useAskAdvisorBriefing()
  const showAskAdvisor = !pathname.startsWith(`${root}/advisor`)

  return (
    <header className="flex h-[64px] shrink-0 items-center gap-[10px] border-b border-border bg-surface px-[12px]">
      <button
        ref={triggerRef}
        type="button"
        onClick={onOpenDrawer}
        aria-label={x(M.shell_open_menu)}
        className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface p-[6px] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
      >
        <Menu size={22} strokeWidth={1.8} className="text-text" />
      </button>

      <div className="min-w-0 flex-1 truncate font-display text-[24px] leading-none font-bold tracking-[-0.06em] text-navy">
        dutiva
      </div>

      <div className="flex shrink-0 items-center gap-[4px]">
        <button
          type="button"
          onClick={openSearch}
          aria-label={x(M.shell_search)}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[6px] text-text"
        >
          <Search size={19} strokeWidth={1.8} className="text-text" />
        </button>
        {showAskAdvisor && (
          <button
            type="button"
            onClick={() => askAdvisor(railViewKeyFromPathname(pathname))}
            className="flex min-h-[40px] items-center gap-[6px] rounded-full bg-navy px-[13px] text-[13px] font-semibold whitespace-nowrap text-white shadow-[0_4px_10px_rgba(15,35,72,0.18)]"
          >
            <Sparkle size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            {x(M.shell_ask_ai)}
          </button>
        )}
        <AuthMenuButton compact />
      </div>
    </header>
  )
}

function MobilePrimaryTab({
  to,
  label,
  active,
  prefetchKey,
}: {
  readonly to: string
  readonly label: typeof M.shell_tab_home
  readonly active: boolean
  readonly prefetchKey?: string
}) {
  const { x } = useI18n()
  const prefetch = usePrefetchIntent(prefetchKey)
  return (
    <Link
      to={to}
      aria-label={x(label)}
      aria-current={active ? 'page' : undefined}
      {...prefetch}
      className={cx(
        'flex min-h-[44px] shrink-0 items-center border-b-2 px-[14px] text-[13px] font-semibold whitespace-nowrap',
        active ? 'border-navy text-text' : 'border-transparent text-text-muted',
      )}
    >
      <span>{x(label)}</span>
    </Link>
  )
}

export function MobilePrimaryNav() {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const { root } = useWorkspaceRoot()
  const home = workspacePath(root, 'home')
  const cases = workspacePath(root, 'cases')
  const planning = workspacePath(root, 'planning/tasks')
  const documents = workspacePath(root, 'documents/studio')

  return (
    <nav
      aria-label={x(M.shell_primary_nav)}
      className="flex shrink-0 overflow-x-auto border-b border-border bg-surface px-[4px]"
    >
      <MobilePrimaryTab
        to={home}
        label={M.shell_nav_home}
        active={isNavActive(home, pathname)}
        prefetchKey="home"
      />
      <MobilePrimaryTab
        to={cases}
        label={M.shell_nav_cases}
        active={isNavActive(cases, pathname)}
        prefetchKey="cases"
      />
      <MobilePrimaryTab
        to={planning}
        label={M.shell_nav_planning}
        active={pathname.startsWith(`${root}/planning`)}
        prefetchKey="planning"
      />
      <MobilePrimaryTab
        to={documents}
        label={M.shell_nav_library}
        active={pathname.startsWith(`${root}/documents`)}
        prefetchKey="documents"
      />
    </nav>
  )
}

export function MobileAskFab() {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const { root } = useWorkspaceRoot()
  const askAdvisor = useAskAdvisorBriefing()

  if (pathname.startsWith(`${root}/advisor`)) return null

  return (
    <button
      type="button"
      onClick={() => askAdvisor(railViewKeyFromPathname(pathname))}
      className="fixed right-[16px] bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex min-h-[48px] items-center gap-[7px] rounded-full bg-navy px-[17px] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(15,35,72,0.28)]"
    >
      <Sparkle size={17} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      {x(M.shell_tab_ask)}
    </button>
  )
}
