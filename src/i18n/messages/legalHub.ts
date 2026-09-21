import { defineMessages } from '../core'

/**
 * Legal hub (policy index) — page-specific EN + FR strings, extracted from the Dutiva marketing
 * prototype (legal.dc.html). Shared header/footer chrome already lives in landing.ts —
 * reuse those keys; do not duplicate them here. Register the spread below in
 * src/i18n/messages/index.ts. Keys are feature-prefixed per CONVENTIONS.md.
 */
export const legalHubMessages = defineMessages({
  legalHub_eyebrow: { en: 'Legal & compliance', fr: 'Juridique et conformité' },
  legalHub_h1: {
    en: 'Policies and compliance documentation.',
    fr: 'Politiques et documentation de conformité.',
  },
  legalHub_intro: {
    en: 'Every policy governing your use of Dutiva — privacy, terms, Canadian compliance frameworks, and how Dutiva Advisor is built and governed. Questions on any of these can be sent to legal@dutiva.ca.',
    fr: 'Toutes les politiques régissant votre utilisation de Dutiva — confidentialité, conditions, cadres de conformité canadiens, et la façon dont Dutiva Advisor est conçu et encadré. Toute question à ce sujet peut être envoyée à legal@dutiva.ca.',
  },
  legalHub_s1: { en: 'Core legal', fr: 'Documents juridiques essentiels' },
  legalHub_s2: { en: 'Canadian compliance', fr: 'Conformité canadienne' },
  legalHub_s3: { en: 'AI governance', fr: 'Gouvernance de l’IA' },
  legalHub_s4: { en: 'Data & security', fr: 'Données et sécurité' },
  legalHub_s5: { en: 'Billing & support', fr: 'Facturation et soutien' },
  legalHub_s6: { en: 'Intellectual property', fr: 'Propriété intellectuelle' },
  legalHub_row1_title: { en: 'Terms of Service', fr: 'Conditions d’utilisation' },
  legalHub_row1_desc: {
    en: 'The agreement governing your use of Dutiva',
    fr: 'L’entente régissant votre utilisation de Dutiva',
  },
  legalHub_row2_title: { en: 'Privacy Policy', fr: 'Politique de confidentialité' },
  legalHub_row2_desc: {
    en: 'How Dutiva collects, uses, and protects personal information',
    fr: 'Comment Dutiva recueille, utilise et protège les renseignements personnels',
  },
  legalHub_row3_title: { en: 'Legal Disclaimer', fr: 'Avis juridique' },
  legalHub_row3_desc: {
    en: 'Why Dutiva is not a law firm and does not give legal advice',
    fr: 'Pourquoi Dutiva n’est pas un cabinet d’avocats et ne donne pas de conseils juridiques',
  },
  legalHub_row4_title: { en: 'Cookie Policy', fr: 'Politique de témoins' },
  legalHub_row4_desc: {
    en: 'Cookies, local storage, and analytics on dutiva.ca',
    fr: 'Témoins, stockage local et analytique sur dutiva.ca',
  },
  legalHub_row5_title: { en: 'Accessibility Statement', fr: 'Déclaration d’accessibilité' },
  legalHub_row5_desc: {
    en: "Dutiva's commitment to accessible HR software",
    fr: 'L’engagement de Dutiva envers un logiciel RH accessible',
  },
  legalHub_row6_title: {
    en: 'PIPEDA Compliance Statement',
    fr: 'Déclaration de conformité à la LPRPDE',
  },
  legalHub_row6_desc: {
    en: 'Alignment with federal private-sector privacy law',
    fr: 'Harmonisation avec la loi fédérale sur la protection des renseignements personnels du secteur privé',
  },
  legalHub_row7_title: {
    en: 'Quebec Law 25 Compliance Documentation',
    fr: 'Documentation de conformité à la Loi 25 du Québec',
  },
  legalHub_row7_desc: {
    en: 'Quebec-specific privacy obligations and safeguards',
    fr: 'Obligations et mesures de protection propres au Québec en matière de confidentialité',
  },
  legalHub_row8_title: { en: 'CASL Compliance Policy', fr: 'Politique de conformité à la LCAP' },
  legalHub_row8_desc: {
    en: "Anti-spam law and Dutiva's commercial electronic messages",
    fr: 'Loi anti-pourriel et messages électroniques commerciaux de Dutiva',
  },
  legalHub_row9_title: {
    en: 'Cross-Border Data Transfer Disclosure',
    fr: 'Divulgation sur le transfert transfrontalier de données',
  },
  legalHub_row9_desc: {
    en: 'Where information is processed outside Canada',
    fr: 'Où les renseignements sont traités à l’extérieur du Canada',
  },
  legalHub_row10_title: {
    en: 'AI & Technology Policy',
    fr: 'Politique sur l’IA et la technologie',
  },
  legalHub_row10_desc: {
    en: 'How Advisor and generation features are built and used',
    fr: 'Comment le Conseiller et les fonctions de génération sont conçus et utilisés',
  },
  legalHub_row11_title: { en: 'AI Usage Disclosure', fr: 'Divulgation de l’utilisation de l’IA' },
  legalHub_row11_desc: {
    en: 'Where and how AI is used across Dutiva',
    fr: 'Où et comment l’IA est utilisée dans Dutiva',
  },
  legalHub_row12_title: {
    en: 'AI Risk Disclosure Framework',
    fr: 'Cadre de divulgation des risques liés à l’IA',
  },
  legalHub_row12_desc: {
    en: 'Known limitations and risk factors in AI-generated output',
    fr: 'Limites connues et facteurs de risque des résultats générés par l’IA',
  },
  legalHub_row13_title: {
    en: 'Human Review Escalation Policy',
    fr: 'Politique d’escalade pour révision humaine',
  },
  legalHub_row13_desc: {
    en: 'When and how matters are escalated for human/legal review',
    fr: 'Quand et comment les dossiers sont acheminés pour révision humaine ou juridique',
  },
  legalHub_row14_title: {
    en: 'Data Processing Agreement',
    fr: 'Entente de traitement des données',
  },
  legalHub_row14_desc: {
    en: 'Terms for processing customer and employee data',
    fr: 'Modalités de traitement des données des clients et des employés',
  },
  legalHub_row15_title: {
    en: 'Data Retention and Deletion Policy',
    fr: 'Politique de conservation et de suppression des données',
  },
  legalHub_row15_desc: {
    en: 'How long data is kept, and how it is deleted',
    fr: 'Durée de conservation des données et modalités de suppression',
  },
  legalHub_row16_title: {
    en: 'User Data Deletion Procedures',
    fr: 'Procédures de suppression des données de l’utilisateur',
  },
  legalHub_row16_desc: {
    en: 'Step-by-step account and data deletion process',
    fr: 'Processus détaillé de suppression du compte et des données',
  },
  legalHub_row17_title: {
    en: 'Incident and Breach Response Policy',
    fr: 'Politique d’intervention en cas d’incident et d’atteinte',
  },
  legalHub_row17_desc: {
    en: 'How Dutiva detects, contains, and reports security incidents',
    fr: 'Comment Dutiva détecte, contient et signale les incidents de sécurité',
  },
  legalHub_row18_title: { en: 'Security Overview', fr: 'Aperçu de la sécurité' },
  legalHub_row18_desc: {
    en: 'Infrastructure, access control, and safeguards',
    fr: 'Infrastructure, contrôle d’accès et mesures de protection',
  },
  legalHub_row19_title: { en: 'Subprocessor List', fr: 'Liste des sous-traitants' },
  legalHub_row19_desc: {
    en: "Third parties that process data on Dutiva's behalf",
    fr: 'Tiers qui traitent des données pour le compte de Dutiva',
  },
  legalHub_row20_title: { en: 'SaaS Subscription Agreement', fr: 'Entente d’abonnement SaaS' },
  legalHub_row20_desc: {
    en: 'Subscription terms, plans, and billing cycles',
    fr: 'Modalités d’abonnement, forfaits et cycles de facturation',
  },
  legalHub_row21_title: {
    en: 'Refund and Cancellation Policy',
    fr: 'Politique de remboursement et d’annulation',
  },
  legalHub_row21_desc: {
    en: 'Refunds, cancellations, and how to reactivate',
    fr: 'Remboursements, annulations et réactivation',
  },
  legalHub_row22_title: {
    en: 'Customer Support Policy',
    fr: 'Politique de soutien à la clientèle',
  },
  legalHub_row22_desc: {
    en: 'Support channels, hours, and response targets',
    fr: 'Canaux de soutien, heures et cibles de réponse',
  },
  legalHub_row23_title: { en: 'Acceptable Use Policy', fr: 'Politique d’utilisation acceptable' },
  legalHub_row23_desc: {
    en: 'Prohibited uses of Dutiva and Dutiva Advisor',
    fr: 'Utilisations interdites de Dutiva et de Dutiva Advisor',
  },
  legalHub_row24_title: { en: 'Copyright Policy', fr: 'Politique de droit d’auteur' },
  legalHub_row24_desc: {
    en: "Ownership of your content and Dutiva's platform",
    fr: 'Propriété de votre contenu et de la plateforme Dutiva',
  },
  legalHub_row25_title: {
    en: 'Trademark Usage Policy',
    fr: 'Politique d’utilisation des marques de commerce',
  },
  legalHub_row25_desc: {
    en: 'Rules for referencing the Dutiva name and marks',
    fr: 'Règles pour faire référence au nom et aux marques Dutiva',
  },
  legalHub_row26_title: { en: 'Content Takedown Procedure', fr: 'Procédure de retrait de contenu' },
  legalHub_row26_desc: {
    en: 'How to submit an infringement or takedown notice',
    fr: 'Comment soumettre un avis d’infraction ou de retrait',
  },

  /* PolicyPage chrome — not part of the handoff package (its policy bodies ship
     without page furniture). [FR self-authored] */
  legalHub_back: {
    en: 'All legal & compliance documents',
    fr: 'Tous les documents juridiques et de conformité',
  },
  legalHub_lastUpdated: { en: 'Last updated', fr: 'Dernière mise à jour' },
  legalHub_effective: { en: 'Effective date', fr: 'Date d’entrée en vigueur' },
  legalHub_frOnly: {
    en: 'The English edition of this document is being finalized — the French edition is shown below.',
    fr: 'La version anglaise de ce document est en cours de finalisation — la version française est affichée ci-dessous.',
  },
})
