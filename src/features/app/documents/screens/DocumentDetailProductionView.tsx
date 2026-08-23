import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Copy, Mail, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import type { Lang } from '@/i18n/core'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { Disclaimer } from '@/components/Disclaimer'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { ActBtn, DocChip, DocPaper, JurisdictionPill, Skel } from '../components'
import { SignatureModal } from '../components/SignatureModal'
import {
  reviewStatusInfo,
  riskLevelInfo,
  signatureStatusInfo,
  templateByTid,
  type DocRecipient,
  type RecipientType,
  type SignatureStatus,
  type StatusInfo,
} from '../data'
import { archiveDocument, approveDocument, getDocument } from '../productionApi'
import type { ProductionDocumentDetail, ProductionDocumentStatus } from '../productionApi'
import { DOCUMENT_AUDIT_LABEL } from '../auditLabels'
import {
  buildSigningCompletionRecord,
  downloadCompletionRecord,
} from '../completionRecord'
import { exportSignedDocumentPdf } from '../exportDocument'
import { createDocumentExportDownloadUrl, listDocumentExports } from '../exportStorageApi'
import type { StoredDocumentExport } from '../exportStorageApi'
import { copyExternalSigningLink } from '../signingUrls'
import { sendSigningInviteEmail } from '../signingInviteApi'
import { reissueSigningToken } from '../signingTokenApi'
import {
  currentSigningTurn,
  sendDocumentForSignature,
  toDocRecipient,
  voidDocumentSignature,
} from '../signatureApi'
import type { InviteDeliveryStatus, ProductionDocumentRecipient } from '../signatureQueries'
import { countUndeliveredInvites, isSigningTokenExpired } from '../signatureQueries'

/**
 * Document detail in production mode — preview from frozen content_json,
 * fields from answers, versions + audit from DB, Dutiva Signature workflow.
 */

const STATUS_LABEL: Record<ProductionDocumentStatus, (typeof M)[keyof typeof M]> = {
  draft: M.doclib_prod_status_draft,
  approved: M.doclib_prod_status_approved,
  archived: M.doclib_prod_status_archived,
  sent_for_signature: M.doclib_prod_status_sent,
  partially_signed: M.doclib_prod_status_partial,
  signed: M.doclib_prod_status_signed,
  voided: M.doclib_prod_status_voided,
  exported: M.doclib_prod_status_exported,
}

const STATUS_TONE: Record<
  ProductionDocumentStatus,
  'neutral' | 'ok' | 'info' | 'warn' | 'risk'
> = {
  draft: 'neutral',
  approved: 'ok',
  archived: 'info',
  sent_for_signature: 'info',
  partially_signed: 'warn',
  signed: 'ok',
  voided: 'risk',
  exported: 'ok',
}

const RECIPIENT_TYPE = {
  employer: bi('Employer', 'Employeur'),
  employee: bi('Employee', 'Employé(e)'),
  manager: bi('Manager', 'Gestionnaire'),
  hr: bi('HR', 'RH'),
  external: bi('External', 'Externe'),
} as const satisfies Record<RecipientType, ReturnType<typeof bi>>

const TABS = [
  ['preview', M.doclib_prod_tab_preview],
  ['fields', M.doclib_prod_tab_fields],
  ['recipients', M.doclib_prod_tab_recipients],
  ['versions', M.doclib_prod_tab_versions],
  ['audit', M.doclib_prod_tab_audit],
] as const

type TabKey = (typeof TABS)[number][0]

function fmtDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function signatureInfo(status: string): StatusInfo | undefined {
  return status in signatureStatusInfo ? signatureStatusInfo[status as SignatureStatus] : undefined
}

const INVITE_DELIVERY_LABEL: Record<
  InviteDeliveryStatus,
  (typeof M)[keyof typeof M]
> = {
  delivered: M.doclib_invite_delivery_delivered,
  bounced: M.doclib_invite_delivery_bounced,
  complained: M.doclib_invite_delivery_complained,
  delayed: M.doclib_invite_delivery_delayed,
}

const INVITE_DELIVERY_TONE: Record<
  InviteDeliveryStatus,
  'neutral' | 'ok' | 'info' | 'warn' | 'risk'
> = {
  delivered: 'ok',
  bounced: 'risk',
  complained: 'risk',
  delayed: 'warn',
}

function inviteDeliveryInfo(recipient: ProductionDocumentRecipient): StatusInfo | undefined {
  if (!recipient.inviteLastSentAt) return undefined
  const status = recipient.inviteDeliveryStatus
  if (!status) return { tone: 'neutral', label: M.doclib_invite_delivery_sent }
  return { tone: INVITE_DELIVERY_TONE[status], label: INVITE_DELIVERY_LABEL[status] }
}

export function DocumentDetailProductionView() {
  const { docId } = useParams()
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { showToast } = useToasts()
  const { session } = useAuth()
  const { organizationId, isOrgAdmin, identity, companyName } = useWorkspaceMode()

  const [detail, setDetail] = useState<ProductionDocumentDetail | null | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)
  const [tab, setTab] = useState<TabKey>('preview')
  const [archiving, setArchiving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [storedExports, setStoredExports] = useState<StoredDocumentExport[]>([])
  const [downloadingExportId, setDownloadingExportId] = useState<string | null>(null)
  const [emailingRecipientId, setEmailingRecipientId] = useState<string | null>(null)
  const [emailingAll, setEmailingAll] = useState(false)
  const [reissuingRecipientId, setReissuingRecipientId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!organizationId || !docId) return
    setLoadFailed(false)
    try {
      setDetail(await getDocument(organizationId, docId))
    } catch {
      setDetail(null)
      setLoadFailed(true)
    }
  }, [organizationId, docId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!organizationId || !docId || !detail?.id) return
    void listDocumentExports(organizationId, docId)
      .then(setStoredExports)
      .catch(() => setStoredExports([]))
  }, [organizationId, docId, detail?.id, detail?.updatedAt])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.doclib_prod_empty_title)} />
  }

  if (detail === undefined) {
    return (
      <div className="px-[18px] py-[24px]">
        <p className="mb-3 text-[13px] text-text-muted">{x(M.doclib_prod_detail_loading)}</p>
        <Skel className="mb-3 h-10" />
        <Skel className="h-80" />
      </div>
    )
  }

  if (loadFailed || detail === null) {
    return (
      <div className="px-[18px] py-[24px]">
        <Link
          to="/app/documents"
          className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-text-muted hover:text-text"
        >
          <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          {x(M.doclib_prod_back)}
        </Link>
        <div className="rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[14px]">
          <p className="text-[13px] text-risk-fg">
            {loadFailed ? x(M.doclib_prod_error) : x(M.doclib_prod_detail_missing)}
          </p>
          {loadFailed && (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.doclib_prod_retry)}
            </button>
          )}
        </div>
      </div>
    )
  }

  const template = templateByTid.get(detail.templateTid)
  const current = detail.versions.find((v) => v.versionNumber === detail.currentVersion)
  const riskInfo = riskLevelInfo[detail.risk]
  const reviewInfo = reviewStatusInfo[detail.reviewStatus]
  const signature = detail.signature
  const recipients = [...detail.recipients].sort((a, b) => a.order - b.order)
  const undeliveredInviteCount = countUndeliveredInvites(recipients)
  const turn = currentSigningTurn(recipients)
  const completion = signature
    ? buildSigningCompletionRecord(detail, signature, recipients)
    : null
  const canApprove =
    isOrgAdmin && detail.status === 'draft' && detail.signatureStatus === 'not_sent'
  const canSendForSignature =
    isOrgAdmin &&
    detail.signatureStatus === 'not_sent' &&
    detail.status === 'approved'
  const canVoid =
    isOrgAdmin &&
    signature &&
    detail.signatureStatus !== 'voided' &&
    detail.status !== 'archived'
  const canExport =
    detail.signatureStatus === 'signed' &&
    detail.status !== 'archived' &&
    detail.status !== 'voided'

  const onApprove = async () => {
    if (!organizationId || approving) return
    setApproving(true)
    try {
      const actorLabel = identity.user.name || identity.user.email || 'Admin'
      await approveDocument(organizationId, detail.id, actorLabel)
      showToast(M.doclib_prod_approved, 'ok')
      await load()
    } catch {
      showToast(M.doclib_prod_approve_failed, 'info')
    } finally {
      setApproving(false)
    }
  }

  const onExport = async () => {
    if (!organizationId || exporting || !canExport) return
    setExporting(true)
    try {
      const actorLabel = identity.user.name || identity.user.email || 'Admin'
      const result = await exportSignedDocumentPdf({
        organizationId,
        detail,
        lang,
        actorLabel,
        workspaceLabel: companyName,
        session,
      })
      if (!result.ok) {
        if (result.reason === 'denied' && result.message) {
          showToast(result.message, 'info')
        } else {
          showToast(M.doclib_prod_export_failed, 'info')
        }
        return
      }
      showToast(M.doclib_toast_exported, 'ok')
      await load()
      if (organizationId) {
        setStoredExports(await listDocumentExports(organizationId, detail.id))
      }
    } catch {
      showToast(M.doclib_prod_export_failed, 'info')
    } finally {
      setExporting(false)
    }
  }

  const onVoid = async () => {
    if (voiding || !canVoid) return
    setVoiding(true)
    try {
      await voidDocumentSignature(detail.id)
      showToast(M.doclib_prod_voided, 'info')
      await load()
    } catch {
      showToast(M.doclib_prod_void_failed, 'info')
    } finally {
      setVoiding(false)
    }
  }

  const onArchive = async () => {
    if (archiving || detail.status === 'archived') return
    setArchiving(true)
    try {
      await archiveDocument(detail.id)
      showToast(M.doclib_prod_archived, 'ok')
      await load()
    } catch {
      showToast(M.doclib_prod_archive_failed, 'info')
    } finally {
      setArchiving(false)
    }
  }

  const onCopySigningLink = async (token: string) => {
    const signingLang = detail?.language === 'fr' ? 'fr' : 'en'
    const ok = await copyExternalSigningLink(token, signingLang)
    showToast(
      ok ? M.doclib_external_link_copied : M.doclib_external_link_copy_failed,
      ok ? 'ok' : 'info',
    )
  }

  const onEmailSigningLink = async (recipientId?: string) => {
    if (!organizationId || emailingRecipientId || emailingAll || !detail) return
    if (recipientId) setEmailingRecipientId(recipientId)
    else setEmailingAll(true)
    try {
      const actorLabel = identity.user.name || identity.user.email || 'Admin'
      const result = await sendSigningInviteEmail({
        organizationId,
        documentId: detail.id,
        recipientId,
        actorLabel,
        language: detail.language === 'fr' ? 'fr' : 'en',
      })
      if (result.sent.length > 0) {
        showToast(M.doclib_external_email_sent, 'ok')
        await load()
      } else {
        showToast(M.doclib_external_email_failed, 'info')
      }
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      showToast(
        code === 'no_provider' ? M.doclib_external_email_no_provider : M.doclib_external_email_failed,
        'info',
      )
    } finally {
      setEmailingRecipientId(null)
      setEmailingAll(false)
    }
  }

  const onReissueSigningLink = async (recipientId: string) => {
    if (!organizationId || reissuingRecipientId) return
    setReissuingRecipientId(recipientId)
    try {
      await reissueSigningToken(recipientId)
      showToast(M.doclib_external_reissue_done, 'ok')
      await load()
    } catch {
      showToast(M.doclib_external_reissue_failed, 'info')
    } finally {
      setReissuingRecipientId(null)
    }
  }

  const onDownloadStoredExport = async (row: StoredDocumentExport) => {
    if (downloadingExportId) return
    setDownloadingExportId(row.id)
    try {
      const url = await createDocumentExportDownloadUrl(row.storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showToast(M.doclib_prod_export_failed, 'info')
    } finally {
      setDownloadingExportId(null)
    }
  }

  const onSendForSignature = async (
    modalRecipients: DocRecipient[],
    options?: { emailInvites: boolean },
  ) => {
    if (!organizationId || sending) return
    setSending(true)
    try {
      const actorLabel = identity.user.name || identity.user.email || 'Admin'
      await sendDocumentForSignature(organizationId, detail.id, modalRecipients, actorLabel)
      setIsSignModalOpen(false)
      setTab('recipients')
      await load()

      if (options?.emailInvites) {
        try {
          const result = await sendSigningInviteEmail({
            organizationId,
            documentId: detail.id,
            actorLabel,
            language: detail.language === 'fr' ? 'fr' : 'en',
          })
          showToast(
            result.failed.length > 0
              ? M.doclib_prod_sent_sign_email_failed
              : M.doclib_prod_sent_sign_emailed,
            result.failed.length > 0 ? 'info' : 'ok',
          )
        } catch (err) {
          const code = (err as { code?: string } | null)?.code
          showToast(
            code === 'no_provider'
              ? M.doclib_external_email_no_provider
              : M.doclib_prod_sent_sign_email_failed,
            'info',
          )
        }
      } else {
        showToast(M.doclib_prod_sent_sign, 'info')
      }
    } catch {
      showToast(M.doclib_prod_send_sign_failed, 'info')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-[18px] pb-[48px] pt-[8px] max-[640px]:px-[12px]">
      <Link
        to="/app/documents"
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-text-muted hover:text-text"
      >
        <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        {x(M.doclib_prod_back)}
      </Link>

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[12px] text-text-muted">{detail.ref}</p>
          <h1 className="font-display text-[20px] font-bold tracking-[-0.01em] text-text">
            {x(detail.title)}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DocChip tone={STATUS_TONE[detail.status]}>{x(STATUS_LABEL[detail.status])}</DocChip>
            <DocChip tone={riskInfo.tone}>{x(riskInfo.label)}</DocChip>
            <DocChip tone={reviewInfo.tone}>{x(reviewInfo.label)}</DocChip>
            <JurisdictionPill code={detail.jurisdiction} />
            {template && (
              <span className="text-[12px] text-text-muted">
                {detail.templateTid} · {x(template.name)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <ActBtn variant="primary" onClick={() => void onApprove()} disabled={approving}>
              {x(M.doclib_prod_approve)}
            </ActBtn>
          )}
          {canSendForSignature && (
            <ActBtn variant="primary" onClick={() => setIsSignModalOpen(true)} disabled={sending}>
              {x(M.doclib_prod_send_sign)}
            </ActBtn>
          )}
          {canExport && (
            <ActBtn variant="ghost" onClick={() => void onExport()} disabled={exporting}>
              {x(M.doclib_docd_export)}
            </ActBtn>
          )}
          {canVoid && (
            <ActBtn variant="ghost" onClick={() => void onVoid()} disabled={voiding}>
              {x(M.doclib_prod_void_sign)}
            </ActBtn>
          )}
          {isOrgAdmin && detail.status !== 'archived' && detail.status !== 'voided' && (
            <ActBtn variant="ghost" onClick={() => void onArchive()} disabled={archiving}>
              {x(M.doclib_prod_archive)}
            </ActBtn>
          )}
        </div>
      </header>

      {detail.status === 'draft' && detail.signatureStatus === 'not_sent' && (
        <p className="mb-4 rounded-[10px] border border-border bg-inset px-3 py-2 text-[12.5px] text-text-muted">
          {x(M.doclib_prod_needs_approval)}
        </p>
      )}

      <p className="mb-4 rounded-[10px] border border-border bg-inset px-3 py-2 text-[12.5px] text-text-muted">
        {x(M.doclib_prod_dutiva_signing_note)}
      </p>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-none border-b-2 px-3 py-2 text-[13px] font-semibold ${
              tab === key
                ? 'border-navy text-text'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {x(label)}
          </button>
        ))}
      </div>

      {tab === 'preview' && current && (
        <DocPaper
          blocks={current.content.blocks}
          values={current.content.values}
          docLang={detail.language}
        />
      )}
      {tab === 'preview' && !current && (
        <p className="text-[13px] text-text-muted">{x(M.doclib_prod_detail_missing)}</p>
      )}

      {tab === 'fields' && (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
              <th className="py-2 pr-4">{x(M.doclib_prod_field)}</th>
              <th className="py-2">{x(M.doclib_prod_value)}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(detail.answers).map(([key, value]) => (
              <tr key={key} className="border-b border-border">
                <td className="py-2.5 pr-4 font-mono text-[12px] text-text-muted">{key}</td>
                <td className="py-2.5 text-text">
                  {value.trim() ? value : x(M.doclib_prod_not_filled)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'recipients' && (
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
                  (r) =>
                    r.signingToken &&
                    r.status !== 'signed' &&
                    r.status !== 'declined',
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
                onClick={() => downloadCompletionRecord(completion, lang)}
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
              const info = signatureInfo(recipient.status)
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
                      {x(RECIPIENT_TYPE[recipient.type])} · {recipient.email}
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
                          <span className="block text-risk-fg">{x(M.doclib_external_link_expired)}</span>
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
                      {inviteInfo && (
                        <DocChip tone={inviteInfo.tone}>{x(inviteInfo.label)}</DocChip>
                      )}
                    </div>
                    <div className="mt-0.75 text-[11px] text-text-faint">
                      {recipient.signedAt ? fmtDate(recipient.signedAt, lang) : '—'}
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
      )}

      {tab === 'versions' && (
        <ul className="space-y-3">
          {detail.versions.map((version) => (
            <li
              key={version.id}
              className="rounded-[10px] border border-border bg-surface px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-text">
                  {x(M.doclib_prod_version)} {version.versionNumber}
                </span>
                {version.versionNumber === detail.currentVersion && (
                  <DocChip tone="ok">{x(M.doclib_prod_current)}</DocChip>
                )}
              </div>
              <p className="mt-1 text-[13px] text-text-muted">{x(version.changeSummary)}</p>
              <p className="mt-1 font-mono text-[11px] text-text-faint">
                {new Date(version.createdAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
              </p>
            </li>
          ))}
        </ul>
      )}

      {tab === 'audit' && (
        <ul className="space-y-2">
          {detail.audit.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2.5 text-[13px]"
            >
              <span>
                <span className="font-semibold text-text">
                  {(() => {
                    const label = DOCUMENT_AUDIT_LABEL[event.eventType]
                    return label ? x(label) : event.eventType.replaceAll('_', ' ')
                  })()}
                </span>
                <span className="text-text-muted"> · {event.actorLabel}</span>
                {event.meta && (
                  <span className="font-mono text-[12px] text-text-faint"> · {event.meta}</span>
                )}
              </span>
              <span className="font-mono text-[11px] text-text-faint">
                {new Date(event.createdAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isSignModalOpen && (
        <SignatureModal
          docRef={detail.ref}
          initialRecipients={recipients.map(toDocRecipient)}
          isOpen={isSignModalOpen}
          offerEmailInvites
          onClose={() => setIsSignModalOpen(false)}
          onSend={(modalRecipients, options) => void onSendForSignature(modalRecipients, options)}
        />
      )}

      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  )
}
