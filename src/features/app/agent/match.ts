import { bi } from '@/i18n/core'
import type { AgentToolOutcome } from './types'

/**
 * Shared helpers for module tool `run` bodies — the small vocabulary every
 * module's tools use: param extraction, name resolution, and the completed
 * outcome shape. Kept module-free so each module's agentTools file stays thin.
 */

/** Today as YYYY-MM-DD (UTC) — the stamp tools write when no date is passed. */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Trimmed non-empty string param, or undefined. */
export function str(params: Record<string, unknown>, key: string): string | undefined {
  const value = params[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/** Leading articles are noise for both register titles and title matching. */
export function stripArticle(text: string): string {
  return text.replace(/^(?:the|a|an|le|la|les|l')\s+/i, '').trim()
}

/** Case-insensitive exact match first, then substring — deterministic, no fuzz. */
export function findByName<T extends { id: string }>(
  items: readonly T[],
  name: string | undefined,
  nameOf: (item: T) => string,
): T | undefined {
  const needle = (name ?? '').trim().toLowerCase()
  if (!needle) return undefined
  return (
    items.find((item) => nameOf(item).toLowerCase() === needle) ??
    items.find((item) => nameOf(item).toLowerCase().includes(needle))
  )
}

export function ok(message: { en: string; fr: string }, entityId?: string): AgentToolOutcome {
  return {
    status: 'completed',
    message: bi(message.en, message.fr),
    ...(entityId ? { entityId } : {}),
  }
}
