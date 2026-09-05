import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  useWorkspaceNavigate,
  useWorkspaceRoot,
  workspacePath,
  type WorkspaceRoot,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import {
  Brain,
  Briefcase,
  ChevronDown,
  List,
  MessageCircle,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { shellMessages as SM } from '@/i18n/messages/shell'
import { employees, demoTodayISO, memoryCases, memoryPeople, memoryThreads } from '@/data'
import { formatMemoryResumedSub } from './memoryDates'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import { listFacts } from './productionApi'
import { listOwnConversations } from './conversationsApi'
import { useMemoryStore } from './memoryStore'
import { useMdUp } from '@/lib/useMediaQuery'

/**
 * Advisor Memory shell (`Advisor Memory.dc.html`): the 252px memory nav
 * (Memory manager · People · Cases · Conversations) with the "Memory is on"
 * governance note, and the active surface in the outlet. The app sidebar and
 * topbar are shared chrome (AppShell); this nav replaces the Advisor thread
 * list within the view, exactly as the prototype swaps them.
 *
 * Production nav lists people/cases/conversations that already have facts
 * (plus the active entity). Full chat history stays in Advisor.
 */

interface NavEntry {
  key: string
  to: string
  icon: LucideIcon
  label: Bi | string
  sub?: Bi
  badge?: { value: string; tone: 'gold' | 'risk' }
}

export function MemoryLayout() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <MemoryLayoutProduction />
  return <MemoryLayoutDemo />
}

function isNavActive(pathname: string, to: string, root: WorkspaceRoot): boolean {
  return to === workspacePath(root, 'settings/memory') ? pathname === to : pathname.startsWith(to)
}

function activeNavLabel(
  groups: { label: Bi; items: NavEntry[] }[],
  pathname: string,
  lang: 'en' | 'fr',
  root: WorkspaceRoot,
): string {
  for (const group of groups) {
    for (const item of group.items) {
      if (isNavActive(pathname, item.to, root)) {
        return typeof item.label === 'string' ? item.label : pick(item.label, lang)
      }
    }
  }
  return pick(M.memory_nav_manager, lang)
}

function MemoryNavPanel({
  groups,
  onNavigate,
}: {
  groups: { label: Bi; items: NavEntry[] }[]
  onNavigate?: (to: string) => void
}) {
  const { x, lang } = useI18n()
  const navigate = useWorkspaceNavigate()
  const { root } = useWorkspaceRoot()
  const { pathname } = useLocation()

  const go = (to: string) => {
    navigate(to)
    onNavigate?.(to)
  }

  return (
    <>
      <div className="flex items-center gap-[8px] px-[8px] pt-[2px] pb-[12px]">
        <Brain size={18} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
        <span className="font-display text-[15px] font-semibold text-text">
          {x(M.memory_title)}
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.label.en}>
          <div className="px-[8px] pt-[12px] pb-[5px] text-[10.5px] font-bold tracking-[0.07em] text-text-faint uppercase">
            {pick(group.label, lang)}
          </div>
          {group.items.map((item) => {
            const active = isNavActive(pathname, item.to, root)
            const Icon = item.icon
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.to)}
                aria-current={active ? 'page' : undefined}
                className={`my-px flex w-full cursor-pointer items-center gap-[9px] rounded-[9px] px-[10px] py-[8px] text-left font-sans text-[13px] ${
                  active
                    ? 'border border-border-soft bg-surface font-semibold text-text shadow-sm'
                    : 'border border-transparent bg-transparent font-medium text-text-2'
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={1.7}
                  className="shrink-0 opacity-85"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {typeof item.label === 'string' ? item.label : pick(item.label, lang)}
                  </span>
                  {item.sub && (
                    <span className="block overflow-hidden text-[11px] font-normal text-ellipsis whitespace-nowrap text-text-faint">
                      {pick(item.sub, lang)}
                    </span>
                  )}
                </span>
                {item.badge && (
                  <span
                    className={`flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[100px] px-[5px] text-[10.5px] font-extrabold ${
                      item.badge.tone === 'risk'
                        ? 'bg-risk-bg text-risk-fg'
                        : 'bg-gold-bg text-gold-fg'
                    }`}
                  >
                    {item.badge.value}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      <div className="flex-1" />
      <button
        type="button"
        onClick={() => go(workspacePath(root, 'settings'))}
        className="mb-[10px] w-full cursor-pointer rounded-[9px] border border-transparent bg-transparent px-[10px] py-[8px] text-left font-sans text-[12.5px] font-semibold text-text-muted hover:bg-surface hover:text-text-2"
      >
        {x(SM.shell_settings_general)}
      </button>
      <div className="mt-[6px] rounded-[11px] border border-border-soft bg-surface px-[12px] py-[11px]">
        <div className="mb-[5px] flex items-center gap-[7px]">
          <ShieldCheck size={15} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
          <span className="text-[11.5px] font-bold text-text">{x(M.memory_state_on_title)}</span>
        </div>
        <div className="text-[11px] leading-normal text-text-faint">
          {x(M.memory_state_on_note)}
        </div>
      </div>
    </>
  )
}

function MemoryMobileNavAccess({ groups }: { groups: { label: Bi; items: NavEntry[] }[] }) {
  const { x, lang } = useI18n()
  const { root } = useWorkspaceRoot()
  const { pathname } = useLocation()
  const mdUp = useMdUp()
  const [open, setOpen] = useState(false)
  const currentLabel = activeNavLabel(groups, pathname, lang, root)

  if (mdUp) return null

  return (
    <>
      <div className="shrink-0 border-b border-border-soft bg-surface px-[12px] py-[8px] md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={x(M.memory_open_nav)}
          className="flex min-h-[44px] w-full cursor-pointer items-center gap-[8px] rounded-[8px] border border-border-soft bg-surface-2 px-[12px] py-[8px] text-left font-sans text-[13px] font-semibold text-text"
        >
          <List
            size={16}
            strokeWidth={1.8}
            className="shrink-0 text-text-muted"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {currentLabel}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className="shrink-0 text-text-muted"
            aria-hidden="true"
          />
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={x(M.memory_nav_aria)}
          className="fixed inset-0 z-80 flex flex-col bg-surface-2 md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-[14px] py-[10px]">
            <h2 className="m-0 font-display text-[16px] font-semibold text-text">
              {x(M.memory_title)}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={x(SM.shell_close_menu)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-inset text-text-2"
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <nav
            aria-label={x(M.memory_nav_aria)}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[12px] pt-[16px] pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <MemoryNavPanel groups={groups} onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      ) : null}
    </>
  )
}

function MemoryNav({ groups }: { groups: { label: Bi; items: NavEntry[] }[] }) {
  const { x } = useI18n()
  const mdUp = useMdUp()

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
      <MemoryMobileNavAccess groups={groups} />
      {mdUp ? (
        <nav
          aria-label={x(M.memory_nav_aria)}
          className="flex w-[252px] shrink-0 flex-col overflow-y-auto border-r border-border-soft bg-surface-2 px-[12px] pt-[16px] pb-[20px]"
        >
          <MemoryNavPanel groups={groups} />
        </nav>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

function MemoryLayoutDemo() {
  const { root } = useWorkspaceRoot()
  const { facts } = useMemoryStore()
  const reviewCount = facts.filter((f) => f.confidence === 'inferred').length
  const personName = (id: string) => employees.find((e) => e.id === id)?.name ?? id

  const groups: { label: Bi; items: NavEntry[] }[] = [
    {
      label: M.memory_nav_memory,
      items: [
        {
          key: 'manager',
          to: workspacePath(root, 'settings/memory'),
          icon: Brain,
          label: M.memory_nav_manager,
          sub: M.memory_nav_manager_sub,
          badge: reviewCount > 0 ? { value: String(reviewCount), tone: 'gold' } : undefined,
        },
      ],
    },
    {
      label: M.memory_nav_people,
      items: memoryPeople.map((p) => ({
        key: `person-${p.id}`,
        to: workspacePath(root, `settings/memory/people/${p.id}`),
        icon: UserRound,
        label: personName(p.id),
        sub: p.navSub,
      })),
    },
    {
      label: M.memory_nav_cases,
      items: memoryCases.map((c) => ({
        key: `case-${c.id}`,
        to: workspacePath(root, `settings/memory/cases/${c.id}`),
        icon: Briefcase,
        label: c.navLabel,
        sub: c.navSub,
        badge: c.id === 'case1' ? { value: '!', tone: 'risk' } : undefined,
      })),
    },
    {
      label: M.memory_nav_conversations,
      items: memoryThreads.map((t) => ({
        key: `thread-${t.id}`,
        to: workspacePath(root, `settings/memory/conversations/${t.id}`),
        icon: MessageCircle,
        label: t.navLabel,
        sub: formatMemoryResumedSub(t.resumedAt, demoTodayISO),
      })),
    },
  ]

  return <MemoryNav groups={groups} />
}

function MemoryLayoutProduction() {
  const { root } = useWorkspaceRoot()
  const { organizationId } = useWorkspaceMode()
  const { pathname } = useLocation()
  const [employeesProd, setEmployeesProd] = useState<ProductionEmployee[]>([])
  const [casesProd, setCasesProd] = useState<ProductionCase[]>([])
  const [threadNav, setThreadNav] = useState<{ id: string; label: string }[]>([])
  const [personIdsWithFacts, setPersonIdsWithFacts] = useState<Set<string>>(new Set())
  const [caseIdsWithFacts, setCaseIdsWithFacts] = useState<Set<string>>(new Set())
  const [reviewCount, setReviewCount] = useState(0)

  const load = useCallback(async () => {
    if (!organizationId) {
      setEmployeesProd([])
      setCasesProd([])
      setThreadNav([])
      setPersonIdsWithFacts(new Set())
      setCaseIdsWithFacts(new Set())
      setReviewCount(0)
      return
    }
    try {
      const [emps, cases, facts, conversations] = await Promise.all([
        listEmployees(organizationId),
        listCases(organizationId),
        listFacts(organizationId),
        listOwnConversations(12).catch(() => []),
      ])
      setEmployeesProd(emps)
      setCasesProd(cases)
      setReviewCount(facts.filter((f) => f.confidence === 'inferred').length)
      setPersonIdsWithFacts(
        new Set(facts.filter((f) => f.scope === 'person').map((f) => f.entityId)),
      )
      setCaseIdsWithFacts(new Set(facts.filter((f) => f.scope === 'case').map((f) => f.entityId)))
      /* Same rule as People/Cases: only threads that already have facts — not
         every Advisor chat (those belong in Advisor). Labels come from the
         conversation list when available. */
      const threadIdsWithFacts = [
        ...new Set(facts.filter((f) => f.scope === 'thread').map((f) => f.entityId)),
      ]
      setThreadNav(
        threadIdsWithFacts.map((id) => {
          const conv = conversations.find((c) => c.id === id)
          const preview = conv?.messages.find((m) => m.role === 'user')?.content?.slice(0, 40)
          return { id, label: preview && preview.length > 0 ? preview : id.slice(0, 8) }
        }),
      )
    } catch {
      setEmployeesProd([])
      setCasesProd([])
      setThreadNav([])
      setPersonIdsWithFacts(new Set())
      setCaseIdsWithFacts(new Set())
      setReviewCount(0)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const activePersonId = pathname.match(/\/memory\/people\/([^/]+)/)?.[1]
  const activeCaseId = pathname.match(/\/memory\/cases\/([^/]+)/)?.[1]
  const activeThreadId = pathname.match(/\/memory\/conversations\/([^/]+)/)?.[1]

  const peopleNav = employeesProd.filter(
    (e) => personIdsWithFacts.has(e.id) || e.id === activePersonId,
  )
  const casesNav = casesProd.filter((c) => caseIdsWithFacts.has(c.id) || c.id === activeCaseId)
  const conversationsNav =
    activeThreadId && !threadNav.some((t) => t.id === activeThreadId)
      ? [...threadNav, { id: activeThreadId, label: activeThreadId.slice(0, 8) }]
      : threadNav

  const allGroups: { label: Bi; items: NavEntry[] }[] = [
    {
      label: M.memory_nav_memory,
      items: [
        {
          key: 'manager',
          to: workspacePath(root, 'settings/memory'),
          icon: Brain,
          label: M.memory_nav_manager,
          sub: M.memory_nav_manager_sub,
          badge: reviewCount > 0 ? { value: String(reviewCount), tone: 'gold' as const } : undefined,
        },
      ],
    },
    {
      label: M.memory_nav_people,
      items: peopleNav.map((e) => ({
        key: `person-${e.id}`,
        to: workspacePath(root, `settings/memory/people/${e.id}`),
        icon: UserRound,
        label: e.name,
        sub: e.title ? ({ en: e.title, fr: e.title } as Bi) : undefined,
      })),
    },
    {
      label: M.memory_nav_cases,
      items: casesNav.map((c) => ({
        key: `case-${c.id}`,
        to: workspacePath(root, `settings/memory/cases/${c.id}`),
        icon: Briefcase,
        label: c.title,
        sub: { en: c.caseType, fr: c.caseType },
      })),
    },
    {
      label: M.memory_nav_conversations,
      items: conversationsNav.map((t) => ({
        key: `thread-${t.id}`,
        to: workspacePath(root, `settings/memory/conversations/${t.id}`),
        icon: MessageCircle,
        label: t.label,
      })),
    },
  ]
  const groups = allGroups.filter(
    (group) => group.label === M.memory_nav_memory || group.items.length > 0,
  )

  return <MemoryNav groups={groups} />
}
