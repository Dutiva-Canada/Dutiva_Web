import type { legalHubMessages } from '@/i18n/messages/legalHub'

type LegalHubKey = keyof typeof legalHubMessages

export interface LegalHubRow {
  /** `/legal/<slug>` — must match a `policyContent` document slug. */
  slug: string
  /**
   * `/fr/juridique/<frSlug>` — the localized French pathname segment for the
   * same document (see src/seo). Derived from the document's French title;
   * must be unique across rows.
   */
  frSlug: string
  titleKey: LegalHubKey
  descKey: LegalHubKey
}

interface LegalHubGroup {
  titleKey: LegalHubKey
  rows: LegalHubRow[]
}

/**
 * The 26 policy documents in the hub's prototype order (`legalHub_row1..26`),
 * grouped under the six `legalHub_s*` section headings.
 */
export const LEGAL_HUB_GROUPS: LegalHubGroup[] = [
  {
    titleKey: 'legalHub_s1',
    rows: [
      {
        slug: 'terms',
        frSlug: 'conditions-utilisation',
        titleKey: 'legalHub_row1_title',
        descKey: 'legalHub_row1_desc',
      },
      {
        slug: 'privacy',
        frSlug: 'politique-de-confidentialite',
        titleKey: 'legalHub_row2_title',
        descKey: 'legalHub_row2_desc',
      },
      {
        slug: 'disclaimer',
        frSlug: 'avis-juridique',
        titleKey: 'legalHub_row3_title',
        descKey: 'legalHub_row3_desc',
      },
      {
        slug: 'cookies',
        frSlug: 'politique-de-temoins',
        titleKey: 'legalHub_row4_title',
        descKey: 'legalHub_row4_desc',
      },
      {
        slug: 'accessibility',
        frSlug: 'declaration-accessibilite',
        titleKey: 'legalHub_row5_title',
        descKey: 'legalHub_row5_desc',
      },
    ],
  },
  {
    titleKey: 'legalHub_s2',
    rows: [
      {
        slug: 'pipeda-compliance',
        frSlug: 'conformite-lprpde',
        titleKey: 'legalHub_row6_title',
        descKey: 'legalHub_row6_desc',
      },
      {
        slug: 'quebec-law-25',
        frSlug: 'loi-25-quebec',
        titleKey: 'legalHub_row7_title',
        descKey: 'legalHub_row7_desc',
      },
      {
        slug: 'casl-compliance',
        frSlug: 'conformite-lcap',
        titleKey: 'legalHub_row8_title',
        descKey: 'legalHub_row8_desc',
      },
      {
        slug: 'cross-border-transfer',
        frSlug: 'transfert-transfrontalier-donnees',
        titleKey: 'legalHub_row9_title',
        descKey: 'legalHub_row9_desc',
      },
    ],
  },
  {
    titleKey: 'legalHub_s3',
    rows: [
      {
        slug: 'ai-technology',
        frSlug: 'politique-ia-technologie',
        titleKey: 'legalHub_row10_title',
        descKey: 'legalHub_row10_desc',
      },
      {
        slug: 'ai-usage-disclosure',
        frSlug: 'divulgation-utilisation-ia',
        titleKey: 'legalHub_row11_title',
        descKey: 'legalHub_row11_desc',
      },
      {
        slug: 'ai-risk-disclosure',
        frSlug: 'divulgation-risques-ia',
        titleKey: 'legalHub_row12_title',
        descKey: 'legalHub_row12_desc',
      },
      {
        slug: 'human-review-escalation',
        frSlug: 'escalade-revision-humaine',
        titleKey: 'legalHub_row13_title',
        descKey: 'legalHub_row13_desc',
      },
    ],
  },
  {
    titleKey: 'legalHub_s4',
    rows: [
      {
        slug: 'data-processing-agreement',
        frSlug: 'entente-traitement-donnees',
        titleKey: 'legalHub_row14_title',
        descKey: 'legalHub_row14_desc',
      },
      {
        slug: 'data-retention',
        frSlug: 'conservation-suppression-donnees',
        titleKey: 'legalHub_row15_title',
        descKey: 'legalHub_row15_desc',
      },
      {
        slug: 'data-deletion',
        frSlug: 'procedures-suppression-donnees',
        titleKey: 'legalHub_row16_title',
        descKey: 'legalHub_row16_desc',
      },
      {
        slug: 'incident-response-policy',
        frSlug: 'intervention-incidents',
        titleKey: 'legalHub_row17_title',
        descKey: 'legalHub_row17_desc',
      },
      {
        slug: 'security',
        frSlug: 'apercu-securite',
        titleKey: 'legalHub_row18_title',
        descKey: 'legalHub_row18_desc',
      },
      {
        slug: 'subprocessors',
        frSlug: 'sous-traitants',
        titleKey: 'legalHub_row19_title',
        descKey: 'legalHub_row19_desc',
      },
    ],
  },
  {
    titleKey: 'legalHub_s5',
    rows: [
      {
        slug: 'subscription-agreement',
        frSlug: 'entente-abonnement-saas',
        titleKey: 'legalHub_row20_title',
        descKey: 'legalHub_row20_desc',
      },
      {
        slug: 'refund-policy',
        frSlug: 'remboursement-annulation',
        titleKey: 'legalHub_row21_title',
        descKey: 'legalHub_row21_desc',
      },
      {
        slug: 'support-policy',
        frSlug: 'politique-soutien',
        titleKey: 'legalHub_row22_title',
        descKey: 'legalHub_row22_desc',
      },
    ],
  },
  {
    titleKey: 'legalHub_s6',
    rows: [
      {
        slug: 'acceptable-use',
        frSlug: 'utilisation-acceptable',
        titleKey: 'legalHub_row23_title',
        descKey: 'legalHub_row23_desc',
      },
      {
        slug: 'copyright',
        frSlug: 'droit-auteur',
        titleKey: 'legalHub_row24_title',
        descKey: 'legalHub_row24_desc',
      },
      {
        slug: 'trademark-policy',
        frSlug: 'marques-de-commerce',
        titleKey: 'legalHub_row25_title',
        descKey: 'legalHub_row25_desc',
      },
      {
        slug: 'dmca-takedown',
        frSlug: 'retrait-de-contenu',
        titleKey: 'legalHub_row26_title',
        descKey: 'legalHub_row26_desc',
      },
    ],
  },
]
