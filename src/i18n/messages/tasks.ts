import { defineMessages } from '../core'

/**
 * Tasks view — UI-chrome strings ported from `App v2.dc.html`
 * (`buildTasksView()` inline `L(en, fr)` pairs + `buildI18n()` tasks_empty*).
 * FR strings with no source in the prototype are marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(tasksMessages.key)`.
 */
export const tasksMessages = defineMessages({
  /* Header count — "{n} open" (buildTasksView openLabel). */
  tasks_open_label: { en: 'open', fr: 'ouvertes' },

  /* Row meta line (buildTasksView ownerLbl / linkedLbl). */
  tasks_owner: { en: 'Owner', fr: 'Responsable' },
  tasks_linked_prefix: { en: 'Linked: ', fr: 'Lié : ' },

  /* Status chip (buildTasksView statusLabel). */
  tasks_status_done: { en: 'Done', fr: 'Terminé' },
  tasks_status_blocked: { en: 'Blocked', fr: 'Bloqué' },
  tasks_status_open: { en: 'Open', fr: 'Ouvert' },

  /* Empty state (buildI18n tasks_empty / tasks_empty_sub). */
  tasks_empty: { en: 'You’re all caught up.', fr: 'Vous êtes à jour.' },
  tasks_empty_sub: {
    en: 'New tasks from Advisor will appear here.',
    fr: 'Les nouvelles tâches du Conseiller apparaîtront ici.',
  },

  /* A11y labels (prototype markup aria-labels; EN verbatim). */
  tasks_toggle_aria: {
    en: 'Toggle task done',
    fr: 'Basculer l’état de la tâche', // [FR self-authored]
  },
  tasks_open_detail_aria: {
    en: 'Open task details for {title}',
    fr: 'Ouvrir les détails de la tâche pour {title}', // [FR self-authored]
  },

  /* ── Task detail view (/planning/tasks/:id) — no design-handoff counterpart;
     [FR self-authored] throughout ─────────────────────────────────────────── */
  tasks_detail_back: { en: 'Tasks', fr: 'Tâches' },
  tasks_detail_not_found: {
    en: 'This task isn’t in the list anymore.',
    fr: 'Cette tâche n’est plus dans la liste.',
  },
  tasks_detail_plan_title: { en: 'Advisor plan', fr: 'Plan du Conseiller' },
  tasks_detail_plan_empty: {
    en: 'No plan on this task yet.',
    fr: 'Aucun plan sur cette tâche pour l’instant.',
  },
  tasks_detail_generate: {
    en: 'Draft a plan with Advisor',
    fr: 'Rédiger un plan avec le Conseiller',
  },
  tasks_detail_regenerate: { en: 'Draft again', fr: 'Rédiger à nouveau' },
  tasks_detail_generating: { en: 'Drafting…', fr: 'Rédaction…' },
  tasks_detail_generate_failed: {
    en: 'Couldn’t draft the plan. Try again.',
    fr: 'Impossible de rédiger le plan. Réessayez.',
  },
  /* Sent to advisor-chat when the detail page drafts a plan. {title} is the
     task title. */
  tasks_detail_generate_prompt: {
    en: 'Draft a practical work plan for this task: "{title}". Give the steps, what to check, and what done looks like — under 200 words.',
    fr: 'Rédigez un plan de travail pratique pour cette tâche : « {title} ». Donnez les étapes, ce qu’il faut vérifier et le critère de fin — moins de 200 mots.',
  },
  tasks_detail_notes_title: { en: 'Notes', fr: 'Notes' },
  tasks_detail_notes_empty: {
    en: 'No notes yet — context you add here stays with the task.',
    fr: 'Aucune note pour l’instant — le contexte ajouté ici reste avec la tâche.',
  },
  tasks_detail_note_placeholder: { en: 'Add a note…', fr: 'Ajouter une note…' },
  tasks_detail_note_add: { en: 'Add note', fr: 'Ajouter la note' },
  tasks_detail_note_failed: {
    en: 'Couldn’t save the note.',
    fr: 'Impossible d’enregistrer la note.',
  },
  tasks_detail_linked_chat: {
    en: 'Open linked conversation',
    fr: 'Ouvrir la conversation liée',
  },
  tasks_detail_mark_done: { en: 'Mark done', fr: 'Marquer comme terminée' },
  tasks_detail_reopen: { en: 'Reopen', fr: 'Rouvrir' },
  tasks_detail_load_failed: {
    en: 'Couldn’t load the task.',
    fr: 'Impossible de charger la tâche.',
  },

  /* ── Production tasks (real persistence — no design-handoff counterpart;
     [FR self-authored] throughout) ───────────────────────────────────────── */
  tasks_prod_add: { en: 'Add task', fr: 'Ajouter une tâche' },
  tasks_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  tasks_prod_title_label: { en: 'Task', fr: 'Tâche' },
  tasks_prod_priority: { en: 'Priority', fr: 'Priorité' },
  tasks_prod_due: { en: 'Due date', fr: 'Échéance' },
  tasks_prod_save: { en: 'Save task', fr: 'Enregistrer la tâche' },
  tasks_prod_count_open: { en: 'open', fr: 'ouvertes' },
  tasks_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  tasks_prod_empty_title: { en: 'No tasks yet', fr: 'Aucune tâche pour l’instant' },
  tasks_prod_empty_body: {
    en: 'Add your first task to start tracking real work.',
    fr: 'Ajoutez votre première tâche pour commencer à suivre le travail réel.',
  },
  tasks_prod_error: { en: 'Couldn’t load tasks.', fr: 'Impossible de charger les tâches.' },
  tasks_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  tasks_prod_added: { en: 'Task added', fr: 'Tâche ajoutée' },
  tasks_prod_add_failed: {
    en: 'Couldn’t add the task. Try again.',
    fr: 'Impossible d’ajouter la tâche. Réessayez.',
  },
  tasks_prod_remove: { en: 'Remove', fr: 'Retirer' },
  tasks_prod_removed: { en: 'Task removed', fr: 'Tâche retirée' },
  tasks_prod_remove_failed: {
    en: 'Couldn’t remove the task.',
    fr: 'Impossible de retirer la tâche.',
  },
  tasks_prod_toggle_failed: {
    en: 'Couldn’t update the task.',
    fr: 'Impossible de mettre à jour la tâche.',
  },
  tasks_prod_priority_low: { en: 'Low', fr: 'Faible' },
  tasks_prod_priority_medium: { en: 'Medium', fr: 'Moyenne' },
  tasks_prod_priority_high: { en: 'High', fr: 'Élevée' },
  tasks_prod_priority_critical: { en: 'Critical', fr: 'Critique' },
})
