import { extractTextFromFile } from '@/lib/fileTextExtraction'

/**
 * Advisor chat attachments — the client half of the multimodal turn.
 *
 * Files become one of two kinds before they ever leave the browser:
 *
 * - `image`    → a base64 data URL, sent upstream as an OpenAI
 *                `image_url` content part. Gated server-side on the active
 *                route's `config.modalities` — a text-only model refuses
 *                the turn before it spends budget.
 * - `document` → text extracted in the browser (PDF/DOCX via
 *                `@/lib/fileTextExtraction`, spreadsheets via
 *                read-excel-file, plain text as-is) and inlined into the
 *                prompt. Any model accepts these — no bytes leave the
 *                machine until the turn is sent.
 *
 * The wire shape mirrors `AdvisorAttachment` in
 * `supabase/functions/_shared/modelUpstream.ts` — keep the caps in step
 * with the server's, which re-validates everything anyway.
 */

export type AdvisorAttachmentKind = 'image' | 'document'

export interface AdvisorAttachment {
  id: string
  kind: AdvisorAttachmentKind
  name: string
  mime: string
  bytes: number
  /** Images only — the base64 data URL sent to the model. */
  dataUrl?: string
  /** Documents only — extracted text sent to the model. */
  text?: string
  /** True when the extracted text hit the per-document cap. */
  truncated?: boolean
}

/** What `advisor-chat` expects on the wire. */
export interface WireAttachment {
  kind: AdvisorAttachmentKind
  name: string
  data_url?: string
  text?: string
}

export type AttachmentIssue =
  'unsupported_type' | 'too_large' | 'empty' | 'too_many' | 'read_failed'

export class AttachmentError extends Error {
  constructor(
    readonly issue: AttachmentIssue,
    message: string,
  ) {
    super(message)
    this.name = 'AttachmentError'
  }
}

export const MAX_ATTACHMENTS = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
/** Below the server's 20k cap — the client truncates, the server re-checks. */
export const MAX_DOCUMENT_TEXT_CHARS = 18_000

const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
/** Extension → mime, for files the OS hands us with no type. */
const EXT_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

function imageMimeFor(file: File): string | null {
  const mime = file.type.toLowerCase()
  if (IMAGE_MIMES.has(mime)) return mime
  const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? null
}
const PLAIN_TEXT_EXTS = /\.(txt|md|csv|tsv|json)$/i
const SPREADSHEET_EXTS = /\.(xlsx|xls)$/i
const RICH_DOC_EXTS = /\.(pdf|docx)$/i

/** `<input accept>` value — images, office documents, and plain-text files. */
export const ATTACHMENT_ACCEPT =
  '.png,.jpg,.jpeg,.webp,.gif,.pdf,.docx,.txt,.md,.csv,.tsv,.json,.xlsx,.xls'

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new AttachmentError('read_failed', 'Could not read the file.'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

function capDocumentText(text: string): { text: string; truncated: boolean } {
  const trimmed = text.trim()
  if (trimmed.length <= MAX_DOCUMENT_TEXT_CHARS) return { text: trimmed, truncated: false }
  return { text: trimmed.slice(0, MAX_DOCUMENT_TEXT_CHARS), truncated: true }
}

async function extractSpreadsheetText(file: File): Promise<string> {
  const { readSheet } = await import('read-excel-file/browser')
  const rows = (await readSheet(file)) as unknown[][]
  return rows
    .map((row) => (row ?? []).map((cell) => (cell == null ? '' : String(cell))).join(' | '))
    .filter((line) => line.replace(/[|\s]/g, '').length > 0)
    .join('\n')
}

async function extractDocumentText(file: File): Promise<{ text: string; truncated: boolean }> {
  const name = file.name.toLowerCase()
  if (PLAIN_TEXT_EXTS.test(name)) return capDocumentText(await file.text())
  if (SPREADSHEET_EXTS.test(name)) return capDocumentText(await extractSpreadsheetText(file))
  if (RICH_DOC_EXTS.test(name)) return capDocumentText(await extractTextFromFile(file))
  throw new AttachmentError('unsupported_type', `Unsupported file type: ${file.name}`)
}

let nextAttachmentId = 1

/** One file → one attachment. Throws `AttachmentError` on any refusal. */
export async function attachmentFromFile(file: File): Promise<AdvisorAttachment> {
  if (file.size === 0) throw new AttachmentError('empty', `${file.name} is empty.`)
  const id = `att-${nextAttachmentId++}`

  const imageMime = imageMimeFor(file)
  if (imageMime) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new AttachmentError('too_large', `${file.name} is too large.`)
    }
    const raw = await readAsDataUrl(file)
    /* FileReader borrows the file's mime for the data URL — a file with no
       reported type yields `data:application/octet-stream`, which no vision
       endpoint accepts. Normalize to the extension-derived mime; the base64
       payload after the comma is untouched. */
    const comma = raw.indexOf(',')
    if (comma < 0) {
      throw new AttachmentError('read_failed', `Could not read ${file.name}.`)
    }
    const dataUrl = `data:${imageMime};base64${raw.slice(comma)}`
    return { id, kind: 'image', name: file.name, mime: imageMime, bytes: file.size, dataUrl }
  }

  const name = file.name.toLowerCase()
  const isDoc =
    PLAIN_TEXT_EXTS.test(name) || SPREADSHEET_EXTS.test(name) || RICH_DOC_EXTS.test(name)
  if (!isDoc) {
    throw new AttachmentError('unsupported_type', `Unsupported file type: ${file.name}`)
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new AttachmentError('too_large', `${file.name} is too large.`)
  }
  const { text, truncated } = await extractDocumentText(file)
  if (!text) throw new AttachmentError('empty', `No readable text in ${file.name}.`)
  return {
    id,
    kind: 'document',
    name: file.name,
    mime: file.type,
    bytes: file.size,
    text,
    truncated,
  }
}

/** Attachments → the JSON body `advisor-chat` validates. */
export function toWireAttachments(attachments: readonly AdvisorAttachment[]): WireAttachment[] {
  return attachments.map((a) =>
    a.kind === 'image'
      ? { kind: 'image', name: a.name, data_url: a.dataUrl }
      : { kind: 'document', name: a.name, text: a.text },
  )
}
