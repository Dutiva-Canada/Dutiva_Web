import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { readPref, writePref } from '@/lib/prefs'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useProductionNavBadges } from '@/features/app/workspaceMode/useProductionNavBadges'
import type { NavGroup, NavItem } from './navConfig'
import { NAV_GROUPS, isNavActive } from './navConfig'
import { cx } from './cx'
import { SidebarCollapseButton } from './SidebarCollapseButton'
import { SidebarCreateMenu } from './SidebarCreateMenu'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarSearch } from './SidebarSearch'
import { SidebarSection } from './SidebarSection'

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

const EXPANDED_WIDTH = 'w-[292px]'
const COMPACT_WIDTH = 'w-[64px]'

function readSectionPrefs(): Record<SectionKey, boolean> {
  try {
    const raw = readPref(SECTION_PREFS_KEY, '')
    if (!raw) return DEFAULT_SECTIONS
    const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>
    return { ...DEFAULT_SECTIONS, ...parsed }
  } catch {
    return DEFAULT_SECTIONS
  }
}

function writeSectionPrefs(state: Record<SectionKey, boolean>): void {
  try {
    writePref(SECTION_PREFS_KEY, JSON.stringify(state))
  } catch {
    /* best effort */
  }
}

function activeGroupIndex(pathname: string): number | null {
  for (let i = 0; i < NAV_GROUPS.length; i += 1) {
    const group = NAV_GROUPS[i]
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
  const { identity, mode: workspaceMode } = useWorkspaceMode()
  const productionBadges = useProductionNavBadges()
  const expanded = mode === 'expanded' || mode === 'drawer'

  const [sections, setSections] = useState<Record<SectionKey, boolean>>(readSectionPrefs)
  const activeGroup = useMemo(() => activeGroupIndex(pathname), [pathname])

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
          <SidebarCreateMenu expanded={expanded} onNavigate={onCloseDrawer} />
          <SidebarSearch expanded={expanded} />
        </div>
      </div>

      <nav
        aria-label={x(M.shell_primary_nav)}
        data-rail-scroll
        className={cx(
          'flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-2',
          !expanded && 'no-scrollbar',
        )}
      >
        {NAV_GROUPS.map((group, i) => {
          const isLast = i === NAV_GROUPS.length - 1
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
          const key = SECTION_KEYS[i - 1]
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
