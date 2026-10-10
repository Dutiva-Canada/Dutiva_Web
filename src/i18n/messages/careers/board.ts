import { defineMessages } from '../../core'

/**
 * Careers — public surfaces: the job board, its filters and
 * detail pages, and the employer-side door (/employer).
 * [FR self-authored] throughout — no design handoff.
 */
export const careersBoard = defineMessages({
  /* ── Public job board ─────────────────────────────────────────────────── */
  careers_board_title: { en: 'Find your next role', fr: 'Trouvez votre prochain poste' },
  careers_board_subtitle: {
    en: 'Browse open positions from Canadian employers hiring through Dutiva.',
    fr: 'Parcourez les postes ouverts offerts par les employeurs canadiens via Dutiva.',
  },
  careers_board_search_placeholder: {
    en: 'Search by title, department, or location…',
    fr: 'Rechercher par titre, département ou lieu…',
  },
  careers_board_empty: {
    en: 'No open positions right now.',
    fr: 'Aucun poste ouvert pour le moment.',
  },
  careers_board_empty_body: {
    en: 'New roles are posted regularly — create a free candidate profile and you can apply the moment one opens.',
    fr: "De nouveaux postes sont publiés régulièrement — créez un profil candidat gratuit et vous pourrez postuler dès qu’un poste est publié.",
  },
  careers_board_empty_cta: {
    en: 'Create a free profile',
    fr: 'Créer un profil gratuit',
  },
  careers_board_no_results: {
    en: 'No open positions match your search.',
    fr: 'Aucun poste ouvert ne correspond à votre recherche.',
  },
  careers_board_clear_search: {
    en: 'Clear search',
    fr: 'Effacer la recherche',
  },
  careers_board_no_results_body: {
    en: 'Try different keywords or check back soon — new roles are posted regularly.',
    fr: "Essayez d’autres mots-clés ou revenez bientôt — de nouveaux postes sont publiés régulièrement.",
  },
  careers_board_apply: { en: 'Apply now', fr: 'Postuler maintenant' },
  careers_board_view_detail: { en: 'View details', fr: 'Voir les détails' },
  careers_board_posted: { en: 'Posted', fr: 'Publié' },
  careers_board_closing: { en: 'Closes', fr: 'Clôture' },
  careers_board_loading: { en: 'Loading job openings…', fr: 'Chargement des postes ouverts…' },
  careers_board_load_error: {
    en: 'Could not load job openings. Please try again.',
    fr: 'Impossible de charger les postes ouverts. Veuillez réessayer.',
  },
  careers_board_retry: { en: 'Try again', fr: 'Réessayer' },
  careers_board_how_title: {
    en: 'How it works',
    fr: 'Comment ça fonctionne',
  },
  careers_board_how_lead: {
    en: 'Dutiva Careers is the public job board for employers hiring through Dutiva — candidates see the same active postings the hiring team publishes.',
    fr: "Dutiva Carrières est le tableau public d’offres d’emploi des employeurs qui recrutent via Dutiva — les candidats y voient les mêmes postes actifs que publie l’équipe de recrutement.",
  },
  careers_board_how_1: {
    en: 'Browse every open role from employers hiring through Dutiva — no account needed to look.',
    fr: "Parcourez tous les postes ouverts d’employeurs qui recrutent via Dutiva — aucun compte requis.",
  },
  careers_board_how_2: {
    en: 'Create a free candidate profile once; reuse it for every application.',
    fr: 'Créez un profil candidat gratuit une fois ; réutilisez-le pour chaque candidature.',
  },
  careers_board_how_3: {
    en: 'Optional AI tools can tailor your resume, draft a cover letter, and help you prep for interviews.',
    fr: 'Des outils IA optionnels peuvent adapter votre CV, rédiger une lettre de motivation et vous préparer aux entretiens.',
  },

  /* ── Board filters / sort / pagination ───────────────────────────────── */
  careers_board_employer_cta: {
    en: 'Hiring? Post a role',
    fr: 'Vous embauchez ? Publiez une offre',
  },
  careers_board_filters_label: {
    en: 'Filter open roles',
    fr: 'Filtrer les postes ouverts',
  },
  careers_board_filter_location: { en: 'Location', fr: 'Lieu' },
  careers_board_filter_location_all: { en: 'All locations', fr: 'Tous les lieux' },
  careers_board_filter_workplace: { en: 'Work arrangement', fr: 'Mode de travail' },
  careers_board_filter_workplace_all: { en: 'All arrangements', fr: 'Tous les modes' },
  careers_board_filter_employer: { en: 'Employer', fr: 'Employeur' },
  careers_board_filter_employer_all: { en: 'All employers', fr: 'Tous les employeurs' },
  careers_board_filter_department: { en: 'Department', fr: 'Département' },
  careers_board_filter_department_all: {
    en: 'All departments',
    fr: 'Tous les départements',
  },
  careers_board_filter_salary: { en: 'Minimum salary', fr: 'Salaire minimum' },
  careers_board_filter_salary_all: { en: 'Any salary', fr: 'Tous les salaires' },
  careers_board_workplace_remote: { en: 'Remote', fr: 'À distance' },
  careers_board_workplace_hybrid: { en: 'Hybrid', fr: 'Hybride' },
  careers_board_workplace_onsite: { en: 'On-site', fr: 'Sur place' },
  careers_board_sort_label: { en: 'Sort by', fr: 'Trier par' },
  careers_board_sort_newest: { en: 'Newest first', fr: "Plus récents d’abord" },
  careers_board_sort_relevance: { en: 'Best match', fr: 'Pertinence' },
  careers_board_chip_remove: {
    en: 'Remove filter: {label}',
    fr: 'Retirer le filtre : {label}',
  },
  careers_board_clear_all: { en: 'Clear all filters', fr: 'Effacer tous les filtres' },
  careers_board_results_announce_none: {
    en: 'No roles found',
    fr: 'Aucun poste trouvé',
  },
  careers_board_results_announce_one: {
    en: '{count} role found',
    fr: '{count} poste trouvé',
  },
  careers_board_results_announce_many: {
    en: '{count} roles found',
    fr: '{count} postes trouvés',
  },
  careers_board_showing: {
    en: 'Showing {shown} of {total}',
    fr: '{shown} sur {total}',
  },
  careers_board_load_more: { en: 'Load more roles', fr: 'Afficher plus de postes' },

  /* ── Job detail page ──────────────────────────────────────────────────── */
  careers_detail_back: { en: 'All jobs', fr: 'Tous les emplois' },
  careers_detail_not_found: {
    en: 'This position is no longer available.',
    fr: "Ce poste n’est plus disponible.",
  },
  careers_detail_not_found_body: {
    en: 'It may have been closed or filled. Browse other open roles.',
    fr: 'Il a peut-être été fermé ou pourvu. Parcourez les autres postes ouverts.',
  },
  careers_detail_requirements: { en: 'Requirements', fr: 'Exigences' },
  careers_detail_responsibilities: { en: 'Responsibilities', fr: 'Responsabilités' },
  careers_detail_benefits: { en: 'Benefits', fr: 'Avantages' },
  careers_detail_about_employer: { en: 'About {employer}', fr: 'À propos de {employer}' },
  careers_detail_salary: { en: 'Salary', fr: 'Salaire' },
  careers_detail_department: { en: 'Department', fr: 'Département' },
  careers_detail_location: { en: 'Location', fr: 'Lieu' },
  careers_detail_type: { en: 'Employment type', fr: "Type d’emploi" },
  careers_detail_description: { en: 'About the role', fr: 'À propos du poste' },
  careers_detail_apply_cta: { en: 'Apply to this role', fr: 'Postuler à ce poste' },
  careers_detail_sign_in_to_apply: {
    en: 'Sign in to apply',
    fr: 'Connectez-vous pour postuler',
  },
  careers_detail_sign_in_to_apply_body: {
    en: 'Create a free candidate account or sign in to submit your application.',
    fr: 'Créez un compte candidat gratuit ou connectez-vous pour soumettre votre candidature.',
  },

  /* ── Employer door (/employer) ───────────────────────────────────────── */
  careers_employer_tag: { en: 'Employers', fr: 'Employeurs' },
  careers_employer_title: { en: 'Dutiva for employers', fr: 'Dutiva pour les employeurs' },
  careers_employer_lead: {
    en: 'Your organization’s workspace — postings, applicants and HR compliance tools in one place.',
    fr: 'L’espace de travail de votre organisation — offres, candidatures et outils de conformité RH au même endroit.', // [FR self-authored]
  },
  careers_employer_member_body: {
    en: 'You’re signed in — open your organization’s workspace to manage postings and applicants.',
    fr: 'Vous êtes connecté — ouvrez l’espace de travail de votre organisation pour gérer les offres et les candidatures.', // [FR self-authored]
  },
  careers_employer_open_workspace: {
    en: 'Open your workspace',
    fr: 'Ouvrir votre espace de travail',
  },
  careers_employer_create_title: {
    en: 'Create your organization',
    fr: 'Créez votre organisation',
  },
  careers_employer_create_body: {
    en: 'Name your organization to set up its workspace. You can invite teammates after.',
    fr: 'Nommez votre organisation pour créer son espace de travail. Vous pourrez inviter des collègues ensuite.', // [FR self-authored]
  },
  careers_employer_org_name: { en: 'Organization name', fr: 'Nom de l’organisation' },
  careers_employer_org_name_placeholder: {
    en: 'e.g., Northgate Logistics Inc.',
    fr: 'p. ex., Logistique Northgate inc.',
  },
  careers_employer_create_cta: {
    en: 'Create workspace',
    fr: 'Créer l’espace de travail',
  },
  careers_employer_creating: { en: 'Creating…', fr: 'Création…' },
  careers_employer_created: {
    en: 'Workspace created.',
    fr: 'Espace de travail créé.',
  },
  careers_employer_create_error: {
    en: 'Couldn’t create the workspace. Try again.',
    fr: 'Impossible de créer l’espace de travail. Réessayez.',
  },
  careers_employer_create_capacity: {
    en: 'We’re at capacity right now — your request has been noted. Try again soon.',
    fr: 'Nous sommes à pleine capacité pour l’instant — votre demande a été notée. Réessayez bientôt.', // [FR self-authored]
  },
  careers_employer_create_waitlist: {
    en: 'You’ve been added to the waitlist — we’ll email you when a spot opens.',
    fr: 'Vous êtes sur la liste d’attente — nous vous écrirons quand une place se libérera.', // [FR self-authored]
  },
  careers_employer_load_error: {
    en: 'Couldn’t check your workspace. Try again.',
    fr: 'Impossible de vérifier votre espace de travail. Réessayez.', // [FR self-authored]
  },
  careers_employer_load_retry: { en: 'Try again', fr: 'Réessayer' }, // [FR self-authored]
})
