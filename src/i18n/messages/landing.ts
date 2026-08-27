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
    en: 'See plans',
    fr: 'Voir les forfaits',
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
    en: 'Canadian HR compliance support',
    fr: 'Soutien à la conformité RH canadienne',
  },
  landing_h_inf_b: {
    en: ' for employers who need it.',
    fr: ' pour les employeurs qui en ont besoin.',
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
    en: 'Stop losing sleep over changing labour laws.',
    fr: 'Arrêtez de perdre le sommeil à cause des normes du travail qui changent.',
  },
  landing_sub_dir_rest: {
    en: ' We guide you from a blank page to a review-ready document, safely. Practical guidance across the employee lifecycle — grounded in the exact statutes that apply to your workplace.',
    fr: ' Nous vous guidons d’une page blanche à un document prêt à réviser, en toute sécurité. Des conseils pratiques tout au long du cycle de vie de l’employé — ancrés dans les lois exactes qui s’appliquent à votre milieu de travail.',
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
    en: 'See plans',
    fr: 'Voir les forfaits',
  },
  landing_cta_seehow: {
    en: 'See how it works',
    fr: 'Voir le fonctionnement',
  },
  landing_hero_disclaimer: {
    en: 'Practical HR workflow support & compliance-oriented guidance. Not legal, tax, medical, or financial advice.',
    fr: 'Soutien pratique aux processus RH et conseils axés sur la conformité. Ne constitue pas un avis juridique, fiscal, médical ou financier.',
  },
  /* Scope pre-qualification below the hero CTAs (audit D2.B). [FR self-authored] */
  landing_hero_scope: {
    en: 'Not for US employers. Not a payroll processor. Not an enterprise HRIS replacement.',
    fr: 'Pas pour les employeurs américains. Pas un processeur de paie. Pas un remplacement de SIRH d’entreprise.',
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
  landing_adv_preview: {
    en: 'Sample preview',
    fr: 'Aperçu type',
  },
  landing_adv_preview_note: {
    en: 'Sample scenarios only — sign in for live jurisdiction, risk, and document generation.',
    fr: 'Scénarios types seulement — connectez-vous pour la compétence, le risque et la génération de documents en direct.',
  },
  landing_adv_scenarios_label: {
    en: 'Advisor sample scenarios',
    fr: 'Scénarios types du Conseiller',
  },
  landing_adv_risk_suffix: {
    en: 'risk',
    fr: 'risque',
  },
  landing_adv_risk_low: {
    en: 'Low risk',
    fr: 'Risque faible',
  },
  landing_adv_risk_medium: {
    en: 'Medium risk',
    fr: 'Risque moyen',
  },
  landing_adv_risk_high: {
    en: 'High risk',
    fr: 'Risque élevé',
  },
  landing_adv_source_prefix: {
    en: 'Source:',
    fr: 'Source :',
  },
  landing_adv_user_q: {
    en: 'What should I prepare before terminating an employee in Ontario?',
    fr: "Que dois-je préparer avant de mettre fin à l'emploi d'un salarié en Ontario ?",
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
    fr: 'Conscient de la LPRPDE',
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
    en: 'Compliance is stressful. Dutiva structures the work and shows you exactly what to verify before anything leaves your hands — so you never have to guess.',
    fr: 'La conformité est stressante. Dutiva structure le travail et vous montre exactement quoi vérifier avant que quoi que ce soit ne quitte vos mains — pour que vous n’ayez plus à deviner.',
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
  /* Below the 3-step grid — risk flagging differentiator (D1.5). Hedged: no
     unverifiable "only" superlative. [FR self-authored] */
  landing_how_risk_callout: {
    en: 'Dutiva flags the risk level of your decision before you act — so you know when to escalate to legal counsel instead of guessing.',
    fr: 'Dutiva signale le niveau de risque de votre décision avant que vous agissiez — pour savoir quand escalader vers un conseiller juridique au lieu de deviner.',
  },
  /* Homepage answer blocks: buyer-question headings with a 40–70 word
     answer directly underneath. Same pairs feed FAQPage JSON-LD.
     [FR self-authored] */
  landing_faq_badge: {
    en: 'Common questions',
    fr: 'Questions courantes',
  },
  landing_faq1_q: {
    en: 'What does Dutiva actually do?',
    fr: 'Qu’est-ce que Dutiva fait, concrètement ?',
  },
  landing_faq1_a: {
    en: 'Dutiva is HR compliance software for Canadian employers. You ask a workplace question, choose Ontario, Quebec, or the federal labour regime, and get jurisdiction-aware guidance plus a review-ready document draft. It covers hiring through termination, including policies, leaves, accommodation, and offboarding, in English or French, without replacing your lawyer. Dutiva provides compliance-oriented support. It does not provide legal advice.',
    fr: 'Dutiva est un logiciel de conformité RH pour les employeurs canadiens. Vous posez une question de milieu de travail, choisissez l’Ontario, le Québec ou le régime fédéral, et obtenez des conseils adaptés à la compétence plus une ébauche de document prêt à réviser. Ça couvre l’embauche jusqu’à la cessation d’emploi, y compris les politiques, les congés, l’accommodement et le départ, en français ou en anglais, sans remplacer votre avocat. Dutiva offre un soutien axé sur la conformité. Il ne fournit pas de conseils juridiques.',
  },
  landing_faq2_q: {
    en: 'Which Canadian jurisdictions does Dutiva cover?',
    fr: 'Quelles compétences canadiennes Dutiva couvre-t-il ?',
  },
  landing_faq2_a: {
    en: 'Dutiva currently covers three legal contexts: Ontario under the Employment Standards Act, 2000; Quebec under the Act respecting labour standards; and federally regulated workplaces under the Canada Labour Code, Part III, including federal remote work. Alberta and British Columbia are on the roadmap and are not covered yet. The product names the statute that applies to the employee, not just the province.',
    fr: 'Dutiva couvre actuellement trois contextes juridiques : l’Ontario en vertu de la Loi de 2000 sur les normes d’emploi; le Québec en vertu de la Loi sur les normes du travail; et les milieux de travail sous réglementation fédérale en vertu du Code canadien du travail, Partie III, y compris le télétravail fédéral. L’Alberta et la Colombie-Britannique sont sur la feuille de route et ne sont pas encore couvertes. Le produit nomme la loi qui s’applique à la personne salariée, pas seulement la province.',
  },
  landing_faq3_q: {
    en: 'Does Dutiva provide legal advice?',
    fr: 'Dutiva fournit-il des conseils juridiques ?',
  },
  landing_faq3_a: {
    en: 'No. Dutiva provides practical HR workflow support and compliance-oriented guidance. Advisor names the applicable statute, structures the work, and flags when a situation looks high-risk. Complex or high-risk matters should be reviewed with qualified counsel. Dutiva does not make employment decisions for you, and it is not a substitute for a lawyer.',
    fr: 'Non. Dutiva offre un soutien pratique aux processus RH et des conseils axés sur la conformité. Le Conseiller nomme la loi applicable, structure le travail et signale les situations qui semblent à risque élevé. Les enjeux complexes ou à risque élevé devraient être révisés avec un conseiller juridique qualifié. Dutiva ne prend pas de décisions d’emploi à votre place, et ce n’est pas un substitut à un avocat.',
  },
  landing_faq4_q: {
    en: 'How do I get started with Dutiva?',
    fr: 'Comment puis-je commencer avec Dutiva ?',
  },
  landing_faq4_a: {
    en: 'Pick a plan at dutiva.ca/pricing to start today — paying skips the waitlist and includes founder-led support. If you’d rather not pay yet, leave your email on the waitlist of 15 free seats and we’ll write when one opens. The full product is open to every admitted account. Dutiva provides compliance-oriented support. It does not provide legal advice.',
    fr: 'Choisissez un forfait sur dutiva.ca/tarifs pour commencer aujourd’hui — payer saute la liste d’attente et comprend un soutien mené par le fondateur. Si vous préférez ne pas payer pour l’instant, laissez votre courriel sur la liste d’attente de 15 places gratuites et nous vous écrirons dès qu’une place se libère. Le produit complet est ouvert à chaque compte admis. Dutiva offre un soutien axé sur la conformité. Il ne fournit pas de conseils juridiques.',
  },
  landing_faq5_q: {
    en: 'Is Dutiva reputable?',
    fr: 'Dutiva est-il une entreprise sérieuse ?',
  },
  landing_faq5_a: {
    en: 'Dutiva Canada Inc. is an active federal corporation under the Canada Business Corporations Act, number 1780679-5, incorporated 27 March 2026. Martin Constantineau is Founder and CEO and the sole director of record. Policies and a security overview are published on dutiva.ca. Dutiva does not invent customer reviews, and it does not provide legal advice.',
    fr: 'Dutiva Canada Inc. est une société fédérale active constituée en vertu de la Loi canadienne sur les sociétés par actions, numéro 1780679-5, constituée le 27 mars 2026. Martin Constantineau est fondateur et chef de la direction et l’unique administrateur inscrit. Les politiques et un aperçu de la sécurité sont publiés sur dutiva.ca. Dutiva n’invente pas d’avis clients, et ne fournit pas de conseils juridiques.',
  }, // [FR self-authored]
  landing_faq6_q: {
    en: 'How do I contact Dutiva support?',
    fr: 'Comment joindre le soutien Dutiva ?',
  },
  landing_faq6_a: {
    en: 'Email support@dutiva.ca or send a written request at dutiva.ca/contact without an account — product questions, privacy, security, and accessibility. We reply in writing to the same ticket. The Help Centre covers sign-in, documents, Advisor, billing, and privacy. General inbound phone support is not offered. When writing cannot reasonably resolve it, we may arrange a scheduled call.',
    fr: 'Écrivez à support@dutiva.ca ou envoyez une demande écrite sur dutiva.ca/contact sans compte — questions produit, confidentialité, sécurité et accessibilité. Nous répondons par écrit dans le même billet. Le Centre d’aide couvre la connexion, les documents, le Conseiller, la facturation et la confidentialité. Le soutien téléphonique entrant général n’est pas offert. Lorsque l’écrit ne peut raisonnablement pas régler la situation, nous pouvons organiser un appel planifié.',
  }, // [FR self-authored]
  landing_faq_more: {
    en: 'More questions on the FAQ',
    fr: 'D’autres questions dans la FAQ',
  },
  landing_prod_badge: {
    en: 'Document Studio',
    fr: 'Studio de documents',
  },
  landing_prod_title: {
    en: 'HR documents drafted through guided questions — ready to review.',
    fr: 'Des documents RH rédigés par questions guidées — prêts à réviser.',
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
  landing_wf_ex2_name: {
    en: 'Accommodation',
    fr: 'Accommodement',
  },
  landing_wf_ex2_risk: {
    en: 'Medium risk',
    fr: 'Risque moyen',
  },
  landing_wf_ex2_meta: {
    en: 'British Columbia · Modified duties · Doctor’s note on file',
    fr: 'Colombie-Britannique · Tâches modifiées · Billet médical au dossier',
  },
  landing_wf_ex2_step: {
    en: 'Step 2 of 5',
    fr: 'Étape 2 sur 5',
  },
  landing_wf_ex2_next_label: {
    en: 'Next:',
    fr: 'Prochaine étape :',
  },
  landing_wf_ex2_next: {
    en: 'Document functional limitations',
    fr: 'Documenter les limitations fonctionnelles',
  },
  landing_try_samples: {
    en: 'See sample document outputs',
    fr: 'Voir des exemples de documents',
  },
  landing_try_jurisdiction: {
    en: 'Try the jurisdiction tool',
    fr: 'Essayer l’outil de compétence',
  },
  landing_try_demo: {
    en: 'Try the demo workspace',
    fr: 'Essayer l’espace démo',
  },
  landing_demo_seo_title: {
    en: 'Try Dutiva — read-only demo workspace | Dutiva',
    fr: 'Essayer Dutiva — espace démo en lecture seule | Dutiva',
  },
  landing_demo_seo_description: {
    en: 'Explore Advisor, Document Studio, guided workflows, and HR cases with Northgate sample data in a read-only preview — no sign-in required.',
    fr: 'Parcourez le Conseiller, le Studio de documents, les processus et dossiers RH avec les données types Northgate — aperçu en lecture seule, sans connexion.',
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
  landing_studio_demo_title: {
    en: 'See a document take shape',
    fr: 'Voir un document se construire',
  },
  landing_studio_demo_intro: {
    en: 'Answer a few guided questions — Dutiva assembles jurisdiction-aware clauses into a draft you can review before sending.',
    fr: 'Répondez à quelques questions guidées — Dutiva assemble des clauses adaptées à la compétence dans une ébauche que vous pouvez réviser avant l’envoi.',
  },
  landing_studio_demo_wizard: {
    en: 'Guided questions',
    fr: 'Questions guidées',
  },
  landing_studio_demo_step: {
    en: 'Step',
    fr: 'Étape',
  },
  landing_studio_demo_output: {
    en: 'Draft preview',
    fr: 'Aperçu de l’ébauche',
  },
  landing_studio_demo_note: {
    en: 'Sample output from the Ontario offer-letter template — not a live generation.',
    fr: 'Exemple tiré du modèle de lettre d’offre pour l’Ontario — pas une génération en direct.',
  },
  landing_studio_demo_open: {
    en: 'Open Document Studio in the demo',
    fr: 'Ouvrir le Studio de documents dans la démo',
  },
  landing_studio_demo_samples_link: {
    en: 'Browse all sample outputs',
    fr: 'Parcourir tous les exemples',
  },
  landing_why_badge: {
    en: 'Why Dutiva',
    fr: 'Pourquoi Dutiva',
  },
  landing_why_title_a: {
    en: 'Built by someone ',
    fr: 'Conçue par quelqu’un ',
  }, // [FR self-authored]
  landing_why_title_b: {
    en: 'who has done the work.',
    fr: 'qui a fait le travail.',
  },
  landing_why_p: {
    en: 'I spent years managing HR and payroll in Canada, constantly worrying if our termination letters or policies were up to date. I built Dutiva so you don’t have to guess. We’re real Canadian operators building the tool we wished we had.',
    fr: 'J’ai passé des années à gérer les RH et la paie au Canada, en me demandant constamment si nos lettres de cessation ou nos politiques étaient à jour. J’ai conçu Dutiva pour que vous n’ayez plus à deviner. Nous sommes de véritables opérateurs canadiens qui bâtissent l’outil que nous aurions voulu avoir.',
  }, // [FR self-authored]
  landing_why_attribution: {
    en: 'Martin Constantineau, Founder & CEO',
    fr: 'Martin Constantineau, fondateur et chef de la direction',
  }, // [FR self-authored]
  landing_why_foot: {
    en: 'Built in Ottawa, Canada · Grounded in real HR operations, not generic research.',
    fr: 'Conçu à Ottawa, au Canada · Ancré dans de véritables opérations RH, pas dans des recherches génériques.',
  },
  /* Testimonial wall — renders only when testimonialEntries has published rows. */
  landing_testimonials_badge: {
    en: 'Beta feedback',
    fr: 'Retour bêta',
  },
  landing_testimonials_title: {
    en: 'What early users are saying',
    fr: 'Ce que disent les premiers utilisateurs',
  },
  landing_testimonials_sub: {
    en: 'Named beta participants sharing one outcome from their first workflows.',
    fr: 'Participants bêta identifiés partageant un résultat de leurs premiers processus.',
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
    fr: "Conscient de la LPRPDE et tient compte de la Loi 25 du Québec, avec des indications d'escalade sur les conseils à risque élevé.",
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
    en: 'Bilingual EN/FR, with named statutes for Ontario, Quebec, and federal workplaces.',
    fr: 'Bilingue EN/FR, avec des lois nommées pour l’Ontario, le Québec et les milieux de travail fédéraux.',
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
    en: 'Federal remote work',
    fr: 'Télétravail fédéral',
  },
  landing_cov_rem_stat: {
    en: 'A FED scenario — not a fourth jurisdiction',
    fr: 'Un scénario FED — pas une quatrième compétence',
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
    en: 'Pick a plan that fits today. Upgrade when your HR work grows.',
    fr: 'Choisissez un forfait qui convient aujourd’hui. Évoluez quand vos RH grandissent.',
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
    en: 'Free',
    fr: 'Gratuit',
  },
  landing_free_amt: {
    en: 'Free',
    fr: 'Gratuit',
  },
  landing_free_desc: {
    en: 'Waitlist — we’ll email you when a free seat opens.',
    fr: 'Liste d’attente — nous vous écrirons dès qu’une place gratuite se libère.',
  },
  landing_free_f1: {
    en: 'Full product once a seat opens',
    fr: 'Produit complet dès qu’une place se libère',
  },
  landing_free_f2: {
    en: 'Help Centre and email',
    fr: 'Centre d’aide et courriel',
  },
  landing_free_f3: {
    en: 'Standard queue (2 business days)',
    fr: 'File standard (2 jours ouvrables)',
  },
  landing_free_cta: {
    en: 'Join the waitlist',
    fr: 'Joindre la liste d’attente',
  },
  landing_starter_name: {
    en: 'Starter',
    fr: 'Starter',
  },
  landing_starter_desc: {
    en: 'Skip the waitlist. Full product, email support.',
    fr: 'Sautez la liste d’attente. Produit complet, soutien par courriel.',
  },
  landing_starter_f1: {
    en: 'Skip the waitlist',
    fr: 'Sauter la liste d’attente',
  },
  landing_starter_f2: {
    en: 'Full product',
    fr: 'Produit complet',
  },
  landing_starter_f3: {
    en: 'Email support — paid tickets first',
    fr: 'Soutien par courriel — billets payants en premier',
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
    en: 'Faster replies and an onboarding walkthrough on request.',
    fr: 'Réponses plus rapides et une visite d’accueil sur demande.',
  },
  landing_growth_f1: {
    en: 'Skip the waitlist',
    fr: 'Sauter la liste d’attente',
  },
  landing_growth_f2: {
    en: 'Initial reply within 1 business day',
    fr: 'Première réponse en 1 jour ouvrable',
  },
  landing_growth_f3: {
    en: 'Onboarding walkthrough on request',
    fr: 'Visite d’accueil sur demande',
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
    en: 'Same as Growth, plus a scheduled onboarding call.',
    fr: 'Comme Growth, plus un appel d’accueil planifié.',
  },
  landing_pro_f1: {
    en: 'Skip the waitlist',
    fr: 'Sauter la liste d’attente',
  },
  landing_pro_f2: {
    en: 'Initial reply within 1 business day',
    fr: 'Première réponse en 1 jour ouvrable',
  },
  landing_pro_f3: {
    en: 'Scheduled onboarding call',
    fr: 'Appel d’accueil planifié',
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
    en: 'Prefer not to pay yet?',
    fr: 'Vous préférez ne pas payer pour l’instant ?',
  },
  landing_cta_title: {
    en: 'Join the waitlist for a free seat.',
    fr: 'Joignez-vous à la liste d’attente pour une place gratuite.',
  },
  landing_cta_p: {
    en: 'A paid plan starts today. If you’d rather wait, leave your email — we’ll write when a free seat opens.',
    fr: 'Un forfait payant commence aujourd’hui. Si vous préférez attendre, laissez votre courriel — nous vous écrirons dès qu’une place gratuite se libère.',
  },
  /* Postdates the design handoff: beta capacity decision, 2026-08-07. The
     number is interpolated from BETA_COHORT_LIMIT so this copy cannot drift
     from the gate that enforces it. [FR self-authored] */
  landing_cta_capacity: {
    en: `The waitlist has ${BETA_COHORT_LIMIT} free seats to begin. Later signups stay on the list until a seat opens.`,
    fr: `La liste d’attente compte ${BETA_COHORT_LIMIT} places gratuites pour commencer. Les inscriptions suivantes restent sur la liste jusqu’à ce qu’une place se libère.`,
  },
  /* Spot counter above the beta form. {taken}/{limit} replaced at render.
     [FR self-authored] */
  landing_cta_spots: {
    en: '{taken} of {limit} spots currently taken',
    fr: '{taken} sur {limit} places actuellement prises',
  },
  landing_cta_email_ph: {
    en: 'you@company.ca',
    fr: 'vous@entreprise.ca',
  },
  landing_cta_btn: {
    en: 'Join the waitlist',
    fr: 'Joindre la liste d’attente',
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
    en: "We'll email you when your seat is ready.",
    fr: 'Nous vous écrirons lorsque votre place sera prête.',
  },
  /* Postdates the design handoff: shown instead of landing_cta_done_* when
     the server reports the first cohort is already full, so a visitor who
     will wait is never promised access. [FR self-authored] */
  landing_cta_wait_t: {
    en: "You're on the waiting list.",
    fr: 'Vous êtes sur la liste d’attente.',
  },
  landing_cta_wait_p: {
    en: `The first ${BETA_COHORT_LIMIT} free seats are taken. We'll email you as soon as one opens.`,
    fr: `Les ${BETA_COHORT_LIMIT} premières places gratuites sont prises. Nous vous écrirons dès qu’une place se libère.`,
  },
  landing_foot_desc: {
    en: 'Practical HR compliance support for Canadian employers — guidance and review-ready documents when the work gets complicated.',
    fr: 'Soutien pratique à la conformité RH pour les employeurs canadiens — conseils et documents prêts à réviser quand le travail se complique.',
  },
  landing_foot_support_prompt: {
    en: 'Stuck on a workflow?',
    fr: 'Bloqué sur un processus ?',
  }, // [FR self-authored]
  landing_foot_support_email: {
    en: 'support@dutiva.ca',
    fr: 'support@dutiva.ca',
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
    en: 'Waitlist',
    fr: 'Liste d’attente',
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
  landing_fr_changelog: {
    en: 'Changelog',
    fr: 'Journal des modifications',
  },
  landing_foot_vs_hrdownloads: {
    en: 'Dutiva vs Citation Canada',
    fr: 'Dutiva vs Citation Canada',
  },
  landing_foot_vs_sixfifty: {
    en: 'Dutiva vs SixFifty',
    fr: 'Dutiva vs SixFifty',
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
