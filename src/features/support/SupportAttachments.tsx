import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, FileText, Paperclip } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import {
  ATTACHMENT_ALLOWED_MIME,
  AttachmentBlockedError,
  formatBytes,
  getAttachmentDownloadUrl,
  listAttachments,
  uploadAttachment,
  validateAttachment,
} from './attachmentsApi'
import type { SupportAttachment } from './attachmentsApi'

/**
 * Attachment list + uploader for a support ticket. Used on the customer ticket
 * thread (upload enabled while the ticket is open) and the admin ticket view
 * (read-only download). Files go to the private bucket; downloads use
 * short-lived signed URLs minted by the edge function. Renders nothing when
 * there's nothing to show and uploading isn't allowed.
 */
export function SupportAttachments({
  ticketId,
  canUpload,
}: {
  readonly ticketId: string
  readonly canUpload: boolean
}) {
  const { x } = useI18n()
  const [items, setItems] = useState<SupportAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    listAttachments(ticketId)
      .then((a) => {
        if (!cancelled) setItems(a)
      })
      .catch((e: unknown) => console.error('support: failed to list attachments', e))
    return () => {
      cancelled = true
    }
  }, [ticketId])

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    const invalid = validateAttachment(file)
    if (invalid) {
      setError(x(invalid === 'too_large' ? M.support_attach_too_large : M.support_attach_bad_type))
      return
    }
    setUploading(true)
    setError(null)
    try {
      const created = await uploadAttachment(ticketId, file)
      setItems((prev) => [...prev, created])
    } catch (e) {
      console.error('support: attachment upload failed', e)
      setError(x(M.support_attach_error))
    } finally {
      setUploading(false)
    }
  }

  async function onDownload(id: string) {
    setError(null)
    try {
      const url = await getAttachmentDownloadUrl(id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.error('support: attachment download failed', e)
      if (e instanceof AttachmentBlockedError) {
        setError(
          x(e.reason === 'infected' ? M.support_attach_blocked : M.support_attach_scan_incomplete),
        )
        return
      }
      setError(x(M.support_attach_download_error))
    }
  }

  if (!canUpload && items.length === 0) return null

  return (
    <section className="mt-[20px] rounded-[12px] border border-border bg-inset px-[16px] py-[14px]">
      <h2 className="m-0 mb-[10px] text-[13px] font-semibold text-text-2">
        {x(M.support_attachments_title)}
      </h2>

      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-text-3">{x(M.support_attach_none)}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[8px] p-0">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-[10px]">
              <FileText size={16} aria-hidden="true" className="flex-none text-text-muted" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-text">{a.fileName}</span>
              <span className="flex-none text-[12px] text-text-faint">
                {formatBytes(a.sizeBytes)}
              </span>
              {a.scanStatus === 'pending' && (
                <span className="flex-none rounded-full border border-border px-[8px] py-[1px] text-[11px] text-text-muted">
                  {x(M.support_attach_scan_pending)}
                </span>
              )}
              {a.scanStatus === 'flagged' && (
                <span className="flex-none rounded-full border border-risk-border bg-risk-bg px-[8px] py-[1px] text-[11px] font-semibold text-risk-fg">
                  {x(M.support_attach_scan_flagged)}
                </span>
              )}
              <button
                type="button"
                onClick={() => onDownload(a.id)}
                disabled={a.scanStatus === 'flagged'}
                title={a.scanStatus === 'flagged' ? x(M.support_attach_blocked) : undefined}
                className="flex flex-none cursor-pointer items-center gap-[4px] rounded-[7px] border border-border bg-surface px-[10px] py-[5px] text-[12.5px] font-semibold text-text-2 hover:text-text disabled:cursor-default disabled:opacity-50 disabled:hover:text-text-2"
              >
                <Download size={13} aria-hidden="true" />
                {x(M.support_attach_download)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <div className="mt-[12px]">
          <input
            ref={inputRef}
            id={`support-attach-${ticketId}`}
            type="file"
            accept={ATTACHMENT_ALLOWED_MIME.join(',')}
            onChange={onFile}
            disabled={uploading}
            className="sr-only"
          />
          <label
            htmlFor={`support-attach-${ticketId}`}
            className="inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-semibold text-text-2 hover:text-text has-[:disabled]:cursor-default has-[:disabled]:opacity-60"
          >
            <Paperclip size={14} aria-hidden="true" />
            {uploading ? x(M.support_attach_uploading) : x(M.support_attach_add)}
          </label>
          <p className="m-0 mt-[8px] text-[12px] leading-[1.5] text-text-3">
            {x(M.support_attach_hint)}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="m-0 mt-[10px] text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}
    </section>
  )
}
