import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Briefcase, Info } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { getCase } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import type { MemoryFact } from '@/data'
import { MemoryFactRow } from './MemoryFactRow'
import { confirmFact, correctFact, forgetFact, listFactsByEntity } from './productionApi'

/**
 * Case memory in production — governed facts for the case entity only.
 * Resume banners / timelines stay demo-only (see memoryCaseContent).
 */

export function CaseMemoryProductionView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { caseId } = useParams()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [caseRow, setCaseRow] = useState<ProductionCase | null | undefined>(undefined)
  const [facts, setFacts] = useState<MemoryFact[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId || !caseId) return
    setLoadFailed(false)
    try {
      const [c, factRows] = await Promise.all([
        getCase(caseId),
        listFactsByEntity(organizationId, 'case', caseId),
      ])
      setCaseRow(c)
      setFacts(factRows)
    } catch {
      setCaseRow(null)
      setFacts([])
      setLoadFailed(true)
    }
  }, [organizationId, caseId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.memory_prod_empty_title)} />
  }
  if (!caseId) return <Navigate to="/app/settings/memory" replace />
  if (caseRow === undefined || facts === null) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-[28px] pt-[28px] text-[13px] text-text-faint">
        …
      </div>
    )
  }
  if (caseRow === null) return <Navigate to="/app/settings/memory" replace />

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

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-[16px] pt-[24px] pb-[40px] md:px-[28px]">
        {loadFailed && (
          <div className="mb-[14px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[10px] text-[13px] text-risk-dot">
            {x(M.memory_prod_load_failed)}
          </div>
        )}

        <div className="mb-[16px] flex flex-wrap items-start gap-[14px]">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-gold-bg text-gold-fg">
            <Briefcase size={16} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="min-w-[220px] flex-1">
            <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
              {caseRow.title}
            </h1>
            <div className="mt-[4px] text-[12.5px] text-text-faint">
              {caseRow.caseType} · {caseRow.status} · {caseRow.province}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/app/cases/${caseRow.id}`)}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[12.5px] font-semibold text-text-2"
          >
            {x(M.memory_person_open_case)}
          </button>
        </div>

        <div className="mb-[16px] flex items-start gap-[10px] rounded-[12px] border border-border-soft bg-inset px-[14px] py-[12px]">
          <Info size={15} strokeWidth={1.7} className="mt-[2px] shrink-0 text-text-muted" aria-hidden="true" />
          <p className="m-0 text-[12.5px] leading-normal text-text-muted">
            {x(M.memory_prod_narrative_note)}
          </p>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
          {facts.map((fact) => (
            <MemoryFactRow
              key={fact.id}
              fact={fact}
              onConfirm={(id) => void onConfirm(id)}
              onCorrect={(id, s) => void onCorrect(id, s)}
              onForget={(id) => void onForget(id)}
            />
          ))}
          {facts.length === 0 && (
            <div className="px-[20px] py-[30px] text-center text-[13px] text-text-faint">
              {x(M.memory_prod_case_empty)}
            </div>
          )}
        </div>
        <Disclaimer className="mt-[18px]" />
      </div>
    </div>
  )
}
