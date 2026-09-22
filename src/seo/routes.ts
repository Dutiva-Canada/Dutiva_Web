/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { LEGAL_HUB_GROUPS } from '@/features/marketing/legal/legalHubData'
import type { LegalHubRow } from '@/features/marketing/legal/legalHubData'
import { HELP_ARTICLES } from '@/features/support/help/helpCenterData'
import type { HelpArticle } from '@/features/support/help/helpCenterData'
import { ALL_ARTICLES, articlePath } from '@/features/marketing/articles'
import type { Article } from '@/features/marketing/articles'
import { seoMetaMessages } from '@/i18n/messages/seoMeta'
import { formatMetaDescription } from './metaDescription'

/**
 * The typed SEO route registry — the single source of truth for every public
 * URL: pathnames per locale, titles, descriptions, indexability, and page
 * type. The router (src/app/routes.tsx), the <Seo> tags, the sitemap,
 * robots.txt, and llms.txt are all derived from this table so they cannot
 * drift apart.
 *
 * URL model (see docs/SEO_GEO_IMPLEMENTATION.md):
 *   - English pages keep the site's original unprefixed URLs (`/about`).
 *   - French pages live under `/fr` with localized slugs (`/fr/a-propos`).
 *   - Each page is self-canonical; EN/FR pairs cross-reference through
 *     hreflang (en-CA / fr-CA, x-default → the English page).
 *
 * Adding a public page = adding one entry here + a route element in
 * src/app/routes.tsx + a <Seo route="…"> in the page component. The registry
 * tests (seo.test.ts) enforce uniqueness and EN/FR parity.
 */

export type SeoRouteId =
  | 'home'
  | 'about'
  | 'faq'
  | 'blog'
  | 'pricing'
  | 'templates'
  | 'guides'
  | 'templateUsage'
  | 'knownLimitations'
  | 'legal'
  | 'help'
  | 'contact'
  | 'status'
  | 'changelog'
  | 'vsHrdownloads'
  | 'vsSixfifty'
  | 'jurisdictionTool'
  | 'demoWorkspace'
  | 'careers'

export interface SeoRoute {
  id: SeoRouteId
  /** Canonical pathname per locale (no trailing slash except `/`). */
  path: Record<Lang, string>
  title: Bi
  description: Bi
  /** `false` → noindex + excluded from sitemap/llms.txt. */
  indexable: boolean
  /**
   * ISO date (YYYY-MM-DD) the page copy last changed. Feeds sitemap `lastmod`
   * and WebPage `dateModified`. Omit when lastmod is derived from child
   * records (home, guides, blog, legal, help, changelog) — see `lastmod.ts`.
   * Bump only when the substance changes, never to today's build date.
   */
  updated?: string
}

/** Bilingual page copy reused from the message catalogue, keeping metadata
    aligned with the visible H1/intro copy it summarizes. Scoped to the tiny
    `seoMeta` module — this file sits in the eager entry chunk, so importing
    the full marketing aggregate here would defeat the per-page LangScope
    split. */
const t = (key: keyof typeof seoMetaMessages): Bi => seoMetaMessages[key]

export const SEO_ROUTES: readonly SeoRoute[] = [
  {
    id: 'home',
    path: { en: '/', fr: '/fr' },
    title: {
      en: 'Dutiva — Canadian HR compliance, and the operations around it',
      fr: 'Dutiva — Conformité RH canadienne, et les opérations qui l’entourent',
    },
    description: {
      en: 'Dutiva helps Canadian employers manage HR compliance — and the documents, hiring, and operations around it. For ON, QC, and federal workplaces.',
      fr: 'Dutiva aide les employeurs canadiens avec la conformité RH — et les documents, l’embauche et les opérations connexes. Pour l’ON, le QC et le fédéral.',
    },
    indexable: true,
  },
  {
    id: 'about',
    path: { en: '/about', fr: '/fr/a-propos' },
    title: {
      en: 'About Dutiva — HR compliance software, built in Canada',
      fr: 'À propos de Dutiva — Logiciel de conformité RH conçu au Canada',
    },
    description: {
      en: 'Dutiva Canada Inc. builds HR compliance software for Canadian employers — AI-assisted, bilingual, and built in Canada. Meet the founder.',
      fr: 'Dutiva Canada Inc. conçoit un logiciel de conformité RH pour les employeurs canadiens — IA, bilingue, conçu au Canada. Rencontrez le fondateur.',
    },
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'faq',
    path: { en: '/faq', fr: '/fr/faq' },
    title: {
      en: 'Frequently asked questions | Dutiva',
      fr: 'Foire aux questions | Dutiva',
    },
    description: t('faq_intro'),
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'blog',
    path: { en: '/blog', fr: '/fr/blogue' },
    title: {
      en: 'Blog — HR compliance in practice | Dutiva',
      fr: 'Blogue — La conformité RH en pratique | Dutiva',
    },
    description: t('blog_meta_description'),
    indexable: true,
  },
  {
    id: 'pricing',
    path: { en: '/pricing', fr: '/fr/tarifs' },
    title: {
      en: 'Pricing — plans for Canadian employers | Dutiva',
      fr: 'Tarifs — forfaits pour les employeurs canadiens | Dutiva',
    },
    description: t('pricing_meta_description'),
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'templates',
    path: { en: '/templates', fr: '/fr/modeles' },
    title: {
      en: 'HR document templates for Canadian employers | Dutiva',
      fr: 'Modèles de documents RH pour employeurs canadiens | Dutiva',
    },
    description: t('tplPreview_meta_description'),
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'guides',
    path: { en: '/guides', fr: '/fr/guides' },
    title: {
      en: 'Guides — practical HR guidance for Canadian employers | Dutiva',
      fr: 'Guides — conseils RH pratiques pour les employeurs canadiens | Dutiva',
    },
    description: t('guidesIdx_meta_description'),
    indexable: true,
  },
  {
    id: 'templateUsage',
    path: { en: '/guides/template-usage', fr: '/fr/guides/utilisation-des-modeles' },
    title: {
      en: 'How to use Dutiva templates.',
      fr: 'Comment utiliser les modèles Dutiva.',
    },
    description: t('tmplGuide_meta_description'),
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'knownLimitations',
    path: { en: '/known-limitations', fr: '/fr/limites-connues' },
    title: {
      en: 'Known limitations of Dutiva',
      fr: 'Limites connues de Dutiva',
    },
    description: t('limits_meta_description'),
    indexable: true,
    updated: '2026-08-05',
  },
  {
    id: 'legal',
    path: { en: '/legal', fr: '/fr/juridique' },
    title: {
      en: 'Legal & compliance documentation | Dutiva',
      fr: 'Documents juridiques et de conformité | Dutiva',
    },
    description: {
      en: 'Privacy, terms, PIPEDA, Quebec Law 25, CASL, AI governance, data handling, and security — the official policy documents governing your use of Dutiva.',
      fr: 'Confidentialité, conditions, LPRPDE, Loi 25, LCAP, IA, données et sécurité — documents officiels régissant votre utilisation de Dutiva.',
    },
    indexable: true,
  },
  {
    id: 'help',
    path: { en: '/help', fr: '/fr/aide' },
    title: {
      en: 'Help Centre — guides & support for Dutiva',
      fr: 'Centre d’aide — guides et soutien pour Dutiva',
    },
    description: {
      en: 'Self-service Help Centre for Dutiva — sign-in, HR documents, AI Advisor, billing, privacy, security, and how digital-first support works. Bilingual EN/FR.',
      fr: 'Centre d’aide Dutiva — connexion, documents RH, Conseiller IA, facturation, confidentialité, sécurité et soutien numérique. Bilingue FR/EN.',
    },
    indexable: true,
  },
  {
    id: 'contact',
    path: { en: '/contact', fr: '/fr/contact' },
    title: {
      en: 'Contact Dutiva support',
      fr: 'Contacter le soutien Dutiva',
    },
    description: {
      en: 'Send Dutiva a support request without an account — product questions, privacy requests, security reports, and accessibility feedback. We reply in writing.',
      fr: 'Envoyez une demande de soutien à Dutiva sans compte — questions produit, confidentialité, sécurité et accessibilité. Nous répondons par écrit.',
    },
    indexable: true,
    updated: '2026-07-16',
  },
  {
    id: 'status',
    path: { en: '/status', fr: '/fr/etat' },
    title: {
      en: 'Service status | Dutiva',
      fr: 'État des services | Dutiva',
    },
    description: {
      en: 'The current status of Dutiva’s services — platform, AI Advisor, HR documents, and support. Self-reported by the Dutiva team. Bilingual EN/FR.',
      fr: 'L’état actuel des services de Dutiva — plateforme, Conseiller IA, documents RH et soutien. Signalé par l’équipe de Dutiva. Bilingue FR/EN.',
    },
    indexable: true,
    /* Page chrome, not live incident timestamps — those are empty at prerender. */
    updated: '2026-07-16',
  },
  {
    id: 'changelog',
    path: { en: '/changelog', fr: '/fr/journal-des-modifications' },
    title: {
      en: 'Changelog — product updates | Dutiva',
      fr: 'Journal des modifications — mises à jour | Dutiva',
    },
    description: t('changelog_meta_description'),
    indexable: true,
  },
  {
    id: 'vsHrdownloads',
    path: { en: '/vs/hrdownloads', fr: '/fr/vs/hrdownloads' },
    title: {
      en: 'Dutiva vs HRdownloads: Canadian HR compliance comparison',
      fr: 'Dutiva vs HRdownloads : comparaison de conformité RH au Canada',
    },
    description: {
      en: 'Compare Dutiva and Citation Canada (HRdownloads) on pricing transparency, AI risk flags, bilingual EN/FR, statute specificity, and self-serve access.',
      fr: 'Comparez Dutiva et Citation Canada (HRdownloads) sur tarifs, signalement des risques IA, bilinguisme EN/FR, précision au niveau de la loi et libre-service.',
    },
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'vsSixfifty',
    path: { en: '/vs/sixfifty', fr: '/fr/vs/sixfifty' },
    title: {
      en: 'Dutiva vs SixFifty: employment law document platform comparison',
      fr: 'Dutiva vs SixFifty : comparaison de plateformes de documents en droit du travail',
    },
    description: {
      en: 'Compare Dutiva and SixFifty for Canadian employers — US-only scope vs Canadian statute guidance, pricing transparency, and self-serve access.',
      fr: 'Comparez Dutiva et SixFifty pour employeurs canadiens — portée américaine vs conseils canadiens au niveau de la loi, tarifs et libre-service.',
    },
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'jurisdictionTool',
    path: { en: '/tools/jurisdiction-check', fr: '/fr/outils/verification-juridiction' },
    title: {
      en: 'Which employment standards jurisdiction applies? — Free tool | Dutiva',
      fr: 'Quelle juridiction en matière de normes d’emploi s’applique ? — Outil gratuit | Dutiva',
    },
    description: t('jur_tool_meta_description'),
    indexable: true,
    updated: '2026-08-26',
  },
  {
    id: 'demoWorkspace',
    path: { en: '/demo', fr: '/fr/demo' },
    title: t('landing_demo_seo_title'),
    description: t('landing_demo_seo_description'),
    indexable: true,
    updated: '2026-08-27',
  },
  {
    id: 'careers',
    path: { en: '/careers', fr: '/fr/carrieres' },
    title: {
      en: 'Careers — browse open roles from Canadian employers | Dutiva',
      fr: 'Carrières — parcourez les postes ouverts d\u2019employeurs canadiens | Dutiva',
    },
    description: {
      en: 'Browse open roles from Canadian employers hiring through Dutiva. Create a candidate profile and apply with optional AI-assisted resume and interview tools.',
      fr: 'Parcourez les postes ouverts d\u2019employeurs canadiens via Dutiva. Cr\u00e9ez un profil et postulez avec des outils IA optionnels pour le CV et l\u2019entretien.',
    },
    indexable: true,
    updated: '2026-09-08',
  },
] as const

export function seoRoute(id: SeoRouteId): SeoRoute {
  const route = SEO_ROUTES.find((r) => r.id === id)
  if (!route) throw new Error(`Unknown SEO route id: ${id}`)
  return route
}

/* ------------------------------------------------------------------ */
/* Legal policy documents (dynamic /legal/:slug pages)                 */
/* ------------------------------------------------------------------ */

/** Flat list of the 26 policy rows (slug, frSlug, title/desc message keys). */
export const LEGAL_ROWS: readonly LegalHubRow[] = LEGAL_HUB_GROUPS.flatMap((g) => g.rows)

export function legalRowBySlug(slug: string): LegalHubRow | undefined {
  return LEGAL_ROWS.find((row) => row.slug === slug)
}

export function legalRowByFrSlug(frSlug: string): LegalHubRow | undefined {
  return LEGAL_ROWS.find((row) => row.frSlug === frSlug)
}

/** Canonical pathname of a policy document in a locale. */
export function legalDocPath(row: LegalHubRow, lang: Lang): string {
  return lang === 'fr' ? `/fr/juridique/${row.frSlug}` : `/legal/${row.slug}`
}

/* ------------------------------------------------------------------ */
/* Help Centre articles (dynamic /help/:slug pages)                    */
/* ------------------------------------------------------------------ */

export function helpArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}

export function helpArticleByFrSlug(frSlug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.frSlug === frSlug)
}

/** Canonical pathname of a help article in a locale. */
export function helpDocPath(article: HelpArticle, lang: Lang): string {
  return lang === 'fr' ? `/fr/aide/${article.frSlug}` : `/help/${article.slug}`
}

export function helpDocTitle(article: HelpArticle, lang: Lang): string {
  return pick(article.title, lang)
}

export function helpDocDescription(article: HelpArticle, lang: Lang): string {
  return formatMetaDescription(pick(article.summary, lang), lang)
}

/* ------------------------------------------------------------------ */
/* Editorial articles (/guides/:slug and /blog/:slug)                  */
/* ------------------------------------------------------------------ */

export function articleTitle(article: Article, lang: Lang): string {
  return pick(article.title, lang)
}

export function articleDescription(article: Article, lang: Lang): string {
  return formatMetaDescription(pick(article.summary, lang), lang)
}

/* ------------------------------------------------------------------ */
/* Locale path mapping (language toggle + hreflang)                    */
/* ------------------------------------------------------------------ */

/* Every public pathname pair, without titles/descriptions — resolving those
   needs the legalHub message module, which lives in the lazy page chunks.
   `allPublicPages()` in ./publicPages.ts builds the titled version for SSR
   and the sitemap; this list exists so `alternatePathFor` (called eagerly by
   ForcedLangProvider on every marketing render) never pulls a message module
   into the entry chunk. */
const ALL_PUBLIC_PATHS: readonly Record<Lang, string>[] = [
  /* The employer sign-in door is locale-paired for the language toggle but
     deliberately absent from SEO_ROUTES — an auth page is not indexable. */
  { en: '/employer', fr: '/fr/employeur' },
  ...SEO_ROUTES.map((r) => r.path),
  ...LEGAL_ROWS.map((row) => ({ en: legalDocPath(row, 'en'), fr: legalDocPath(row, 'fr') })),
  ...HELP_ARTICLES.map((a) => ({ en: helpDocPath(a, 'en'), fr: helpDocPath(a, 'fr') })),
  ...ALL_ARTICLES.map((a) => ({ en: articlePath(a, 'en'), fr: articlePath(a, 'fr') })),
]

/**
 * The same page's pathname in the other locale, for the language toggle and
 * for reciprocal hreflang links. Returns undefined off the public surface
 * (e.g. /app), where language is a client preference rather than a URL.
 */
export function alternatePathFor(pathname: string, target: Lang): string | undefined {
  const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/'
  for (const path of ALL_PUBLIC_PATHS) {
    if (path.en === normalized || path.fr === normalized) return path[target]
  }
  /* Careers job detail pages are dynamic (/careers/jobs/:postingId) and not
     in the static registry. Map the locale prefix directly so the language
     toggle on a job detail page cross-references its EN/FR counterpart. */
  const jobMatch = normalized.match(/^\/(fr\/)?careers\/jobs\/(.+)$/)
  if (jobMatch) {
    const postingId = jobMatch[2]
    return target === 'fr' ? `/fr/carrieres/jobs/${postingId}` : `/careers/jobs/${postingId}`
  }
  return undefined
}

/** Locale of a public pathname: `/fr…` → fr, everything else → en. */
export function langOfPath(pathname: string): Lang {
  return pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en'
}
