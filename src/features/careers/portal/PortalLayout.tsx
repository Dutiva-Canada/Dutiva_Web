import { NavLink, Outlet, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'
import { CandidateAuthPanel } from './CandidateAuthPanel'

/**
 * Layout for the authenticated candidate portal (/careers/portal). Acts as
 * an auth gate: if the visitor is not signed in, the CandidateAuthPanel is
 * rendered instead of the portal chrome. Once signed in, a simple top bar
 * with the Dutiva wordmark, navigation links, and a sign-out button wraps
 * the routed page via <Outlet />.
 */
export function PortalLayout() {
  const { x } = useI18n()
  const { status, signOut } = useAuth()

  if (status !== 'signed-in') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-[20px] py-[40px]">
        <div className="w-full max-w-[420px]">
          <CandidateAuthPanel />
        </div>
      </div>
    )
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-[8px] px-[12px] py-[7px] text-[13px] font-semibold transition-[background,color] duration-150 ${
      isActive ? 'bg-surface text-text shadow-[0_1px_3px_rgba(13,27,42,0.10)]' : 'text-text-muted hover:text-text-2'
    }`

  return (
    <div className="surface-app flex min-h-[100dvh] flex-col bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex h-[56px] max-w-[960px] items-center justify-between gap-[16px] px-[20px]">
          <div className="flex items-center gap-[24px]">
            <Link
              to="/careers/portal"
              className="font-display text-[17px] font-bold tracking-[-0.01em] text-navy no-underline"
            >
              Dutiva
            </Link>
            <nav className="flex items-center gap-[3px] rounded-[10px] bg-inset p-[3px]">
              <NavLink to="/careers/portal/profile" className={navLinkClass}>
                {x(M.careers_portal_nav_profile)}
              </NavLink>
              <NavLink to="/careers/portal/applications" className={navLinkClass}>
                {x(M.careers_portal_nav_applications)}
              </NavLink>
              <NavLink to="/careers" className={navLinkClass}>
                {x(M.careers_portal_nav_browse)}
              </NavLink>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset"
          >
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.careers_auth_sign_out)}
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[960px] flex-1 px-[20px] py-[32px]">
        <Outlet />
      </main>
    </div>
  )
}
