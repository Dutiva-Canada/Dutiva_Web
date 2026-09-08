import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import type {
  ProductionEmployee,
  ProductionEmployeeNote,
} from './productionApi'
import { PerformanceReviews } from './PerformanceReviews'
import { OnboardingTasks } from './OnboardingTasks'

/**
 * Overview tab for the production employee profile — performance reviews,
 * onboarding checklist, and the notes thread. The parent owns the notes
 * data; this component owns the add-note form state.
 */

function SectionHeading({ text }: { readonly text: string }) {
  return (
    <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
      {text}
    </div>
  )
}

export function EmployeeOverviewTab({
  employee,
  organizationId,
  roster,
  isOrgAdmin,
  notes,
  onAddNote,
}: Readonly<{
  employee: ProductionEmployee
  organizationId: string
  roster: ProductionEmployee[]
  isOrgAdmin: boolean
  notes: ProductionEmployeeNote[]
  onAddNote: (body: string) => Promise<void>
}>) {
  const { x } = useI18n()
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!draft.trim() || saving) return
    setSaving(true)
    try {
      await onAddNote(draft.trim())
      setDraft('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PerformanceReviews
        employee={employee}
        organizationId={organizationId}
        roster={roster}
        isOrgAdmin={isOrgAdmin}
      />

      <OnboardingTasks
        employee={employee}
        organizationId={organizationId}
        roster={roster}
        isOrgAdmin={isOrgAdmin}
      />

      <SectionHeading text={x(M.employees_prod_notes_title)} />
      <div className="mb-[14px] overflow-hidden rounded-[12px] border border-border bg-surface">
        {notes.length === 0 && (
          <div className="px-[18px] py-[16px] text-[13px] text-text-muted">
            {x(M.employees_prod_notes_empty)}
          </div>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="border-t border-inset px-[18px] py-[12px] first:border-t-0"
          >
            <div className="text-[13px] leading-[1.55] whitespace-pre-wrap text-text">
              {note.body}
            </div>
            <div className="mt-[4px] text-[11.5px] text-text-faint">
              {note.createdAt.slice(0, 10)}
            </div>
          </div>
        ))}
      </div>

      {isOrgAdmin && (
        <form onSubmit={(e) => void submit(e)} className="flex gap-[8px]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={x(M.employees_prod_note_placeholder)}
            aria-label={x(M.employees_prod_note_placeholder)}
            className="min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-[14px] py-[10px] font-sans text-[13.5px] text-text"
          />
          <button
            type="submit"
            disabled={saving || !draft.trim()}
            className="cursor-pointer rounded-[10px] border-none bg-navy px-[16px] py-[10px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {x(M.employees_prod_note_add)}
          </button>
        </form>
      )}
    </>
  )
}
