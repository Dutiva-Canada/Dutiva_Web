import type { Bi } from '@/i18n/core'

/**
 * Installable on-device models — the catalogue Settings → AI renders.
 *
 * These run in the browser via transformers.js (WASM today; WebGPU when the
 * runtime supports it). They are deliberately NOT the Advisor: per
 * docs/LOCAL_INFERENCE.md ("do not fork advisor-chat into a second product
 * to try WebGPU"), a small in-browser model cannot meet the bilingual,
 * grounded HR bar, so they power on-device tasks — captioning an attached
 * image, transcribing a voice note, embedding for similarity — while the
 * Advisor keeps its server-routed, metered completion path.
 *
 * Sizes are honest approximations of the quantized download, shown so the
 * install decision is informed — a model is a real download even when the
 * UI makes it one click.
 */

export type LocalModelTask =
  | 'text2text-generation'
  | 'text-generation'
  | 'image-to-text'
  | 'automatic-speech-recognition'
  | 'feature-extraction'

export type LocalModelModality = 'text' | 'image' | 'audio'

export interface LocalModelSpec {
  /** Stable id used in state maps and prefs. */
  id: string
  /** Hugging Face repo the runtime resolves (transformers.js mirrors). */
  repoId: string
  task: LocalModelTask
  /** Model name — a proper noun, deliberately not localized. */
  name: string
  description: Bi
  /** Input modalities the task accepts. */
  modalities: LocalModelModality[]
  /** Approximate quantized download size, MB. */
  approxSizeMb: number
}

export const LOCAL_MODEL_CATALOG: readonly LocalModelSpec[] = [
  {
    id: 'vit-gpt2-caption',
    repoId: 'Xenova/vit-gpt2-image-captioning',
    task: 'image-to-text',
    name: 'ViT-GPT2 Image Captioning',
    description: {
      en: 'Describes an image in a sentence — turn a photo of a posting or whiteboard into text any model can read.',
      fr: 'Décrit une image en une phrase — transforme la photo d’une affiche ou d’un tableau en texte lisible par tout modèle.',
    }, // [FR self-authored]
    modalities: ['image', 'text'],
    approxSizeMb: 180,
  },
  {
    id: 'whisper-tiny',
    repoId: 'Xenova/whisper-tiny',
    task: 'automatic-speech-recognition',
    name: 'Whisper Tiny',
    description: {
      en: 'Transcribes short audio to text on-device — voice notes become text without leaving the browser.',
      fr: 'Transcrit de courts extraits audio en texte sur l’appareil — les notes vocales deviennent du texte sans quitter le navigateur.',
    }, // [FR self-authored]
    modalities: ['audio', 'text'],
    approxSizeMb: 80,
  },
  {
    id: 'lamini-flan-t5',
    repoId: 'Xenova/LaMini-Flan-T5-248M',
    task: 'text2text-generation',
    name: 'LaMini Flan-T5 248M',
    description: {
      en: 'Small instruction-following text model — drafts short rewrites and summaries fully offline.',
      fr: 'Petit modèle de texte à instructions — rédige de courtes reformulations et synthèses hors ligne.',
    }, // [FR self-authored]
    modalities: ['text'],
    approxSizeMb: 95,
  },
  {
    id: 'minilm-embed',
    repoId: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    task: 'feature-extraction',
    name: 'Paraphrase MiniLM (multilingual)',
    description: {
      en: 'Bilingual embeddings for similarity — the same model the finance import uses to match ledger lines.',
      fr: 'Plongements bilingues pour la similarité — le même modèle que l’import financier utilise pour rapprocher les lignes comptables.',
    }, // [FR self-authored]
    modalities: ['text'],
    approxSizeMb: 35,
  },
]

export function localModelById(id: string): LocalModelSpec | undefined {
  return LOCAL_MODEL_CATALOG.find((m) => m.id === id)
}
