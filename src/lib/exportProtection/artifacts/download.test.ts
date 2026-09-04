import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportFilename, triggerDownload } from './download'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('exportFilename', () => {
  it('slugs titles with diacritics and stamps the date', () => {
    const at = new Date('2026-07-30T18:04:30Z')
    expect(exportFilename('Termination Letter — Jordan Mensah', 'pdf', at)).toBe(
      'dutiva-termination-letter-jordan-mensah-20260730.pdf',
    )
    expect(exportFilename('Congé payé — Éloïse', 'docx', at)).toBe(
      'dutiva-conge-paye-eloise-20260730.docx',
    )
    expect(exportFilename('***', 'json', at)).toBe('dutiva-document-20260730.json')
  })
})

describe('triggerDownload', () => {
  it('reports unavailable where createObjectURL does not exist (SSR)', () => {
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: undefined }))
    expect(triggerDownload('a.pdf', new Blob(['x']))).toBe(false)
  })

  it('creates, clicks and revokes an object URL when the platform supports it', () => {
    const create = vi.fn(() => 'blob:mock')
    const revoke = vi.fn()
    vi.stubGlobal(
      'URL',
      Object.assign(Object.create(URL), { createObjectURL: create, revokeObjectURL: revoke }),
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(triggerDownload('a.pdf', new Blob(['x']))).toBe(true)
    expect(create).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:mock')
  })
})
