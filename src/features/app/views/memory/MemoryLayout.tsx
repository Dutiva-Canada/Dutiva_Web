import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Brain, Briefcase, MessageCircle, ShieldCheck, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { employees, memoryCases, memoryPeople, memoryThreads } from '@/data'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import { listFacts } from './productionApi'
import { useMemoryStore } from './memoryStore'

/**
 * Advisor Memory shell (`Advisor Memory.dc.html`): the 252px memory nav
 * (Memory manager · People · Cases · Conversations) with the "Memory is on"
 * governance note, and the active surface in the outlet. The app sidebar and
 * topbar are shared chrome (AppShell); this nav replaces the Advisor thread
 * list within the view, exactly as the prototype swaps them.
 *
 * Production nav lists real employees and cases; conversation links appear
 * only when thread-scoped facts exist (transcripts stay demo-only).
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

function MemoryNav({
  groups,
}: {
  groups: { label: Bi; items: NavEntry[] }[]
}) {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <nav
        aria-label={x(M.memory_nav_aria)}
        className="hidden w-[252px] shrink-0 flex-col overflow-y-auto border-r border-border-soft bg-surface-2 px-[12px] pt-[16px] pb-[20px] md:flex"
      >
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
              const active =
                item.to === '/app/settings/memory' ? pathname === item.to : pathname.startsWith(item.to)
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.to)}
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
        <div className="mt-[16px] rounded-[11px] border border-border-soft bg-surface px-[12px] py-[11px]">
          <div className="mb-[5px] flex items-center gap-[7px]">
            <ShieldCheck size={15} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
            <span className="text-[11.5px] font-bold text-text">{x(M.memory_state_on_title)}</span>
          </div>
          <div className="text-[11px] leading-normal text-text-faint">
            {x(M.memory_state_on_note)}
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  )
}

function MemoryLayoutDemo() {
  const { facts } = useMemoryStore()
  const reviewCount = facts.filter((f) => f.confidence === 'inferred').length
  const personName = (id: string) => employees.find((e) => e.id === id)?.name ?? id

  const groups: { label: Bi; items: NavEntry[] }[] = [
    {
      label: M.memory_nav_memory,
      items: [
        {
          key: 'manager',
          to: '/app/settings/memory',
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
        to: `/app/settings/memory/people/${p.id}`,
        icon: UserRound,
        label: personName(p.id),
        sub: p.navSub,
      })),
    },
    {
      label: M.memory_nav_cases,
      items: memoryCases.map((c) => ({
        key: `case-${c.id}`,
        to: `/app/settings/memory/cases/${c.id}`,
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
        to: `/app/settings/memory/conversations/${t.id}`,
        icon: MessageCircle,
        label: t.navLabel,
        sub: t.navSub,
      })),
    },
  ]

  return <MemoryNav groups={groups} />
}

function MemoryLayoutProduction() {
  const { organizationId } = useWorkspaceMode()
  const [employeesProd, setEmployeesProd] = useState<ProductionEmployee[]>([])
  const [casesProd, setCasesProd] = useState<ProductionCase[]>([])
  const [threadIds, setThreadIds] = useState<string[]>([])
  const [reviewCount, setReviewCount] = useState(0)

  const load = useCallback(async () => {
    if (!organizationId) {
      setEmployeesProd([])
      setCasesProd([])
      setThreadIds([])
      setReviewCount(0)
      return
    }
    try {
      const [emps, cases, facts] = await Promise.all([
        listEmployees(organizationId),
        listCases(organizationId),
        listFacts(organizationId),
      ])
      setEmployeesProd(emps)
      setCasesProd(cases)
      setReviewCount(facts.filter((f) => f.confidence === 'inferred').length)
      const threads = [
        ...new Set(facts.filter((f) => f.scope === 'thread').map((f) => f.entityId)),
      ]
      setThreadIds(threads)
    } catch {
      setEmployeesProd([])
      setCasesProd([])
      setThreadIds([])
      setReviewCount(0)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const groups: { label: Bi; items: NavEntry[] }[] = [
    {
      label: M.memory_nav_memory,
      items: [
        {
          key: 'manager',
          to: '/app/settings/memory',
          icon: Brain,
          label: M.memory_nav_manager,
          sub: M.memory_nav_manager_sub,
          badge: reviewCount > 0 ? { value: String(reviewCount), tone: 'gold' } : undefined,
        },
      ],
    },
    {
      label: M.memory_nav_people,
      items: employeesProd.map((e) => ({
        key: `person-${e.id}`,
        to: `/app/settings/memory/people/${e.id}`,
        icon: UserRound,
        label: e.name,
        sub: e.title ? ({ en: e.title, fr: e.title } as Bi) : undefined,
      })),
    },
    {
      label: M.memory_nav_cases,
      items: casesProd.map((c) => ({
        key: `case-${c.id}`,
        to: `/app/settings/memory/cases/${c.id}`,
        icon: Briefcase,
        label: c.title,
        sub: { en: c.caseType, fr: c.caseType },
      })),
    },
    {
      label: M.memory_nav_conversations,
      items: threadIds.map((id) => ({
        key: `thread-${id}`,
        to: `/app/settings/memory/conversations/${id}`,
        icon: MessageCircle,
        label: id,
      })),
    },
  ]

  return <MemoryNav groups={groups} />
}
