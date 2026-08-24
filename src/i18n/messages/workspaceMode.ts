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
    en: 'To explore this view with sample data, switch to Demo in Settings.',
    fr: 'Pour explorer cette vue avec des données d’exemple, passez en mode Démo dans les paramètres.',
  },
  wsmode_empty_settings_link: { en: 'Open Settings', fr: 'Ouvrir les paramètres' },

  /* ── Topbar notifications ──────────────────────────────────────────────── */
  wsmode_notifications_empty: {
    en: 'You’re all caught up — no notifications.',
    fr: 'Vous êtes à jour — aucune notification.',
  },

  /* ── Advisor home (production) ─────────────────────────────────────────── */
  wsmode_advisor_greeting: { en: 'How can I help?', fr: 'Comment puis-je vous aider ?' },
  wsmode_advisor_sub: {
    en: 'Ask anything about HR compliance across Canada.',
    fr: 'Posez toute question sur la conformité RH partout au Canada.',
  },
})
