import { describe, expect, it, vi, beforeEach } from 'vitest'

const uploadMock = vi.hoisted(() => vi.fn())
const removeMock = vi.hoisted(() => vi.fn())
const invokeMock = vi.hoisted(() => vi.fn())
const getUserMock = vi.hoisted(() => vi.fn())
const fromMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: getUserMock },
    storage: { from: () => ({ upload: uploadMock, remove: removeMock }) },
    functions: { invoke: invokeMock },
    from: fromMock,
  },
}))

import {
  formatBytes,
  getAttachmentDownloadUrl,
  listAttachments,
  uploadAttachment,
  validateAttachment,
  ATTACHMENT_MAX_SIZE,
} from './attachmentsApi'

const attachmentRow = {
  id: 'att-1',
  file_name: 'report.pdf',
  mime_type: 'application/pdf',
  size_bytes: 2048,
  scan_status: 'pending',
  created_at: '2026-07-16T00:00:00Z',
}

describe('validateAttachment', () => {
  it('accepts an allowed type under the size limit', () => {
    expect(validateAttachment({ size: 1000, type: 'image/png' })).toBeNull()
  })
  it('rejects an oversized file', () => {
    expect(validateAttachment({ size: ATTACHMENT_MAX_SIZE + 1, type: 'image/png' })).toBe(
      'too_large',
    )
  })
  it('rejects a disallowed type', () => {
    expect(validateAttachment({ size: 10, type: 'application/x-msdownload' })).toBe('bad_type')
  })
})

describe('formatBytes', () => {
  it('formats bytes, KB, and MB', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(1572864)).toBe('1.5 MB')
  })
})

describe('uploadAttachment', () => {
  beforeEach(() => {
    uploadMock.mockReset()
    invokeMock.mockReset()
    getUserMock.mockReset()
    removeMock.mockReset()
  })

  it('uploads under the user/ticket prefix then records metadata', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'uid-1' } } })
    uploadMock.mockResolvedValue({ error: null })
    invokeMock.mockResolvedValue({ data: { data: attachmentRow }, error: null })

    const file = new File(['hello'], 'report.pdf', { type: 'application/pdf' })
    const result = await uploadAttachment('ticket-9', file)

    const [path] = uploadMock.mock.calls[0] as [string]
    expect(path.startsWith('uid-1/ticket-9/')).toBe(true)
    const [fn, opts] = invokeMock.mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(fn).toBe('support-attachment-action')
    expect(opts.body).toMatchObject({ action: 'record', ticket_id: 'ticket-9', storage_path: path })
    expect(result.id).toBe('att-1')
  })

  it('removes the orphaned object when recording fails', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'uid-1' } } })
    uploadMock.mockResolvedValue({ error: null })
    invokeMock.mockResolvedValue({ data: null, error: { message: 'nope' } })
    removeMock.mockResolvedValue({ error: null })

    const file = new File(['hello'], 'report.pdf', { type: 'application/pdf' })
    await expect(uploadAttachment('ticket-9', file)).rejects.toBeTruthy()
    expect(removeMock).toHaveBeenCalledOnce()
  })
})

describe('getAttachmentDownloadUrl', () => {
  beforeEach(() => invokeMock.mockReset())
  it('returns the signed URL from the edge function', async () => {
    invokeMock.mockResolvedValue({
      data: { data: { url: 'https://signed.example/x' } },
      error: null,
    })
    expect(await getAttachmentDownloadUrl('att-1')).toBe('https://signed.example/x')
  })
})

describe('listAttachments', () => {
  it('maps the RLS-scoped rows', async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({ order: () => Promise.resolve({ data: [attachmentRow], error: null }) }),
      }),
    })
    const list = await listAttachments('ticket-9')
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: 'att-1', fileName: 'report.pdf', sizeBytes: 2048 })
  })
})
