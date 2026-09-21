import { defineMessages } from '../../core'

/* Sales & collections — invoices, actions, and the create form. */
export const financeSales = defineMessages({
  finance_sales_title: { en: 'Sales & collections', fr: 'Ventes et recouvrement' },
  finance_sales_invoices: { en: 'Invoices', fr: 'Factures' },
  finance_sales_no_invoices: { en: 'No invoices.', fr: 'Aucune facture.' },
  finance_sales_add_invoice: { en: 'Add invoice', fr: 'Ajouter une facture' },
  finance_sales_number: { en: 'Number', fr: 'Numéro' },
  finance_sales_customer: { en: 'Customer', fr: 'Client' },
  finance_sales_issue_date: { en: 'Issue date', fr: 'Date d’émission' },
  finance_sales_total: { en: 'Total', fr: 'Total' },
  finance_sales_paid: { en: 'Paid', fr: 'Payé' },
  finance_sales_outstanding: { en: 'Outstanding', fr: 'Solde dû' },
  finance_sales_credits: { en: 'Credits', fr: 'Avoirs' },

  /* Invoice actions */
  finance_invoice_issue: { en: 'Issue', fr: 'Émettre' },
  finance_invoice_mark_paid: { en: 'Mark paid', fr: 'Marquer payée' },
  finance_invoice_mark_partial: {
    en: 'Record partial payment',
    fr: 'Enregistrer un paiement partiel',
  },
  finance_invoice_dispute: { en: 'Dispute', fr: 'Contester' },
  finance_invoice_write_off: { en: 'Write off', fr: 'Passer en perte' },
  finance_invoice_cancel: { en: 'Cancel', fr: 'Annuler' },
  finance_invoice_mark_overdue: { en: 'Mark overdue', fr: 'Marquer en retard' },

  /* Create invoice form */
  finance_invoice_create: { en: 'New invoice', fr: 'Nouvelle facture' },
  finance_invoice_number: { en: 'Invoice number', fr: 'Numéro de facture' },
  finance_invoice_customer: { en: 'Customer', fr: 'Client' },
  finance_invoice_issue_date: { en: 'Issue date', fr: "Date d'émission" },
  finance_invoice_due_date: { en: 'Due date', fr: "Date d'échéance" },
  finance_invoice_subtotal: { en: 'Subtotal', fr: 'Sous-total' },
  finance_invoice_tax: { en: 'Tax', fr: 'Taxe' },
  finance_invoice_total: { en: 'Total', fr: 'Total' },
  finance_invoice_entity: { en: 'Entity', fr: 'Entité' },
})
