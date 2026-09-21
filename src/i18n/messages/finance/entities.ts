import { defineMessages } from '../../core'

/* Entities screen — legal entities and subscription records. */
export const financeEntities = defineMessages({
  finance_tab_entities: { en: 'Entities', fr: 'Entités' },
  finance_entity_title: { en: 'Legal entities', fr: 'Entités juridiques' },
  finance_entity_create: { en: 'New legal entity', fr: 'Nouvelle entité juridique' },
  finance_entity_legal_name: { en: 'Legal name', fr: 'Dénomination légale' },
  finance_entity_legal_form: { en: 'Legal form', fr: 'Forme juridique' },
  finance_entity_legal_form_corporation: { en: 'Corporation', fr: 'Société par actions' },
  finance_entity_legal_form_partnership: { en: 'Partnership', fr: 'Société en nom collectif' },
  finance_entity_legal_form_sole_proprietor: { en: 'Sole proprietor', fr: 'Travailleur autonome' },
  finance_entity_legal_form_nonprofit: { en: 'Non-profit', fr: 'Organisme sans but lucratif' },
  finance_entity_fiscal_year_start: { en: 'Fiscal year start', fr: 'Début d’exercice' },
  finance_entity_functional_currency: { en: 'Functional currency', fr: 'Devise fonctionnelle' },
  finance_entity_jurisdictions: { en: 'Jurisdictions', fr: 'Territoires de compétence' },
  finance_entity_accounting_source_id: { en: 'Accounting source ID', fr: 'ID source comptable' },
  finance_entity_payroll_source_id: { en: 'Payroll source ID', fr: 'ID source paie' },
  finance_entity_active: { en: 'Active', fr: 'Actif' },
  finance_entity_inactive: { en: 'Inactive', fr: 'Inactif' },
  finance_entity_edit_title: { en: 'Edit legal entity', fr: 'Modifier l’entité juridique' },
  finance_entity_integrations: { en: 'Integrations (optional)', fr: 'Intégrations (facultatives)' },
  finance_entity_empty: {
    en: 'No legal entities yet. Create one to use bank accounts, invoices, and other finance records.',
    fr: 'Aucune entité juridique pour l’instant. Créez-en une pour utiliser les comptes bancaires, factures et autres enregistrements financiers.',
  },
  finance_entity_select_prompt: {
    en: 'Create a legal entity in the Entities tab first.',
    fr: 'Créez d’abord une entité juridique dans l’onglet Entités.',
  },
  finance_entity_save_failed: {
    en: 'Couldn’t save the legal entity. Try again.',
    fr: 'Impossible d’enregistrer l’entité juridique. Réessayez.',
  },
  finance_entity_edit: { en: 'Edit', fr: 'Modifier' },
  finance_entity_remove: { en: 'Delete', fr: 'Supprimer' },
  finance_entity_remove_confirm: {
    en: 'Delete this legal entity?',
    fr: 'Supprimer cette entité juridique?',
  },

  /* Subscriptions */
  finance_subscription_create: { en: 'New subscription', fr: 'Nouvel abonnement' },
  finance_subscription_label: { en: 'Label', fr: 'Libellé' },
  finance_subscription_supplier: { en: 'Supplier', fr: 'Fournisseur' },
  finance_subscription_cost: { en: 'Cost', fr: 'Coût' },
  finance_subscription_renewal_term: { en: 'Renewal term', fr: 'Terme de renouvellement' },
  finance_subscription_next_renewal: {
    en: 'Next renewal date',
    fr: 'Prochaine date de renouvellement',
  },
  finance_subscription_notice_date: { en: 'Notice date', fr: 'Date de préavis' },
  finance_subscription_owner: { en: 'Owner', fr: 'Responsable' },
})
