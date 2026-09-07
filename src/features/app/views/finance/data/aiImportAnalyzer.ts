import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import type { RuleSuggestion } from './ruleSuggestion'
import type {
  FinanceAiBankItemSuggestion,
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceCategorizationFeedback,
  FinanceCategoryRule,
  FinanceLedgerAccount,
} from './types'
import {
  getExtractor,
  extractEmbeddings,
  cosineSimilarity,
  meanEmbedding,
  tokenize,
  mostCommonNGram,
  directionForAccount,
} from './aiEmbeddings'

export interface AiCategorizationResult {
  bankItemId: string
  ledgerAccountId: string
  direction: 'debit' | 'credit'
  confidence: FinanceAiBankItemSuggestion['confidence']
  reasonKey: FinanceAiBankItemSuggestion['reasonKey']
  note: Bi
  matchStatus: FinanceBankMatchStatus
  pattern?: string
}

export interface AiImportAnalysisResult {
  categorizations: AiCategorizationResult[]
  ruleSuggestions: RuleSuggestion[]
}

function confidenceFromScore(
  score: number,
  hasFeedback: boolean,
): FinanceAiBankItemSuggestion['confidence'] {
  if (hasFeedback || score >= 0.7) return 'high'
  if (score >= 0.5) return 'medium'
  if (score >= 0.25) return 'low'
  return 'none'
}

function statusFromConfidence(
  confidence: FinanceAiBankItemSuggestion['confidence'],
  mode: 'suggest' | 'auto_high' | 'auto_all',
): FinanceBankMatchStatus {
  if (confidence === 'none') return 'unmatched'
  if (mode === 'suggest') return 'suggested'
  if (mode === 'auto_high') return confidence === 'high' ? 'matched' : 'suggested'
  return 'matched'
}

function confidenceLabel(confidence: FinanceAiBankItemSuggestion['confidence']): string {
  switch (confidence) {
    case 'high':
      return M.finance_suggest_rules_confidence_high.en
    case 'medium':
      return M.finance_suggest_rules_confidence_medium.en
    case 'low':
      return M.finance_suggest_rules_confidence_low.en
    case 'none':
    default:
      return M.finance_suggest_rules_confidence_low.en
  }
}

function confidenceLabelFr(confidence: FinanceAiBankItemSuggestion['confidence']): string {
  switch (confidence) {
    case 'high':
      return M.finance_suggest_rules_confidence_high.fr
    case 'medium':
      return M.finance_suggest_rules_confidence_medium.fr
    case 'low':
      return M.finance_suggest_rules_confidence_low.fr
    case 'none':
    default:
      return M.finance_suggest_rules_confidence_low.fr
  }
}

function buildNote(
  reasonKey: FinanceAiBankItemSuggestion['reasonKey'],
  account: FinanceLedgerAccount,
  confidence: FinanceAiBankItemSuggestion['confidence'],
): Bi {
  const code = account.code
  if (confidence === 'none') {
    return { en: M.finance_ai_note_review.en, fr: M.finance_ai_note_review.fr }
  }

  const accountNameEn = `${account.code} — ${account.name.en}`
  const accountNameFr = `${account.code} — ${account.name.fr}`
  const confEn = confidenceLabel(confidence)
  const confFr = confidenceLabelFr(confidence)

  if (reasonKey === 'feedback_match') {
    return {
      en: M.finance_ai_note_feedback.en
        .replace('{account}', accountNameEn)
        .replace('{code}', code)
        .replace('{confidence}', confEn),
      fr: M.finance_ai_note_feedback.fr
        .replace('{account}', accountNameFr)
        .replace('{code}', code)
        .replace('{confidence}', confFr),
    }
  }

  return {
    en: M.finance_ai_note_matched.en
      .replace('{account}', accountNameEn)
      .replace('{code}', code)
      .replace('{confidence}', confEn),
    fr: M.finance_ai_note_matched.fr
      .replace('{account}', accountNameFr)
      .replace('{code}', code)
      .replace('{confidence}', confFr),
  }
}

function findBestAccount(
  itemEmbedding: number[],
  accountEmbeddings: number[][],
  ledgerAccounts: FinanceLedgerAccount[],
): { account: FinanceLedgerAccount; score: number } | null {
  let bestAccount: FinanceLedgerAccount | null = null
  let bestScore = -1
  for (let i = 0; i < ledgerAccounts.length; i++) {
    const sim = cosineSimilarity(itemEmbedding, accountEmbeddings[i]!)
    if (sim > bestScore) {
      bestScore = sim
      bestAccount = ledgerAccounts[i]!
    }
  }
  if (!bestAccount) return null
  return { account: bestAccount, score: bestScore }
}

function findBestFeedback(
  itemEmbedding: number[],
  feedbackEmbeddings: number[][],
  feedbacks: FinanceCategorizationFeedback[],
): FinanceCategorizationFeedback | null {
  let bestFeedback: FinanceCategorizationFeedback | null = null
  let bestScore = -1
  for (let i = 0; i < feedbacks.length; i++) {
    const sim = cosineSimilarity(itemEmbedding, feedbackEmbeddings[i]!)
    if (sim > bestScore) {
      bestScore = sim
      bestFeedback = feedbacks[i]!
    }
  }
  if (!bestFeedback || bestScore < 0.8) return null
  return bestFeedback
}

function ruleMatches(rule: { pattern: string; matchType: string }, text: string): boolean {
  const t = text.toLowerCase()
  const p = rule.pattern.toLowerCase()
  switch (rule.matchType) {
    case 'exact':
      return t === p
    case 'starts_with':
      return t.startsWith(p)
    case 'ends_with':
      return t.endsWith(p)
    case 'contains':
    default:
      return t.includes(p)
  }
}

function ruleBasedCategorizations(
  bankItems: FinanceBankItem[],
  ledgerAccounts: FinanceLedgerAccount[],
  rules: Pick<FinanceCategoryRule, 'pattern' | 'matchType' | 'ledgerAccountId' | 'direction' | 'priority' | 'entityId'>[],
  mode: 'suggest' | 'auto_high' | 'auto_all',
): AiImportAnalysisResult {
  const sorted = [...rules].sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50))
  const categorizations: AiCategorizationResult[] = bankItems.map((bi) => {
    const match = sorted.find((r) => ruleMatches(r, bi.description))
    if (match) {
      const account = ledgerAccounts.find((la) => la.id === match.ledgerAccountId)
      if (account) {
        const confidence: FinanceAiBankItemSuggestion['confidence'] = 'high'
        return {
          bankItemId: bi.id,
          ledgerAccountId: account.id,
          direction: match.direction,
          confidence,
          reasonKey: 'rule_match',
          note: buildNote('rule_match', account, confidence),
          matchStatus: statusFromConfidence(confidence, mode),
          pattern: match.pattern,
        }
      }
    }
    return {
      bankItemId: bi.id,
      ledgerAccountId: ledgerAccounts[0]!.id,
      direction: directionForAccount(ledgerAccounts[0]!),
      confidence: 'none',
      reasonKey: 'fallback',
      note: buildNote('fallback', ledgerAccounts[0]!, 'none'),
      matchStatus: statusFromConfidence('none', mode),
    }
  })
  return { categorizations, ruleSuggestions: [] }
}

export async function analyzeImportWithAi(
  bankItems: FinanceBankItem[],
  ledgerAccounts: FinanceLedgerAccount[],
  existingRules: Pick<FinanceCategoryRule, 'pattern' | 'matchType' | 'ledgerAccountId' | 'direction' | 'priority' | 'entityId'>[],
  feedback: FinanceCategorizationFeedback[],
  mode: 'suggest' | 'auto_high' | 'auto_all',
): Promise<AiImportAnalysisResult> {
  const unmatched = bankItems.filter((bi) => bi.matchStatus === 'unmatched' && bi.description.trim())
  if (unmatched.length === 0 || ledgerAccounts.length === 0) {
    return { categorizations: [], ruleSuggestions: [] }
  }

  try {
    const extractor = await getExtractor()

    const descEmbeddings = await extractEmbeddings(
      unmatched.map((bi) => bi.description),
      extractor,
    )

  const accountLabels = ledgerAccounts.map(
    (la) => `${la.name.en} ${la.name.fr ?? ''} ${la.code} ${la.type}`,
  )
  const accountEmbeddings = await extractEmbeddings(accountLabels, extractor)

  const feedbackTexts = feedback.map((f) => f.description)
  const feedbackEmbeddings =
    feedbackTexts.length > 0 ? await extractEmbeddings(feedbackTexts, extractor) : []

  // Cluster unmatched descriptions to derive rule suggestions
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

  // Build rule suggestions from clusters
  const ruleSuggestions: RuleSuggestion[] = []
  const ruleForPattern = new Map<string, RuleSuggestion>()

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
    const best = findBestAccount(clusterEmbedding, accountEmbeddings, ledgerAccounts)
    if (!best || best.score < 0.25) continue

    const count = clusterItems.length
    const confidence: RuleSuggestion['confidence'] =
      count >= 3 && best.score >= 0.55 ? 'high' : count >= 2 || best.score >= 0.4 ? 'medium' : 'low'
    const priority = Math.min(50 + count * 5, 80)
    const rule: RuleSuggestion = {
      pattern,
      matchType: 'contains',
      ledgerAccountId: best.account.id,
      direction: directionForAccount(best.account),
      priority,
      confidence,
      sampleDescriptions: clusterItems.slice(0, 3).map((bi) => bi.description),
      count,
      accountName: best.account.name.en,
    }
    ruleSuggestions.push(rule)
    ruleForPattern.set(pattern, rule)
    existingPatterns.add(pattern.toLowerCase())
  }

  // Per-item categorization
  const categorizations: AiCategorizationResult[] = unmatched.map((bi, i) => {
    const feedbackMatch =
      feedbackEmbeddings.length > 0 ? findBestFeedback(descEmbeddings[i]!, feedbackEmbeddings, feedback) : null

    if (feedbackMatch) {
      const account = ledgerAccounts.find((la) => la.id === feedbackMatch.correctedLedgerAccountId)
      if (account) {
        const confidence: FinanceAiBankItemSuggestion['confidence'] = 'high'
        return {
          bankItemId: bi.id,
          ledgerAccountId: account.id,
          direction: feedbackMatch.correctedDirection,
          confidence,
          reasonKey: 'feedback_match',
          note: buildNote('feedback_match', account, confidence),
          matchStatus: statusFromConfidence(confidence, mode),
        }
      }
    }

    // First try to match a generated rule pattern (exact text contains)
    let ruleMatch: RuleSuggestion | null = null
    for (const [pattern, rule] of ruleForPattern) {
      if (bi.description.toUpperCase().includes(pattern)) {
        if (!ruleMatch || rule.priority > ruleMatch.priority) ruleMatch = rule
      }
    }

    if (ruleMatch) {
      const account = ledgerAccounts.find((la) => la.id === ruleMatch!.ledgerAccountId)
      if (account) {
        const confidence: FinanceAiBankItemSuggestion['confidence'] = ruleMatch.confidence
        return {
          bankItemId: bi.id,
          ledgerAccountId: account.id,
          direction: ruleMatch.direction,
          confidence,
          reasonKey: 'rule_match',
          note: buildNote('rule_match', account, confidence),
          matchStatus: statusFromConfidence(confidence, mode),
          pattern: ruleMatch.pattern,
        }
      }
    }

    // Fall back to direct semantic similarity
    const best = findBestAccount(descEmbeddings[i]!, accountEmbeddings, ledgerAccounts)
    if (!best || best.score < 0.15) {
      return {
        bankItemId: bi.id,
        ledgerAccountId: ledgerAccounts[0]!.id,
        direction: directionForAccount(ledgerAccounts[0]!),
        confidence: 'none',
        reasonKey: 'fallback',
        note: buildNote('fallback', ledgerAccounts[0]!, 'none'),
        matchStatus: statusFromConfidence('none', mode),
      }
    }

    const confidence = confidenceFromScore(best.score, false)
    return {
      bankItemId: bi.id,
      ledgerAccountId: best.account.id,
      direction: directionForAccount(best.account),
      confidence,
      reasonKey: 'semantic_match',
      note: buildNote('semantic_match', best.account, confidence),
      matchStatus: statusFromConfidence(confidence, mode),
    }
  })

  return {
    categorizations,
    ruleSuggestions: ruleSuggestions.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 } as const
      const diff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
      if (diff !== 0) return diff
      return b.count - a.count
    }),
  }
  } catch (error) {
    console.error('[finance] AI model unavailable; falling back to rule-based analysis:', error)
    return ruleBasedCategorizations(unmatched, ledgerAccounts, existingRules, mode)
  }
}

// Helper used by the UI when a user edits an AI suggestion.
export function generateCorrectionNote(
  account: FinanceLedgerAccount,
  reason: 'manual' | 'accepted' | 'rejected',
): Bi {
  if (reason === 'rejected') {
    return { en: 'Marked for review.', fr: 'Marqué pour révision.' }
  }
  if (reason === 'accepted') {
    return {
      en: `Accepted: ${account.code} — ${account.name.en}.`,
      fr: `Accepté : ${account.code} — ${account.name.fr}.`,
    }
  }
  return {
    en: `Manually changed to ${account.code} — ${account.name.en}.`,
    fr: `Changé manuellement pour ${account.code} — ${account.name.fr}.`,
  }
}
