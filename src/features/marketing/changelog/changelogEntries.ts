import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'

/**
 * Public product changelog — dated release notes with founder byline on the
 * page. Not editorial articles: no statutory figures, no legal advice framing.
 *
 * Add entries here when something ships; bump dates only for new posts.
 * `date` feeds visible labels and sitemap `lastmod` for `/changelog`.
 */
export interface ChangelogEntry {
  /** ISO date (YYYY-MM-DD), newest first in {@link CHANGELOG_ENTRIES}. */
  date: string
  title: Bi
  body: Bi
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    date: '2026-08-25',
    title: bi(
      'Competitor comparison pages and SEO polish',
      'Pages de comparaison concurrentielle et améliorations SEO',
    ),
    body: bi(
      'New /vs/hrdownloads and /vs/sixfifty pages compare Dutiva with Citation Canada and SixFifty on pricing transparency, AI risk flagging, bilingual support, and statute-level specificity — with competitor pricing sourced from their live pages.',
      'Nouvelles pages /vs/hrdownloads et /vs/sixfifty comparant Dutiva à Citation Canada et SixFifty sur la transparence tarifaire, le signalement des risques par l’IA, le bilinguisme et la précision au niveau de la loi — avec tarifs concurrents tirés de leurs pages en ligne.',
    ),
  },
  {
    date: '2026-08-25',
    title: bi(
      'Leaf-on-white app icon and improved search snippets',
      'Icône feuille sur fond blanc et extraits de recherche améliorés',
    ),
    body: bi(
      'The browser favicon now matches the header leaf tile. Meta descriptions across pricing, templates, guides, and other key pages were tuned for search-result display length.',
      'Le favicon du navigateur correspond maintenant à la tuile feuille de l’en-tête. Les méta-descriptions des pages clés (tarifs, modèles, guides, etc.) ont été ajustées pour l’affichage dans les résultats de recherche.',
    ),
  },
  {
    date: '2026-08-25',
    title: bi(
      'Founder identity on the homepage and About page',
      'Identité du fondateur sur l’accueil et la page À propos',
    ),
    body: bi(
      'Visitors can now see who built Dutiva — name, photo, and a LinkedIn link — on the homepage and About page, without turning either page into a biography.',
      'Les visiteurs peuvent maintenant voir qui a conçu Dutiva — nom, photo et lien LinkedIn — sur l’accueil et la page À propos, sans transformer ces pages en biographie.',
    ),
  },
  {
    date: '2026-08-01',
    title: bi(
      'Beta program opened — 15 spots to start',
      'Ouverture du programme bêta — 15 places pour commencer',
    ),
    body: bi(
      'The beta accepts 15 individuals and organizations to begin. Signup stays open as a waiting list once those spots are taken.',
      'La bêta accepte 15 personnes et organisations pour commencer. Les inscriptions restent ouvertes en liste d’attente une fois ces places prises.',
    ),
  },
]

/** Latest entry date — drives sitemap lastmod for the changelog route. */
export function latestChangelogDate(): string | undefined {
  return CHANGELOG_ENTRIES[0]?.date
}
