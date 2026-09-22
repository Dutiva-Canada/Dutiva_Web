import { afterEach, describe, expect, it, vi } from 'vitest'
import { hfCacheUrl, importDriveFolder, isDriveImportSupported } from './driveImport'
import type { FsDirLike, FsFileLike } from './driveImport'

/**
 * The drive-import prototype, tested with fake directory handles — no real
 * File System Access API exists in jsdom, which is itself one of the things
 * under test: unsupported environments must degrade, not throw.
 */

function fakeFile(name: string, bytes = 4): FsFileLike {
  const contents = new Uint8Array(bytes)
  const file = new File([contents], name)
  Object.defineProperty(file, 'stream', {
    value: () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(contents)
          controller.close()
        },
      }),
  })
  return {
    kind: 'file',
    name,
    getFile: async () => file,
  }
}

function fakeDir(name: string, children: (FsFileLike | FsDirLike)[]): FsDirLike {
  return {
    kind: 'directory',
    name,
    values: async function* () {
      for (const c of children) yield c
    },
  }
}

function fakeCacheStorage() {
  const stored = new Map<string, Response>()
  const fake = {
    open: async () => ({
      put: async (req: Request, res: Response) => {
        stored.set(req.url, res)
      },
      keys: async () => [...stored.keys()].map((u) => new Request(u)),
    }),
  }
  vi.stubGlobal('caches', fake)
  return stored
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isDriveImportSupported', () => {
  it('is false where showDirectoryPicker does not exist (jsdom, Firefox, Safari)', () => {
    expect(isDriveImportSupported()).toBe(false)
  })
})

describe('hfCacheUrl', () => {
  it('builds the resolve/main URL transformers.js requests per file', () => {
    expect(hfCacheUrl('Xenova/whisper-tiny', 'onnx/model.onnx')).toBe(
      'https://huggingface.co/Xenova/whisper-tiny/resolve/main/onnx/model.onnx',
    )
  })
})

describe('importDriveFolder', () => {
  it('copies <org>/<repo>/<file> trees into transformers-cache under HF URLs', async () => {
    const stored = fakeCacheStorage()
    const root = fakeDir('MODELS (E:)', [
      fakeDir('Xenova', [
        fakeDir('whisper-tiny', [
          fakeFile('config.json'),
          fakeDir('onnx', [fakeFile('model_quantized.onnx', 100)]),
        ]),
      ]),
    ])
    const result = await importDriveFolder(root)
    expect(result.repos['Xenova/whisper-tiny']).toBe(2)
    expect(stored.has('https://huggingface.co/Xenova/whisper-tiny/resolve/main/config.json')).toBe(
      true,
    )
    expect(
      stored.has(
        'https://huggingface.co/Xenova/whisper-tiny/resolve/main/onnx/model_quantized.onnx',
      ),
    ).toBe(true)
  })

  it('skips loose files that are not inside an org/repo tree', async () => {
    fakeCacheStorage()
    const root = fakeDir('E:', [
      fakeFile('readme.txt'),
      fakeDir('Xenova', [fakeDir('whisper-tiny', [fakeFile('config.json')])]),
    ])
    const result = await importDriveFolder(root)
    expect(result.repos['Xenova/whisper-tiny']).toBe(1)
    expect(result.skippedFiles).toBe(1)
  })

  it('degrades to an empty result where Cache Storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined)
    const root = fakeDir('E:', [fakeDir('Xenova', [fakeDir('m', [fakeFile('config.json')])])])
    const result = await importDriveFolder(root)
    expect(result.repos).toEqual({})
  })
})
