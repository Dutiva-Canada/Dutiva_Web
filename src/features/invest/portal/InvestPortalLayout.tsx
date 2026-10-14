import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Contrast, Globe, Loader2, LogOut, Menu, Moon, Settings, Sun, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi, Lang } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useTheme } from '@/lib/themeContext'
import type { ThemePref } from '@/lib/themeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { InvestDataProvider } from '@/features/invest/data/InvestDataProvider'
import { InvestDataContext } from '@/features/invest/data/InvestDataContext'
import { hasInvestAccess } from '@/features/invest/data/api'
import { portalNavKey, viewIntentProps } from '@/app/viewPrefetch'
import { fill } from '@/lib/format'
import { InvestAuthPanel } from './InvestAuthPanel'
import { InvestFooter } from './InvestFooter'
import { readBadgeScope, readHomeTab } from './investPrefs'

const NAV = [
  { to: '/invest', end: true, label: IM.invest_tab_overview },
  { to: '/invest/chat', end: false, label: IM.invest_tab_chat },
  { to: '/invest/portfolio', end: false, label: IM.invest_tab_portfolios },
  { to: '/invest/orders', end: false, label: IM.invest_tab_orders },
  { to: '/invest/signals', end: false, label: IM.invest_tab_signals },
  { to: '/invest/strategies', end: false, label: IM.invest_tab_strategies },
  { to: '/invest/theses', end: false, label: IM.invest_tab_theses },
  { to: '/invest/analysis', end: false, label: IM.invest_tab_analysis },
  { to: '/invest/profile', end: false, label: IM.invest_tab_profile },
] as const

/* Mobile menu shows the icon-nav destinations as text rows too —
   notifications/settings stay in the action row on desktop. */
const MOBILE_EXTRA = [
  { to: '/invest/notifications', label: IM.invest_tab_notifications },
  { to: '/invest/settings', label: IM.invest_tab_settings },
] as const

/* Header theme control — the prototype's Auto → Light → Dark cycle, with a
   toast naming the new scheme in the current language. Auto follows the OS
   via ThemeProvider's matchMedia listener. */
const THEME_CYCLE: Record<ThemePref, ThemePref> = { auto: 'light', light: 'dark', dark: 'auto' }
const THEME_NAME: Record<ThemePref, Bi> = {
  auto: IM.invest_sb_theme_auto,
  light: IM.invest_sb_theme_light,
  dark: IM.invest_sb_theme_dark,
}
const THEME_ICON = { auto: Contrast, light: Sun, dark: Moon } as const

export function ThemeCycleButton({ className }: { className: string }) {
  const { themePref, setTheme } = useTheme()
  const { x } = useI18n()
  const { showToast } = useToasts()
  const Icon = THEME_ICON[themePref]
  return (
    <button
      type="button"
      onClick={() => {
        const next = THEME_CYCLE[themePref]
        setTheme(next)
        showToast({
          en: `${IM.invest_sb_theme_label.en} — ${THEME_NAME[next].en}`,
          fr: `${IM.invest_sb_theme_label.fr} — ${THEME_NAME[next].fr}`,
        })
      }}
      aria-label={`${x(IM.invest_sb_theme_label)} — ${x(THEME_NAME[themePref])}`}
      className={className}
    >
      <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}

/* Reads the shared context — a failed initial load would otherwise render
   every page's empty state as if the book were genuinely empty. */
function LoadErrorNote() {
  const { error, refresh } = useContext(InvestDataContext)
  const { x } = useI18n()
  if (!error) return null
  return (
    <p
      role="alert"
      className="mb-[16px] flex items-center justify-between gap-[12px] rounded-[10px] border border-risk-border bg-risk-soft px-[14px] py-[10px] text-[13px] font-semibold text-risk-fg"
    >
      {x(IM.invest_error_load)}
      <button
        type="button"
        onClick={() => void refresh()}
        className="cursor-pointer rounded-[7px] px-[10px] py-[4px] text-[12px] font-bold hover:bg-risk-border/40"
      >
        {x(IM.invest_chat_retry)}
      </button>
    </p>
  )
}

const NAV_ITEM_BASE =
  'shrink-0 whitespace-nowrap rounded-[8px] px-[12px] py-[7px] text-[13px] font-semibold'
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${NAV_ITEM_BASE} transition-[background,color] duration-150 ${
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
  const location = useLocation()
  const navigate = useNavigate()

  /* Desktop tab strip: iterative fit — render `navCount` tabs (+ More when
     any overflow), then check scrollWidth against the strip's real width
     and drop one tab per layout pass until it fits. The browser reports
     truth; pre-measuring offsetWidths gets corrupted by font timing and
     padding. Widening resets to all tabs and the loop re-shrinks, and the
     whole thing settles synchronously before paint. */
  const navWrapRef = useRef<HTMLElement>(null)
  const moreWrapRef = useRef<HTMLDivElement>(null)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const lastW = useRef(0)
  const [navCount, setNavCount] = useState<number>(NAV.length)
  const [moreOpen, setMoreOpen] = useState(false)
  /* The menu is position:fixed anchored to the button rect — the nav's
     overflow-hidden clip would otherwise hide it entirely. */
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  useLayoutEffect(() => {
    const el = navWrapRef.current
    if (!el) return
    if (el.scrollWidth > el.clientWidth + 1 && navCount > 1) {
      setNavCount(navCount - 1)
    }
  }, [navCount, lang])

  useLayoutEffect(() => {
    setNavCount(NAV.length)
  }, [lang])

  useEffect(() => {
    const el = navWrapRef.current
    if (!el) return
    lastW.current = el.clientWidth
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      if (w > lastW.current + 1) {
        setNavCount(NAV.length)
      } else if (el.scrollWidth > el.clientWidth + 1) {
        setNavCount((c) => Math.max(1, c - 1))
      }
      lastW.current = w
      /* A resize moves every tab — the anchored menu would float detached. */
      setMoreOpen(false)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Close the More menu on outside click / Escape / navigation. */
  useEffect(() => {
    if (!moreOpen) return
    const onDown = (e: MouseEvent) => {
      if (!moreWrapRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false)
        moreBtnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname, navCount])

  const { visibleNav, overflowNav } = useMemo(() => {
    const visible = NAV.slice(0, navCount)
    /* Keep the active tab on the bar — trade the last fitting slot for it
       so the current section is never buried in More. */
    const active = NAV.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
    )
    if (active && !visible.includes(active)) visible[visible.length - 1] = active
    return { visibleNav: visible, overflowNav: NAV.filter((i) => !visible.includes(i)) }
  }, [navCount, location.pathname])

  /* Start-page preference: the FIRST landing on the bare /invest index in
     a session redirects to the preferred tab — sessionStorage keeps it
     once-per-session so navigating to the Overview deliberately afterwards
     stays put. */
  /* Escape closes the mobile menu — keyboard users expect the same
     dismiss as pointer users get from the toggle. */
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (access !== 'yes' || location.pathname !== '/invest') return
    try {
      if (sessionStorage.getItem('dutiva.invest.landed') === '1') return
      sessionStorage.setItem('dutiva.invest.landed', '1')
    } catch {
      /* private mode — still honor the pref, just without the once guard */
    }
    const target = readHomeTab()
    if (target !== '/invest') navigate(target, { replace: true })
  }, [access, location.pathname, navigate])

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
            <div className="flex items-center gap-[8px]">
              <ThemeCycleButton className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[10px] border border-control-border bg-bg-elevated px-3 text-text transition-[border-color] duration-[160ms] ease-in-out hover:border-gold-border" />
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
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-[20px] py-[40px]">
          <div className="w-full max-w-[420px]">
            <InvestAuthPanel />
          </div>
        </main>
        {/* Legal links on the wall too — the routes are public by design. */}
        <InvestFooter />
      </div>
    )
  }

  /* The data provider wraps the whole shell — but only once the grant is
     confirmed, so a user without access never fires invest_* queries (and
     the header badge, which reads the same context, simply renders nothing
     while the check runs). */
  const shell = (
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
              <nav
                ref={navWrapRef}
                className="hidden min-w-0 flex-1 items-center gap-[3px] overflow-hidden rounded-[10px] bg-inset p-[3px] min-[820px]:flex"
              >
                {visibleNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={navLinkClass}
                    {...viewIntentProps(portalNavKey(item.to))}
                  >
                    {x(item.label)}
                  </NavLink>
                ))}
                {overflowNav.length > 0 && (
                  <div ref={moreWrapRef} className="relative shrink-0">
                    <button
                      ref={moreBtnRef}
                      type="button"
                      onClick={() => {
                        if (!moreOpen) {
                          const r = moreBtnRef.current?.getBoundingClientRect()
                          if (r) {
                            setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
                          }
                        }
                        setMoreOpen((o) => !o)
                      }}
                      aria-haspopup="menu"
                      aria-expanded={moreOpen}
                      className={`${NAV_ITEM_BASE} flex cursor-pointer items-center gap-[4px] text-text-muted hover:text-text-2`}
                    >
                      {x(IM.invest_tab_more)}
                      <ChevronDown size={13} aria-hidden="true" />
                    </button>
                    {moreOpen && menuPos && (
                      <div
                        role="menu"
                        aria-label={x(IM.invest_tab_more)}
                        style={{ top: menuPos.top, right: menuPos.right }}
                        className="fixed z-20 min-w-[170px] rounded-[10px] border border-border bg-surface p-[4px] shadow-[0_12px_32px_-12px_rgba(13,27,42,0.30)]"
                      >
                        {overflowNav.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center whitespace-nowrap rounded-[7px] px-[10px] py-[8px] text-[13px] font-semibold no-underline ${
                                isActive
                                  ? 'bg-inset text-text'
                                  : 'text-text-muted hover:bg-inset/60 hover:text-text-2'
                              }`
                            }
                            {...viewIntentProps(portalNavKey(item.to))}
                          >
                            {x(item.label)}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>
            <div className="hidden items-center gap-[8px] min-[820px]:flex">
              <ThemeCycleButton className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-transparent text-text-2 transition-colors hover:bg-inset" />
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
                to="/invest/notifications"
                className="relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-border bg-transparent text-text-2 transition-colors hover:bg-inset"
                aria-label={x(IM.invest_tab_notifications)}
                {...viewIntentProps('invest.notifications')}
              >
                <Bell size={14} strokeWidth={2} aria-hidden="true" />
                <PendingBadge />
                <PendingLabel />
              </NavLink>
              <NavLink
                to="/invest/settings"
                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-border bg-transparent text-text-2 transition-colors hover:bg-inset"
                aria-label={x(IM.invest_tab_settings)}
                {...viewIntentProps('invest.settings')}
              >
                <Settings size={14} strokeWidth={2} aria-hidden="true" />
              </NavLink>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset"
              >
                <LogOut size={14} strokeWidth={2} aria-hidden="true" />
                {x(IM.invest_sign_out)}
              </button>
            </div>
            <div className="flex items-center gap-[8px] min-[820px]:hidden">
              <ThemeCycleButton className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[8px] border border-border text-text-2 hover:bg-inset" />
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
                    {...viewIntentProps(portalNavKey(item.to))}
                  >
                    {x(item.label)}
                  </NavLink>
                ))}
                {MOBILE_EXTRA.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={(p) => `${navLinkClass(p)} flex min-h-[44px] items-center`}
                    onClick={() => setMobileMenuOpen(false)}
                    {...viewIntentProps(portalNavKey(item.to))}
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
            <>
              <LoadErrorNote />
              <Outlet />
            </>
          )}
        </main>
        <InvestFooter />
      </div>
  )

  return access === 'yes' ? <InvestDataProvider>{shell}</InvestDataProvider> : shell
}

/**
 * Unseen-work count on the header bell: new signals + draft proposals
 * (drafts drop out when the badge-scope setting is signals-only).
 * Reads the context directly — it is absent while the access check runs
 * (and for users without a grant), in which case there is nothing to badge.
 */
function PendingBadge() {
  const ctx = useContext(InvestDataContext)
  const signals = ctx ? ctx.state.signals.filter((s) => s.status === 'new').length : 0
  const drafts =
    ctx && readBadgeScope() === 'all'
      ? ctx.state.orders.filter((o) => o.status === 'draft').length
      : 0
  const pending = signals + drafts
  if (pending === 0) return null
  return (
    <span
      aria-hidden="true"
      className="absolute -top-[4px] -right-[4px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gold-fg px-[4px] text-[9.5px] font-bold text-white"
    >
      {pending > 99 ? '99+' : pending}
    </span>
  )
}

/* The dot is aria-hidden — this sr-only twin carries the count to screen
   readers as part of the bell link's accessible name. */
function PendingLabel() {
  const ctx = useContext(InvestDataContext)
  const { x } = useI18n()
  const signals = ctx ? ctx.state.signals.filter((s) => s.status === 'new').length : 0
  const drafts =
    ctx && readBadgeScope() === 'all'
      ? ctx.state.orders.filter((o) => o.status === 'draft').length
      : 0
  const pending = signals + drafts
  if (pending === 0) return null
  return <span className="sr-only"> {fill(x(IM.invest_notif_badge), { n: pending })}</span>
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
