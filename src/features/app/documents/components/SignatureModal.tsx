import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import type { DocRecipient, GeneratedDoc, RecipientType } from '../data'

interface SignatureModalProps {
  readonly doc: GeneratedDoc
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onSend: (recipients: DocRecipient[]) => void
}

const RECIPIENT_TYPES: RecipientType[] = ['employer', 'employee', 'manager', 'hr', 'external']

const RECIPIENT_LABEL = {
  employer: bi('Employer', 'Employeur'),
  employee: bi('Employee', 'Employé(e)'),
  manager: bi('Manager', 'Gestionnaire'),
  hr: bi('HR', 'RH'),
  external: bi('External', 'Externe'),
} as const

function emptyRecipient(order: number): DocRecipient {
  return {
    name: '',
    type: 'employee',
    email: '',
    order,
    status: 'pending',
  }
}

export function SignatureModal({ doc, isOpen, onClose, onSend }: SignatureModalProps) {
  const { t, x } = useI18n()
  const [recipients, setRecipients] = useState<DocRecipient[]>(() =>
    doc.recipients.length > 0 ? doc.recipients : [emptyRecipient(1)],
  )

  const canSend = useMemo(
    () => recipients.every((r) => r.name.trim() !== '' && r.email.trim() !== '' && r.email.includes('@')),
    [recipients],
  )

  if (!isOpen) return null

  const updateRecipient = (index: number, patch: Partial<DocRecipient>) => {
    setRecipients((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              ...patch,
              order: patch.order ?? r.order,
            }
          : r,
      ),
    )
  }

  const addRecipient = () => {
    setRecipients((prev) => [...prev, emptyRecipient(prev.length + 1)])
  }

  const removeRecipient = (index: number) => {
    setRecipients((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, order: i + 1 })),
    )
  }

  const handleSend = () => {
    if (!canSend) return
    onSend(recipients)
  }

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 h-full w-full items-center justify-center bg-black/40 p-4 open:flex"
      aria-label={t('doclib_modal_title')}
    >
      <div className="w-full max-w-[560px] rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
              {doc.ref}
            </div>
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-text">
              {t('doclib_modal_title')}
            </h2>
            <p className="mt-1 text-[12.5px] text-text-faint">{t('doclib_modal_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] p-1.5 text-text-muted hover:bg-inset hover:text-text"
            aria-label={t('doclib_common_close')}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {recipients.map((recipient, index) => (
            <div
              key={`${recipient.email || 'new'}-${index}`}
              className="rounded-xl border border-border bg-inset p-3.5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-bold text-text-muted">
                  {t('doclib_docd_recipient')} {index + 1}
                </span>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="text-[11.5px] font-semibold text-risk-fg hover:underline"
                  >
                    {t('doclib_modal_remove')}
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-text-muted">
                    {t('doclib_modal_name')}
                  </label>
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, { name: e.target.value })}
                    className="w-full rounded-[9px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text placeholder:text-text-faint"
                    placeholder={t('doclib_modal_namePh')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-text-muted">
                    {t('doclib_modal_email')}
                  </label>
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, { email: e.target.value })}
                    className="w-full rounded-[9px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text placeholder:text-text-faint"
                    placeholder={t('doclib_modal_emailPh')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-text-muted">
                    {t('doclib_docd_role')}
                  </label>
                  <select
                    value={recipient.type}
                    onChange={(e) => updateRecipient(index, { type: e.target.value as RecipientType })}
                    className="w-full rounded-[9px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text"
                  >
                    {RECIPIENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {x(RECIPIENT_LABEL[type])}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-text-muted">
                    {t('doclib_docd_order')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={recipient.order}
                    onChange={(e) => updateRecipient(index, { order: Number(e.target.value) })}
                    className="w-full rounded-[9px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRecipient}
          className="mt-3 text-[12.5px] font-semibold text-navy hover:underline"
        >
          {t('doclib_modal_add')}
        </button>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[9px] border border-border bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-text hover:bg-inset"
          >
            {t('doclib_common_cancel')}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="rounded-[9px] bg-navy px-3.5 py-2 text-[12.5px] font-semibold text-white opacity-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('doclib_docd_sendSign')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
