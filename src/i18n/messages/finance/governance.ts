import { defineMessages } from '../../core'

/* Finance governance screen — board-oriented cap table, capital-partner
   roster, and audit trail. All derived from existing finance state. */
export const financeGovernance = defineMessages({
  finance_tab_governance: { en: 'Governance', fr: 'Gouvernance' },
  finance_governance_cap_table: { en: 'Cap table', fr: 'Table de capitalisation' },
  finance_governance_entity: { en: 'Entity', fr: 'Entité' },
  finance_governance_parent: { en: 'Parent', fr: 'Société mère' },
  finance_governance_ownership: { en: 'Ownership', fr: 'Participation' },
  finance_governance_legal_form: { en: 'Legal form', fr: 'Forme juridique' },
  finance_governance_no_audit: {
    en: 'No audit events yet.',
    fr: 'Aucun événement d’audit pour le moment.',
  },
})
