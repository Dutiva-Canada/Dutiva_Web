import { defineMessages } from '../../core'

/* Purchases & expenses — spend requests, bills, and expense actions. */
export const financePurchases = defineMessages({
  finance_purchases_title: { en: 'Purchases & expenses', fr: 'Achats et dépenses' },
  finance_purchases_requests: { en: 'Spend requests', fr: 'Demandes de dépense' },
  finance_purchases_no_requests: { en: 'No spend requests.', fr: 'Aucune demande de dépense.' },
  finance_purchases_add_request: { en: 'Add spend request', fr: 'Ajouter une demande de dépense' },
  finance_purchases_requester: { en: 'Requester', fr: 'Demandeur' },
  finance_purchases_purpose: { en: 'Purpose', fr: 'Objet' },
  finance_purchases_approver: { en: 'Approver', fr: 'Approbateur' },
  finance_purchases_pos: { en: 'Purchase orders', fr: 'Bons de commande' },
  finance_purchases_expenses: { en: 'Expenses', fr: 'Dépenses' },
  finance_purchases_subscriptions: { en: 'Subscriptions', fr: 'Abonnements' },
  finance_purchases_mark_submitted: { en: 'Submit', fr: 'Soumettre' },
  finance_purchases_mark_approved: { en: 'Approve', fr: 'Approuver' },
  finance_purchases_mark_rejected: { en: 'Reject', fr: 'Rejeter' },
  finance_purchases_mark_committed: { en: 'Mark committed', fr: 'Marquer engagé' },
  finance_purchases_mark_cancelled: { en: 'Cancel', fr: 'Annuler' },

  /* Bill actions */
  finance_bills_title: { en: 'Bills', fr: 'Factures fournisseurs' },
  finance_bills_no_bills: { en: 'No bills.', fr: 'Aucune facture fournisseur.' },
  finance_bill_post: { en: 'Post', fr: 'Afficher' },
  finance_bill_mark_paid: { en: 'Mark paid', fr: 'Marquer payée' },
  finance_bill_mark_partial: {
    en: 'Record partial payment',
    fr: 'Enregistrer un paiement partiel',
  },
  finance_bill_dispute: { en: 'Dispute', fr: 'Contester' },
  finance_bill_cancel: { en: 'Cancel', fr: 'Annuler' },
  finance_bill_mark_overdue: { en: 'Mark overdue', fr: 'Marquer en retard' },

  /* Create spend request form */
  finance_spend_create: { en: 'New spend request', fr: 'Nouvelle demande de dépense' },
  finance_spend_purpose: { en: 'Purpose', fr: 'Objet' },
  finance_spend_requester: { en: 'Requester', fr: 'Demandeur' },
  finance_spend_supplier: { en: 'Supplier', fr: 'Fournisseur' },
  finance_spend_amount: { en: 'Amount', fr: 'Montant' },

  /* Expense actions */
  finance_expense_approve: { en: 'Approve', fr: 'Approuver' },
  finance_expense_reject: { en: 'Reject', fr: 'Rejeter' },
  finance_expense_reimburse: { en: 'Mark reimbursed', fr: 'Marquer remboursée' },
  finance_expense_submit: { en: 'Submit', fr: 'Soumettre' },

  /* Approval actions */
  finance_approve: { en: 'Approve', fr: 'Approuver' },
  finance_reject: { en: 'Reject', fr: 'Rejeter' },
})
