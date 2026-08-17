/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import type { Lang } from '@/i18n/core'
import { jsonLdDocument, serializeJsonLd } from './jsonld'
import type { JsonLdNode } from './jsonld'
import { OG_IMAGE, ORG, absoluteUrl } from './site'

/**
 * Framework-independent document-head model. A page's <Seo> component builds
 * one `HeadData`; on the client it is applied to `document.head` after each
 * route transition, and during prerendering it is collected by the server
 * sink (src/entry-server.tsx) and serialized into the static HTML.
 *
 * All managed elements carry `data-seo` so client-side application is a
 * deterministic replace-all — no duplicate or stale tags across navigations.
 */

export interface HeadTag {
  tag: 'meta' | 'link'
  attrs: Record<string, string>
}

export interface HeadData {
  lang: Lang
  title: string
  tags: HeadTag[]
  /** Serialized JSON-LD (already escaped), or null when a page has none. */
  jsonLd: string | null
}

export interface HeadInput {
  lang: Lang
  title: string
  description: string
  /** Canonical pathname per locale. The current locale's is the canonical. */
  path: Record<Lang, string>
  /** false → noindex, nofollow; excluded from sitemap by the registry. */
  indexable: boolean
  jsonLd?: JsonLdNode[]
}

const OG_LOCALE: Record<Lang, string> = { en: 'en_CA', fr: 'fr_CA' }

export function buildHead(input: HeadInput): HeadData {
  const { lang, title, description, path, indexable } = input
  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const canonical = absoluteUrl(path[lang])
  const image = OG_IMAGE[lang]

  const tags: HeadTag[] = [
    meta('description', description),
    meta('robots', indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'),
  ]

  /* noindex pages (404, app shell) get title + description + robots only —
     canonical/hreflang/social tags would invite sharing and indexing signals
     that contradict the robots directive. */
  if (!indexable) {
    return { lang, title, tags, jsonLd: null }
  }

  tags.push(
    link('canonical', canonical),
    alternate('en-CA', path.en),
    alternate('fr-CA', path.fr),
    alternate('x-default', path.en),
    og('og:site_name', ORG.name),
    og('og:type', 'website'),
    og('og:title', title),
    og('og:description', description),
    og('og:url', canonical),
    og('og:locale', OG_LOCALE[lang]),
    og('og:locale:alternate', OG_LOCALE[other]),
    og('og:image', absoluteUrl(image.path)),
    og('og:image:width', String(OG_IMAGE.width)),
    og('og:image:height', String(OG_IMAGE.height)),
    og('og:image:alt', image.alt),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', title),
    meta('twitter:description', description),
    meta('twitter:image', absoluteUrl(image.path)),
    meta('twitter:image:alt', image.alt),
  )

  return {
    lang,
    title,
    tags,
    jsonLd: input.jsonLd && input.jsonLd.length > 0 ? serializeJsonLd(jsonLdDocument(input.jsonLd)) : null,
  }
}

function meta(name: string, content: string): HeadTag {
  return { tag: 'meta', attrs: { name, content } }
}

function og(property: string, content: string): HeadTag {
  return { tag: 'meta', attrs: { property, content } }
}

function link(rel: string, href: string): HeadTag {
  return { tag: 'link', attrs: { rel, href } }
}

function alternate(hreflang: string, path: string): HeadTag {
  return { tag: 'link', attrs: { rel: 'alternate', hreflang, href: absoluteUrl(path) } }
}

/* ------------------------------------------------------------------ */
/* Client-side application                                             */
/* ------------------------------------------------------------------ */

const MARKER = 'data-seo'

/**
 * Applies `HeadData` to the live document. Replace-all semantics: every
 * previously managed element (and the template's unmanaged description, on
 * first run) is removed before the new set is inserted, so client-side
 * navigation never accumulates duplicate tags.
 */
export function applyHead(head: HeadData): void {
  document.title = head.title

  for (const el of document.head.querySelectorAll(`[${MARKER}], meta[name="description"]`)) {
    el.remove()
  }

  const fragment = document.createDocumentFragment()
  for (const tag of head.tags) {
    const el = document.createElement(tag.tag)
    for (const [name, value] of Object.entries(tag.attrs)) el.setAttribute(name, value)
    el.setAttribute(MARKER, '')
    fragment.append(el)
  }
  if (head.jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(MARKER, '')
    script.textContent = head.jsonLd
    fragment.append(script)
  }
  document.head.append(fragment)
}

/* ------------------------------------------------------------------ */
/* Server / prerender serialization                                    */
/* ------------------------------------------------------------------ */

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Serializes `HeadData` (title + managed tags) for static HTML injection. */
export function serializeHead(head: HeadData): string {
  const lines = [`<title>${escapeText(head.title)}</title>`]
  for (const tag of head.tags) {
    const attrs = Object.entries(tag.attrs)
      .map(([name, value]) => `${name}="${escapeHtmlAttr(value)}"`)
      .join(' ')
    lines.push(`<${tag.tag} ${attrs} ${MARKER}>`)
  }
  if (head.jsonLd) {
    lines.push(`<script type="application/ld+json" ${MARKER}>${head.jsonLd}</script>`)
  }
  return lines.join('\n    ')
}
