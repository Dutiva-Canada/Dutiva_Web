import type { Bi } from '@/i18n/core'
import type { ProductionDocumentDetail } from './productionApi'
import type { ProductionDocumentRecipient } from './signatureQueries'
import type { ProductionDocumentSignature } from './signatureQueries'

export interface SigningCompletionRecord {
  ref: string
  title: Bi
  envelopeId: string
  provider: string
  contentHash: string | null
  completedAt: string
  signers: Array<{
    name: string
    email: string
    order: number
    signedAt: string
    signedName: string | null
  }>
}

export function buildSigningCompletionRecord(
  detail: ProductionDocumentDetail,
  signature: ProductionDocumentSignature,
  recipients: ProductionDocumentRecipient[],
): SigningCompletionRecord | null {
  const signed = recipients.filter((r) => r.status === 'signed' && r.signedAt)
  if (signed.length === 0 || detail.signatureStatus !== 'signed') return null

  const completedAt = signed
    .map((r) => r.signedAt!)
    .sort()
    .at(-1)!

  return {
    ref: detail.ref,
    title: detail.title,
    envelopeId: signature.envelopeId,
    provider: signature.provider,
    contentHash: signature.contentHash ?? null,
    completedAt,
    signers: signed
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        name: r.name,
        email: r.email,
        order: r.order,
        signedAt: r.signedAt!,
        signedName: r.signedName,
      })),
  }
}

export function completionRecordText(record: SigningCompletionRecord, lang: 'en' | 'fr'): string {
  const title = lang === 'fr' ? record.title.fr : record.title.en
  const lines =
    lang === 'fr'
      ? [
          'Dutiva — registre de complétion de signature',
          `Référence : ${record.ref}`,
          `Document : ${title}`,
          `Enveloppe : ${record.envelopeId}`,
          `Fournisseur : ${record.provider}`,
          record.contentHash ? `Empreinte du contenu : ${record.contentHash}` : null,
          `Complété le : ${record.completedAt}`,
          '',
          'Signataires :',
          ...record.signers.map(
            (s) => `${s.order}. ${s.signedName ?? s.name} <${s.email}> — ${s.signedAt}`,
          ),
          '',
          'Ce registre atteste des signatures capturées dans Dutiva. Il ne constitue pas un avis juridique sur la validité d’une signature électronique dans votre contexte.',
        ]
      : [
          'Dutiva — signature completion record',
          `Reference: ${record.ref}`,
          `Document: ${title}`,
          `Envelope: ${record.envelopeId}`,
          `Provider: ${record.provider}`,
          record.contentHash ? `Content fingerprint: ${record.contentHash}` : null,
          `Completed: ${record.completedAt}`,
          '',
          'Signers:',
          ...record.signers.map(
            (s) => `${s.order}. ${s.signedName ?? s.name} <${s.email}> — ${s.signedAt}`,
          ),
          '',
          'This record attests to signatures captured in Dutiva. It is not legal advice on whether an electronic signature is sufficient for your circumstances.',
        ]

  return lines.filter(Boolean).join('\n')
}

export function downloadCompletionRecord(record: SigningCompletionRecord, lang: 'en' | 'fr'): void {
  const blob = new Blob([completionRecordText(record, lang)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${record.ref}-completion.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}
