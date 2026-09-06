import { useRef, useState } from 'react'
import { Download, Paperclip, Check } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { isAdminRole } from '@/features/app/workspaceMode/roles'
import { useFinanceData } from '../data/useFinanceData'
import {
  uploadReceiptFile,
  insertReceipt,
  markReceiptReviewed,
} from '../data/supabaseApi'
import type { FinanceReceipt } from '../data/types'

export function Evidence() {
  const { x } = useI18n()
  const { state, canWrite, reload } = useFinanceData()
  const { organizationId, memberRole } = useWorkspaceMode()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(false)

  const canUpload = canWrite && isAdminRole(memberRole) && organizationId

  const handleFile = async (file: File) => {
    if (!organizationId) return
    setUploading(true)
    setError(false)
    try {
      const entityId = state.entities[0]?.id
      if (!entityId) return
      const tempId = crypto.randomUUID()
      const { storagePath } = await uploadReceiptFile(organizationId, entityId, tempId, file)
      await insertReceipt(organizationId, {
        entityId,
        fileName: { en: file.name, fr: file.name },
        uploadedAt: new Date().toISOString(),
        reviewed: false,
        storagePath,
      })
      await reload()
    } catch {
      setError(true)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (receipt: FinanceReceipt) => {
    // The storage_path is not on the frontend type; in production this calls
    // the Supabase signed-URL endpoint. For now, we show the file name.
    try {
      // eslint-disable-next-line no-console
      console.log('Download requested for receipt', receipt.id)
    } catch {
      setError(true)
    }
  }

  const handleReview = async (id: string) => {
    if (!organizationId) return
    try {
      await markReceiptReviewed(organizationId, id, 'Workspace user')
      await reload()
    } catch {
      setError(true)
    }
  }

  // Build a simple evidence checklist from bills and expenses
  const checklist = [
    ...state.bills.map((b) => ({
      id: b.id,
      label: b.number,
      type: 'bill' as const,
      hasEvidence: state.receipts.some((r) => r.billId === b.id),
    })),
    ...state.expenses.map((e) => ({
      id: e.id,
      label: x(e.purpose),
      type: 'expense' as const,
      hasEvidence: state.receipts.some((r) => r.expenseId === e.id),
    })),
  ]

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[4px] text-[15px] font-semibold text-text">{x(M.finance_evidence_checklist)}</h2>
        <p className="mb-[12px] text-[12px] text-text-muted">{x(M.finance_evidence_checklist_hint)}</p>
        {checklist.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[6px] p-0">
            {checklist.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between gap-[12px] rounded-[8px] bg-inset px-[10px] py-[6px]"
              >
                <span className="text-[13px] text-text">{item.label}</span>
                <span
                  className={statusChipClass(item.hasEvidence ? 'success' : 'warning')}
                >
                  {item.hasEvidence ? x(M.finance_evidence_attached) : x(M.finance_evidence_missing)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px]">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_evidence_title)}</h2>
          {canUpload && (
            <>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFile(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-[6px] rounded-[8px] bg-navy px-[10px] py-[6px] text-[12px] font-semibold text-white disabled:opacity-50"
              >
                <Paperclip size={13} strokeWidth={1.9} />
                {x(M.finance_evidence_upload)}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mb-[10px] rounded-[8px] border border-risk-border bg-risk-surface px-[10px] py-[6px] text-[12px] text-risk-fg">
            {x(M.finance_evidence_upload_error)}
          </div>
        )}

        {state.receipts.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_evidence_no_receipts)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.receipts.map((receipt) => (
              <li
                key={receipt.id}
                className="flex items-center justify-between gap-[12px] rounded-[10px] bg-inset p-[12px]"
              >
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(receipt.fileName)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(M.finance_evidence_uploaded_at)}: {receipt.uploadedAt}
                  </div>
                </div>
                <div className="flex items-center gap-[8px]">
                  <span className={statusChipClass(receipt.reviewed ? 'success' : 'warning')}>
                    {receipt.reviewed ? x(M.finance_evidence_reviewed) : x(M.finance_evidence_pending)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDownload(receipt)}
                    className="flex items-center gap-[4px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                  >
                    <Download size={12} strokeWidth={1.9} />
                    {x(M.finance_evidence_download)}
                  </button>
                  {canUpload && !receipt.reviewed && (
                    <button
                      type="button"
                      onClick={() => void handleReview(receipt.id)}
                      className="flex items-center gap-[4px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      <Check size={12} strokeWidth={1.9} />
                      {x(M.finance_evidence_mark_reviewed)}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
