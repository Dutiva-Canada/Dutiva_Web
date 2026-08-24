import { useEffect, useRef, useState } from 'react'
import { Lock, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useEscapeToClose } from '@/lib/escapeStack'
import { employees } from '@/data'
import { casesMessages as M } from '@/i18n/messages/cases'
import {
  buildCreatedCase,
  newCaseJurisdictions,
  newCaseTypes,
  sensitiveCaseTypes,
  workplaceWide,
} from './caseModel'
import type { WorkspaceCase } from './caseModel'

/**
 * New case intake modal — port of the prototype's `newCaseView` (markup
 * 2128–2175, `buildNewCaseView` / `openNewCase` / `createCase`). Type,
 * employee and jurisdiction pickers plus an optional title; restricted case
 * types show the gold lock note. Escape / scrim / Cancel dismiss it.
 */
export interface NewCaseModalProps {
  onClose: () => void
  onCreate: (created: WorkspaceCase) => void
}

const fieldClass =
  'w-full box-border rounded-[9px] border border-border bg-surface-2 px-[12px] py-[10px] font-sans text-[13.5px] text-text'

export function NewCaseModal({ onClose, onCreate }: Readonly<NewCaseModalProps>) {
  const { x } = useI18n()
  const [type, setType] = useState('Termination')
  const [empId, setEmpId] = useState('')
  const [jurisdiction, setJurisdiction] = useState('Ontario')
  const [title, setTitle] = useState('')
  const restoreRef = useRef<Element | null>(null)

  /* Escape closes via the shared overlay stack; focus restores on close. */
  useEscapeToClose(true, onClose)
  useEffect(() => {
    restoreRef.current = document.activeElement
    return () => {
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [])

  const emp = employees.find((e) => e.id === empId)
  const typeOption = newCaseTypes.find((t) => t.value === type) ?? newCaseTypes[0]!
  const jurOption = newCaseJurisdictions.find((j) => j.value === jurisdiction)!
  const isSensitive = sensitiveCaseTypes.includes(type)
  const titlePlaceholder = `${x(typeOption.label)} — ${emp ? emp.name : x(workplaceWide)}`

  const create = () => {
    onCreate(
      buildCreatedCase({
        type,
        typeLabel: typeOption.label,
        empId: emp ? emp.id : null,
        empName: emp ? emp.name : null,
        jurLabel: jurOption.label,
        title,
      }),
    )
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-300 bg-overlay-scrim-mid"
      />
      <dialog
        open
        aria-label={x(M.cases_nc_heading)}
        className="fixed top-1/2 left-1/2 z-310 max-h-[calc(100vh-48px)] w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[16px] border border-border bg-surface px-[24px] py-[22px] font-sans shadow-modal"
      >
        <div className="mb-[4px] flex items-center justify-between gap-[12px]">
          <div className="font-display text-[18px] font-semibold text-text">
            {x(M.cases_nc_heading)}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={x(M.cases_nc_close_aria)}
            className="flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-none bg-inset"
          >
            <X size={14} strokeWidth={2} className="text-text-3" aria-hidden="true" />
          </button>
        </div>
        <div className="mb-[18px] text-[12.5px] leading-normal text-text-muted">
          {x(M.cases_nc_sub)}
        </div>

        <div className="flex flex-col gap-[14px]">
          <div>
            <label
              htmlFor="nc-type"
              className="mb-[6px] block text-[12px] font-semibold text-text-muted"
            >
              {x(M.cases_nc_type)}
            </label>
            <select
              id="nc-type"
              autoFocus
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={fieldClass}
            >
              {newCaseTypes.map((o) => (
                <option key={o.value} value={o.value}>
                  {x(o.label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="nc-emp"
              className="mb-[6px] block text-[12px] font-semibold text-text-muted"
            >
              {x(M.cases_nc_employee)}
            </label>
            <select
              id="nc-emp"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className={fieldClass}
            >
              <option value="">{x(M.cases_nc_no_employee)}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="nc-jur"
              className="mb-[6px] block text-[12px] font-semibold text-text-muted"
            >
              {x(M.cases_nc_jurisdiction)}
            </label>
            <select
              id="nc-jur"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className={fieldClass}
            >
              {newCaseJurisdictions.map((o) => (
                <option key={o.value} value={o.value}>
                  {x(o.label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="nc-title"
              className="mb-[6px] block text-[12px] font-semibold text-text-muted"
            >
              {x(M.cases_nc_title)}
            </label>
            <input
              id="nc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              className={fieldClass}
            />
          </div>
        </div>

        {isSensitive && (
          <div className="mt-[16px] flex items-start gap-[8px] rounded-[9px] border border-gold-border bg-gold-bg px-[13px] py-[10px] text-[12px] leading-normal font-semibold text-gold-fg">
            <Lock size={14} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />
            <span>{x(M.cases_nc_sensitive)}</span>
          </div>
        )}

        <div className="mt-[12px] text-[11px] text-text-faint">{x(M.cases_nc_audit)}</div>

        <div className="mt-[18px] flex justify-end gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-[16px] py-[10px] font-sans text-[13px] font-semibold text-text"
          >
            {x(M.cases_nc_cancel)}
          </button>
          <button
            type="button"
            onClick={create}
            className="cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[10px] font-sans text-[13px] font-bold text-white"
          >
            {x(M.cases_nc_create)}
          </button>
        </div>
      </dialog>
    </>
  )
}
