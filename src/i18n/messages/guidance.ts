import { defineMessages } from '../core'

/**
 * Live legal-sources panel (Knowledge view) — real backend data, no
 * prototype counterpart. Self-authored EN + FR throughout.
 */
export const guidanceMessages = defineMessages({
  guidance_panel_title: {
    en: 'Live legal sources',
    fr: 'Sources juridiques en direct',
  },
  guidance_panel_beta: {
    en: 'Beta — real guidance sources and law-change tracking from the Dutiva backend.',
    fr: 'Bêta — sources de référence et suivi des changements législatifs réels du système Dutiva.',
  },
  guidance_signin_prompt: {
    en: 'Sign in to see real legal guidance sources and recent law changes.',
    fr: 'Connectez-vous pour voir les sources juridiques réelles et les changements législatifs récents.',
  },
  guidance_sources_heading: {
    en: 'Guidance sources',
    fr: 'Sources de référence',
  },
  guidance_law_updates_heading: {
    en: 'Recent law changes',
    fr: 'Changements législatifs récents',
  },
  guidance_loading: {
    en: 'Loading…',
    fr: 'Chargement…',
  },
  guidance_empty_sources: {
    en: 'No guidance sources yet.',
    fr: 'Aucune source de référence pour le moment.',
  },
  guidance_empty_updates: {
    en: 'No recent law changes.',
    fr: 'Aucun changement législatif récent.',
  },
  guidance_load_error: {
    en: 'Could not load live legal sources. Try again shortly.',
    fr: 'Impossible de charger les sources juridiques. Réessayez sous peu.',
  },
  /* Freshness. The monitor writing these rows once stopped for 52 days without
     anything surfacing it, so the panel states its own currency rather than
     letting undated rows imply they are current. [FR self-authored] */
  guidance_detected_on: {
    en: 'Detected',
    fr: 'Détecté le',
  },
  /* Monitoring coverage. A 2026-07-30 audit found Ontario and Québec sources
     unusable for change detection (docs/LAW_MONITORING.md). The panel states
     that rather than letting "law-change tracking" imply it covers everywhere.
     [FR self-authored] */
  guidance_coverage_heading: {
    en: 'Monitoring coverage',
    fr: 'Portée de la surveillance',
  },
  guidance_coverage_audited: {
    en: 'Last reviewed',
    fr: 'Dernière révision',
  },
  guidance_coverage_none_active: {
    en: 'Automated law-change detection is not currently confirmed for any supported jurisdiction. Keep verifying legislation against the official source — do not rely on this panel to tell you an amendment has happened.',
    fr: "La détection automatisée des changements législatifs n'est actuellement confirmée pour aucune juridiction prise en charge. Continuez de vérifier la législation auprès de la source officielle — ne comptez pas sur ce panneau pour vous signaler une modification.",
  },
  guidance_updates_stale: {
    en: 'Law-change monitoring has not reported in over a week. These entries may not reflect the current state of the legislation — check the official source before relying on them.',
    fr: "La surveillance des changements législatifs n'a rien signalé depuis plus d'une semaine. Ces entrées peuvent ne pas refléter l'état actuel de la législation — vérifiez la source officielle avant de vous y fier.",
  },
})
