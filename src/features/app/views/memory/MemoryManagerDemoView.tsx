import { useState } from 'react'
import { Brain, Plus, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { useMemoryStore } from './memoryStore'
import { MemoryMemoriesTab } from './MemoryMemoriesTab'
import { MemoryReviewTab } from './MemoryReviewTab'
import { MemoryActivityTab } from './MemoryActivityTab'
import { MemoryGovernanceTab } from './MemoryGovernanceTab'
import { AddMemoryDialog } from './AddMemoryDialog'

/**
 * Advisor Memory workspace (demo) — the four primary tabs: Memories, Review
 * queue, Activity, Governance. The redundant internal left-side nav is gone;
 * this surface uses the full content width after the global application
 * sidebar. People / Cases / Conversations are not peer tabs — they are
 * memory subjects and sources, reachable from the details drawer.
 *
 * Production mode uses MemoryManagerProductionView (hr_advisor_memory_facts).
 */
type MemoryTab = 'memories' | 'review' | 'activity' | 'governance'

const TABS: { key: MemoryTab; label: Bi }[] = [
  { key: 'memories', label: M.memory_tab_memories },
  { key: 'review', label: M.memory_tab_review },
  { key: 'activity', label: M.memory_tab_activity },
  { key: 'governance', label: M.memory_tab_governance },
]

export function MemoryManagerDemoView() {
  const { x, lang } = useI18n()
  const { memoryEnabled, facts } = useMemoryStore()
  const [tab, setTab] = useState<MemoryTab>('memories')
  const [addOpen, setAddOpen] = useState(false)

  const reviewCount = facts.filter((f) => {
    const s = f.status ?? (f.confidence === 'confirmed' ? 'confirmed' : 'proposed')
    return s === 'proposed' || s === 'needs_review'
  }).length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border-soft bg-surface-2 px-[16px] pt-[18px] md:px-[24px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-start justify-between gap-[12px]">
            <div className="min-w-0">
              <div className="flex items-center gap-[8px]">
                <Brain size={18} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
                <h1 className="m-0 font-display text-[20px] font-semibold tracking-[-0.01em] text-text">
                  {x(M.memory_title)}
                </h1>
              </div>
              <p className="m-0 mt-[4px] max-w-[640px] text-[13px] leading-normal text-text-muted">
                {x(M.memory_ws_subtitle)}
              </p>
            </div>
            <div className="flex items-center gap-[8px]">
              <span
                className={`inline-flex items-center gap-[5px] rounded-[100px] border px-[9px] py-[3px] text-[11px] font-bold ${
                  memoryEnabled
                    ? 'border-ok-border bg-ok-bg text-ok-fg'
                    : 'border-border bg-inset text-text-muted'
                }`}
              >
                <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
                {memoryEnabled ? x(M.memory_ws_enabled) : x(M.memory_ws_disabled)}
              </span>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex cursor-pointer items-center gap-[6px] rounded-[9px] border-none bg-navy px-[13px] py-[8px] font-sans text-[13px] font-bold text-white"
              >
                <Plus size={15} strokeWidth={2} aria-hidden="true" />
                {x(M.memory_ws_add)}
              </button>
            </div>
          </div>

          {!memoryEnabled && (
            <p className="mt-[8px] text-[12px] leading-normal text-text-faint">{x(M.memory_ws_disabled_note)}</p>
          )}

          {/* Tab navigation */}
          <div className="mt-[14px] flex gap-[2px] overflow-x-auto" role="tablist" aria-label={x(M.memory_tabs_aria)}>
            {TABS.map((t) => {
              const active = tab === t.key
              const badge = t.key === 'review' && reviewCount > 0 ? reviewCount : null
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`mem-tabpanel-${t.key}`}
                  id={`mem-tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-[7px] border-b-2 px-[14px] py-[9px] font-sans text-[13px] font-semibold ${
                    active
                      ? 'border-gold-fg text-text'
                      : 'border-transparent text-text-muted hover:text-text-2'
                  }`}
                >
                  {pick(t.label, lang)}
                  {badge != null && (
                    <span className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-[100px] bg-gold-bg px-[5px] text-[10px] font-extrabold text-gold-fg">
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab panel */}
      <div
        id={`mem-tabpanel-${tab}`}
        role="tabpanel"
        aria-labelledby={`mem-tab-${tab}`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {tab === 'memories' && (
          <MemoryMemoriesTab
            onAddMemory={() => setAddOpen(true)}
            onGoToReview={() => setTab('review')}
            onGoToGovernance={() => setTab('governance')}
          />
        )}
        {tab === 'review' && <MemoryReviewTab />}
        {tab === 'activity' && <MemoryActivityTab />}
        {tab === 'governance' && <MemoryGovernanceTab />}
      </div>

      <AddMemoryDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
