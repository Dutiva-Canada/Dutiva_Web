import type { ReactNode } from 'react'
import { Children, cloneElement, createElement, isValidElement } from 'react'
import type { Lang } from '@/i18n/core'
import { pickL } from '@/i18n/core'
import type { MemoryUsedRead } from './contract'

/** One phrase to gold-underline in an Advisor reply. */
export interface MemoryHighlightPhrase {
  id: string
  phrase: string
  /** Hover title — provenance / full statement. */
  title: string
}

export interface MemoryTextSegment {
  text: string
  factId?: string
  title?: string
}

const MIN_PHRASE_LEN = 10

/**
 * Longest-first, non-overlapping case-insensitive matches of memory phrases
 * inside reply text. Used for demo/production gold in-answer highlights.
 */
export function segmentTextByMemoryPhrases(
  text: string,
  phrases: readonly MemoryHighlightPhrase[],
): MemoryTextSegment[] {
  if (!text || phrases.length === 0) return [{ text }]

  const usable = phrases
    .filter((p) => p.phrase.trim().length >= MIN_PHRASE_LEN)
    .map((p) => ({ ...p, phrase: p.phrase.trim() }))
    .sort((a, b) => b.phrase.length - a.phrase.length)

  if (usable.length === 0) return [{ text }]

  const lower = text.toLowerCase()
  type Hit = { start: number; end: number; phrase: MemoryHighlightPhrase }
  const hits: Hit[] = []

  for (const phrase of usable) {
    const needle = phrase.phrase.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const at = lower.indexOf(needle, from)
      if (at < 0) break
      const end = at + needle.length
      const overlaps = hits.some((h) => at < h.end && end > h.start)
      if (!overlaps) hits.push({ start: at, end, phrase })
      from = at + 1
    }
  }

  if (hits.length === 0) return [{ text }]
  hits.sort((a, b) => a.start - b.start)

  const segments: MemoryTextSegment[] = []
  let cursor = 0
  for (const hit of hits) {
    if (hit.start > cursor) segments.push({ text: text.slice(cursor, hit.start) })
    segments.push({
      text: text.slice(hit.start, hit.end),
      factId: hit.phrase.id,
      title: hit.phrase.title,
    })
    cursor = hit.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) })
  return segments
}

/** Build highlight phrases from the workspace `memory` payload for the active language. */
export function phrasesFromMemoryUsed(
  memory: MemoryUsedRead | null | undefined,
  lang: Lang,
): MemoryHighlightPhrase[] {
  if (memory == null || memory.items.length === 0) return []
  return memory.items.map((item, i) => {
    const label = pickL(item.label, lang)
    return {
      id: item.factId ?? `mem-${i}`,
      phrase: label,
      title: label,
    }
  })
}

const SKIP_HIGHLIGHT_TAGS = new Set(['code', 'pre', 'a', 'svg', 'button'])

/**
 * Walk React children and gold-wrap string leaves that match memory phrases.
 * Skips code / links so markdown structure stays intact.
 */
export function highlightReactNodes(
  node: ReactNode,
  phrases: readonly MemoryHighlightPhrase[],
): ReactNode {
  if (phrases.length === 0 || node == null || typeof node === 'boolean') return node
  if (typeof node === 'string') {
    const segments = segmentTextByMemoryPhrases(node, phrases)
    if (segments.length === 1 && segments[0]!.factId === undefined) return node
    return segments.map((seg, i) => {
      if (seg.factId === undefined) return seg.text
      return createElement(
        'span',
        {
          key: `${seg.factId}-${i}`,
          title: seg.title,
          className:
            'cursor-help rounded-[3px] border-b-[1.5px] border-gold-dot bg-gold-bg px-[3px] py-px font-semibold text-gold-fg',
        },
        seg.text,
      )
    })
  }
  if (typeof node === 'number') return node
  if (Array.isArray(node)) {
    return Children.map(node, (child) => highlightReactNodes(child, phrases))
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const type = node.type
    const tag =
      typeof type === 'string'
        ? type
        : typeof type === 'function' && 'displayName' in type
          ? String((type as { displayName?: string }).displayName ?? '')
          : ''
    if (SKIP_HIGHLIGHT_TAGS.has(tag) || SKIP_HIGHLIGHT_TAGS.has(String(type))) {
      return node
    }
    if (node.props.children === undefined) return node
    return cloneElement(node, {
      ...node.props,
      children: highlightReactNodes(node.props.children, phrases),
    })
  }
  return node
}
