import { useCallback, useEffect, useMemo, useState } from 'react'
import { Brain, Plus, ShieldCheck, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useAuth } from '@/features/app/auth/authContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { usePlan } from '@/features/app/billing/planContext'
import { hasPlanFeature } from '@/features/app/billing/planAccess'
import { PLAN_FEATURE_GATES_ENABLED, hasActiveSubscription } from '@/config/plans'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import type { MemoryCategory, MemoryFact, MemoryScope } from '@/data'
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
import { addLegalHold, markForReview, rejectFact, removeLegalHold } from './productionLifecycleApi'
import { effectiveStatus } from './memoryModel'
import {
  ProductionActivityTab,
  ProductionGovernanceTab,
  ProductionMemoriesTab,
  ProductionReviewTab,
} from './MemoryProductionTabs'

/**
 * Advisor Memory workspace in production — org facts from
 * `hr_advisor_memory_facts` (migrations 0086 + 0155). Uses the same four-tab
 * IA as the demo view (Memories / Review queue / Activity / Governance).
 *
 * Backend boundary: migration 0086 persisted the original fact columns
 * (scope, entity, category, statement, confidence, source, learned/confirmed
 * dates, visibility, sensitive, soft-forget). Migration 0155 added the
 * governance columns (status, classification, sensitivity, retention,
 * legal hold, Advisor-usable, purpose, jurisdiction, provenance, retrieval
 * scope). The production API now persists and retrieves those fields.
 * The memory-enabled toggle and auto-proposals setting remain frontend-only
 * session state until a future migration adds org-level settings.
 */

type MemoryTab = 'memories' | 'review' | 'activity' | 'governance'

const TABS: { key: MemoryTab; label: Bi }[] = [
  { key: 'memories', label: M.memory_tab_memories },
  { key: 'review', label: M.memory_tab_review },
  { key: 'activity', label: M.memory_tab_activity },
  { key: 'governance', label: M.memory_tab_governance },
]

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
  const { organizationId, identity } = useWorkspaceMode()
  const { plan, subscriptionStatus, isAdmin: isBillingAdmin } = usePlan()

  const injectionLocked =
    PLAN_FEATURE_GATES_ENABLED &&
    !isBillingAdmin &&
    !(
      hasPlanFeature(plan, 'advisor_cross_record_memory') &&
      hasActiveSubscription(subscriptionStatus)
    )

  const [tab, setTab] = useState<MemoryTab>('memories')
  const [facts, setFacts] = useState<MemoryFact[] | null>(null)
  const [audit, setAudit] = useState<ProductionMemoryAuditEntry[]>([])
  const [employees, setEmployees] = useState<ProductionEmployee[]>([])
  const [cases, setCases] = useState<ProductionCase[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<MemoryScope | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employeeId: '',
    caseId: '',
    scope: 'person' as MemoryScope,
    category: 'note' as MemoryCategory,
    statementEn: '',
    statementFr: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [forgetPersonId, setForgetPersonId] = useState('')
  const [forgetting, setForgetting] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)

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

  const personNames = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name])),
    [employees],
  )
  const caseTitles = useMemo(
    () => Object.fromEntries(cases.map((c) => [c.id, c.title])),
    [cases],
  )

  const subjectLabel = (fact: MemoryFact): string => {
    if (fact.scope === 'person') return personNames[fact.entityId] ?? fact.entityId
    if (fact.scope === 'case') return caseTitles[fact.entityId] ?? fact.entityId
    return fact.entityId
  }
  const subjectHref = (fact: MemoryFact): string | null => {
    if (fact.scope === 'person') return `/app/settings/memory/people/${fact.entityId}`
    if (fact.scope === 'case') return `/app/settings/memory/cases/${fact.entityId}`
    return `/app/settings/memory/conversations/${fact.entityId}`
  }

  const rows = facts ?? []
  const active = rows.filter((f) => effectiveStatus(f) !== 'removed')
  const proposed = active.filter((f) => effectiveStatus(f) === 'proposed')
  const q = query.trim().toLowerCase()
  const filtered = active
    .filter((f) => (subjectFilter === 'all' ? true : f.scope === subjectFilter))
    .filter(
      (f) =>
        q.length === 0 ||
        pickL(f.statement, 'en').toLowerCase().includes(q) ||
        pickL(f.statement, 'fr').toLowerCase().includes(q) ||
        subjectLabel(f).toLowerCase().includes(q),
    )

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId || saving) return
    const entityId = form.scope === 'person' ? form.employeeId : form.scope === 'case' ? form.caseId : ''
    if (!entityId || !form.statementEn.trim()) return
    setSaving(true)
    try {
      await createFact(organizationId, {
        scope: form.scope,
        entityId,
        category: form.category,
        statementEn: form.statementEn.trim(),
        statementFr: form.statementFr.trim() || form.statementEn.trim(),
        confidence: 'confirmed',
        sourceType: 'manual',
        sourceDetailEn: 'Manual entry',
        sourceDetailFr: 'Saisie manuelle',
        visibility: 'hr',
        sensitive: false,
      })
      setForm({ employeeId: '', caseId: '', scope: 'person', category: 'note', statementEn: '', statementFr: '' })
      setFormOpen(false)
      await load()
      showToast(M.memory_add_toast, 'ok')
    } catch {
      showToast(M.memory_prod_error, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onConfirm = async (id: string) => {
    if (!organizationId) return
    try {
      await confirmFact(organizationId, id)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onCorrect = async (id: string, statement: string) => {
    if (!organizationId) return
    try {
      await correctFact(organizationId, id, statement)
      setEditId(null)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onForget = async (id: string) => {
    if (!organizationId) return
    try {
      await forgetFact(organizationId, id)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onMarkForReview = async (id: string) => {
    if (!organizationId) return
    try {
      await markForReview(organizationId, id)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onReject = async (id: string) => {
    if (!organizationId) return
    try {
      await rejectFact(organizationId, id)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onAddLegalHold = async (id: string, reasonEn: string, reasonFr: string) => {
    if (!organizationId) return
    try {
      await addLegalHold(organizationId, id, reasonEn, reasonFr, identity.user.name)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onRemoveLegalHold = async (id: string) => {
    if (!organizationId) return
    try {
      await removeLegalHold(organizationId, id)
      await load()
    } catch {
      showToast(M.memory_prod_error, 'info')
    }
  }

  const onBulkForgetPerson = async () => {
    if (!organizationId || !forgetPersonId || forgetting) return
    const name = personNames[forgetPersonId] ?? forgetPersonId
    const count = active.filter((f) => f.scope === 'person' && f.entityId === forgetPersonId).length
    if (count === 0) return
    const tmpl = count === 1 ? M.memory_gov_data_remove_person_confirm_one : M.memory_gov_data_remove_person_confirm_many
    if (!window.confirm(`${pick(tmpl, 'en').replace('{count}', String(count)).replace('{name}', name)} / ${pick(tmpl, 'fr').replace('{count}', String(count)).replace('{name}', name)}`)) return
    setForgetting(true)
    try {
      await forgetFactsForEntity(organizationId, 'person', forgetPersonId)
      setForgetPersonId('')
      await load()
      const doneTmpl = count === 1 ? M.memory_gov_data_remove_person_done_one : M.memory_gov_data_remove_person_done_many
      showToast({ en: pick(doneTmpl, 'en').replace('{count}', String(count)).replace('{name}', name), fr: pick(doneTmpl, 'fr').replace('{count}', String(count)).replace('{name}', name) }, 'ok')
    } catch {
      showToast(M.memory_prod_error, 'info')
    } finally {
      setForgetting(false)
    }
  }

  const exportRecord = async () => {
    const result = await exportMemoryRecord({
      facts: rows,
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

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.memory_prod_empty_title)} />
  }

  const peopleWithFacts = employees.filter((e) =>
    active.some((f) => f.scope === 'person' && f.entityId === e.id),
  )

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
                onClick={() => setFormOpen(true)}
                disabled={injectionLocked}
                className="flex cursor-pointer items-center gap-[6px] rounded-[9px] border-none bg-navy px-[13px] py-[8px] font-sans text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                title={injectionLocked ? x(M.memory_prod_plan_lock) : undefined}
              >
                <Plus size={15} strokeWidth={2} aria-hidden="true" />
                {x(M.memory_ws_add)}
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mt-[14px] flex gap-[2px] overflow-x-auto" role="tablist" aria-label={x(M.memory_tabs_aria)}>
            {TABS.map((t) => {
              const activeTab = tab === t.key
              const badge = t.key === 'review' && proposed.length > 0 ? proposed.length : null
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab}
                  aria-controls={`mem-prod-tabpanel-${t.key}`}
                  id={`mem-prod-tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-[7px] border-b-2 px-[14px] py-[9px] font-sans text-[13px] font-semibold ${
                    activeTab ? 'border-gold-fg text-text' : 'border-transparent text-text-muted hover:text-text-2'
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
        id={`mem-prod-tabpanel-${tab}`}
        role="tabpanel"
        aria-labelledby={`mem-prod-tab-${tab}`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {tab === 'memories' && (
          <ProductionMemoriesTab
            loading={facts == null}
            loadFailed={loadFailed}
            rows={filtered}
            query={query}
            setQuery={setQuery}
            subjectFilter={subjectFilter}
            setSubjectFilter={setSubjectFilter}
            subjectLabel={subjectLabel}
            subjectHref={subjectHref}
            editId={editId}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            onStartEdit={(f) => {
              setEditDraft(pickL(f.statement, lang))
              setEditId(f.id)
            }}
            onCancelEdit={() => setEditId(null)}
            onSaveEdit={(id) => void onCorrect(id, editDraft)}
            onConfirm={(id) => void onConfirm(id)}
            onForget={(id) => void onForget(id)}
            onMarkForReview={(id) => void onMarkForReview(id)}
            onAddLegalHold={(id, en, fr) => void onAddLegalHold(id, en, fr)}
            onRemoveLegalHold={(id) => void onRemoveLegalHold(id)}
            onRetry={() => void load()}
          />
        )}
        {tab === 'review' && (
          <ProductionReviewTab
            rows={proposed}
            subjectLabel={subjectLabel}
            onConfirm={(id) => void onConfirm(id)}
            onReject={(id) => void onReject(id)}
          />
        )}
        {tab === 'activity' && <ProductionActivityTab audit={audit} />}
        {tab === 'governance' && (
          <ProductionGovernanceTab
            memoryEnabled={memoryEnabled}
            setMemoryEnabled={setMemoryEnabled}
            onExport={() => void exportRecord()}
            peopleWithFacts={peopleWithFacts}
            forgetPersonId={forgetPersonId}
            setForgetPersonId={setForgetPersonId}
            onBulkForgetPerson={() => void onBulkForgetPerson()}
            forgetting={forgetting}
          />
        )}
      </div>

      {/* Add memory form */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={x(M.memory_add_title)}
          className="fixed inset-0 z-90 flex items-center justify-center bg-black/45 p-[16px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false)
          }}
        >
          <form
            onSubmit={onCreate}
            className="w-full max-w-[520px] rounded-[14px] border border-border bg-surface-2 p-[18px] shadow-lg"
          >
            <div className="mb-[14px] flex items-start justify-between gap-[10px]">
              <h2 className="m-0 font-display text-[16px] font-semibold text-text">{x(M.memory_add_title)}</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label={x(M.memory_action_cancel)}
                className="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset"
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-[12px]">
              <div className="grid gap-[12px] sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="mem-prod-scope">{x(M.memory_add_subject)}</label>
                  <select
                    id="mem-prod-scope"
                    value={form.scope}
                    onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as MemoryScope }))}
                    className={inputClass}
                  >
                    <option value="person">{x(M.memory_add_person)}</option>
                    <option value="case">{x(M.memory_add_case)}</option>
                  </select>
                </div>
                <div>
                  {form.scope === 'person' ? (
                    <>
                      <label className={labelClass} htmlFor="mem-prod-person">{x(M.memory_add_person)}</label>
                      <select
                        id="mem-prod-person"
                        value={form.employeeId}
                        onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                        className={inputClass}
                        required
                      >
                        <option value="">{x(M.memory_add_select_person)}</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className={labelClass} htmlFor="mem-prod-case">{x(M.memory_add_case)}</label>
                      <select
                        id="mem-prod-case"
                        value={form.caseId}
                        onChange={(e) => setForm((f) => ({ ...f, caseId: e.target.value }))}
                        className={inputClass}
                        required
                      >
                        <option value="">{x(M.memory_add_select_case)}</option>
                        {cases.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="mem-prod-cat">{x(M.memory_prod_category)}</label>
                <select
                  id="mem-prod-cat"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MemoryCategory }))}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{pick(CATEGORY_LABEL[c], lang)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="mem-prod-en">{x(M.memory_add_text)}</label>
                <textarea
                  id="mem-prod-en"
                  value={form.statementEn}
                  onChange={(e) => setForm((f) => ({ ...f, statementEn: e.target.value }))}
                  rows={3}
                  className={`${inputClass} resize-y`}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="mem-prod-fr">{x(M.memory_add_text_fr)}</label>
                <input
                  id="mem-prod-fr"
                  value={form.statementFr}
                  onChange={(e) => setForm((f) => ({ ...f, statementFr: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-[16px] flex justify-end gap-[8px]">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="cursor-pointer rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-semibold text-text-muted"
              >
                {x(M.memory_action_cancel)}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[9px] font-sans text-[13px] font-bold text-white disabled:opacity-50"
              >
                {x(M.memory_add_save)}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
