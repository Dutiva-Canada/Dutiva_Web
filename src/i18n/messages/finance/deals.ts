import { defineMessages } from '../../core'

/* Deals screen — transaction pipeline and capital partners.
   Wording stays on records/workflow: Dutiva tracks a deal's progress;
   it does not broker, advise on, or settle transactions.
   [FR self-authored — not from a design handoff.] */
export const financeDeals = defineMessages({
  /* FR 'Affaires' (not 'Transactions') — that word already labels the
     ledger-transactions tab and a duplicate tab label would confuse. */
  finance_tab_deals: { en: 'Deals', fr: 'Affaires' },
  finance_deals_title: { en: 'Deal pipeline', fr: 'Pipeline de transactions' },
  finance_deals_note: {
    en: 'Dutiva records where each transaction stands — it does not broker deals or provide investment advice.',
    fr: 'Dutiva consigne l’état d’avancement de chaque transaction — il n’agit pas comme courtier et ne fournit pas de conseils en placement.',
  },
  finance_deals_active_count: { en: '{count} in progress', fr: '{count} en cours' },
  finance_deals_pipeline_value: { en: 'Pipeline value', fr: 'Valeur du pipeline' },
  finance_deals_next_target: { en: 'Next target date', fr: 'Prochaine date cible' },
  finance_deals_closed_count: { en: '{count} closed', fr: '{count} conclues' },
  finance_deals_passed_count: { en: '{count} passed', fr: '{count} écartées' },
  finance_deals_empty: {
    en: 'No deals in the pipeline yet. Add the first one to start tracking progress.',
    fr: 'Aucune transaction au pipeline pour l’instant. Ajoutez la première pour suivre l’avancement.',
  },
  finance_deals_create: { en: 'New deal', fr: 'Nouvelle transaction' },
  finance_deals_edit_title: { en: 'Edit deal', fr: 'Modifier la transaction' },
  finance_deals_name: { en: 'Deal name', fr: 'Nom de la transaction' },
  finance_deals_kind: { en: 'Type', fr: 'Type' },
  finance_deals_stage: { en: 'Stage', fr: 'Étape' },
  finance_deals_counterparty: { en: 'Counterparty', fr: 'Contrepartie' },
  finance_deals_value: { en: 'Value', fr: 'Valeur' },
  finance_deals_target_date: { en: 'Target date', fr: 'Date cible' },
  finance_deals_owner: { en: 'Owner', fr: 'Responsable' },
  finance_deals_notes: { en: 'Notes', fr: 'Notes' },
  finance_deals_entity: { en: 'Entity', fr: 'Entité' },
  finance_deals_move_to: { en: 'Move to {stage}', fr: 'Passer à {stage}' },
  finance_deals_edit: { en: 'Edit', fr: 'Modifier' },
  finance_deals_remove: { en: 'Delete', fr: 'Supprimer' },
  finance_deals_remove_confirm: {
    en: 'Delete this deal from the pipeline?',
    fr: 'Supprimer cette transaction du pipeline?',
  },
  finance_deals_save_failed: {
    en: 'Couldn’t save the deal. Try again.',
    fr: 'Impossible d’enregistrer la transaction. Réessayez.',
  },
  /* Lifecycle links — a deal feeds the decision journal and the shared
     task list (metadata.deal_id links the task back). */
  finance_deals_log_decision: { en: 'Log a decision', fr: 'Consigner une décision' },
  finance_deals_add_task: { en: 'Add follow-up task', fr: 'Ajouter une tâche de suivi' },
  finance_deals_task_title: { en: 'Follow up — {deal}', fr: 'Suivi — {deal}' },
  finance_deals_task_details: {
    en: 'Deal: {deal} · Type: {kind} · Stage: {stage} · Entity: {entity}',
    fr: 'Transaction : {deal} · Type : {kind} · Étape : {stage} · Entité : {entity}',
  },
  finance_deals_task_added: { en: 'Follow-up task added', fr: 'Tâche de suivi ajoutée' },
  finance_deals_task_open: { en: 'Open task', fr: 'Ouvrir la tâche' },
  finance_deals_task_failed: {
    en: 'Couldn’t add the task. Try again.',
    fr: 'Impossible d’ajouter la tâche. Réessayez.',
  },
  finance_deals_kind_acquisition: { en: 'Acquisition', fr: 'Acquisition' },
  finance_deals_kind_investment: { en: 'Investment', fr: 'Investissement' },
  finance_deals_kind_divestiture: { en: 'Divestiture', fr: 'Cession' },
  finance_deals_kind_financing: { en: 'Financing', fr: 'Financement' },
  finance_deals_kind_other: { en: 'Other', fr: 'Autre' },
  finance_deals_stage_sourcing: { en: 'Sourcing', fr: 'Prospection' },
  finance_deals_stage_diligence: { en: 'Diligence', fr: 'Vérification' },
  finance_deals_stage_negotiation: { en: 'Negotiation', fr: 'Négociation' },
  finance_deals_stage_agreement: { en: 'Agreement', fr: 'Entente' },
  finance_deals_stage_closed: { en: 'Closed', fr: 'Conclue' },
  finance_deals_stage_passed: { en: 'Passed', fr: 'Écartée' },
  /* Capital partners — investor/lender parties already live in the shared
     party table; this section surfaces them next to the pipeline. */
  finance_partners_title: { en: 'Capital partners', fr: 'Partenaires financiers' },
  finance_partners_empty: {
    en: 'No investors or lenders yet. Add one in the Purchases tab under Parties.',
    fr: 'Aucun investisseur ou prêteur pour l’instant. Ajoutez-en un dans l’onglet Achats, sous Parties.',
  },
  /* Commitments (finance_commitments, 0172) — the committed/called ledger
     per partner. Dutiva records the ledger; it does not process calls. */
  finance_commitment_add: { en: 'Add commitment', fr: 'Ajouter un engagement' },
  finance_commitment_create: { en: 'New commitment', fr: 'Nouvel engagement' },
  finance_commitment_edit_title: { en: 'Edit commitment', fr: 'Modifier l’engagement' },
  finance_commitment_label: { en: 'Label', fr: 'Libellé' },
  finance_commitment_committed: { en: 'Committed', fr: 'Engagé' },
  finance_commitment_called: { en: 'Called', fr: 'Appelé' },
  finance_commitment_uncalled: { en: 'Uncalled', fr: 'Non appelé' },
  finance_commitment_next_call: { en: 'Next call', fr: 'Prochain appel' },
  finance_commitment_status_active: { en: 'Active', fr: 'Actif' },
  finance_commitment_status_closed: { en: 'Closed', fr: 'Fermé' },
  finance_commitment_status: { en: 'Status', fr: 'Statut' },
  finance_commitment_entity: { en: 'Entity', fr: 'Entité' },
  finance_commitment_edit: { en: 'Edit commitment', fr: 'Modifier l’engagement' },
  finance_commitment_remove: { en: 'Delete commitment', fr: 'Supprimer l’engagement' },
  finance_commitment_remove_confirm: {
    en: 'Delete this commitment?',
    fr: 'Supprimer cet engagement?',
  },
  finance_commitment_save_failed: {
    en: 'Couldn’t save the commitment. Try again.',
    fr: 'Impossible d’enregistrer l’engagement. Réessayez.',
  },
})
