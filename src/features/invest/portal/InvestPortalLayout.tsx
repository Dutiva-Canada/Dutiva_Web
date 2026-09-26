import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Globe, Loader2, LogOut, Menu, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useAuth } from '@/features/app/auth/authContext'
import { InvestDataProvider } from '@/features/invest/data/InvestDataProvider'
import { hasInvestAccess } from '@/features/invest/data/api'
import { InvestAuthPanel } from './InvestAuthPanel'

const NAV = [
  { to: '/invest', end: true, label: IM.invest_tab_overview },
  { to: '/invest/portfolio', end: false, label: IM.invest_tab_portfolios },
  { to: '/invest/orders', end: false, label: IM.invest_tab_orders },
  { to: '/invest/signals', end: false, label: IM.invest_tab_signals },
  { to: '/invest/strategies', end: false, label: IM.invest_tab_strategies },
] as const

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-[8px] px-[12px] py-[7px] text-[13px] font-semibold transition-[background,color] duration-150 ${
    isActive
      ? 'bg-surface text-text shadow-[0_1px_3px_rgba(13,27,42,0.10)]'
      : 'text-text-muted hover:text-text-2'
  }`

/**
 * Layout for the standalone invest portal (/invest). Two gates: shared auth
 * (same email-code flow as the candidate portal), then the invest_access
 * grant — a signed-in user without a row sees a localized "access required"
 * card instead of the app. No demo mode; everything is real user data.
 */
export function InvestPortalLayout() {
  const { x, L, lang, setLang } = useI18n()
  const { status, signOut } = useAuth()
  const [access, setAccess] = useState<'checking' | 'yes' | 'no'>('checking')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const label = lang === 'en' ? 'FR' : 'EN'

  useEffect(() => {
    if (status !== 'signed-in') {
      setAccess('checking')
      return
    }
    let cancelled = false
    setAccess('checking')
    void hasInvestAccess()
      .then((ok) => {
        if (!cancelled) setAccess(ok ? 'yes' : 'no')
      })
      .catch(() => {
        if (!cancelled) setAccess('no')
      })
    return () => {
      cancelled = true
    }
  }, [status])

  if (status !== 'signed-in') {
    return (
      <div className="surface-app flex min-h-[100dvh] flex-col bg-bg text-text">
        <header className="border-b border-border bg-bg-elevated">
          <div className="mx-auto flex max-w-[960px] items-center justify-between gap-[16px] px-[20px] py-3">
            <span className="shrink-0 font-display text-lg font-bold text-text">
              Duti<span className="text-gold-strong">va</span>{' '}
              <span className="hidden text-[0.625rem] font-semibold tracking-[0.28em] text-text-3 min-[360px]:inline">
                {x(IM.invest_portal_title)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setLang(other)}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-control-border bg-bg-elevated px-3 font-sans text-[0.8125rem] font-semibold text-text transition-[border-color] duration-[160ms] ease-in-out hover:border-gold-border"
              aria-label={L('Toggle language', 'Changer de langue')}
            >
              <Globe size={15} aria-hidden="true" />
              {label}
            </button>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-[20px] py-[40px]">
          <div className="w-full max-w-[420px]">
            <InvestAuthPanel />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="surface-app flex min-h-[100dvh] flex-col bg-bg text-text">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex min-h-[56px] max-w-[1100px] items-center justify-between gap-[16px] px-[20px]">
          <div className="flex min-w-0 items-center gap-[24px]">
            <NavLink
              to="/invest"
              className="shrink-0 font-display text-[17px] font-bold tracking-[-0.01em] text-navy no-underline"
            >
              {x(IM.invest_portal_title)}
            </NavLink>
            <nav className="hidden items-center gap-[3px] rounded-[10px] bg-inset p-[3px] min-[820px]:flex">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {x(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-[8px] min-[820px]:flex">
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
              onClick={() => void signOut()}
              className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset"
            >
              <LogOut size={14} strokeWidth={2} aria-hidden="true" />
              {x(IM.invest_sign_out)}
            </button>
          </div>
          <div className="flex items-center gap-[8px] min-[820px]:hidden">
            <button
              type="button"
              onClick={() => setLang(other)}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-border bg-transparent px-[10px] text-[12px] font-semibold text-text-2 transition-colors hover:bg-inset"
              aria-label={L('Toggle language', 'Changer de langue')}
            >
              <Globe size={13} aria-hidden="true" />
              {label}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[8px] border border-border text-text-2 hover:bg-inset"
              aria-expanded={mobileMenuOpen}
              aria-controls="invest-portal-mobile-nav"
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
            id="invest-portal-mobile-nav"
            className="border-t border-border bg-surface px-[20px] py-[8px] min-[820px]:hidden"
          >
            <div className="flex flex-col gap-[4px]">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={(p) => `${navLinkClass(p)} flex min-h-[44px] items-center`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {x(item.label)}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[8px] px-[12px] py-[7px] text-left text-[13px] font-semibold text-text-muted hover:bg-inset hover:text-text-2"
              >
                <LogOut size={14} strokeWidth={2} aria-hidden="true" />
                {x(IM.invest_sign_out)}
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-[20px] py-[32px]">
        {access === 'checking' ? (
          <div className="flex items-center justify-center py-[80px]">
            <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
          </div>
        ) : access === 'no' ? (
          <AccessRequired />
        ) : (
          <InvestDataProvider>
            <Outlet />
          </InvestDataProvider>
        )}
      </main>
    </div>
  )
}

function AccessRequired() {
  const { x } = useI18n()
  return (
    <div className="mx-auto max-w-[420px] rounded-[18px] border border-border bg-surface p-[28px] text-center shadow-[0_20px_50px_-24px_rgba(13,27,42,0.35)]">
      <h1 className="m-0 font-display text-[20px] font-semibold text-text">
        {x(IM.invest_access_title)}
      </h1>
      <p className="m-0 mt-[8px] text-[13.5px] leading-[1.55] text-text-3">
        {x(IM.invest_access_body)}
      </p>
      <a
        href="mailto:support@dutiva.ca?subject=Dutiva%20Invest%20access"
        className="mt-[18px] inline-flex h-[42px] cursor-pointer items-center justify-center rounded-[11px] border-none bg-navy px-[18px] text-[14px] font-semibold text-white no-underline transition-opacity"
      >
        {x(IM.invest_access_contact)}
      </a>
    </div>
  )
}
