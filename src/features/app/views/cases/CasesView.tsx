import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { casesMessages as M } from '@/i18n/messages/cases'
import { statusChipClass } from '@/components/chips'
import { ProgressFill } from '@/components/ProgressFill'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { barToneClass, listCases, addCreatedCase } from './caseModel'
import type { WorkspaceCase } from './caseModel'
import { CasesProductionView } from './CasesProductionView'
import { NewCaseModal } from './NewCaseModal'

/**
 * Case Files list — port of the prototype's cases list (markup 1767–1789,
 * `buildCasesView`). Open-count header + New case button, then one card per
 * case with type/province/owner/opened meta, status chip, summary and a
 * step-progress bar. Rows navigate to /app/cases/:caseId.
 *
 * Production renders the real case files (CasesProductionView,
 * public.hr_cases) instead of the Northgate fixtures below.
 */
export function CasesView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CasesProductionView />
  return <CasesDemoView />
}

function CasesDemoView() {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { showToast } = useToasts()
  const [newCaseOpen, setNewCaseOpen] = useState(false)

  const allCases = listCases()
  const openCount = allCases.filter((c) => c.status.en !== 'Resolved').length

  const openCase = (caseId: string) => navigate(`/app/cases/${caseId}`)

  /* Prototype `createCase()`: prepend, close the modal, open the detail, toast. */
  const handleCreate = (created: WorkspaceCase) => {
    addCreatedCase(created)
    setNewCaseOpen(false)
    navigate(`/app/cases/${created.id}`)
    showToast(M.cases_toast_created, 'ok')
  }

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-[18px] flex items-center justify-between gap-[12px]">
          <div className="text-[13px] text-text-muted">
            {`${openCount} ${x(M.cases_open_of)} ${allCases.length} ${x(M.cases_word)}`}
          </div>
          <button
            type="button"
            onClick={() => setNewCaseOpen(true)}
            className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border-none bg-navy px-[15px] py-[9px] font-sans text-[12.5px] font-bold text-white"
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
            {x(M.cases_new_case)}
          </button>
        </div>

        <div className="flex flex-col gap-[12px]">
          {allCases.map((c) => {
            const doneSteps = c.steps.filter((s) => s.done).length
            const pct = Math.round((doneSteps / c.steps.length) * 100)
            return (
              <button
                key={c.id}
                type="button"
                aria-label={`${x(M.cases_open_case_aria)} ${pickL(c.title, lang)}`}
                onClick={() => openCase(c.id)}
                className="flex w-full cursor-pointer flex-col gap-[12px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px] text-left font-sans hover:border-(--accent-soft-border)"
              >
                <div className="flex flex-wrap items-center justify-between gap-[12px]">
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-semibold text-text">
                      {pickL(c.title, lang)}
                    </div>
                    <div className="mt-[2px] text-[12px] text-text-muted">
                      {x(c.typeLabel)} · {x(c.province)} · {x(M.cases_owner)} {c.owner} ·{' '}
                      {x(M.cases_opened)} {c.opened}
                    </div>
                  </div>
                  <span className={statusChipClass(c.tone)}>{x(c.status)}</span>
                </div>
                <div className="text-[13px] leading-[1.55] text-text-3">{x(c.summary)}</div>
                <div>
                  <div className="mb-[5px] flex items-center justify-between text-[11.5px] text-text-muted">
                    <span>{x(M.cases_progress)}</span>
                    <span>
                      {doneSteps}/{c.steps.length}
                    </span>
                  </div>
                  <div className="h-[6px] overflow-hidden rounded-[100px] bg-inset">
                    <ProgressFill
                      pct={pct}
                      className={`h-full w-full rounded-[100px] ${barToneClass(c.tone).replace('bg-', 'text-')}`}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {newCaseOpen && (
        <NewCaseModal onClose={() => setNewCaseOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
