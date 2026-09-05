import { FREE_PLAN_ACCESS_MONTHS } from '@/config/plans'
import { defineMessages } from '../../core'

export const landingPricing = defineMessages({
  landing_mod1_label: {
    en: 'Compliance',
    fr: 'Conformité',
  },
  landing_mod2_label: {
    en: 'People & Case Files',
    fr: 'Personnel et dossiers',
  },
  landing_mod3_label: {
    en: 'Knowledge',
    fr: 'Connaissances',
  },
  landing_mod4_label: {
    en: 'Compensation',
    fr: 'Rémunération',
  },
  landing_mod5_label: {
    en: 'Communications',
    fr: 'Communications',
  },
  landing_mod6_label: {
    en: 'Wellbeing',
    fr: 'Bien-être',
  },
  landing_mod7_label: {
    en: 'Analytics',
    fr: 'Analytique',
  },
  landing_mod8_label: {
    en: 'Hiring',
    fr: 'Recrutement',
  },
  landing_price_badge: {
    en: 'Pricing',
    fr: 'Tarifs',
  },
  landing_price_title: {
    en: 'Pick a plan that fits today. Upgrade when your HR work grows.',
    fr: 'Choisissez un forfait qui convient aujourd’hui. Évoluez quand vos RH grandissent.',
  },
  landing_price_sub: {
    en: 'No long-term contracts. No setup fees. Cancel anytime. Prices in CAD.',
    fr: 'Aucun contrat à long terme. Aucuns frais d’installation. Annulez à tout moment. Prix en CAD.',
  },
  landing_mo: {
    en: '/mo',
    fr: '/mois',
  },
  landing_free_name: {
    en: 'Free',
    fr: 'Gratuit',
  },
  landing_free_amt: {
    en: 'Free',
    fr: 'Gratuit',
  },
  landing_free_desc: {
    en: 'Waitlist — we’ll email you when a free seat opens.',
    fr: 'Liste d’attente — nous vous écrirons dès qu’une place gratuite se libère.',
  },
  landing_free_desc_ent: {
    en: 'For evaluation and very small employers.',
    fr: 'Pour l’évaluation et les très petits employeurs.', // [FR self-authored]
  },
  landing_free_note: {
    en: `Waitlist — limited capacity once a seat opens. Free access lasts ${FREE_PLAN_ACCESS_MONTHS} months. It may be extended after that.`,
    fr: `Liste d’attente — capacité limitée dès qu’une place se libère. L’accès gratuit dure ${FREE_PLAN_ACCESS_MONTHS} mois. Il pourrait être prolongé par la suite.`, // [FR self-authored]
  },
  /* Quiet-beta bullets — support membership; gates off. */
  landing_free_f1: {
    en: 'Full product once a seat opens',
    fr: 'Produit complet dès qu’une place se libère',
  },
  landing_free_f2: {
    en: 'Help Centre and email',
    fr: 'Centre d’aide et courriel',
  },
  landing_free_f3: {
    en: 'Standard queue (2 business days)',
    fr: 'File standard (2 jours ouvrables)',
  },
  /* Entitled bullets — shown only when PLAN_FEATURE_GATES_ENABLED. */
  landing_free_ent_f1: {
    en: '1 user, 5 active employees',
    fr: '1 utilisateur, 5 employés actifs', // [FR self-authored]
  },
  landing_free_ent_f2: {
    en: '20 Advisor replies / month',
    fr: '20 réponses du Conseiller / mois', // [FR self-authored]
  },
  landing_free_ent_f3: {
    en: 'Help Centre and email (2 business days)',
    fr: 'Centre d’aide et courriel (2 jours ouvrables)', // [FR self-authored]
  },
  landing_free_cta: {
    en: 'Join the waitlist',
    fr: 'Joindre la liste d’attente',
  },
  landing_starter_name: {
    en: 'Starter',
    fr: 'Starter',
  },
  landing_starter_desc: {
    en: 'Skip the waitlist. Full product, email support.',
    fr: 'Sautez la liste d’attente. Produit complet, soutien par courriel.',
  },
  landing_starter_desc_ent: {
    en: 'For an owner-managed microbusiness.',
    fr: 'Pour une microentreprise gérée par le propriétaire.', // [FR self-authored]
  },
  landing_starter_f1: {
    en: 'Skip the waitlist',
    fr: 'Sauter la liste d’attente',
  },
  landing_starter_f2: {
    en: 'Full product',
    fr: 'Produit complet',
  },
  landing_starter_f3: {
    en: 'Email support — paid tickets first',
    fr: 'Soutien par courriel — billets payants en premier',
  },
  landing_starter_ent_f1: {
    en: '2 users, 10 active employees',
    fr: '2 utilisateurs, 10 employés actifs', // [FR self-authored]
  },
  landing_starter_ent_f2: {
    en: '80 Advisor replies / month',
    fr: '80 réponses du Conseiller / mois', // [FR self-authored]
  },
  landing_starter_ent_f3: {
    en: 'Email support — paid tickets first',
    fr: 'Soutien par courriel — billets payants en premier', // [FR self-authored]
  },
  landing_starter_cta: {
    en: 'Start Starter',
    fr: 'Choisir Starter',
  },
  landing_growth_name: {
    en: 'Growth',
    fr: 'Growth',
  },
  landing_growth_popular: {
    en: 'Most popular',
    fr: 'Le plus populaire',
  },
  landing_growth_desc: {
    en: 'Faster replies and an onboarding walkthrough on request.',
    fr: 'Réponses plus rapides et une visite d’accueil sur demande.',
  },
  landing_growth_desc_ent: {
    en: 'For a growing small business that needs repeatable HR processes.',
    fr: 'Pour une PME en croissance qui a besoin de processus RH répétables.', // [FR self-authored]
  },
  landing_growth_f1: {
    en: 'Skip the waitlist',
    fr: 'Sauter la liste d’attente',
  },
  landing_growth_f2: {
    en: 'Initial reply within 1 business day',
    fr: 'Première réponse en 1 jour ouvrable',
  },
  landing_growth_f3: {
    en: 'Onboarding walkthrough on request',
    fr: 'Visite d’accueil sur demande',
  },
  landing_growth_ent_f1: {
    en: '5 users, 50 active employees',
    fr: '5 utilisateurs, 50 employés actifs', // [FR self-authored]
  },
  landing_growth_ent_f2: {
    en: '200 Advisor replies / month',
    fr: '200 réponses du Conseiller / mois', // [FR self-authored]
  },
  landing_growth_ent_f3: {
    en: 'Operational dashboard and analytics',
    fr: 'Tableau de bord opérationnel et analytique', // [FR self-authored]
  },
  landing_growth_cta: {
    en: 'Upgrade to Growth',
    fr: 'Passer à Growth',
  },
  landing_pro_name: {
    en: 'Professional',
    fr: 'Professional',
  },
  landing_pro_desc: {
    en: 'Same as Growth, plus a scheduled onboarding call.',
    fr: 'Comme Growth, plus un appel d’accueil planifié.',
  },
  landing_pro_desc_ent: {
    en: 'For an established SMB with multiple managers or more complex HR activity.',
    fr: 'Pour une PME établie avec plusieurs gestionnaires ou une activité RH plus complexe.', // [FR self-authored]
  },
  landing_pro_f1: {
    en: 'Skip the waitlist',
    fr: 'Sauter la liste d’attente',
  },
  landing_pro_f2: {
    en: 'Initial reply within 1 business day',
    fr: 'Première réponse en 1 jour ouvrable',
  },
  landing_pro_f3: {
    en: 'Scheduled onboarding call',
    fr: 'Appel d’accueil planifié',
  },
  landing_pro_ent_f1: {
    en: '10 users, 100 active employees',
    fr: '10 utilisateurs, 100 employés actifs', // [FR self-authored]
  },
  landing_pro_ent_f2: {
    en: '400 Advisor replies / month',
    fr: '400 réponses du Conseiller / mois', // [FR self-authored]
  },
  landing_pro_ent_f3: {
    en: 'Scheduled onboarding call',
    fr: 'Appel d’accueil planifié', // [FR self-authored]
  },
  landing_pro_cta: {
    en: 'Upgrade to Professional',
    fr: 'Passer à Professional',
  },
  landing_price_foot1: {
    en: 'Canadian HR compliance focus',
    fr: 'Axé sur la conformité RH canadienne',
  },
  landing_price_foot2: {
    en: 'Cancel anytime',
    fr: 'Annulation en tout temps',
  },
  landing_price_compare: {
    en: 'Compare all plans',
    fr: 'Comparer tous les forfaits',
  },
})
