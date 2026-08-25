import { BETA_COHORT_LIMIT } from '@/config/beta'
import { defineMessages } from '../core'

/**
 * Marketing landing page strings. EN and FR are ported verbatim from the
 * prototype's i18n dictionaries in `Landing Page (redesign) v2.dc.html`
 * (design handoff). Do not edit copy here without updating the handoff.
 */
export const landing = defineMessages({
  landing_nav_how: {
    en: 'How it works',
    fr: 'Fonctionnement',
  },
  landing_nav_workflows: {
    en: 'Workflows',
    fr: 'Processus',
  },
  landing_nav_docs: {
    en: 'Document Studio',
    fr: 'Studio de documents',
  },
  landing_nav_coverage: {
    en: 'Coverage',
    fr: 'Couverture',
  },
  landing_nav_pricing: {
    en: 'Pricing',
    fr: 'Tarifs',
  },
  landing_nav_guides: {
    en: 'Guides',
    fr: 'Guides',
  },
  landing_signin: {
    en: 'Sign in',
    fr: 'Se connecter',
  },
  landing_start_free: {
    en: 'Start free',
    fr: 'Commencer',
  },
  landing_hero_badge: {
    en: 'AI-powered · Human support when needed · Canadian · Compliance-oriented',
    fr: "Propulsé par l'IA · Soutien humain au besoin · Canadien · Axé sur la conformité",
  },
  landing_h_dir_a: {
    en: 'Canadian HR compliance support ',
    fr: 'Soutien à la conformité RH canadienne ',
  },
  landing_h_dir_b: {
    en: 'for documents, deadlines, and workplace decisions.',
    fr: 'pour les documents, les échéances et les décisions en milieu de travail.',
  },
  landing_h_inf_a: {
    en: 'Foundational HR infrastructure',
    fr: 'Une infrastructure RH fondamentale',
  },
  landing_h_inf_b: {
    en: ' for Canadian employers.',
    fr: ' pour les employeurs canadiens.',
  },
  landing_h_q_a: {
    en: 'Answer Canadian HR questions',
    fr: 'Répondez aux questions RH canadiennes',
  },
  landing_h_q_b: {
    en: ' with confidence.',
    fr: ' en toute confiance.',
  },
  landing_sub_dir_strong: {
    en: 'Foundational HR infrastructure for Canadian employers',
    fr: 'Une infrastructure RH fondamentale pour les employeurs canadiens',
  },
  landing_sub_dir_rest: {
    en: '. Dutiva helps Canadian employers manage HR compliance across the employee lifecycle — from onboarding and documentation to retention, workplace management, and offboarding — through practical, jurisdiction-specific guidance.',
    fr: ". Dutiva aide les employeurs canadiens à gérer la conformité RH tout au long du cycle de vie de l'employé — de l'embauche et de la documentation au maintien en poste, à la gestion du milieu de travail et à la cessation d'emploi — grâce à des conseils pratiques et adaptés à la compétence applicable.",
  },
  landing_sub_inf: {
    en: 'Jurisdiction-aware HR guidance and review-ready documents across the full employee lifecycle — grounded in the actual employment standards, in English or French.',
    fr: "Des conseils RH adaptés à la compétence et des documents prêts à réviser tout au long du cycle de vie de l'employé — ancrés dans les normes du travail applicables, en français ou en anglais.",
  },
  landing_sub_q: {
    en: 'Dutiva gives Canadian employers jurisdiction-aware HR guidance and review-ready documents — grounded in the actual employment standards, in English or French.',
    fr: 'Dutiva offre aux employeurs canadiens des conseils RH adaptés à la compétence et des documents prêts à réviser — ancrés dans les normes du travail applicables, en français ou en anglais.',
  },
  landing_cta_nocard: {
    en: 'Start free — no card',
    fr: 'Commencer — sans carte',
  },
  landing_cta_seehow: {
    en: 'See how it works',
    fr: 'Voir le fonctionnement',
  },
  landing_hero_disclaimer: {
    en: 'Practical HR workflow support & compliance-oriented guidance. Not legal, tax, medical, or financial advice.',
    fr: 'Soutien pratique aux processus RH et conseils axés sur la conformité. Ne constitue pas un avis juridique, fiscal, médical ou financier.',
  },
  landing_stat_templates: {
    en: 'Templates',
    fr: 'Modèles',
  },
  landing_stat_legal: {
    en: 'Legal contexts',
    fr: 'Contextes juridiques',
  },
  landing_stat_workflows: {
    en: 'Workflows',
    fr: 'Processus',
  },
  landing_stat_bilingual: {
    en: 'Bilingual',
    fr: 'Bilingue',
  },
  landing_beta_honeypot: {
    en: 'Do not fill this field',
    fr: 'Ne pas remplir ce champ',
  },
  landing_hero_check1: {
    en: 'Ask compliance-oriented HR questions with jurisdiction-specific context',
    fr: 'Posez des questions RH axées sur la conformité, avec un contexte propre à la compétence applicable',
  },
  landing_hero_check2: {
    en: 'Generate structured HR document drafts in minutes',
    fr: 'Générez des ébauches de documents RH structurés en quelques minutes',
  },
  landing_hero_check3: {
    en: 'Work in English or French across document workflows',
    fr: "Travaillez en français ou en anglais dans l'ensemble des processus documentaires",
  },
  landing_adv_name: {
    en: 'Dutiva Advisor',
    fr: 'Conseiller Dutiva',
  },
  landing_adv_juris: {
    en: 'Ontario jurisdiction',
    fr: 'Compétence : Ontario',
  },
  landing_adv_live: {
    en: 'Live',
    fr: 'En direct',
  },
  landing_adv_user_q: {
    en: 'What should I prepare before terminating an employee in Ontario?',
    fr: "Que dois-je préparer avant de mettre fin à l'emploi d'un salarié en Ontario ?",
  },
  landing_adv_risk: {
    en: 'Medium risk',
    fr: 'Risque moyen',
  },
  landing_adv_answer: {
    en: 'Dutiva can help you identify the applicable Ontario employment standards, prepare a termination checklist, and flag issues that may need legal review. Complex or high-risk situations should be reviewed with qualified counsel.',
    fr: "Dutiva peut vous aider à repérer les normes du travail applicables en Ontario, à préparer une liste de vérification de cessation d'emploi et à signaler les enjeux pouvant nécessiter un examen juridique. Les situations complexes ou à risque élevé devraient être révisées avec un conseiller juridique qualifié.",
  },
  landing_adv_chip1: {
    en: 'Termination Letter',
    fr: "Lettre de cessation d'emploi",
  },
  landing_adv_chip2: {
    en: 'Offboarding Checklist',
    fr: 'Liste de vérification de départ',
  },
  landing_adv_generate: {
    en: 'Generate',
    fr: 'Générer',
  },
  landing_adv_followup: {
    en: 'Ask a follow-up question…',
    fr: 'Poser une question de suivi…',
  },
  landing_adv_source: {
    en: 'Source: Employment Standards Act, 2000 (ON), Part XV',
    fr: "Source : Loi de 2000 sur les normes d'emploi (ON), partie XV",
  },
  landing_trust_lead: {
    en: 'Built by a Canadian HR compliance operator',
    fr: 'Conçu par un spécialiste canadien de la conformité RH',
  },
  landing_trust_ottawa: {
    en: 'Built in Ottawa',
    fr: 'Conçu à Ottawa',
  },
  landing_trust_pipeda: {
    en: 'PIPEDA-conscious',
    fr: 'Conforme à la LPRPDE',
  },
  landing_trust_law25: {
    en: 'Quebec Law 25-aware',
    fr: 'Tient compte de la Loi 25 du Québec',
  },
  landing_trust_bilingual: {
    en: 'Bilingual EN/FR',
    fr: 'Bilingue EN/FR',
  },
  landing_how_badge: {
    en: 'How it works',
    fr: 'Fonctionnement',
  },
  landing_how_title: {
    en: 'From question to review-ready document in three steps.',
    fr: 'De la question au document prêt à réviser en trois étapes.',
  },
  landing_how_sub: {
    en: 'No blank page, no guesswork. Dutiva structures the work and shows you what to verify before anything leaves your hands.',
    fr: 'Pas de page blanche, pas de suppositions. Dutiva structure le travail et vous indique quoi vérifier avant que quoi que ce soit ne quitte vos mains.',
  },
  landing_how1_t: {
    en: 'Ask, with jurisdiction',
    fr: 'Demander, selon la compétence',
  },
  landing_how1_p: {
    en: 'Ask a plain-language HR question and pick Ontario, Quebec, or federal — or start a guided workflow for multi-step processes like termination or accommodation.',
    fr: "Posez une question RH en langage clair et choisissez l'Ontario, le Québec ou le fédéral — ou démarrez un processus guidé pour les démarches à plusieurs étapes comme une cessation d'emploi ou un accommodement.",
  },
  landing_how2_t: {
    en: 'Advisor assesses and flags risk',
    fr: 'Le Conseiller évalue et signale les risques',
  },
  landing_how2_p: {
    en: 'Advisor asks a few clarifying questions, then returns a risk level and reasoning you can expand — grounded in the standards that actually apply.',
    fr: 'Le Conseiller pose quelques questions de précision, puis fournit un niveau de risque et un raisonnement consultable — fondés sur les normes réellement applicables.',
  },
  landing_how3_t: {
    en: 'Draft, review, and export',
    fr: 'Rédiger, réviser et exporter',
  },
  landing_how3_p: {
    en: 'Generate the relevant documents in Document Studio, review them beside the guidance that shaped them, then save or export.',
    fr: 'Générez les documents pertinents dans le Studio de documents, révisez-les à côté des conseils qui les ont façonnés, puis enregistrez-les ou exportez-les.',
  },
  landing_prod_badge: {
    en: 'Document Studio',
    fr: 'Studio de documents',
  },
  landing_prod_title: {
    en: 'Everything you need to document HR properly.',
    fr: "Tout ce qu'il faut pour bien documenter vos RH.",
  },
  landing_prod_sub: {
    en: '50 HR templates, generated through guided questions and reviewed beside the guidance that shaped them.',
    fr: '50 modèles RH, générés par des questions guidées et révisés à côté des conseils qui les ont façonnés.',
  },
  landing_prod1_t: {
    en: '50 HR templates',
    fr: '50 modèles RH',
  },
  landing_prod1_p: {
    en: 'Offer letters, termination letters, PIPs, and policies — generated through guided questions, not a blank-page editor.',
    fr: "Lettres d'offre, lettres de cessation d'emploi, plans d'amélioration du rendement et politiques — générés par des questions guidées, sans éditeur à page blanche.",
  },
  landing_prod2_t: {
    en: 'Employment-standards context',
    fr: 'Contexte des normes du travail',
  },
  landing_prod2_p: {
    en: 'Ontario, Quebec, federal, and remote-federal coverage. Review the relevant standards context before use.',
    fr: "Couverture de l'Ontario, du Québec, du fédéral et du fédéral à distance. Consultez le contexte des normes applicables avant utilisation.",
  },
  landing_prod3_t: {
    en: 'AI-guided generation',
    fr: 'Génération assistée par IA',
  },
  landing_prod3_p: {
    en: 'Answer guided questions about the situation. Dutiva structures the draft, fills key fields, and flags what to verify.',
    fr: "Répondez à des questions guidées sur la situation. Dutiva structure l'ébauche, remplit les champs clés et signale quoi vérifier.",
  },
  landing_prod4_t: {
    en: 'Workspace review',
    fr: "Révision dans l'espace de travail",
  },
  landing_prod4_p: {
    en: 'Preview generated documents beside compliance guidance before saving or exporting.',
    fr: 'Prévisualisez les documents générés à côté des conseils de conformité avant de les enregistrer ou de les exporter.',
  },
  landing_prod5_t: {
    en: 'Embedded e-signatures',
    fr: 'Signatures électroniques intégrées',
  },
  landing_prod5_p: {
    en: 'Send documents for signature, collect drawn or typed signatures, and track status inside the same workflow.',
    fr: 'Envoyez des documents pour signature, recueillez des signatures manuscrites ou saisies et suivez leur statut dans le même processus.',
  },
  landing_wf_badge: {
    en: 'Guided workflows',
    fr: 'Processus guidés',
  },
  landing_wf_title: {
    en: 'Multi-step HR processes, tracked end to end.',
    fr: 'Des processus RH à plusieurs étapes, suivis de bout en bout.',
  },
  landing_wf_sub: {
    en: 'Start a workflow and Advisor guides you through each step — the conversation, the documents, the risk flags — through to done.',
    fr: "Démarrez un processus et le Conseiller vous guide à chaque étape — la conversation, les documents, les signaux de risque — jusqu'à la fin.",
  },
  landing_wf1_label: {
    en: 'Hiring',
    fr: 'Embauche',
  },
  landing_wf1_sub: {
    en: 'Offer → onboarding',
    fr: 'Offre → intégration',
  },
  landing_wf2_label: {
    en: 'Termination',
    fr: "Cessation d'emploi",
  },
  landing_wf2_sub: {
    en: 'Notice → final pay',
    fr: 'Préavis → paie finale',
  },
  landing_wf3_label: {
    en: 'Accommodation',
    fr: 'Accommodement',
  },
  landing_wf3_sub: {
    en: 'Duty to accommodate',
    fr: "Obligation d'adaptation",
  },
  landing_wf4_label: {
    en: 'Performance',
    fr: 'Rendement',
  },
  landing_wf4_sub: {
    en: 'PIP & check-ins',
    fr: 'PAR et suivis',
  },
  landing_wf5_label: {
    en: 'Leave',
    fr: 'Congé',
  },
  landing_wf5_sub: {
    en: 'Request → return',
    fr: 'Demande → retour',
  },
  landing_wf6_label: {
    en: 'Investigation',
    fr: 'Enquête',
  },
  landing_wf6_sub: {
    en: 'Intake → findings',
    fr: 'Signalement → conclusions',
  },
  landing_wf7_label: {
    en: 'Promotion',
    fr: 'Promotion',
  },
  landing_wf7_sub: {
    en: 'Comp & letter',
    fr: 'Rémunération et lettre',
  },
  landing_wf8_label: {
    en: 'Policy update',
    fr: 'Politique',
  },
  landing_wf8_sub: {
    en: 'Draft → acknowledge',
    fr: 'Rédaction → accusés',
  },
  landing_wf_ex_name: {
    en: 'Termination',
    fr: "Cessation d'emploi",
  },
  landing_wf_ex_risk: {
    en: 'High risk',
    fr: 'Risque élevé',
  },
  landing_wf_ex_meta: {
    en: "Ontario · Full-time · 7+ years' service",
    fr: 'Ontario · Temps plein · 7 ans et plus de service',
  },
  landing_wf_ex_step: {
    en: 'Step 4 of 7',
    fr: 'Étape 4 sur 7',
  },
  landing_wf_ex_next_label: {
    en: 'Next:',
    fr: 'Prochaine étape :',
  },
  landing_wf_ex_next: {
    en: 'Legal review requested',
    fr: 'Examen juridique demandé',
  },
  landing_mod_badge: {
    en: 'One workspace',
    fr: 'Un seul espace de travail',
  },
  landing_mod_title: {
    en: 'Advisor sits on top of the records and programs that run HR day to day.',
    fr: "Le Conseiller s'appuie sur les dossiers et les programmes qui font fonctionner les RH au quotidien.",
  },
  landing_mod1_label: {
    en: 'Compliance',
    fr: 'Conformité',
  },
  landing_mod2_label: {
    en: 'People & Case Files',
    fr: 'Personnel et dossiers',
  },
  landing_mod3_label: {
    en: 'Knowledge',
    fr: 'Connaissances',
  },
  landing_mod4_label: {
    en: 'Compensation',
    fr: 'Rémunération',
  },
  landing_mod5_label: {
    en: 'Communications',
    fr: 'Communications',
  },
  landing_mod6_label: {
    en: 'Wellbeing',
    fr: 'Bien-être',
  },
  landing_mod7_label: {
    en: 'Analytics',
    fr: 'Analytique',
  },
  landing_mod_roadmap: {
    en: 'Roadmap',
    fr: 'À venir',
  },
  landing_mod_roadmap_note: {
    en: 'Modules marked roadmap are in design and not yet available. Everything else runs in your workspace today.',
    fr: 'Les modules marqués « à venir » sont en conception et ne sont pas encore offerts. Tout le reste fonctionne dans votre espace de travail dès aujourd’hui.',
  },
  landing_cat_label: {
    en: 'Available template categories',
    fr: 'Catégories de modèles disponibles',
  },
  landing_cat_hiring: {
    en: 'Hiring',
    fr: 'Embauche',
  },
  landing_cat_policies: {
    en: 'Policies',
    fr: 'Politiques',
  },
  landing_cat_discipline: {
    en: 'Discipline',
    fr: 'Discipline',
  },
  landing_cat_termination: {
    en: 'Termination',
    fr: "Cessation d'emploi",
  },
  landing_cat_browse: {
    en: 'Browse all templates',
    fr: 'Parcourir tous les modèles',
  },
  landing_why_badge: {
    en: 'Why Dutiva',
    fr: 'Pourquoi Dutiva',
  },
  landing_why_title_a: {
    en: 'Built by an HR operator ',
    fr: 'Conçu par un professionnel RH ',
  },
  landing_why_title_b: {
    en: 'who has done the work.',
    fr: 'qui a fait le travail.',
  },
  landing_why_p: {
    en: 'Dutiva was built by a Canadian HR professional who has prepared Records of Employment, drafted termination letters, and worked across federal and provincial employment standards. Dutiva is HR compliance and documentation software — not a payroll provider. It names the statute, not just the province — and speaks French as fluently as English.',
    fr: 'Dutiva a été conçu par un professionnel canadien des RH qui a préparé des relevés d’emploi, rédigé des lettres de cessation d’emploi et travaillé avec les normes du travail fédérales et provinciales. Dutiva est un logiciel de conformité et de documentation RH — et non un fournisseur de paie. Il nomme la loi, pas seulement la province — et parle français aussi couramment que l’anglais.',
  },
  landing_why_foot: {
    en: 'Built in Ottawa, Canada · Grounded in real HR operations, not generic research.',
    fr: 'Conçu à Ottawa, au Canada · Ancré dans de véritables opérations RH, pas dans des recherches génériques.',
  },
  landing_why1_t: {
    en: 'Names the statute',
    fr: 'Nomme la loi',
  },
  landing_why1_p: {
    en: 'Employment Standards Act, 2000 · Canada Labour Code, Part III · Act respecting labour standards.',
    fr: "Loi de 2000 sur les normes d'emploi · Code canadien du travail, Partie III · Loi sur les normes du travail.",
  },
  landing_why2_t: {
    en: 'Bilingual by default',
    fr: 'Bilingue par défaut',
  },
  landing_why2_p: {
    en: 'Every workflow ships in professional, Québec-appropriate French and English.',
    fr: 'Chaque flux de travail est offert en français professionnel adapté au Québec et en anglais.',
  },
  landing_why3_t: {
    en: 'Compliance-conscious',
    fr: 'Soucieux de la conformité',
  },
  landing_why3_p: {
    en: 'PIPEDA-conscious and Quebec Law 25-aware, with escalation cues on high-risk guidance.',
    fr: "Conforme à la LPRPDE et tient compte de la Loi 25 du Québec, avec des indications d'escalade sur les conseils à risque élevé.",
  },
  landing_cov_badge: {
    en: 'Canadian coverage',
    fr: 'Couverture canadienne',
  },
  landing_cov_title: {
    en: 'Built for Canadian HR compliance workflows.',
    fr: 'Conçu pour les flux de conformité RH canadiens.',
  },
  landing_cov_sub: {
    en: 'Dutiva is purpose-built for Canadian employment standards workflows — not retrofitted from U.S. software.',
    fr: "Dutiva est conçu spécifiquement pour les flux liés aux normes du travail canadiennes — pas adapté d'un logiciel américain.",
  },
  landing_cov_on_name: {
    en: 'Ontario',
    fr: 'Ontario',
  },
  landing_cov_on_stat: {
    en: 'Employment Standards Act, 2000',
    fr: "Loi de 2000 sur les normes d'emploi",
  },
  landing_cov_on_1: {
    en: 'Termination notice and pay in lieu',
    fr: "Préavis de cessation d'emploi et indemnité en tenant lieu",
  },
  landing_cov_on_2: {
    en: 'Severance pay eligibility',
    fr: "Admissibilité à l'indemnité de licenciement",
  },
  landing_cov_on_3: {
    en: 'Vacation time and vacation pay',
    fr: 'Congé annuel et indemnité de vacances',
  },
  landing_cov_on_4: {
    en: 'Public holidays and holiday pay',
    fr: 'Jours fériés et indemnité de jour férié',
  },
  landing_cov_on_5: {
    en: 'Sick leave, family responsibility leave, and bereavement leave',
    fr: 'Congé de maladie, congé pour obligations familiales et congé de deuil',
  },
  landing_cov_qc_name: {
    en: 'Quebec',
    fr: 'Québec',
  },
  landing_cov_qc_stat: {
    en: 'Act respecting labour standards',
    fr: 'Loi sur les normes du travail',
  },
  landing_cov_qc_1: {
    en: 'Notice of termination by service',
    fr: "Préavis de fin d'emploi selon l'ancienneté",
  },
  landing_cov_qc_2: {
    en: 'Annual leave and vacation indemnity',
    fr: 'Congé annuel et indemnité de vacances',
  },
  landing_cov_qc_3: {
    en: 'Statutory holidays and paid leave',
    fr: 'Jours fériés et congés payés',
  },
  landing_cov_qc_4: {
    en: 'Psychological harassment at work',
    fr: 'Harcèlement psychologique au travail',
  },
  landing_cov_fed_name: {
    en: 'Federal Canada',
    fr: 'Canada fédéral',
  },
  landing_cov_fed_stat: {
    en: 'Canada Labour Code, Part III',
    fr: 'Code canadien du travail, Partie III',
  },
  landing_cov_fed_1: {
    en: 'Individual termination notice',
    fr: 'Préavis de licenciement individuel',
  },
  landing_cov_fed_2: {
    en: 'Unjust dismissal considerations',
    fr: 'Considérations relatives au congédiement injuste',
  },
  landing_cov_fed_3: {
    en: 'Bereavement & compassionate leave',
    fr: 'Congé de décès et congé de compassion',
  },
  landing_cov_fed_4: {
    en: 'Federally regulated workplaces',
    fr: 'Milieux de travail sous réglementation fédérale',
  },
  landing_cov_rem_name: {
    en: 'Remote work — federal',
    fr: 'Télétravail — fédéral',
  },
  landing_cov_rem_stat: {
    en: 'For federally regulated employers',
    fr: 'Pour les employeurs sous réglementation fédérale',
  },
  landing_cov_rem_1: {
    en: 'Remote work policy templates',
    fr: 'Modèles de politique de télétravail',
  },
  landing_cov_rem_2: {
    en: 'Federal employment standards context',
    fr: 'Contexte des normes du travail fédérales',
  },
  landing_cov_rem_3: {
    en: 'Cross-provincial arrangements',
    fr: 'Ententes interprovinciales',
  },
  landing_cov_rem_4: {
    en: 'Onboarding documentation support',
    fr: "Soutien à la documentation d'intégration",
  },
  landing_cov_soon: {
    en: 'Coming soon: Alberta and British Columbia. Additional provinces and territories to follow.',
    fr: "À venir : l'Alberta et la Colombie-Britannique. D'autres provinces et territoires suivront.",
  },
  landing_price_badge: {
    en: 'Pricing',
    fr: 'Tarifs',
  },
  landing_price_title: {
    en: 'Start structured. Upgrade as your HR workflow grows.',
    fr: 'Commencez de façon structurée. Évoluez à mesure que vos RH grandissent.',
  },
  landing_price_sub: {
    en: 'No long-term contracts. No setup fees. Cancel anytime. Prices in CAD.',
    fr: 'Aucun contrat à long terme. Aucuns frais d’installation. Annulez à tout moment. Prix en CAD.',
  },
  landing_mo: {
    en: '/mo',
    fr: '/mois',
  },
  landing_free_name: {
    en: 'Free / Beta',
    fr: 'Gratuit / Bêta',
  },
  landing_free_amt: {
    en: 'Free',
    fr: 'Gratuit',
  },
  landing_free_desc: {
    en: 'For individuals exploring Canadian HR compliance tools.',
    fr: 'Pour les personnes qui explorent les outils de conformité RH canadiens.',
  },
  landing_free_f1: {
    en: 'Limited Advisor access',
    fr: 'Accès limité au Conseiller',
  },
  landing_free_f2: {
    en: 'One document generation',
    fr: 'Une génération de document',
  },
  landing_free_f3: {
    en: 'Basic Canadian HR templates',
    fr: 'Modèles RH canadiens de base',
  },
  landing_free_cta: {
    en: 'Get started',
    fr: 'Commencer',
  },
  landing_starter_name: {
    en: 'Starter',
    fr: 'Starter',
  },
  landing_starter_desc: {
    en: 'For small teams setting up a structured HR workflow.',
    fr: 'Pour les petites équipes qui structurent leur processus RH.',
  },
  landing_starter_f1: {
    en: 'Core Advisor access',
    fr: 'Accès de base au Conseiller',
  },
  landing_starter_f2: {
    en: 'Limited document generation',
    fr: 'Génération de documents limitée',
  },
  landing_starter_f3: {
    en: 'Core Canadian HR templates',
    fr: 'Modèles RH canadiens essentiels',
  },
  landing_starter_cta: {
    en: 'Start Starter',
    fr: 'Choisir Starter',
  },
  landing_growth_name: {
    en: 'Growth',
    fr: 'Growth',
  },
  landing_growth_popular: {
    en: 'Most popular',
    fr: 'Le plus populaire',
  },
  landing_growth_desc: {
    en: 'For small businesses managing recurring HR workflows.',
    fr: 'Pour les PME qui gèrent des processus RH récurrents.',
  },
  landing_growth_f1: {
    en: 'Expanded Advisor usage',
    fr: 'Utilisation étendue du Conseiller',
  },
  landing_growth_f2: {
    en: 'Save & export HR documents',
    fr: 'Sauvegarde et exportation des documents RH',
  },
  landing_growth_f3: {
    en: 'Workspace preview & guidance',
    fr: "Aperçu et conseils dans l'espace de travail",
  },
  landing_growth_cta: {
    en: 'Upgrade to Growth',
    fr: 'Passer à Growth',
  },
  landing_pro_name: {
    en: 'Professional',
    fr: 'Professional',
  },
  landing_pro_desc: {
    en: 'For businesses needing deeper guidance and higher limits.',
    fr: 'Pour les entreprises nécessitant des conseils approfondis et des limites plus élevées.',
  },
  landing_pro_f1: {
    en: 'Higher Advisor limits',
    fr: 'Limites plus élevées du Conseiller',
  },
  landing_pro_f2: {
    en: 'Advanced document workflows',
    fr: 'Processus documentaires avancés',
  },
  landing_pro_f3: {
    en: 'Priority compliance guidance',
    fr: 'Conseils de conformité prioritaires',
  },
  landing_pro_cta: {
    en: 'Upgrade to Professional',
    fr: 'Passer à Professional',
  },
  landing_price_foot1: {
    en: 'Canadian HR compliance focus',
    fr: 'Axé sur la conformité RH canadienne',
  },
  landing_price_foot2: {
    en: 'Cancel anytime',
    fr: 'Annulation en tout temps',
  },
  landing_price_compare: {
    en: 'Compare all plans',
    fr: 'Comparer tous les forfaits',
  },
  landing_guides_badge: {
    en: 'Guides',
    fr: 'Guides',
  },
  landing_guides_title: {
    en: 'Canadian HR compliance guides.',
    fr: 'Guides de conformité RH canadienne.',
  },
  /* Deliberately describes the guides' half of the editorial split (documents
     and decisions), not the blog's (which obligations apply). This string used
     to paraphrase `blog_intro` almost exactly, which made the landing teaser,
     /guides and /blog all read as the same promise. See
     `features/marketing/articles/articleModel.ts`. */
  landing_guides_sub: {
    en: 'Plain-language explainers on the documents and decisions Canadian employers have to get right — contracts, probation, accommodation, and termination.',
    fr: 'Des explications en langage clair sur les documents et les décisions que les employeurs canadiens doivent réussir — contrats, probation, accommodement et cessation d’emploi.',
  },
  landing_guides_browse: {
    en: 'Browse all guides',
    fr: 'Parcourir tous les guides',
  },
  /* Names what the blog is for rather than where it is: an unqualified "Visit
     the blog" next to six guide cards gave a reader no reason to click. */
  landing_guides_blog: {
    en: 'Blog: what applies to your workplace',
    fr: 'Blogue : ce qui s’applique à votre entreprise',
  },
  landing_cta_badge: {
    en: 'Start structured',
    fr: 'Commencez de façon structurée',
  },
  landing_cta_title: {
    en: 'Create your first review-ready HR document in minutes.',
    fr: 'Créez votre premier document RH prêt à réviser en quelques minutes.',
  },
  landing_cta_p: {
    en: 'Join the beta free — no credit card. Open the Advisor, generate a document, and start building a cleaner HR foundation for your business.',
    fr: 'Rejoignez la version bêta gratuitement — sans carte de crédit. Ouvrez le Conseiller, générez un document et bâtissez une base RH plus solide pour votre entreprise.',
  },
  /* Postdates the design handoff: beta capacity decision, 2026-08-07. The
     number is interpolated from BETA_COHORT_LIMIT so this copy cannot drift
     from the gate that enforces it. [FR self-authored] */
  landing_cta_capacity: {
    en: `The beta is limited to ${BETA_COHORT_LIMIT} individuals and organizations to begin — once those spots are taken, new signups join the waiting list.`,
    fr: `La bêta est limitée à ${BETA_COHORT_LIMIT} personnes et organisations pour commencer — une fois ces places prises, les nouvelles inscriptions rejoignent la liste d’attente.`,
  },
  landing_cta_email_ph: {
    en: 'you@company.ca',
    fr: 'vous@entreprise.ca',
  },
  landing_cta_btn: {
    en: 'Start free',
    fr: 'Commencer',
  },
  landing_cta_disclaimer: {
    en: 'Practical HR workflow support & compliance-oriented guidance. It does not provide legal, tax, medical, or financial advice.',
    fr: 'Soutien pratique aux processus RH et conseils axés sur la conformité. Ne constitue pas un avis juridique, fiscal, médical ou financier.',
  },
  landing_foot_disclaimer: {
    en: 'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal, tax, medical, or financial advice.',
    fr: "Dutiva offre un soutien pratique aux processus RH et des conseils axés sur la conformité. L'entreprise ne fournit pas d'avis juridique, fiscal, médical ou financier.",
  },
  landing_cta_done_t: {
    en: "You're on the list.",
    fr: 'Vous êtes inscrit.',
  },
  landing_cta_done_p: {
    en: "We'll email your beta access to get started.",
    fr: 'Nous vous enverrons votre accès bêta par courriel.',
  },
  /* Postdates the design handoff: shown instead of landing_cta_done_* when
     the server reports the first cohort is already full, so a visitor who
     will wait is never promised access. [FR self-authored] */
  landing_cta_wait_t: {
    en: "You're on the waiting list.",
    fr: 'Vous êtes sur la liste d’attente.',
  },
  landing_cta_wait_p: {
    en: `The first ${BETA_COHORT_LIMIT} beta spots are taken. We'll email you as soon as a spot opens up.`,
    fr: `Les ${BETA_COHORT_LIMIT} premières places de la bêta sont prises. Nous vous écrirons dès qu’une place se libère.`,
  },
  landing_foot_desc: {
    en: 'Foundational HR infrastructure for Canadian employers, built for compliance-oriented guidance, workplace documentation, onboarding, employee support, and the full employee lifecycle.',
    fr: "Infrastructure RH fondamentale pour les employeurs canadiens, conçue pour des conseils axés sur la conformité, la documentation en milieu de travail, l'intégration, le soutien aux employés et l'ensemble du cycle de vie de l'employé.",
  },
  landing_foot_product: {
    en: 'Product',
    fr: 'Produit',
  },
  landing_fp_advisor: {
    en: 'Advisor',
    fr: 'Conseiller',
  },
  landing_fp_workflows: {
    en: 'Workflows',
    fr: 'Processus',
  },
  landing_fp_templates: {
    en: 'Document Studio',
    fr: 'Studio de documents',
  },
  landing_fp_beta: {
    en: 'Beta access',
    fr: 'Accès bêta',
  },
  landing_foot_resources: {
    en: 'Resources',
    fr: 'Ressources',
  },
  landing_fr_getstarted: {
    en: 'Getting Started',
    fr: 'Prise en main',
  },
  landing_fr_faq: {
    en: 'FAQ',
    fr: 'FAQ',
  },
  landing_fr_help: {
    en: 'Help Centre',
    fr: 'Centre d’aide',
  },
  landing_fr_status: {
    en: 'Service status',
    fr: 'État des services',
  },
  landing_fr_tmplusage: {
    en: 'Template Usage',
    fr: 'Utilisation des modèles',
  },
  landing_fr_limits: {
    en: 'Known Limitations',
    fr: 'Limites connues',
  },
  landing_fr_blog: {
    en: 'Blog',
    fr: 'Blogue',
  },
  landing_foot_company: {
    en: 'Company',
    fr: 'Entreprise',
  },
  landing_fc_about: {
    en: 'About Us',
    fr: 'À propos',
  },
  landing_fc_contact: {
    en: 'Contact',
    fr: 'Contact',
  },
  landing_fc_openapp: {
    en: 'Open app',
    fr: "Ouvrir l'application",
  },
  landing_foot_legal: {
    en: 'Legal',
    fr: 'Mentions légales',
  },
  landing_fl_privacy: {
    en: 'Privacy Policy',
    fr: 'Politique de confidentialité',
  },
  landing_fl_terms: {
    en: 'Terms of Service',
    fr: "Conditions d'utilisation",
  },
  landing_fl_cookie: {
    en: 'Cookie Policy',
    fr: 'Politique de témoins',
  },
  landing_fl_disclaimer: {
    en: 'Disclaimer',
    fr: 'Avis de non-responsabilité',
  },
  landing_fl_access: {
    en: 'Accessibility',
    fr: 'Accessibilité',
  },
  landing_fl_ai: {
    en: 'AI & Technology',
    fr: 'IA et technologie',
  },
  landing_fl_dpa: {
    en: 'Data Processing Agreement',
    fr: 'Entente de traitement des données',
  },
  landing_fl_retention: {
    en: 'Data Retention',
    fr: 'Conservation des données',
  },
  landing_foot_copyright: {
    en: '© 2026 Dutiva Canada Inc. All rights reserved.',
    fr: '© 2026 Dutiva Canada Inc. Tous droits réservés.',
  },
  landing_fl_pipeda: {
    en: 'PIPEDA',
    fr: 'LPRPDE',
  },
  landing_fl_law25: {
    en: 'Quebec Law 25',
    fr: 'Loi 25 (Québec)',
  },
  landing_fl_casl: {
    en: 'CASL',
    fr: 'LCAP',
  },
  landing_cta_email_label: {
    en: 'Work email',
    fr: 'Courriel professionnel',
  },
  landing_cta_company_label: {
    en: 'Company (optional)',
    fr: 'Entreprise (facultatif)',
  },
  landing_cta_company_ph: {
    en: 'Company name',
    fr: "Nom de l'entreprise",
  },
  landing_cta_prov_label: {
    en: 'Province / jurisdiction (optional)',
    fr: 'Province ou régime applicable (facultatif)',
  },
  landing_cta_prov_0: {
    en: 'Select…',
    fr: 'Sélectionner…',
  },
  landing_cta_prov_on: {
    en: 'Ontario',
    fr: 'Ontario',
  },
  landing_cta_prov_qc: {
    en: 'Quebec',
    fr: 'Québec',
  },
  landing_cta_prov_fed: {
    en: 'Federal',
    fr: 'Fédéral',
  },
  landing_cta_prov_other: {
    en: 'Other',
    fr: 'Autre',
  },
  /* The consent itself is the checkbox (landing_cta_consent_label) — CASL
     wants express consent, not consent implied by submitting. This line is
     only the privacy-handling notice that accompanies it. */
  landing_cta_consent: {
    en: 'Dutiva will handle your information according to its',
    fr: 'Dutiva traitera vos renseignements conformément à sa',
  },
  landing_cta_privacy_link: {
    en: 'Privacy Policy',
    fr: 'Politique de confidentialité',
  },
  landing_cta_sending: {
    en: 'Sending…',
    fr: 'Envoi…',
  },
  landing_cta_error: {
    en: 'Please enter a valid work email address.',
    fr: 'Veuillez saisir une adresse courriel valide.',
  },
  landing_cta_consent_label: {
    en: 'Yes, email me product updates about Dutiva. I can unsubscribe at any time.',
    fr: 'Oui, envoyez-moi des mises à jour sur Dutiva. Je peux me désabonner en tout temps.',
  },
  landing_cta_consent_err: {
    en: 'Please confirm you agree to receive product updates.',
    fr: 'Veuillez confirmer que vous acceptez de recevoir des mises à jour.',
  },
  landing_cta_rate_limited: {
    en: 'Too many attempts in a short time. Please try again later, or email support@dutiva.ca.',
    fr: 'Trop de tentatives en peu de temps. Réessayez plus tard ou écrivez à support@dutiva.ca.',
  },
  landing_cta_fail: {
    en: 'Could not record your signup. Please try again, or email support@dutiva.ca.',
    fr: "Impossible d'enregistrer votre inscription. Réessayez ou écrivez à support@dutiva.ca.",
  },
  landing_cta_captcha_required: {
    en: 'Please complete the human-verification check to continue.',
    fr: 'Veuillez compléter la vérification humaine pour continuer.',
  },
  landing_cta_captcha_failed: {
    en: 'Human verification failed. Please complete the check and try again.',
    fr: 'La vérification humaine a échoué. Complétez la vérification et réessayez.',
  },
})
