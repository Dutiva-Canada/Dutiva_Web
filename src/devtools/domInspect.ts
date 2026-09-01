/**
 * DOM → source helpers for the Dev Annotations overlay. Pure functions over a
 * DOM element, kept separate from the React UI so they can be unit-tested.
 */

export interface SourceInfo {
  /** Repo-relative path, e.g. 'src/features/app/views/cases/CasesView.tsx'. */
  file: string | null
  line: number | null
  /** Best-effort component name derived from the file basename. */
  component: string | null
}

/**
 * Read the nearest `data-loc` (stamped by the Babel plugin in vite.config.ts,
 * dev + preview only) at or above `el`. Returns nulls when absent — e.g. in a
 * production build, where nothing is stamped and the overlay never mounts
 * anyway.
 */
export function getSourceInfo(el: Element): SourceInfo {
  const host = el.closest('[data-loc]')
  const loc = host?.getAttribute('data-loc') ?? null
  if (!loc) return { file: null, line: null, component: null }
  const match = /^(.*):(\d+)$/.exec(loc)
  const file = match?.[1] ?? loc
  const line = match?.[2] ? Number(match[2]) : null
  const base = file.split('/').pop() ?? file
  const component = base.replace(/\.[jt]sx?$/, '') || null
  return { file, line, component }
}

/** A short, human-readable description of an element for the annotation list. */
export function describeElement(el: Element): string {
  let desc = el.tagName.toLowerCase()
  if (el.id) desc += `#${el.id}`
  const testid = el.getAttribute('data-testid')
  if (testid) desc += `[${testid}]`
  const label = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent ?? ''
  const clean = label.replace(/\s+/g, ' ').trim()
  if (clean) desc += ` "${clean.length > 60 ? `${clean.slice(0, 60)}…` : clean}"`
  return desc
}

/**
 * A best-effort CSS selector to re-find the element later (the "Locate"
 * action). Prefers a stable id/testid; otherwise walks up to four levels of
 * `tag:nth-of-type`. Not guaranteed to survive re-renders — locate degrades
 * gracefully when it no longer matches.
 */
export function buildSelector(el: Element): string {
  if (el.id) return `#${cssEscape(el.id)}`
  const testid = el.getAttribute('data-testid')
  if (testid) return `[data-testid="${cssEscape(testid)}"]`

  const parts: string[] = []
  let node: Element | null = el
  let depth = 0
  while (node && node.nodeType === 1 && depth < 4) {
    if (node.id) {
      parts.unshift(`#${cssEscape(node.id)}`)
      break
    }
    let part = node.tagName.toLowerCase()
    const parent: Element | null = node.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName)
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`
    }
    parts.unshift(part)
    node = node.parentElement
    depth++
  }
  return parts.join(' > ')
}

/** CSS.escape with a conservative manual fallback (jsdom/older engines). */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value
    .replace(/[^\w-]/g, (ch) => `\\${ch}`)
    .replace(/^(\d)/, (match) => `\\${match.charCodeAt(0).toString(16)} `)
}
