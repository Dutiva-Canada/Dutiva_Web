/**
 * Client-side resume text extraction.
 *
 * PDFs are read with pdfjs-dist and DOCX files are unzipped and parsed with
 * jszip. This keeps the whole flow in the browser — no upload cost or server
 * round-trip for text extraction.
 */

export type ExtractionErrorReason = 'unsupported_type' | 'empty_file' | 'too_large' | 'corrupt' | 'read_failed'

export class ResumeExtractionError extends Error {
  constructor(
    public reason: ExtractionErrorReason,
    message: string,
  ) {
    super(message)
    this.name = 'ResumeExtractionError'
  }
}

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB keeps the browser responsive

function assertValidFile(file: File): void {
  const name = file.name.toLowerCase()
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  const isDoc = file.type === 'application/msword' || name.endsWith('.doc')

  if (!isPdf && !isDocx && !isDoc) {
    throw new ResumeExtractionError('unsupported_type', 'Only PDF and DOCX files are supported.')
  }

  if (isDoc) {
    throw new ResumeExtractionError('unsupported_type', 'Legacy .doc files are not supported.')
  }

  if (file.size === 0) throw new ResumeExtractionError('empty_file', 'The file is empty.')
  if (file.size > MAX_BYTES) {
    throw new ResumeExtractionError('too_large', `The file is too large (max ${MAX_BYTES / 1024 / 1024} MB).`)
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ResumeExtractionError('read_failed', 'Could not read the file.'))
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(file)
  })
}

function pageItemsToText(items: Array<{ str?: string; hasEOL?: boolean; type?: string }>): string {
  let out = ''
  for (const item of items) {
    if (!('str' in item) || item.str == null) continue
    out += item.str + (item.hasEOL ? '\n' : ' ')
  }
  return out.replace(/[ \t]+\n/g, '\n').trim()
}

async function extractTextFromPdf(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  let pdf
  try {
    pdf = await pdfjs.getDocument({ data }).promise
  } catch {
    throw new ResumeExtractionError('corrupt', 'The PDF could not be opened — it may be corrupt or password-protected.')
  }

  const pages: string[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const textContent = await page.getTextContent()
    pages.push(pageItemsToText(textContent.items as Array<{ str?: string; hasEOL?: boolean; type?: string }>))
  }
  return pages.join('\n\n').trim()
}

/**
 * Extract text from a DOCX file by reading word/document.xml inside the zip.
 * Paragraphs and text runs are joined with spaces; paragraphs are separated by
 * line breaks.
 */
async function extractTextFromDocx(data: ArrayBuffer): Promise<string> {
  const JSZip = (await import('jszip')).default
  let zip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    throw new ResumeExtractionError('corrupt', 'The DOCX could not be opened — it may be corrupt.')
  }

  const xml = await zip.file('word/document.xml')?.async('text')
  if (!xml) {
    throw new ResumeExtractionError('corrupt', 'The DOCX does not contain a readable document body.')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const paragraphs = doc.getElementsByTagName('w:p')
  const pageText: string[] = []

  for (const p of paragraphs) {
    const runs = p.getElementsByTagName('w:r')
    const parts: string[] = []
    for (const r of runs) {
      const texts = r.getElementsByTagName('w:t')
      for (const t of texts) {
        parts.push(t.textContent ?? '')
      }
    }
    const joined = parts.join('').trim()
    if (joined) pageText.push(joined)
  }

  return pageText.join('\n').trim()
}

export async function extractTextFromFile(file: File): Promise<string> {
  assertValidFile(file)
  const data = await readFileAsArrayBuffer(file)
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) return extractTextFromPdf(data)
  return extractTextFromDocx(data)
}
