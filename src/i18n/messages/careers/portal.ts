import { defineMessages } from '../../core'

/**
 * Careers — the candidate portal shell: auth, layout,
 * settings, standalone AI tools, the profile itself, and
 * account deletion. [FR self-authored] throughout.
 */
export const careersPortal = defineMessages({
  /* ── Candidate portal — auth ─────────────────────────────────────────── */
  careers_auth_title: { en: 'Candidate account', fr: 'Compte candidat' },
  careers_auth_signin_tab: { en: 'Sign in', fr: 'Se connecter' },
  careers_auth_signup_tab: { en: 'Create account', fr: 'Créer un compte' },
  careers_auth_email: { en: 'Email', fr: 'Courriel' },
  careers_auth_name: { en: 'Full name', fr: 'Nom complet' },
  careers_auth_send_link: { en: 'Send sign-in link', fr: 'Envoyer le lien de connexion' },
  careers_auth_check_inbox: {
    en: 'Check your inbox',
    fr: 'Vérifiez votre boîte de réception',
  },
  careers_auth_check_inbox_body: {
    en: 'We sent a 6-digit code to {email}. Enter it below to sign in.',
    fr: 'Nous avons envoyé un code à 6 chiffres à {email}. Saisissez-le ci-dessous pour vous connecter.',
  },
  careers_auth_code: { en: '6-digit code', fr: 'Code à 6 chiffres' },
  careers_auth_verify: { en: 'Verify code', fr: 'Vérifier le code' },
  careers_auth_use_different_email: {
    en: 'Use a different email',
    fr: 'Utiliser un autre courriel',
  },
  careers_auth_signing_in: { en: 'Sending…', fr: 'Envoi…' },
  careers_auth_verifying: { en: 'Verifying…', fr: 'Vérification…' },
  careers_auth_error_generic: {
    en: 'Something went wrong. Please try again.',
    fr: "Une erreur s’est produite. Veuillez réessayer.",
  },
  careers_auth_welcome: { en: 'Welcome back', fr: 'Bon retour' },
  careers_auth_welcome_new: { en: 'Welcome to Dutiva', fr: 'Bienvenue sur Dutiva' },
  careers_auth_passwordless_hint: {
    en: "We’ll email you a 6-digit sign-in code — no password needed.",
    fr: 'Nous vous envoyons un code de connexion à 6 chiffres — aucun mot de passe requis.',
  },
  careers_auth_sign_out: { en: 'Sign out', fr: 'Se déconnecter' },

  /* ── Candidate portal — layout ────────────────────────────────────────── */
  careers_portal_title: { en: 'Candidate portal', fr: 'Portail candidat' },
  careers_portal_nav_profile: { en: 'Profile', fr: 'Profil' },
  careers_portal_nav_applications: { en: 'Applications', fr: 'Candidatures' },
  careers_portal_nav_browse: { en: 'Browse jobs', fr: 'Parcourir les emplois' },
  careers_portal_nav_ai_tools: { en: 'AI tools', fr: 'Outils IA' },
  careers_portal_nav_settings: { en: 'Settings', fr: 'Paramètres' },

  /* ── Candidate portal — settings ─────────────────────────────────────── */
  careers_settings_preferences: { en: 'Preferences', fr: 'Préférences' },
  careers_settings_language: { en: 'Language', fr: 'Langue' },
  careers_settings_theme: { en: 'Theme', fr: 'Thème' },
  careers_settings_theme_light: { en: 'Light', fr: 'Clair' },
  careers_settings_theme_dark: { en: 'Dark', fr: 'Sombre' },
  careers_settings_account: { en: 'Account', fr: 'Compte' },
  careers_settings_account_body: {
    en: 'Signed in with a one-time email code.',
    fr: 'Connecté avec un code unique envoyé par courriel.',
  },

  /* ── Candidate portal — standalone AI tools ──────────────────────────── */
  careers_ai_tools_lead: {
    en: 'Pick a job to work on — one of your applications, or a posting you paste in.',
    fr: 'Choisissez un emploi — l’une de vos candidatures ou une offre que vous collez.',
  },
  careers_ai_tools_pick_job: { en: 'Choose a job', fr: 'Choisir un emploi' },
  careers_ai_tools_pick_job_body: {
    en: 'The tools tailor your resume and prep against this posting.',
    fr: 'Les outils adaptent votre CV et votre préparation à cette offre.',
  },
  careers_ai_tools_from_application: {
    en: 'From my applications',
    fr: 'Depuis mes candidatures',
  },
  careers_ai_tools_choose_application: {
    en: 'Select an application…',
    fr: 'Sélectionnez une candidature…',
  },
  careers_ai_tools_posting_closed: {
    en: 'That posting is closed, so its details are no longer available. Paste the job description below instead.',
    fr: 'Cette offre est fermée et ses détails ne sont plus disponibles. Collez la description ci-dessous.',
  },
  careers_ai_tools_or_paste: {
    en: 'Or paste a job posting',
    fr: 'Ou collez une offre d’emploi',
  },
  careers_ai_tools_paste_title_placeholder: {
    en: 'Job title',
    fr: 'Titre du poste',
  },
  careers_ai_tools_paste_placeholder: {
    en: 'Paste the job description here…',
    fr: 'Collez la description du poste ici…',
  },
  careers_ai_tools_use_posting: { en: 'Use this posting', fr: 'Utiliser cette offre' },
  careers_ai_tools_resume_required: {
    en: 'Add your resume first',
    fr: 'Ajoutez d’abord votre CV',
  },
  careers_ai_tools_resume_required_body: {
    en: 'The AI tools work from the resume text in your profile. Add it there, then come back.',
    fr: 'Les outils IA partent du texte du CV dans votre profil. Ajoutez-le, puis revenez.',
  },
  careers_ai_copied: {
    en: 'Copied — paste it where you need it.',
    fr: 'Copié — collez-le où vous en avez besoin.',
  },

  /* ── Candidate profile ────────────────────────────────────────────────── */
  careers_profile_title: { en: 'Your profile', fr: 'Votre profil' },
  careers_profile_subtitle: {
    en: 'This is what employers see when you apply. Keep it up to date.',
    fr: "C’est ce que les employeurs voient quand vous postulez. Maintenez-le à jour.",
  },
  careers_profile_name: { en: 'Full name', fr: 'Nom complet' },
  careers_profile_email: { en: 'Email', fr: 'Courriel' },
  careers_profile_phone: { en: 'Phone (optional)', fr: 'Téléphone (optionnel)' },
  careers_profile_location: { en: 'Location', fr: 'Lieu' },
  careers_profile_headline: { en: 'Headline', fr: 'Titre' },
  careers_profile_headline_placeholder: {
    en: 'e.g., Senior Product Manager',
    fr: 'p. ex., Chef de produit senior',
  },
  careers_profile_summary: { en: 'Summary', fr: 'Sommaire' },
  careers_profile_summary_placeholder: {
    en: "A brief pitch about your experience and what you’re looking for.",
    fr: 'Un bref aperçu de votre expérience et de ce que vous recherchez.',
  },
  careers_profile_cover_letter: {
    en: 'Default cover letter',
    fr: 'Lettre de motivation par défaut',
  },
  careers_profile_cover_letter_placeholder: {
    en: 'A default cover letter you can tailor for each role when you apply.',
    fr: 'Une lettre de motivation par défaut que vous pourrez adapter à chaque poste lors de votre candidature.',
  },
  careers_profile_resume: { en: 'Resume', fr: 'CV' },
  careers_profile_resume_placeholder: {
    en: 'Paste your resume text here. You can tailor it for specific roles when you apply.',
    fr: "Collez le texte de votre CV ici. Vous pourrez l’adapter à des postes spécifiques lors de votre candidature.",
  },
  careers_profile_resume_upload_label: {
    en: 'Upload resume file',
    fr: 'Téléverser le fichier du CV',
  },
  careers_profile_resume_upload_prompt: {
    en: 'Upload a PDF or DOCX',
    fr: 'Téléverser un PDF ou DOCX',
  },
  careers_profile_resume_upload_hint: {
    en: "We’ll extract the text and fill empty profile fields.",
    fr: 'Nous extraierons le texte et remplirons les champs du profil vides.',
  },
  careers_profile_resume_upload_processing: {
    en: 'Reading your resume…',
    fr: 'Lecture de votre CV…',
  },
  careers_profile_resume_upload_failed: {
    en: 'Upload failed',
    fr: 'Échec du téléversement',
  },
  careers_profile_resume_upload_clear: {
    en: 'Clear upload',
    fr: 'Effacer le téléversement',
  },
  careers_profile_resume_upload_disclaimer: {
    en: 'Your file is processed in your browser — Dutiva does not store the original document.',
    fr: 'Votre fichier est traité dans votre navigateur — Dutiva ne conserve pas le document original.',
  },
  careers_file_error_unsupported_type: {
    en: 'Please upload a PDF or DOCX file.',
    fr: 'Veuillez téléverser un fichier PDF ou DOCX.',
  },
  careers_file_error_empty_file: {
    en: 'The file is empty.',
    fr: 'Le fichier est vide.',
  },
  careers_file_error_too_large: {
    en: 'The file is too large (max 10 MB).',
    fr: 'Le fichier est trop volumineux (max 10 Mo).',
  },
  careers_file_error_corrupt: {
    en: 'The file could not be read — it may be corrupt or password-protected.',
    fr: "Le fichier n’a pas pu être lu — il est peut-être corrompu ou protégé par mot de passe.",
  },
  careers_file_error_read_failed: {
    en: 'Could not read the file.',
    fr: 'Impossible de lire le fichier.',
  },
  careers_file_error_generic: {
    en: 'Something went wrong. Please try again.',
    fr: "Une erreur s’est produite. Veuillez réessayer.",
  },
  careers_apply_cover_letter_upload_label: {
    en: 'Upload cover letter file',
    fr: 'Téléverser le fichier de la lettre de motivation',
  },
  careers_apply_cover_letter_upload_prompt: {
    en: 'Upload a PDF or DOCX',
    fr: 'Téléverser un PDF ou DOCX',
  },
  careers_apply_cover_letter_upload_hint: {
    en: "We’ll extract the text for your cover letter.",
    fr: 'Nous extraierons le texte pour votre lettre de motivation.',
  },
  careers_apply_cover_letter_upload_processing: {
    en: 'Reading your cover letter…',
    fr: 'Lecture de votre lettre de motivation…',
  },
  careers_apply_cover_letter_upload_failed: {
    en: 'Upload failed',
    fr: 'Échec du téléversement',
  },
  careers_apply_cover_letter_upload_clear: {
    en: 'Clear upload',
    fr: 'Effacer le téléversement',
  },
  careers_apply_cover_letter_upload_disclaimer: {
    en: 'Your file is processed in your browser — Dutiva does not store the original document.',
    fr: 'Votre fichier est traité dans votre navigateur — Dutiva ne conserve pas le document original.',
  },
  careers_profile_resume_format_bold: { en: 'Bold', fr: 'Gras' },
  careers_profile_resume_format_italic: { en: 'Italic', fr: 'Italique' },
  careers_profile_resume_format_heading: { en: 'Heading', fr: 'Titre' },
  careers_profile_resume_format_bullet_list: { en: 'Bullet list', fr: 'Liste à puces' },
  careers_profile_resume_format_numbered_list: { en: 'Numbered list', fr: 'Liste numérotée' },
  careers_profile_resume_format_link: { en: 'Link', fr: 'Lien' },
  careers_profile_resume_markdown_hint: {
    en: 'Markdown formatting is supported.',
    fr: 'La mise en forme Markdown est prise en charge.',
  },
  careers_profile_resume_write: { en: 'Write', fr: 'Rédiger' },
  careers_profile_resume_preview: { en: 'Preview', fr: 'Aperçu' },
  careers_profile_linkedin: { en: 'LinkedIn URL (optional)', fr: 'LinkedIn (optionnel)' },
  careers_profile_website: { en: 'Website URL (optional)', fr: 'Site web (optionnel)' },
  careers_profile_current_role: { en: 'Current role', fr: 'Poste actuel' },
  careers_profile_years_experience: { en: 'Years of experience', fr: "Années d’expérience" },
  careers_profile_work_authorization: { en: 'Work authorization', fr: 'Autorisation de travail' },
  careers_profile_work_auth_authorized: {
    en: 'Authorized to work in Canada',
    fr: 'Autorisé à travailler au Canada',
  },
  careers_profile_work_auth_sponsorship: { en: 'Needs sponsorship', fr: 'Nécessite un parrainage' },
  careers_profile_work_auth_unknown: { en: 'Prefer not to say', fr: 'Préfère ne pas dire' },
  careers_profile_save: { en: 'Save profile', fr: 'Enregistrer le profil' },
  careers_profile_saving: { en: 'Saving…', fr: 'Enregistrement…' },
  careers_profile_saved: { en: 'Profile saved', fr: 'Profil enregistré' },
  careers_profile_save_error: {
    en: 'Could not save profile. Please try again.',
    fr: "Impossible d’enregistrer le profil. Veuillez réessayer.",
  },
  careers_profile_not_created: {
    en: 'Complete your profile to start applying.',
    fr: 'Complétez votre profil pour commencer à postuler.',
  },

  /* ── Profile deletion ─────────────────────────────────────────────────── */
  careers_profile_delete_title: { en: 'Delete your data', fr: 'Supprimer vos données' },
  careers_profile_delete_body: {
    en: 'Permanently removes your candidate profile and every application you have submitted. Employers can no longer see your information. This cannot be undone.',
    fr: 'Supprime définitivement votre profil candidat et toutes vos candidatures. Les employeurs ne pourront plus voir vos informations. Cette action est irréversible.',
  },
  careers_profile_delete_action: { en: 'Delete my profile', fr: 'Supprimer mon profil' },
  careers_profile_delete_confirm: {
    en: 'Permanently delete your profile and all of your applications? This cannot be undone.',
    fr: 'Supprimer définitivement votre profil et toutes vos candidatures ? Cette action est irréversible.',
  },
  careers_profile_deleted: {
    en: 'Your profile and applications were deleted.',
    fr: 'Votre profil et vos candidatures ont été supprimés.',
  },
  careers_profile_delete_error: {
    en: 'Could not delete your profile. Please try again.',
    fr: 'Impossible de supprimer votre profil. Veuillez réessayer.',
  },
})
