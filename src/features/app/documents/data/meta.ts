/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. That generator is a one-shot import and can
   no longer be run (see its header), so entries added after the import are
   authored here by hand and marked AUTHORED IN-REPO. Leave the handoff-derived
   entries alone; append new ones. */
import type { Bi } from '@/i18n/core'
import { common } from '@/i18n/messages/common'
import type {
  CapabilityMatrix,
  DocRiskLevel,
  DocStatus,
  JurisdictionInfo,
  OrgProfile,
  ReviewStatus,
  RiskLevelInfo,
  RoleInfo,
  Sector,
  SignatureStatus,
  SizeThreshold,
  SizeTier,
  StatusInfo,
  TemplateCategory,
} from './types'

/**
 * The standing disclaimer, as it ships inside a generated document.
 *
 * CONVENTIONS.md requires the disclaimer near CTAs, generated documents and
 * Advisor output, and says never to retype it — but a Document Studio template
 * carries it as a `note` block rather than through the shared `Disclaimer`
 * component, so until review on #128 all 31 templates each held their own copy
 * of the sentence. They happened to agree; nothing made them.
 *
 * They reference this now instead. A template that wants to say something of
 * its own puts it in **its own note block** and leaves this one alone —
 * appending to it is how the wording starts drifting again, and
 * `authoredTemplates.test.ts` fails a note that contains this text plus more.
 *
 * The disclaimer sentence itself is not written here: it is `common.disclaimer`,
 * the string CONVENTIONS.md names. Centralizing on a wording of its own would
 * have made a fourth variant authoritative instead of removing the other
 * three. What this adds is the one thing specific to a generated document —
 * "review before use" — as its own sentence in front.
 */
export const DOC_DISCLAIMER_NOTE: Bi = {
  en: `Review before use. ${common.disclaimer.en}`,
  fr: `À réviser avant usage. ${common.disclaimer.fr}`,
}

/**
 * `order` is the employment lifecycle, not the order the categories were
 * added: hiring → changes → agreements → policies → discipline →
 * accommodation → termination. Termination sits last because it is where a
 * file ends and because it carries the highest-risk documents.
 */
export const templateCategories: TemplateCategory[] = [
  {
    id: 'hiring',
    order: 1,
    icon: 'briefcase',
    name: {
      en: 'Hiring & onboarding',
      fr: 'Embauche et intégration',
    },
    desc: {
      en: 'Offers and the agreements that start the relationship.',
      fr: 'Offres et ententes qui amorcent la relation.',
    },
  },
  /* AUTHORED IN-REPO — see docs/FOUR_RING_FRAMEWORK.md. The framework's Ring 1
     has an "Employment Changes" group with no home in the handoff's five
     categories, which is part of why its documents were never built. */
  {
    id: 'changes',
    order: 2,
    icon: 'arrow-right-left',
    name: {
      en: 'Employment changes',
      fr: 'Changements en cours d’emploi',
    },
    desc: {
      en: 'Confirming a change to the terms someone already works under.',
      fr: 'Confirmer une modification aux conditions déjà en vigueur.',
    },
  },
  {
    id: 'agreements',
    order: 3,
    icon: 'file-lock',
    name: {
      en: 'Agreements & IP',
      fr: 'Ententes et PI',
    },
    desc: {
      en: 'Confidentiality and restrictive-covenant agreements.',
      fr: 'Ententes de confidentialité et clauses restrictives.',
    },
  },
  {
    id: 'policies',
    order: 4,
    icon: 'book',
    name: {
      en: 'Policies & handbook',
      fr: 'Politiques et manuel',
    },
    desc: {
      en: 'The standing rules every employee is held to.',
      fr: 'Les règles permanentes applicables à tout le personnel.',
    },
  },
  {
    id: 'discipline',
    order: 5,
    icon: 'list-checks',
    name: {
      en: 'Performance & discipline',
      fr: 'Rendement et discipline',
    },
    desc: {
      en: 'Warnings, improvement plans, and the record of a workplace investigation.',
      fr: 'Avertissements, plans d’amélioration et le rapport d’une enquête en milieu de travail.',
    },
  },
  {
    id: 'termination',
    order: 7,
    icon: 'file-x',
    name: {
      en: 'Termination & offboarding',
      fr: 'Cessation et départ',
    },
    desc: {
      en: 'The highest-risk documents — review before use.',
      fr: 'Les documents les plus à risque — à réviser avant usage.',
    },
  },
  /* AUTHORED IN-REPO (not from the handoff) — see docs/FOUR_RING_FRAMEWORK.md.
     The accommodation process is Ring 2 Pillar B; its output document
     (T22) is Ring 1. Both live here because a category split by ring would
     hide the fact that they are one workflow. */
  {
    id: 'accommodation',
    order: 6,
    icon: 'heart-handshake',
    name: {
      en: 'Accommodation',
      fr: 'Accommodement',
    },
    desc: {
      en: 'The duty-to-accommodate process, from request to documented plan.',
      fr: 'Le processus d’obligation d’accommodement, de la demande au plan documenté.',
    },
  },
  /* AUTHORED IN-REPO (not from the handoff) — Ring 2 Pillar C, see
     docs/FOUR_RING_FRAMEWORK.md. Deliberately not filed under `accommodation`:
     a wellness action plan is voluntary and preventive, and filing it beside
     the duty-to-accommodate documents would state that an employee who
     completed one has a disability and asked for something. Both are false,
     and it is the same misfiling that put T19/T20 under `discipline`. */
  {
    id: 'wellbeing',
    order: 8,
    icon: 'sprout',
    name: {
      en: 'Wellbeing',
      fr: 'Mieux-être',
    },
    desc: {
      en: 'Voluntary, employee-owned plans for staying well at work. They request no diagnosis, and they are not accommodations.',
      fr: 'Plans volontaires, appartenant à la personne salariée, pour rester bien au travail. Ils ne demandent aucun diagnostic et ne constituent pas des accommodements.',
    },
  },
  /* AUTHORED IN-REPO (not from the handoff) — Ring 4, see
     docs/FOUR_RING_FRAMEWORK.md. Separate from `changes` because these
     documents report rather than vary: a total compensation summary changes
     nothing, and a salary review letter frequently reports that nothing
     changed. T26 stays in `changes` because confirming a new role or rate is
     a variation of the contract, which is a different act with different
     consequences. */
  {
    id: 'compensation',
    order: 9,
    icon: 'wallet',
    name: {
      en: 'Compensation',
      fr: 'Rémunération',
    },
    desc: {
      en: 'What someone is paid and what else they receive, stated without creating an entitlement that was not already there.',
      fr: 'Ce qu’une personne reçoit en rémunération et en avantages, énoncé sans créer de droit qui n’existait pas déjà.',
    },
  },
  /* AUTHORED IN-REPO (not from the handoff) — Ring 3, see
     docs/FOUR_RING_FRAMEWORK.md. Last in the order because it cuts across the
     lifecycle rather than sitting at a point in it: every other category is
     addressed to one person and goes on their file, and everything here is
     addressed to people who are not the subject of it. That is the difference
     to hold on to when adding one. */
  {
    id: 'communications',
    order: 10,
    icon: 'megaphone',
    name: {
      en: 'Internal communications',
      fr: 'Communications internes',
    },
    desc: {
      en: 'What the rest of the team is told, and when — announcements, memos and notices.',
      fr: 'Ce que le reste de l’équipe apprend, et quand — annonces, notes de service et avis.',
    },
  },
]

export const jurisdictionInfo: JurisdictionInfo[] = [
  {
    code: 'ON',
    name: {
      en: 'Ontario',
      fr: 'Ontario',
    },
    statute: {
      en: 'Employment Standards Act, 2000',
      fr: 'Loi de 2000 sur les normes d’emploi',
    },
    also: [
      {
        en: 'Occupational Health and Safety Act',
        fr: 'Loi sur la santé et la sécurité au travail',
      },
      {
        en: 'Human Rights Code (Ontario)',
        fr: 'Code des droits de la personne (Ontario)',
      },
    ],
  },
  {
    code: 'QC',
    name: {
      en: 'Québec',
      fr: 'Québec',
    },
    statute: {
      en: 'Act respecting labour standards (LSA)',
      fr: 'Loi sur les normes du travail (LNT)',
    },
    also: [
      {
        en: 'Charter of human rights and freedoms',
        fr: 'Charte des droits et libertés de la personne',
      },
      {
        en: 'Law 25 (private-sector privacy)',
        fr: 'Loi 25 (renseignements personnels)',
      },
    ],
  },
  {
    code: 'FED',
    name: {
      en: 'Federal',
      fr: 'Fédéral',
    },
    statute: {
      en: 'Canada Labour Code, Part III',
      fr: 'Code canadien du travail, Partie III',
    },
    also: [
      {
        en: 'Canadian Human Rights Act',
        fr: 'Loi canadienne sur les droits de la personne',
      },
      {
        en: 'PIPEDA',
        fr: 'LPRPDE',
      },
    ],
  },
]

export const workspaceRoles: RoleInfo[] = [
  {
    key: 'owner',
    label: {
      en: 'Owner / Admin',
      fr: 'Propriétaire / Admin',
    },
    initials: 'MC',
    desc: {
      en: 'Full access to every document and setting.',
      fr: 'Accès complet à tous les documents et réglages.',
    },
  },
  {
    key: 'hr',
    label: {
      en: 'HR manager',
      fr: 'Gestionnaire RH',
    },
    initials: 'RS',
    desc: {
      en: 'Create, edit, review, export, and send for signature.',
      fr: 'Créer, modifier, réviser, exporter, envoyer pour signature.',
    },
  },
  {
    key: 'manager',
    label: {
      en: 'Manager',
      fr: 'Gestionnaire',
    },
    initials: 'MC',
    desc: {
      en: 'Access limited to assigned employees and cases.',
      fr: 'Accès limité aux employés et dossiers assignés.',
    },
  },
  {
    key: 'viewer',
    label: {
      en: 'Viewer',
      fr: 'Lecteur',
    },
    initials: 'VP',
    desc: {
      en: 'Read-only across the workspace.',
      fr: 'Lecture seule dans l’espace de travail.',
    },
  },
  {
    key: 'external',
    label: {
      en: 'External signer',
      fr: 'Signataire externe',
    },
    initials: 'EX',
    desc: {
      en: 'Sees only the signing package assigned to them.',
      fr: 'Voit uniquement le dossier de signature assigné.',
    },
  },
]

/**
 * Stored values remain `low|medium|high`. User-facing copy is review level —
 * what review action is advisable — not a danger label for the template.
 * See `presentation.ts` for the Documents UI mapper and tests.
 */
export const riskLevelInfo: Record<DocRiskLevel, RiskLevelInfo> = {
  low: {
    key: 'low',
    tone: 'ok',
    order: 1,
    label: {
      en: 'Standard review',
      fr: 'Révision standard',
    },
    desc: {
      en: 'Routine document. Standard HR review is enough.',
      fr: 'Document courant. Une révision RH standard suffit.',
    },
  },
  medium: {
    key: 'medium',
    tone: 'warn',
    order: 2,
    label: {
      en: 'Careful review',
      fr: 'Révision approfondie',
    },
    desc: {
      en: 'Some legal exposure. Careful HR review before use.',
      fr: 'Exposition juridique modérée. Révision RH approfondie avant usage.',
    },
  },
  high: {
    key: 'high',
    tone: 'risk',
    order: 3,
    label: {
      en: 'Legal review recommended',
      fr: 'Révision juridique recommandée',
    },
    desc: {
      en: 'Significant exposure. Lawyer review recommended before use.',
      fr: 'Exposition importante. Révision juridique recommandée avant usage.',
    },
  },
}

export const documentStatusInfo: Record<DocStatus, StatusInfo> = {
  draft: {
    tone: 'neutral',
    label: {
      en: 'Draft',
      fr: 'Brouillon',
    },
  },
  in_review: {
    tone: 'info',
    label: {
      en: 'In review',
      fr: 'En révision',
    },
  },
  needs_revision: {
    tone: 'warn',
    label: {
      en: 'Needs revision',
      fr: 'À réviser',
    },
  },
  approved: {
    tone: 'ok',
    label: {
      en: 'Approved',
      fr: 'Approuvé',
    },
  },
  sent_for_signature: {
    tone: 'info',
    label: {
      en: 'Sent for signature',
      fr: 'Envoyé pour signature',
    },
  },
  partially_signed: {
    tone: 'warn',
    label: {
      en: 'Partially signed',
      fr: 'Partiellement signé',
    },
  },
  signed: {
    tone: 'ok',
    label: {
      en: 'Signed',
      fr: 'Signé',
    },
  },
  exported: {
    tone: 'ok',
    label: {
      en: 'Exported',
      fr: 'Exporté',
    },
  },
  archived: {
    tone: 'neutral',
    label: {
      en: 'Archived',
      fr: 'Archivé',
    },
  },
  voided: {
    tone: 'risk',
    label: {
      en: 'Voided',
      fr: 'Annulé',
    },
  },
  deleted: {
    tone: 'risk',
    label: {
      en: 'Deleted',
      fr: 'Supprimé',
    },
  },
}

export const reviewStatusInfo: Record<ReviewStatus, StatusInfo> = {
  not_reviewed: {
    tone: 'neutral',
    label: {
      en: 'Not reviewed',
      fr: 'Non révisé',
    },
  },
  hr_review_required: {
    tone: 'warn',
    label: {
      en: 'HR review required',
      fr: 'Révision RH requise',
    },
  },
  lawyer_review_recommended: {
    tone: 'risk',
    label: {
      en: 'Lawyer review recommended',
      fr: 'Révision juridique recommandée',
    },
  },
  approved_for_use: {
    tone: 'ok',
    label: {
      en: 'Approved for use',
      fr: 'Approuvé pour utilisation',
    },
  },
}

export const signatureStatusInfo: Record<SignatureStatus, StatusInfo> = {
  not_sent: {
    tone: 'neutral',
    label: {
      en: 'Not sent',
      fr: 'Non envoyé',
    },
  },
  sent: {
    tone: 'info',
    label: {
      en: 'Sent',
      fr: 'Envoyé',
    },
  },
  viewed: {
    tone: 'info',
    label: {
      en: 'Viewed',
      fr: 'Consulté',
    },
  },
  pending: {
    tone: 'warn',
    label: {
      en: 'Pending',
      fr: 'En attente',
    },
  },
  partially_signed: {
    tone: 'warn',
    label: {
      en: 'Partially signed',
      fr: 'Partiellement signé',
    },
  },
  signed: {
    tone: 'ok',
    label: {
      en: 'Signed',
      fr: 'Signé',
    },
  },
  declined: {
    tone: 'risk',
    label: {
      en: 'Declined',
      fr: 'Refusé',
    },
  },
  expired: {
    tone: 'risk',
    label: {
      en: 'Expired',
      fr: 'Expiré',
    },
  },
  voided: {
    tone: 'risk',
    label: {
      en: 'Voided',
      fr: 'Annulé',
    },
  },
}

export const capabilityMatrix: CapabilityMatrix = {
  view_repository: ['owner', 'hr', 'manager', 'viewer'],
  view_studio: ['owner', 'hr', 'manager', 'viewer'],
  generate: ['owner', 'hr', 'manager'],
  edit: ['owner', 'hr'],
  request_review: ['owner', 'hr', 'manager'],
  approve_review: ['owner', 'hr'],
  send_for_signature: ['owner', 'hr'],
  export: ['owner', 'hr', 'manager'],
  archive: ['owner', 'hr'],
  restore: ['owner'],
  void: ['owner'],
  manage_permissions: ['owner'],
  view_audit: ['owner', 'hr'],
}

export const sectors: Sector[] = [
  {
    key: 'transport_wh',
    federallyRegulated: false,
    name: {
      en: 'Transportation & warehousing',
      fr: 'Transport et entreposage',
    },
  },
  {
    key: 'retail_hosp',
    federallyRegulated: false,
    name: {
      en: 'Retail & hospitality',
      fr: 'Commerce de détail et hôtellerie',
    },
  },
  {
    key: 'construction',
    federallyRegulated: false,
    name: {
      en: 'Construction',
      fr: 'Construction',
    },
  },
  {
    key: 'prof_services',
    federallyRegulated: false,
    name: {
      en: 'Professional services',
      fr: 'Services professionnels',
    },
  },
  {
    key: 'manufacturing',
    federallyRegulated: false,
    name: {
      en: 'Manufacturing',
      fr: 'Fabrication',
    },
  },
  {
    key: 'healthcare',
    federallyRegulated: false,
    name: {
      en: 'Healthcare & social',
      fr: 'Santé et services sociaux',
    },
  },
  {
    key: 'banking',
    federallyRegulated: true,
    name: {
      en: 'Banking & finance',
      fr: 'Banques et finance',
    },
  },
  {
    key: 'telecom',
    federallyRegulated: true,
    name: {
      en: 'Telecommunications',
      fr: 'Télécommunications',
    },
  },
  {
    key: 'interprov',
    federallyRegulated: true,
    name: {
      en: 'Interprovincial transport',
      fr: 'Transport interprovincial',
    },
  },
]

export const sizeTiers: SizeTier[] = [
  {
    key: 'micro',
    min: 1,
    max: 4,
    label: {
      en: 'Micro employer',
      fr: 'Micro-employeur',
    },
  },
  {
    key: 'small',
    min: 5,
    max: 49,
    label: {
      en: 'Small employer',
      fr: 'Petit employeur',
    },
  },
  {
    key: 'mid',
    min: 50,
    max: 249,
    label: {
      en: 'Mid-sized employer',
      fr: 'Employeur de taille moyenne',
    },
  },
  {
    key: 'large',
    min: 250,
    max: null,
    label: {
      en: 'Large employer',
      fr: 'Grand employeur',
    },
  },
]

export const sizeThresholds: SizeThreshold[] = [
  {
    at: 25,
    text: {
      en: 'Written disconnecting-from-work & electronic-monitoring policies (ON, ESA); Québec Bill 96 OQLF registration.',
      fr: 'Politiques écrites sur la déconnexion et la surveillance électronique (ON, LNE) ; inscription à l’OQLF (Loi 96, QC).',
    },
  },
  {
    at: 50,
    text: {
      en: 'Group / mass-termination enhanced notice and government notification (ESA / Canada Labour Code).',
      fr: 'Avis bonifié de licenciement collectif et notification au gouvernement (LNE / Code canadien du travail).',
    },
  },
]

export const defaultOrgProfile: OrgProfile = {
  name: 'Northgate Logistics Inc.',
  headcount: 42,
  unionized: false,
  sector: 'transport_wh',
  primaryJurisdiction: 'ON',
}

export const unionNote: Bi = {
  en: 'In a unionized workplace the collective agreement and grievance procedure govern discipline and termination — adapt this document to the CA or use the negotiated process.',
  fr: 'En milieu syndiqué, la convention collective et la procédure de grief régissent la discipline et la cessation — adaptez ce document à la convention ou suivez le processus négocié.',
}

export const DOC_ORG_NAME = 'Northgate Logistics Inc.'
