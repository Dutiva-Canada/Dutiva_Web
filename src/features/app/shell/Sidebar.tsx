import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import { readPref, writePref } from '@/lib/prefs'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useProductionNavBadges } from '@/features/app/workspaceMode/useProductionNavBadges'
import type { NavGroup, NavItem } from './navConfig'
import { getNavGroups, getPublicDemoNavGroups, isNavActive } from './navConfig'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { cx } from './cx'
import { SidebarCollapseButton } from './SidebarCollapseButton'
import { SidebarCreateMenu } from './SidebarCreateMenu'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarSearch } from './SidebarSearch'
import { SidebarSection } from './SidebarSection'
import { useProductionWorkspaceEmpty } from './useProductionWorkspaceEmpty'

export type SidebarMode = 'expanded' | 'compact' | 'drawer'

/* Collapsible section keys, positionally aligned with NAV_GROUPS: group i
   with a heading maps to SECTION_KEYS[i - 1]. Heading-less groups (the
   workspace trio, Analytics) render as always-visible top-level items.
   'insights' is gone with the section — a stale key in the stored prefs is
   simply ignored. */
const SECTION_KEYS = ['records', 'programs'] as const
type SectionKey = (typeof SECTION_KEYS)[number]

const SECTION_PREFS_KEY = 'dutiva.sidebar.sections.v1'
const DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  records: true,
  programs: true,
}
/** Empty production: keep Records open, collapse Programs until the user opens them. */
const EMPTY_DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  records: true,
  programs: false,
}

const EXPANDED_WIDTH = 'w-[292px]'
const COMPACT_WIDTH = 'w-[64px]'

function readSectionPrefs(emptyWorkspace: boolean): Record<SectionKey, boolean> {
  const defaults = emptyWorkspace ? EMPTY_DEFAULT_SECTIONS : DEFAULT_SECTIONS
  try {
    const raw = readPref(SECTION_PREFS_KEY, '')
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

function writeSectionPrefs(state: Record<SectionKey, boolean>): void {
  try {
    writePref(SECTION_PREFS_KEY, JSON.stringify(state))
  } catch {
    /* best effort */
  }
}

function activeGroupIndex(pathname: string, groups: NavGroup[]): number | null {
  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i]
    if (!group?.heading) continue
    for (const item of group.items) {
      if (item.isActive ? item.isActive(pathname) : isNavActive(item.to, pathname)) {
        return i
      }
    }
  }
  return null
}

function isActiveItem(item: NavItem, pathname: string): boolean {
  return item.isActive ? item.isActive(pathname) : isNavActive(item.to, pathname)
}

function sidebarClasses(mode: SidebarMode, drawerEntered: boolean) {
  const expanded = mode === 'expanded' || mode === 'drawer'
  return cx(
    'flex h-full shrink-0 flex-col border-r border-border bg-inset',
    expanded ? EXPANDED_WIDTH : COMPACT_WIDTH,
    mode === 'compact' && 'relative z-1',
    /* The drawer is viewport-positioned, so it escapes the safe-area padding
       body and AppShell apply to the in-flow tree and has to pay its own
       insets. Left, not right: it is flush to the left edge. */
    mode === 'drawer' &&
      'fixed top-0 bottom-0 left-0 z-70 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] shadow-[8px_0_30px_rgba(0,0,0,0.15)] transition-transform duration-220 ease-in-out',
    mode === 'drawer' && (drawerEntered ? 'translate-x-0' : '-translate-x-full'),
  )
}

interface SidebarProps {
  readonly mode: SidebarMode
  readonly onCloseDrawer?: () => void
  readonly drawerEntered?: boolean
  readonly onToggleExpanded?: () => void
}

export function Sidebar({
  mode,
  onCloseDrawer,
  drawerEntered = true,
  onToggleExpanded,
}: SidebarProps) {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const { root, isPublicDemo, readOnly } = useWorkspaceRoot()
  const { identity, mode: workspaceMode } = useWorkspaceMode()
  const navGroups = useMemo(
    () => (isPublicDemo ? getPublicDemoNavGroups(root) : getNavGroups(root)),
    [isPublicDemo, root],
  )
  const productionBadges = useProductionNavBadges()
  const workspaceEmpty = useProductionWorkspaceEmpty()
  const expanded = mode === 'expanded' || mode === 'drawer'
  const onHome = pathname === `${root}/home` || pathname.startsWith(`${root}/home/`)

  const [sections, setSections] = useState<Record<SectionKey, boolean>>(() =>
    readSectionPrefs(false),
  )
  const activeGroup = useMemo(() => activeGroupIndex(pathname, navGroups), [pathname, navGroups])

  /* Once we know the workspace is empty and the user has never stored section
     prefs, collapse Programs so the rail fits without a heavy scroll. */
  useEffect(() => {
    if (!workspaceEmpty) return
    if (readPref(SECTION_PREFS_KEY, '')) return
    setSections(EMPTY_DEFAULT_SECTIONS)
  }, [workspaceEmpty])

  const toggleSection = useCallback((key: SectionKey) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      writeSectionPrefs(next)
      return next
    })
  }, [])

  const effectiveSections = useMemo(() => {
    const next = { ...sections }
    if (activeGroup !== null) {
      const key = SECTION_KEYS[activeGroup - 1]
      if (key) next[key] = true
    }
    return next
  }, [sections, activeGroup])

  useEffect(() => {
    if (mode !== 'drawer') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const aside = document.querySelector('aside[aria-label]')
      if (!aside) return
      const focusables = Array.from(
        aside.querySelectorAll<HTMLElement>('a, button, input, select, textarea'),
      ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true')
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables.at(-1)
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  const renderGroupItems = (group: NavGroup) =>
    group.items.map((item) => {
      const itemWithBadge =
        workspaceMode === 'production' ? { ...item, badge: productionBadges[item.key] } : item
      return (
        <SidebarNavItem
          key={item.key}
          item={itemWithBadge}
          expanded={expanded}
          active={isActiveItem(item, pathname)}
          onClick={onCloseDrawer}
        />
      )
    })

  return (
    <aside aria-label={x(M.shell_primary_nav)} className={sidebarClasses(mode, drawerEntered)}>
      <div className="flex shrink-0 flex-col px-2.5 pb-2 pt-2">
        <SidebarHeader
          expanded={expanded}
          inDrawer={mode === 'drawer'}
          identity={identity}
          onCloseDrawer={onCloseDrawer}
        />
        <div className={cx('flex gap-2', expanded ? 'flex-col' : 'flex-col items-center')}>
          {!readOnly ? <SidebarCreateMenu expanded={expanded} onNavigate={onCloseDrawer} /> : null}
          <SidebarSearch expanded={expanded} />
        </div>
        {expanded && workspaceEmpty && onHome && !isPublicDemo && (
          <Link
            to={`${root}/home`}
            onClick={onCloseDrawer}
            className="mt-2 flex items-start gap-2 rounded-[9px] border border-border-soft bg-surface px-2.5 py-2 text-left hover:border-(--accent-soft-border)"
          >
            <ListChecks
              size={15}
              strokeWidth={1.8}
              className="mt-px shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-text">
                {x(M.shell_getting_started)}
              </span>
              <span className="mt-0.5 block text-[11px] leading-[1.35] text-text-muted">
                {x(M.shell_getting_started_hint)}
              </span>
            </span>
          </Link>
        )}
      </div>

      <nav
        aria-label={x(M.shell_primary_nav)}
        data-rail-scroll
        className={cx(
          'flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-2',
          expanded ? 'rail-scroll' : 'no-scrollbar',
        )}
      >
        {navGroups.map((group, i) => {
          const isLast = i === navGroups.length - 1
          const key = group.heading ? SECTION_KEYS[i - 1] : null
          /* Compact + empty: hide Programs icons so the rail stays scannable;
             expanded still shows the collapsed section heading. */
          if (
            !expanded &&
            workspaceEmpty &&
            key === 'programs' &&
            !effectiveSections.programs
          ) {
            return null
          }
          if (group.heading === null) {
            return (
              <div key={group.items[0]?.key ?? i} className="flex flex-col">
                <div className="flex flex-col">{renderGroupItems(group)}</div>
                {!expanded && !isLast && (
                  <div className="my-2 border-t border-border-soft" aria-hidden="true" />
                )}
              </div>
            )
          }
          if (!key || !group.heading) return null
          const heading = x(group.heading)
          return (
            <div key={key} className="flex flex-col">
              <SidebarSection
                id={key}
                heading={heading}
                expanded={expanded}
                open={!!effectiveSections[key]}
                onToggle={() => toggleSection(key)}
              >
                {renderGroupItems(group)}
              </SidebarSection>
              {!expanded && !isLast && (
                <div className="my-2 border-t border-border-soft" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </nav>

      <div className="flex shrink-0 flex-col border-t border-border-soft px-2.5 pt-2 pb-2.5">
        {mode !== 'drawer' && onToggleExpanded && (
          <SidebarCollapseButton expanded={expanded} onToggle={onToggleExpanded} />
        )}
        <SidebarFooter expanded={expanded} identity={identity} onNavigate={onCloseDrawer} />
      </div>
    </aside>
  )
}
