import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Settings } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { seoRoute } from '@/seo/routes'
import { isCurrentUserAdmin } from '@/features/support/supportAdminApi'
import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { SidebarTooltip } from './SidebarTooltip'
import { navItemActiveClasses } from './SidebarNavItem'
import { cx } from './cx'
import { usePrefetchIntent } from './viewPrefetch'

interface SidebarFooterProps {
  readonly expanded: boolean
  readonly identity: WorkspaceIdentity
  readonly onNavigate?: () => void
}

export function SidebarFooter({ expanded, identity, onNavigate }: SidebarFooterProps) {
  const { x, L, lang } = useI18n()
  const navigate = useNavigate()
  const { root, isPublicDemo } = useWorkspaceRoot()
  const helpCentrePath = seoRoute('help').path[lang]
  const { pathname } = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    isCurrentUserAdmin()
      .then((admin) => {
        if (active) setIsAdmin(admin)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const settingsActive = pathname.startsWith(`${root}/settings`)
  const settingsPrefetch = usePrefetchIntent('settings')
  const displayName = identity.user.name.trim() || identity.user.email

  if (isPublicDemo) {
    return (
      <div className="shrink-0">
        <SidebarTooltip label={x(M.demo_tour_signin)} show={!expanded}>
          <Link
            to="/app/welcome"
            onClick={onNavigate}
            className={cx(
              'my-px flex w-full items-center gap-2.5 rounded-[7px] text-[13.5px] font-semibold text-gold-strong transition-colors duration-150 hover:bg-inset',
              expanded ? 'px-2.5 py-2' : 'justify-center p-2.25',
            )}
          >
            <LogIn size={16} strokeWidth={1.7} className="shrink-0" />
            <span
              aria-hidden={!expanded}
              className={cx(
                'overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none',
                expanded
                  ? 'max-w-47.5 translate-x-0 opacity-100 delay-75'
                  : 'max-w-0 -translate-x-1 opacity-0',
              )}
            >
              {x(M.demo_tour_signin)}
            </span>
          </Link>
        </SidebarTooltip>

        {expanded && (
          <div className="mt-2 flex items-center justify-start gap-1.75 border-t border-border-soft px-1.5 pt-3 pb-0.5">
            <div className="flex h-4.75 w-4.75 shrink-0 items-center justify-center">
              <img
                src="/brand/dutiva-leaf.png"
                alt="Dutiva"
                className="logo-glow block h-3.75 w-auto"
              />
            </div>
            <span className="max-w-37.5 translate-x-0 overflow-hidden whitespace-nowrap text-[11px] tracking-[0.01em] text-text-faint opacity-100 delay-75 transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none">
              {x(M.shell_powered_by)} <span className="font-bold text-text-muted">Dutiva</span>
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="shrink-0">
      <SidebarTooltip label={x(M.shell_nav_settings)} show={!expanded}>
        <Link
          to="/app/settings"
          onClick={onNavigate}
          {...settingsPrefetch}
          aria-current={settingsActive ? 'page' : undefined}
          aria-label={expanded ? undefined : x(M.shell_nav_settings)}
          className={cx(
            'my-px flex w-full items-center gap-2.5 rounded-[7px] text-[13.5px] transition-colors duration-150',
            expanded ? 'px-2.5 py-2' : 'justify-center p-2.25',
            navItemActiveClasses(settingsActive),
          )}
        >
          <Settings size={16} strokeWidth={1.7} className="shrink-0" />
          <span
            aria-hidden={!expanded}
            className={cx(
              'overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none',
              expanded
                ? 'max-w-47.5 translate-x-0 opacity-100 delay-75'
                : 'max-w-0 -translate-x-1 opacity-0',
            )}
          >
            {x(M.shell_nav_settings)}
          </span>
        </Link>
      </SidebarTooltip>

      <div className="relative mt-1">
        <SidebarTooltip label={displayName} show={!expanded}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            title={identity.user.email || undefined}
            aria-label={
              expanded
                ? undefined
                : L(`Account menu for ${displayName}`, `Menu du compte de ${displayName}`)
            }
            aria-expanded={profileOpen}
            className={cx(
              'relative flex w-full cursor-pointer items-center gap-2.25 rounded-lg border-none text-text transition-colors duration-150',
              expanded ? 'px-2.5 py-1.75' : 'justify-center p-1.75',
              profileOpen ? 'bg-border-soft' : 'bg-transparent hover:bg-inset',
            )}
          >
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-navy text-[11.5px] font-bold text-gold-on-navy">
              {identity.user.initials}
            </div>
            {expanded && (
              <div className="min-w-0 text-left">
                <div className="truncate text-[13px] font-semibold">{displayName}</div>
                <div className="truncate text-[11px] text-text-muted">{x(identity.user.role)}</div>
              </div>
            )}
          </button>
        </SidebarTooltip>

        {profileOpen && (
          <div
            role="menu"
            aria-label={L('Account menu', 'Menu du compte')}
            className="absolute bottom-full left-0 z-60 mb-1.5 w-50 overflow-hidden rounded-[11px] border border-border bg-surface shadow-popover"
          >
            <div className="border-b border-border-soft px-3.5 py-3">
              <div className="text-[13px] font-bold text-text">{displayName}</div>
              {identity.user.email ? (
                <div className="break-all text-[11.5px] text-text-muted">{identity.user.email}</div>
              ) : null}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileOpen(false)
                onNavigate?.()
                navigate('/app/settings')
              }}
              className="block w-full cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-left text-[13px] text-text-2 hover:bg-inset"
            >
              {x(M.shell_nav_settings)}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileOpen(false)
                onNavigate?.()
                navigate(helpCentrePath)
              }}
              className="block w-full cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-left text-[13px] text-text-2 hover:bg-inset"
            >
              {L('Help Centre', 'Centre d’aide')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileOpen(false)
                onNavigate?.()
                navigate('/app/support')
              }}
              className="block w-full cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-left text-[13px] text-text-2 hover:bg-inset"
            >
              {L('Contact support', 'Contacter le soutien')}
            </button>
            {isAdmin && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false)
                  onNavigate?.()
                  navigate('/app/support/admin')
                }}
                className="block w-full cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-left text-[13px] text-text-2 hover:bg-inset"
              >
                {L('Support dashboard', 'Tableau de bord du soutien')}
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileOpen(false)
                navigate('/app/welcome')
              }}
              className="block w-full cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-left text-[13px] text-risk-dot hover:bg-risk-bg"
            >
              {x(M.shell_sign_out)}
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-2 flex items-center justify-start gap-1.75 border-t border-border-soft px-1.5 pt-3 pb-0.5">
          <div className="flex h-4.75 w-4.75 shrink-0 items-center justify-center">
            <img
              src="/brand/dutiva-leaf.png"
              alt="Dutiva"
              className="logo-glow block h-3.75 w-auto"
            />
          </div>
          <span className="max-w-37.5 translate-x-0 overflow-hidden whitespace-nowrap text-[11px] tracking-[0.01em] text-text-faint opacity-100 delay-75 transition-[max-width,opacity,transform] duration-150 ease-in-out motion-reduce:transition-none">
            {x(M.shell_powered_by)} <span className="font-bold text-text-muted">Dutiva</span>
          </span>
        </div>
      )}

      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 z-55"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
