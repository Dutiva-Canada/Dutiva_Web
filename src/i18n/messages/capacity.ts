import { defineMessages } from '../core'

/**
 * Organization capacity and admission strings.
 *
 * EN wording follows the product spec; FR is self-authored because there is no
 * design-handoff counterpart for the new capacity system.
 */
export const capacityMessages = defineMessages({
  /* ── Settings capacity alert (user-facing) ─────────────────────────────── */
  capacity_reached_title: {
    en: 'Dutiva is currently at capacity.',
    fr: 'Dutiva a actuellement atteint sa capacité.',
  },
  capacity_reached_body: {
    en:
      'We’re limiting new organizations while we expand our infrastructure and support capacity.',
    fr:
      'Nous limitons les nouvelles organisations pendant que nous augmentons notre infrastructure et notre capacité de soutien.',
  },
  capacity_waitlist_title: {
    en: 'You’re on the waitlist',
    fr: 'Vous êtes sur la liste d’attente',
  },
  capacity_waitlist_body: {
    en: 'We’ll let you know when new organization capacity becomes available.',
    fr: 'Nous vous informerons lorsque de la capacité pour de nouvelles organisations sera disponible.',
  },
  capacity_join_waitlist: {
    en: 'Join the waitlist',
    fr: 'Rejoindre la liste d’attente',
  },
  capacity_dismiss: {
    en: 'Dismiss',
    fr: 'Fermer',
  },
  capacity_error_title: {
    en: 'Organization creation failed',
    fr: 'La création de l’organisation a échoué',
  },
  capacity_error_body: {
    en: 'Please try again or contact support.',
    fr: 'Veuillez réessayer ou contacter le soutien.',
  },

  /* ── Admin capacity control (operator-facing) ──────────────────────────── */
  capacity_admin_title: {
    en: 'Organization capacity',
    fr: 'Capacité d’organisations',
  },
  capacity_admin_current: {
    en: 'Organizations',
    fr: 'Organisations',
  },
  capacity_admin_limit: {
    en: 'Capacity limit',
    fr: 'Limite de capacité',
  },
  capacity_admin_remaining: {
    en: 'Remaining',
    fr: 'Restantes',
  },
  capacity_admin_utilization: {
    en: 'Utilization',
    fr: 'Utilisation',
  },
  capacity_admin_enforcement: {
    en: 'Enforcement enabled',
    fr: 'Application activée',
  },
  capacity_admin_mode: {
    en: 'Admission mode',
    fr: 'Mode d’admission',
  },
  capacity_admin_mode_unlimited: {
    en: 'Unlimited',
    fr: 'Illimité',
  },
  capacity_admin_mode_capped: {
    en: 'Capped',
    fr: 'Plafonné',
  },
  capacity_admin_mode_waitlist: {
    en: 'Waitlist',
    fr: 'Liste d’attente',
  },
  capacity_admin_waitlist_count: {
    en: 'Waitlist',
    fr: 'Liste d’attente',
  },
  capacity_admin_save: {
    en: 'Save',
    fr: 'Enregistrer',
  },
  capacity_admin_saving: {
    en: 'Saving…',
    fr: 'Enregistrement…',
  },
  capacity_admin_saved: {
    en: 'Saved',
    fr: 'Enregistré',
  },
  capacity_admin_error: {
    en: 'Could not save capacity settings.',
    fr: 'Impossible d’enregistrer les paramètres de capacité.',
  },
  capacity_admin_load_error: {
    en: 'Could not load capacity status.',
    fr: 'Impossible de charger l’état de la capacité.',
  },

  /* ── Threshold labels (driven by get_organization_capacity_status) ──────── */
  capacity_threshold_normal: {
    en: 'Normal',
    fr: 'Normal',
  },
  capacity_threshold_approaching: {
    en: 'Approaching capacity',
    fr: 'Capacité approchante',
  },
  capacity_threshold_near: {
    en: 'Near capacity',
    fr: 'Capacité proche',
  },
  capacity_threshold_full: {
    en: 'Full',
    fr: 'Pleine',
  },
  capacity_threshold_unlimited: {
    en: 'Unlimited',
    fr: 'Illimitée',
  },
  capacity_threshold_monitoring_disabled: {
    en: 'Monitoring disabled',
    fr: 'Surveillance désactivée',
  },
})
