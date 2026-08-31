import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { shellMessages } from '@/i18n/messages/shell'
import { readPref, writePref } from '@/lib/prefs'
import { useEscapeToClose } from '@/lib/escapeStack'
import { SearchOverlay } from '@/features/app/search/SearchOverlay'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { DocStudioOverlay } from '@/features/app/docstudio/DocStudioOverlay'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { Seo } from '@/seo/Seo'
import { Sidebar } from './Sidebar'
import { cx } from './cx'
import { Topbar } from './Topbar'
import { MobileNav, MobileTopbar } from './MobileNav'
import { DemoTourRail } from '@/features/app/demo/DemoTourRail'
import { PublicDemoBanner } from '@/features/app/demo/PublicDemoBanner'
import { WorkspaceContextBanner } from './WorkspaceContextBanner'
import { ModuleContextBanner } from './ModuleContextBanner'
import { moduleLabelFor, viewLabelFor } from './navConfig'

/**
 * Workspace shell — App v2 app frame.
 *
 * - desktop ≥1024px — expanded or compact sidebar, user toggled, persisted.
 * - tablet 768–1023px — compact by default; same toggle + persistence as desktop.
 * - mobile <768px — hamburger topbar, slide-in drawer + scrim, bottom tab nav.
 */
type LayoutMode = 'desktop' | 'tablet' | 'mobile'

const SIDEBAR_EXPANDED_KEY = 'dutiva.sidebar.expanded.v1'

function currentLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(min-width: 1024px)').matches) return 'desktop'
  if (window.matchMedia('(min-width: 768px)').matches) return 'tablet'
  return 'mobile'
}

function readExpandedPref(): boolean {
  return readPref(SIDEBAR_EXPANDED_KEY, 'true') === 'true'
}

function writeExpandedPref(value: boolean): void {
  writePref(SIDEBAR_EXPANDED_KEY, String(value))
}

function useDrawerTransition(open: boolean, duration = 220) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    setEntered(false)
    const timer = window.setTimeout(() => setMounted(false), duration)
    return () => window.clearTimeout(timer)
  }, [open, duration])

  useLayoutEffect(() => {
    if (mounted && open) {
      const reflow = document.body.offsetHeight
      if (reflow >= 0) setEntered(true)
    }
  }, [mounted, open])

  return { mounted, entered }
}

function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(currentLayoutMode)
  useEffect(() => {
    const queries = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(min-width: 768px)'),
    ]
    const update = () => setMode(currentLayoutMode())
    queries.forEach((q) => q.addEventListener('change', update))
    return () => queries.forEach((q) => q.removeEventListener('change', update))
  }, [])
  return mode
}

export function AppShell() {
  const { x } = useI18n()
  const layout = useLayoutMode()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(readExpandedPref)
  const drawerTopbarTriggerRef = useRef<HTMLButtonElement>(null)
  const drawerMoreTriggerRef = useRef<HTMLButtonElement>(null)
  const drawerTriggerSource = useRef<'topbar' | 'more'>('topbar')

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const previousDrawerOpen = useRef(drawerOpen)
  useEffect(() => {
    if (previousDrawerOpen.current && !drawerOpen) {
      const ref =
        drawerTriggerSource.current === 'more' ? drawerMoreTriggerRef : drawerTopbarTriggerRef
      ref.current?.focus()
    }
    previousDrawerOpen.current = drawerOpen
  }, [drawerOpen])

  const openDrawerFrom = useCallback((source: 'topbar' | 'more') => {
    drawerTriggerSource.current = source
    setDrawerOpen(true)
  }, [])

  const isMobile = layout === 'mobile'
  useEscapeToClose(isMobile && drawerOpen, () => setDrawerOpen(false))
  const { mounted: drawerMounted, entered: drawerEntered } = useDrawerTransition(
    isMobile && drawerOpen,
  )

  const { mode: workspaceMode } = useWorkspaceMode()
  const { isPublicDemo } = useWorkspaceRoot()

  useEffect(() => {
    if (isPublicDemo) setSidebarExpanded(false)
  }, [isPublicDemo])

  const title = x(
    workspaceMode === 'production' ? moduleLabelFor(pathname) : viewLabelFor(pathname),
  )

  const toggleSidebarExpanded = useCallback(() => {
    setSidebarExpanded((prev) => {
      const next = !prev
      writeExpandedPref(next)
      return next
    })
  }, [])

  useEffect(() => {
    if (isMobile) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebarExpanded()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobile, toggleSidebarExpanded])

  let sidebarMode: 'drawer' | 'compact' | 'expanded' = 'compact'
  if (isMobile) sidebarMode = 'drawer'
  else if (sidebarExpanded) sidebarMode = 'expanded'

  /* h-dvh, not h-screen: iOS Safari resolves 100vh against the *large*
     viewport — the page as it would be with the browser chrome retracted — so a
     100vh frame with the bottom nav as its last child parks that nav roughly
     100px below the real fold, behind Safari's toolbar. 100dvh tracks the
     visible viewport instead.

     `.landscape-compact` is applied unconditionally: base.css already gates its
     rules behind the matching media query, so CSS decides when it takes effect.
     Deriving it here from a window.innerHeight read during render both went
     stale on rotation and never matched a phone in landscape (which is wide
     enough to leave `isMobile`).

     The top inset is paid once, here, rather than per-component: box-sizing is
     border-box, so the frame still measures exactly 100dvh and its content box
     starts below the status bar — which holds the mobile topbar, the desktop
     topbar and the sidebar clear of it together. Only non-zero in an installed
     PWA (the manifest is `display: standalone`); Safari's own chrome already
     reserves that space when browsing normally. The bottom inset is paid by
     MobileNav, and the horizontal ones by body in base.css — except that
     MobileNav only renders below 768px, so above that the frame pays the
     bottom inset itself. That covers standalone iPads and, more to the point,
     a landscape iPhone: rotating one takes it past 768px, out of `isMobile`
     and away from the nav that would otherwise have paid it. */
  return (
    <div
      className={cx(
        'surface-app landscape-compact flex h-dvh flex-col overflow-hidden bg-bg pt-[env(safe-area-inset-top)] font-sans text-text',
        !isMobile && 'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {isPublicDemo ? <Seo route="demoWorkspace" pageType="WebPage" /> : null}
      {isMobile && (
        <MobileTopbar
          title={title}
          onOpenDrawer={() => openDrawerFrom('topbar')}
          triggerRef={drawerTopbarTriggerRef}
        />
      )}

      <PublicDemoBanner />
      <DemoTourRail />

      <div className="relative flex min-h-0 flex-1">
        {!isMobile && <Sidebar mode={sidebarMode} onToggleExpanded={toggleSidebarExpanded} />}
        {isMobile && drawerMounted && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              className={cx(
                'fixed inset-0 z-60 bg-overlay-scrim transition-opacity duration-220 ease-in-out',
                drawerEntered ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden="true"
            />
            <dialog
              open
              aria-modal="true"
              aria-label={x(shellMessages.shell_primary_nav)}
              className="m-0 h-full w-full max-w-full border-none bg-transparent p-0"
            >
              <Sidebar
                mode="drawer"
                onCloseDrawer={() => setDrawerOpen(false)}
                drawerEntered={drawerEntered}
                focusDrawerClose={drawerEntered}
              />
            </dialog>
          </>
        )}

        {/* No bottom padding to clear the mobile nav: that nav is a sibling
            flex child of the same column, so it already claims its own height
            in normal flow. Reserving 60px here too left a dead band of
            unusable background above it on every app screen. */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-bg">
          {!isMobile && (
            <Topbar
              title={title}
              sidebarExpanded={sidebarExpanded}
              onToggleSidebar={toggleSidebarExpanded}
            />
          )}
          <WorkspaceContextBanner />
          <ModuleContextBanner />
          <div className="relative flex min-h-0 flex-1 flex-col">
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {isMobile && (
        <MobileNav
          drawerOpen={drawerOpen}
          onOpenDrawer={() => openDrawerFrom('more')}
          moreTriggerRef={drawerMoreTriggerRef}
        />
      )}

      <SearchOverlay />
      <AdvisorRail />
      <DocStudioOverlay />
      <ToastHost />
    </div>
  )
}
