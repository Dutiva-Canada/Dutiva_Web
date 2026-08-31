import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const listAttachments = vi.hoisted(() => vi.fn())
const uploadAttachment = vi.hoisted(() => vi.fn())
const getAttachmentDownloadUrl = vi.hoisted(() => vi.fn())

vi.mock('./attachmentsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./attachmentsApi')>()
  return { ...actual, listAttachments, uploadAttachment, getAttachmentDownloadUrl }
})

import { SupportAttachments } from './SupportAttachments'
import { AttachmentBlockedError } from './attachmentsApi'

const existing = {
  id: 'att-1',
  fileName: 'screenshot.png',
  mimeType: 'image/png',
  sizeBytes: 2048,
  scanStatus: 'pending',
  createdAt: '2026-07-16T00:00:00Z',
}

describe('SupportAttachments', () => {
  beforeEach(() => {
    listAttachments.mockReset().mockResolvedValue([])
    uploadAttachment.mockReset()
    getAttachmentDownloadUrl.mockReset()
  })

  it('renders nothing when there are no files and uploads are disabled', () => {
    renderApp(<SupportAttachments ticketId="t1" canUpload={false} />)
    expect(screen.queryByText('Attachments')).toBeNull()
  })

  it('lists existing attachments with a download control', async () => {
    listAttachments.mockResolvedValue([existing])
    renderApp(<SupportAttachments ticketId="t1" canUpload={false} />)
    expect(await screen.findByText('screenshot.png')).toBeInTheDocument()
    expect(screen.getByText('2 KB')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download/ })).toBeInTheDocument()
  })

  it('signs and opens a download', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    getAttachmentDownloadUrl.mockResolvedValue('https://signed.example/x')
    listAttachments.mockResolvedValue([existing])
    renderApp(<SupportAttachments ticketId="t1" canUpload={false} />)
    await user.click(await screen.findByRole('button', { name: /Download/ }))
    expect(getAttachmentDownloadUrl).toHaveBeenCalledWith('att-1')
    expect(openSpy).toHaveBeenCalledWith(
      'https://signed.example/x',
      '_blank',
      'noopener,noreferrer',
    )
    openSpy.mockRestore()
  })

  it('rejects an oversized file without calling the server', async () => {
    const user = userEvent.setup()
    renderApp(<SupportAttachments ticketId="t1" canUpload />)
    const input = document.getElementById('support-attach-t1') as HTMLInputElement
    // Allowed type (so the input's `accept` doesn't pre-filter it) but too big —
    // stub the size to avoid allocating 25 MB in the test.
    const big = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: 26214401 })
    await user.upload(input, big)
    expect(screen.getByRole('alert')).toHaveTextContent('That file is over the 25 MB limit.')
    expect(uploadAttachment).not.toHaveBeenCalled()
  })

  it('uploads a valid file and shows it in the list', async () => {
    const user = userEvent.setup()
    uploadAttachment.mockResolvedValue({
      ...existing,
      id: 'att-2',
      fileName: 'notes.pdf',
      mimeType: 'application/pdf',
    })
    renderApp(<SupportAttachments ticketId="t1" canUpload />)
    const input = document.getElementById('support-attach-t1') as HTMLInputElement
    const file = new File(['hello'], 'notes.pdf', { type: 'application/pdf' })
    await user.upload(input, file)
    expect(uploadAttachment).toHaveBeenCalledWith('t1', file)
    expect(await screen.findByText('notes.pdf')).toBeInTheDocument()
  })

  it('marks a flagged file and refuses to offer it for download', async () => {
    listAttachments.mockResolvedValue([{ ...existing, scanStatus: 'flagged' }])
    renderApp(<SupportAttachments ticketId="t1" canUpload={false} />)
    expect(await screen.findByText('Blocked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download/ })).toBeDisabled()
  })

  it('explains a scan-blocked download instead of a generic failure', async () => {
    const user = userEvent.setup()
    // The server is the real gate: a file the list still shows as pending can
    // come back 423 because the scan has not cleared it yet.
    getAttachmentDownloadUrl.mockRejectedValue(new AttachmentBlockedError('unscanned'))
    listAttachments.mockResolvedValue([existing])
    renderApp(<SupportAttachments ticketId="t1" canUpload={false} />)
    await user.click(await screen.findByRole('button', { name: /Download/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/still being scanned for malware/)
  })

  it('names malware plainly when that is why the download was refused', async () => {
    const user = userEvent.setup()
    getAttachmentDownloadUrl.mockRejectedValue(new AttachmentBlockedError('infected'))
    listAttachments.mockResolvedValue([existing])
    renderApp(<SupportAttachments ticketId="t1" canUpload={false} />)
    await user.click(await screen.findByRole('button', { name: /Download/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/flagged by our malware scan/)
  })
})
