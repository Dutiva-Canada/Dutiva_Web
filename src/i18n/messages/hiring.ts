import { defineMessages } from '../core'

/**
 * Hiring module — evidence-based recruitment system
 * 
 * Implements the AI-resistant hiring funnel with bilingual support.
 * [FR self-authored] throughout as this is a new feature without prototype.
 */
export const hiringMessages = defineMessages({
  /* ── Module Navigation ─────────────────────────────────────────────────── */
  hiring_module_title: { en: 'Hiring', fr: 'Recrutement' },
  hiring_module_description: {
    en: 'Evidence-based recruitment with AI-resistant evaluation',
    fr: 'Recrutement fondé sur des preuves avec évaluation résistante à l\'IA',
  },

  /* ── Candidates List View ─────────────────────────────────────────────── */
  hiring_candidates_title: { en: 'Candidates', fr: 'Candidats' },
  hiring_candidates_filter_placeholder: {
    en: 'Filter by name, position, or status…',
    fr: 'Filtrer par nom, poste ou statut…',
  },
  hiring_candidates_showing: { en: 'Showing', fr: 'Affichage de' },
  hiring_candidates_of: { en: 'of', fr: 'sur' },
  hiring_candidates_candidates: { en: 'candidates', fr: 'candidats' },
  
  hiring_th_name: { en: 'Name', fr: 'Nom' },
  hiring_th_position: { en: 'Position', fr: 'Poste' },
  hiring_th_location: { en: 'Location', fr: 'Lieu' },
  hiring_th_status: { en: 'Status', fr: 'Statut' },
  hiring_th_applied: { en: 'Applied', fr: 'Candidature' },
  hiring_th_assigned: { en: 'Assigned to', fr: 'Assigné à' },
  
  hiring_status_application: { en: 'Application', fr: 'Candidature' },
  hiring_status_basic_qualified: { en: 'Basic qualified', fr: 'Qualifié de base' },
  hiring_status_evidence_qualified: { en: 'Evidence qualified', fr: 'Qualifié par preuves' },
  hiring_status_work_sample: { en: 'Work sample', fr: 'Échantillon de travail' },
  hiring_status_interview: { en: 'Interview', fr: 'Entretien' },
  hiring_status_hired: { en: 'Hired', fr: 'Embauché' },
  hiring_status_rejected: { en: 'Rejected', fr: 'Rejeté' },
  
  hiring_no_candidates: { en: 'No candidates yet', fr: 'Aucun candidat pour l\'instant' },
  hiring_no_candidates_body: {
    en: 'Candidates will appear here once applications are received.',
    fr: 'Les candidats apparaîtront ici une fois les candidatures reçues.',
  },
  hiring_open_candidate: { en: 'Open candidate profile', fr: 'Ouvrir le profil du candidat' },

  /* ── Candidate Detail View ─────────────────────────────────────────────── */
  hiring_candidate_back: { en: 'All candidates', fr: 'Tous les candidats' },
  hiring_candidate_not_found: {
    en: 'This candidate doesn’t exist or was removed.',
    fr: 'Ce candidat n\'existe pas ou a été retiré.',
  },
  
  hiring_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  hiring_tab_evidence: { en: 'Evidence screening', fr: 'Analyse des preuves' },
  hiring_tab_work_sample: { en: 'Work sample', fr: 'Échantillon de travail' },
  hiring_tab_interview: { en: 'Interview', fr: 'Entretien' },
  hiring_tab_scores: { en: 'Authenticity scores', fr: 'Scores d\'authenticité' },
  
  /* Overview section */
  hiring_overview_application: { en: 'Application details', fr: 'Détails de la candidature' },
  hiring_overview_resume: { en: 'Resume', fr: 'CV' },
  hiring_overview_linkedin: { en: 'LinkedIn', fr: 'LinkedIn' },
  hiring_overview_email: { en: 'Email', fr: 'Courriel' },
  hiring_overview_phone: { en: 'Phone', fr: 'Téléphone' },
  hiring_overview_location: { en: 'Location', fr: 'Lieu' },
  hiring_overview_position: { en: 'Position applied for', fr: 'Poste demandé' },
  hiring_overview_current_role: { en: 'Current role', fr: 'Poste actuel' },
  hiring_overview_experience: { en: 'Years of experience', fr: 'Années d\'expérience' },
  hiring_overview_authorization: { en: 'Work authorization', fr: 'Autorisation de travail' },
  hiring_overview_compensation: { en: 'Compensation expectations', fr: 'Attentes salariales' },
  
  hiring_auth_authorized: { en: 'Authorized to work', fr: 'Autorisé à travailler' },
  hiring_auth_needs_sponsorship: { en: 'Needs sponsorship', fr: 'Nécessite un parrainage' },
  hiring_auth_unknown: { en: 'Unknown', fr: 'Inconnu' },
  
  hiring_overview_knockout: { en: 'Knockout criteria', fr: 'Critères d\'élimination' },
  hiring_overview_requirements: { en: 'Required qualifications', fr: 'Qualifications requises' },
  hiring_overview_missing: { en: 'Missing requirements', fr: 'Exigences manquantes' },
  hiring_overview_meets_requirements: { en: 'Meets basic requirements', fr: 'Répond aux exigences de base' },
  hiring_overview_does_not_meet: { en: 'Does not meet requirements', fr: 'Ne répond pas aux exigences' },

  /* Evidence screening section */
  hiring_evidence_title: { en: 'Evidence screening', fr: 'Analyse des preuves' },
  hiring_evidence_description: {
    en: 'AI-extracted structured evidence from the candidate\'s resume and application.',
    fr: 'Preuves structurées extraites par l\'IA du CV et de la candidature du candidat.',
  },
  hiring_evidence_quality: { en: 'Evidence quality', fr: 'Qualité des preuves' },
  hiring_evidence_confidence: { en: 'Assessment confidence', fr: 'Confiance de l\'évaluation' },
  hiring_evidence_missing: { en: 'Missing information', fr: 'Informations manquantes' },
  
  hiring_evidence_relevant_experience: { en: 'Relevant experience', fr: 'Expérience pertinente' },
  hiring_evidence_scope: { en: 'Scope & complexity', fr: 'Portée et complexité' },
  hiring_evidence_outcomes: { en: 'Quantifiable outcomes', fr: 'Résultats quantifiables' },
  hiring_evidence_skills: { en: 'Demonstrated skills', fr: 'Compétences démontrées' },
  hiring_evidence_trajectory: { en: 'Career trajectory', fr: 'Trajectoire de carrière' },
  hiring_evidence_domain: { en: 'Domain knowledge', fr: 'Connaissances du domaine' },
  
  hiring_evidence_claim: { en: 'Claim', fr: 'Affirmation' },
  hiring_evidence_evidence: { en: 'Evidence', fr: 'Preuve' },
  hiring_evidence_specificity: { en: 'Specificity', fr: 'Spécificité' },
  hiring_evidence_specificity_specific: { en: 'Specific', fr: 'Spécifique' },
  hiring_evidence_specificity_moderate: { en: 'Moderate', fr: 'Modérée' },
  hiring_evidence_specificity_generic: { en: 'Generic', fr: 'Générique' },
  
  hiring_evidence_high_quality: { en: 'High quality evidence', fr: 'Preuves de haute qualité' },
  hiring_evidence_medium_quality: { en: 'Medium quality evidence', fr: 'Preuves de qualité moyenne' },
  hiring_evidence_low_quality: { en: 'Low quality evidence', fr: 'Preuves de faible qualité' },
  hiring_evidence_generic: { en: 'Generic claims only', fr: 'Affirmations génériques seulement' },

  /* Work sample section */
  hiring_work_sample_title: { en: 'Work sample assessment', fr: 'Évaluation de l\'échantillon de travail' },
  hiring_work_sample_description: {
    en: 'Job-realistic work sample (20-45 minutes). AI tools are allowed and evaluated.',
    fr: 'Échantillon de travail réaliste (20-45 minutes). Les outils IA sont autorisés et évalués.',
  },
  hiring_work_sample_scenario: { en: 'Scenario', fr: 'Scénario' },
  hiring_work_sample_submission: { en: 'Candidate submission', fr: 'Soumission du candidat' },
  hiring_work_sample_ai_allowed: { en: 'AI tools allowed', fr: 'Outils IA autorisés' },
  hiring_work_sample_ai_detected: { en: 'AI detected', fr: 'IA détectée' },
  hiring_work_sample_time: { en: 'Time taken', fr: 'Temps pris' },
  hiring_work_sample_status: { en: 'Status', fr: 'Statut' },
  
  hiring_work_sample_pending: { en: 'Pending', fr: 'En attente' },
  hiring_work_sample_in_progress: { en: 'In progress', fr: 'En cours' },
  hiring_work_sample_completed: { en: 'Completed', fr: 'Terminé' },
  hiring_work_sample_skipped: { en: 'Skipped', fr: 'Ignoré' },
  
  hiring_work_sample_evaluation: { en: 'Evaluation', fr: 'Évaluation' },
  hiring_work_sample_quality: { en: 'Work quality', fr: 'Qualité du travail' },
  hiring_work_sample_approach: { en: 'Approach', fr: 'Approche' },
  hiring_work_sample_ai_usage: { en: 'AI usage', fr: 'Utilisation de l\'IA' },
  hiring_work_sample_capability: { en: 'Demonstrated capability', fr: 'Capacité démontrée' },
  hiring_work_sample_feedback: { en: 'Feedback', fr: 'Commentaires' },
  hiring_work_sample_recommendation: { en: 'Recommendation', fr: 'Recommandation' },
  
  hiring_work_sample_assign: { en: 'Assign work sample', fr: 'Assigner l\'échantillon de travail' },
  hiring_work_sample_view_submission: { en: 'View submission', fr: 'Voir la soumission' },
  hiring_work_sample_evaluate: { en: 'Evaluate', fr: 'Évaluer' },

  /* Interview section */
  hiring_interview_title: { en: 'Defense interview', fr: 'Entretien de défense' },
  hiring_interview_description: {
    en: 'Deep-dive conversation to defend the work sample and demonstrate reasoning capability.',
    fr: 'Conversation approfondie pour défendre l\'échantillon de travail et démontrer la capacité de raisonnement.',
  },
  hiring_interview_format: { en: 'Format', fr: 'Format' },
  hiring_interview_scheduled: { en: 'Scheduled', fr: 'Planifié' },
  hiring_interview_interviewers: { en: 'Interviewers', fr: 'Entretiens' },
  
  hiring_interview_format_defend: { en: 'Defend work sample', fr: 'Défendre l\'échantillon de travail' },
  hiring_interview_format_technical: { en: 'Technical deep-dive', fr: 'Plongée technique approfondie' },
  hiring_interview_format_behavioral: { en: 'Behavioral', fr: 'Comportemental' },
  
  hiring_interview_conversation: { en: 'Conversation', fr: 'Conversation' },
  hiring_interview_question: { en: 'Question', fr: 'Question' },
  hiring_interview_response: { en: 'Response', fr: 'Réponse' },
  hiring_interview_depth: { en: 'Depth of understanding', fr: 'Profondeur de compréhension' },
  hiring_interview_reasoning: { en: 'Reasoning ability', fr: 'Capacité de raisonnement' },
  hiring_interview_alternatives: { en: 'Alternatives considered', fr: 'Alternatives envisagées' },
  hiring_interview_confidence: { en: 'Response confidence', fr: 'Confiance dans la réponse' },
  
  hiring_interview_assessment: { en: 'Interview assessment', fr: 'Évaluation de l\'entretien' },
  hiring_interview_reasoning_capability: { en: 'Reasoning capability', fr: 'Capacité de raisonnement' },
  hiring_interview_defense_ability: { en: 'Defense ability', fr: 'Capacité de défense' },
  hiring_interview_knowledge_depth: { en: 'Knowledge depth', fr: 'Profondeur des connaissances' },
  hiring_interview_communication: { en: 'Communication clarity', fr: 'Clarté de la communication' },
  hiring_interview_authenticity: { en: 'Authenticity score', fr: 'Score d\'authenticité' },
  hiring_interview_recommendation: { en: 'Recommendation', fr: 'Recommandation' },
  hiring_interview_reasons: { en: 'Reasons', fr: 'Raisons' },
  
  hiring_interview_schedule: { en: 'Schedule interview', fr: 'Planifier l\'entretien' },
  hiring_interview_conduct: { en: 'Conduct interview', fr: 'Conduire l\'entretien' },

  /* Authenticity scores section */
  hiring_scores_title: { en: 'Five-score authenticity evaluation', fr: 'Évaluation d\'authenticité à cinq scores' },
  hiring_scores_description: {
    en: 'Explainable scores based on job-related evidence across five dimensions.',
    fr: 'Scores explicables basés sur des preuves liées au travail sur cinq dimensions.',
  },
  
  hiring_scores_qualification: { en: 'Qualification', fr: 'Qualification' },
  hiring_scores_qualification_desc: {
    en: 'Can they meet the basic requirements?',
    fr: 'Peuvent-ils répondre aux exigences de base?',
  },
  hiring_scores_evidence: { en: 'Evidence', fr: 'Preuves' },
  hiring_scores_evidence_desc: {
    en: 'Have they actually done similar things?',
    fr: 'Ont-ils réellement fait des choses similaires?',
  },
  hiring_scores_capability: { en: 'Capability', fr: 'Capacité' },
  hiring_scores_capability_desc: {
    en: 'Can they perform the work?',
    fr: 'Peuvent-ils effectuer le travail?',
  },
  hiring_scores_reasoning: { en: 'Reasoning', fr: 'Raisonnement' },
  hiring_scores_reasoning_desc: {
    en: 'Can they explain and defend their decisions?',
    fr: 'Peuvent-ils expliquer et défendre leurs décisions?',
  },
  hiring_scores_motivation: { en: 'Motivation', fr: 'Motivation' },
  hiring_scores_motivation_desc: {
    en: 'Do they actually want this job?',
    fr: 'Veulent-ils vraiment ce poste?',
  },
  
  hiring_scores_overall: { en: 'Overall authenticity', fr: 'Authenticité globale' },
  hiring_scores_high: { en: 'High', fr: 'Élevé' },
  hiring_scores_medium: { en: 'Medium', fr: 'Moyen' },
  hiring_scores_low: { en: 'Low', fr: 'Faible' },
  hiring_scores_insufficient: { en: 'Insufficient', fr: 'Insuffisant' },
  
  hiring_scores_evidence_label: { en: 'Supporting evidence', fr: 'Preuves à l\'appui' },
  hiring_scores_confidence: { en: 'Assessment confidence', fr: 'Confiance de l\'évaluation' },

  /* ── Funnel Analytics ─────────────────────────────────────────────────── */
  hiring_funnel_title: { en: 'Hiring funnel', fr: 'Entonnoir de recrutement' },
  hiring_funnel_description: {
    en: 'Track candidates through each stage of the evidence-based hiring process.',
    fr: 'Suivre les candidats à chaque étape du processus de recrutement fondé sur des preuves.',
  },
  
  hiring_funnel_applications: { en: 'Applications', fr: 'Candidatures' },
  hiring_funnel_basic_qualified: { en: 'Basic qualified', fr: 'Qualifié de base' },
  hiring_funnel_evidence_qualified: { en: 'Evidence qualified', fr: 'Qualifié par preuves' },
  hiring_funnel_work_samples: { en: 'Work samples', fr: 'Échantillons de travail' },
  hiring_funnel_interviews: { en: 'Interviews', fr: 'Entretiens' },
  hiring_funnel_hires: { en: 'Hires', fr: 'Embauches' },
  
  hiring_funnel_conversion: { en: 'Conversion rate', fr: 'Taux de conversion' },
  hiring_funnel_time_to_hire: { en: 'Average time to hire', fr: 'Temps moyen d\'embauche' },
  hiring_funnel_stage_duration: { en: 'Stage duration', fr: 'Durée de l\'étape' },

  /* ── Job Postings ─────────────────────────────────────────────────────── */
  hiring_postings_title: { en: 'Job postings', fr: 'Offres d\'emploi' },
  hiring_postings_create: { en: 'Create job posting', fr: 'Créer une offre d\'emploi' },
  hiring_postings_no_postings: { en: 'No active job postings', fr: 'Aucune offre d\'emploi active' },
  
  hiring_posting_title: { en: 'Title', fr: 'Titre' },
  hiring_posting_department: { en: 'Department', fr: 'Département' },
  hiring_posting_location: { en: 'Location', fr: 'Lieu' },
  hiring_posting_type: { en: 'Type', fr: 'Type' },
  hiring_posting_status: { en: 'Status', fr: 'Statut' },
  hiring_posting_posted: { en: 'Posted', fr: 'Publié' },
  hiring_posting_closing: { en: 'Closing', fr: 'Clôture' },
  
  hiring_posting_active: { en: 'Active', fr: 'Actif' },
  hiring_posting_closed: { en: 'Closed', fr: 'Fermé' },
  hiring_posting_draft: { en: 'Draft', fr: 'Brouillon' },

  /* ── Actions ─────────────────────────────────────────────────────────── */
  hiring_advance_stage: { en: 'Advance to next stage', fr: 'Avancer à l\'étape suivante' },
  hiring_reject_candidate: { en: 'Reject candidate', fr: 'Rejeter le candidat' },
  hiring_assign_recruiter: { en: 'Assign recruiter', fr: 'Assigner un recruteur' },
  hiring_send_work_sample: { en: 'Send work sample', fr: 'Envoyer l\'échantillon de travail' },
  hiring_schedule_interview: { en: 'Schedule interview', fr: 'Planifier l\'entretien' },
  hiring_make_offer: { en: 'Make offer', fr: 'Faire une offre' },
  
  hiring_action_confirm: { en: 'Confirm', fr: 'Confirmer' },
  hiring_action_cancel: { en: 'Cancel', fr: 'Annuler' },
  hiring_action_save: { en: 'Save', fr: 'Enregistrer' },

  hiring_add_candidate: { en: 'Add candidate', fr: 'Ajouter un candidat' },
  hiring_add_candidate_name: { en: 'Name', fr: 'Nom' },
  hiring_add_candidate_email: { en: 'Email', fr: 'Courriel' },
  hiring_add_candidate_location: { en: 'Location', fr: 'Lieu' },
  hiring_add_candidate_position: { en: 'Position', fr: 'Poste' },
  hiring_add_candidate_current_role: { en: 'Current role', fr: 'Poste actuel' },
  hiring_add_candidate_years_experience: { en: 'Years of experience', fr: 'Années d\'expérience' },
  hiring_add_candidate_work_authorization: { en: 'Work authorization', fr: 'Autorisation de travail' },
  hiring_add_candidate_resume: { en: 'Resume text or URL', fr: 'Texte du CV ou URL' },
  hiring_add_candidate_success: { en: 'Candidate added.', fr: 'Candidat ajouté.' },
  hiring_add_candidate_error: { en: 'Couldn\'t add candidate.', fr: 'Impossible d\'ajouter le candidat.' },

  /* ── Empty States ─────────────────────────────────────────────────────── */
  hiring_empty_evidence: {
    en: 'No evidence screening yet',
    fr: 'Aucune analyse des preuves encore',
  },
  hiring_empty_evidence_body: {
    en: 'Evidence screening will be available once the candidate passes basic qualification.',
    fr: 'L\'analyse des preuves sera disponible une fois le candidat aura passé la qualification de base.',
  },
  hiring_empty_work_sample: {
    en: 'No work sample assigned',
    fr: 'Aucun échantillon de travail assigné',
  },
  hiring_empty_work_sample_body: {
    en: 'Assign a job-realistic work sample to assess the candidate\'s actual capability.',
    fr: 'Assignez un échantillon de travail réaliste pour évaluer la capacité réelle du candidat.',
  },
  hiring_empty_interview: {
    en: 'No interview scheduled',
    fr: 'Aucun entretien planifié',
  },
  hiring_empty_interview_body: {
    en: 'Schedule a defense interview to assess the candidate\'s reasoning and authenticity.',
    fr: 'Planifiez un entretien de défense pour évaluer le raisonnement et l\'authenticité du candidat.',
  },
  hiring_empty_scores: {
    en: 'Scores not yet calculated',
    fr: 'Scores pas encore calculés',
  },
  hiring_empty_scores_body: {
    en: 'Authenticity scores will be calculated after the interview stage.',
    fr: 'Les scores d\'authenticité seront calculés après l\'étape de l\'entretien.',
  },

  /* ── Production Mode Messages ─────────────────────────────────────────── */
  hiring_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  hiring_prod_error: { en: 'Couldn’t load hiring data.', fr: 'Impossible de charger les données de recrutement.' },
  hiring_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  hiring_prod_empty_title: { en: 'No hiring activity yet', fr: 'Aucune activité de recrutement encore' },
  hiring_prod_empty_body: {
    en: 'Create job postings and start receiving applications to build your hiring pipeline.',
    fr: 'Créez des offres d\'emploi et commencez à recevoir des candidatures pour construire votre pipeline de recrutement.',
  },
})
