import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { wrapLine } from '@/lib/exportProtection/artifacts/textPdf'

export interface SignedDocumentPdfInput {
  title: string
  paragraphs: string[]
  /** PNG data URLs placed immediately after the indexed paragraph. */
  signatureImages: Array<{ afterParagraphIndex: number; dataUrl: string }>
  footerLines: [string, string]
  exportId: string
  author: string
  workspaceLabel: string
  createdAt: Date
}

const PAGE_W = 612
const PAGE_H = 792
const MARGIN_X = 56
const BODY_TOP = 716
const BODY_BOTTOM = 84
const TITLE_SIZE = 13
const BODY_SIZE = 10.5
const BODY_LEADING = 15.5
const FOOTER_SIZE = 6.5
const BODY_WRAP = Math.floor((PAGE_W - MARGIN_X * 2) / (BODY_SIZE * 0.5))
const SIGNATURE_MAX_W = 180
const SIGNATURE_MAX_H = 48

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? (dataUrl.split(',')[1] ?? '') : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

interface LayoutBlock {
  kind: 'title' | 'text' | 'image'
  text?: string
  dataUrl?: string
  gap: number
}

function layoutBlocks(input: SignedDocumentPdfInput): LayoutBlock[] {
  const blocks: LayoutBlock[] = []
  for (const wrapped of wrapLine(
    input.title,
    Math.floor((PAGE_W - MARGIN_X * 2) / (TITLE_SIZE * 0.55)),
  )) {
    blocks.push({ kind: 'title', text: wrapped, gap: 0 })
  }

  input.paragraphs.forEach((paragraph, index) => {
    let first = true
    for (const raw of paragraph.split('\n')) {
      for (const wrapped of wrapLine(raw, BODY_WRAP)) {
        blocks.push({
          kind: 'text',
          text: wrapped,
          gap: first ? BODY_LEADING * 0.75 : 0,
        })
        first = false
      }
    }
    const image = input.signatureImages.find((img) => img.afterParagraphIndex === index)
    if (image) {
      blocks.push({ kind: 'image', dataUrl: image.dataUrl, gap: BODY_LEADING * 0.35 })
    }
  })

  return blocks
}

/**
 * Watermarked PDF export with embedded captured signature images (pdf-lib).
 * Used for fully signed HR documents after Dutiva Signature completes.
 */
export async function buildSignedDocumentPdf(input: SignedDocumentPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(input.title)
  pdf.setAuthor(input.author)
  pdf.setSubject(input.workspaceLabel)
  pdf.setKeywords([`dutiva-export-id:${input.exportId}`])
  pdf.setCreationDate(input.createdAt)
  pdf.setProducer('Dutiva export protection')

  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica)
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold)
  const embeddedImages = new Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>()

  for (const block of layoutBlocks(input)) {
    if (block.kind === 'image' && block.dataUrl) {
      if (!embeddedImages.has(block.dataUrl)) {
        embeddedImages.set(block.dataUrl, await pdf.embedPng(dataUrlToBytes(block.dataUrl)))
      }
    }
  }

  let page = pdf.addPage([PAGE_W, PAGE_H])
  let y = BODY_TOP

  const drawFooter = () => {
    page.drawText(input.footerLines[0], {
      x: MARGIN_X,
      y: 40,
      size: FOOTER_SIZE,
      font: bodyFont,
      color: rgb(0.45, 0.47, 0.51),
    })
    page.drawText(input.footerLines[1], {
      x: MARGIN_X,
      y: 31,
      size: FOOTER_SIZE,
      font: bodyFont,
      color: rgb(0.45, 0.47, 0.51),
    })
  }

  const newPage = () => {
    drawFooter()
    page = pdf.addPage([PAGE_W, PAGE_H])
    y = BODY_TOP
  }

  for (const block of layoutBlocks(input)) {
    if (block.kind === 'image' && block.dataUrl) {
      const image = embeddedImages.get(block.dataUrl)
      if (!image) continue
      const scale = Math.min(SIGNATURE_MAX_W / image.width, SIGNATURE_MAX_H / image.height, 1)
      const drawH = image.height * scale
      y -= block.gap
      if (y - drawH < BODY_BOTTOM) newPage()
      page.drawImage(image, {
        x: MARGIN_X,
        y: y - drawH,
        width: image.width * scale,
        height: drawH,
      })
      y -= drawH + BODY_LEADING * 0.5
      continue
    }

    const isTitle = block.kind === 'title'
    const size = isTitle ? TITLE_SIZE : BODY_SIZE
    y -= block.gap
    if (y - (isTitle ? TITLE_SIZE + 6 : BODY_LEADING) < BODY_BOTTOM) newPage()
    page.drawText(block.text ?? '', {
      x: MARGIN_X,
      y: y - size,
      size,
      font: isTitle ? titleFont : bodyFont,
      color: rgb(0, 0, 0),
    })
    y -= isTitle ? TITLE_SIZE + 6 : BODY_LEADING
  }

  drawFooter()
  return pdf.save()
}
