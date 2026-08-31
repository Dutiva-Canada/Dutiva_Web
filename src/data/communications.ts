import { bi } from '@/i18n/core'
import type { Communication, CommunicationDetail } from './types'

/**
 * Communications, transcribed from the prototype's `buildCommunications()`
 * (base records) and `buildCommunicationsView()` (per-comm detail: audience
 * type, bilingual status, linked entity, sensitive-send gate).
 */

export const communications: Communication[] = [
  {
    id: 'cm1',
    title: bi(
      'Return-to-office cadence — company-wide',
      'Cadence de retour au bureau — à l’échelle de l’entreprise',
    ),
    audience: bi('All employees · 94 people', 'Tous les employés · 94 personnes'),
    province: bi('Multi-jurisdiction', 'Multijuridictionnel'),
    status: bi('Draft', 'Brouillon'),
    tone: 'warning',
    updated: bi('2h ago', 'Il y a 2 h'),
    note: bi(
      'Advisor flagged that RTO changes can constitute a change to terms of employment in some provinces. Review before sending.',
      'Le Conseiller a signalé que les changements de retour au bureau peuvent constituer une modification des conditions d’emploi dans certaines provinces. À réviser avant l’envoi.',
    ),
  },
  {
    id: 'cm2',
    title: bi('Benefits enrolment reminder', 'Rappel d’adhésion aux avantages'),
    audience: bi('New hires · 3 people', 'Nouveaux employés · 3 personnes'),
    province: bi('Multi-jurisdiction', 'Multijuridictionnel'),
    status: bi('Scheduled', 'Planifié'),
    tone: 'info',
    updated: bi('Sends Monday', 'Envoi lundi'),
    note: bi(
      'Bilingual send — French version generated for the Quebec recipient by default.',
      'Envoi bilingue — version française générée par défaut pour le destinataire québécois.',
    ),
  },
  {
    id: 'cm3',
    title: bi('Statutory holiday notice — August', 'Avis de jour férié — août'),
    audience: bi('Ontario, BC, AB · 71 people', 'Ontario, C.-B., AB · 71 personnes'),
    province: bi('Multi-jurisdiction', 'Multijuridictionnel'),
    status: bi('Sent', 'Envoyé'),
    tone: 'success',
    updated: bi('Yesterday', 'Hier'),
    note: bi(
      'Sent per-province with the correct statutory holidays for each jurisdiction.',
      'Envoyé par province avec les jours fériés appropriés pour chaque compétence.',
    ),
  },
  {
    id: 'cm4',
    title: bi('Wellbeing check-in invitation', 'Invitation au suivi de bien-être'),
    audience: bi('Managers · 8 people', 'Gestionnaires · 8 personnes'),
    province: bi('Multi-jurisdiction', 'Multijuridictionnel'),
    status: bi('Draft', 'Brouillon'),
    tone: 'info',
    updated: bi('3 days ago', 'Il y a 3 jours'),
    note: bi(
      'Neutral, non-diagnostic language reviewed by Advisor to avoid implying medical inquiry.',
      'Langage neutre et non diagnostique révisé par le Conseiller pour éviter de suggérer une enquête médicale.',
    ),
  },
  {
    id: 'cm5',
    title: bi(
      'Disciplinary meeting invite — Devon Clarke',
      'Invitation à une rencontre disciplinaire — Devon Clarke',
    ),
    audience: bi('Devon Clarke · 1 person', 'Devon Clarke · 1 personne'),
    province: bi('Ontario', 'Ontario'),
    status: bi('Draft', 'Brouillon'),
    tone: 'warning',
    updated: bi('Today', 'Aujourd’hui'),
    note: bi(
      'Meeting invites in a discipline process must stay neutral and must not presuppose an outcome.',
      'Les invitations à une rencontre dans un processus disciplinaire doivent rester neutres et ne pas présumer du résultat.',
    ),
  },
  {
    id: 'cm6',
    title: bi('Accommodation follow-up — Amara Okafor', 'Suivi d’accommodement — Amara Okafor'),
    audience: bi('Amara Okafor · 1 person', 'Amara Okafor · 1 personne'),
    province: bi('Ontario', 'Ontario'),
    status: bi('Draft', 'Brouillon'),
    tone: 'info',
    updated: bi('Today', 'Aujourd’hui'),
    note: bi(
      'Medical-adjacent — keep to functional language, never diagnosis.',
      'À caractère médical — utilisez un langage fonctionnel, jamais de diagnostic.',
    ),
  },
]

/**
 * Per-communication detail from the prototype's `buildCommunicationsView()`
 * (the view lists them in the order cm1, cm5, cm6, cm4, cm2, cm3).
 */
export const communicationDetails: Record<string, CommunicationDetail> = {
  cm1: {
    communicationId: 'cm1',
    audienceType: bi('Employee-facing', 'Destiné aux employés'),
    bilingual: bi('EN + FR ready', 'EN + FR prêts'),
    linkedTo: bi(
      'Linked: Remote Work Policy (refresh in draft)',
      'Lié : Politique de télétravail (mise à jour en ébauche)',
    ),
    sensitive: true,
    review: { tone: true, legal: false, clarity: true, policy: false },
    gateNote: bi(
      'RTO changes may alter terms of employment in some provinces, and the Remote Work Policy refresh is still in draft. Confirm policy alignment and jurisdictional impact before sending.',
      'Les changements de retour au bureau peuvent modifier les conditions d’emploi dans certaines provinces, et la mise à jour de la Politique de télétravail est encore en ébauche. Confirmez la cohérence avec la politique et l’impact selon la compétence avant l’envoi.',
    ),
  },
  cm2: {
    communicationId: 'cm2',
    audienceType: bi('Employee-facing', 'Destiné aux employés'),
    bilingual: bi(
      'EN + FR — French generated for the Quebec recipient',
      'EN + FR — version française générée pour le destinataire du Québec',
    ),
    linkedTo: null,
    sensitive: false,
    review: { tone: true, legal: true, clarity: true, policy: true },
    gateNote: null,
  },
  cm3: {
    communicationId: 'cm3',
    audienceType: bi('Employee-facing', 'Destiné aux employés'),
    bilingual: bi('EN + FR sent per province', 'EN + FR envoyés selon la province'),
    linkedTo: null,
    sensitive: false,
    review: { tone: true, legal: true, clarity: true, policy: true },
    gateNote: null,
  },
  cm4: {
    communicationId: 'cm4',
    audienceType: bi('Manager-facing', 'Destiné aux gestionnaires'),
    bilingual: bi('EN only — manager audience', 'EN seulement — auditoire gestionnaire'),
    linkedTo: null,
    sensitive: false,
    review: { tone: true, legal: true, clarity: true, policy: true },
    gateNote: null,
  },
  cm5: {
    communicationId: 'cm5',
    audienceType: bi('Employee-facing', 'Destiné aux employés'),
    bilingual: bi('EN — confirm language preference', 'EN — confirmer la préférence linguistique'),
    linkedTo: bi(
      'Linked: Performance case — Devon Clarke',
      'Lié : Dossier de rendement — Devon Clarke',
    ),
    sensitive: true,
    review: { tone: false, legal: false, clarity: true, policy: true },
    gateNote: bi(
      'This invite is part of a discipline process. Keep the language neutral, avoid presupposing an outcome, and confirm the meeting logistics are documented in the case before sending.',
      'Cette invitation s’inscrit dans un processus disciplinaire. Gardez un ton neutre, ne présumez pas du résultat et confirmez que la logistique de la rencontre est documentée au dossier avant l’envoi.',
    ),
  },
  cm6: {
    communicationId: 'cm6',
    audienceType: bi('Employee-facing', 'Destiné aux employés'),
    bilingual: bi('EN — Ontario workplace', 'EN — milieu de travail en Ontario'),
    linkedTo: bi(
      'Linked: Accommodation case — 90-day review Jul 14',
      'Lié : Dossier d’accommodement — examen à 90 jours le 14 juillet',
    ),
    sensitive: true,
    review: { tone: true, legal: false, clarity: true, policy: true },
    gateNote: bi(
      'Medical-adjacent communication — keep to functional language, never diagnosis. Confirm the Jul 14 review details before sending.',
      'Communication à caractère médical — utilisez un langage fonctionnel, jamais de diagnostic. Confirmez les détails de l’examen du 14 juillet avant l’envoi.',
    ),
  },
}
