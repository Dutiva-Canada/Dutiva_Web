import { describe, expect, it } from 'vitest'
import { deflateRawSync } from 'node:zlib'
import {
  DecompressionStream as NodeDecompressionStream,
  ReadableStream as NodeReadableStream,
} from 'node:stream/web'
import {
  entryDataRange,
  findCentralDirectory,
  openRemoteZip,
  parseCentralDirectory,
  readZipEntry,
  type RangeFetcher,
} from './zipRange'

/* The edge runtime exposes DecompressionStream natively; jsdom does not,
   so the test environment provides Node's web-streams implementation. */
if (typeof globalThis.DecompressionStream === 'undefined') {
  // @ts-expect-error — Node's stream/web type is structurally compatible
  globalThis.DecompressionStream = NodeDecompressionStream
  // @ts-expect-error — same structural shim
  globalThis.ReadableStream = NodeReadableStream
}

/**
 * A minimal but real ZIP, built in-memory — one deflated entry and one
 * stored entry, exactly the two methods the reader supports. The layout the
 * parser relies on is the classic record format: LFH per file, central
 * directory, then EOCD at the tail.
 */
function buildZip(files: { name: string; data: string }[]): Uint8Array {
  const enc = new TextEncoder()
  const chunks: number[] = []
  const centrals: number[] = []

  const u16 = (v: number) => [v & 0xff, (v >> 8) & 0xff]
  const u32 = (v: number) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]
  const push = (arr: number[], bytes: ArrayLike<number>) => {
    for (const b of bytes) arr.push(b)
  }

  for (const file of files) {
    const nameBytes = enc.encode(file.name)
    const raw = enc.encode(file.data)
    const compressed = new Uint8Array(deflateRawSync(raw))
    const useStore = file.name.endsWith('.store')
    const payload = useStore ? raw : compressed
    const method = useStore ? 0 : 8
    const lho = chunks.length

    // local file header
    push(chunks, [0x50, 0x4b, 0x03, 0x04])
    push(chunks, u16(20)) // version needed
    push(chunks, u16(0)) // flags
    push(chunks, u16(method))
    push(chunks, u16(0)) // mod time
    push(chunks, u16(0)) // mod date
    push(chunks, u32(0)) // crc — reader does not verify
    push(chunks, u32(payload.length))
    push(chunks, u32(raw.length))
    push(chunks, u16(nameBytes.length))
    push(chunks, u16(0)) // extra len
    push(chunks, nameBytes)
    push(chunks, payload)

    // central directory record
    push(centrals, [0x50, 0x4b, 0x01, 0x02])
    push(centrals, u16(20)) // version made by
    push(centrals, u16(20)) // version needed
    push(centrals, u16(0)) // flags
    push(centrals, u16(method))
    push(centrals, u16(0))
    push(centrals, u16(0))
    push(centrals, u32(0)) // crc
    push(centrals, u32(payload.length))
    push(centrals, u32(raw.length))
    push(centrals, u16(nameBytes.length))
    push(centrals, u16(0)) // extra
    push(centrals, u16(0)) // comment
    push(centrals, u16(0)) // disk
    push(centrals, u16(0)) // internal attr
    push(centrals, u32(0)) // external attr
    push(centrals, u32(lho))
    push(centrals, nameBytes)
  }

  const cdOffset = chunks.length
  push(chunks, centrals)
  const cdSize = centrals.length

  // end of central directory
  push(chunks, [0x50, 0x4b, 0x05, 0x06])
  push(chunks, u16(0))
  push(chunks, u16(0))
  push(chunks, u16(files.length))
  push(chunks, u16(files.length))
  push(chunks, u32(cdSize))
  push(chunks, u32(cdOffset))
  push(chunks, u16(0))

  return new Uint8Array(chunks)
}

/** A RangeFetcher serving slices of the in-memory archive — records each
    requested window so tests can assert the reader stays off the payload. */
function rangeFetcherFor(zip: Uint8Array) {
  const calls: Array<[number, number]> = []
  const fetcher: RangeFetcher = async (start, end) => {
    calls.push([start, end])
    return zip.subarray(start, end + 1)
  }
  return { fetcher, calls }
}

describe('findCentralDirectory', () => {
  it('finds the EOCD in a fetched tail', () => {
    const zip = buildZip([{ name: 'a.txt', data: 'hello' }])
    const loc = findCentralDirectory(zip.subarray(Math.max(0, zip.length - 65536)), zip.length)
    expect(loc).not.toBeNull()
    expect(loc!.cdSize).toBeGreaterThan(0)
  })

  it('returns null for a buffer with no signature', () => {
    expect(findCentralDirectory(new Uint8Array(1024), 1024)).toBeNull()
  })
})

describe('parseCentralDirectory + entryDataRange', () => {
  it('lists entries with their local-header offsets', () => {
    const zip = buildZip([
      { name: 'Statutes\\N-1.1\\EN\\N-1.1_EN.xml', data: '<x/>' },
      { name: 'plain.store', data: 'uncompressed' },
    ])
    const tail = zip.subarray(zip.length - 65536)
    const loc = findCentralDirectory(tail, zip.length)!
    const dir = parseCentralDirectory(zip.subarray(loc.cdOffset, loc.cdOffset + loc.cdSize))
    expect(dir.entries.size).toBe(2)
    const entry = dir.entries.get('Statutes\\N-1.1\\EN\\N-1.1_EN.xml')!
    expect(entry.method).toBe(8)

    const header = zip.subarray(entry.localHeaderOffset, entry.localHeaderOffset + 30)
    const range = entryDataRange(entry, header)
    expect(range.end - range.start + 1).toBe(entry.compressedSize)
  })
})

describe('readZipEntry', () => {
  it('reads a deflated entry through only range fetches', async () => {
    const zip = buildZip([
      { name: 'Statutes_EN_Status.txt', data: '"N-1.1", "Updated", "J", "20260610"\n' },
      { name: 'big.xml', data: '<LegislativeDocument/>'.repeat(50) },
    ])
    const { fetcher, calls } = rangeFetcherFor(zip)
    const dir = await openRemoteZip(fetcher, zip.length)

    const text = new TextDecoder().decode(
      await readZipEntry(fetcher, dir, 'Statutes_EN_Status.txt'),
    )
    expect(text).toContain('"N-1.1"')
    /* Every fetch was a bounded window — never the whole archive. */
    expect(calls.every(([s, e]) => e - s < zip.length)).toBe(true)
  })

  it('round-trips a stored (method 0) entry unchanged', async () => {
    const zip = buildZip([{ name: 'keep.store', data: 'as written' }])
    const { fetcher } = rangeFetcherFor(zip)
    const dir = await openRemoteZip(fetcher, zip.length)
    expect(new TextDecoder().decode(await readZipEntry(fetcher, dir, 'keep.store'))).toBe(
      'as written',
    )
  })

  it('throws on a missing entry name', async () => {
    const zip = buildZip([{ name: 'a.txt', data: 'x' }])
    const { fetcher } = rangeFetcherFor(zip)
    const dir = await openRemoteZip(fetcher, zip.length)
    await expect(readZipEntry(fetcher, dir, 'nope.txt')).rejects.toThrow(/not in directory/)
  })
})
