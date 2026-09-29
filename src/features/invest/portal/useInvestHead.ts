import { useEffect, useMemo } from 'react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { applyHead, buildHead } from '@/seo/head'
import { absoluteUrl, OG_IMAGE, ORG } from '@/seo/site'

/**
 * Per-route document head for the authenticated Invest surface. Call once at
 * the top of each page component — unconditionally, before any loading
 * early-return, so the tab title is right even while data loads.
 *
 * Every page is behind the sign-in wall, so robots stays `noindex, nofollow`
 * per buildHead's own policy — no canonical or hreflang indexing signals.
 * Open Graph basics still ship so a shared link (which only ever renders the
 * wall for a crawler) resolves to a sensible card with the right title.
 */
export function useInvestHead(title: Bi, description: Bi) {
  const { lang } = useI18n()

  const head = useMemo(() => {
    const desc = pick(description, lang)
    const h = buildHead({
      lang,
      title: pick(title, lang),
      description: desc,
      path: { en: '/invest', fr: '/invest' },
      indexable: false,
    })
    const image = OG_IMAGE[lang]
    h.tags.push(
      { tag: 'meta', attrs: { property: 'og:site_name', content: ORG.name } },
      { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
      { tag: 'meta', attrs: { property: 'og:title', content: h.title } },
      { tag: 'meta', attrs: { property: 'og:description', content: desc } },
      { tag: 'meta', attrs: { property: 'og:url', content: absoluteUrl('/invest') } },
      {
        tag: 'meta',
        attrs: { property: 'og:locale', content: lang === 'fr' ? 'fr_CA' : 'en_CA' },
      },
      { tag: 'meta', attrs: { property: 'og:image', content: absoluteUrl(image.path) } },
      { tag: 'meta', attrs: { property: 'og:image:alt', content: image.alt } },
    )
    return h
  }, [lang, title, description])

  useEffect(() => {
    applyHead(head)
  }, [head])
}
