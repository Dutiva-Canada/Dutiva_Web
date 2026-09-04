import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { memoryMessages as MEM } from '@/i18n/messages/memory'

/**
 * Shared frame for /app/settings — General settings and Memory as sub-tabs.
 * On Memory routes the General|Memory strip is hidden so MemoryLayout’s own
 * nav is the only secondary chrome (Settings still reachable from the rail).
 */

function SettingsTabs() {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const memory = pathname.startsWith('/app/settings/memory')
  const linkClass = (active: boolean) =>
    `shrink-0 rounded-none border-b-2 px-[14px] py-[9px] font-sans text-[13px] font-semibold whitespace-nowrap ${
      active ? 'border-navy text-text' : 'border-transparent text-text-muted'
    }`
  return (
    <nav
      aria-label={x(M.shell_nav_settings)}
      className="shrink-0 flex gap-[2px] overflow-x-auto border-b border-border px-[16px] sm:px-[24px] md:px-[32px]"
    >
      <Link
        to="/app/settings"
        aria-current={!memory ? 'page' : undefined}
        className={linkClass(!memory)}
      >
        {x(M.shell_settings_general)}
      </Link>
      <Link
        to="/app/settings/memory"
        aria-current={memory ? 'page' : undefined}
        className={linkClass(memory)}
      >
        {x(MEM.memory_nav_memory)}
      </Link>
    </nav>
  )
}

export function SettingsLayout() {
  const { pathname } = useLocation()
  const onMemory = pathname.startsWith('/app/settings/memory')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!onMemory && <SettingsTabs />}
      <Outlet />
    </div>
  )
}
