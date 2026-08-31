import { BETA_COHORT_LIMIT } from '@/config/beta'
import { defineMessages } from '../../core'

export const landingWaitlistCta = defineMessages({
  landing_cta_badge: {
    en: 'Prefer not to pay yet?',
    fr: 'Vous préférez ne pas payer pour l’instant ?',
  },
  landing_cta_title: {
    en: 'Join the waitlist for a free seat.',
    fr: 'Joignez-vous à la liste d’attente pour une place gratuite.',
  },
  landing_cta_p: {
    en: 'A paid plan starts today. If you’d rather wait, leave your email — we’ll write when a free seat opens.',
    fr: 'Un forfait payant commence aujourd’hui. Si vous préférez attendre, laissez votre courriel — nous vous écrirons dès qu’une place gratuite se libère.',
  },
  landing_cta_explore_demo: {
    en: 'Explore the demo first — no sign-in required.',
    fr: 'Explorez la démo d’abord — sans connexion.',
  },
  /* Postdates the design handoff: beta capacity decision, 2026-08-07. The
     number is interpolated from BETA_COHORT_LIMIT so this copy cannot drift
     from the gate that enforces it. [FR self-authored] */
  landing_cta_capacity: {
    en: `The waitlist has ${BETA_COHORT_LIMIT} free seats to begin. Later signups stay on the list until a seat opens.`,
    fr: `La liste d’attente compte ${BETA_COHORT_LIMIT} places gratuites pour commencer. Les inscriptions suivantes restent sur la liste jusqu’à ce qu’une place se libère.`,
  },
  /* Spot counter above the beta form. {taken}/{limit} replaced at render.
     [FR self-authored] */
  landing_cta_spots: {
    en: '{taken} of {limit} spots currently taken',
    fr: '{taken} sur {limit} places actuellement prises',
  },
  landing_cta_email_ph: {
    en: 'you@company.ca',
    fr: 'vous@entreprise.ca',
  },
  landing_cta_btn: {
    en: 'Join the waitlist',
    fr: 'Joindre la liste d’attente',
  },
  landing_cta_disclaimer: {
    en: 'Practical HR workflow support & compliance-oriented guidance. It does not provide legal, tax, medical, or financial advice.',
    fr: 'Soutien pratique aux processus RH et conseils axés sur la conformité. Ne constitue pas un avis juridique, fiscal, médical ou financier.',
  },
  landing_cta_email_label: {
    en: 'Work email',
    fr: 'Courriel professionnel',
  },
  landing_cta_prov_label: {
    en: 'Province / jurisdiction (optional)',
    fr: 'Province ou régime applicable (facultatif)',
  },
  landing_cta_prov_0: {
    en: 'Select…',
    fr: 'Sélectionner…',
  },
  landing_cta_prov_on: {
    en: 'Ontario',
    fr: 'Ontario',
  },
  landing_cta_prov_qc: {
    en: 'Quebec',
    fr: 'Québec',
  },
  landing_cta_prov_fed: {
    en: 'Federal',
    fr: 'Fédéral',
  },
  landing_cta_prov_other: {
    en: 'Other',
    fr: 'Autre',
  },
  landing_cta_privacy_link: {
    en: 'Privacy Policy',
    fr: 'Politique de confidentialité',
  },
})
