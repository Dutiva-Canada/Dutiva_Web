import type { Lang } from '@/i18n/core'
import { mergeSegments } from './engine'
import type { PreviewBlock } from './data'
import type { ProductionDocumentRecipient } from './signatureQueries'

export interface PlainTextExport {
  paragraphs: string[]
  signatureImages: Array<{ afterParagraphIndex: number; dataUrl: string }>
}

function resolveMergeText(text: string, values: Record<string, string>): string {
  return mergeSegments(text, values)
    .map((segment) => segment.text)
    .join('')
}

function blockCopy(block: PreviewBlock, lang: Lang): string {
  return block.text?.[lang] ?? ''
}

/**
 * Flatten frozen document blocks to plain paragraphs for PDF/text export.
 * Signature blocks substitute captured signer names when recipients are provided.
 */
export function blocksToPlainText(
  blocks: PreviewBlock[],
  values: Record<string, string>,
  lang: Lang,
  recipients?: ProductionDocumentRecipient[],
): string[] {
  return blocksToPlainTextExport(blocks, values, lang, recipients).paragraphs
}

/**
 * Flatten frozen document blocks to plain paragraphs for PDF/text export.
 * Signature blocks substitute captured signer names and record image placement.
 */
export function blocksToPlainTextExport(
  blocks: PreviewBlock[],
  values: Record<string, string>,
  lang: Lang,
  recipients?: ProductionDocumentRecipient[],
): PlainTextExport {
  const paragraphs: string[] = []
  const signatureImages: PlainTextExport['signatureImages'] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'title':
      case 'meta':
      case 'para':
      case 'ack': {
        const text = resolveMergeText(blockCopy(block, lang), values)
        if (text.trim()) paragraphs.push(text)
        break
      }
      case 'clause': {
        const heading = block.heading ? block.heading[lang] : ''
        const prefix = block.n !== undefined ? `${block.n}. ${heading}` : heading
        const body = resolveMergeText(blockCopy(block, lang), values)
        paragraphs.push(prefix ? `${prefix}\n${body}` : body)
        break
      }
      case 'fill': {
        const heading = block.heading ? block.heading[lang] : ''
        const prefix = block.n !== undefined ? `${block.n}. ${heading}` : heading
        const prompt = resolveMergeText(blockCopy(block, lang), values)
        const lines = '_'.repeat(32)
        const ruled = Array.from({ length: block.lines ?? 3 }, () => lines).join('\n')
        paragraphs.push([prefix, prompt, ruled].filter(Boolean).join('\n'))
        break
      }
      case 'note': {
        const label = block.tone === 'risk' ? (lang === 'fr' ? 'Avis' : 'Notice') : lang === 'fr' ? 'Note' : 'Note'
        paragraphs.push(`${label}: ${resolveMergeText(blockCopy(block, lang), values)}`)
        break
      }
      case 'sig': {
        const roles = block.roles ?? []
        roles.forEach((role, index) => {
          const label = role[lang]
          const recipient =
            recipients?.find((r) => r.order === index + 1) ??
            recipients?.find((_, i) => i === index)
          if (recipient?.status === 'signed') {
            const signedAt = recipient.signedAt?.slice(0, 10) ?? ''
            paragraphs.push(
              `${label}\n${recipient.signedName ?? recipient.name}\n${signedAt}`,
            )
            if (recipient.signatureImage?.startsWith('data:image/png')) {
              signatureImages.push({
                afterParagraphIndex: paragraphs.length - 1,
                dataUrl: recipient.signatureImage,
              })
            }
          } else {
            paragraphs.push(`${label}\n_________________________`)
          }
        })
        break
      }
      default: {
        const text = resolveMergeText(blockCopy(block, lang), values)
        if (text.trim()) paragraphs.push(text)
      }
    }
  }

  return { paragraphs, signatureImages }
}
