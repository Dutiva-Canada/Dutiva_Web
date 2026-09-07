import type { RuleSuggestion } from './ruleSuggestion'
import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount } from './types'
import {
  getExtractor,
  extractEmbeddings,
  cosineSimilarity,
  meanEmbedding,
  tokenize,
  mostCommonNGram,
  directionForAccount,
} from './aiEmbeddings'

export async function suggestCategoryRulesWithAi(
  bankItems: FinanceBankItem[],
  ledgerAccounts: FinanceLedgerAccount[],
  existingRules: Pick<FinanceCategoryRule, 'pattern' | 'entityId'>[],
  _threshold = 0.35,
): Promise<RuleSuggestion[]> {
  const unmatched = bankItems.filter((bi) => bi.matchStatus === 'unmatched' && bi.description.trim())
  if (unmatched.length === 0 || ledgerAccounts.length === 0) return []

  const extractor = await getExtractor()

  const descEmbeddings = await extractEmbeddings(
    unmatched.map((bi) => bi.description),
    extractor,
  )

  const accountLabels = ledgerAccounts.map(
    (la) => `${la.name.en} ${la.name.fr ?? ''} ${la.code} ${la.type}`,
  )
  const accountEmbeddings = await extractEmbeddings(accountLabels, extractor)

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
