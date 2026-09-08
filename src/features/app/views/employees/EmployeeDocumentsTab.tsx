import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { sourceChipClass } from '@/components/chips'
import type { ExpiryRecordKind, ProductionExpiryRecord } from './productionApi'

/**
 * Documents tab for the production employee profile — certifications and
 * dated documents (hr_expiry_records). The parent owns the record list;
 * this component owns the add-record form state.
 */

const inputClass =
  'rounded-[10px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[13px] text-text'
const smallButtonClass =
  'cursor-pointer rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text'
const primaryButtonClass =
  'cursor-pointer rounded-[10px] border-none bg-navy px-[14px] py-[8px] font-sans text-[12.5px] font-semibold text-white disabled:opacity-60'

const todayISO = (): string => new Date().toISOString().slice(0, 10)

function SectionHeading({ text }: { readonly text: string }) {
  return (
    <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
      {text}
    </div>
  )
}

export function EmployeeDocumentsTab({
  isOrgAdmin,
  records,
  onAddRecord,
  onRemoveRecord,
}: Readonly<{
  isOrgAdmin: boolean
  records: ProductionExpiryRecord[]
  onAddRecord: (
    kind: ExpiryRecordKind,
    name: string,
    expiryDate: string,
  ) => Promise<void>
  onRemoveRecord: (id: string) => Promise<void>
}>) {
  const { x } = useI18n()
  const [recordKind, setRecordKind] = useState<ExpiryRecordKind>('certification')
  const [recordName, setRecordName] = useState('')
  const [recordExpiry, setRecordExpiry] = useState('')
  const [recordSaving, setRecordSaving] = useState(false)

  const submit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!recordName.trim() || !recordExpiry || recordSaving) return
    setRecordSaving(true)
    try {
      await onAddRecord(recordKind, recordName.trim(), recordExpiry)
      setRecordName('')
      setRecordExpiry('')
    } finally {
      setRecordSaving(false)
    }
  }

  return (
    <>
      <SectionHeading text={x(M.employees_prod_records_title)} />
      <div className="mb-[12px] overflow-hidden rounded-[12px] border border-border bg-surface">
        {records.length === 0 && (
          <div className="px-[18px] py-[14px] text-[13px] text-text-muted">
            {x(M.employees_prod_records_empty)}
          </div>
        )}
        {records.map((record) => {
          const expired = record.expiryDate < todayISO()
          return (
            <div
              key={record.id}
              className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
            >
              <span className={sourceChipClass('neutral')}>
                {x(
                  record.kind === 'certification'
                    ? M.employees_prod_record_kind_certification
                    : M.employees_prod_record_kind_document,
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                {record.name}
              </span>
              <span
                className={`shrink-0 text-[12.5px] font-semibold tabular-nums ${
                  expired ? 'text-risk-fg' : 'text-text-2'
                }`}
              >
                {expired
                  ? x(M.employees_prod_record_expired)
                  : x(M.employees_prod_record_expires).replace('{date}', record.expiryDate)}
              </span>
              {isOrgAdmin && (
                <button
                  type="button"
                  onClick={() => void onRemoveRecord(record.id)}
                  className={smallButtonClass}
                >
                  {x(M.employees_prod_record_remove)}
                </button>
              )}
            </div>
          )
        })}
      </div>
      {isOrgAdmin && (
        <form
          onSubmit={(e) => void submit(e)}
          className="mb-[18px] flex flex-wrap items-end gap-[8px]"
        >
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.employees_prod_record_kind)}
            </span>
            <select
              value={recordKind}
              onChange={(e) => setRecordKind(e.target.value as ExpiryRecordKind)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="certification">
                {x(M.employees_prod_record_kind_certification)}
              </option>
              <option value="document">{x(M.employees_prod_record_kind_document)}</option>
            </select>
          </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-[4px]">
            <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.employees_prod_record_name)}
            </span>
            <input
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              placeholder={x(M.employees_prod_record_name_placeholder)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.employees_prod_record_expiry)}
            </span>
            <input
              type="date"
              value={recordExpiry}
              onChange={(e) => setRecordExpiry(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={recordSaving || !recordName.trim() || !recordExpiry}
            className={primaryButtonClass}
          >
            {x(M.employees_prod_record_add)}
          </button>
        </form>
      )}
    </>
  )
}
