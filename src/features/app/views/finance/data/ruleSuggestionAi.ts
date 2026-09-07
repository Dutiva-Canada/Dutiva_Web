import type { RuleSuggestion } from './ruleSuggestion'
import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount } from './types'

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

function getExtractor() {
  if (!extractorPromise) extractorPromise = loadExtractor()
  return extractorPromise
}

function cosineSimilarity(a: number[], b: number[]): number {
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

function meanEmbedding(embeddings: number[][]): number[] {
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

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëîïôöùûüç\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  return [...new Set(normalize(text).split(' ').filter((t) => t.length >= 2))]
}

function mostCommonNGram(tokenLists: string[][]): string {
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

export async function suggestCategoryRulesWithAi(
  bankItems: FinanceBankItem[],
  ledgerAccounts: FinanceLedgerAccount[],
  existingRules: Pick<FinanceCategoryRule, 'pattern' | 'entityId'>[],
  _threshold = 0.35,
): Promise<RuleSuggestion[]> {
  const unmatched = bankItems.filter((bi) => bi.matchStatus === 'unmatched' && bi.description.trim())
  if (unmatched.length === 0 || ledgerAccounts.length === 0) return []

  const extractor = await getExtractor()

  const descriptions = unmatched.map((bi) => bi.description)
  const descOutputs = (await extractor(descriptions, { pooling: 'mean', normalize: true })) as {
    data: number[]
    dims: number[]
  }
  const dim = descOutputs.dims[descOutputs.dims.length - 1] ?? 0
  const descEmbeddings: number[][] = []
  for (let i = 0; i < descriptions.length; i++) {
    const start = i * dim
    descEmbeddings.push(Array.from(descOutputs.data.slice(start, start + dim)))
  }

  const accountLabels = ledgerAccounts.map(
    (la) => `${la.name.en} ${la.name.fr ?? ''} ${la.code} ${la.type}`,
  )
  const accountOutputs = (await extractor(accountLabels, { pooling: 'mean', normalize: true })) as {
    data: number[]
    dims: number[]
  }
  const accountEmbeddings: number[][] = []
  for (let i = 0; i < ledgerAccounts.length; i++) {
    const start = i * dim
    accountEmbeddings.push(Array.from(accountOutputs.data.slice(start, start + dim)))
  }

  // Cluster unmatched descriptions by cosine similarity
  const clusters: number[][] = []
  const visited = new Set<number>()
  for (let i = 0; i < descEmbeddings.length; i++) {
    if (visited.has(i)) continue
    const cluster: number[] = [i]
    visited.add(i)
    for (let j = i + 1; j < descEmbeddings.length; j++) {
      if (visited.has(j)) continue
      const sim = cosineSimilarity(descEmbeddings[i]!, descEmbeddings[j]!)
      if (sim >= 0.7) {
        cluster.push(j)
        visited.add(j)
      }
    }
    clusters.push(cluster)
  }

  const existingPatterns = new Set(existingRules.map((r) => r.pattern.toLowerCase()))

  function patternExists(pattern: string): boolean {
    const p = pattern.toLowerCase()
    for (const existing of existingPatterns) {
      if (p === existing || p.includes(existing) || existing.includes(p)) return true
    }
    return false
  }

  function directionForAccount(account: FinanceLedgerAccount): 'debit' | 'credit' {
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

  const suggestions: RuleSuggestion[] = []

  for (const cluster of clusters) {
    const clusterItems = cluster.map((i) => unmatched[i]!)
    const tokenLists = clusterItems.map((bi) => tokenize(bi.description))
    const rawGram = mostCommonNGram(tokenLists)
    const pattern = rawGram
      .split(' ')
      .map((t) => t.toUpperCase())
      .join(' ')

    if (patternExists(pattern)) continue

    const clusterEmbedding = meanEmbedding(cluster.map((i) => descEmbeddings[i]!))

    let bestAccount: FinanceLedgerAccount | null = null
    let bestScore = -1
    for (let i = 0; i < ledgerAccounts.length; i++) {
      const sim = cosineSimilarity(clusterEmbedding, accountEmbeddings[i]!)
      if (sim > bestScore) {
        bestScore = sim
        bestAccount = ledgerAccounts[i]!
      }
    }
    if (!bestAccount || bestScore < 0.25) continue

    const count = clusterItems.length
    const confidence: RuleSuggestion['confidence'] =
      count >= 3 && bestScore >= 0.55 ? 'high' : count >= 2 || bestScore >= 0.4 ? 'medium' : 'low'
    const priority = Math.min(50 + count * 5, 80)

    suggestions.push({
      pattern,
      matchType: 'contains',
      ledgerAccountId: bestAccount.id,
      direction: directionForAccount(bestAccount),
      priority,
      confidence,
      sampleDescriptions: clusterItems.slice(0, 3).map((bi) => bi.description),
      count,
      accountName: bestAccount.name.en,
    })

    existingPatterns.add(pattern.toLowerCase())
  }

  return suggestions.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 } as const
    const diff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    if (diff !== 0) return diff
    return b.count - a.count
  })
}
