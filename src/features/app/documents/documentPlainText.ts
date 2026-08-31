import type { Lang } from '@/i18n/core'
import { mergeSegments, splitBilingualBody, splitProseParagraphs } from './engine'
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

function pushResolvedProseParagraphs(
  paragraphs: string[],
  text: string,
  values: Record<string, string>,
): void {
  for (const part of splitProseParagraphs(resolveMergeText(text, values))) {
    if (part.trim()) paragraphs.push(part)
  }
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
  options?: {
    bilingual?: boolean
    valuesByLang?: { en: Record<string, string>; fr: Record<string, string> }
  },
): PlainTextExport {
  if (options?.bilingual && options.valuesByLang) {
    const { body, tail } = splitBilingualBody(blocks)
    const en = blocksToPlainTextExport(body, options.valuesByLang.en, 'en', recipients)
    const fr = blocksToPlainTextExport(body, options.valuesByLang.fr, 'fr', recipients)
    const tailPart =
      tail.length > 0
        ? blocksToPlainTextExport(tail, options.valuesByLang.en, 'en', recipients)
        : { paragraphs: [], signatureImages: [] as PlainTextExport['signatureImages'] }
    return {
      paragraphs: [...en.paragraphs, 'Version française', ...fr.paragraphs, ...tailPart.paragraphs],
      signatureImages: [...en.signatureImages, ...fr.signatureImages, ...tailPart.signatureImages],
    }
  }

  const paragraphs: string[] = []
  const signatureImages: PlainTextExport['signatureImages'] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'letterhead': {
        const body = resolveMergeText(blockCopy(block, lang), values)
        const date = block.dateText ? resolveMergeText(block.dateText[lang], values) : ''
        const combined = [body, date].filter((part) => part.trim()).join('\n\n')
        if (combined.trim()) paragraphs.push(combined)
        break
      }
      case 'title':
      case 'meta':
      case 'address':
      case 'para':
      case 'ack': {
        pushResolvedProseParagraphs(paragraphs, blockCopy(block, lang), values)
        break
      }
      case 'clause': {
        const heading = block.heading ? block.heading[lang] : ''
        const prefix = block.n !== undefined ? `${block.n}. ${heading}` : heading
        const parts = splitProseParagraphs(resolveMergeText(blockCopy(block, lang), values))
        if (parts.length === 0) break
        if (prefix) paragraphs.push(`${prefix}\n${parts[0]}`)
        else paragraphs.push(parts[0]!)
        for (const part of parts.slice(1)) paragraphs.push(part)
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
        const label =
          block.tone === 'risk'
            ? lang === 'fr'
              ? 'Avis'
              : 'Notice'
            : lang === 'fr'
              ? 'Note'
              : 'Note'
        const parts = splitProseParagraphs(resolveMergeText(blockCopy(block, lang), values))
        if (parts.length === 0) break
        paragraphs.push(`${label}: ${parts[0]}`)
        for (const part of parts.slice(1)) paragraphs.push(part)
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
            paragraphs.push(`${label}\n${recipient.signedName ?? recipient.name}\n${signedAt}`)
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
        pushResolvedProseParagraphs(paragraphs, blockCopy(block, lang), values)
      }
    }
  }

  return { paragraphs, signatureImages }
}
