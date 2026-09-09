import { defineMessages } from '../core'

/**
 * Advisor Memory workspace strings — the four-tab governance workspace
 * (Memories / Review queue / Activity / Governance). Split out of `memory.ts`
 * to keep that file under the 800-line architecture budget. EN [self-authored];
 * FR [self-authored].
 */
export const memoryWorkspaceMessages = defineMessages({
  memory_ws_subtitle: {
    en: 'Control what Advisor remembers, where each memory came from, and how long it may be used.',
    fr: 'Contrôlez ce que le Conseiller retient, d’où provient chaque élément et pendant combien de temps il peut être utilisé.',
  }, // [FR self-authored]
  memory_ws_add: { en: 'Add memory', fr: 'Ajouter un élément à la mémoire' }, // [FR self-authored]
  memory_ws_enabled: { en: 'Advisor memory enabled', fr: 'Mémoire du Conseiller activée' }, // [FR self-authored]
  memory_ws_disabled: { en: 'Advisor memory disabled', fr: 'Mémoire du Conseiller désactivée' }, // [FR self-authored]
  memory_ws_disabled_note: {
    en: 'Advisor is not retrieving memory or proposing new memories. Existing records are preserved subject to their retention rules.',
    fr: 'Le Conseiller ne récupère pas la mémoire et ne propose pas de nouveaux éléments. Les enregistrements existants sont conservés selon leurs règles de conservation.',
  }, // [FR self-authored]

  memory_tab_memories: { en: 'Memories', fr: 'Éléments mémorisés' }, // [FR self-authored]
  memory_tab_review: { en: 'Review queue', fr: 'À réviser' },
  memory_tab_activity: { en: 'Activity', fr: 'Activité' },
  memory_tab_governance: { en: 'Governance', fr: 'Gouvernance' }, // [FR self-authored]
  memory_tabs_aria: { en: 'Advisor memory sections', fr: 'Sections de la mémoire du Conseiller' }, // [FR self-authored]

  memory_metric_active: { en: 'Active memories', fr: 'Éléments actifs' }, // [FR self-authored]
  memory_metric_needs_review: { en: 'Needs review', fr: 'À réviser' },
  memory_metric_expiring: { en: 'Expiring soon', fr: 'Expiration prochaine' }, // [FR self-authored]
  memory_metric_restricted: { en: 'Restricted', fr: 'Restreint' },

  memory_filter_search: { en: 'Search memories', fr: 'Rechercher des éléments' }, // [FR self-authored]
  memory_filter_subject: { en: 'Subject', fr: 'Sujet' }, // [FR self-authored]
  memory_filter_status: { en: 'Status', fr: 'Statut' }, // [FR self-authored]
  memory_filter_source: { en: 'Source', fr: 'Source' },
  memory_filter_sensitivity: { en: 'Sensitivity', fr: 'Sensibilité' }, // [FR self-authored]
  memory_filter_all: { en: 'All', fr: 'Tous' },
  memory_filter_clear: { en: 'Clear filters', fr: 'Effacer les filtres' }, // [FR self-authored]
  memory_filter_more: { en: 'More filters', fr: 'Plus de filtres' }, // [FR self-authored]
  memory_filter_none: { en: 'No subject filter', fr: 'Aucun filtre de sujet' }, // [FR self-authored]

  memory_status_proposed: { en: 'Proposed', fr: 'Proposé' }, // [FR self-authored]
  memory_status_needs_review: { en: 'Needs review', fr: 'À réviser' },
  memory_status_confirmed: { en: 'Confirmed', fr: 'Confirmé' },
  memory_status_expired: { en: 'Expired', fr: 'Expiré' }, // [FR self-authored]
  memory_status_removed: { en: 'Removed', fr: 'Retiré' }, // [FR self-authored]

  memory_class_fact: { en: 'Fact', fr: 'Fait' },
  memory_class_preference: { en: 'Preference', fr: 'Préférence' }, // [FR self-authored]
  memory_class_allegation: { en: 'Allegation', fr: 'Allégation' }, // [FR self-authored]
  memory_class_opinion: { en: 'Opinion', fr: 'Opinion' }, // [FR self-authored]
  memory_class_evidence: { en: 'Evidence', fr: 'Élément de preuve' }, // [FR self-authored]
  memory_class_finding: { en: 'Finding', fr: 'Conclusion' }, // [FR self-authored]
  memory_class_decision: { en: 'Decision', fr: 'Décision' }, // [FR self-authored]
  memory_class_contextual: { en: 'Contextual', fr: 'Contextuel' }, // [FR self-authored]

  memory_sensitivity_standard: { en: 'Standard', fr: 'Standard' }, // [FR self-authored]
  memory_sensitivity_restricted: { en: 'Restricted', fr: 'Restreint' },
  memory_origin_explicit: { en: 'Explicit', fr: 'Explicite' }, // [FR self-authored]
  memory_origin_inferred: { en: 'Inferred', fr: 'Inféré' },
  memory_origin_manual: { en: 'Manual', fr: 'Manuel' }, // [FR self-authored]

  memory_retention_advisor_conversation: {
    en: 'Advisor conversation memory',
    fr: 'Mémoire de conversation du Conseiller',
  }, // [FR self-authored]
  memory_retention_employee_preference: {
    en: 'General employee preference',
    fr: 'Préférence générale de l’employé',
  }, // [FR self-authored]
  memory_retention_employment_record: {
    en: 'Employment record',
    fr: 'Dossier d’emploi',
  }, // [FR self-authored]
  memory_retention_payroll_tax: { en: 'Payroll / tax record', fr: 'Dossier de paie / fiscal' }, // [FR self-authored]
  memory_retention_investigation: {
    en: 'Investigation / case material',
    fr: 'Matériel d’enquête / de dossier',
  }, // [FR self-authored]
  memory_retention_wellbeing_personal: {
    en: 'Wellbeing / personal information',
    fr: 'Bien-être / renseignements personnels',
  }, // [FR self-authored]
  memory_retention_custom: { en: 'Custom', fr: 'Personnalisé' }, // [FR self-authored]

  memory_retrieval_workspace: { en: 'Workspace', fr: 'Espace' }, // [FR self-authored]
  memory_retrieval_case: { en: 'Case only', fr: 'Dossier seulement' }, // [FR self-authored]
  memory_retrieval_conversation: { en: 'Conversation only', fr: 'Conversation seulement' }, // [FR self-authored]
  memory_retrieval_workflow: { en: 'Workflow only', fr: 'Flux seulement' }, // [FR self-authored]
  memory_retrieval_scope: { en: 'Retrieval scope', fr: 'Portée de récupération' }, // [FR self-authored]
  memory_retrieval_scope_note: {
    en: 'Where Advisor may use this memory. Case-scoped memories do not surface in unrelated contexts.',
    fr: 'Où le Conseiller peut utiliser cet élément. Les éléments liés à un dossier n’apparaissent pas dans des contextes non liés.',
  }, // [FR self-authored]

  memory_row_subject: { en: 'Subject', fr: 'Sujet' }, // [FR self-authored]
  memory_row_source: { en: 'Source', fr: 'Source' },
  memory_row_verified: { en: 'Last verified', fr: 'Dernière vérification' }, // [FR self-authored]
  memory_row_review: { en: 'Review', fr: 'Révision' }, // [FR self-authored]
  memory_row_expiry: { en: 'Expires', fr: 'Expire' }, // [FR self-authored]
  memory_row_actions: { en: 'Actions', fr: 'Actions' }, // [FR self-authored]
  memory_row_open_details: { en: 'Open details', fr: 'Ouvrir les détails' }, // [FR self-authored]
  memory_row_not_advisor_usable: {
    en: 'Not available to Advisor',
    fr: 'Non accessible au Conseiller',
  }, // [FR self-authored]
  memory_row_legal_hold: { en: 'Legal hold', fr: 'Conservation pour litige' }, // [FR self-authored]
  memory_row_legal_hold_note: {
    en: 'Scheduled expiration and deletion are paused.',
    fr: 'L’expiration et la suppression programmées sont suspendues.',
  }, // [FR self-authored]

  memory_empty_title: { en: 'No memories yet', fr: 'Aucun élément mémorisé' }, // [FR self-authored]
  memory_empty_body: {
    en: 'Memories you add or approve will appear here. Advisor may also propose information worth remembering for your review.',
    fr: 'Les éléments que vous ajoutez ou approuvez apparaîtront ici. Le Conseiller peut aussi proposer des renseignements à retenir, à réviser.',
  }, // [FR self-authored]
  memory_empty_add: { en: 'Add memory', fr: 'Ajouter un élément à la mémoire' }, // [FR self-authored]
  memory_empty_learn: { en: 'Learn how memory works', fr: 'Découvrir le fonctionnement de la mémoire' }, // [FR self-authored]
  memory_empty_normal: {
    en: 'An empty workspace is normal when you’re getting started.',
    fr: 'Un espace vide est normal au démarrage.',
  }, // [FR self-authored]
  memory_no_results_title: { en: 'No memories match your filters', fr: 'Aucun élément ne correspond à vos filtres' }, // [FR self-authored]
  memory_no_results_body: {
    en: 'Try clearing filters or searching for something different.',
    fr: 'Essayez d’effacer les filtres ou de rechercher autre chose.',
  }, // [FR self-authored]
  memory_disabled_title: { en: 'Advisor memory is disabled', fr: 'La mémoire du Conseiller est désactivée' }, // [FR self-authored]
  memory_disabled_body: {
    en: 'Advisor is not retrieving memory or proposing new memories. Existing records are preserved. Enable memory in Governance to resume.',
    fr: 'Le Conseiller ne récupère pas la mémoire et ne propose pas de nouveaux éléments. Les enregistrements existants sont conservés. Activez la mémoire dans Gouvernance pour reprendre.',
  }, // [FR self-authored]
  memory_disabled_enable: { en: 'Enable in Governance', fr: 'Activer dans Gouvernance' }, // [FR self-authored]

  memory_details_title: { en: 'Memory details', fr: 'Détails de l’élément' }, // [FR self-authored]
  memory_details_close: { en: 'Close details', fr: 'Fermer les détails' }, // [FR self-authored]
  memory_details_statement: { en: 'Memory', fr: 'Élément' }, // [FR self-authored]
  memory_details_subject: { en: 'Subject', fr: 'Sujet' }, // [FR self-authored]
  memory_details_classification: { en: 'Classification', fr: 'Classification' }, // [FR self-authored]
  memory_details_status: { en: 'Status', fr: 'Statut' }, // [FR self-authored]
  memory_details_source: { en: 'Source', fr: 'Source' },
  memory_details_source_excerpt: { en: 'Source excerpt', fr: 'Extrait de la source' }, // [FR self-authored]
  memory_details_view_source: { en: 'View source', fr: 'Voir la source' }, // [FR self-authored]
  memory_details_creator: { en: 'Created by', fr: 'Créé par' }, // [FR self-authored]
  memory_details_proposed_by: { en: 'Proposed by', fr: 'Proposé par' }, // [FR self-authored]
  memory_details_confidence: { en: 'Confidence', fr: 'Confiance' },
  memory_details_purpose: { en: 'Purpose', fr: 'Finalité' }, // [FR self-authored]
  memory_details_jurisdiction: { en: 'Jurisdiction', fr: 'Juridiction' }, // [FR self-authored]
  memory_details_created: { en: 'Created', fr: 'Créé le' }, // [FR self-authored]
  memory_details_confirmed: { en: 'Confirmed', fr: 'Confirmé le' }, // [FR self-authored]
  memory_details_last_verified: { en: 'Last verified', fr: 'Dernière vérification' }, // [FR self-authored]
  memory_details_retention: { en: 'Retention category', fr: 'Catégorie de conservation' }, // [FR self-authored]
  memory_details_review_date: { en: 'Review date', fr: 'Date de révision' }, // [FR self-authored]
  memory_details_expiry_date: { en: 'Expiry date', fr: 'Date d’expiration' }, // [FR self-authored]
  memory_details_advisor_usable: { en: 'Advisor usable', fr: 'Accessible au Conseiller' }, // [FR self-authored]
  memory_details_legal_hold: { en: 'Legal hold', fr: 'Conservation pour litige' }, // [FR self-authored]
  memory_details_legal_hold_reason: { en: 'Hold reason', fr: 'Motif de la conservation' }, // [FR self-authored]
  memory_details_legal_hold_by: { en: 'Placed by', fr: 'Placée par' }, // [FR self-authored]
  memory_details_legal_hold_at: { en: 'Placed', fr: 'Placée le' }, // [FR self-authored]
  memory_details_activity: { en: 'Activity for this memory', fr: 'Activité pour cet élément' }, // [FR self-authored]
  memory_details_no_activity: { en: 'No activity recorded yet.', fr: 'Aucune activité enregistrée.' }, // [FR self-authored]
  memory_details_yes: { en: 'Yes', fr: 'Oui' },
  memory_details_no: { en: 'No', fr: 'Non' },

  memory_action_reject: { en: 'Reject', fr: 'Rejeter' }, // [FR self-authored]
  memory_action_remove: { en: 'Remove from Advisor memory', fr: 'Retirer de la mémoire du Conseiller' }, // [FR self-authored]
  memory_action_edit: { en: 'Edit', fr: 'Modifier' }, // [FR self-authored]
  memory_action_edit_confirm: { en: 'Edit & confirm', fr: 'Modifier et confirmer' }, // [FR self-authored]
  memory_action_review_source: { en: 'Review source', fr: 'Réviser la source' }, // [FR self-authored]
  memory_action_mark_review: { en: 'Mark for review', fr: 'Marquer à réviser' }, // [FR self-authored]
  memory_action_change_retention: { en: 'Change retention', fr: 'Modifier la conservation' }, // [FR self-authored]
  memory_action_add_hold: { en: 'Add legal hold', fr: 'Ajouter une conservation pour litige' }, // [FR self-authored]
  memory_action_remove_hold: { en: 'Remove legal hold', fr: 'Retirer la conservation pour litige' }, // [FR self-authored]
  memory_action_restore: { en: 'Restore', fr: 'Restaurer' }, // [FR self-authored]

  memory_review_title: { en: 'Review queue', fr: 'À réviser' },
  memory_review_empty: {
    en: 'Nothing waiting for review. Advisor proposals will appear here before they become memory.',
    fr: 'Rien à réviser. Les propositions du Conseiller apparaîtront ici avant de devenir des éléments mémorisés.',
  }, // [FR self-authored]
  memory_review_why: { en: 'Why Advisor proposed this', fr: 'Pourquoi le Conseiller l’a proposé' }, // [FR self-authored]
  memory_review_sensitive_warning: {
    en: 'This looks like sensitive information. It will not become active Advisor memory automatically — review whether it’s necessary to retain.',
    fr: 'Cela ressemble à des renseignements sensibles. Cela ne deviendra pas automatiquement une mémoire active du Conseiller — évaluez s’il est nécessaire de le conserver.',
  }, // [FR self-authored]
  memory_review_proposed_at: { en: 'Proposed', fr: 'Proposé le' }, // [FR self-authored]

  memory_activity_title: { en: 'Memory activity', fr: 'Activité de la mémoire' }, // [FR self-authored]
  memory_activity_empty: {
    en: 'No activity recorded yet.',
    fr: 'Aucune activité enregistrée pour l’instant.',
  }, // [FR self-authored]
  memory_activity_filter_all: { en: 'All events', fr: 'Tous les événements' }, // [FR self-authored]
  memory_activity_actor: { en: 'Actor', fr: 'Auteur' }, // [FR self-authored]
  memory_activity_event: { en: 'Event', fr: 'Événement' }, // [FR self-authored]
  memory_activity_when: { en: 'When', fr: 'Quand' }, // [FR self-authored]
  memory_activity_redacted: {
    en: 'Content withheld — restricted memory removed',
    fr: 'Contenu non conservé — élément restreint retiré',
  }, // [FR self-authored]
  memory_activity_note: {
    en: 'The audit log preserves accountability metadata. Content of removed restricted memories is not retained.',
    fr: 'Le journal d’audit conserve les métadonnées de responsabilité. Le contenu des éléments restreints retirés n’est pas conservé.',
  }, // [FR self-authored]

  memory_audit_created: { en: 'added a memory', fr: 'a ajouté un élément' }, // [FR self-authored]
  memory_audit_proposed: { en: 'proposed a memory', fr: 'a proposé un élément' }, // [FR self-authored]
  memory_audit_confirmed: { en: 'confirmed a memory', fr: 'a confirmé un élément' }, // [FR self-authored]
  memory_audit_rejected: { en: 'rejected a proposed memory', fr: 'a rejeté un élément proposé' }, // [FR self-authored]
  memory_audit_edited: { en: 'edited a memory', fr: 'a modifié un élément' }, // [FR self-authored]
  memory_audit_removed: { en: 'removed a memory from Advisor', fr: 'a retiré un élément du Conseiller' }, // [FR self-authored]
  memory_audit_restored: { en: 'restored a memory', fr: 'a restauré un élément' }, // [FR self-authored]
  memory_audit_expired: { en: 'a memory expired', fr: 'un élément a expiré' }, // [FR self-authored]
  memory_audit_exported: { en: 'exported memory data', fr: 'a exporté des données de mémoire' }, // [FR self-authored]
  memory_audit_legal_hold_added: {
    en: 'placed a legal hold',
    fr: 'a placé une conservation pour litige',
  }, // [FR self-authored]
  memory_audit_legal_hold_removed: {
    en: 'removed a legal hold',
    fr: 'a retiré une conservation pour litige',
  }, // [FR self-authored]
  memory_audit_review_requested: {
    en: 'marked a memory for review',
    fr: 'a marqué un élément à réviser',
  }, // [FR self-authored]
  memory_audit_memory_disabled: {
    en: 'disabled Advisor memory',
    fr: 'a désactivé la mémoire du Conseiller',
  }, // [FR self-authored]
  memory_audit_memory_enabled: {
    en: 'enabled Advisor memory',
    fr: 'a activé la mémoire du Conseiller',
  }, // [FR self-authored]

  memory_gov_status_title: { en: 'Advisor memory status', fr: 'État de la mémoire du Conseiller' }, // [FR self-authored]
  memory_gov_status_enable: { en: 'Enable Advisor memory', fr: 'Activer la mémoire du Conseiller' }, // [FR self-authored]
  memory_gov_status_disable: { en: 'Disable Advisor memory', fr: 'Désactiver la mémoire du Conseiller' }, // [FR self-authored]
  memory_gov_status_note: {
    en: 'Disabling stops new Advisor memory retrieval and automatic proposals. It does not delete records — existing memories are preserved subject to their retention rules.',
    fr: 'La désactivation interrompt la récupération de mémoire par le Conseiller et les propositions automatiques. Elle ne supprime pas les enregistrements — les éléments existants sont conservés selon leurs règles de conservation.',
  }, // [FR self-authored]
  memory_gov_privacy_title: {
    en: 'Privacy, purpose & consent',
    fr: 'Confidentialité, finalités et consentement',
  }, // [FR self-authored]
  memory_gov_privacy_note: {
    en: 'Dutiva helps your organization manage memory according to its configured jurisdiction, identified purposes, retention rules and access controls. Applicable requirements vary by organization and record type.',
    fr: 'Dutiva aide votre organisation à gérer la mémoire selon sa juridiction configurée, ses finalités identifiées, ses règles de conservation et ses contrôles d’accès. Les exigences applicables varient selon l’organisation et le type de registre.',
  }, // [FR self-authored]
  memory_gov_privacy_jurisdictions: {
    en: 'Identified jurisdictions',
    fr: 'Juridictions identifiées',
  }, // [FR self-authored]
  memory_gov_privacy_auto: {
    en: 'Automatic memory proposals',
    fr: 'Propositions automatiques de mémoire',
  }, // [FR self-authored]
  memory_gov_privacy_auto_note: {
    en: 'When on, Advisor may propose memories from conversations for your review. Proposals never become active memory until you confirm them.',
    fr: 'Lorsqu’activées, le Conseiller peut proposer des éléments à partir des conversations, à réviser. Les propositions ne deviennent jamais actives avant votre confirmation.',
  }, // [FR self-authored]
  memory_gov_privacy_restrict: {
    en: 'Keep restricted memories out of Advisor retrieval',
    fr: 'Garder les éléments restreints hors de la récupération du Conseiller',
  }, // [FR self-authored]
  memory_gov_privacy_rights: {
    en: 'Access, correction, retention and deletion requests are handled subject to applicable legal requirements and exceptions.',
    fr: 'Les demandes d’accès, de correction, de conservation et de suppression sont traitées sous réserve des exigences et exceptions légales applicables.',
  }, // [FR self-authored]

  memory_gov_retention_title: { en: 'Retention schedule', fr: 'Calendrier de conservation' }, // [FR self-authored]
  memory_gov_retention_rule: { en: 'Rule', fr: 'Règle' }, // [FR self-authored]
  memory_gov_retention_trigger: { en: 'Trigger', fr: 'Déclencheur' }, // [FR self-authored]
  memory_gov_retention_applicability: { en: 'Applicability', fr: 'Application' }, // [FR self-authored]
  memory_gov_retention_basis: { en: 'Basis', fr: 'Fondement' }, // [FR self-authored]
  memory_gov_retention_review: { en: 'Review required', fr: 'Révision requise' }, // [FR self-authored]
  memory_gov_retention_enabled: { en: 'Enabled', fr: 'Activé' }, // [FR self-authored]

  memory_gov_access_title: { en: 'Access controls', fr: 'Contrôles d’accès' }, // [FR self-authored]
  memory_gov_access_note: {
    en: 'Restricted memories (medical, accommodation, protected ground, investigation, harassment, disciplinary, compensation, financial, highly personal) are stored but not automatically available to Advisor. Access is role-based and need-to-know, with additional auditability.',
    fr: 'Les éléments restreints (médicaux, accommodement, motif protégé, enquête, harcèlement, disciplinaire, rémunération, financiers, hautement personnels) sont conservés mais non automatiquement accessibles au Conseiller. L’accès est basé sur les rôles et le besoin de connaître, avec une auditabilité accrue.',
  }, // [FR self-authored]

  memory_gov_data_title: { en: 'Data management', fr: 'Gestion des données' }, // [FR self-authored]
  memory_gov_data_export: { en: 'Export memory data', fr: 'Exporter les données de mémoire' }, // [FR self-authored]
  memory_gov_data_export_note: {
    en: 'Downloads the workspace memory record as JSON through the export-protection pipeline (velocity guard + audit trail). Suitable for administrative export today; a dedicated privacy/access-request package is a planned separation.',
    fr: 'Télécharge le registre de mémoire de l’espace en JSON via le pipeline de protection des exports (garde-vitesse et piste d’audit). Conçu pour l’export administratif aujourd’hui; un volet dédié pour les demandes d’accès et de confidentialité est une séparation prévue.',
  }, // [FR self-authored]
  memory_gov_data_remove_person: {
    en: 'Remove a person’s memories',
    fr: 'Supprimer les éléments mémorisés sur une personne',
  }, // [FR self-authored]
  memory_gov_data_remove_person_note: {
    en: 'Removes every active memory for one person from Advisor retrieval. Source records (People, Cases) are unchanged. Deletion of the underlying personal information may follow a broader lifecycle subject to retention and legal-hold rules.',
    fr: 'Retire tous les éléments actifs d’une personne de la récupération du Conseiller. Les dossiers sources (Personnel, Dossiers) restent inchangés. La suppression des renseignements personnels sous-jacents peut suivre un cycle de vie plus large, soumis aux règles de conservation et de conservation pour litige.',
  }, // [FR self-authored]
  memory_gov_data_remove_person_select: {
    en: 'Select a person…',
    fr: 'Sélectionnez une personne…',
  }, // [FR self-authored]
  memory_gov_data_remove_person_confirm_one: {
    en: 'Remove {count} memory for {name} from Advisor?',
    fr: 'Retirer {count} élément pour {name} du Conseiller?',
  }, // [FR self-authored]
  memory_gov_data_remove_person_confirm_many: {
    en: 'Remove {count} memories for {name} from Advisor?',
    fr: 'Retirer {count} éléments pour {name} du Conseiller?',
  }, // [FR self-authored]
  memory_gov_data_remove_person_done_one: {
    en: 'Removed {count} memory for {name} from Advisor.',
    fr: 'Retiré {count} élément pour {name} du Conseiller.',
  }, // [FR self-authored]
  memory_gov_data_remove_person_done_many: {
    en: 'Removed {count} memories for {name} from Advisor.',
    fr: 'Retiré {count} éléments pour {name} du Conseiller.',
  }, // [FR self-authored]
  memory_gov_data_remove_person_none: {
    en: 'No person-scoped memories to remove.',
    fr: 'Aucun élément lié à une personne à retirer.',
  }, // [FR self-authored]

  memory_gov_danger_title: { en: 'Danger zone', fr: 'Zone de danger' }, // [FR self-authored]
  memory_gov_danger_delete: { en: 'Delete memories', fr: 'Supprimer les éléments mémorisés' }, // [FR self-authored]
  memory_gov_danger_delete_note: {
    en: 'Deletion is a broader lifecycle action subject to retention and legal-hold rules. Removing from Advisor memory makes a record immediately unavailable to Advisor without deleting the stored information.',
    fr: 'La suppression est une action de cycle de vie plus large, soumise aux règles de conservation et de conservation pour litige. Retirer de la mémoire du Conseiller rend un enregistrement immédiatement indisponible au Conseiller sans supprimer les renseignements conservés.',
  }, // [FR self-authored]
  memory_gov_danger_delete_confirm: {
    en: 'Permanently delete all workspace memories? This cannot be undone from the UI.',
    fr: 'Supprimer définitivement tous les éléments de l’espace? Impossible d’annuler depuis l’interface.',
  }, // [FR self-authored]
  memory_gov_danger_delete_todo: {
    en: 'Full deletion (relational record, search index, vector embedding, derived summaries, cached Advisor context, and backup lifecycle) is not yet implemented. This action is disabled until the backend supports it.',
    fr: 'La suppression complète (registre relationnel, index de recherche, vecteur d’incorporation, résumés dérivés, contexte Conseiller en cache et cycle de vie des sauvegardes) n’est pas encore mise en œuvre. Cette action est désactivée jusqu’à ce que le système le permette.',
  }, // [FR self-authored]

  memory_add_title: { en: 'Add memory', fr: 'Ajouter un élément à la mémoire' }, // [FR self-authored]
  memory_add_subject: { en: 'Subject', fr: 'Sujet' }, // [FR self-authored]
  memory_add_person: { en: 'Person', fr: 'Personne' },
  memory_add_case: { en: 'Case', fr: 'Dossier' },
  memory_add_select_person: { en: 'Select a person…', fr: 'Sélectionner une personne…' },
  memory_add_select_case: { en: 'Select a case…', fr: 'Sélectionner un dossier…' }, // [FR self-authored]
  memory_add_text: { en: 'Memory text', fr: 'Texte de l’élément' }, // [FR self-authored]
  memory_add_text_fr: { en: 'Memory text (French)', fr: 'Texte de l’élément (français)' }, // [FR self-authored]
  memory_add_classification: { en: 'Classification', fr: 'Classification' }, // [FR self-authored]
  memory_add_sensitivity: { en: 'Sensitivity', fr: 'Sensibilité' }, // [FR self-authored]
  memory_add_source: { en: 'Source / provenance', fr: 'Source / provenance' }, // [FR self-authored]
  memory_add_purpose: { en: 'Purpose (optional)', fr: 'Finalité (facultatif)' }, // [FR self-authored]
  memory_add_retention: { en: 'Retention category', fr: 'Catégorie de conservation' }, // [FR self-authored]
  memory_add_advanced: { en: 'Advanced', fr: 'Avancé' }, // [FR self-authored]
  memory_add_sensitive_warning: {
    en: 'This may be sensitive personal information. Consider whether it’s necessary to retain, and whether it should be available to Advisor.',
    fr: 'Cela peut être des renseignements personnels sensibles. Évaluez s’il est nécessaire de les conserver et s’ils doivent être accessibles au Conseiller.',
  }, // [FR self-authored]
  memory_add_save: { en: 'Add memory', fr: 'Ajouter l’élément' }, // [FR self-authored]
  memory_add_cancel: { en: 'Cancel', fr: 'Annuler' },
  memory_add_toast: { en: 'Memory added.', fr: 'Élément ajouté.' }, // [FR self-authored]

  memory_confirm_remove_title: { en: 'Remove from Advisor memory', fr: 'Retirer de la mémoire du Conseiller' }, // [FR self-authored]
  memory_confirm_remove_body: {
    en: 'This makes the memory immediately unavailable to Advisor retrieval. The stored record is preserved subject to its retention rules.',
    fr: 'Cela rend l’élément immédiatement indisponible à la récupération du Conseiller. L’enregistrement conservé est préservé selon ses règles de conservation.',
  }, // [FR self-authored]
  memory_confirm_hold_title: { en: 'Add legal hold', fr: 'Ajouter une conservation pour litige' }, // [FR self-authored]
  memory_confirm_hold_reason: { en: 'Reason for hold', fr: 'Motif de la conservation' }, // [FR self-authored]
  memory_confirm_hold_body: {
    en: 'A legal hold pauses scheduled expiration and deletion for this memory.',
    fr: 'Une conservation pour litige suspend l’expiration et la suppression programmées pour cet élément.',
  }, // [FR self-authored]
  memory_confirm_reject_title: { en: 'Reject proposed memory', fr: 'Rejeter l’élément proposé' }, // [FR self-authored]
  memory_confirm_reject_body: {
    en: 'The proposed memory will be removed from the review queue and will not become Advisor memory.',
    fr: 'L’élément proposé sera retiré de la file de révision et ne deviendra pas une mémoire du Conseiller.',
  }, // [FR self-authored]
})
