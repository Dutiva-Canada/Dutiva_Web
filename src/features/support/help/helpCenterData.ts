import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/**
 * Help Centre content — the self-service layer of Dutiva's digital-first
 * support model (see src/config/support.ts and the public support policy).
 * Articles are short, product-accurate, and bilingual; they never give legal
 * advice and defer compliance specifics to the legal documents.
 *
 * This module is pure data (no React), so search and the SEO registry can
 * consume it directly. Categories and articles are `Bi` pairs rendered with
 * `x()`; article bodies use a small block model grouped into semantic lists by
 * `groupHelpBlocks`. Slugs are stable — they are public URLs
 * (`/help/<slug>`, `/fr/aide/<frSlug>`) and must not collide across locales.
 */

export type HelpCategoryId =
  | 'getting_started'
  | 'documents'
  | 'advisor'
  | 'account_billing'
  | 'privacy_security'
  | 'support_contact'

/** Lucide icon name; mapped to a component in the page (keeps this module pure). */
export type HelpIcon =
  'rocket' | 'file-text' | 'sparkles' | 'credit-card' | 'shield-check' | 'life-buoy'

export interface HelpCategory {
  id: HelpCategoryId
  icon: HelpIcon
  title: Bi
  description: Bi
}

export const HELP_CATEGORIES: readonly HelpCategory[] = [
  {
    id: 'getting_started',
    icon: 'rocket',
    title: bi('Getting started', 'Prise en main'),
    description: bi(
      'Signing in, finding your way around, and setting your language.',
      'Se connecter, s’orienter et choisir sa langue.',
    ),
  },
  {
    id: 'documents',
    icon: 'file-text',
    title: bi('HR documents & templates', 'Documents et modèles RH'),
    description: bi(
      'Generating documents from templates and understanding how they work.',
      'Générer des documents à partir de modèles et comprendre leur fonctionnement.',
    ),
  },
  {
    id: 'advisor',
    icon: 'sparkles',
    title: bi('AI Advisor', 'Conseiller IA'),
    description: bi(
      'Getting useful, grounded answers — and knowing the Advisor’s limits.',
      'Obtenir des réponses utiles et fondées — et connaître les limites du Conseiller.',
    ),
  },
  {
    id: 'account_billing',
    icon: 'credit-card',
    title: bi('Account & billing', 'Compte et facturation'),
    description: bi(
      'Plans, invoices, and recovering access to your account.',
      'Forfaits, factures et récupération de l’accès à votre compte.',
    ),
  },
  {
    id: 'privacy_security',
    icon: 'shield-check',
    title: bi('Privacy & security', 'Confidentialité et sécurité'),
    description: bi(
      'How your data is protected and how to make a privacy request.',
      'Comment vos données sont protégées et comment faire une demande de confidentialité.',
    ),
  },
  {
    id: 'support_contact',
    icon: 'life-buoy',
    title: bi('Support & contact', 'Soutien et contact'),
    description: bi(
      'How Dutiva support works and how to write an effective request.',
      'Le fonctionnement du soutien Dutiva et comment rédiger une demande efficace.',
    ),
  },
] as const

export function helpCategory(id: HelpCategoryId): HelpCategory {
  const category = HELP_CATEGORIES.find((c) => c.id === id)
  if (!category) throw new Error(`Unknown help category: ${id}`)
  return category
}

// ── Article content model ──────────────────────────────────────────────────

export type HelpBlock = { type: 'p'; text: Bi } | { type: 'li'; text: Bi }

export interface HelpSection {
  /** Optional H2 within the article. */
  heading?: Bi
  blocks: HelpBlock[]
}

export interface HelpArticle {
  /** `/help/<slug>` — English slug (also the article's stable id). */
  slug: string
  /** `/fr/aide/<frSlug>` — localized French slug; unique across both spaces. */
  frSlug: string
  category: HelpCategoryId
  /**
   * ISO date (YYYY-MM-DD) the article's substance last changed. Feeds
   * sitemap `lastmod`. Bump only on material edits — same rule as editorial
   * articles.
   */
  updated: string
  title: Bi
  /** One-line blurb shown on cards and used in search + the SEO description. */
  summary: Bi
  /** Extra search terms (space-separated), never rendered. */
  keywords?: Bi
}

export const HELP_ARTICLES: readonly HelpArticle[] = [
  // ── Getting started ───────────────────────────────────────────────────────
  {
    slug: 'signing-in',
    frSlug: 'se-connecter',
    category: 'getting_started',
    updated: '2026-08-08',
    title: bi('Signing in with a magic link', 'Se connecter avec un lien magique'),
    summary: bi(
      'Dutiva sends a one-time sign-in link to your email — no password to remember.',
      'Dutiva envoie un lien de connexion à usage unique à votre courriel — aucun mot de passe à retenir.',
    ),
    keywords: bi(
      'login log in email magic link password reset access invite',
      'connexion ouvrir session courriel lien magique mot de passe accès invitation',
    ),
  },
  {
    slug: 'switching-language',
    frSlug: 'changer-de-langue',
    category: 'getting_started',
    updated: '2026-07-16',
    title: bi('Switching between English and French', 'Passer de l’anglais au français'),
    summary: bi(
      'Dutiva is fully bilingual — switch the interface language at any time.',
      'Dutiva est entièrement bilingue — changez la langue de l’interface en tout temps.',
    ),
    keywords: bi(
      'language english french bilingual translate toggle EN FR locale',
      'langue anglais français bilingue traduire bascule EN FR paramètres régionaux',
    ),
  },
  // ── HR documents & templates ──────────────────────────────────────────────
  {
    slug: 'generate-a-document',
    frSlug: 'generer-un-document',
    category: 'documents',
    updated: '2026-07-16',
    title: bi('Generating a document from a template', 'Générer un document à partir d’un modèle'),
    summary: bi(
      'Start from a Canadian HR template, answer a few prompts, and generate a draft.',
      'Partez d’un modèle RH canadien, répondez à quelques questions et générez une ébauche.',
    ),
    keywords: bi(
      'template document studio generate create letter offer contract draft download',
      'modèle document studio générer créer lettre offre contrat ébauche télécharger',
    ),
  },
  {
    slug: 'how-templates-work',
    frSlug: 'fonctionnement-des-modeles',
    category: 'documents',
    updated: '2026-07-16',
    title: bi('How Dutiva’s HR templates work', 'Comment fonctionnent les modèles RH de Dutiva'),
    summary: bi(
      'Templates are practical starting points tailored to Canadian jurisdictions — not legal advice.',
      'Les modèles sont des points de départ pratiques adaptés aux régimes canadiens — pas un avis juridique.',
    ),
    keywords: bi(
      'template jurisdiction ontario quebec federal province customize legal advice',
      'modèle régime ontario québec fédéral province personnaliser avis juridique',
    ),
  },
  // ── AI Advisor ────────────────────────────────────────────────────────────
  {
    slug: 'using-the-advisor',
    frSlug: 'utiliser-le-conseiller',
    category: 'advisor',
    updated: '2026-07-16',
    title: bi(
      'Getting useful answers from the AI Advisor',
      'Obtenir des réponses utiles du Conseiller IA',
    ),
    summary: bi(
      'Ask clear questions, set your jurisdiction, and the Advisor grounds answers in HR guidance.',
      'Posez des questions claires, précisez votre régime, et le Conseiller fonde ses réponses sur des directives RH.',
    ),
    keywords: bi(
      'advisor ai chat question jurisdiction province guidance grounded citation prompt',
      'conseiller ia clavardage question régime province directives fondé citation invite',
    ),
  },
  {
    slug: 'advisor-limits-and-review',
    frSlug: 'limites-du-conseiller',
    category: 'advisor',
    updated: '2026-07-16',
    title: bi(
      'Why the Advisor asks you to get human review',
      'Pourquoi le Conseiller vous invite à obtenir une révision humaine',
    ),
    summary: bi(
      'AI can be wrong. Dutiva flags high-risk matters for qualified review and never makes decisions for you.',
      'L’IA peut se tromper. Dutiva signale les situations à risque élevé pour révision qualifiée et ne décide jamais à votre place.',
    ),
    keywords: bi(
      'ai limits accuracy human review escalation termination accommodation risk not legal advice',
      'limites ia exactitude révision humaine escalade congédiement adaptation risque pas avis juridique',
    ),
  },
  // ── Account & billing ─────────────────────────────────────────────────────
  {
    slug: 'plans-and-invoices',
    frSlug: 'forfaits-et-factures',
    category: 'account_billing',
    updated: '2026-07-16',
    title: bi('Managing your plan and invoices', 'Gérer votre forfait et vos factures'),
    summary: bi(
      'View your plan, update payment details, and find invoices from the billing portal.',
      'Consultez votre forfait, mettez à jour vos renseignements de paiement et trouvez vos factures dans le portail de facturation.',
    ),
    keywords: bi(
      'billing invoice subscription plan payment card upgrade downgrade cancel refund stripe',
      'facturation facture abonnement forfait paiement carte améliorer réduire annuler remboursement stripe',
    ),
  },
  {
    slug: 'recover-account-access',
    frSlug: 'recuperer-l-acces-au-compte',
    category: 'account_billing',
    updated: '2026-07-16',
    title: bi('Recovering access to your account', 'Récupérer l’accès à votre compte'),
    summary: bi(
      'Locked out? Request a new sign-in link, or contact support if your email has changed.',
      'Bloqué? Demandez un nouveau lien de connexion, ou communiquez avec le soutien si votre courriel a changé.',
    ),
    keywords: bi(
      'locked out account access recovery cannot sign in email changed reset support',
      'bloqué accès compte récupération impossible connexion courriel changé réinitialiser soutien',
    ),
  },
  // ── Privacy & security ────────────────────────────────────────────────────
  {
    slug: 'how-your-data-is-protected',
    frSlug: 'protection-de-vos-donnees',
    category: 'privacy_security',
    updated: '2026-07-16',
    title: bi('How your data is protected', 'Comment vos données sont protégées'),
    summary: bi(
      'Data is encrypted in transit and at rest, with database-level access controls.',
      'Les données sont chiffrées en transit et au repos, avec des contrôles d’accès au niveau de la base de données.',
    ),
    keywords: bi(
      'security encryption tls aes access control rls canada hosting data protection',
      'sécurité chiffrement tls aes contrôle accès rls canada hébergement protection données',
    ),
  },
  {
    slug: 'making-a-privacy-request',
    frSlug: 'faire-une-demande-de-confidentialite',
    category: 'privacy_security',
    updated: '2026-07-16',
    title: bi('Making a privacy request', 'Faire une demande de confidentialité'),
    summary: bi(
      'Access, correction, and deletion requests under PIPEDA and Quebec Law 25 go to privacy@dutiva.ca.',
      'Les demandes d’accès, de correction et de suppression en vertu de la LPRPDE et de la Loi 25 vont à privacy@dutiva.ca.',
    ),
    keywords: bi(
      'privacy request access correction deletion pipeda law 25 quebec personal information identity',
      'confidentialité demande accès correction suppression lprpde loi 25 québec renseignements personnels identité',
    ),
  },
  // ── Support & contact ─────────────────────────────────────────────────────
  {
    slug: 'how-support-works',
    frSlug: 'fonctionnement-du-soutien',
    category: 'support_contact',
    updated: '2026-08-26',
    title: bi('How Dutiva support works', 'Comment fonctionne le soutien Dutiva'),
    summary: bi(
      'Support is digital-first: self-service, then written requests, with calls arranged only when needed.',
      'Le soutien est d’abord numérique : libre-service, puis demandes écrites, avec des appels organisés seulement au besoin.',
    ),
    keywords: bi(
      'support model digital first email phone call response time hours help centre ticket',
      'modèle soutien numérique courriel téléphone appel délai réponse heures centre aide billet',
    ),
  },
  {
    slug: 'writing-a-good-request',
    frSlug: 'rediger-une-bonne-demande',
    category: 'support_contact',
    updated: '2026-07-16',
    title: bi('What to include in a support request', 'Quoi inclure dans une demande de soutien'),
    summary: bi(
      'A clear subject, what you expected versus what happened, and no unnecessary sensitive data.',
      'Un sujet clair, ce que vous attendiez par rapport à ce qui s’est produit, et aucune donnée sensible inutile.',
    ),
    keywords: bi(
      'support request tips subject description impact urgency sensitive information attachment diagnostics',
      'demande soutien conseils sujet description impact urgence renseignements sensibles pièce jointe diagnostics',
    ),
  },
] as const

export function helpArticlesByCategory(id: HelpCategoryId): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === id)
}

export function helpArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}

export function helpArticleByFrSlug(frSlug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.frSlug === frSlug)
}

// ── Block grouping (consecutive `li` → one semantic list) ───────────────────

export type HelpBlockGroup = { kind: 'p'; text: Bi } | { kind: 'list'; items: Bi[] }

export function groupHelpBlocks(blocks: HelpBlock[]): HelpBlockGroup[] {
  const groups: HelpBlockGroup[] = []
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
