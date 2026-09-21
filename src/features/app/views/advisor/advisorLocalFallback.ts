import { AdvisorModalityError } from '@/features/app/advisor/chatApi'
import type { AdvisorAttachment } from '@/features/app/advisor/attachments'
import { isModelInstalled } from '@/lib/localModels/manager'
import type { LocalModelSpec } from '@/lib/localModels/catalog'
import {
  CAPTION_MODEL_ID,
  captionOnDevice,
  onDeviceSpec,
} from '@/features/app/advisor/onDeviceTasks'

/**
 * On-device caption fallback for multimodal turns.
 *
 * The routed model refuses an image attachment pre-metering
 * (`modality_unsupported`/`image`). When the ViT-GPT2 caption model is
 * installed on this device, the image can still reach a text-only route:
 * caption it locally and resend as a `document` attachment — the wire shape
 * `advisor-chat` inlines as prompt text. This is the workflow the catalogue
 * entry describes ("turn a photo … into text any model can read"), not a
 * silent downgrade: the caller toasts what happened.
 */

export interface CaptionFallbackDeps {
  isInstalled: (repoId: string) => Promise<boolean>
  caption: (spec: LocalModelSpec, dataUrl: string) => Promise<string>
}

export const captionFallbackDeps: CaptionFallbackDeps = {
  isInstalled: isModelInstalled,
  caption: captionOnDevice,
}

/**
 * The attachment list with every image swapped for a caption document — or
 * null when the fallback doesn't apply (not an image-modality refusal, no
 * image payloads, model absent, or captioning failed). All-or-nothing: a
 * partially captioned set would resend raw images and refuse identically.
 */
export async function captionFallbackAttachments(
  error: unknown,
  attachments: readonly AdvisorAttachment[] | undefined,
  deps: CaptionFallbackDeps = captionFallbackDeps,
): Promise<AdvisorAttachment[] | null> {
  if (!(error instanceof AdvisorModalityError) || error.modality !== 'image') return null
  const list = attachments ?? []
  if (!list.some((a) => a.kind === 'image' && a.dataUrl)) return null
  const spec = onDeviceSpec(CAPTION_MODEL_ID)
  if (spec == null) return null
  try {
    if (!(await deps.isInstalled(spec.repoId))) return null
  } catch {
    return null
  }
  try {
    return await Promise.all(
      list.map(async (a) => {
        if (a.kind !== 'image' || !a.dataUrl) return a
        const caption = (await deps.caption(spec, a.dataUrl)).trim()
        if (!caption) throw new Error('empty caption')
        const { dataUrl: _dropped, ...rest } = a
        return { ...rest, kind: 'document' as const, text: caption }
      }),
    )
  } catch {
    return null
  }
}
