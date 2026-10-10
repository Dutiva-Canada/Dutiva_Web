import { defineMessages } from '../../core'

/**
 * Careers — the applications list and the apply form.
 * [FR self-authored] throughout.
 */
export const careersApplications = defineMessages({
  /* ── Applications list ────────────────────────────────────────────────── */
  careers_applications_title: { en: 'Your applications', fr: 'Vos candidatures' },
  careers_applications_empty: {
    en: "You haven’t applied to any roles yet.",
    fr: "Vous n’avez pas encore postulé à un poste.",
  },
  careers_applications_empty_cta: {
    en: 'Browse open jobs',
    fr: 'Parcourir les emplois ouverts',
  },
  careers_applications_applied: { en: 'Applied', fr: 'Candidature envoyée' },
  careers_applications_status_submitted: { en: 'Submitted', fr: 'Soumise' },
  careers_applications_status_under_review: { en: 'Under review', fr: "En cours d’examen" },
  careers_applications_status_shortlisted: { en: 'Shortlisted', fr: 'Présélectionné' },
  careers_applications_status_interview: { en: 'Interview', fr: 'Entretien' },
  careers_applications_status_offered: { en: 'Offer extended', fr: 'Offre envoyée' },
  careers_applications_status_hired: { en: 'Hired', fr: 'Embauché' },
  careers_applications_status_rejected: { en: 'Not selected', fr: 'Non retenu' },
  careers_applications_status_withdrawn: { en: 'Withdrawn', fr: 'Retirée' },
  careers_applications_view_job: { en: 'View job posting', fr: "Voir l’offre" },
  careers_applications_posting_closed: {
    en: 'Posting no longer listed',
    fr: "Offre n’est plus affichée",
  },
  careers_applications_withdraw: { en: 'Withdraw', fr: 'Retirer' },
  careers_applications_withdraw_confirm: {
    en: 'Withdraw this application? This cannot be undone.',
    fr: 'Retirer cette candidature ? Cette action est irréversible.',
  },
  careers_applications_withdraw_success: {
    en: 'Application withdrawn.',
    fr: 'Candidature retirée.',
  },

  /* ── Apply form ───────────────────────────────────────────────────────── */
  careers_apply_title: { en: 'Apply to', fr: 'Postuler à' },
  careers_apply_subtitle: {
    en: 'Review your information and submit your application.',
    fr: 'Vérifiez vos informations et soumettez votre candidature.',
  },
  careers_apply_cover_letter: {
    en: 'Cover letter (optional)',
    fr: 'Lettre de motivation (optionnel)',
  },
  careers_apply_cover_letter_placeholder: {
    en: 'Why are you a good fit for this role?',
    fr: 'Pourquoi êtes-vous un bon candidat pour ce poste ?',
  },
  careers_apply_resume: { en: 'Resume', fr: 'CV' },
  careers_apply_submit: { en: 'Submit application', fr: 'Soumettre la candidature' },
  careers_apply_submitting: { en: 'Submitting…', fr: 'Envoi…' },
  careers_apply_submitted: { en: 'Application submitted', fr: 'Candidature soumise' },
  careers_apply_submit_error: {
    en: 'Could not submit application. Please try again.',
    fr: 'Impossible de soumettre la candidature. Veuillez réessayer.',
  },
  careers_apply_already_applied: {
    en: "You’ve already applied to this role.",
    fr: 'Vous avez déjà postulé à ce poste.',
  },
  careers_apply_confirm_title: { en: 'Review and submit', fr: 'Vérifiez et envoyez' },
  careers_apply_confirm_body: {
    en: 'Your profile, resume, and any cover letter go to {employer} as one application.',
    fr: 'Votre profil, votre CV et votre lettre de motivation sont envoyés à {employer} en une seule candidature.',
  },
  careers_apply_confirm_resume: { en: 'Your resume', fr: 'Votre CV' },
  careers_apply_confirm_cover_included: {
    en: 'Cover letter included',
    fr: 'Lettre de motivation jointe',
  },
  careers_apply_confirm_cover_skipped: {
    en: 'No cover letter',
    fr: 'Aucune lettre de motivation',
  },
  careers_apply_confirm_score_included: {
    en: 'AI match score included (visible to the employer)',
    fr: "Score de correspondance IA joint (visible par l’employeur)",
  },
  careers_apply_confirm_submit: { en: 'Confirm and submit', fr: 'Confirmer et envoyer' },
  careers_apply_confirm_edit: { en: 'Back to edit', fr: 'Retour à la modification' },
  careers_apply_submitted_body: {
    en: 'Your application went to {employer}. Track its status in your applications.',
    fr: 'Votre candidature a été envoyée à {employer}. Suivez son état dans vos candidatures.',
  },
  careers_apply_profile_required: {
    en: 'Complete your profile before applying.',
    fr: 'Complétez votre profil avant de postuler.',
  },
  careers_apply_profile_next_body: {
    en: 'Save your profile, then you\u2019ll come back to \u201C{job}\u201D to finish applying.',
    fr: 'Enregistrez votre profil, puis vous reviendrez à « {job} » pour terminer votre candidature.',
  },
  careers_profile_next_notice: {
    en: 'Save your profile to continue your application.',
    fr: 'Enregistrez votre profil pour poursuivre votre candidature.',
  },
  careers_apply_profile_required_cta: {
    en: 'Go to profile',
    fr: 'Aller au profil',
  },
  careers_apply_back: { en: 'Back to job', fr: "Retour à l’offre" },
})
