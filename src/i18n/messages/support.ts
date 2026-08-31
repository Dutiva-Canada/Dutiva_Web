import { defineMessages } from '../core'

/**
 * Reusable support prose shared across the public support page, Help Centre,
 * request form, automated acknowledgements, and email templates. Category /
 * status / priority *labels* live as `Bi` pairs in `src/config/support.ts`
 * (rendered with `x()`); this module holds the longer approved copy. Keep the
 * approved policy and sensitive-information wording verbatim — it is reviewed
 * legal/CX text (EN Canadian spelling, professional Québec French).
 */
export const supportMessages = defineMessages({
  support_digital_first: {
    en: 'Digital-first customer support, with phone or video assistance arranged when necessary.',
    fr: 'Soutien à la clientèle d’abord numérique, avec une assistance téléphonique ou vidéo organisée au besoin.',
  },
  /* Approved public support-policy statement (verbatim). */
  support_policy_statement: {
    en: 'Dutiva provides customer support through our Help Centre, secure support requests and email. General inbound telephone support is not currently available. Where an issue cannot reasonably be resolved through digital support—including certain accessibility, security, account-recovery or exceptional service matters—we may arrange a telephone or video appointment.',
    fr: 'Dutiva offre du soutien à la clientèle par l’intermédiaire de son centre d’aide, de demandes de soutien sécurisées et du courriel. Le soutien téléphonique entrant général n’est pas offert pour le moment. Lorsqu’une situation ne peut raisonnablement être réglée au moyen du soutien numérique, notamment certaines questions liées à l’accessibilité, à la sécurité, à la récupération d’un compte ou à une situation de service exceptionnelle, nous pouvons organiser un rendez-vous téléphonique ou vidéo.',
  },
  /* Approved sensitive-information warning (verbatim) — shown near the
     description and attachment fields, not only linked in a policy. */
  support_sensitive_warning: {
    en: 'Do not include unnecessary employee personal information, medical information, investigation evidence or other confidential workplace records. Dutiva will provide secure instructions if additional information is required.',
    fr: 'N’incluez pas inutilement de renseignements personnels sur des employés, de renseignements médicaux, de preuves liées à une enquête ou d’autres dossiers confidentiels du milieu de travail. Dutiva fournira des instructions sécurisées si des renseignements supplémentaires sont nécessaires.',
  },
  support_targets_note: {
    en: 'These are initial-response targets, not guaranteed resolution times. Business days exclude weekends and Ontario statutory holidays. Priority may be reassessed after review, and privacy and security incidents may follow separate procedures. You may submit a request at any time; Dutiva does not currently offer continuously staffed 24/7 support.',
    fr: 'Il s’agit de cibles de première réponse, et non de délais de résolution garantis. Les jours ouvrables excluent les fins de semaine et les jours fériés légaux de l’Ontario. La priorité peut être réévaluée après examen, et les incidents de confidentialité et de sécurité peuvent suivre des procédures distinctes. Vous pouvez soumettre une demande en tout temps ; Dutiva n’offre pas pour le moment de soutien continu 24 heures sur 24, 7 jours sur 7.',
  },
  support_diagnostic_notice: {
    en: 'To help us respond faster, this request attaches limited technical context: your account and workspace identifiers, plan, current page, app version, browser and operating system, language, and a recent non-sensitive error code. It never includes employee records, document contents, HR case details, passwords or authentication tokens. You can review and remove the optional diagnostic details before submitting.',
    fr: 'Pour nous aider à répondre plus rapidement, cette demande joint un contexte technique limité : vos identifiants de compte et d’espace de travail, votre forfait, la page actuelle, la version de l’application, le navigateur et le système d’exploitation, la langue et un code d’erreur récent non sensible. Elle n’inclut jamais de dossiers d’employés, de contenu de documents, de détails de dossiers RH, de mots de passe ni de jetons d’authentification. Vous pouvez examiner et retirer les détails de diagnostic facultatifs avant de soumettre.',
  },
  support_ack_resolution_varies: {
    en: 'Resolution time varies with the complexity of the request. We will reply to this ticket in writing; please add any further details to the ticket rather than starting a new one.',
    fr: 'Le délai de résolution varie selon la complexité de la demande. Nous répondrons à ce billet par écrit ; veuillez ajouter tout renseignement supplémentaire au billet plutôt que d’en ouvrir un nouveau.',
  },
  support_ack_no_secrets: {
    en: 'Please do not send passwords, authentication codes, or confidential workplace records by email. Dutiva will provide secure instructions if we need additional information.',
    fr: 'Veuillez ne pas envoyer de mots de passe, de codes d’authentification ni de dossiers confidentiels du milieu de travail par courriel. Dutiva vous fournira des instructions sécurisées si nous avons besoin de renseignements supplémentaires.',
  },
  support_call_not_guaranteed: {
    en: 'Scheduled calls are arranged only where digital support cannot reasonably resolve the issue, and are not guaranteed. The written ticket remains the record of your request.',
    fr: 'Les appels planifiés sont organisés uniquement lorsque le soutien numérique ne peut raisonnablement régler la situation, et ne sont pas garantis. Le billet écrit demeure le dossier de votre demande.',
  },

  /* ── Public (unauthenticated) contact page + form ─────────────────────── */
  support_contact_eyebrow: { en: 'Contact', fr: 'Contact' },
  support_contact_h1: { en: 'Contact Dutiva support', fr: 'Contacter le soutien Dutiva' },
  support_contact_intro: {
    en: 'Send a support request — no account needed. We reply in writing. For account or billing help, sign in and use the in-app form. Check the Help Centre first; most questions are answered there.',
    fr: 'Envoyez une demande de soutien — aucun compte requis. Nous répondons par écrit. Pour l’aide liée au compte ou à la facturation, connectez-vous et utilisez le formulaire dans l’application. Consultez d’abord le centre d’aide — la plupart des questions y trouvent réponse.',
  },
  support_field_email: { en: 'Your email', fr: 'Votre courriel' },
  support_field_email_hint: {
    en: 'We reply to this address. Please don’t share confidential workplace records here.',
    fr: 'Nous répondons à cette adresse. Veuillez ne pas partager de dossiers confidentiels du milieu de travail ici.',
  },
  support_public_account_note: {
    en: 'Locked out or have a billing question? Those need a signed-in account.',
    fr: 'Bloqué ou une question de facturation ? Cela nécessite un compte connecté.',
  },
  support_public_account_link: { en: 'Sign in', fr: 'Se connecter' },
  support_public_success_body: {
    en: 'Your request has been logged. Keep this reference for your records — we’ll reply by email.',
    fr: 'Votre demande a été enregistrée. Conservez cette référence — nous répondrons par courriel.',
  },
  support_err_email: {
    en: 'Please enter a valid email address.',
    fr: 'Veuillez saisir une adresse courriel valide.',
  },
  support_err_rate_limited: {
    en: 'You’ve sent several requests recently. Please try again later, or email support@dutiva.ca.',
    fr: 'Vous avez envoyé plusieurs demandes récemment. Veuillez réessayer plus tard ou écrire à support@dutiva.ca.',
  },

  /* ── Human check (public intake only) ─────────────────────────────────── */
  support_captcha_hint: {
    en: 'This quick check confirms you’re a person. It runs automatically in most cases.',
    fr: 'Cette vérification rapide confirme que vous êtes une personne. Elle s’exécute automatiquement dans la plupart des cas.',
  },
  support_captcha_unavailable: {
    en: 'The human-verification check could not load. Please refresh the page, or email support@dutiva.ca if it keeps happening.',
    fr: 'La vérification humaine n’a pas pu se charger. Veuillez actualiser la page ou écrire à support@dutiva.ca si le problème persiste.',
  },
  support_err_captcha_required: {
    en: 'Please complete the human-verification check before sending.',
    fr: 'Veuillez effectuer la vérification humaine avant d’envoyer.',
  },
  support_err_captcha_failed: {
    en: 'The human-verification check didn’t pass. Please try it again, or email support@dutiva.ca.',
    fr: 'La vérification humaine n’a pas réussi. Veuillez réessayer ou écrire à support@dutiva.ca.',
  },

  /* ── Support request form ─────────────────────────────────────────────── */
  support_form_title: { en: 'Contact support', fr: 'Contacter le soutien' },
  support_form_intro: {
    en: 'Send us a support request and we’ll reply in writing. Check the Help Centre first — most questions are answered there.',
    fr: 'Envoyez-nous une demande de soutien et nous répondrons par écrit. Consultez d’abord le centre d’aide — la plupart des questions y trouvent réponse.',
  },
  support_field_category: { en: 'What is this about?', fr: 'De quoi s’agit-il ?' },
  support_field_subject: { en: 'Subject', fr: 'Sujet' },
  support_field_description: { en: 'How can we help?', fr: 'Comment pouvons-nous vous aider ?' },
  support_field_impact: {
    en: 'How much is this affecting you?',
    fr: 'Quelle est l’ampleur de l’impact ?',
  },
  support_field_urgency: { en: 'How time-sensitive is it?', fr: 'Quel est le degré d’urgence ?' },
  support_field_language: {
    en: 'Preferred language for our reply',
    fr: 'Langue préférée pour notre réponse',
  },
  support_field_response_method: {
    en: 'Preferred way to hear back',
    fr: 'Moyen préféré pour la réponse',
  },
  support_choose: { en: 'Select…', fr: 'Sélectionner…' },
  support_optional: { en: 'optional', fr: 'facultatif' },

  support_cond_account_signin: {
    en: 'Can you still sign in to your account?',
    fr: 'Pouvez-vous encore vous connecter à votre compte ?',
  },
  support_cond_account_yes: { en: 'Yes, I can sign in', fr: 'Oui, je peux me connecter' },
  support_cond_account_no: { en: 'No, I’m locked out', fr: 'Non, je suis bloqué' },
  support_cond_billing_ref: {
    en: 'Invoice or subscription reference',
    fr: 'Référence de facture ou d’abonnement',
  },
  support_cond_accessibility: {
    en: 'What communication accommodation would help?',
    fr: 'Quelle mesure d’adaptation de communication vous aiderait ?',
  },
  support_security_warning: {
    en: 'Reporting a security concern? Give a factual description, the affected URL or feature, and safe reproduction steps. Do not access other customers’ data, disrupt the service, or include exploit details. There is no bug bounty.',
    fr: 'Vous signalez une préoccupation de sécurité ? Donnez une description factuelle, l’URL ou la fonctionnalité touchée et des étapes de reproduction sûres. N’accédez pas aux données d’autres clients, ne perturbez pas le service et n’incluez pas de détails d’exploitation. Il n’y a pas de prime aux bogues.',
  },
  support_privacy_notice: {
    en: 'Privacy requests are handled separately from ordinary support. Identity verification may be required. Do not attach identity documents here.',
    fr: 'Les demandes de confidentialité sont traitées séparément du soutien ordinaire. Une vérification d’identité peut être exigée. Ne joignez pas de pièces d’identité ici.',
  },

  support_diagnostics_title: { en: 'Technical details attached', fr: 'Détails techniques joints' },
  support_diagnostics_toggle: {
    en: 'Attach these technical details to help us respond faster',
    fr: 'Joindre ces détails techniques pour nous aider à répondre plus rapidement',
  },
  support_consent: {
    en: 'I understand Dutiva will use this request to respond to me, and I haven’t included unnecessary confidential workplace records.',
    fr: 'Je comprends que Dutiva utilisera cette demande pour me répondre, et je n’ai pas inclus de dossiers confidentiels du milieu de travail inutiles.',
  },
  support_submit: { en: 'Send request', fr: 'Envoyer la demande' },
  support_submitting: { en: 'Sending…', fr: 'Envoi en cours…' },

  support_err_subject: { en: 'Please add a subject.', fr: 'Veuillez ajouter un sujet.' },
  support_err_description: {
    en: 'Please describe how we can help.',
    fr: 'Veuillez décrire comment nous pouvons aider.',
  },
  support_err_consent: {
    en: 'Please confirm to continue.',
    fr: 'Veuillez confirmer pour continuer.',
  },
  support_err_generic: {
    en: 'We couldn’t send your request. Please try again, or email support@dutiva.ca.',
    fr: 'Nous n’avons pas pu envoyer votre demande. Veuillez réessayer ou écrire à support@dutiva.ca.',
  },

  support_success_title: { en: 'Request received', fr: 'Demande reçue' },
  support_success_body: {
    en: 'Your request has been logged. Keep this reference for your records — we’ll reply in writing to the email on your account.',
    fr: 'Votre demande a été enregistrée. Conservez cette référence — nous répondrons par écrit au courriel de votre compte.',
  },
  support_success_reference: { en: 'Reference', fr: 'Référence' },
  support_success_new: { en: 'Send another request', fr: 'Envoyer une autre demande' },

  /* ── My requests / ticket thread ──────────────────────────────────────── */
  support_new_request: { en: 'New request', fr: 'Nouvelle demande' },
  support_my_requests: { en: 'My requests', fr: 'Mes demandes' },
  support_requests_loading: { en: 'Loading your requests…', fr: 'Chargement de vos demandes…' },
  support_requests_error: {
    en: 'We couldn’t load your requests. Please try again.',
    fr: 'Nous n’avons pas pu charger vos demandes. Veuillez réessayer.',
  },
  support_requests_empty: {
    en: 'You haven’t sent any support requests yet.',
    fr: 'Vous n’avez pas encore envoyé de demande de soutien.',
  },
  support_requests_empty_cta: {
    en: 'Send your first request',
    fr: 'Envoyer votre première demande',
  },
  support_open_request: { en: 'Open request', fr: 'Ouvrir la demande' },
  support_back_to_requests: { en: 'Back to my requests', fr: 'Retour à mes demandes' },
  support_submitted_on: { en: 'Submitted', fr: 'Soumise le' },
  support_status_label: { en: 'Status', fr: 'Statut' },
  support_ticket_not_found: {
    en: 'This request could not be found.',
    fr: 'Cette demande est introuvable.',
  },
  support_author_you: { en: 'You', fr: 'Vous' },
  support_author_dutiva: { en: 'Dutiva support', fr: 'Soutien Dutiva' },
  support_author_system: { en: 'System', fr: 'Système' },
  support_reply_label: { en: 'Add a reply', fr: 'Ajouter une réponse' },
  support_reply_submit: { en: 'Send reply', fr: 'Envoyer la réponse' },
  support_reply_sending: { en: 'Sending…', fr: 'Envoi en cours…' },
  support_reply_error: {
    en: 'We couldn’t send your reply. Please try again.',
    fr: 'Nous n’avons pas pu envoyer votre réponse. Veuillez réessayer.',
  },
  support_reply_closed: {
    en: 'This request is closed. Start a new request if you need more help.',
    fr: 'Cette demande est fermée. Créez une nouvelle demande si vous avez besoin d’aide.',
  },

  /* ── First-line self-service assist (intake forms) ────────────────────── */
  support_firstline_title: {
    en: 'Before you send — these might answer your question:',
    fr: 'Avant d’envoyer — ceci pourrait répondre à votre question :',
  },
  support_firstline_human: {
    en: 'This type of request is always handled by a person, not an automated answer. Send it and we’ll reply in writing.',
    fr: 'Ce type de demande est toujours traité par une personne, et non par une réponse automatisée. Envoyez-la et nous répondrons par écrit.',
  },
  support_firstline_ask: { en: 'Get an instant answer', fr: 'Obtenir une réponse instantanée' },
  support_firstline_asking: { en: 'Thinking…', fr: 'Réflexion…' },
  support_firstline_answer_label: { en: 'Suggested answer', fr: 'Réponse suggérée' },
  support_firstline_disclaimer: {
    en: 'AI-generated from our Help Centre — not legal advice. Send your request and a person will still help.',
    fr: 'Générée par IA à partir de notre centre d’aide — pas un avis juridique. Envoyez votre demande et une personne vous aidera tout de même.',
  },
  support_firstline_answer_error: {
    en: 'We couldn’t generate an answer. Please send your request and we’ll reply.',
    fr: 'Nous n’avons pas pu générer de réponse. Veuillez envoyer votre demande et nous répondrons.',
  },
  /* The beta AI usage guardrail refused this one (429). Distinct from the
     failure above because nothing went wrong — and the next step is the same
     one the form already wanted: send it to a person. */
  support_firstline_answer_limited: {
    en: 'Instant answers have hit their beta usage limit for now. Send your request and a person will reply.',
    fr: 'Les réponses instantanées ont atteint leur limite d’utilisation pour la bêta. Envoyez votre demande et une personne vous répondra.', // [FR self-authored]
  },

  /* ── Service status page + founder control ────────────────────────────── */
  status_eyebrow: { en: 'Status', fr: 'État' },
  status_h1: { en: 'Service status', fr: 'État des services' },
  status_intro: {
    en: 'The current status of Dutiva’s services. Self-reported by our team. For help with a specific issue, contact support.',
    fr: 'L’état actuel des services de Dutiva. Signalé par notre équipe. Pour de l’aide sur un problème précis, contactez le soutien.',
  },
  status_all_operational: {
    en: 'All systems operational',
    fr: 'Tous les systèmes sont opérationnels',
  },
  status_some_issues: { en: 'Some systems are affected', fr: 'Certains systèmes sont touchés' },
  status_updated: { en: 'Updated', fr: 'Mis à jour' },
  status_admin_title: { en: 'Service status', fr: 'État des services' },
  status_admin_message_ph: {
    en: 'Optional note shown on the public status page',
    fr: 'Note facultative affichée sur la page d’état publique',
  },
  status_admin_save: { en: 'Update', fr: 'Mettre à jour' },
  status_admin_saved: { en: 'Saved', fr: 'Enregistré' },

  /* ── Attachments ──────────────────────────────────────────────────────── */
  support_attachments_title: { en: 'Attachments', fr: 'Pièces jointes' },
  support_attach_add: { en: 'Attach a file', fr: 'Joindre un fichier' },
  support_attach_uploading: { en: 'Uploading…', fr: 'Téléversement…' },
  support_attach_download: { en: 'Download', fr: 'Télécharger' },
  support_attach_none: { en: 'No files attached.', fr: 'Aucun fichier joint.' },
  support_attach_hint: {
    en: 'Images, PDF, text, or Office documents, up to 25 MB. Don’t attach confidential workplace records.',
    fr: 'Images, PDF, texte ou documents Office, jusqu’à 25 Mo. Ne joignez pas de dossiers confidentiels du milieu de travail.',
  },
  support_attach_too_large: {
    en: 'That file is over the 25 MB limit.',
    fr: 'Ce fichier dépasse la limite de 25 Mo.',
  },
  support_attach_bad_type: {
    en: 'That file type isn’t supported.',
    fr: 'Ce type de fichier n’est pas pris en charge.',
  },
  support_attach_error: {
    en: 'We couldn’t attach that file. Please try again.',
    fr: 'Nous n’avons pas pu joindre ce fichier. Veuillez réessayer.',
  },
  support_attach_download_error: {
    en: 'We couldn’t open that file. Please try again.',
    fr: 'Nous n’avons pas pu ouvrir ce fichier. Veuillez réessayer.',
  },
  support_attach_scan_pending: { en: 'Scan pending', fr: 'Analyse en attente' },
  support_attach_scan_flagged: { en: 'Blocked', fr: 'Bloqué' },
  support_attach_blocked: {
    en: 'This file was flagged by our malware scan and can’t be downloaded. If you sent it, please check the file on your device before attaching it again.',
    fr: 'Ce fichier a été signalé par notre analyse antimaliciel et ne peut pas être téléchargé. Si vous l’avez envoyé, veuillez le vérifier sur votre appareil avant de le joindre de nouveau.',
  },
  support_attach_scan_incomplete: {
    en: 'This file is still being scanned for malware. Please try again in a few minutes.',
    fr: 'Ce fichier fait encore l’objet d’une analyse antimaliciel. Veuillez réessayer dans quelques minutes.',
  },

  /* ── Founder / operator dashboard ─────────────────────────────────────── */
  support_admin_title: { en: 'Support dashboard', fr: 'Tableau de bord du soutien' },
  support_admin_denied: {
    en: 'This area is limited to support operators.',
    fr: 'Cette zone est réservée aux opérateurs de soutien.',
  },
  support_admin_filter_status: { en: 'Status', fr: 'Statut' },
  support_admin_filter_priority: { en: 'Priority', fr: 'Priorité' },
  support_admin_filter_category: { en: 'Category', fr: 'Catégorie' },
  support_admin_filter_all: { en: 'All', fr: 'Toutes' },
  support_admin_filter_restricted: { en: 'Restricted only', fr: 'Restreintes seulement' },
  support_admin_search: {
    en: 'Search subject or reference',
    fr: 'Rechercher un sujet ou une référence',
  },
  support_admin_empty: {
    en: 'No tickets match these filters.',
    fr: 'Aucun billet ne correspond à ces filtres.',
  },
  support_admin_col_requester: { en: 'Requester', fr: 'Demandeur' },
  support_admin_restricted_badge: { en: 'Restricted', fr: 'Restreinte' },
  support_admin_open_queues: { en: 'Open', fr: 'Ouverts' },
  support_admin_action_error: {
    en: 'That action didn’t go through. Please try again.',
    fr: 'Cette action n’a pas abouti. Veuillez réessayer.',
  },
  support_admin_internal_badge: { en: 'Internal note', fr: 'Note interne' },
  support_admin_reply_label: { en: 'Reply to the customer', fr: 'Répondre au client' },
  support_admin_reply_send: { en: 'Send reply', fr: 'Envoyer la réponse' },
  support_admin_note_label: {
    en: 'Add an internal note (not visible to the customer)',
    fr: 'Ajouter une note interne (non visible par le client)',
  },
  support_admin_note_send: { en: 'Save note', fr: 'Enregistrer la note' },
  support_admin_set_status: { en: 'Set status', fr: 'Définir le statut' },
  support_admin_set_priority: { en: 'Set priority', fr: 'Définir la priorité' },
  support_admin_working: { en: 'Working…', fr: 'En cours…' },

  // ── Scheduled call — admin propose (TODO.md D3) ──────────────────────
  support_admin_call_heading: { en: 'Propose call times', fr: 'Proposer des heures d’appel' },
  support_admin_call_intro: {
    en: 'Offer the customer up to 3 candidate times. They will pick one from their ticket.',
    fr: 'Proposez au client jusqu’à 3 plages horaires. Il en choisira une depuis son billet.',
  },
  support_admin_call_slot: { en: 'Time option', fr: 'Option horaire' },
  support_admin_call_duration_label: { en: 'Duration (minutes)', fr: 'Durée (minutes)' },
  support_admin_call_add_slot: { en: 'Add another time', fr: 'Ajouter une autre heure' },
  support_admin_call_remove_slot: { en: 'Remove this time', fr: 'Retirer cette heure' },
  support_admin_call_submit: { en: 'Send proposed times', fr: 'Envoyer les heures proposées' },
  support_admin_call_error: {
    en: 'Could not save the proposed times. Each time must be in the future and end after it starts.',
    fr: 'Impossible d’enregistrer les heures proposées. Chaque heure doit être dans le futur et se terminer après son début.',
  },
  support_admin_call_status_proposed: {
    en: 'Awaiting the customer’s choice',
    fr: 'En attente du choix du client',
  },
  support_admin_call_status_confirmed: { en: 'Confirmed', fr: 'Confirmé' },
  support_admin_call_calendar_skipped: {
    en: 'Calendar sync is not configured — add this to your calendar by hand.',
    fr: 'La synchronisation du calendrier n’est pas configurée — ajoutez ce rendez-vous manuellement.',
  },

  // ── Scheduled call — customer confirm (TODO.md D3) ───────────────────
  support_call_heading: { en: 'Scheduled call', fr: 'Appel planifié' },
  support_call_choose_intro: {
    en: 'Dutiva has proposed the following times for a call about this request. Pick the one that works.',
    fr: 'Dutiva a proposé les heures suivantes pour un appel au sujet de cette demande. Choisissez celle qui vous convient.',
  },
  support_call_confirm_button: { en: 'Confirm this time', fr: 'Confirmer cette heure' },
  support_call_confirming: { en: 'Confirming…', fr: 'Confirmation en cours…' },
  support_call_confirmed_heading: { en: 'Your call is confirmed', fr: 'Votre appel est confirmé' },
  support_call_join_link: { en: 'Join the call', fr: 'Rejoindre l’appel' },
  support_call_error: {
    en: 'Could not confirm that time. Please try again.',
    fr: 'Impossible de confirmer cette heure. Veuillez réessayer.',
  },

  // ── Export audit trail — admin viewer (TODO.md EF3) ──────────────────
  export_audit_title: { en: 'Export audit trail', fr: 'Journal des exports' },
  export_audit_denied: {
    en: 'This area is limited to support operators.',
    fr: 'Cette zone est réservée aux opérateurs de soutien.',
  },
  export_audit_intro: {
    en: 'One row per authorized export of company-generated content. The export id embedded in an artifact (visible watermark, invisible zero-width tag, or file metadata) resolves back to the person who exported it.',
    fr: 'Une ligne par export autorisé de contenu généré par l’entreprise. L’identifiant d’export intégré dans un artefact (filigrane visible, balise invisible à largeur nulle ou métadonnées du fichier) permet de retrouver la personne qui l’a exporté.',
  },
  export_audit_lookup_label: { en: 'Resolve an export id', fr: 'Résoudre un identifiant d’export' },
  export_audit_lookup_placeholder: {
    en: 'Paste export id (UUID)',
    fr: 'Coller l’identifiant d’export (UUID)',
  },
  export_audit_lookup_button: { en: 'Resolve', fr: 'Résoudre' },
  export_audit_lookup_not_found: {
    en: 'No export event found for that id.',
    fr: 'Aucun événement d’export trouvé pour cet identifiant.',
  },
  export_audit_filter_surface: { en: 'Surface', fr: 'Surface' },
  export_audit_filter_kind: { en: 'Kind', fr: 'Type' },
  export_audit_filter_all: { en: 'All', fr: 'Tous' },
  export_audit_col_id: { en: 'Export ID', fr: 'Identifiant' },
  export_audit_col_surface: { en: 'Surface', fr: 'Surface' },
  export_audit_col_kind: { en: 'Kind', fr: 'Type' },
  export_audit_col_title: { en: 'Title', fr: 'Titre' },
  export_audit_col_user: { en: 'User', fr: 'Utilisateur' },
  export_audit_col_chars: { en: 'Chars', fr: 'Caractères' },
  export_audit_col_lang: { en: 'Lang', fr: 'Langue' },
  export_audit_col_created: { en: 'Exported at', fr: 'Exporté le' },
  export_audit_col_hash: { en: 'Content hash', fr: 'Empreinte' },
  export_audit_empty: {
    en: 'No export events match these filters.',
    fr: 'Aucun événement d’export ne correspond à ces filtres.',
  },
  export_audit_error: {
    en: 'Could not load the export trail. Please try again.',
    fr: 'Impossible de charger le journal des exports. Veuillez réessayer.',
  },
  export_audit_total: { en: 'Total', fr: 'Total' },
  export_audit_page: { en: 'Page', fr: 'Page' },
  export_audit_prev: { en: 'Previous', fr: 'Précédent' },
  export_audit_next: { en: 'Next', fr: 'Suivant' },
  export_audit_loading: { en: 'Loading…', fr: 'Chargement…' },
  export_audit_back: { en: 'Back to list', fr: 'Retour à la liste' },
})
