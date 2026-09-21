import { Copy, Mail, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { DocChip } from '../components'
import { signatureStatusInfo } from '../data'
import type { StoredDocumentExport } from '../exportStorageApi'
import type { SigningCompletionRecord } from '../completionRecord'
import { isSigningTokenExpired } from '../signatureQueries'
import type { ProductionDocumentRecipient, ProductionDocumentSignature } from '../signatureQueries'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import {
  PROD_RECIPIENT_TYPE,
  fmtDetailDate,
  inviteDeliveryInfo,
  signatureInfoForStatus,
} from './documentDetailProductionMeta'

/* Recipients tab for DocumentDetailProductionView — signature provider card,
   completion record, stored exports and the ordered recipient list with
   copy/email/reissue signing-link actions. Extracted to keep the screen file
   under the size budget. */

interface RecipientsTabProps {
  recipients: ProductionDocumentRecipient[]
  signature: ProductionDocumentSignature | null
  completion: SigningCompletionRecord | null
  turn: ProductionDocumentRecipient | null
  undeliveredInviteCount: number
  storedExports: StoredDocumentExport[]
  downloadingExportId: string | null
  emailingRecipientId: string | null
  emailingAll: boolean
  reissuingRecipientId: string | null
  isOrgAdmin: boolean
  onEmailSigningLink: (recipientId?: string) => void
  onCopySigningLink: (token: string) => void
  onReissueSigningLink: (recipientId: string) => void
  onDownloadStoredExport: (row: StoredDocumentExport) => void
  onDownloadCompletionRecord: () => void
}

export function RecipientsTab({
  recipients,
  signature,
  completion,
  turn,
  undeliveredInviteCount,
  storedExports,
  downloadingExportId,
  emailingRecipientId,
  emailingAll,
  reissuingRecipientId,
  isOrgAdmin,
  onEmailSigningLink,
  onCopySigningLink,
  onReissueSigningLink,
  onDownloadStoredExport,
  onDownloadCompletionRecord,
}: RecipientsTabProps) {
  const { x, lang } = useI18n()
  const navigate = useWorkspaceNavigate()
  return (
    <div>
      {undeliveredInviteCount > 0 && (
        <div className="mb-3.5 rounded-[13px] border border-risk-border bg-risk-bg px-4 py-3 text-[13px] text-risk-fg">
          {x(M.doclib_prod_invite_bounced_banner).replaceAll(
            '{count}',
            String(undeliveredInviteCount),
          )}
        </div>
      )}
      {signature && (
        <div className="mb-3.5 rounded-[13px] border border-border bg-surface px-4.25 py-3.75">
          <div className="mb-1.5 font-display text-[11px] font-bold tracking-[0.06em] text-text-muted uppercase">
            {x(M.doclib_docd_provider)}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-text">
            <span className="font-semibold">{signature.provider}</span>
            <span className="inline-flex items-center rounded-md border border-border bg-inset px-1.75 py-px text-[11px] font-semibold text-text-muted">
              {x(M.doclib_docd_envelope)} {signature.envelopeId}
            </span>
            <DocChip tone={signatureStatusInfo[signature.status].tone}>
              {x(signatureStatusInfo[signature.status].label)}
            </DocChip>
          </div>
          {signature.contentHash && (
            <div className="mt-1.75 font-mono text-[11px] text-text-faint">
              {x(M.doclib_prod_content_hash)}: {signature.contentHash.slice(0, 16)}…
            </div>
          )}
          <div className="mt-2.25 text-[11.5px] text-text-faint">
            {x(M.doclib_docd_providerAgnostic)}
          </div>
          {isOrgAdmin &&
            recipients.some(
              (r) => r.signingToken && r.status !== 'signed' && r.status !== 'declined',
            ) && (
              <button
                type="button"
                onClick={() => void onEmailSigningLink()}
                disabled={emailingAll || !!emailingRecipientId}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-inset px-2.5 py-1.5 text-[11.5px] font-semibold text-text hover:bg-surface disabled:opacity-50"
              >
                <Mail size={12} strokeWidth={2} aria-hidden="true" />
                {x(M.doclib_external_email_all)}
              </button>
            )}
        </div>
      )}

      {completion && (
        <div className="mb-3.5 rounded-[13px] border border-border bg-inset px-4 py-3.5">
          <div className="mb-2 font-display text-[14px] font-semibold text-text">
            {x(M.doclib_prod_completion_title)}
          </div>
          <p className="text-[12.5px] text-text-muted">
            {x(completion.title)} · {completion.completedAt.slice(0, 10)}
          </p>
          <button
            type="button"
            onClick={() => void onDownloadCompletionRecord()}
            className="mt-3 rounded-[9px] bg-navy px-3 py-1.75 text-[12px] font-semibold text-white"
          >
            {x(M.doclib_prod_download_completion)}
          </button>
        </div>
      )}

      {storedExports.length > 0 && (
        <div className="mb-3.5 rounded-[13px] border border-border bg-surface px-4 py-3.5">
          <div className="mb-2 font-display text-[14px] font-semibold text-text">
            {x(M.doclib_prod_stored_exports)}
          </div>
          <ul className="space-y-2">
            {storedExports.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-inset px-3 py-2"
              >
                <div className="text-[12.5px] text-text-muted">
                  {x(M.doclib_prod_version)} {row.versionNumber} ·{' '}
                  {new Date(row.createdAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                </div>
                <button
                  type="button"
                  onClick={() => void onDownloadStoredExport(row)}
                  disabled={downloadingExportId === row.id}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-text hover:bg-inset disabled:opacity-50"
                >
                  {x(M.doclib_prod_download_export)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipients.length === 0 ? (
        <div className="rounded-[13px] border border-dashed border-border px-4 py-8.5 text-center text-[13px] text-text-muted">
          {x(M.doclib_prod_no_recipients)}
        </div>
      ) : (
        recipients.map((recipient) => {
          const info = signatureInfoForStatus(recipient.status)
          const inviteInfo = inviteDeliveryInfo(recipient)
          return (
            <div
              key={recipient.id}
              className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span
                aria-label={`${x(M.doclib_docd_order)} ${recipient.order}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-inset text-[11px] font-bold text-text-muted"
              >
                {recipient.order}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-text">{recipient.name}</div>
                <div className="text-[11.5px] text-text-faint">
                  {x(PROD_RECIPIENT_TYPE[recipient.type])} · {recipient.email}
                </div>
                {recipient.inviteLastSentAt && (
                  <div className="mt-0.75 text-[11px] text-text-faint">
                    {x(M.doclib_invite_last_sent)}:{' '}
                    {new Date(recipient.inviteLastSentAt).toLocaleString(
                      lang === 'fr' ? 'fr-CA' : 'en-CA',
                    )}
                    {recipient.inviteDeliveryDetail &&
                      (recipient.inviteDeliveryStatus === 'bounced' ||
                        recipient.inviteDeliveryStatus === 'complained') && (
                        <span className="block text-risk-fg">{recipient.inviteDeliveryDetail}</span>
                      )}
                    {isSigningTokenExpired(recipient) && (
                      <span className="block text-risk-fg">
                        {x(M.doclib_external_link_expired)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  {info ? (
                    <DocChip tone={info.tone}>{x(info.label)}</DocChip>
                  ) : (
                    <DocChip tone="neutral">{recipient.status}</DocChip>
                  )}
                  {inviteInfo && <DocChip tone={inviteInfo.tone}>{x(inviteInfo.label)}</DocChip>}
                </div>
                <div className="mt-0.75 text-[11px] text-text-faint">
                  {recipient.signedAt ? fmtDetailDate(recipient.signedAt, lang) : '—'}
                </div>
                {signature &&
                  recipient.status !== 'signed' &&
                  recipient.status !== 'declined' &&
                  recipient.signingToken && (
                    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                      {turn?.email === recipient.email && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/app/documents/sign/${signature.envelopeId}?recipient=${encodeURIComponent(recipient.email)}`,
                            )
                          }
                          className="rounded-lg bg-navy px-2.5 py-1 text-[11.5px] font-semibold text-white"
                        >
                          {x(M.doclib_docd_sign)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void onCopySigningLink(recipient.signingToken!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-text hover:bg-inset"
                      >
                        <Copy size={12} strokeWidth={2} aria-hidden="true" />
                        {x(M.doclib_external_copy_link)}
                      </button>
                      {isOrgAdmin && (
                        <button
                          type="button"
                          onClick={() => void onEmailSigningLink(recipient.id)}
                          disabled={emailingAll || emailingRecipientId === recipient.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-text hover:bg-inset disabled:opacity-50"
                        >
                          <Mail size={12} strokeWidth={2} aria-hidden="true" />
                          {x(M.doclib_external_email_link)}
                        </button>
                      )}
                      {isOrgAdmin && (
                        <button
                          type="button"
                          onClick={() => void onReissueSigningLink(recipient.id)}
                          disabled={!!reissuingRecipientId}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-text hover:bg-inset disabled:opacity-50"
                        >
                          <RefreshCw size={12} strokeWidth={2} aria-hidden="true" />
                          {x(M.doclib_external_reissue_link)}
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
