import { defineMessages } from '../core'

/**
 * Advisor chat core + contextual rail — chrome strings for the shared chat
 * primitives (typing indicator, reasoning expander, trust notes, composer),
 * the rail overlay, and the per-view "Ask Advisor" briefings ported from the
 * prototype's `openRailGeneral()`.
 *
 * EN verbatim from `App v2.dc.html`; FR from its `frDict()` / `buildI18n()` /
 * inline `L(en, fr)` pairs. FR strings with no source in the prototype are
 * marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * Components resolve these via `useI18n().x(advisorCore.key)` so they
 * typecheck before registration; they can switch to `t('advisor_…')` after.
 */
export const advisorCore = defineMessages({
  /* ── Chat primitives ────────────────────────────────────────────────────── */
  advisor_thinking: { en: 'Advisor is thinking', fr: 'Le Conseiller réfléchit' }, // [FR self-authored]
  advisor_thinking_short: { en: 'Thinking', fr: 'Réflexion' }, // [FR self-authored]
  advisor_reasoning: { en: 'Reasoning', fr: 'Raisonnement' },
  advisor_confidence: { en: 'Confidence: ', fr: 'Confiance : ' }, // [FR self-authored]
  advisor_trust_risk: {
    en: 'High-risk — Advisor recommends review with qualified counsel before acting.',
    fr: 'À risque élevé — le Conseiller recommande un examen par un conseiller juridique qualifié avant d’agir.',
  },
  advisor_trust_warning: {
    en: 'Confirm the specifics for this file before you proceed.',
    fr: 'Confirmez les détails de ce dossier avant de poursuivre.',
  },
  advisor_send: { en: 'Send', fr: 'Envoyer' }, // [FR self-authored]

  /* ── Rich message formatting (ChatMarkdown / ChatChart) ─────────────────── */
  // Accessible name for the horizontally scrollable frame a Markdown table
  // sits in — screen-reader only. [FR self-authored]
  advisor_md_table: { en: 'Table', fr: 'Tableau' },
  advisor_md_image: { en: 'Image', fr: 'Image' },
  advisor_chart_data: { en: 'Chart data', fr: 'Données du graphique' }, // [FR self-authored]
  advisor_chart_show_data: { en: 'Show data', fr: 'Afficher les données' }, // [FR self-authored]
  advisor_chart_hide_data: { en: 'Hide data', fr: 'Masquer les données' }, // [FR self-authored]

  advisor_retry: { en: 'Retry', fr: 'Réessayer' },
  advisor_retry_resolved: { en: 'Fixed — try again.', fr: 'Corrigé — réessayez.' }, // [FR self-authored]
  advisor_error_default: {
    en: 'Advisor couldn’t complete that just now — a connection issue on our end.',
    // [FR self-authored]
    fr: 'Le Conseiller n’a pas pu terminer pour l’instant — un problème de connexion de notre côté.',
  },

  /* ── Rail overlay chrome ────────────────────────────────────────────────── */
  advisor_rail_aria: { en: 'Ask Advisor', fr: 'Demander au Conseiller' },
  advisor_rail_eyebrow: { en: 'Advisor', fr: 'Conseiller' },
  advisor_rail_close: { en: 'Close', fr: 'Fermer' }, // [FR self-authored]
  advisor_rail_placeholder: { en: 'Ask a follow-up…', fr: 'Posez une question de suivi…' },

  /* Rail acknowledgement turn (prototype `sendRailMessage`). */
  advisor_rail_ack: {
    en: "Noted — I've logged that against this context. For document generation or a full step-by-step, open this in Advisor Home.",
    // [FR self-authored]
    fr: 'Noté — je l’ai consigné dans ce contexte. Pour générer des documents ou obtenir la démarche complète, ouvrez ceci dans l’accueil du Conseiller.',
  },
  advisor_rail_continue_title: {
    en: 'Continue in Advisor Home',
    fr: 'Poursuivre dans l’accueil du Conseiller', // [FR self-authored]
  },
  advisor_rail_continue_body: {
    en: 'Get the full conversation view with documents, citations, and escalation options.',
    // [FR self-authored]
    fr: 'Obtenez la vue complète de la conversation avec les documents, les citations et les options d’escalade.',
  },
  advisor_rail_open_home: {
    en: 'Open Advisor Home',
    fr: 'Ouvrir l’accueil du Conseiller', // [FR self-authored]
  },

  /* ── Briefing card actions ──────────────────────────────────────────────── */
  advisor_action_open_case: { en: 'Open case', fr: 'Ouvrir le dossier' },
  advisor_action_view_compliance: { en: 'View in Compliance', fr: 'Voir dans Conformité' },
  advisor_action_draft_refresh: { en: 'Draft the refresh', fr: 'Rédiger la mise à jour' }, // [FR self-authored]

  /* ── Per-view "Ask Advisor" briefings (prototype `openRailGeneral`) ─────── */
  /* Titles reuse the workspace view labels (buildI18n `v_*`). */
  advisor_brief_title_employees: { en: 'Employees', fr: 'Employés' },
  advisor_brief_title_compliance: { en: 'Compliance', fr: 'Conformité' },
  advisor_brief_title_policies: { en: 'Policies', fr: 'Politiques' },
  advisor_brief_title_tasks: { en: 'Tasks', fr: 'Tâches' },
  advisor_brief_title_calendar: { en: 'Calendar', fr: 'Calendrier' },
  advisor_brief_title_reports: { en: 'Reports', fr: 'Rapports' },
  advisor_brief_title_templates: { en: 'Document Studio', fr: 'Studio de documents' },
  advisor_brief_title_knowledge: { en: 'Knowledge Base', fr: 'Base de connaissances' },
  advisor_brief_title_settings: { en: 'Settings', fr: 'Paramètres' },
  advisor_brief_title_fallback: { en: 'Advisor', fr: 'Conseiller' },

  /* Briefing bodies — EN verbatim; FR self-authored unless noted (the
     prototype passes these through `tr()` with no frDict entry). */
  advisor_brief_employees_text: {
    en: 'Two things stand out across your team right now.',
    fr: 'Deux éléments ressortent dans votre équipe en ce moment.', // [FR self-authored]
  },
  advisor_brief_employees_risk_title: {
    en: 'Jordan Mensah — notice exposure',
    // [FR adapted from frDict 'Jordan Mensah — notice exposure; no termination clause on file']
    fr: 'Jordan Mensah — exposition au préavis',
  },
  advisor_brief_employees_risk_body: {
    en: 'No termination clause on file. Recommend legal review before finalizing anything.',
    // [FR self-authored; first clause from frDict]
    fr: 'Aucune clause de licenciement au dossier. Un examen juridique est recommandé avant de finaliser quoi que ce soit.',
  },
  advisor_brief_employees_warn_title: {
    en: 'Amara Okafor — accommodation review due',
    // [FR adapted from frDict 'Amara Okafor — accommodation review due in 7 days']
    fr: 'Amara Okafor — examen d’accommodement dû',
  },
  advisor_brief_employees_warn_body: {
    en: 'Scheduled for July 14 — confirm modified duties are still appropriate.',
    // [FR self-authored, following the frDict phrasing for the same flag]
    fr: 'Prévu le 14 juillet — confirmez que les tâches modifiées sont toujours appropriées.',
  },
  advisor_brief_compliance_text: {
    en: 'Here’s the state of play across your open risk items.',
    fr: 'Voici l’état des lieux de vos éléments à risque ouverts.', // [FR self-authored]
  },
  advisor_brief_compliance_card_title: {
    en: '2 high-severity items need attention',
    fr: '2 éléments de gravité élevée requièrent votre attention', // [FR self-authored]
  },
  advisor_brief_compliance_card_body: {
    en: 'Jordan Mensah’s notice exposure and the 14-month-overdue Remote Work Policy both need action this week.',
    // [FR self-authored]
    fr: 'L’exposition au préavis de Jordan Mensah et la politique de télétravail en retard de 14 mois exigent toutes deux une action cette semaine.',
  },
  advisor_brief_policies_text: {
    en: 'One policy is overdue and worth prioritizing.',
    fr: 'Une politique est en retard et mérite d’être priorisée.', // [FR self-authored]
  },
  advisor_brief_policies_card_title: {
    en: 'Remote Work Policy — 14 months overdue',
    fr: 'Politique de télétravail — 14 mois de retard', // [FR self-authored; title from frDict]
  },
  advisor_brief_policies_card_body: {
    en: 'You’ve added employees in 3 new provinces since the last review.',
    // [FR adapted from frDict "You've added employees in 3 new provinces since the last review — …"]
    fr: 'Vous avez ajouté des employés dans 3 nouvelles provinces depuis le dernier examen.',
  },
  advisor_brief_tasks_text: {
    en: 'Your two highest-priority items both relate to the same case.',
    fr: 'Vos deux éléments les plus prioritaires concernent le même dossier.', // [FR self-authored]
  },
  advisor_brief_tasks_card_title: {
    en: 'Jordan Mensah case has 2 open tasks',
    fr: 'Le dossier de Jordan Mensah compte 2 tâches ouvertes', // [FR self-authored]
  },
  advisor_brief_tasks_card_body: {
    en: 'Notice exposure review and payroll confirmation are both still open.',
    // [FR self-authored]
    fr: 'L’examen de l’exposition au préavis et la confirmation de la masse salariale sont toujours ouverts.',
  },
  advisor_brief_calendar_text: {
    en: 'Your next compliance-driven date is the accommodation review on July 14 for Amara Okafor.',
    // [FR self-authored]
    fr: 'Votre prochaine échéance de conformité est l’examen d’accommodement du 14 juillet pour Amara Okafor.',
  },
  advisor_brief_reports_text: {
    en: 'Compliance score has climbed from 74 to 82 over the last 6 months — the remaining gap is mostly the overdue Remote Work Policy.',
    // [FR self-authored]
    fr: 'Le score de conformité est passé de 74 à 82 au cours des 6 derniers mois — l’écart restant tient surtout à la politique de télétravail en retard.',
  },
  advisor_brief_templates_text: {
    en: 'Most-used documents this month: Termination Letter, Offer Letter, and Onboarding Package.',
    // [FR self-authored; document titles from frDict]
    fr: 'Documents les plus utilisés ce mois-ci : lettre de cessation d’emploi, lettre d’offre et trousse d’intégration.',
  },
  advisor_brief_knowledge_text: {
    en: 'Ontario notice & severance rules are your most-viewed topic — want a refresher?',
    // [FR self-authored]
    fr: 'Les règles de préavis et d’indemnité de l’Ontario sont votre sujet le plus consulté — envie d’un rappel ?',
  },
  advisor_brief_settings_text: {
    en: 'Your workspace covers Ontario, BC, Quebec, Alberta, and federally regulated roles. Let me know if that changes.',
    // [FR self-authored]
    fr: 'Votre espace de travail couvre l’Ontario, la C.-B., le Québec, l’Alberta et les rôles sous réglementation fédérale. Dites-moi si cela change.',
  },
  advisor_brief_fallback_text: {
    en: 'Ask about a person, case, policy, or deadline.',
    // [FR self-authored — kept identical to shell_rail_fallback_text]
    fr: 'Posez une question sur une personne, un dossier, une politique ou une échéance.',
  },
  /* Production Ask Advisor — no Northgate fixture cards; point at real entry
     points instead. [FR self-authored] */
  advisor_brief_prod_text: {
    en: 'Ask anything about HR compliance. Or jump into a guided process or Document Studio — those don’t need sample data.',
    fr: 'Posez toute question sur la conformité RH. Ou lancez un processus guidé ou le Studio de documents — ceux-ci n’exigent pas de données d’exemple.',
  },
  advisor_brief_prod_card_title: {
    en: 'Start without sample data',
    fr: 'Commencer sans données d’exemple',
  },
  advisor_brief_prod_card_body: {
    en: 'Guided processes and Studio work in an empty production workspace. Fixture case briefs only appear in Demo.',
    fr: 'Les processus guidés et le Studio fonctionnent dans un espace de production vide. Les résumés de dossiers d’exemple n’apparaissent qu’en mode Démo.',
  },
  advisor_action_start_process: {
    en: 'Guided processes',
    fr: 'Processus guidés',
  },
  advisor_action_open_studio: {
    en: 'Open Studio',
    fr: 'Ouvrir le Studio',
  },
})
