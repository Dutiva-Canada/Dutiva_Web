import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount } from './types'

export type RuleSuggestionConfidence = 'high' | 'medium' | 'low'

export interface RuleSuggestion {
  pattern: string
  matchType: 'contains' | 'exact' | 'starts_with' | 'ends_with'
  ledgerAccountId: string
  direction: 'debit' | 'credit'
  priority: number
  confidence: RuleSuggestionConfidence
  sampleDescriptions: string[]
  count: number
  accountName: string
}

const ACCOUNT_KEYWORDS: Record<string, string[]> = {
  // Salaries and wages
  '6000': ['salary', 'salaries', 'wage', 'wages', 'payroll', 'pay', 'payroll', 'paycheque', 'paycheck', 'paie'],
  // Bank fees
  '6100': ['bank', 'fee', 'fees', 'service', 'charge', 'charges', 'nsf', 'overdraft', 'frais', 'bancaires'],
  // Utilities
  '6200': ['hydro', 'telecom', 'internet', 'utility', 'utilities', 'electricity', 'gas', 'phone', 'eau'],
  // Office expenses
  '6300': ['office', 'supplies', 'staples', 'amazon', 'paper', 'fournitures', 'bureau'],
  // Revenue — Services
  '5000': ['stripe', 'shopify', 'square', 'revenue', 'sales', 'sale', 'income', 'payout', 'deposit', 'revenu', 'vente'],
  // Rent
  '5100': ['rent', 'rental', 'lease', 'loyer', 'bail'],
  // Accounts payable / receivable
  '1200': ['customer', 'client', 'receivable', 'invoice'],
  '2000': ['supplier', 'vendor', 'payable', 'bill'],
}
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'from', 'with', 'via', 'to', 'of', 'in', 'on', 'at', 'a', 'an', 'is', 'are', 'was', 'were',
  'de', 'et', 'pour', 'des', 'du', 'le', 'la', 'les', 'un', 'une', 'dans', 'sur', 'avec', 'par', 'à', 'au', 'aux',
])

function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëîïôöùûüç\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
  return [...new Set(normalized)]
}

function termFrequency(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  const max = Math.max(...counts.values(), 1)
  const tf = new Map<string, number>()
  for (const [token, count] of counts) {
    tf.set(token, 0.5 + (0.5 * count) / max)
  }
  return tf
}

function buildTfidfVectors(items: string[]): { vectors: Map<string, number>[]; idf: Map<string, number> } {
  const tokenLists = items.map(tokenize)
  const documentFrequency = new Map<string, number>()
  for (const tokens of tokenLists) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
    }
  }
  const n = items.length || 1
  const idf = new Map<string, number>()
  for (const [token, df] of documentFrequency) {
    idf.set(token, Math.log(n / df))
  }

  const vectors: Map<string, number>[] = []
  for (const tokens of tokenLists) {
    const tf = termFrequency(tokens)
    const vector = new Map<string, number>()
    for (const [token, tfVal] of tf) {
      const idfVal = idf.get(token) ?? 0
      vector.set(token, tfVal * idfVal)
    }
    vectors.push(vector)
  }
  return { vectors, idf }
}

function vectorNorm(vector: Map<string, number>): number {
  let sum = 0
  for (const value of vector.values()) {
    sum += value * value
  }
  return Math.sqrt(sum)
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)))
  const union = new Set([...a, ...b])
  if (union.size === 0) return 0
  return intersection.size / union.size
}

function cosineTfidfSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  for (const [token, aVal] of a) {
    const bVal = b.get(token)
    if (bVal !== undefined) {
      dot += aVal * bVal
    }
  }
  const normA = vectorNorm(a)
  const normB = vectorNorm(b)
  if (normA === 0 || normB === 0) return 0
  return dot / (normA * normB)
}

function similarity(a: Map<string, number>, b: Map<string, number>, tokenSetA: Set<string>, tokenSetB: Set<string>): number {
  return 0.5 * jaccardSimilarity(tokenSetA, tokenSetB) + 0.5 * cosineTfidfSimilarity(a, b)
}

class UnionFind {
  parent: number[]
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i)
  }
  find(i: number): number {
    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i]!)
    return this.parent[i]
  }
  union(i: number, j: number): void {
    const rootI = this.find(i)
    const rootJ = this.find(j)
    if (rootI !== rootJ) this.parent[rootJ] = rootI
  }
}

function clusterItems(vectors: Map<string, number>[], tokenSets: Set<string>[], threshold: number): number[][] {
  const n = vectors.length
  if (n === 0) return []
  const uf = new UnionFind(n)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (similarity(vectors[i]!, vectors[j]!, tokenSets[i]!, tokenSets[j]!) >= threshold) {
        uf.union(i, j)
      }
    }
  }
  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const root = uf.find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(i)
  }
  return [...groups.values()]
}

function generateNGrams(tokens: string[], n: number): string[] {
  if (n > tokens.length) return []
  const grams: string[] = []
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(' '))
  }
  return grams
}

function mostCommonNGram(tokenLists: string[][]): string {
  const n = tokenLists.length
  if (n === 1) {
    const tokens = tokenLists[0]!
    if (tokens.length <= 2) return tokens.join(' ')
    return tokens.slice(0, 2).join(' ')
  }

  const maxN = Math.min(4, Math.max(...tokenLists.map((t) => t.length), 1))
  let bestGram = ''
  let bestScore = -1

  for (let gramN = maxN; gramN >= 1; gramN--) {
    const coverage = new Map<string, { count: number; total: number; minPosition: number }>()
    for (let itemIndex = 0; itemIndex < tokenLists.length; itemIndex++) {
      const tokens = tokenLists[itemIndex]!
      const seen = new Set<string>()
      const grams = generateNGrams(tokens, gramN)
      for (let pos = 0; pos < grams.length; pos++) {
        const gram = grams[pos]!
        if (seen.has(gram)) continue
        seen.add(gram)
        const entry = coverage.get(gram) ?? { count: 0, total: 0, minPosition: Number.POSITIVE_INFINITY }
        entry.count += 1
        entry.total += 1
        entry.minPosition = Math.min(entry.minPosition, pos)
        coverage.set(gram, entry)
      }
    }

    for (const [gram, entry] of coverage) {
      const coverageRatio = entry.count / n
      const lengthBonus = gramN * 0.1
      const score = coverageRatio + lengthBonus - entry.minPosition * 0.001
      if (score > bestScore) {
        bestScore = score
        bestGram = gram
      }
    }
  }

  return bestGram
}

function accountScore(
  patternTokens: string[],
  clusterTokens: string[],
  account: FinanceLedgerAccount,
  idf: Map<string, number>,
): number {
  const accountNameTokens = [...tokenize(account.name.en), ...tokenize(account.name.fr), ...tokenize(account.code)]
  const keywords = new Set(ACCOUNT_KEYWORDS[account.code] ?? [])
  const allAccountTokens = [...new Set([...accountNameTokens, ...keywords])]

  let score = 0
  const seen = new Set<string>()
  const allPatternTokens = [...new Set([...patternTokens, ...clusterTokens])]

  for (const token of allPatternTokens) {
    if (seen.has(token)) continue
    seen.add(token)
    if (keywords.has(token)) {
      score += 1.5
    } else if (allAccountTokens.includes(token)) {
      score += idf.get(token) ?? 0.5
    }
  }
  return score / Math.sqrt(allPatternTokens.length * allAccountTokens.length || 1)
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

export function suggestCategoryRules(
  bankItems: FinanceBankItem[],
  ledgerAccounts: FinanceLedgerAccount[],
  existingRules: Pick<FinanceCategoryRule, 'pattern' | 'entityId'>[],
  threshold = 0.35,
): RuleSuggestion[] {
  const unmatched = bankItems.filter((bi) => bi.matchStatus === 'unmatched' && bi.description.trim())
  if (unmatched.length === 0 || ledgerAccounts.length === 0) return []

  const descriptions = unmatched.map((bi) => bi.description)
  const tokenLists = descriptions.map(tokenize)
  const tokenSets = tokenLists.map((tokens) => new Set(tokens))
  const { vectors, idf } = buildTfidfVectors(descriptions)
  const clusters = clusterItems(vectors, tokenSets, threshold)

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

    const patternTokens = tokenize(pattern)
    const clusterTokens = clusterItems.flatMap((bi) => tokenize(bi.description))
    let bestAccount: FinanceLedgerAccount | null = null
    let bestScore = -1
    for (const account of ledgerAccounts) {
      const score = accountScore(patternTokens, clusterTokens, account, idf)
      if (score > bestScore) {
        bestScore = score
        bestAccount = account
      }
    }
    if (!bestAccount || bestScore === 0) continue

    const count = clusterItems.length
    const confidence: RuleSuggestionConfidence =
      count >= 3 && bestScore >= 0.2 ? 'high' : count >= 2 || bestScore >= 0.15 ? 'medium' : 'low'

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
