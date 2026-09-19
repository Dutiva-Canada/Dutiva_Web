import { localModelById } from '@/lib/localModels/catalog'
import { runLocalModel } from '@/lib/localModels/engine'
import type { LocalModelSpec } from '@/lib/localModels/catalog'

/**
 * On-device tasks the Advisor surface offers when the matching browser model
 * is installed (Settings → AI → "On this device"). Every task degrades to
 * hidden when the model isn't installed — nothing here is required for the
 * chat path itself.
 *
 * These are the workflows named in src/lib/localModels/catalog.ts: a voice
 * note becomes draft text, an image becomes a caption, a draft gets a short
 * rewrite — all without bytes leaving the machine.
 */

export const VOICE_NOTE_MODEL_ID = 'whisper-tiny'
export const REWRITE_MODEL_ID = 'lamini-flan-t5'
export const CAPTION_MODEL_ID = 'vit-gpt2-caption'

/** Catalog spec by id, or null when the id isn't in the catalogue. */
export function onDeviceSpec(id: string): LocalModelSpec | null {
  return localModelById(id) ?? null
}

/** Whisper tiny — mono 16 kHz samples → transcript text. */
export async function transcribeOnDevice(spec: LocalModelSpec, samples: Float32Array) {
  return (await runLocalModel(spec, { input: samples })).trim()
}

/** ViT-GPT2 — image data URL → one-sentence caption. */
export async function captionOnDevice(spec: LocalModelSpec, dataUrl: string) {
  return (await runLocalModel(spec, { input: dataUrl })).trim()
}

/** LaMini is instruction-tuned on English; telling it to keep the draft's
 *  language stops it anglicizing French text. */
export function rewritePromptFor(draft: string): string {
  return `Rewrite the following draft clearly and professionally, in the same language it is written in:\n\n${draft}`
}

/** LaMini Flan-T5 — instruction rewrite of the current draft. */
export async function rewriteOnDevice(spec: LocalModelSpec, draft: string) {
  return (await runLocalModel(spec, { input: rewritePromptFor(draft) })).trim()
}
