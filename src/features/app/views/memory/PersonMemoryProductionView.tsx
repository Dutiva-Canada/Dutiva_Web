import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Brain, Briefcase, Plus, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { getEmployee } from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { MemoryCategory, MemoryFact } from '@/data'
import { CATEGORY_LABELS, PERSON_CATEGORY_ORDER } from './memoryModel'
import { MemoryFactRow } from './MemoryFactRow'
import {
  confirmFact,
  correctFact,
  createFact,
  forgetFact,
  listFactsByEntity,
} from './productionApi'

/**
 * Person memory in production — facts where scope=person and entity_id is a
 * real employee id. No fixture chips / case narratives.
 */

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

export function PersonMemoryProductionView() {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { personId } = useParams()
  const { showToast } = useToasts()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()

  const [employee, setEmployee] = useState<ProductionEmployee | null | undefined>(undefined)
  const [facts, setFacts] = useState<MemoryFact[] | null>(null)
  const [relatedCases, setRelatedCases] = useState<{ id: string; title: string }[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: 'note' as MemoryCategory,
    statementEn: '',
    statementFr: '',
  })

  const load = useCallback(async () => {
    if (!organizationId || !personId) return
    setLoadFailed(false)
    try {
      const [emp, factRows, cases] = await Promise.all([
        getEmployee(personId),
        listFactsByEntity(organizationId, 'person', personId),
        listCases(organizationId).catch(() => []),
      ])
      setEmployee(emp)
      setFacts(factRows)
      setRelatedCases(
        cases
          .filter((c) => c.employeeId === personId)
          .map((c) => ({ id: c.id, title: c.title }))
          .slice(0, 3),
      )
    } catch {
      setEmployee(null)
      setFacts([])
      setRelatedCases([])
      setLoadFailed(true)
    }
  }, [organizationId, personId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.memory_prod_empty_title)} />
  }
  if (!personId) return <Navigate to="/app/settings/memory" replace />
  if (employee === undefined || facts === null) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-[28px] pt-[28px] text-[13px] text-text-faint">
        …
      </div>
    )
  }
  if (employee === null) return <Navigate to="/app/settings/memory" replace />

  const inferredCount = facts.filter((f) => f.confidence === 'inferred').length
  const groups = PERSON_CATEGORY_ORDER.map((category) => ({
    category,
    items: facts.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0)

  const onConfirm = async (id: string) => {
    try {
      const updated = await confirmFact(organizationId, id)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }
  const onCorrect = async (id: string, statement: string) => {
    try {
      const updated = await correctFact(organizationId, id, statement)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }
  const onForget = async (id: string) => {
    try {
      await forgetFact(organizationId, id)
      setFacts((prev) => (prev ?? []).filter((f) => f.id !== id))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.statementEn.trim() || saving) return
    setSaving(true)
    try {
      const added = await createFact(organizationId, {
        scope: 'person',
        entityId: personId,
        category: form.category,
        statementEn: form.statementEn.trim(),
        statementFr: form.statementFr.trim() || form.statementEn.trim(),
      })
      setFacts((prev) => [added, ...(prev ?? [])])
      setForm({ category: 'note', statementEn: '', statementFr: '' })
      setFormOpen(false)
      showToast(M.memory_prod_added, 'ok')
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const initials = employee.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const firstName = employee.name.split(/\s+/)[0] ?? employee.name

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1080px] px-[16px] pt-[26px] pb-[40px] md:px-[28px]">
        {loadFailed && (
          <div className="mb-[14px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[10px] text-[13px] text-risk-dot">
            {x(M.memory_prod_load_failed)}
          </div>
        )}

        <div className="mb-[22px] flex flex-wrap items-start gap-[16px]">
          <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] bg-navy font-display text-[20px] font-semibold text-gold-on-navy">
            {initials || '?'}
          </div>
          <div className="min-w-[220px] flex-1">
            <h1 className="m-0 font-display text-[23px] font-semibold tracking-[-0.01em] text-text">
              {employee.name}
            </h1>
            <div className="mt-[4px] text-[13.5px] text-text-muted">
              {[employee.title, employee.jurisdiction].filter(Boolean).join(' · ')}
            </div>
            <Link
              to={`/app/employees/${employee.id}`}
              className="mt-[8px] inline-block text-[12.5px] font-semibold text-accent no-underline hover:underline"
            >
              {x(M.memory_open_people_record)}
            </Link>
          </div>
          <div className="flex flex-wrap gap-[9px]">
            <button
              type="button"
              onClick={() => navigate('/app/advisor')}
              className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border-none bg-navy px-[14px] py-[9px] font-sans text-[13px] font-bold text-white"
            >
              <Sparkle size={15} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
              {x(M.memory_person_ask)} {firstName}
            </button>
            {relatedCases[0] && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/app/cases/${relatedCases[0]!.id}`)}
                  className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-text-2"
                >
                  <Briefcase size={16} strokeWidth={1.7} aria-hidden="true" />
                  {x(M.memory_person_open_case)}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/app/settings/memory/cases/${relatedCases[0]!.id}`)}
                  className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-text-2"
                >
                  <Brain size={16} strokeWidth={1.7} aria-hidden="true" />
                  {x(M.memory_review_case_memory)}
                </button>
              </>
            )}
            {isOrgAdmin && (
              <button
                type="button"
                onClick={() => setFormOpen((o) => !o)}
                className="flex cursor-pointer items-center gap-[6px] rounded-[9px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[12.5px] font-bold text-text-2"
              >
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                {x(M.memory_prod_add)}
              </button>
            )}
          </div>
        </div>

        {formOpen && isOrgAdmin && (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mb-[18px] rounded-[14px] border border-border-soft bg-surface px-[16px] py-[14px]"
          >
            <div className="grid gap-[12px] md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="person-mem-cat">
                  {x(M.memory_prod_category)}
                </label>
                <select
                  id="person-mem-cat"
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
              <div />
              <div>
                <label className={labelClass} htmlFor="person-mem-en">
                  {x(M.memory_prod_statement_en)}
                </label>
                <input
                  id="person-mem-en"
                  value={form.statementEn}
                  onChange={(e) => setForm((f) => ({ ...f, statementEn: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="person-mem-fr">
                  {x(M.memory_prod_statement_fr)}
                </label>
                <input
                  id="person-mem-fr"
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
          </form>
        )}

        <div className="mb-[12px] flex items-center gap-[8px]">
          <Brain size={16} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
          <h2 className="m-0 font-display text-[17px] font-semibold text-text">
            {x(M.memory_person_remembers)} {employee.name.split(/\s+/)[0]}
          </h2>
        </div>
        {inferredCount > 0 && (
          <p className="mb-[14px] text-[12.5px] text-text-muted">
            {inferredCount}{' '}
            {x(
              inferredCount === 1
                ? M.memory_mgr_review_waiting_one
                : M.memory_mgr_review_waiting_many,
            )}
          </p>
        )}

        {groups.length === 0 ? (
          <div className="rounded-[14px] border border-border-soft bg-surface px-[20px] py-[28px] text-center text-[13px] text-text-faint">
            {x(M.memory_prod_person_empty)}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.category} className="mb-[16px]">
              <div className="mb-[8px] text-[11px] font-bold tracking-[0.06em] text-text-faint uppercase">
                {pick(CATEGORY_LABELS[group.category], lang)}
              </div>
              <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
                {group.items.map((fact) => (
                  <MemoryFactRow
                    key={fact.id}
                    fact={fact}
                    onConfirm={(id) => void onConfirm(id)}
                    onCorrect={(id, s) => void onCorrect(id, s)}
                    onForget={(id) => void onForget(id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <Disclaimer className="mt-[18px]" />
      </div>
    </div>
  )
}
