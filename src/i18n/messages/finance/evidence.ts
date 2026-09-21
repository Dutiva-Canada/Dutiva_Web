import { defineMessages } from '../../core'

/* Evidence & receipts — uploads, review states, and record linking. */
export const financeEvidence = defineMessages({
  finance_evidence_title: { en: 'Evidence & receipts', fr: 'Preuves et reçus' },
  finance_evidence_upload: { en: 'Upload receipt', fr: 'Téléverser un reçu' },
  finance_evidence_no_receipts: { en: 'No receipts uploaded.', fr: 'Aucun reçu téléversé.' },
  finance_evidence_reviewed: { en: 'Reviewed', fr: 'Révisé' },
  finance_evidence_pending: { en: 'Pending review', fr: 'En attente de révision' },
  finance_evidence_mark_reviewed: { en: 'Mark reviewed', fr: 'Marquer révisé' },
  finance_evidence_download: { en: 'Download', fr: 'Télécharger' },
  finance_evidence_uploaded_at: { en: 'Uploaded', fr: 'Téléversé' },
  finance_evidence_upload_error: {
    en: 'Could not upload the file. Check your connection and try again.',
    fr: 'Impossible de téléverser le fichier. Vérifiez votre connexion et réessayez.',
  },
  finance_evidence_select_file: { en: 'Choose a file', fr: 'Choisir un fichier' },
  finance_evidence_checklist: { en: 'Evidence checklist', fr: 'Liste de vérification des preuves' },
  finance_evidence_checklist_hint: {
    en: 'Track whether source documents are attached for each record.',
    fr: 'Suivez si les documents source sont joints pour chaque dossier.',
  },
  finance_evidence_attached: { en: 'Attached', fr: 'Joint' },
  finance_evidence_missing: { en: 'Missing', fr: 'Manquant' },

  /* Evidence — receipt linking and download */
  finance_evidence_link_bill: { en: 'Link to bill', fr: 'Lier à une facture' },
  finance_evidence_link_expense: { en: 'Link to expense', fr: 'Lier à une dépense' },
  finance_evidence_link_none: { en: 'No link', fr: 'Aucun lien' },
  finance_evidence_download_error: {
    en: 'Could not download file',
    fr: 'Téléchargement impossible',
  },
})
