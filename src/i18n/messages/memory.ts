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
  memory_toast_fact_recorded: {
    en: 'Advisor saved a memory fact for review.',
    fr: 'Le Conseiller a enregistré un fait mémoire à réviser.',
  }, // [FR self-authored]
  memory_settings_open_title: {
    en: 'Advisor memory',
    fr: 'Mémoire du Conseiller',
  }, // [FR self-authored]
  memory_settings_open_note: {
    en: 'Review, correct, or forget facts Advisor carries about people, cases, and conversations.',
    fr: 'Réviser, corriger ou oublier les faits que le Conseiller retient sur les personnes, dossiers et conversations.',
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
  memory_prod_loading: { en: 'Loading memory…', fr: 'Chargement de la mémoire…' }, // [FR self-authored]
  memory_prod_retry: { en: 'Retry', fr: 'Réessayer' }, // [FR self-authored]
  memory_prod_error: { en: 'Could not update that memory.', fr: 'Impossible de mettre à jour cet élément.' }, // [FR self-authored]
  memory_prod_empty: {
    en: 'No memories yet. Add one, or confirm ones Advisor records later.',
    fr: 'Aucun élément pour l’instant. Ajoutez-en un, ou confirmez ceux que le Conseiller enregistrera plus tard.',
  }, // [FR self-authored]
  memory_prod_plan_lock: {
    en: 'Cross-record memory injection unlocks on Growth.',
    fr: 'L’injection transversale de mémoire se débloque avec Croissance.',
  }, // [FR self-authored]
  memory_prod_gov_frontend_only: {
    en: 'This setting is a frontend control for this session. The production backend (migration 0086) does not yet persist it — a future migration will add the column.',
    fr: 'Ce réglage est un contrôle d’interface pour cette session. Le système de production (migration 0086) ne le conserve pas encore — une migration future ajoutera la colonne.',
  }, // [FR self-authored]
  memory_prod_retention_note: {
    en: 'Retention schedules are configurable per organization. The production backend (migration 0086) does not yet persist a retention schedule or per-record retention metadata — configure retention policy in your workspace settings until the migration lands.',
    fr: 'Les calendriers de conservation sont configurables par organisation. Le système de production (migration 0086) ne conserve pas encore un calendrier de conservation ni les métadonnées de conservation par registre — configurez la politique de conservation dans les réglages de votre espace jusqu’à la migration.',
  }, // [FR self-authored]
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

  /* ---- New Advisor Memory workspace (four tabs) ---- */

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
