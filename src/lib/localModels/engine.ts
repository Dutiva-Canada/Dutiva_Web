import { LocalModelError } from './manager'
import type { LocalModelSpec } from './catalog'

/**
 * Run an installed on-device model. Pipelines are memoized per repo so a
 * warm model never pays the load twice; the browser cache keeps the weights
 * (see ./manager.ts for the install side).
 *
 * This is the seam the app calls for on-device work — caption an attached
 * image, transcribe a voice note, draft a short rewrite. It is deliberately
 * not wired into the Advisor's reply path (docs/LOCAL_INFERENCE.md).
 */

type PipelineFn = (input: unknown, options?: Record<string, unknown>) => Promise<unknown>

const pipelines = new Map<string, Promise<PipelineFn>>()

async function loadPipeline(spec: LocalModelSpec): Promise<PipelineFn> {
  let pending = pipelines.get(spec.repoId)
  if (!pending) {
    pending = (async () => {
      const mod = await import('@huggingface/transformers')
      mod.env.allowRemoteModels = true
      /* Same as manager.ts: the SPA fallback answers /models/* with
         index.html + 200, which the runtime parses as model JSON. */
      mod.env.allowLocalModels = false
      mod.env.useBrowserCache = true
      mod.env.useFSCache = false
      mod.env.backends.onnx.wasm!.numThreads = 1
      const pipe = (await mod.pipeline(spec.task, spec.repoId, { dtype: 'q8' })) as PipelineFn
      return pipe
    })()
    pipelines.set(spec.repoId, pending)
  }
  return pending
}

export interface LocalRunInput {
  /** Text prompt (text tasks), image URL/data URL (image-to-text), or
   *  decoded mono audio samples (ASR). */
  input: string | Float32Array
}

/** One normalized result: the model's first text output. */
export async function runLocalModel(spec: LocalModelSpec, run: LocalRunInput): Promise<string> {
  const pipe = await loadPipeline(spec).catch((error: unknown) => {
    throw new LocalModelError(
      'download_failed',
      error instanceof Error ? error.message : 'Model could not be loaded.',
    )
  })

  let out: unknown
  try {
    switch (spec.task) {
      case 'text2text-generation':
      case 'text-generation':
        out = await pipe(run.input, { max_new_tokens: 256 })
        break
      case 'image-to-text':
        out = await pipe(run.input)
        break
      case 'automatic-speech-recognition':
        out = await pipe(run.input, { chunk_length_s: 30, stride_length_s: 5 })
        break
      case 'feature-extraction':
        out = await pipe(run.input, { pooling: 'mean', normalize: true })
        break
      default:
        throw new LocalModelError('unsupported_task', `No runner for task ${spec.task}.`)
    }
  } catch (error) {
    if (error instanceof LocalModelError) throw error
    throw new LocalModelError(
      'download_failed',
      error instanceof Error ? error.message : 'Model run failed.',
    )
  }

  return firstText(out)
}

/** transformers.js returns task-shaped arrays; pull the first text field. */
function firstText(out: unknown): string {
  const item = Array.isArray(out) ? out[0] : out
  if (item && typeof item === 'object') {
    const rec = item as Record<string, unknown>
    for (const key of ['generated_text', 'text', 'translation_text', 'summary_text']) {
      const value = rec[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    /* feature-extraction returns a tensor-ish { data, dims } — surface the
       shape rather than pretend it is prose. */
    if (Array.isArray(rec.dims) && rec.data) {
      return `embedding[${(rec.dims as number[]).join('×')}]`
    }
  }
  return typeof item === 'string' ? item : ''
}

/** Tests only — drop memoized pipelines. */
export function clearLocalModelPipelinesForTests() {
  pipelines.clear()
}
