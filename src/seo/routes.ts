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
import { marketingMessages } from '@/i18n/messages/marketing'

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
  | 'jurisdictionTool'

export interface SeoRoute {
  id: SeoRouteId
  /** Canonical pathname per locale (no trailing slash except `/`). */
  path: Record<Lang, string>
  title: Bi
  description: Bi
  /** `false` → noindex + excluded from sitemap/llms.txt. */
  indexable: boolean
}

/** Bilingual page copy reused from the message catalogue, keeping metadata
    aligned with the visible H1/intro copy it summarizes. Scoped to the
    marketing catalogue (this file is entirely public-surface) rather than
    the full merged one, so importing it does not pull workspace message
    modules into the eager marketing bundle. */
const t = (key: keyof typeof marketingMessages): Bi => marketingMessages[key]

export const SEO_ROUTES: readonly SeoRoute[] = [
  {
    id: 'home',
    path: { en: '/', fr: '/fr' },
    title: {
      en: 'Dutiva — HR compliance software for Canadian employers',
      fr: 'Dutiva — Logiciel de conformité RH pour les employeurs canadiens',
    },
    description: {
      en: 'Dutiva helps Canadian employers manage HR compliance — documents, deadlines, and workplace decisions — with practical, AI-assisted guidance for Ontario, Quebec, and federally regulated workplaces. Bilingual EN/FR.',
      fr: 'Dutiva aide les employeurs canadiens à gérer la conformité RH — documents, échéances et décisions en milieu de travail — avec un accompagnement pratique assisté par l’IA pour l’Ontario, le Québec et le régime fédéral. Bilingue FR/EN.',
    },
    indexable: true,
  },
  {
    id: 'about',
    path: { en: '/about', fr: '/fr/a-propos' },
    title: {
      en: 'About Dutiva — HR compliance infrastructure, built in Canada',
      fr: 'À propos de Dutiva — Infrastructure de conformité RH conçue au Canada',
    },
    description: {
      en: 'Dutiva Canada Inc. builds foundational HR infrastructure for Canadian employers — AI-assisted, compliance-oriented, and bilingual. Learn about the mission and the team behind Dutiva.',
      fr: 'Dutiva Canada Inc. conçoit une infrastructure RH fondamentale pour les employeurs canadiens — assistée par l’IA, axée sur la conformité et bilingue. Découvrez la mission derrière Dutiva.',
    },
    indexable: true,
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
  },
  {
    id: 'blog',
    path: { en: '/blog', fr: '/fr/blogue' },
    title: {
      en: 'Blog — HR compliance in practice | Dutiva',
      fr: 'Blogue — La conformité RH en pratique | Dutiva',
    },
    description: t('blog_intro'),
    indexable: true,
  },
  {
    id: 'pricing',
    path: { en: '/pricing', fr: '/fr/tarifs' },
    title: {
      en: 'Pricing — plans for Canadian employers | Dutiva',
      fr: 'Tarifs — forfaits pour les employeurs canadiens | Dutiva',
    },
    description: {
      en: 'Dutiva plans in Canadian dollars — Free/Beta, Starter, Growth, and Professional. Monthly or annual billing, no long-term contracts, no setup fees, and cancel anytime.',
      fr: 'Les forfaits Dutiva en dollars canadiens — Gratuit/Bêta, Starter, Growth et Professional. Facturation mensuelle ou annuelle, aucun contrat à long terme, aucuns frais d’installation, et annulation en tout temps.',
    },
    indexable: true,
  },
  {
    id: 'templates',
    path: { en: '/templates', fr: '/fr/modeles' },
    title: {
      en: 'HR document templates for Canadian employers | Dutiva',
      fr: 'Modèles de documents RH pour employeurs canadiens | Dutiva',
    },
    description: t('tplPreview_intro'),
    indexable: true,
  },
  {
    id: 'guides',
    path: { en: '/guides', fr: '/fr/guides' },
    title: {
      en: 'Guides — practical HR guidance for Canadian employers | Dutiva',
      fr: 'Guides — conseils RH pratiques pour les employeurs canadiens | Dutiva',
    },
    description: t('guidesIdx_intro'),
    indexable: true,
  },
  {
    id: 'templateUsage',
    path: { en: '/guides/template-usage', fr: '/fr/guides/utilisation-des-modeles' },
    title: {
      en: 'How to use Dutiva’s HR document templates',
      fr: 'Comment utiliser les modèles de documents RH de Dutiva',
    },
    description: t('tmplGuide_intro'),
    indexable: true,
  },
  {
    id: 'knownLimitations',
    path: { en: '/known-limitations', fr: '/fr/limites-connues' },
    title: {
      en: 'Known limitations of Dutiva',
      fr: 'Limites connues de Dutiva',
    },
    description: t('limits_intro'),
    indexable: true,
  },
  {
    id: 'legal',
    path: { en: '/legal', fr: '/fr/juridique' },
    title: {
      en: 'Legal & compliance documentation | Dutiva',
      fr: 'Documents juridiques et de conformité | Dutiva',
    },
    description: {
      en: 'Every policy governing your use of Dutiva — privacy, terms of service, Canadian compliance frameworks (PIPEDA, Quebec Law 25, CASL), AI governance, data handling, and security.',
      fr: 'Toutes les politiques régissant votre utilisation de Dutiva — confidentialité, conditions d’utilisation, cadres de conformité canadiens (LPRPDE, Loi 25 du Québec, LCAP), gouvernance de l’IA, données et sécurité.',
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
      en: 'Self-service help for Dutiva: signing in, generating HR documents, using the AI Advisor, billing, privacy and security, and how digital-first support works. Bilingual EN/FR.',
      fr: 'Aide en libre-service pour Dutiva : connexion, génération de documents RH, utilisation du Conseiller IA, facturation, confidentialité et sécurité, et fonctionnement du soutien d’abord numérique. Bilingue FR/EN.',
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
      en: 'Send Dutiva a support request without an account — product questions, privacy requests, security reports, and accessibility feedback. We reply in writing. Bilingual EN/FR.',
      fr: 'Envoyez une demande de soutien à Dutiva sans compte — questions sur le produit, demandes de confidentialité, signalements de sécurité et rétroaction sur l’accessibilité. Nous répondons par écrit. Bilingue FR/EN.',
    },
    indexable: true,
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
  },
  {
    id: 'jurisdictionTool',
    path: { en: '/tools/jurisdiction-check', fr: '/fr/outils/verification-juridiction' },
    title: {
      en: 'Which employment standards jurisdiction applies? — Free tool | Dutiva',
      fr: 'Quelle juridiction en matière de normes d’emploi s’applique ? — Outil gratuit | Dutiva',
    },
    description: {
      en: 'A free tool that helps Canadian employers determine whether Ontario (ESA), Quebec (LNT), or federal (Canada Labour Code) employment standards likely apply to an employee. Three questions, no figures, links to the official statute. Bilingual EN/FR.',
      fr: 'Un outil gratuit qui aide les employeurs canadiens à déterminer si les normes d’emploi de l’Ontario (LNE), du Québec (LNT) ou du fédéral (Code canadien du travail) s’appliquent probablement à un employé. Trois questions, aucun chiffre, liens vers la loi officielle. Bilingue FR/EN.',
    },
    indexable: true,
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

/** Localized document title / short description from the message catalogue. */
export function legalDocTitle(row: LegalHubRow, lang: Lang): string {
  return pick(marketingMessages[row.titleKey], lang)
}

export function legalDocDescription(row: LegalHubRow, lang: Lang): string {
  const desc = pick(marketingMessages[row.descKey], lang)
  return lang === 'fr'
    ? `${desc} — document officiel de Dutiva Canada Inc.`
    : `${desc} — official Dutiva Canada Inc. policy document.`
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
  return pick(article.summary, lang)
}

/* ------------------------------------------------------------------ */
/* Editorial articles (/guides/:slug and /blog/:slug)                  */
/* ------------------------------------------------------------------ */

export function articleTitle(article: Article, lang: Lang): string {
  return pick(article.title, lang)
}

export function articleDescription(article: Article, lang: Lang): string {
  return pick(article.summary, lang)
}

/* ------------------------------------------------------------------ */
/* Locale path mapping (language toggle + hreflang)                    */
/* ------------------------------------------------------------------ */

export interface PublicPage {
  /** Registry route id, or `legalDoc:<slug>` for policy documents. */
  key: string
  path: Record<Lang, string>
  title: Bi
  description: Bi
  indexable: boolean
}

/** Every public page (static routes + the 26 policy documents), one entry per
    EN/FR pair. Drives the sitemap, llms.txt, and prerender manifest. */
export function allPublicPages(): PublicPage[] {
  const staticPages: PublicPage[] = SEO_ROUTES.map((r) => ({
    key: r.id,
    path: r.path,
    title: r.title,
    description: r.description,
    indexable: r.indexable,
  }))
  const legalPages: PublicPage[] = LEGAL_ROWS.map((row) => ({
    key: `legalDoc:${row.slug}`,
    path: { en: legalDocPath(row, 'en'), fr: legalDocPath(row, 'fr') },
    title: {
      en: `${legalDocTitle(row, 'en')} | Dutiva`,
      fr: `${legalDocTitle(row, 'fr')} | Dutiva`,
    },
    description: {
      en: legalDocDescription(row, 'en'),
      fr: legalDocDescription(row, 'fr'),
    },
    indexable: true,
  }))
  const helpPages: PublicPage[] = HELP_ARTICLES.map((article) => ({
    key: `helpDoc:${article.slug}`,
    path: { en: helpDocPath(article, 'en'), fr: helpDocPath(article, 'fr') },
    title: {
      en: `${helpDocTitle(article, 'en')} | Dutiva Help`,
      fr: `${helpDocTitle(article, 'fr')} | Aide Dutiva`,
    },
    description: {
      en: helpDocDescription(article, 'en'),
      fr: helpDocDescription(article, 'fr'),
    },
    indexable: true,
  }))
  /* Editorial articles — `/guides/<slug>` and `/blog/<slug>`, keyed by
     collection so the two never collide even if a slug were ever reused. */
  const articlePages: PublicPage[] = ALL_ARTICLES.map((article) => ({
    key: `${article.collection}Doc:${article.slug}`,
    path: { en: articlePath(article, 'en'), fr: articlePath(article, 'fr') },
    title: {
      en: `${articleTitle(article, 'en')} | Dutiva`,
      fr: `${articleTitle(article, 'fr')} | Dutiva`,
    },
    description: {
      en: articleDescription(article, 'en'),
      fr: articleDescription(article, 'fr'),
    },
    indexable: true,
  }))
  return [...staticPages, ...legalPages, ...helpPages, ...articlePages]
}

/**
 * The same page's pathname in the other locale, for the language toggle and
 * for reciprocal hreflang links. Returns undefined off the public surface
 * (e.g. /app), where language is a client preference rather than a URL.
 */
export function alternatePathFor(pathname: string, target: Lang): string | undefined {
  const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/'
  for (const page of allPublicPages()) {
    if (page.path.en === normalized || page.path.fr === normalized) return page.path[target]
  }
  return undefined
}

/** Locale of a public pathname: `/fr…` → fr, everything else → en. */
export function langOfPath(pathname: string): Lang {
  return pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en'
}
