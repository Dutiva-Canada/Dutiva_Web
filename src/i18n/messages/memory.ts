import { defineMessages } from '../core'

/**
 * Advisor Memory strings (`Advisor Memory.dc.html` — person, case, chat
 * recall, memory manager + governance rails). EN verbatim from the
 * prototype; FR [self-authored] (the prototype's FR toggle is decorative).
 */
export const memoryMessages = defineMessages({
  memory_title: { en: 'Advisor memory', fr: 'Mémoire du Conseiller' },
  memory_nav_aria: { en: 'Memory navigation', fr: 'Navigation de la mémoire' },
  memory_open_nav: {
    en: 'Open memory navigation',
    fr: 'Ouvrir la navigation mémoire',
  }, // [FR self-authored]
  memory_nav_memory: { en: 'Memory', fr: 'Mémoire' },
  memory_nav_manager: { en: 'Memory manager', fr: 'Gestionnaire de mémoire' },
  memory_nav_manager_sub: { en: 'Review · edit · forget', fr: 'Réviser · corriger · oublier' },
  memory_nav_people: { en: 'People', fr: 'Personnes' },
  memory_nav_cases: { en: 'Cases', fr: 'Dossiers' },
  memory_nav_conversations: { en: 'Conversations', fr: 'Conversations' },
  memory_state_on_title: { en: 'Memory is on', fr: 'La mémoire est activée' },
  memory_state_on_note: {
    en: 'Advisor carries context about people, conversations and cases — with full provenance.',
    fr: 'Le Conseiller conserve le contexte sur les personnes, les conversations et les dossiers — avec provenance complète.',
  },

  /* Fact rows (shared) */
  memory_confirmed: { en: 'Confirmed', fr: 'Confirmé' },
  memory_inferred: { en: 'Inferred', fr: 'Inféré' },
  memory_action_confirm: { en: 'Confirm', fr: 'Confirmer' },
  memory_action_correct: { en: 'Correct', fr: 'Corriger' },
  memory_action_forget: { en: 'Forget', fr: 'Oublier' },
  memory_action_save: { en: 'Save', fr: 'Enregistrer' },
  memory_action_cancel: { en: 'Cancel', fr: 'Annuler' },
  memory_learned: { en: 'Learned', fr: 'Appris' },
  memory_confirmed_on: { en: 'confirmed', fr: 'confirmé' },
  memory_not_confirmed: { en: 'not yet confirmed', fr: 'pas encore confirmé' },
  memory_vis_hr: { en: 'HR team', fr: 'Équipe RH' },
  memory_vis_case: { en: 'Case + counsel', fr: 'Dossier + conseiller juridique' },
  memory_vis_restricted: { en: 'Restricted', fr: 'Restreint' },
  memory_src_hris: { en: 'People record', fr: 'Dossier du personnel' },
  memory_src_document: { en: 'Document', fr: 'Document' },
  memory_src_chat: { en: 'Conversation', fr: 'Conversation' },
  memory_src_manual: { en: 'Manual entry', fr: 'Saisie manuelle' },
  memory_src_inference: { en: 'Advisor inference', fr: 'Inférence du Conseiller' },
  memory_src_case: { en: 'Case file', fr: 'Dossier' },
  memory_edit_label: { en: 'Correct this memory', fr: 'Corriger cette mémoire' },

  /* Person view */
  memory_person_sub: { en: 'People memory', fr: 'Mémoire des personnes' },
  memory_person_ask: { en: 'Ask Advisor about', fr: 'Demander au Conseiller à propos de' },
  memory_person_open_case: { en: 'Open case', fr: 'Ouvrir le dossier' },
  memory_review_case_memory: {
    en: 'Review case memory',
    fr: 'Réviser la mémoire du dossier',
  }, // [FR self-authored]
  memory_open_people_record: {
    en: 'Open people record',
    fr: 'Ouvrir le dossier du personnel',
  }, // [FR self-authored]
  memory_review_person_memory: {
    en: 'Review Advisor memory',
    fr: 'Réviser la mémoire du Conseiller',
  }, // [FR self-authored]
  memory_review_this_case_memory: {
    en: 'Case memory',
    fr: 'Mémoire du dossier',
  }, // [FR self-authored]
  memory_manage_from_answer: {
    en: 'Review in Memory',
    fr: 'Réviser dans Mémoire',
  }, // [FR self-authored]
  memory_person_remembers: {
    en: 'What Advisor remembers about',
    fr: 'Ce que le Conseiller retient à propos de',
  },
  memory_person_intro: {
    en: 'Built automatically from your conversations, documents and the people record — carried into every case and chat about this person. Everything here is yours to correct or forget.',
    fr: 'Construit automatiquement à partir de vos conversations, documents et du dossier du personnel — repris dans chaque dossier et clavardage concernant cette personne. Tout ici peut être corrigé ou oublié.',
  },
  memory_person_review_one: {
    en: 'item is inferred and waiting for your review.',
    fr: 'élément est inféré et attend votre révision.',
  },
  memory_person_review_many: {
    en: 'items are inferred and waiting for your review.',
    fr: 'éléments sont inférés et attendent votre révision.',
  },
  memory_cat_employment: { en: 'Employment', fr: 'Emploi' },
  memory_cat_compensation: { en: 'Compensation', fr: 'Rémunération' },
  memory_cat_matter: { en: 'Current matter', fr: 'Affaire en cours' },
  memory_cat_record: { en: 'Record', fr: 'Dossier' },
  memory_cat_note: { en: 'Note', fr: 'Note' },
  memory_cat_case: { en: 'Case', fr: 'Dossier' },
  memory_cat_conversation: { en: 'Conversation', fr: 'Conversation' },

  /* Person governance rail */
  memory_rail_confidence: { en: 'Confidence', fr: 'Confiance' },
  memory_rail_confirmed_note: {
    en: 'From an authoritative source — the people record, a document, or something you confirmed.',
    fr: 'Provient d’une source faisant autorité — le dossier du personnel, un document ou une confirmation de votre part.',
  },
  memory_rail_inferred_note: {
    en: 'Advisor worked this out from context. Shown separately until you confirm it.',
    fr: 'Le Conseiller l’a déduit du contexte. Affiché séparément jusqu’à votre confirmation.',
  },
  memory_rail_who: { en: 'Who can see this', fr: 'Qui peut voir ceci' },
  memory_rail_who_note: {
    en: 'This person’s memory is visible to your HR team. Case-sensitive items (like the termination analysis) are limited to case participants and counsel. Compensation is restricted.',
    fr: 'La mémoire de cette personne est visible par votre équipe RH. Les éléments liés au dossier (comme l’analyse de cessation) sont limités aux participants au dossier et au conseiller juridique. La rémunération est restreinte.',
  },
  memory_rail_retention: { en: 'Retention', fr: 'Conservation' },
  memory_rail_retention_employment: {
    en: 'Employment records — kept while employed, then 7 years.',
    fr: 'Dossiers d’emploi — conservés pendant l’emploi, puis 7 ans.',
  },
  memory_rail_retention_case: {
    en: 'Case memory — while the case is open, then 7 years.',
    fr: 'Mémoire de dossier — pendant que le dossier est ouvert, puis 7 ans.',
  },
  memory_rail_retention_thread: {
    en: 'Conversation memory — 24 months.',
    fr: 'Mémoire de conversation — 24 mois.',
  },
  memory_rail_retention_wellbeing: {
    en: 'Wellbeing & personal notes — 12 months, then auto-forgotten.',
    fr: 'Bien-être et notes personnelles — 12 mois, puis oubli automatique.',
  },
  memory_rail_lawful: { en: 'Lawful basis & rights', fr: 'Fondement licite et droits' },
  memory_rail_lawful_note: {
    en: 'Basis: managing the employment relationship (PIPEDA · Québec Law 25). The person can request access and correction. Forgetting a memory here honours a correction or erasure request — the underlying source is untouched.',
    fr: 'Fondement : la gestion de la relation d’emploi (LPRPDE · Loi 25 du Québec). La personne peut demander l’accès et la correction. Oublier une mémoire ici honore une demande de correction ou d’effacement — la source sous-jacente demeure intacte.',
  },
  memory_open_manager: { en: 'Open memory manager', fr: 'Ouvrir le gestionnaire de mémoire' },

  /* Case view */
  memory_case_sub: {
    en: 'Case memory · persists across sessions',
    fr: 'Mémoire de dossier · persiste entre les sessions',
  },
  memory_case_opened: { en: 'opened', fr: 'ouvert le' },
  memory_case_owner: { en: 'Owner', fr: 'Responsable' },
  memory_case_resume_title: {
    en: 'Picking up where you left off',
    fr: 'Reprendre là où vous étiez',
  },
  memory_case_resume_last: { en: 'You last worked on this', fr: 'Vous y avez travaillé le' },
  memory_case_resume_since: { en: 'Since then:', fr: 'Depuis :' },
  memory_case_resume_chat: { en: 'Resume in chat', fr: 'Reprendre en clavardage' },
  memory_case_view_history: { en: 'View full history', fr: 'Voir l’historique complet' },
  memory_case_summary_title: { en: 'Case memory', fr: 'Mémoire du dossier' },
  memory_case_summary_sub: {
    en: 'The running picture Advisor keeps between sessions',
    fr: 'Le portrait que le Conseiller conserve entre les sessions',
  },
  memory_case_changed: {
    en: 'What changed while you were away',
    fr: 'Ce qui a changé pendant votre absence',
  },
  memory_case_facts: {
    en: 'Facts Advisor is holding for this case',
    fr: 'Faits que le Conseiller retient pour ce dossier',
  },
  memory_case_timeline: { en: 'Memory timeline', fr: 'Chronologie de la mémoire' },
  memory_case_now: { en: 'Now', fr: 'Maintenant' },

  /* What-I-know rail */
  memory_know_title: { en: 'What I know', fr: 'Ce que je sais' },
  memory_know_sub_case: {
    en: 'Memory retrieved for this case',
    fr: 'Mémoire récupérée pour ce dossier',
  },
  memory_know_sub_chat: {
    en: 'Loaded into this conversation',
    fr: 'Chargé dans cette conversation',
  },
  memory_know_this_case: { en: 'This case', fr: 'Ce dossier' },
  memory_know_this_conversation: { en: 'This conversation', fr: 'Cette conversation' },
  memory_know_next_steps: { en: 'Next steps', fr: 'Prochaines étapes' },
  memory_know_not_turn_title: {
    en: 'Memory isn’t this turn’s analysis',
    fr: 'La mémoire n’est pas l’analyse du tour',
  },
  memory_know_not_turn_note: {
    en: 'Memory only supplies facts and context. The compliance read — risk, legal basis and citations — is recomputed fresh every turn and never carried forward from a past session.',
    fr: 'La mémoire ne fournit que des faits et du contexte. La lecture de conformité — risque, fondement juridique et citations — est recalculée à chaque tour et jamais reprise d’une session antérieure.',
  },
  memory_manage_this: { en: 'Manage this memory', fr: 'Gérer cette mémoire' },

  /* Chat recall view */
  memory_chat_sub: {
    en: 'Conversation · thread memory',
    fr: 'Conversation · mémoire de fil',
  },
  memory_chat_view: { en: 'View', fr: 'Voir' },
  memory_chat_from_earlier: {
    en: 'Remembering from earlier in this conversation',
    fr: 'Rappel d’un moment antérieur de cette conversation',
  },
  memory_chat_used_title: {
    en: 'Memory used in this answer',
    fr: 'Mémoire utilisée dans cette réponse',
  },
  memory_chat_remembered: { en: 'Remembered', fr: 'Retenu' },
  memory_chat_recall_sourced_title: {
    en: 'Recall is always sourced',
    fr: 'Le rappel est toujours sourcé',
  },
  memory_chat_recall_sourced_note: {
    en: 'Every fact Advisor recalls links back to where it came from and how sure it is — so you can correct it the moment it’s wrong.',
    fr: 'Chaque fait rappelé par le Conseiller renvoie à sa source et à son niveau de certitude — vous pouvez donc le corriger dès qu’il est erroné.',
  },

  /* Memory manager */
  memory_mgr_sub: {
    en: 'What Advisor remembers — review and correct it here.',
    fr: 'Ce que le Conseiller retient — révisez et corrigez-le ici.',
  },
  memory_mgr_review_waiting_one: {
    en: 'inferred memory is waiting for review',
    fr: 'mémoire inférée attend une révision',
  },
  memory_mgr_review_waiting_many: {
    en: 'inferred memories are waiting for review',
    fr: 'mémoires inférées attendent une révision',
  },
  memory_mgr_review_note: {
    en: 'Advisor worked these out from context. Confirm the ones that are right; forget the ones that aren’t. Inferred memory is never treated as fact until you confirm it.',
    fr: 'Le Conseiller les a déduites du contexte. Confirmez celles qui sont justes ; oubliez les autres. Une mémoire inférée n’est jamais traitée comme un fait avant votre confirmation.',
  },
  memory_mgr_review_now: { en: 'Review now', fr: 'Réviser maintenant' },
  memory_mgr_tab_all: { en: 'All', fr: 'Tout' },
  memory_mgr_tab_review: { en: 'Needs review', fr: 'À réviser' },
  memory_mgr_search: { en: 'Search memory…', fr: 'Rechercher dans la mémoire…' },
  memory_mgr_empty: { en: 'Nothing in this view.', fr: 'Rien dans cette vue.' },
  memory_mgr_scope_person: { en: 'Person', fr: 'Personne' },
  memory_mgr_scope_case: { en: 'Case', fr: 'Dossier' },
  memory_mgr_scope_thread: { en: 'Conversation', fr: 'Conversation' },
  memory_mgr_retention_title: { en: 'Retention policy', fr: 'Politique de conservation' },
  memory_mgr_lawful_title: { en: 'Lawful basis & consent', fr: 'Fondement licite et consentement' },
  memory_mgr_lawful_note: {
    en: 'Memory is processed to manage the employment relationship, under PIPEDA and Québec Law 25. Employees can request access, correction and erasure. Compensation and health-related items are access-controlled by default.',
    fr: 'La mémoire est traitée pour gérer la relation d’emploi, en vertu de la LPRPDE et de la Loi 25 du Québec. Les employés peuvent demander l’accès, la correction et l’effacement. Les éléments de rémunération et de santé sont à accès contrôlé par défaut.',
  },
  memory_mgr_audit_title: { en: 'Audit log', fr: 'Journal d’audit' },
  memory_mgr_audit_note: {
    en: 'Every add, edit and forget is recorded with who and when.',
    fr: 'Chaque ajout, correction et oubli est consigné avec l’auteur et le moment.',
  },
  memory_mgr_audit_seed_resume: {
    en: 'Today 09:14 — Riley resumed CASE-2026-0142; 8 memories loaded.',
    fr: 'Aujourd’hui 09:14 — Riley a repris CASE-2026-0142 ; 8 mémoires chargées.',
  },
  memory_mgr_audit_seed_added: {
    en: 'Jul 5 14:52 — Advisor added “notice estimate 9–12 mo” (inferred).',
    fr: '5 juill. 14:52 — Le Conseiller a ajouté « estimation du préavis 9–12 mois » (inféré).',
  },
  memory_mgr_audit_confirm: { en: 'confirmed', fr: 'a confirmé' },
  memory_mgr_audit_correct: { en: 'corrected', fr: 'a corrigé' },
  memory_mgr_audit_forget: { en: 'forgot', fr: 'a oublié' },
  memory_mgr_audit_today: { en: 'Today', fr: 'Aujourd’hui' },
  memory_mgr_export: { en: 'Export memory record', fr: 'Exporter le registre de mémoire' },
  /* Document title stamped on the exported JSON (filename + audit trail). */
  memory_mgr_export_title: {
    en: 'Advisor memory record',
    fr: 'Registre de mémoire du Conseiller',
  }, // FR self-authored
  memory_mgr_export_toast: {
    en: 'Memory record exported.',
    fr: 'Registre de mémoire exporté.',
  },
  memory_mgr_forget_person: {
    en: 'Forget everything for a person',
    fr: 'Tout oublier pour une personne',
  },
  memory_mgr_forget_person_toast: {
    en: 'Bulk erasure runs through the governance backend — forget individual memories here.',
    fr: 'L’effacement en bloc passe par le système de gouvernance — oubliez les mémoires individuellement ici.',
  },
  memory_prod_forget_person_hint: {
    en: 'Soft-forgets every active memory fact for that person and writes an audit entry for each. Source records (People, Cases) are unchanged.',
    fr: 'Oublie en douceur chaque fait de mémoire actif pour cette personne et écrit une entrée d’audit pour chacun. Les dossiers sources (Personnel, Dossiers) restent inchangés.',
  }, // FR self-authored
  memory_prod_forget_person_select: {
    en: 'Select a person…',
    fr: 'Sélectionnez une personne…',
  }, // FR self-authored
  memory_prod_forget_person_confirm: {
    en: 'Forget all memory for this person? This cannot be undone from the UI.',
    fr: 'Oublier toute la mémoire pour cette personne? Impossible d’annuler depuis l’interface.',
  }, // FR self-authored
  memory_prod_forget_person_none: {
    en: 'No person-scoped memories to erase.',
    fr: 'Aucune mémoire liée à une personne à effacer.',
  }, // FR self-authored

  /* Production mode (migration 0086) — [FR self-authored] */
  memory_prod_empty_title: {
    en: 'No Advisor memory yet',
    fr: 'Aucune mémoire du Conseiller pour l’instant',
  },
  memory_prod_empty_body: {
    en: 'Confirmed and inferred facts for people, cases, and conversations will appear here. Add a fact manually, or confirm ones Advisor records later.',
    fr: 'Les faits confirmés et inférés pour les personnes, dossiers et conversations apparaîtront ici. Ajoutez un fait manuellement, ou confirmez ceux que le Conseiller enregistrera plus tard.',
  },
  memory_prod_load_failed: {
    en: 'Could not load memory. Try again.',
    fr: 'Impossible de charger la mémoire. Réessayez.',
  },
  memory_injection_upgrade: {
    en: 'You can review and edit memory here. Cross-record injection into Advisor unlocks on Growth — nothing is deleted.',
    fr: 'Vous pouvez consulter et modifier la mémoire ici. L’injection transversale dans le Conseiller se débloque avec Croissance — rien n’est supprimé.', // [FR self-authored]
  },
  memory_prod_action_failed: {
    en: 'Could not update that memory.',
    fr: 'Impossible de mettre à jour cette mémoire.',
  },
  memory_prod_added: { en: 'Memory fact added.', fr: 'Fait de mémoire ajouté.' },
  memory_prod_add: { en: 'Add memory fact', fr: 'Ajouter un fait de mémoire' },
  memory_prod_statement_en: { en: 'Statement (English)', fr: 'Énoncé (anglais)' },
  memory_prod_statement_fr: { en: 'Statement (French)', fr: 'Énoncé (français)' },
  memory_prod_category: { en: 'Category', fr: 'Catégorie' },
  memory_prod_person: { en: 'Person', fr: 'Personne' },
  memory_prod_select_person: { en: 'Select a person…', fr: 'Sélectionner une personne…' },
  memory_prod_save_fact: { en: 'Save fact', fr: 'Enregistrer le fait' },
  memory_prod_no_people: {
    en: 'Add employees first — person memory links to your roster.',
    fr: 'Ajoutez d’abord des employés — la mémoire des personnes est liée au registre.',
  },
  memory_prod_person_empty: {
    en: 'No memory facts for this person yet.',
    fr: 'Aucun fait de mémoire pour cette personne pour l’instant.',
  },
  memory_prod_case_empty: {
    en: 'No memory facts for this case yet.',
    fr: 'Aucun fait de mémoire pour ce dossier pour l’instant.',
  },
  memory_prod_thread_empty: {
    en: 'No memory facts for this conversation yet.',
    fr: 'Aucun fait de mémoire pour cette conversation pour l’instant.',
  },
  memory_prod_narrative_note: {
    en: 'Resume summary and timeline below are org-scoped and auditable. Facts for this case appear in the list.',
    fr: 'Le résumé de reprise et la chronologie ci-dessous sont liés à l’organisation et auditables. Les faits de ce dossier apparaissent dans la liste.',
  }, // FR self-authored
  memory_prod_narrative_empty: {
    en: 'No resume summary yet. Add one to capture what Advisor should remember about this case between sessions.',
    fr: 'Aucun résumé de reprise pour l’instant. Ajoutez-en un pour consigner ce que le Conseiller doit retenir entre les séances.',
  },
  memory_prod_timeline_empty: {
    en: 'No timeline events yet.',
    fr: 'Aucun événement de chronologie pour l’instant.',
  },
  memory_prod_edit_narrative: {
    en: 'Edit resume summary',
    fr: 'Modifier le résumé de reprise',
  },
  memory_prod_save_narrative: {
    en: 'Save resume summary',
    fr: 'Enregistrer le résumé de reprise',
  },
  memory_prod_narrative_saved: {
    en: 'Case resume summary saved.',
    fr: 'Résumé de reprise du dossier enregistré.',
  },
  memory_prod_summary_en: { en: 'Summary (English)', fr: 'Résumé (anglais)' },
  memory_prod_summary_fr: { en: 'Summary (French)', fr: 'Résumé (français)' },
  memory_prod_resume_since_en: {
    en: 'What changed since last session',
    fr: 'Ce qui a changé depuis la dernière séance',
  },
  memory_prod_changed_lines: {
    en: 'What changed (one line per item)',
    fr: 'Ce qui a changé (une ligne par élément)',
  },
  memory_prod_next_steps_lines: {
    en: 'Next steps (one line per item)',
    fr: 'Prochaines étapes (une ligne par élément)',
  },
  memory_prod_transcript_note: {
    en: 'When this thread id matches one of your Advisor conversations, the transcript appears below. Gold in-answer memory highlights stay demo-only.',
    fr: 'Lorsque cet identifiant correspond à une de vos conversations avec le Conseiller, la transcription apparaît ci-dessous. Les surlignages or de mémoire dans les réponses restent en démo.',
  },
  memory_prod_transcript_title: {
    en: 'Conversation transcript',
    fr: 'Transcription de la conversation',
  },
  memory_prod_thread_facts: {
    en: 'Memory facts for this conversation',
    fr: 'Faits de mémoire pour cette conversation',
  },
  memory_prod_open_advisor: { en: 'Open Advisor', fr: 'Ouvrir le Conseiller' },
  memory_prod_audit_empty: {
    en: 'No audit entries yet.',
    fr: 'Aucune entrée d’audit pour l’instant.',
  },
  memory_prod_cat_employment: { en: 'Employment', fr: 'Emploi' },
  memory_prod_cat_compensation: { en: 'Compensation', fr: 'Rémunération' },
  memory_prod_cat_matter: { en: 'Current matter', fr: 'Affaire en cours' },
  memory_prod_cat_record: { en: 'Record', fr: 'Dossier' },
  memory_prod_cat_note: { en: 'Note', fr: 'Note' },
  memory_prod_cat_case: { en: 'Case', fr: 'Dossier' },
  memory_prod_cat_conversation: { en: 'Conversation', fr: 'Conversation' },
})
