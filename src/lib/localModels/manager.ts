import type { LocalModelSpec } from './catalog'

/**
 * On-device model lifecycle — install, inspect, remove.
 *
 * "Installed" means the model's weight files sit in the Cache Storage bucket
 * transformers.js fills (`transformers-cache`, keyed by the huggingface.co
 * URL each file was fetched from). Installation is therefore just: run the
 * pipeline once. Removal is deleting that repo's cache entries. Storage is
 * browser-managed — quota pressure can still evict files, so "installed" is
 * always re-probed rather than remembered.
 *
 * Every function degrades quietly where Cache Storage is unavailable
 * (jsdom, locked-down iframes): installs throw a typed error, probes report
 * "not installed".
 */

const CACHE_NAME = 'transformers-cache'

export class LocalModelError extends Error {
  constructor(
    readonly reason: 'cache_unavailable' | 'download_failed' | 'unsupported_task',
    message: string,
  ) {
    super(message)
    this.name = 'LocalModelError'
  }
}

export type InstallProgress = {
  /** transformers.js per-file status: initiate → progress → done. */
  file: string
  status: string
  /** 0–100 when the runtime reports bytes; undefined otherwise. */
  progress?: number
}

function repoKeyFragment(repoId: string): string {
  return `/${repoId}/resolve/`
}

async function modelCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(CACHE_NAME)
  } catch {
    return null
  }
}

/** Repo ids with at least one file already in the browser cache. */
export async function installedRepoIds(): Promise<Set<string>> {
  const cache = await modelCache()
  if (!cache) return new Set()
  try {
    const keys = await cache.keys()
    const repos = new Set<string>()
    for (const req of keys) {
      const url = req.url
      // https://huggingface.co/<org>/<repo>/resolve/<rev>/<file>
      const match = /https:\/\/huggingface\.co\/([^/]+\/[^/]+)\/resolve\//.exec(url)
      if (match) repos.add(match[1]!)
    }
    return repos
  } catch {
    return new Set()
  }
}

export async function isModelInstalled(repoId: string): Promise<boolean> {
  const cache = await modelCache()
  if (!cache) return false
  try {
    const keys = await cache.keys()
    return keys.some((req) => req.url.includes(repoKeyFragment(repoId)))
  } catch {
    return false
  }
}

/** Delete every cached file for a repo. Returns how many entries were dropped. */
export async function removeModel(repoId: string): Promise<number> {
  const cache = await modelCache()
  if (!cache) return 0
  const fragment = repoKeyFragment(repoId)
  try {
    const keys = await cache.keys()
    let removed = 0
    for (const req of keys) {
      if (req.url.includes(fragment) && (await cache.delete(req))) removed += 1
    }
    return removed
  } catch {
    return 0
  }
}

/** Browser storage picture for the section footer — null where unsupported. */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const est = await navigator.storage?.estimate?.()
    if (!est || typeof est.usage !== 'number' || typeof est.quota !== 'number') return null
    return { usage: est.usage, quota: est.quota }
  } catch {
    return null
  }
}

interface TransformersEnv {
  allowRemoteModels: boolean
  allowLocalModels: boolean
  useBrowserCache: boolean
  useFSCache: boolean
  backends: { onnx: { wasm: { numThreads: number } } }
}

/**
 * One shared runtime configuration — mirrors the finance embeddings loader
 * (src/features/app/views/finance/data/aiEmbeddings.ts) so both features hit
 * the same cache and the same single-threaded WASM backend.
 */
async function transformersRuntime() {
  const mod = await import('@xenova/transformers')
  const env = mod.env as TransformersEnv
  env.allowRemoteModels = true
  /* Never probe localModelPath first: the SPA fallback answers /models/* with
     index.html + 200, which the runtime then parses as model JSON. Models only
     ever come from the remote host into Cache Storage. */
  env.allowLocalModels = false
  env.useBrowserCache = true
  env.useFSCache = false
  env.backends.onnx.wasm.numThreads = 1
  return mod.pipeline
}

/**
 * Install a model: loading its pipeline once downloads every weight file
 * into the browser cache. Resolves when the model is warm — subsequent
 * `runModel` calls reuse the cached pipeline.
 */
export async function installModel(
  spec: LocalModelSpec,
  onProgress?: (event: InstallProgress) => void,
): Promise<void> {
  const pipeline = await transformersRuntime()
  try {
    await pipeline(spec.task, spec.repoId, {
      quantized: true,
      progress_callback: (e: { file?: string; status?: string; progress?: number }) => {
        onProgress?.({ file: e.file ?? '', status: e.status ?? '', progress: e.progress })
      },
    })
  } catch (error) {
    throw new LocalModelError(
      'download_failed',
      error instanceof Error ? error.message : 'Model download failed.',
    )
  }
}
