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
    date: '2026-08-27',
    title: bi(
      'Public demo — explore the workspace without signing in',
      'Démo publique — explorez l’espace de travail sans connexion',
    ),
    body: bi(
      'Visit dutiva.ca/demo for a read-only preview of the Northgate Logistics sample workspace: guided tour stops, landing-page mini-simulations, and the full Advisor and Documents experience. We tightened the layout so the tour bar, thread list, and compliance panel share space more comfortably, and document labels render correctly in English and French.',
      'Visitez dutiva.ca/demo pour un aperçu lecture seule de l’espace d’exemple Northgate Logistics : arrêts de visite guidée, mini-simulations depuis l’accueil, et l’expérience complète Conseiller et Documents. Nous avons resserré la mise en page pour que la barre de visite, la liste de fils et le volet conformité partagent l’espace plus confortablement, et les libellés Documents s’affichent correctement en anglais et en français.',
    ),
  },
  {
    date: '2026-08-26',
    title: bi(
      'Optional Advisor reply packs when you pass the included monthly amount',
      'Forfaits facultatifs de réponses du Conseiller une fois le volume mensuel inclus dépassé',
    ),
    body: bi(
      'Every admitted account has the same included Advisor replies each month. If you use them, you can buy a prepaid pack. Packs are not a plan feature — paying for a plan still buys founder-led support, not extra modules. Unused pack replies are not a cash refund.',
      'Chaque compte admis a le même nombre de réponses du Conseiller incluses chaque mois. Si vous les utilisez, vous pouvez acheter un forfait prépayé. Les forfaits ne sont pas une fonction d’abonnement — payer un forfait achète encore du soutien mené par le fondateur, pas des modules supplémentaires. Les réponses de forfait inutilisées ne sont pas remboursées en argent.',
    ),
  },
  {
    date: '2026-08-26',
    title: bi(
      'Paid plans open — waitlist stays for free seats',
      'Forfaits payants ouverts — la liste d’attente reste pour les places gratuites',
    ),
    body: bi(
      'Paid plans are open. Paying skips the waitlist and includes founder-led support. A waitlist of 15 free seats remains if you’d rather not pay yet. The full product stays open for every admitted account.',
      'Les forfaits payants sont ouverts. Payer saute la liste d’attente et comprend un soutien mené par le fondateur. Une liste d’attente de 15 places gratuites reste si vous préférez ne pas payer pour l’instant. Le produit complet reste ouvert pour chaque compte admis.',
    ),
  },
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
