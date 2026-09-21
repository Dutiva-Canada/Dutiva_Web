import { describe, expect, it } from 'vitest'
import { AdvisorModalityError } from '@/features/app/advisor/chatApi'
import type { AdvisorAttachment } from '@/features/app/advisor/attachments'
import { captionFallbackAttachments } from './advisorLocalFallback'
import type { CaptionFallbackDeps } from './advisorLocalFallback'

/**
 * The modality-refusal → on-device caption fallback. Pinned: it only fires on
 * an image-modality refusal with an installed caption model, converts every
 * image to a document attachment carrying the caption, and bails
 * all-or-nothing when any caption fails — a partial resend would refuse the
 * same way again.
 */

function imageAtt(id: string): AdvisorAttachment {
  return {
    id,
    kind: 'image',
    name: `${id}.png`,
    mime: 'image/png',
    bytes: 100,
    dataUrl: `data:image/png;base64,${id}`,
  }
}

function docAtt(id: string): AdvisorAttachment {
  return { id, kind: 'document', name: `${id}.txt`, mime: 'text/plain', bytes: 10, text: 'hi' }
}

const installed: CaptionFallbackDeps = {
  isInstalled: async () => true,
  caption: async (_spec, dataUrl) => `caption of ${dataUrl}`,
}

const notInstalled: CaptionFallbackDeps = {
  isInstalled: async () => false,
  caption: async () => 'never called',
}

describe('captionFallbackAttachments', () => {
  it('returns null for non-modality errors', async () => {
    expect(
      await captionFallbackAttachments(new Error('boom'), [imageAtt('a')], installed),
    ).toBeNull()
  })

  it('returns null when the refused modality is not image', async () => {
    expect(
      await captionFallbackAttachments(
        new AdvisorModalityError('input'),
        [imageAtt('a')],
        installed,
      ),
    ).toBeNull()
  })

  it('returns null with no image payloads or no attachments', async () => {
    const err = new AdvisorModalityError('image')
    expect(await captionFallbackAttachments(err, undefined, installed)).toBeNull()
    expect(await captionFallbackAttachments(err, [docAtt('d')], installed)).toBeNull()
  })

  it('returns null when the caption model is not installed', async () => {
    expect(
      await captionFallbackAttachments(
        new AdvisorModalityError('image'),
        [imageAtt('a')],
        notInstalled,
      ),
    ).toBeNull()
  })

  it('converts images to caption documents and keeps other attachments', async () => {
    const out = await captionFallbackAttachments(
      new AdvisorModalityError('image'),
      [imageAtt('a'), docAtt('d'), imageAtt('b')],
      installed,
    )
    expect(out).not.toBeNull()
    expect(out).toHaveLength(3)
    expect(out![0]).toMatchObject({
      kind: 'document',
      name: 'a.png',
      text: 'caption of data:image/png;base64,a',
    })
    expect(out![0]!.dataUrl).toBeUndefined()
    expect(out![1]).toMatchObject({ kind: 'document', name: 'd.txt', text: 'hi' })
    expect(out![2]).toMatchObject({ kind: 'document', name: 'b.png' })
  })

  it('bails when a caption throws or comes back empty', async () => {
    const err = new AdvisorModalityError('image')
    const throwing: CaptionFallbackDeps = {
      isInstalled: async () => true,
      caption: async () => {
        throw new Error('x')
      },
    }
    expect(await captionFallbackAttachments(err, [imageAtt('a')], throwing)).toBeNull()
    const empty: CaptionFallbackDeps = { isInstalled: async () => true, caption: async () => '   ' }
    expect(await captionFallbackAttachments(err, [imageAtt('a')], empty)).toBeNull()
  })
})
