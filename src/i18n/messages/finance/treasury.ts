import { defineMessages } from '../../core'

/* Treasury — accounts, reserves, holdings, debt, and shared master data. */
export const financeTreasury = defineMessages({
  finance_treasury_title: { en: 'Treasury', fr: 'Trésorerie' },
  finance_treasury_accounts: { en: 'Bank accounts', fr: 'Comptes bancaires' },
  finance_treasury_reserves: { en: 'Reserve goals', fr: 'Objectifs de réserve' },
  finance_treasury_holdings: { en: 'Corporate holdings', fr: 'Placements d’entreprise' },
  finance_treasury_debt: { en: 'Debt & financing', fr: 'Dette et financement' },
  finance_treasury_no_reserves: { en: 'No reserve goals.', fr: 'Aucun objectif de réserve.' },
  finance_treasury_no_holdings: { en: 'No holdings.', fr: 'Aucun placement.' },
  finance_treasury_no_debt: { en: 'No debt records.', fr: 'Aucun dossier de dette.' },
  finance_treasury_target: { en: 'Target', fr: 'Cible' },
  finance_treasury_current: { en: 'Current', fr: 'Actuel' },
  finance_treasury_market_value: { en: 'Market value', fr: 'Valeur au marché' },
  finance_treasury_cost_basis: { en: 'Cost basis', fr: 'Coût de base' },
  finance_treasury_as_of: { en: 'As of', fr: 'Au' },
  finance_treasury_stale: { en: 'Stale valuation', fr: 'Évaluation périmée' },
  finance_treasury_maturity: { en: 'Maturity', fr: 'Échéance' },
  finance_treasury_interest_rate: { en: 'Interest rate', fr: 'Taux d’intérêt' },
  finance_treasury_balance: { en: 'Balance', fr: 'Solde' },
  finance_treasury_restricted: { en: 'Restricted', fr: 'Restreint' },
  finance_treasury_earmarked: { en: 'Earmarked', fr: 'Affecté' },

  /* Treasury — reserve goal create/update */
  finance_reserve_create: { en: 'New reserve goal', fr: 'Nouvel objectif de réserve' },
  finance_reserve_type: { en: 'Type', fr: 'Type' },
  finance_reserve_label: { en: 'Label', fr: 'Libellé' },
  finance_reserve_target: { en: 'Target amount', fr: 'Montant cible' },
  finance_reserve_current: { en: 'Current amount', fr: 'Montant actuel' },
  finance_reserve_owner: { en: 'Owner', fr: 'Responsable' },
  finance_reserve_due_date: { en: 'Due date', fr: 'Échéance' },
  finance_reserve_update_progress: { en: 'Update progress', fr: 'Mettre à jour la progression' },
  finance_reserve_mark_stale: { en: 'Mark stale', fr: 'Marquer obsolète' },

  /* Treasury — holdings */
  finance_holding_mark_stale: { en: 'Mark stale', fr: 'Marquer obsolète' },
  finance_holding_refresh: { en: 'Mark current', fr: 'Marquer à jour' },

  /* Treasury — debt [FR self-authored] */
  finance_debt_mark_paid_off: { en: 'Mark paid off', fr: 'Marquer remboursé' },
  finance_debt_covenant: { en: 'Covenant', fr: 'Covenant' },
  finance_debt_notice: { en: 'Notice period', fr: 'Préavis' },
  finance_debt_maturing: { en: 'Maturing soon', fr: 'Échéance proche' },

  /* Master data */
  finance_bank_account_create: { en: 'New bank account', fr: 'Nouveau compte bancaire' },
  finance_bank_account_label: { en: 'Account label', fr: 'Libellé du compte' },
  finance_bank_account_last4: { en: 'Last 4 digits', fr: '4 derniers chiffres' },
  finance_bank_account_restricted: { en: 'Restricted', fr: 'Restreint' },
  finance_bank_account_earmarked: { en: 'Earmarked amount', fr: 'Montant réservé' },
  finance_bank_account_maturity: { en: 'Maturity date', fr: 'Date d’échéance' },
  finance_ledger_account_create: { en: 'New ledger account', fr: 'Nouveau compte du grand livre' },
  finance_ledger_account_code: { en: 'Code', fr: 'Code' },
  finance_ledger_account_name: { en: 'Account name', fr: 'Nom du compte' },
  finance_ledger_account_type: { en: 'Account type', fr: 'Type de compte' },
  finance_ledger_account_sensitive: { en: 'Sensitive', fr: 'Sensible' },
  finance_party_create: { en: 'New party', fr: 'Nouvelle partie' },
  finance_party_name: { en: 'Name', fr: 'Nom' },
  finance_party_type: { en: 'Party type', fr: 'Type de partie' },
  finance_party_banking_on_file: {
    en: 'Banking details on file',
    fr: 'Coordonnées bancaires au dossier',
  },
  /* Party contacts (0173) — [FR self-authored] */
  finance_party_contact_name: { en: 'Contact name', fr: 'Nom du contact' },
  finance_party_contact_email: { en: 'Contact email', fr: 'Courriel du contact' },
  finance_party_contact_phone: { en: 'Contact phone', fr: 'Téléphone du contact' },

  /* Reserve goal types */
  finance_reserve_type_emergency_operating: {
    en: 'Emergency operating',
    fr: 'Fonds de fonctionnement d’urgence',
  },
  finance_reserve_type_payroll: { en: 'Payroll', fr: 'Paie' },
  finance_reserve_type_tax: { en: 'Tax', fr: 'Fiscalité' },
  finance_reserve_type_capital_purchase: { en: 'Capital purchase', fr: 'Achat d’immobilisations' },
  finance_reserve_type_other: { en: 'Other', fr: 'Autre' },

  /* Party types */
  finance_party_type_supplier: { en: 'Supplier', fr: 'Fournisseur' },
  finance_party_type_customer: { en: 'Customer', fr: 'Client' },
  finance_party_type_employee: { en: 'Employee', fr: 'Employé' },
  finance_party_type_bank: { en: 'Bank', fr: 'Banque' },
  finance_party_type_advisor: { en: 'Advisor', fr: 'Conseiller' },
  /* Capital partners — [FR self-authored] */
  finance_party_type_investor: { en: 'Investor', fr: 'Investisseur' },
  finance_party_type_lender: { en: 'Lender', fr: 'Prêteur' },

  /* Cash sweeps (0174) — records only; Dutiva does not move money.
     [FR self-authored] */
  finance_sweeps_title: { en: 'Cash sweeps', fr: 'Virements de trésorerie' },
  finance_sweep_create: { en: 'Record a sweep', fr: 'Enregistrer un virement' },
  finance_sweep_from: { en: 'From account', fr: 'Compte source' },
  finance_sweep_to: { en: 'To account', fr: 'Compte de destination' },
  finance_sweep_amount: { en: 'Amount', fr: 'Montant' },
  finance_sweep_scheduled_date: { en: 'Scheduled date', fr: 'Date prévue' },
  finance_sweep_reference: { en: 'Reference', fr: 'Référence' },
  finance_sweep_status_scheduled: { en: 'Scheduled', fr: 'Prévu' },
  finance_sweep_status_executed: { en: 'Executed', fr: 'Exécuté' },
  finance_sweep_status_cancelled: { en: 'Cancelled', fr: 'Annulé' },
  finance_sweep_mark_executed: { en: 'Mark executed', fr: 'Marquer exécuté' },
  finance_sweep_cancel: { en: 'Cancel sweep', fr: 'Annuler le virement' },
  finance_sweep_remove: { en: 'Delete sweep', fr: 'Supprimer le virement' },
  finance_sweep_remove_confirm: {
    en: 'Delete this sweep record?',
    fr: 'Supprimer cet enregistrement de virement ?',
  },
  finance_sweep_same_account: {
    en: 'Pick two different accounts.',
    fr: 'Choisissez deux comptes différents.',
  },
  finance_sweep_save_failed: {
    en: 'Could not save the sweep.',
    fr: 'Impossible d’enregistrer le virement.',
  },
})
