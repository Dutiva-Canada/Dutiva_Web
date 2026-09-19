import { describe, expect, it } from 'vitest'
import {
  ATTACHMENT_ACCEPT,
  AttachmentError,
  MAX_DOCUMENT_TEXT_CHARS,
  MAX_IMAGE_BYTES,
  attachmentFromFile,
  toWireAttachments,
} from './attachments'

/**
 * The client half of multimodal turns. What these tests pin: images become
 * data URLs, documents become extracted text (never raw bytes), refusals
 * carry a typed issue the composer maps to copy, and the wire shape matches
 * what `advisor-chat` re-validates server-side.
 */

function fileOf(name: string, content: string, type = ''): File {
  return new File([content], name, { type })
}

describe('attachmentFromFile', () => {
  it('plain-text files become document attachments with their text', async () => {
    const a = await attachmentFromFile(fileOf('notes.txt', 'line one\nline two', 'text/plain'))
    expect(a.kind).toBe('document')
    expect(a.name).toBe('notes.txt')
    expect(a.text).toBe('line one\nline two')
    expect(a.truncated).toBe(false)
  })

  it('images become data-URL attachments', async () => {
    const a = await attachmentFromFile(fileOf('posting.png', 'fakepngbytes', 'image/png'))
    expect(a.kind).toBe('image')
    expect(a.dataUrl?.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('extension fallback works when the browser reports no mime', async () => {
    const a = await attachmentFromFile(fileOf('photo.webp', 'x'))
    expect(a.kind).toBe('image')
  })

  it('refuses unsupported types, empty files, and oversized images', async () => {
    await expect(attachmentFromFile(fileOf('run.exe', 'MZ'))).rejects.toMatchObject({
      issue: 'unsupported_type',
    })
    await expect(attachmentFromFile(fileOf('empty.txt', ''))).rejects.toMatchObject({
      issue: 'empty',
    })
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' })
    await expect(attachmentFromFile(big)).rejects.toMatchObject({ issue: 'too_large' })
  })

  it('truncates oversized document text and flags it', async () => {
    const a = await attachmentFromFile(
      fileOf('long.txt', 'x'.repeat(MAX_DOCUMENT_TEXT_CHARS + 500), 'text/plain'),
    )
    expect(a.text?.length).toBe(MAX_DOCUMENT_TEXT_CHARS)
    expect(a.truncated).toBe(true)
  })

  it('throws a typed AttachmentError, not a bare string', async () => {
    try {
      await attachmentFromFile(fileOf('bad.bin', 'x'))
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(AttachmentError)
    }
  })
})

describe('toWireAttachments', () => {
  it('maps to the server wire shape — data_url for images, text for documents', async () => {
    const image = await attachmentFromFile(fileOf('p.png', 'png', 'image/png'))
    const doc = await attachmentFromFile(fileOf('d.txt', 'hello', 'text/plain'))
    const wire = toWireAttachments([image, doc])
    expect(wire[0]).toEqual({ kind: 'image', name: 'p.png', data_url: image.dataUrl })
    expect(wire[1]).toEqual({ kind: 'document', name: 'd.txt', text: 'hello' })
  })
})

describe('ATTACHMENT_ACCEPT', () => {
  it('covers the supported extensions', () => {
    for (const ext of ['.png', '.jpg', '.webp', '.pdf', '.docx', '.txt', '.csv', '.xlsx']) {
      expect(ATTACHMENT_ACCEPT).toContain(ext)
    }
  })
})
