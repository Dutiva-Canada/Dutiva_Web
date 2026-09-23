import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { Globe, LogOut, Menu, Settings, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const label = lang === 'en' ? 'FR' : 'EN'

  if (status !== 'signed-in') {
    return (
      <div className="surface-app flex min-h-[100dvh] flex-col bg-bg text-text">
        <header className="border-b border-border bg-bg-elevated">
          <div className="mx-auto flex max-w-[960px] items-center justify-between gap-[16px] px-[20px] py-3">
            <Link to={paths.board} className="flex min-w-0 items-center gap-2 no-underline">
              <span className="shrink-0 font-display text-lg font-bold text-text">
                Duti<span className="text-gold-strong">va</span>
              </span>
              <span className="hidden truncate text-[0.625rem] font-semibold tracking-[0.28em] text-text-3 min-[360px]:inline">
                {x(M.careers_portal_title)}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
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
        <div className="mx-auto flex min-h-[56px] max-w-[960px] items-center justify-between gap-[16px] px-[20px]">
          <div className="flex min-w-0 items-center gap-[24px]">
            <Link
              to="/careers/portal"
              className="shrink-0 font-display text-[17px] font-bold tracking-[-0.01em] text-navy no-underline"
            >
              Dutiva
            </Link>
            <nav className="hidden items-center gap-[3px] rounded-[10px] bg-inset p-[3px] min-[720px]:flex">
              <NavLink to="/careers/portal/profile" className={navLinkClass}>
                {x(M.careers_portal_nav_profile)}
              </NavLink>
              <NavLink to="/careers/portal/applications" className={navLinkClass}>
                {x(M.careers_portal_nav_applications)}
              </NavLink>
              <NavLink to="/careers/portal/ai-tools" className={navLinkClass}>
                {x(M.careers_portal_nav_ai_tools)}
              </NavLink>
              <NavLink to={paths.board} className={navLinkClass}>
                {x(M.careers_portal_nav_browse)}
              </NavLink>
            </nav>
          </div>
          <div className="hidden items-center gap-[8px] min-[720px]:flex">
            <button
              type="button"
              onClick={() => setLang(other)}
              className="inline-flex h-[34px] min-w-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-border bg-transparent px-[10px] text-[12px] font-semibold text-text-2 transition-colors hover:bg-inset"
              aria-label={L('Toggle language', 'Changer de langue')}
            >
              <Globe size={13} aria-hidden="true" />
              {label}
            </button>
            <NavLink
              to="/careers/portal/settings"
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-border text-text-2 no-underline transition-colors hover:bg-inset"
              aria-label={x(M.careers_portal_nav_settings)}
              title={x(M.careers_portal_nav_settings)}
            >
              <Settings size={15} strokeWidth={2} aria-hidden="true" />
            </NavLink>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset"
            >
              <LogOut size={14} strokeWidth={2} aria-hidden="true" />
              {x(M.careers_auth_sign_out)}
            </button>
          </div>
          <div className="flex items-center gap-[8px] min-[720px]:hidden">
            <button
              type="button"
              onClick={() => setLang(other)}
              className="inline-flex h-[34px] min-w-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-border bg-transparent px-[10px] text-[12px] font-semibold text-text-2 transition-colors hover:bg-inset"
              aria-label={L('Toggle language', 'Changer de langue')}
            >
              <Globe size={13} aria-hidden="true" />
              {label}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[8px] border border-border text-text-2 hover:bg-inset"
              aria-expanded={mobileMenuOpen}
              aria-controls="candidate-portal-mobile-nav"
              aria-label={
                mobileMenuOpen
                  ? L('Close navigation', 'Fermer la navigation')
                  : L('Open navigation', 'Ouvrir la navigation')
              }
            >
              {mobileMenuOpen ? (
                <X size={16} aria-hidden="true" />
              ) : (
                <Menu size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav
            id="candidate-portal-mobile-nav"
            className="border-t border-border bg-surface px-[20px] py-[8px] min-[720px]:hidden"
          >
            <div className="flex flex-col gap-[4px]">
              <NavLink
                to="/careers/portal/profile"
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {x(M.careers_portal_nav_profile)}
              </NavLink>
              <NavLink
                to="/careers/portal/applications"
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {x(M.careers_portal_nav_applications)}
              </NavLink>
              <NavLink
                to="/careers/portal/ai-tools"
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {x(M.careers_portal_nav_ai_tools)}
              </NavLink>
              <NavLink
                to={paths.board}
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {x(M.careers_portal_nav_browse)}
              </NavLink>
              <NavLink
                to="/careers/portal/settings"
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {x(M.careers_portal_nav_settings)}
              </NavLink>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex cursor-pointer items-center gap-[6px] rounded-[8px] px-[12px] py-[7px] text-left text-[13px] font-semibold text-text-muted hover:bg-inset hover:text-text-2"
              >
                <LogOut size={14} strokeWidth={2} aria-hidden="true" />
                {x(M.careers_auth_sign_out)}
              </button>
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-[960px] flex-1 px-[20px] py-[32px]">
        <Outlet />
      </main>
    </div>
  )
}
