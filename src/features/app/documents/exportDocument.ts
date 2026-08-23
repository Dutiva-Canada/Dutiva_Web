import type { Session } from '@supabase/supabase-js'
import type { Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import {
  authorizeExport,
  exportDenialMessage,
  exportFilename,
  triggerDownload,
  watermarkFooterLines,
} from '@/lib/exportProtection'
import type { ProductionDocumentDetail } from './productionApi'
import { blocksToPlainTextExport } from './documentPlainText'
import { completionRecordText, buildSigningCompletionRecord } from './completionRecord'
import { recordDocumentExport } from './exportDocumentApi'
import { buildSignedDocumentPdf } from './signedDocumentPdf'
import { uploadDocumentExportPdf } from './exportStorageApi'

export interface ExportSignedDocumentInput {
  organizationId: string
  detail: ProductionDocumentDetail
  lang: Lang
  actorLabel: string
  workspaceLabel: string
  session: Session | null
}

export type ExportSignedDocumentResult =
  | { ok: true; exportId: string }
  | { ok: false; reason: 'not_signed' | 'denied'; message?: ReturnType<typeof exportDenialMessage> }

/**
 * Export a fully signed HR document as a watermarked PDF — document body with
 * captured signature names/images + completion appendix. Persists a copy in
 * Supabase Storage (migration 0081) and records hr_document_exports.
 */
export async function exportSignedDocumentPdf(
  input: ExportSignedDocumentInput,
): Promise<ExportSignedDocumentResult> {
  if (input.detail.signatureStatus !== 'signed' || !input.detail.signature) {
    return { ok: false, reason: 'not_signed' }
  }

  const current = input.detail.versions.find(
    (v) => v.versionNumber === input.detail.currentVersion,
  )
  if (!current) return { ok: false, reason: 'not_signed' }

  const title = pick(input.detail.title, input.detail.language)
  const body = blocksToPlainTextExport(
    current.content.blocks,
    current.content.values,
    input.detail.language,
    input.detail.recipients,
  )

  const completion = buildSigningCompletionRecord(
    input.detail,
    input.detail.signature,
    input.detail.recipients,
  )
  const appendix = completion
    ? completionRecordText(completion, input.detail.language).split('\n\n')
    : []

  const paragraphs = [...body.paragraphs, ...appendix]
  const content = [title, ...paragraphs].join('\n\n')

  const decision = await authorizeExport({
    surface: 'doclib',
    kind: 'pdf',
    title,
    content,
    lang: input.lang,
    actorLabel: input.actorLabel,
    workspaceLabel: input.workspaceLabel,
    session: input.session,
  })

  if (!decision.allowed) {
    return { ok: false, reason: 'denied', message: exportDenialMessage(decision) }
  }

  const { stamp } = decision
  const footerLines = watermarkFooterLines(stamp, input.lang)
  const bytes = await buildSignedDocumentPdf({
    title,
    paragraphs,
    signatureImages: body.signatureImages,
    footerLines,
    exportId: stamp.exportId,
    author: stamp.actorLabel,
    workspaceLabel: stamp.workspaceLabel,
    createdAt: stamp.exportedAt,
  })

  const stored = await uploadDocumentExportPdf(
    input.organizationId,
    input.detail.id,
    stamp.exportId,
    bytes,
  )

  triggerDownload(
    exportFilename(title, 'pdf', stamp.exportedAt),
    new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
  )

  await recordDocumentExport(
    input.organizationId,
    input.detail.id,
    current.versionNumber,
    'pdf',
    stamp.exportId,
    decision.recordedRemotely,
    input.actorLabel,
    stored,
  )

  return { ok: true, exportId: stamp.exportId }
}
