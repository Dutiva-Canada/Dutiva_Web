import {
  Document,
  Footer,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx'
import type { Lang } from '@/i18n/core'

/**
 * Word (.docx) export — OOXML via the `docx` package (lazy /app boundary only).
 *
 * Fingerprint channels in this artifact (fingerprint.ts):
 *   - the invisible zero-width tag, inline at the end of the body text —
 *     survives copy-paste out of the opened document;
 *   - core keywords + custom property `dutiva-export-id` — survive re-saves
 *     that keep the OOXML package;
 *   - the visible watermark block at the end, plus a page footer.
 */

export interface WordDocInput {
  title: string
  paragraphs: string[]
  footerLines: [string, string]
  invisibleTag: string
  exportId: string
  author: string
  workspaceLabel: string
  lang: Lang
}

function paragraphRuns(text: string, opts?: { size?: number; color?: string }): TextRun[] {
  const size = opts?.size ?? 22
  const color = opts?.color
  const lines = text.split('\n')
  const runs: TextRun[] = []
  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) runs.push(new TextRun({ break: 1 }))
    runs.push(
      new TextRun({
        text: lines[i]!,
        font: 'Georgia',
        size,
        ...(color ? { color } : {}),
      }),
    )
  }
  return runs
}

/** Build a real OOXML `.docx` (not Word HTML). */
export async function buildWordDoc(input: WordDocInput): Promise<Uint8Array> {
  const [identity, confidential] = input.footerLines
  const locale = input.lang === 'fr' ? 'fr-CA' : 'en-CA'

  const bodyParagraphs = input.paragraphs.map(
    (text) =>
      new Paragraph({
        spacing: { after: 200, line: 276 },
        children: paragraphRuns(text),
      }),
  )

  const doc = new Document({
    title: input.title,
    creator: input.author,
    keywords: `dutiva-export-id:${input.exportId}`,
    description: `Dutiva workspace: ${input.workspaceLabel} (${locale})`,
    customProperties: [
      { name: 'dutiva-export-id', value: input.exportId },
      { name: 'dutiva-workspace', value: input.workspaceLabel },
      { name: 'dutiva-lang', value: locale },
    ],
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: paragraphRuns(identity, { size: 16, color: '6A7280' }),
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: input.title,
                font: 'Georgia',
                size: 32,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D3D8DE', space: 1 },
            },
            spacing: { after: 280 },
            children: [],
          }),
          ...bodyParagraphs,
          new Paragraph({
            children: [new TextRun({ text: input.invisibleTag })],
          }),
          new Paragraph({
            border: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'D3D8DE', space: 8 },
            },
            spacing: { before: 400 },
            children: paragraphRuns(`${identity}\n${confidential}`, {
              size: 17,
              color: '6A7280',
            }),
          }),
        ],
      },
    ],
  })

  /* Prefer ArrayBuffer so browser and Node tests share one shape (no Buffer). */
  const buffer = await Packer.toArrayBuffer(doc)
  return new Uint8Array(buffer)
}
