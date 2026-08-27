/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/* oxlint-disable react/only-export-components -- HeadSinkContext is part of
   the head-management API (consumed by entry-server), not a component. */
import { createContext, useContext, useEffect, useMemo } from 'react'
import { useI18n } from '@/i18n/context'
import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { applyHead, buildHead } from './head'
import type { HeadData } from './head'
import {
  breadcrumbNode,
  faqPageEntities,
  organizationNode,
  personNode,
  webPageNode,
  webSiteNode,
} from './jsonld'
import type { BreadcrumbItem, FaqEntry, JsonLdNode, WebPageType } from './jsonld'
import { seoRoute } from './routes'
import type { SeoRouteId } from './routes'

/**
 * During prerendering (src/entry-server.tsx) the rendered page writes its
 * metadata here instead of touching a DOM; the prerender script serializes
 * it into the static <head>. In the browser there is no provider, and the
 * component applies metadata to `document.head` in an effect.
 */
export interface HeadSink {
  head: HeadData | null
}

export const HeadSinkContext = createContext<HeadSink | null>(null)

interface SeoOverride {
  title: Bi
  description: Bi
  path: Record<Lang, string>
  indexable: boolean
}

interface SeoProps {
  /** Static registry page (src/seo/routes.ts). */
  readonly route?: SeoRouteId
  /** Dynamic pages (policy documents, 404) supply their own page data. */
  readonly page?: SeoOverride
  /** schema.org page type; defaults to WebPage. */
  readonly pageType?: WebPageType
  /** Real content dates (ISO 8601) — never the build date. */
  readonly datePublished?: string
  readonly dateModified?: string
  /** Visible breadcrumb trail (rendered by the page) to mirror as JSON-LD. */
  readonly breadcrumb?: BreadcrumbItem[]
  /** Visible Q&A pairs; switches the page node to FAQPage with mainEntity. */
  readonly faq?: FaqEntry[]
  /** Additional page-specific graph nodes (e.g. WebApplication offers). */
  readonly extraNodes?: JsonLdNode[]
}

/**
 * Declares a page's metadata: title, description, robots, canonical,
 * hreflang alternates, Open Graph / social cards, and JSON-LD. Render
 * exactly one per page, as high in the page component as possible.
 */
export function Seo(props: SeoProps) {
  const { lang } = useI18n()
  const sink = useContext(HeadSinkContext)

  const source: SeoOverride = props.page ?? seoRoute(routeIdOf(props))
  const title = pick(source.title, lang)
  const description = pick(source.description, lang)
  const { path, indexable } = source
  const routeUpdated = props.route ? seoRoute(props.route).updated : undefined
  const datePublished = props.datePublished ?? routeUpdated
  const dateModified = props.dateModified ?? routeUpdated
  const { pageType, breadcrumb, faq, extraNodes } = props

  const head = useMemo(() => {
    let jsonLd: JsonLdNode[] | undefined
    if (indexable) {
      const pageNode = webPageNode({
        lang,
        path: path[lang],
        title,
        description,
        type: faq ? 'FAQPage' : pageType,
        datePublished,
        dateModified,
        hasBreadcrumb: !!breadcrumb,
      })
      if (faq) pageNode.mainEntity = faqPageEntities(faq)
      jsonLd = [organizationNode(lang), personNode(lang), webSiteNode(lang), pageNode]
      if (breadcrumb) jsonLd.push(breadcrumbNode(path[lang], breadcrumb))
      if (extraNodes) jsonLd.push(...extraNodes)
    }
    return buildHead({ lang, title, description, path, indexable, jsonLd })
  }, [
    lang,
    title,
    description,
    path,
    indexable,
    pageType,
    datePublished,
    dateModified,
    breadcrumb,
    faq,
    extraNodes,
  ])

  if (sink) sink.head = head

  useEffect(() => {
    applyHead(head)
  }, [head])

  return null
}

function routeIdOf(props: SeoProps): SeoRouteId {
  if (!props.route) throw new Error('<Seo> requires either `route` or `page`.')
  return props.route
}
