import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { Disclaimer } from '@/components/Disclaimer'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { ActBtn, DocChip, DocPaper, JurisdictionPill, Skel } from '../components'
import { SignatureModal } from '../components/SignatureModal'
import { reviewStatusInfo, riskLevelInfo, templateByTid, type DocRecipient } from '../data'
import { archiveDocument, approveDocument, getDocument } from '../productionApi'
import { bilingualMergeValues, isBilingualDelivery } from '../engine'
import type { ProductionDocumentDetail } from '../productionApi'
import { DOCUMENT_AUDIT_LABEL } from '../auditLabels'
import {
  buildSigningCompletionRecord,
  completionRecordText,
  downloadCompletionRecord,
} from '../completionRecord'
import { exportSignedDocumentPdf } from '../exportDocument'
import { createDocumentExportDownloadUrl, listDocumentExports } from '../exportStorageApi'
import type { StoredDocumentExport } from '../exportStorageApi'
import { authorizeExport, exportDenialMessage } from '@/lib/exportProtection/authorize'
import { copyExternalSigningLink } from '../signingUrls'
import { sendSigningInviteEmail } from '../signingInviteApi'
import { reissueSigningToken } from '../signingTokenApi'
import {
  currentSigningTurn,
  sendDocumentForSignature,
  toDocRecipient,
  voidDocumentSignature,
} from '../signatureApi'
import { countUndeliveredInvites } from '../signatureQueries'
import {
  PROD_DETAIL_TABS,
  PROD_STATUS_LABEL,
  PROD_STATUS_TONE,
  type ProdDetailTab,
} from './documentDetailProductionMeta'
import { RecipientsTab } from './DocumentDetailRecipientsTab'

/**
 * Document detail in production mode — preview from frozen content_json,
 * fields from answers, versions + audit from DB, Dutiva Signature workflow.
 */

type TabKey = ProdDetailTab

export function DocumentDetailProductionView() {
  const { docId } = useParams()
  const { x, lang } = useI18n()
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
  const bilingual = template ? isBilingualDelivery(template) : false
  const valuesByLang =
    bilingual && template
      ? bilingualMergeValues(template, detail.answers, detail.jurisdiction)
      : undefined
  const riskInfo = riskLevelInfo[detail.risk]
  const reviewInfo = reviewStatusInfo[detail.reviewStatus]
  const signature = detail.signature
  const recipients = [...detail.recipients].sort((a, b) => a.order - b.order)
  const undeliveredInviteCount = countUndeliveredInvites(recipients)
  const turn = currentSigningTurn(recipients)
  const completion = signature ? buildSigningCompletionRecord(detail, signature, recipients) : null
  const canApprove =
    isOrgAdmin && detail.status === 'draft' && detail.signatureStatus === 'not_sent'
  const canSendForSignature =
    isOrgAdmin && detail.signatureStatus === 'not_sent' && detail.status === 'approved'
  const canVoid =
    isOrgAdmin && signature && detail.signatureStatus !== 'voided' && detail.status !== 'archived'
  const canExport =
    isOrgAdmin &&
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
      setStoredExports(await listDocumentExports(organizationId, detail.id))
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
        code === 'no_provider'
          ? M.doclib_external_email_no_provider
          : M.doclib_external_email_failed,
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
    if (downloadingExportId || !organizationId) return
    setDownloadingExportId(row.id)
    try {
      const actorLabel = identity.user.name || identity.user.email || 'Admin'
      const title = pick(detail.title, lang)
      const decision = await authorizeExport({
        surface: 'doclib',
        kind: 'pdf',
        title,
        content: row.fileSha256 ?? row.storagePath,
        lang,
        actorLabel,
        workspaceLabel: companyName,
        session,
      })
      if (!decision.allowed) {
        showToast(exportDenialMessage(decision), 'info')
        return
      }
      const url = await createDocumentExportDownloadUrl(row.storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showToast(M.doclib_prod_export_failed, 'info')
    } finally {
      setDownloadingExportId(null)
    }
  }

  const onDownloadCompletionRecord = async () => {
    if (!completion) return
    const actorLabel = identity.user.name || identity.user.email || 'Admin'
    const text = completionRecordText(completion, lang)
    const decision = await authorizeExport({
      surface: 'doclib',
      kind: 'text',
      title: pick(completion.title, lang),
      content: text,
      lang,
      actorLabel,
      workspaceLabel: companyName,
      session,
    })
    if (!decision.allowed) {
      showToast(exportDenialMessage(decision), 'info')
      return
    }
    downloadCompletionRecord(completion, lang)
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
            <DocChip tone={PROD_STATUS_TONE[detail.status]}>
              {x(PROD_STATUS_LABEL[detail.status])}
            </DocChip>
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
        {PROD_DETAIL_TABS.map(([key, label]) => (
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
          values={valuesByLang?.en ?? current.content.values}
          valuesByLang={valuesByLang}
          bilingual={bilingual}
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
            {Object.entries(detail.answers).map(([key, value]) => {
              const question = template?.questions.find((q) => q.id === key)
              return (
                <tr key={key} className="border-b border-border">
                  <td className="py-2.5 pr-4 text-[13px] text-text-muted">
                    {question ? x(question.label) : key.replaceAll('_', ' ')}
                  </td>
                  <td className="py-2.5 text-text">
                    {value.trim() ? value : x(M.doclib_prod_not_filled)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {tab === 'recipients' && (
        <RecipientsTab
          recipients={recipients}
          signature={signature}
          completion={completion}
          turn={turn}
          undeliveredInviteCount={undeliveredInviteCount}
          storedExports={storedExports}
          downloadingExportId={downloadingExportId}
          emailingRecipientId={emailingRecipientId}
          emailingAll={emailingAll}
          reissuingRecipientId={reissuingRecipientId}
          isOrgAdmin={isOrgAdmin}
          onEmailSigningLink={onEmailSigningLink}
          onCopySigningLink={onCopySigningLink}
          onReissueSigningLink={onReissueSigningLink}
          onDownloadStoredExport={onDownloadStoredExport}
          onDownloadCompletionRecord={onDownloadCompletionRecord}
        />
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
