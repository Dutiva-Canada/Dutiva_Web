import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import {
  Briefcase,
  Clock,
  FileText,
  History,
  Lightbulb,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import type { MemoryCategory, MemoryFact, MemoryScope } from '@/data'
import { MemoryFactRow } from './MemoryFactRow'
import { exportMemoryRecord } from './exportMemoryRecord'
import {
  confirmFact,
  correctFact,
  createFact,
  forgetFact,
  forgetFactsForEntity,
  listAudit,
  listFacts,
} from './productionApi'
import type { ProductionMemoryAuditEntry } from './productionApi'

/**
 * Memory manager in production — org facts from hr_advisor_memory_facts
 * (migration 0086). Demo keeps MemoryManagerView + memoryStore.
 */

type ManagerFilter = 'all' | 'people' | 'cases' | 'threads' | 'review'

const FILTER_SCOPE: Partial<Record<ManagerFilter, MemoryScope>> = {
  people: 'person',
  cases: 'case',
  threads: 'thread',
}

const CATEGORIES: MemoryCategory[] = [
  'employment',
  'compensation',
  'matter',
  'record',
  'note',
  'case',
  'conversation',
]

const CATEGORY_LABEL: Record<MemoryCategory, Bi> = {
  employment: M.memory_prod_cat_employment,
  compensation: M.memory_prod_cat_compensation,
  matter: M.memory_prod_cat_matter,
  record: M.memory_prod_cat_record,
  note: M.memory_prod_cat_note,
  case: M.memory_prod_cat_case,
  conversation: M.memory_prod_cat_conversation,
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function MemoryManagerProductionView() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { session } = useAuth()
  const { organizationId, isOrgAdmin, identity } = useWorkspaceMode()

  const [facts, setFacts] = useState<MemoryFact[] | null>(null)
  const [audit, setAudit] = useState<ProductionMemoryAuditEntry[]>([])
  const [employees, setEmployees] = useState<ProductionEmployee[]>([])
  const [cases, setCases] = useState<ProductionCase[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [filter, setFilter] = useState<ManagerFilter>('all')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employeeId: '',
    category: 'note' as MemoryCategory,
    statementEn: '',
    statementFr: '',
  })
  const [forgetPersonId, setForgetPersonId] = useState('')
  const [forgetting, setForgetting] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      const [factRows, auditRows, empRows, caseRows] = await Promise.all([
        listFacts(organizationId),
        listAudit(organizationId),
        listEmployees(organizationId),
        listCases(organizationId),
      ])
      setFacts(factRows)
      setAudit(auditRows)
      setEmployees(empRows)
      setCases(caseRows)
    } catch {
      setFacts([])
      setAudit([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.memory_prod_empty_title)} />
  }

  const rows = facts ?? []
  const counts: Record<ManagerFilter, number> = {
    all: rows.length,
    people: rows.filter((f) => f.scope === 'person').length,
    cases: rows.filter((f) => f.scope === 'case').length,
    threads: rows.filter((f) => f.scope === 'thread').length,
    review: rows.filter((f) => f.confidence === 'inferred').length,
  }

  const q = query.trim().toLowerCase()
  const filtered = rows
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
        label: `${pick(M.memory_mgr_scope_case, lang)} · ${title ?? fact.entityId}`,
      }
    }
    return {
      icon: MessageCircle,
      label: `${pick(M.memory_mgr_scope_thread, lang)} · ${fact.entityId}`,
    }
  }

  const onConfirm = async (id: string) => {
    try {
      const updated = await confirmFact(organizationId, id)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
      setAudit(await listAudit(organizationId))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }

  const onCorrect = async (id: string, statement: string) => {
    try {
      const updated = await correctFact(organizationId, id, statement)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
      setAudit(await listAudit(organizationId))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }

  const onForget = async (id: string) => {
    try {
      await forgetFact(organizationId, id)
      setFacts((prev) => (prev ?? []).filter((f) => f.id !== id))
      setAudit(await listAudit(organizationId))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }

  const personIdsWithFacts = [
    ...new Set(rows.filter((f) => f.scope === 'person').map((f) => f.entityId)),
  ]
  const peopleWithFacts = employees.filter((e) => personIdsWithFacts.includes(e.id))

  const onBulkForgetPerson = async () => {
    if (!forgetPersonId || forgetting || !isOrgAdmin) return
    if (!window.confirm(pick(M.memory_prod_forget_person_confirm, lang))) return
    const targetId = forgetPersonId
    const name = employees.find((e) => e.id === targetId)?.name ?? targetId
    setForgetting(true)
    try {
      const n = await forgetFactsForEntity(organizationId, 'person', targetId)
      setFacts((prev) =>
        (prev ?? []).filter((f) => !(f.scope === 'person' && f.entityId === targetId)),
      )
      setAudit(await listAudit(organizationId))
      setForgetPersonId('')
      showToast(
        {
          en: `Forgot ${n} memor${n === 1 ? 'y' : 'ies'} for ${name}.`,
          fr: `${n} mémoire${n === 1 ? '' : 's'} oubliée${n === 1 ? '' : 's'} pour ${name}.`,
        },
        'ok',
      )
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    } finally {
      setForgetting(false)
    }
  }

  const exportRecord = async () => {
    const result = await exportMemoryRecord({
      facts: rows,
      audit,
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

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.employeeId || !form.statementEn.trim() || saving) return
    setSaving(true)
    try {
      const added = await createFact(organizationId, {
        scope: 'person',
        entityId: form.employeeId,
        category: form.category,
        statementEn: form.statementEn.trim(),
        statementFr: form.statementFr.trim() || form.statementEn.trim(),
      })
      setFacts((prev) => [added, ...(prev ?? [])])
      setAudit(await listAudit(organizationId))
      setForm({ employeeId: '', category: 'note', statementEn: '', statementFr: '' })
      setFormOpen(false)
      showToast(M.memory_prod_added, 'ok')
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const auditActionLabel: Record<string, Bi> = {
    confirm: M.memory_mgr_audit_confirm,
    correct: M.memory_mgr_audit_correct,
    forget: M.memory_mgr_audit_forget,
    create: M.memory_prod_added,
  }

  if (facts === null) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-[28px] pt-[28px] text-[13px] text-text-faint">
        …
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1160px] px-[16px] pt-[22px] pb-[40px] md:px-[28px]">
        {loadFailed && (
          <div className="mb-[14px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[10px] text-[13px] text-risk-dot">
            {x(M.memory_prod_load_failed)}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-[22px]">
          <div className="min-w-[300px] flex-1">
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
              {isOrgAdmin && (
                <button
                  type="button"
                  onClick={() => setFormOpen((o) => !o)}
                  className="flex cursor-pointer items-center gap-[6px] rounded-[9px] border-none bg-navy px-[12px] py-[8px] font-sans text-[12.5px] font-bold text-white"
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  {x(M.memory_prod_add)}
                </button>
              )}
            </div>

            {formOpen && isOrgAdmin && (
              <form
                onSubmit={(e) => void onSubmit(e)}
                className="mb-[14px] rounded-[14px] border border-border-soft bg-surface px-[16px] py-[14px]"
              >
                {employees.length === 0 ? (
                  <p className="m-0 text-[13px] text-text-muted">{x(M.memory_prod_no_people)}</p>
                ) : (
                  <div className="grid gap-[12px] md:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="mem-prod-person">
                        {x(M.memory_prod_person)}
                      </label>
                      <select
                        id="mem-prod-person"
                        value={form.employeeId}
                        onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                        className={inputClass}
                        required
                      >
                        <option value="">{x(M.memory_prod_select_person)}</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="mem-prod-cat">
                        {x(M.memory_prod_category)}
                      </label>
                      <select
                        id="mem-prod-cat"
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value as MemoryCategory }))
                        }
                        className={inputClass}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {pick(CATEGORY_LABEL[c], lang)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="mem-prod-en">
                        {x(M.memory_prod_statement_en)}
                      </label>
                      <input
                        id="mem-prod-en"
                        value={form.statementEn}
                        onChange={(e) => setForm((f) => ({ ...f, statementEn: e.target.value }))}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="mem-prod-fr">
                        {x(M.memory_prod_statement_fr)}
                      </label>
                      <input
                        id="mem-prod-fr"
                        value={form.statementFr}
                        onChange={(e) => setForm((f) => ({ ...f, statementFr: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="cursor-pointer rounded-[9px] border-none bg-navy px-[14px] py-[9px] font-sans text-[13px] font-bold text-white disabled:opacity-60"
                      >
                        {x(M.memory_prod_save_fact)}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
              {filtered.map((fact) => (
                <MemoryFactRow
                  key={fact.id}
                  fact={fact}
                  scopeTag={scopeTag(fact)}
                  onConfirm={(id) => void onConfirm(id)}
                  onCorrect={(id, s) => void onCorrect(id, s)}
                  onForget={(id) => void onForget(id)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="px-[20px] py-[30px] text-center text-[13px] text-text-faint">
                  {rows.length === 0 ? x(M.memory_prod_empty_body) : x(M.memory_mgr_empty)}
                </div>
              )}
            </div>
            <Disclaimer className="mt-[16px]" />
          </div>

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
                {audit.length === 0 && <div>{x(M.memory_prod_audit_empty)}</div>}
                {audit.map((entry) => (
                  <div key={entry.id} className="mb-[5px]">
                    {new Date(entry.createdAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')} —{' '}
                    {pick(auditActionLabel[entry.action] ?? M.memory_mgr_audit_confirm, lang)} “
                    {pickL(entry.statement, lang)}”.
                  </div>
                ))}
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
            </div>

            {isOrgAdmin && (
              <div className="rounded-[13px] border border-risk-border bg-surface px-[15px] py-[14px]">
                <div className="mb-[8px] flex items-center gap-[7px]">
                  <Trash2
                    size={14}
                    strokeWidth={1.7}
                    className="text-risk-dot"
                    aria-hidden="true"
                  />
                  <div className="text-[12.5px] font-bold text-risk-dot">
                    {x(M.memory_mgr_forget_person)}
                  </div>
                </div>
                <div className="mb-[10px] text-[11.5px] leading-[1.55] text-text-muted">
                  {x(M.memory_prod_forget_person_hint)}
                </div>
                {peopleWithFacts.length === 0 ? (
                  <div className="text-[12px] text-text-faint">{x(M.memory_prod_forget_person_none)}</div>
                ) : (
                  <div className="flex flex-col gap-[8px]">
                    <select
                      value={forgetPersonId}
                      onChange={(e) => setForgetPersonId(e.target.value)}
                      className={inputClass}
                      aria-label={x(M.memory_mgr_forget_person)}
                    >
                      <option value="">{x(M.memory_prod_forget_person_select)}</option>
                      {peopleWithFacts.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!forgetPersonId || forgetting}
                      onClick={() => void onBulkForgetPerson()}
                      className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-risk-border bg-surface p-[10px] font-sans text-[12.5px] font-bold text-risk-dot disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />
                      {x(M.memory_mgr_forget_person)}
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
