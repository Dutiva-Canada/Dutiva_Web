/**
 * Reading individual files out of a remote ZIP with HTTP Range requests.
 *
 * A ZIP's central directory — the list of entries with their byte offsets —
 * sits at the very end of the file, so a reader that supports Range can
 * list and extract entries without downloading the archive. That matters for
 * Données Québec's codified-legislation zip: it is ~45 MB, but the manifest
 * (`Statutes_EN_Status.txt`) is 6.5 KB and a single Act's XML is tens of KB
 * compressed. Pulling what we need costs a handful of small requests instead
 * of one job-killing download.
 *
 * Layout relied on (the classic ZIP record format):
 *   EOCD  `PK\x05\x06` — end of central directory, found by scanning the tail
 *   CEN   `PK\x01\x02` — one record per entry: name, sizes, method, offset
 *   LFH   `PK\x03\x04` — local header preceding each entry's data; its name/
 *         extra lengths can differ from the central record's, so the data
 *         offset must be recomputed from the local header itself
 */

export interface ZipEntryMeta {
  name: string
  /** Compression method — 0 stored, 8 deflate. Anything else is refused. */
  method: number
  compressedSize: number
  uncompressedSize: number
  localHeaderOffset: number
}

export interface ZipDirectory {
  entries: Map<string, ZipEntryMeta>
}

/** Bytes fetched for the end-of-file scan — the EOCD record plus the archive
    comment live within the last 64 KB, and a zip64 EOCD would too. */
export const ZIP_TAIL_BYTES = 65536

function u16(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8)
}

function u32(b: Uint8Array, off: number): number {
  return (b[off] | (b[off + 1] << 8) | (b[off + 2] << 16) | (b[off + 3] << 24)) >>> 0
}

/**
 * Locate the end-of-central-directory record in a fetched tail buffer.
 * Returns the central directory's offset/size within the whole file, or null
 * when the signature is absent (not a zip, or tail fetch was too small).
 */
export function findCentralDirectory(
  tail: Uint8Array,
  fileSize: number,
): { cdOffset: number; cdSize: number } | null {
  /* Scan backwards for the signature — a trailing archive comment could
     contain the same bytes, so the record must also end the file (modulo a
     real comment, which this dataset does not use). */
  for (let i = tail.length - 22; i >= 0; i--) {
    if (
      tail[i] === 0x50 && // P
      tail[i + 1] === 0x4b && // K
      tail[i + 2] === 0x05 &&
      tail[i + 3] === 0x06
    ) {
      const cdSize = u32(tail, i + 12)
      const cdOffset = u32(tail, i + 16)
      /* Sanity: the directory must fit inside the file and land before the
         EOCD itself. */
      if (cdOffset + cdSize <= fileSize && cdOffset < fileSize) {
        return { cdOffset, cdSize }
      }
    }
  }
  return null
}

/**
 * Parse a fetched central directory into a name → entry map.
 * Entries whose compression method is neither stored nor deflate are still
 * listed — `readZipEntry` refuses them at fetch time.
 */
export function parseCentralDirectory(cd: Uint8Array): ZipDirectory {
  const entries = new Map<string, ZipEntryMeta>()
  let pos = 0
  const text = new TextDecoder()
  while (pos + 46 <= cd.length && u32(cd, pos) === 0x02014b50) {
    const method = u16(cd, pos + 10)
    const compressedSize = u32(cd, pos + 20)
    const uncompressedSize = u32(cd, pos + 24)
    const nameLen = u16(cd, pos + 28)
    const extraLen = u16(cd, pos + 30)
    const commentLen = u16(cd, pos + 32)
    const localHeaderOffset = u32(cd, pos + 42)
    const name = text.decode(cd.subarray(pos + 46, pos + 46 + nameLen))
    entries.set(name, { name, method, compressedSize, uncompressedSize, localHeaderOffset })
    pos += 46 + nameLen + extraLen + commentLen
  }
  return { entries }
}

/** Byte range holding an entry's compressed data — resolved off the local
    header, not the central record. */
export function entryDataRange(entry: ZipEntryMeta, localHeader: Uint8Array): {
  start: number
  end: number
} {
  if (u32(localHeader, 0) !== 0x04034b50) {
    throw new Error(`zipRange: no local header at offset ${entry.localHeaderOffset}`)
  }
  const nameLen = u16(localHeader, 26)
  const extraLen = u16(localHeader, 28)
  const start = entry.localHeaderOffset + 30 + nameLen + extraLen
  return { start, end: start + entry.compressedSize - 1 }
}

/** A fetcher as the caller supplies it — must honour HTTP Range. */
export type RangeFetcher = (start: number, end: number) => Promise<Uint8Array>

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  /* Deno and modern Node both expose DecompressionStream; 'deflate-raw' is
     the bare zlib stream ZIP entries carry (no zlib/gzip wrapper). */
  const src = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(data)
      c.close()
    },
  })
  const reader = src.pipeThrough(new DecompressionStream('deflate-raw')).getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

/**
 * Fetch and decompress one entry. Throws on a missing name or an unsupported
 * method — callers treat that as "the source changed shape", not silence.
 */
export async function readZipEntry(
  fetchRange: RangeFetcher,
  dir: ZipDirectory,
  name: string,
): Promise<Uint8Array> {
  const entry = dir.entries.get(name)
  if (!entry) throw new Error(`zipRange: entry not in directory: ${name}`)
  if (entry.method !== 0 && entry.method !== 8) {
    throw new Error(`zipRange: unsupported compression method ${entry.method} for ${name}`)
  }
  const header = await fetchRange(entry.localHeaderOffset, entry.localHeaderOffset + 29)
  const range = entryDataRange(entry, header)
  const data = await fetchRange(range.start, range.end)
  if (entry.method === 0) return data
  return inflateRaw(data)
}

/**
 * Convenience: directory of a remote zip given its size — three fetches
 * (tail, directory) amortized over however many entries get read.
 */
export async function openRemoteZip(
  fetchRange: RangeFetcher,
  fileSize: number,
): Promise<ZipDirectory> {
  const tail = await fetchRange(Math.max(0, fileSize - ZIP_TAIL_BYTES), fileSize - 1)
  const cdLoc = findCentralDirectory(tail, fileSize)
  if (!cdLoc) throw new Error('zipRange: no end-of-central-directory record found')
  const cd = await fetchRange(cdLoc.cdOffset, cdLoc.cdOffset + cdLoc.cdSize - 1)
  return parseCentralDirectory(cd)
}
