import { useState } from 'react'
import {
  Briefcase,
  Clock,
  FileText,
  History,
  Lightbulb,
  MessageCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { cases, employees, memoryThreads } from '@/data'
import type { MemoryFact, MemoryScope } from '@/data'
import { MemoryFactRow } from './MemoryFactRow'
import { MemoryManagerProductionView } from './MemoryManagerProductionView'
import { exportMemoryRecord } from './exportMemoryRecord'
import { useMemoryStore } from './memoryStore'

/**
 * Memory manager (`Advisor Memory.dc.html` MANAGER surface): the inferred-
 * review banner, filter tabs with live counts, memory search, the governed
 * rows with scope tags, and the governance rail (retention, lawful basis,
 * audit log, export / forget-everything).
 *
 * Production mode uses MemoryManagerProductionView (hr_advisor_memory_facts).
 */

type ManagerFilter = 'all' | 'people' | 'cases' | 'threads' | 'review'

const FILTER_SCOPE: Partial<Record<ManagerFilter, MemoryScope>> = {
  people: 'person',
  cases: 'case',
  threads: 'thread',
}

export function MemoryManagerView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <MemoryManagerProductionView />
  return <MemoryManagerDemoView />
}

function MemoryManagerDemoView() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { session } = useAuth()
  const { identity } = useWorkspaceMode()
  const { facts, audit } = useMemoryStore()
  const [filter, setFilter] = useState<ManagerFilter>('all')
  const [query, setQuery] = useState('')

  const counts: Record<ManagerFilter, number> = {
    all: facts.length,
    people: facts.filter((f) => f.scope === 'person').length,
    cases: facts.filter((f) => f.scope === 'case').length,
    threads: facts.filter((f) => f.scope === 'thread').length,
    review: facts.filter((f) => f.confidence === 'inferred').length,
  }

  const q = query.trim().toLowerCase()
  const filtered = facts
    .filter((f) =>
      filter === 'review'
        ? f.confidence === 'inferred'
        : (FILTER_SCOPE[filter] ?? f.scope) === f.scope,
    )
    .filter(
      (f) =>
        q.length === 0 ||
        pickL(f.statement, 'en').toLowerCase().includes(q) ||
        pickL(f.statement, 'fr').toLowerCase().includes(q),
    )

  const tabs: { key: ManagerFilter; label: Bi }[] = [
    { key: 'all', label: M.memory_mgr_tab_all },
    { key: 'people', label: M.memory_nav_people },
    { key: 'cases', label: M.memory_nav_cases },
    { key: 'threads', label: M.memory_nav_conversations },
    { key: 'review', label: M.memory_mgr_tab_review },
  ]

  const scopeTag = (fact: MemoryFact) => {
    if (fact.scope === 'person') {
      const name = employees.find((e) => e.id === fact.entityId)?.name ?? fact.entityId
      return { icon: UserRound, label: `${pick(M.memory_mgr_scope_person, lang)} · ${name}` }
    }
    if (fact.scope === 'case') {
      const title = cases.find((c) => c.id === fact.entityId)?.title
      return {
        icon: Briefcase,
        label: `${pick(M.memory_mgr_scope_case, lang)} · ${title ? pick(title, lang) : fact.entityId}`,
      }
    }
    const thread = memoryThreads.find((t) => t.id === fact.entityId)
    return {
      icon: MessageCircle,
      label: `${pick(M.memory_mgr_scope_thread, lang)} · ${thread ? pick(thread.navLabel, lang) : fact.entityId}`,
    }
  }

  /* Export the governed record as JSON (access/portability request) —
     through the export-protection pipeline like every other export: velocity
     guard + audit trail, and an `_export` provenance manifest in the file
     itself (the JSON equivalent of the document watermark; the invisible tag
     rides inside the notice string, where it survives re-serialization). */
  const exportRecord = async () => {
    const result = await exportMemoryRecord({
      facts,
      lang,
      actorLabel: `${identity.user.name} (${identity.user.email})`,
      workspaceLabel: identity.companyName,
      session,
    })
    if (!result.ok) {
      showToast(result.denial, 'info')
      return
    }
    showToast(M.memory_mgr_export_toast, 'ok')
  }

  const auditActionLabel: Record<string, Bi> = {
    confirm: M.memory_mgr_audit_confirm,
    correct: M.memory_mgr_audit_correct,
    forget: M.memory_mgr_audit_forget,
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1160px] px-[16px] pt-[22px] pb-[40px] md:px-[28px]">
        <div className="flex flex-wrap items-start gap-[22px]">
          <div className="min-w-[300px] flex-1">
            {/* Review banner */}
            {counts.review > 0 && (
              <div className="mb-[16px] flex items-start gap-[12px] rounded-[13px] border border-gold-border bg-gold-bg px-[16px] py-[13px]">
                <Lightbulb
                  size={15}
                  strokeWidth={1.7}
                  className="mt-[2px] shrink-0 text-gold-fg"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold text-text">
                    {counts.review}{' '}
                    {x(
                      counts.review === 1
                        ? M.memory_mgr_review_waiting_one
                        : M.memory_mgr_review_waiting_many,
                    )}
                  </div>
                  <div className="text-[12px] leading-normal text-text-muted">
                    {x(M.memory_mgr_review_note)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFilter('review')}
                  className="shrink-0 cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12px] font-bold text-gold-fg"
                >
                  {x(M.memory_mgr_review_now)}
                </button>
              </div>
            )}

            {/* Filter tabs + search */}
            <div className="mb-[14px] flex flex-wrap items-center gap-[10px]">
              <div className="flex flex-wrap gap-[7px]" role="tablist">
                {tabs.map((tab) => {
                  const active = filter === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(tab.key)}
                      className={`inline-flex cursor-pointer items-center gap-[7px] rounded-[100px] border px-[13px] py-[6px] font-sans text-[12.5px] font-bold ${
                        active
                          ? 'border-navy bg-navy text-white'
                          : 'border-border bg-surface text-text-muted'
                      }`}
                    >
                      {pick(tab.label, lang)}
                      <span
                        className={`inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-[100px] px-[4px] text-[10px] font-extrabold ${
                          active ? 'bg-white/15 text-white' : 'bg-inset text-text-faint'
                        }`}
                      >
                        {counts[tab.key]}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex-1" />
              <div className="flex min-w-[170px] items-center gap-[8px] rounded-[9px] border border-border bg-surface px-[11px] py-[7px]">
                <Search
                  size={14}
                  strokeWidth={1.7}
                  className="text-text-faint"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={x(M.memory_mgr_search)}
                  className="min-w-0 flex-1 border-none bg-transparent font-sans text-[12.5px] text-text outline-none"
                />
              </div>
            </div>

            {/* Governed rows */}
            <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
              {filtered.map((fact) => (
                <MemoryFactRow key={fact.id} fact={fact} scopeTag={scopeTag(fact)} />
              ))}
              {filtered.length === 0 && (
                <div className="px-[20px] py-[30px] text-center text-[13px] text-text-faint">
                  {x(M.memory_mgr_empty)}
                </div>
              )}
            </div>
          </div>

          {/* Governance rail */}
          <aside className="flex w-full flex-none flex-col gap-[14px] lg:w-[316px]">
            <div className="rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]">
              <div className="mb-[9px] flex items-center gap-[7px]">
                <Clock size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
                <div className="text-[12.5px] font-bold text-text">
                  {x(M.memory_mgr_retention_title)}
                </div>
              </div>
              <ul className="m-0 list-disc pl-[16px] text-[11.5px] leading-[1.65] text-text-muted">
                <li>{x(M.memory_rail_retention_employment)}</li>
                <li>{x(M.memory_rail_retention_case)}</li>
                <li>{x(M.memory_rail_retention_thread)}</li>
                <li>{x(M.memory_rail_retention_wellbeing)}</li>
              </ul>
            </div>

            <div className="rounded-[13px] border border-support-border bg-support-bg px-[15px] py-[14px]">
              <div className="mb-[8px] flex items-center gap-[7px]">
                <ShieldCheck
                  size={15}
                  strokeWidth={1.7}
                  className="text-support-fg"
                  aria-hidden="true"
                />
                <div className="text-[12.5px] font-bold text-support-fg">
                  {x(M.memory_mgr_lawful_title)}
                </div>
              </div>
              <div className="text-[11.5px] leading-[1.55] text-support-text">
                {x(M.memory_mgr_lawful_note)}
              </div>
            </div>

            <div className="rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]">
              <div className="mb-[9px] flex items-center gap-[7px]">
                <History
                  size={14}
                  strokeWidth={1.7}
                  className="text-text-muted"
                  aria-hidden="true"
                />
                <div className="text-[12.5px] font-bold text-text">
                  {x(M.memory_mgr_audit_title)}
                </div>
              </div>
              <div className="mb-[9px] text-[11.5px] leading-normal text-text-muted">
                {x(M.memory_mgr_audit_note)}
              </div>
              <div className="border-l-2 border-border-soft pl-[10px] text-[11px] leading-normal text-text-faint">
                {audit.map((entry) => (
                  <div key={`${entry.action}-${pickL(entry.statement, 'en')}`} className="mb-[5px]">
                    {x(M.memory_mgr_audit_today)} — Riley{' '}
                    {pick(auditActionLabel[entry.action]!, lang)} “{pickL(entry.statement, lang)}”.
                  </div>
                ))}
                <div className="mb-[5px]">{x(M.memory_mgr_audit_seed_resume)}</div>
                <div>{x(M.memory_mgr_audit_seed_added)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <button
                type="button"
                onClick={() => void exportRecord()}
                className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-border bg-surface p-[10px] font-sans text-[12.5px] font-bold text-text-2"
              >
                <FileText size={14} strokeWidth={1.7} aria-hidden="true" />
                {x(M.memory_mgr_export)}
              </button>
              <button
                type="button"
                onClick={() => showToast(M.memory_mgr_forget_person_toast, 'info')}
                className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-risk-border bg-surface p-[10px] font-sans text-[12.5px] font-bold text-risk-dot"
              >
                <Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />
                {x(M.memory_mgr_forget_person)}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
