import { defineMessages } from '../core'

/**
 * Candidate Portal — B2C job application product
 *
 * Bilingual messages for the public job board (/careers) and the
 * authenticated candidate portal (/careers/portal). [FR self-authored]
 * throughout as this is a new product surface without a design handoff.
 */
export const careersMessages = defineMessages({
  /* ── Public job board ─────────────────────────────────────────────────── */
  careers_board_title: { en: 'Find your next role', fr: 'Trouvez votre prochain poste' },
  careers_board_subtitle: {
    en: 'Browse open positions from Canadian employers hiring through Dutiva.',
    fr: 'Parcourez les postes ouverts offerts par les employeurs canadiens via Dutiva.',
  },
  careers_board_search_placeholder: {
    en: 'Search by title, department, or location…',
    fr: 'Rechercher par titre, département ou lieu…',
  },
  careers_board_no_results: {
    en: 'No open positions match your search.',
    fr: 'Aucun poste ouvert ne correspond à votre recherche.',
  },
  careers_board_no_results_body: {
    en: 'Try different keywords or check back soon — new roles are posted regularly.',
    fr: 'Essayez d\'autres mots-clés ou revenez bientôt — de nouveaux postes sont publiés régulièrement.',
  },
  careers_board_view_all: { en: 'View all open roles', fr: 'Voir tous les postes ouverts' },
  careers_board_apply: { en: 'Apply now', fr: 'Postuler maintenant' },
  careers_board_view_detail: { en: 'View details', fr: 'Voir les détails' },
  careers_board_posted: { en: 'Posted', fr: 'Publié' },
  careers_board_closing: { en: 'Closing', fr: 'Clôture' },
  careers_board_openings: { en: 'openings', fr: 'postes' },
  careers_board_loading: { en: 'Loading job openings…', fr: 'Chargement des postes ouverts…' },
  careers_board_load_error: {
    en: 'Could not load job openings. Please try again.',
    fr: 'Impossible de charger les postes ouverts. Veuillez réessayer.',
  },
  careers_board_how_it_works: {
    en: 'For candidates: Dutiva Careers lets you browse open positions from Canadian employers, create a profile, and apply with optional AI tools for resume tailoring and interview preparation. Employers post jobs through the B2B hiring module; candidates see the same active postings here. Sign in to save your profile, track applications, and get AI-assisted guidance.',
    fr: 'Pour les candidats : Dutiva Carrières vous permet de parcourir les postes ouverts offerts par des employeurs canadiens, de créer un profil et de postuler avec des outils IA optionnels pour l\'adaptation du CV et la préparation d\'entretien. Les employeurs publient les offres via le module B2B de recrutement ; les candidats voient les mêmes postes actifs ici. Connectez-vous pour enregistrer votre profil, suivre les candidatures et obtenir de l\'aide IA.',
  },

  /* ── Job detail page ──────────────────────────────────────────────────── */
  careers_detail_back: { en: 'All jobs', fr: 'Tous les emplois' },
  careers_detail_not_found: {
    en: 'This position is no longer available.',
    fr: 'Ce poste n\'est plus disponible.',
  },
  careers_detail_not_found_body: {
    en: 'It may have been closed or filled. Browse other open roles.',
    fr: 'Il a peut-être été fermé ou pourvu. Parcourez les autres postes ouverts.',
  },
  careers_detail_requirements: { en: 'Requirements', fr: 'Exigences' },
  careers_detail_department: { en: 'Department', fr: 'Département' },
  careers_detail_location: { en: 'Location', fr: 'Lieu' },
  careers_detail_type: { en: 'Employment type', fr: 'Type d\'emploi' },
  careers_detail_description: { en: 'About the role', fr: 'À propos du poste' },
  careers_detail_apply_cta: { en: 'Apply to this role', fr: 'Postuler à ce poste' },
  careers_detail_sign_in_to_apply: {
    en: 'Sign in to apply',
    fr: 'Connectez-vous pour postuler',
  },
  careers_detail_sign_in_to_apply_body: {
    en: 'Create a free candidate account or sign in to submit your application.',
    fr: 'Créez un compte candidat gratuit ou connectez-vous pour soumettre votre candidature.',
  },

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
    fr: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
  careers_auth_welcome: { en: 'Welcome back', fr: 'Bon retour' },
  careers_auth_welcome_new: { en: 'Welcome to Dutiva', fr: 'Bienvenue sur Dutiva' },
  careers_auth_sign_out: { en: 'Sign out', fr: 'Se déconnecter' },

  /* ── Candidate portal — layout ────────────────────────────────────────── */
  careers_portal_title: { en: 'Candidate portal', fr: 'Portail candidat' },
  careers_portal_nav_profile: { en: 'Profile', fr: 'Profil' },
  careers_portal_nav_applications: { en: 'Applications', fr: 'Candidatures' },
  careers_portal_nav_browse: { en: 'Browse jobs', fr: 'Parcourir les emplois' },

  /* ── Candidate profile ────────────────────────────────────────────────── */
  careers_profile_title: { en: 'Your profile', fr: 'Votre profil' },
  careers_profile_subtitle: {
    en: 'This is what employers see when you apply. Keep it up to date.',
    fr: 'C\'est ce que les employeurs voient quand vous postulez. Maintenez-le à jour.',
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
    en: 'A brief pitch about your experience and what you\'re looking for.',
    fr: 'Un bref aperçu de votre expérience et de ce que vous recherchez.',
  },
  careers_profile_resume: { en: 'Resume', fr: 'CV' },
  careers_profile_resume_placeholder: {
    en: 'Paste your resume text here. You can tailor it for specific roles when you apply.',
    fr: 'Collez le texte de votre CV ici. Vous pourrez l\'adapter à des postes spécifiques lors de votre candidature.',
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
    en: 'We\'ll extract the text and fill empty profile fields.',
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
  careers_profile_resume_error_unsupported_type: {
    en: 'Please upload a PDF or DOCX file.',
    fr: 'Veuillez téléverser un fichier PDF ou DOCX.',
  },
  careers_profile_resume_error_empty_file: {
    en: 'The file is empty.',
    fr: 'Le fichier est vide.',
  },
  careers_profile_resume_error_too_large: {
    en: 'The file is too large (max 10 MB).',
    fr: 'Le fichier est trop volumineux (max 10 Mo).',
  },
  careers_profile_resume_error_corrupt: {
    en: 'The file could not be read — it may be corrupt or password-protected.',
    fr: 'Le fichier n\'a pas pu être lu — il est peut-être corrompu ou protégé par mot de passe.',
  },
  careers_profile_resume_error_read_failed: {
    en: 'Could not read the file.',
    fr: 'Impossible de lire le fichier.',
  },
  careers_profile_resume_error_generic: {
    en: 'Something went wrong. Please try again.',
    fr: 'Une erreur s\'est produite. Veuillez réessayer.',
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
  careers_profile_years_experience: { en: 'Years of experience', fr: 'Années d\'expérience' },
  careers_profile_work_authorization: { en: 'Work authorization', fr: 'Autorisation de travail' },
  careers_profile_work_auth_authorized: { en: 'Authorized to work in Canada', fr: 'Autorisé à travailler au Canada' },
  careers_profile_work_auth_sponsorship: { en: 'Needs sponsorship', fr: 'Nécessite un parrainage' },
  careers_profile_work_auth_unknown: { en: 'Prefer not to say', fr: 'Préfère ne pas dire' },
  careers_profile_save: { en: 'Save profile', fr: 'Enregistrer le profil' },
  careers_profile_saving: { en: 'Saving…', fr: 'Enregistrement…' },
  careers_profile_saved: { en: 'Profile saved', fr: 'Profil enregistré' },
  careers_profile_save_error: {
    en: 'Could not save profile. Please try again.',
    fr: 'Impossible d\'enregistrer le profil. Veuillez réessayer.',
  },
  careers_profile_not_created: {
    en: 'Complete your profile to start applying.',
    fr: 'Complétez votre profil pour commencer à postuler.',
  },

  /* ── Applications list ────────────────────────────────────────────────── */
  careers_applications_title: { en: 'Your applications', fr: 'Vos candidatures' },
  careers_applications_empty: {
    en: 'You haven\'t applied to any roles yet.',
    fr: 'Vous n\'avez pas encore postulé à un poste.',
  },
  careers_applications_empty_cta: {
    en: 'Browse open jobs',
    fr: 'Parcourir les emplois ouverts',
  },
  careers_applications_applied: { en: 'Applied', fr: 'Candidature envoyée' },
  careers_applications_status_submitted: { en: 'Submitted', fr: 'Soumise' },
  careers_applications_status_under_review: { en: 'Under review', fr: 'En cours d\'examen' },
  careers_applications_status_shortlisted: { en: 'Shortlisted', fr: 'Présélectionné' },
  careers_applications_status_interview: { en: 'Interview', fr: 'Entretien' },
  careers_applications_status_offered: { en: 'Offer extended', fr: 'Offre envoyée' },
  careers_applications_status_hired: { en: 'Hired', fr: 'Embauché' },
  careers_applications_status_rejected: { en: 'Not selected', fr: 'Non retenu' },
  careers_applications_status_withdrawn: { en: 'Withdrawn', fr: 'Retirée' },
  careers_applications_view_job: { en: 'View job posting', fr: 'Voir l\'offre' },
  careers_applications_withdraw: { en: 'Withdraw', fr: 'Retirer' },
  careers_applications_withdraw_confirm: {
    en: 'Withdraw this application? This cannot be undone.',
    fr: 'Retirer cette candidature ? Cette action est irréversible.',
  },

  /* ── Apply form ───────────────────────────────────────────────────────── */
  careers_apply_title: { en: 'Apply to', fr: 'Postuler à' },
  careers_apply_subtitle: {
    en: 'Review your information and submit your application.',
    fr: 'Vérifiez vos informations et soumettez votre candidature.',
  },
  careers_apply_cover_letter: { en: 'Cover letter (optional)', fr: 'Lettre de motivation (optionnel)' },
  careers_apply_cover_letter_placeholder: {
    en: 'Why are you a good fit for this role?',
    fr: 'Pourquoi êtes-vous un bon candidat pour ce poste ?',
  },
  careers_apply_resume: { en: 'Resume', fr: 'CV' },
  careers_apply_resume_base: { en: 'Use my base resume', fr: 'Utiliser mon CV de base' },
  careers_apply_resume_tailored: { en: 'Tailored for this role', fr: 'Adapté à ce poste' },
  careers_apply_submit: { en: 'Submit application', fr: 'Soumettre la candidature' },
  careers_apply_submitting: { en: 'Submitting…', fr: 'Envoi…' },
  careers_apply_submitted: { en: 'Application submitted', fr: 'Candidature soumise' },
  careers_apply_submit_error: {
    en: 'Could not submit application. Please try again.',
    fr: 'Impossible de soumettre la candidature. Veuillez réessayer.',
  },
  careers_apply_already_applied: {
    en: 'You\'ve already applied to this role.',
    fr: 'Vous avez déjà postulé à ce poste.',
  },
  careers_apply_profile_required: {
    en: 'Complete your profile before applying.',
    fr: 'Complétez votre profil avant de postuler.',
  },
  careers_apply_profile_required_cta: {
    en: 'Go to profile',
    fr: 'Aller au profil',
  },
  careers_apply_back: { en: 'Back to job', fr: 'Retour à l\'offre' },

  /* ── AI features ──────────────────────────────────────────────────────── */
  careers_ai_section_title: { en: 'AI tools (optional)', fr: 'Outils IA (optionnel)' },
  careers_ai_section_subtitle: {
    en: 'Use AI to strengthen your application. Everything here is optional — you can apply without it.',
    fr: 'Utilisez l\'IA pour renforcer votre candidature. Tout ici est optionnel — vous pouvez postuler sans.',
  },
  careers_ai_tailor_resume: { en: 'Tailor my resume', fr: 'Adapter mon CV' },
  careers_ai_tailor_resume_desc: {
    en: 'Highlights the experience most relevant to this role.',
    fr: 'Met en évidence l\'expérience la plus pertinente pour ce poste.',
  },
  careers_ai_cover_letter: { en: 'Draft a cover letter', fr: 'Rédiger une lettre de motivation' },
  careers_ai_cover_letter_desc: {
    en: 'Generates a first draft based on your profile and the job posting.',
    fr: 'Génère un premier brouillon basé sur votre profil et l\'offre.',
  },
  careers_ai_match_score: { en: 'Check my match', fr: 'Évaluer ma correspondance' },
  careers_ai_match_score_desc: {
    en: 'See how well your profile aligns with the role and get suggestions.',
    fr: 'Voyez dans quelle mesure votre profil correspond au poste et obtenez des suggestions.',
  },
  careers_ai_interview_prep: { en: 'Interview prep', fr: 'Préparation à l\'entretien' },
  careers_ai_interview_prep_desc: {
    en: 'Practice questions and talking points for this role.',
    fr: 'Questions de pratique et points de discussion pour ce poste.',
  },
  careers_ai_generating: { en: 'Generating…', fr: 'Génération…' },
  careers_ai_generated: { en: 'Generated', fr: 'Généré' },
  careers_ai_error: {
    en: 'AI tool unavailable. You can still apply without it.',
    fr: 'Outil IA indisponible. Vous pouvez toujours postuler sans.',
  },
  careers_ai_match_score_label: { en: 'Match score', fr: 'Score de correspondance' },
  careers_ai_match_suggestions: { en: 'Suggestions', fr: 'Suggestions' },
  careers_ai_use_tailored: { en: 'Use this version', fr: 'Utiliser cette version' },
  careers_ai_use_cover_letter: { en: 'Use this cover letter', fr: 'Utiliser cette lettre' },
  careers_ai_interview_questions: { en: 'Practice questions', fr: 'Questions de pratique' },
  careers_ai_interview_talking_points: { en: 'Talking points', fr: 'Points de discussion' },
  careers_ai_disclaimer: {
    en: 'AI suggestions are a starting point. Review and edit before submitting.',
    fr: 'Les suggestions de l\'IA sont un point de départ. Révisez et modifiez avant de soumettre.',
  },

  /* ── Misc ─────────────────────────────────────────────────────────────── */
  careers_loading: { en: 'Loading…', fr: 'Chargement…' },
  careers_error_generic: {
    en: 'Something went wrong. Please try again.',
    fr: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
})
