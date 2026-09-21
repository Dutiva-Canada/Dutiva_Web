/**
 * File System Access prototype — "models on a drive" (docs/LOCAL_INFERENCE.md,
 * docs/FS_ACCESS_MODELS.md).
 *
 * What this does: the user picks a folder (an external drive, a synced
 * folder, anything the OS can show). We copy the model files inside it into
 * the same Cache Storage bucket transformers.js fills from huggingface.co —
 * so afterwards the runtime loads them exactly as if they had been
 * downloaded, including offline.
 *
 * What this does NOT do: stream weights off the drive live. A browser page
 * cannot mount a filesystem; the picked-folder handle only lives for the
 * session (re-stored in IndexedDB, but permission is re-asked). Running a
 * model straight off a drive, or auto-loading on USB plug-in, needs a
 * desktop/runtime process — that path stays documented as future work.
 *
 * Folder layout — the Hugging Face repo tree, two levels deep:
 *   <picked>/Xenova/whisper-tiny/config.json
 *   <picked>/Xenova/whisper-tiny/onnx/model_quantized.onnx
 * i.e. `<org>/<repo>/<repo-relative path>`. The same layout
 * `env.localModelPath` would use, so a folder prepared for this import is
 * forward-compatible with a real runtime mount.
 *
 * Support: `showDirectoryPicker` — Chromium browsers only at writing. Every
 * public entry point degrades instead of throwing where it's absent.
 */

const CACHE_NAME = 'transformers-cache'
const HF_HOST = 'https://huggingface.co'
const IDB_NAME = 'dutiva-drive-models'
const IDB_STORE = 'handles'
const IDB_KEY = 'model-folder'

/** Minimal shapes — showDirectoryPicker isn't in the TS DOM lib we compile
 *  against, and tests feed plain objects anyway. */
export interface FsFileLike {
  readonly kind: 'file'
  readonly name: string
  getFile(): Promise<File>
}
export interface FsDirLike {
  readonly kind: 'directory'
  readonly name: string
  values(): AsyncIterable<FsFileLike | FsDirLike>
}

/** The real FileSystemDirectoryHandle, plus the permission methods this
 *  TS DOM lib doesn't declare. What IndexedDB stores satisfies this. */
interface PermDirHandle {
  name: string
  queryPermission?(d: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission?(d: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
}

interface PickerWindow {
  showDirectoryPicker?: (opts: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<FsDirLike>
}

/** True where the File System Access directory picker exists (Chromium). */
export function isDriveImportSupported(): boolean {
  return typeof (window as PickerWindow | undefined)?.showDirectoryPicker === 'function'
}

/* ------------------------------- IndexedDB ------------------------------ */

function openHandleDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbPut(value: unknown): Promise<void> {
  const db = await openHandleDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, IDB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
  db.close()
}

async function idbGet<T>(): Promise<T | null> {
  const db = await openHandleDb()
  if (!db) return null
  const value = await new Promise<T | null>((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror = () => resolve(null)
  })
  db.close()
  return value
}

/* ------------------------------ public API ------------------------------ */

export interface DriveFolderState {
  /** Directory name shown to the user (drive root name, e.g. "MODELS (E:)"). */
  name: string
  /** 'granted' → import can run now; 'prompt' → needs a user gesture first. */
  permission: 'granted' | 'prompt' | 'unavailable'
  /** The directory handle — pass back to importDriveFolder. */
  handle: FsDirLike
}

function folderState(
  handle: PermDirHandle,
  permission: PermissionState | undefined,
): DriveFolderState {
  return {
    name: handle.name,
    permission:
      permission === 'granted' ? 'granted' : permission === 'prompt' ? 'prompt' : 'unavailable',
    handle: handle as unknown as FsDirLike,
  }
}

/** The folder remembered from a previous session, if any. */
export async function storedDriveFolder(): Promise<DriveFolderState | null> {
  const handle = await idbGet<PermDirHandle>()
  if (!handle || typeof handle.queryPermission !== 'function') {
    return handle ? folderState(handle, undefined) : null
  }
  try {
    return folderState(handle, await handle.queryPermission({ mode: 'read' }))
  } catch {
    return folderState(handle, undefined)
  }
}

/** Ask the user to pick the model folder; remembered for later sessions. */
export async function pickDriveFolder(): Promise<DriveFolderState | null> {
  const picker = (window as PickerWindow | undefined)?.showDirectoryPicker
  if (!picker) return null
  try {
    const handle = (await picker({ id: 'dutiva-models', mode: 'read' })) as unknown as PermDirHandle
    await idbPut(handle)
    return folderState(handle, 'granted')
  } catch {
    // User cancelled the picker — not an error worth surfacing.
    return null
  }
}

/** Re-grant read permission on the remembered folder (user gesture). */
export async function regrantDriveFolder(): Promise<DriveFolderState | null> {
  const handle = await idbGet<PermDirHandle>()
  if (!handle || typeof handle.requestPermission !== 'function') return null
  try {
    return folderState(handle, await handle.requestPermission({ mode: 'read' }))
  } catch {
    return null
  }
}

export interface DriveImportResult {
  /** repoId ('Xenova/whisper-tiny') → files imported for it. */
  repos: Record<string, number>
  skippedFiles: number
}

const MIME: Record<string, string> = {
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.onnx': 'application/octet-stream',
  '.onnx_data': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.model': 'application/octet-stream',
}

function mimeFor(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return 'application/octet-stream'
  const ext = name.slice(dot)
  return MIME[ext] ?? 'application/octet-stream'
}

/** Cache key transformers.js will request for this file (default 'main'). */
export function hfCacheUrl(repoId: string, relPath: string): string {
  return `${HF_HOST}/${repoId}/resolve/main/${relPath}`
}

async function* walkFiles(
  dir: FsDirLike,
  prefix = '',
): AsyncGenerator<{ path: string; file: FsFileLike }> {
  for await (const entry of dir.values()) {
    if (entry.kind === 'file') yield { path: `${prefix}${entry.name}`, file: entry }
    else yield* walkFiles(entry, `${prefix}${entry.name}/`)
  }
}

/**
 * Copy every file under each `<org>/<repo>/` tree in `root` into the
 * transformers.js browser cache. Anything the folder doesn't contain simply
 * isn't cached — the runtime fetches missing files from HF on first use, so
 * a partial snapshot degrades to a partial offline set, not a broken model.
 */
export async function importDriveFolder(
  root: FsDirLike,
  onProgress?: (done: number, total: number) => void,
): Promise<DriveImportResult> {
  if (typeof caches === 'undefined') {
    return { repos: {}, skippedFiles: 0 }
  }
  const cache = await caches.open(CACHE_NAME)
  const repos: Record<string, number> = {}
  let skippedFiles = 0
  let done = 0

  const pending: { repoId: string; relPath: string; file: FsFileLike }[] = []
  for await (const org of root.values()) {
    if (org.kind !== 'directory') {
      skippedFiles += 1
      continue
    }
    for await (const repo of org.values()) {
      if (repo.kind !== 'directory') {
        skippedFiles += 1
        continue
      }
      const repoId = `${org.name}/${repo.name}`
      for await (const { path, file } of walkFiles(repo)) {
        pending.push({ repoId, relPath: path, file })
      }
    }
  }

  for (const item of pending) {
    try {
      const blob = await item.file.getFile()
      const res = new Response(blob, {
        headers: { 'Content-Type': mimeFor(item.relPath) },
      })
      await cache.put(new Request(hfCacheUrl(item.repoId, item.relPath)), res)
      repos[item.repoId] = (repos[item.repoId] ?? 0) + 1
    } catch {
      skippedFiles += 1
    }
    done += 1
    onProgress?.(done, pending.length)
  }
  return { repos, skippedFiles }
}
