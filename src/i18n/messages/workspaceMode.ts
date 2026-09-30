import { defineMessages } from '../core'

/**
 * Workspace-mode strings — the production-mode empty states and the scrubbed
 * shell surfaces (no design-handoff counterpart: production mode is new work
 * on top of the prototype's demo experience). [FR self-authored] throughout.
 */
export const workspaceModeMessages = defineMessages({
  /* ── Shared production empty state (ModeGate) ──────────────────────────── */
  wsmode_empty_eyebrow: { en: 'Production workspace', fr: 'Espace de travail de production' },
  wsmode_empty_body: {
    en: 'Nothing here yet — your real workspace starts empty. Records you create will live here.',
    fr: 'Rien ici pour l’instant — votre espace de travail réel commence vide. Les enregistrements que vous créerez apparaîtront ici.',
  },
  wsmode_empty_why: { en: 'Why is this empty?', fr: 'Pourquoi est-ce vide ?' },
  wsmode_empty_hint: {
    en: 'Start from Home — your setup path is there.',
    fr: 'Commencez depuis l’accueil — votre parcours de démarrage s’y trouve.', // [FR self-authored]
  },
  wsmode_empty_settings_link: {
    en: 'Want sample data? Open Demo in Settings',
    fr: 'Vous voulez des données d’exemple ? Ouvrez la Démo dans les paramètres', // [FR self-authored]
  },
  wsmode_empty_cta_employees: { en: 'Add employees', fr: 'Ajouter des employés' }, // [FR self-authored]
  wsmode_empty_cta_studio: { en: 'Open Studio', fr: 'Ouvrir le Studio' }, // [FR self-authored]
  wsmode_empty_cta_workflows: {
    en: 'Guided processes',
    fr: 'Processus guidés', // [FR self-authored]
  },

  /* ── Topbar notifications ──────────────────────────────────────────────── */
  wsmode_notifications_empty: {
    en: 'You’re all caught up — no notifications.',
    fr: 'Vous êtes à jour — aucune notification.',
  },

  /* ── Workspace resolution gate (RequireAdminSession) ───────────────────── */
  wsmode_loading_a11y: {
    en: 'Loading your workspace',
    fr: 'Chargement de votre espace de travail',
  },
  wsmode_load_error_title: {
    en: 'We couldn’t load your workspace',
    fr: 'Impossible de charger votre espace de travail',
  },
  wsmode_load_error_body: {
    en: 'A connection or server hiccup kept us from resolving your workspace. Try again — nothing was changed.',
    fr: 'Un problème de connexion ou de serveur a empêché le chargement de votre espace de travail. Réessayez — rien n’a été modifié.', // [FR self-authored]
  },
  wsmode_load_retry: { en: 'Try again', fr: 'Réessayer' },

  /* ── Advisor home (production) ─────────────────────────────────────────── */
  wsmode_advisor_greeting: { en: 'How can I help?', fr: 'Comment puis-je vous aider ?' },
  wsmode_advisor_sub: {
    en: 'Ask anything about HR compliance across Canada.',
    fr: 'Posez toute question sur la conformité RH partout au Canada.',
  },
})
