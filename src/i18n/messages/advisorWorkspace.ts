import { defineMessages } from '../core'

/**
 * Compliance Workspace + response-experience strings (Advisor chat handoff,
 * `Advisor Response Experience.dc.html`). EN verbatim from the prototype;
 * the prototype's EN/FR toggle is decorative, so all FR here is
 * [FR self-authored] per the handoff's "FR parity" open gate.
 */
export const advisorWorkspaceMessages = defineMessages({
  advws_title: { en: 'Compliance workspace', fr: 'Espace de conformité' },
  advws_subtitle: {
    en: 'Structured output from the advisor engine — shown only where the route gates allow.',
    fr: 'Sortie structurée du moteur du Conseiller — affichée seulement là où les portes de routage le permettent.',
  },
  advws_open_workspace: { en: 'Workspace', fr: 'Espace' },
  advws_close_workspace: { en: 'Close workspace', fr: 'Fermer l’espace' },

  /* Signed-out lock */
  advws_locked_title: { en: 'Preview mode', fr: 'Mode aperçu' },
  advws_locked_body: {
    en: 'Signed out, the Advisor shows a scripted reply only. Sign in to run the live compliance engine — jurisdiction-aware guidance, risk, citations and sources populate here.',
    fr: 'Hors session, le Conseiller n’affiche qu’une réponse scénarisée. Connectez-vous pour lancer le moteur de conformité — les conseils selon la compétence, le risque, les citations et les sources s’afficheront ici.',
  },
  advws_locked_cta: { en: 'Sign in to run the engine', fr: 'Se connecter pour lancer le moteur' },

  /* Running skeleton */
  advws_running: {
    en: 'Routing · retrieving guidance · validating…',
    fr: 'Routage · récupération des conseils · validation…',
  },

  /* Idle (no structured output yet — non-happy-path state owned by the app) */
  advws_idle_title: {
    en: 'No structured output yet',
    fr: 'Aucune sortie structurée pour l’instant',
  },
  advws_idle_body: {
    en: 'Ask the Advisor a compliance question and the engine’s structured read — jurisdiction, risk, legal basis and sources — appears here.',
    fr: 'Posez une question de conformité au Conseiller et la lecture structurée du moteur — compétence, risque, fondement juridique et sources — s’affichera ici.',
  },

  /* Section titles */
  advws_sec_mode: { en: 'Response mode', fr: 'Mode de réponse' },
  advws_sec_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  advws_sec_risk: { en: 'Risk read', fr: 'Lecture du risque' },
  advws_risk_compliance: { en: 'Compliance', fr: 'Conformité' },
  advws_risk_safety: { en: 'Personal safety', fr: 'Sécurité personnelle' },
  advws_sec_legal: { en: 'Legal basis', fr: 'Fondement juridique' },
  advws_sec_retrieval: { en: 'Retrieved guidance', fr: 'Conseils récupérés' },
  advws_sec_web: { en: 'Live web sources', fr: 'Sources Web en direct' },
  advws_sec_confidence: { en: 'Confidence', fr: 'Confiance' },
  advws_sec_warnings: { en: 'Quality warnings', fr: 'Avertissements de qualité' },
  advws_sec_gates: { en: 'Route rendering gates', fr: 'Portes d’affichage du routage' },

  /* Response modes (mode chip + surface note) */
  advws_mode_hr: { en: 'HR compliance advisor', fr: 'Conseiller en conformité RH' },
  advws_mode_escalation: { en: 'High-risk escalation', fr: 'Escalade à risque élevé' },
  advws_mode_supportive: { en: 'Supportive triage', fr: 'Triage de soutien' },
  advws_surface_hybrid: { en: 'Hybrid · chat + workspace', fr: 'Hybride · clavardage + espace' },
  advws_surface_chat_only: { en: 'Advisor chat only', fr: 'Clavardage du Conseiller seulement' },

  /* Jurisdiction status badges */
  advws_jur_known: { en: 'Known', fr: 'Connue' },
  advws_jur_assumed: { en: 'Assumed', fr: 'Présumée' },
  advws_jur_unknown: { en: 'Unknown', fr: 'Inconnue' },
  advws_jur_conflict: { en: 'Conflict', fr: 'Conflit' },
  advws_jur_na: { en: 'N/A', fr: 'S.O.' },

  /* Risk / safety level labels */
  advws_risk_low: { en: 'Low', fr: 'Faible' },
  advws_risk_medium: { en: 'Medium', fr: 'Moyen' },
  advws_risk_high: { en: 'High', fr: 'Élevé' },
  advws_risk_critical: { en: 'Critical', fr: 'Critique' },
  advws_safe_none: { en: 'None', fr: 'Aucun' },
  advws_safe_watch: { en: 'Watch', fr: 'À surveiller' },
  advws_safe_urgent: { en: 'Urgent', fr: 'Urgent' },
  advws_safe_critical: { en: 'Critical', fr: 'Critique' },

  /* Legal-basis validation badges */
  advws_cite_valid: { en: 'Valid', fr: 'Valide' },
  advws_cite_review: { en: 'Needs review', fr: 'À réviser' },

  /* Support-mode notice */
  advws_support_title: {
    en: 'Support mode — workspace intentionally off',
    fr: 'Mode soutien — espace intentionnellement désactivé',
  },
  advws_support_body: {
    en: 'This routed to supportive triage. No HR retrieval, legal basis, citations or documents are produced — the engine keeps the response human and gates every structured surface.',
    fr: 'Cette demande a été routée vers le triage de soutien. Aucune récupération RH, fondement juridique, citation ni document n’est produit — le moteur garde la réponse humaine et ferme toutes les surfaces structurées.',
  },

  /* Web sources */
  advws_web_on: { en: 'Search on', fr: 'Recherche activée' },
  advws_web_off: { en: 'Search off', fr: 'Recherche désactivée' },
  advws_web_note: {
    en: 'Sources are ranked by authority. Web results are not legal citations — verify against the statute before acting.',
    fr: 'Les sources sont classées par autorité. Les résultats Web ne sont pas des citations juridiques — vérifiez la loi avant d’agir.',
  },
  advws_auth_legislation: { en: 'Legislation', fr: 'Législation' },
  advws_auth_official: { en: 'Official gov', fr: 'Gouv. officiel' },
  advws_auth_regulator: { en: 'Regulator', fr: 'Organisme de réglementation' },
  advws_auth_court: { en: 'Court / tribunal', fr: 'Cour / tribunal' },
  advws_auth_secondary: { en: 'Secondary', fr: 'Secondaire' },
  advws_auth_general: { en: 'General web', fr: 'Web général' },

  /* Rendering gates */
  advws_gate_workspace: { en: 'Workspace', fr: 'Espace' },
  advws_gate_retrieval: { en: 'Retrieval', fr: 'Récupération' },
  advws_gate_legal: { en: 'Legal basis', fr: 'Fondement juridique' },
  advws_gate_docs: { en: 'Documents', fr: 'Documents' },
  advws_gate_web: { en: 'Web search', fr: 'Recherche Web' },

  /* Chat-side response experience */
  advws_province_q: { en: 'Which jurisdiction applies?', fr: 'Quelle compétence s’applique ?' },
  advws_province_on: { en: 'Ontario', fr: 'Ontario' },
  advws_province_qc: { en: 'Quebec', fr: 'Québec' },
  advws_province_fed: { en: 'Federal', fr: 'Fédéral' },
  advws_province_other: { en: 'Other', fr: 'Autre' },
})
