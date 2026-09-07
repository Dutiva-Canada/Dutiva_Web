import type { FinanceLedgerAccount } from './types'

let extractorPromise: ReturnType<typeof loadExtractor> | null = null

async function loadExtractor() {
  const { env, pipeline } = await import('@xenova/transformers')
  env.allowRemoteModels = true
  env.useBrowserCache = true
  env.useFSCache = false
  env.cacheDir = 'dutiva-transformers-cache'
  // Avoid SharedArrayBuffer/COEP requirements and keep the browser permission surface small.
  env.backends.onnx.wasm.numThreads = 1
  return await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
    quantized: true,
  })
}

export function getExtractor() {
  if (!extractorPromise) extractorPromise = loadExtractor()
  return extractorPromise
}

export function clearExtractorForTests() {
  extractorPromise = null
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function meanEmbedding(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return []
  const dim = embeddings[0]!.length
  const result = new Array(dim).fill(0)
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      result[i]! += emb[i]!
    }
  }
  return result.map((v) => v / embeddings.length)
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëîïôöùûüç\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(text: string): string[] {
  return [...new Set(normalize(text).split(' ').filter((t) => t.length >= 2))]
}

export function mostCommonNGram(tokenLists: string[][]): string {
  const maxN = Math.min(4, Math.max(...tokenLists.map((t) => t.length), 1))
  let bestGram = ''
  let bestScore = -1
  for (let n = maxN; n >= 1; n--) {
    const counts = new Map<string, { count: number; total: number; minPos: number }>()
    for (let i = 0; i < tokenLists.length; i++) {
      const tokens = tokenLists[i]!
      const seen = new Set<string>()
      for (let pos = 0; pos <= tokens.length - n; pos++) {
        const gram = tokens.slice(pos, pos + n).join(' ')
        if (seen.has(gram)) continue
        seen.add(gram)
        const entry = counts.get(gram) ?? { count: 0, total: 0, minPos: Number.POSITIVE_INFINITY }
        entry.count += 1
        entry.total += 1
        entry.minPos = Math.min(entry.minPos, pos)
        counts.set(gram, entry)
      }
    }
    for (const [gram, entry] of counts) {
      const coverage = entry.count / tokenLists.length
      const lengthBonus = n * 0.1
      const score = coverage + lengthBonus - entry.minPos * 0.001
      if (score > bestScore) {
        bestScore = score
        bestGram = gram
      }
    }
  }
  return bestGram
}

export function directionForAccount(account: FinanceLedgerAccount): 'debit' | 'credit' {
  switch (account.type) {
    case 'revenue':
    case 'liability':
    case 'equity':
      return 'credit'
    case 'expense':
    case 'asset':
    case 'contra':
    default:
      return 'debit'
  }
}

export async function extractEmbeddings(
  texts: string[],
  extractor: (texts: string[], options: { pooling: 'mean'; normalize: true }) => Promise<unknown>,
): Promise<number[][]> {
  const outputs = (await extractor(texts, { pooling: 'mean', normalize: true })) as {
    data: number[]
    dims: number[]
  }
  const dim = outputs.dims[outputs.dims.length - 1] ?? 0
  const embeddings: number[][] = []
  for (let i = 0; i < texts.length; i++) {
    const start = i * dim
    embeddings.push(Array.from(outputs.data.slice(start, start + dim)))
  }
  return embeddings
}
