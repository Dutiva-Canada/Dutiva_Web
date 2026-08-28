import { BETA_COHORT_LIMIT } from '@/config/beta'
import { defineMessages } from '../../core'

export const landingMisc = defineMessages({
landing_cta_done_t: {
    en: "You're on the list.",
    fr: 'Vous êtes inscrit.',
  },
landing_cta_done_p: {
    en: "We'll email you when your seat is ready.",
    fr: 'Nous vous écrirons lorsque votre place sera prête.',
  },
/* Postdates the design handoff: shown instead of landing_cta_done_* when
     the server reports the first cohort is already full, so a visitor who
     will wait is never promised access. [FR self-authored] */
  landing_cta_wait_t: {
    en: "You're on the waiting list.",
    fr: 'Vous êtes sur la liste d’attente.',
  },
landing_cta_wait_p: {
    en: `The first ${BETA_COHORT_LIMIT} free seats are taken. We'll email you as soon as one opens.`,
    fr: `Les ${BETA_COHORT_LIMIT} premières places gratuites sont prises. Nous vous écrirons dès qu’une place se libère.`,
  },
landing_fp_advisor: {
    en: 'Advisor',
    fr: 'Conseiller',
  },
landing_fp_workflows: {
    en: 'Workflows',
    fr: 'Processus',
  },
landing_fp_templates: {
    en: 'Document Studio',
    fr: 'Studio de documents',
  },
landing_fp_beta: {
    en: 'Waitlist',
    fr: 'Liste d’attente',
  },
landing_fr_getstarted: {
    en: 'Getting Started',
    fr: 'Prise en main',
  },
landing_fr_faq: {
    en: 'FAQ',
    fr: 'FAQ',
  },
landing_fr_help: {
    en: 'Help Centre',
    fr: 'Centre d’aide',
  },
landing_fr_status: {
    en: 'Service status',
    fr: 'État des services',
  },
landing_fr_changelog: {
    en: 'Changelog',
    fr: 'Journal des modifications',
  },
landing_fr_tmplusage: {
    en: 'Template Usage',
    fr: 'Utilisation des modèles',
  },
landing_fr_limits: {
    en: 'Known Limitations',
    fr: 'Limites connues',
  },
landing_fr_blog: {
    en: 'Blog',
    fr: 'Blogue',
  },
landing_fc_about: {
    en: 'About Us',
    fr: 'À propos',
  },
landing_fc_contact: {
    en: 'Contact',
    fr: 'Contact',
  },
landing_fc_openapp: {
    en: 'Open app',
    fr: "Ouvrir l'application",
  },
landing_fl_privacy: {
    en: 'Privacy Policy',
    fr: 'Politique de confidentialité',
  },
landing_fl_terms: {
    en: 'Terms of Service',
    fr: "Conditions d'utilisation",
  },
landing_fl_cookie: {
    en: 'Cookie Policy',
    fr: 'Politique de témoins',
  },
landing_fl_disclaimer: {
    en: 'Disclaimer',
    fr: 'Avis de non-responsabilité',
  },
landing_fl_access: {
    en: 'Accessibility',
    fr: 'Accessibilité',
  },
landing_fl_ai: {
    en: 'AI & Technology',
    fr: 'IA et technologie',
  },
landing_fl_dpa: {
    en: 'Data Processing Agreement',
    fr: 'Entente de traitement des données',
  },
landing_fl_retention: {
    en: 'Data Retention',
    fr: 'Conservation des données',
  },
landing_fl_pipeda: {
    en: 'PIPEDA',
    fr: 'LPRPDE',
  },
landing_fl_law25: {
    en: 'Quebec Law 25',
    fr: 'Loi 25 (Québec)',
  },
landing_fl_casl: {
    en: 'CASL',
    fr: 'LCAP',
  },
landing_cta_company_label: {
    en: 'Company (optional)',
    fr: 'Entreprise (facultatif)',
  },
landing_cta_company_ph: {
    en: 'Company name',
    fr: "Nom de l'entreprise",
  },
/* The consent itself is the checkbox (landing_cta_consent_label) — CASL
     wants express consent, not consent implied by submitting. This line is
     only the privacy-handling notice that accompanies it. */
  landing_cta_consent: {
    en: 'Dutiva will handle your information according to its',
    fr: 'Dutiva traitera vos renseignements conformément à sa',
  },
landing_cta_sending: {
    en: 'Sending…',
    fr: 'Envoi…',
  },
landing_cta_error: {
    en: 'Please enter a valid work email address.',
    fr: 'Veuillez saisir une adresse courriel valide.',
  },
landing_cta_consent_label: {
    en: 'Yes, email me product updates about Dutiva. I can unsubscribe at any time.',
    fr: 'Oui, envoyez-moi des mises à jour sur Dutiva. Je peux me désabonner en tout temps.',
  },
landing_cta_consent_err: {
    en: 'Please confirm you agree to receive product updates.',
    fr: 'Veuillez confirmer que vous acceptez de recevoir des mises à jour.',
  },
landing_cta_rate_limited: {
    en: 'Too many attempts in a short time. Please try again later, or email support@dutiva.ca.',
    fr: 'Trop de tentatives en peu de temps. Réessayez plus tard ou écrivez à support@dutiva.ca.',
  },
landing_cta_fail: {
    en: 'Could not record your signup. Please try again, or email support@dutiva.ca.',
    fr: "Impossible d'enregistrer votre inscription. Réessayez ou écrivez à support@dutiva.ca.",
  },
landing_cta_captcha_required: {
    en: 'Please complete the human-verification check to continue.',
    fr: 'Veuillez compléter la vérification humaine pour continuer.',
  },
landing_cta_captcha_failed: {
    en: 'Human verification failed. Please complete the check and try again.',
    fr: 'La vérification humaine a échoué. Complétez la vérification et réessayez.',
  },
})
