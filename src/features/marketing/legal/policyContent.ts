import type { Lang } from '@/i18n/core'

/**
 * Typed collection over the bilingual policy documents shipped by the
 * dutiva.ca content-migration handoff (`content/<slug>.{en,fr}.ts`).
 *
 * The EN and FR editions of a document are NOT structurally parallel — most
 * pairs differ in section, block, or callout counts (the French editions were
 * drafted as whole documents, not sentence-by-sentence translations). So a
 * document stores two independent language editions rather than zipped `Bi`
 * fields, and `loadPolicyEdition` loads the active language's edition,
 * falling back to the other language when one side is missing.
 *
 * Each edition is loaded lazily (one dynamic import per slug+lang) rather
 * than bundled eagerly: the 26 documents × 2 languages are prose-heavy and
 * only ever needed one at a time (a single /legal/:slug page render), so
 * eager-bundling them all into whichever chunk imports this module inflates
 * that chunk by hundreds of kB for content almost never read.
 */

interface PolicyBlock {
  type: 'p' | 'li'
  text: string
}

interface PolicySection {
  title: string
  blocks: PolicyBlock[]
}

/** One language edition of a policy document. */
export interface PolicyEdition {
  title: string
  lastUpdated?: string
  effectiveDate?: string
  callout?: string[]
  sections: PolicySection[]
}

type EditionLoader = () => Promise<PolicyEdition>

export interface PolicyDoc {
  slug: string
  en?: EditionLoader
  fr?: EditionLoader
}

const editionLoaders = import.meta.glob<PolicyEdition>('./content/*.ts', { import: 'default' })

function buildCollection(): Map<string, PolicyDoc> {
  const docs = new Map<string, PolicyDoc>()
  for (const [path, load] of Object.entries(editionLoaders)) {
    const match = /\/([a-z0-9-]+)\.(en|fr)\.ts$/.exec(path)
    if (!match) continue
    const slug = match[1]
    const lang = match[2] as Lang
    if (!slug) continue
    const doc = docs.get(slug) ?? { slug }
    doc[lang] = load
    docs.set(slug, doc)
  }
  return docs
}

const collection = buildCollection()

export function policyDoc(slug: string): PolicyDoc | undefined {
  return collection.get(slug)
}

interface ResolvedPolicyEdition {
  edition: PolicyEdition
  /** The language the edition is actually written in (≠ requested on fallback). */
  lang: Lang
}

/** Loads the active language's edition, or the other language's when missing. */
export async function loadPolicyEdition(
  doc: PolicyDoc,
  lang: Lang,
): Promise<ResolvedPolicyEdition | undefined> {
  const preferred = doc[lang]
  if (preferred) return { edition: await preferred(), lang }
  const other: Lang = lang === 'en' ? 'fr' : 'en'
  const fallback = doc[other]
  return fallback ? { edition: await fallback(), lang: other } : undefined
}

const editionCache = new Map<string, Promise<ResolvedPolicyEdition | undefined>>()

/**
 * Stable per-(slug, lang) promise for React's `use()`: PolicyPage suspends on
 * it, so prerendering (react-dom/static waits for suspended trees) emits the
 * full document text, and on the client the same promise instance keeps
 * re-renders from re-triggering the import.
 */
export function policyEditionResource(
  doc: PolicyDoc,
  lang: Lang,
): Promise<ResolvedPolicyEdition | undefined> {
  const key = `${doc.slug}:${lang}`
  let promise = editionCache.get(key)
  if (!promise) {
    promise = loadPolicyEdition(doc, lang)
    editionCache.set(key, promise)
  }
  return promise
}

/**
 * Consecutive `li` blocks grouped into one list so the page can render a
 * semantic `<ul>`; `p` blocks stay standalone paragraphs.
 */
type PolicyBlockGroup = { kind: 'p'; text: string } | { kind: 'list'; items: string[] }

export function groupPolicyBlocks(blocks: PolicyBlock[]): PolicyBlockGroup[] {
  const groups: PolicyBlockGroup[] = []
  for (const block of blocks) {
    const last = groups.at(-1)
    if (block.type === 'li') {
      if (last?.kind === 'list') last.items.push(block.text)
      else groups.push({ kind: 'list', items: [block.text] })
    } else {
      groups.push({ kind: 'p', text: block.text })
    }
  }
  return groups
}
