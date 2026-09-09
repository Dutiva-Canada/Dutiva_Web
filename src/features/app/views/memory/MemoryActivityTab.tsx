import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type { MemoryAuditAction } from './memoryStore'
import { useMemoryStore, type MemoryAuditEntry } from './memoryStore'
import { memoryScenarioTodayISO } from '@/data'
import { formatMemoryDate } from './memoryDates'

/**
 * Activity tab — the audit log as a first-class surface. Filter by event
 * type; each entry shows action, actor, timestamp and affected subject
 * metadata. Content of removed restricted memories is not retained (privacy).
 */
const EVENT_FILTERS: { value: MemoryAuditAction | 'all'; label: Bi }[] = [
  { value: 'all', label: M.memory_activity_filter_all },
  { value: 'created', label: M.memory_audit_created },
  { value: 'proposed', label: M.memory_audit_proposed },
  { value: 'confirmed', label: M.memory_audit_confirmed },
  { value: 'rejected', label: M.memory_audit_rejected },
  { value: 'edited', label: M.memory_audit_edited },
  { value: 'removed', label: M.memory_audit_removed },
  { value: 'restored', label: M.memory_audit_restored },
  { value: 'expired', label: M.memory_audit_expired },
  { value: 'exported', label: M.memory_audit_exported },
  { value: 'legal_hold_added', label: M.memory_audit_legal_hold_added },
  { value: 'legal_hold_removed', label: M.memory_audit_legal_hold_removed },
  { value: 'review_requested', label: M.memory_audit_review_requested },
  { value: 'memory_disabled', label: M.memory_audit_memory_disabled },
  { value: 'memory_enabled', label: M.memory_audit_memory_enabled },
]

function actionLabel(action: MemoryAuditAction, lang: Lang): string {
  const map: Record<MemoryAuditAction, keyof typeof M> = {
    created: 'memory_audit_created',
    proposed: 'memory_audit_proposed',
    confirmed: 'memory_audit_confirmed',
    rejected: 'memory_audit_rejected',
    edited: 'memory_audit_edited',
    removed: 'memory_audit_removed',
    restored: 'memory_audit_restored',
    expired: 'memory_audit_expired',
    exported: 'memory_audit_exported',
    legal_hold_added: 'memory_audit_legal_hold_added',
    legal_hold_removed: 'memory_audit_legal_hold_removed',
    review_requested: 'memory_audit_review_requested',
    memory_disabled: 'memory_audit_memory_disabled',
    memory_enabled: 'memory_audit_memory_enabled',
  }
  return pick(M[map[action]], lang)
}

const selectClass =
  'rounded-[9px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12.5px] text-text outline-none'

export function MemoryActivityTab() {
  const { x, lang } = useI18n()
  const { audit } = useMemoryStore()
  const todayISO = memoryScenarioTodayISO
  const [event, setEvent] = useState<MemoryAuditAction | 'all'>('all')

  const filtered = useMemo(
    () => (event === 'all' ? audit : audit.filter((a) => a.action === event)),
    [audit, event],
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1000px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        <div className="mb-[10px] flex flex-wrap items-center gap-[8px]">
          <label className="sr-only" htmlFor="mem-activity-filter">{x(M.memory_activity_event)}</label>
          <select
            id="mem-activity-filter"
            value={event}
            onChange={(e) => setEvent(e.target.value as MemoryAuditAction | 'all')}
            className={selectClass}
          >
            {EVENT_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {pick(o.label, lang)}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-text-faint">{x(M.memory_activity_note)}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[14px] border border-border-soft bg-surface px-[24px] py-[40px] text-center text-[13px] text-text-faint">
            {x(M.memory_activity_empty)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-soft text-[11px] font-bold tracking-wider text-text-faint uppercase">
                  <th scope="col" className="px-[14px] py-[9px]">{x(M.memory_activity_event)}</th>
                  <th scope="col" className="px-[14px] py-[9px]">{x(M.memory_activity_actor)}</th>
                  <th scope="col" className="px-[14px] py-[9px]">{x(M.memory_row_subject)}</th>
                  <th scope="col" className="px-[14px] py-[9px] hidden md:table-cell">{x(M.memory_activity_when)}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry: MemoryAuditEntry) => (
                  <tr key={entry.id} className="border-t border-inset align-top">
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-2">
                      <span className="font-semibold">{actionLabel(entry.action, lang)}</span>
                      {entry.statement != null && (
                        <div className="mt-[2px] text-[12px] text-text-faint">“{pickL(entry.statement, lang)}”</div>
                      )}
                      {entry.statement == null && entry.sensitive && (
                        <div className="mt-[2px] text-[12px] italic text-text-faint">{x(M.memory_activity_redacted)}</div>
                      )}
                    </td>
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-muted">{entry.actor}</td>
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-muted">
                      {entry.subjectLabel != null ? pick(entry.subjectLabel, lang) : '—'}
                    </td>
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-faint hidden md:table-cell">
                      {formatMemoryDate(entry.timestamp, lang, todayISO)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
