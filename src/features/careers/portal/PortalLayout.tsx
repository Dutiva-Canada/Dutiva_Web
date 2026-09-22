import { NavLink, Outlet, Link } from 'react-router-dom'
import { Globe, LogOut } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'
import { useCareersPath } from '@/features/careers/useCareersPath'
import { CandidateAuthPanel } from './CandidateAuthPanel'

/**
 * Layout for the authenticated candidate portal (/careers/portal). Acts as
 * an auth gate: if the visitor is not signed in, the CandidateAuthPanel is
 * rendered instead of the portal chrome. Once signed in, a simple top bar
 * with the Dutiva wordmark, navigation links, and a sign-out button wraps
 * the routed page via <Outlet />.
 */
export function PortalLayout() {
  const { x, L, lang, setLang } = useI18n()
  const { status, signOut } = useAuth()
  const paths = useCareersPath()

  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const label = lang === 'en' ? 'FR' : 'EN'

  if (status !== 'signed-in') {
    return (
      <div className="surface-app flex min-h-[100dvh] flex-col bg-bg text-text">
        <header className="border-b border-border bg-bg-elevated">
          <div className="mx-auto flex max-w-[960px] items-center justify-between gap-[16px] px-[20px] py-3">
            <Link to={paths.board} className="flex items-center gap-2 no-underline">
              <span className="font-display text-lg font-bold text-text">
                Duti<span className="text-gold-strong">va</span>
              </span>
              <span className="text-[0.625rem] font-semibold tracking-[0.28em] text-text-3">
                {x(M.careers_portal_title)}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang(other)}
                className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-control-border bg-bg-elevated px-3 font-sans text-[0.8125rem] font-semibold text-text transition-[border-color] duration-[160ms] ease-in-out hover:border-gold-border"
                aria-label={L('Toggle language', 'Changer de langue')}
              >
                <Globe size={15} aria-hidden="true" />
                {label}
              </button>
              <Link
                to={paths.board}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text no-underline transition-[border-color] hover:border-gold-border"
              >
                {x(M.careers_portal_nav_browse)}
              </Link>
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-[20px] py-[40px]">
          <div className="w-full max-w-[420px]">
            <CandidateAuthPanel />
          </div>
        </main>
      </div>
    )
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-[8px] px-[12px] py-[7px] text-[13px] font-semibold transition-[background,color] duration-150 ${
      isActive
        ? 'bg-surface text-text shadow-[0_1px_3px_rgba(13,27,42,0.10)]'
        : 'text-text-muted hover:text-text-2'
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
              <NavLink to={paths.board} className={navLinkClass}>
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
