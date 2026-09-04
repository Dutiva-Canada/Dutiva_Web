import {
  ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
  ADVISOR_OVERAGE_PER_REPLY_CAD,
  ADVISOR_PACK_50_PRICE_CAD,
  ADVISOR_PACK_50_REPLIES,
  ADVISOR_PACK_200_PRICE_CAD,
  ADVISOR_PACK_200_REPLIES,
} from '@/config/advisorUsage'
import { PLAN_ENTITLEMENTS } from '@/config/planEntitlements'
import { defineMessages } from '../core'

const freeAdvisor = PLAN_ENTITLEMENTS.free.limits.advisorRepliesPerMonth
const starterAdvisor = PLAN_ENTITLEMENTS.starter.limits.advisorRepliesPerMonth
const growthAdvisor = PLAN_ENTITLEMENTS.growth.limits.advisorRepliesPerMonth
const proAdvisor = PLAN_ENTITLEMENTS.pro.limits.advisorRepliesPerMonth

/**
 * Standalone /pricing page chrome. Plan names/descriptions/features reuse
 * the landing page's `landing_free_*` / `landing_starter_*` / … keys (see
 * src/config/plans.ts) — this module only carries copy specific to the
 * full comparison page: hero framing, the admin-bypass banner, and
 * checkout status messages.
 */
export const pricingMessages = defineMessages({
  pricing_eyebrow: {
    en: 'Pricing',
    fr: 'Tarifs',
  },
  pricing_h1: {
    en: 'Pick a plan that fits today. Upgrade when your HR work grows.',
    fr: 'Choisissez un forfait qui convient aujourd’hui. Évoluez quand vos RH grandissent.',
  },
  pricing_intro: {
    en: 'No long-term contracts and no setup fees. Cancel anytime — your plan stays active until the end of your billing period. Prices in CAD.',
    fr: 'Aucun contrat à long terme ni frais d’installation. Annulez à tout moment — votre forfait reste actif jusqu’à la fin de votre période de facturation. Prix en CAD.',
  },
  /* SEO meta only — kept 120–155 chars so SERP snippets are not truncated. */
  pricing_meta_description: {
    en: 'Public CAD plans for Canadian employers — Free waitlist, Starter, Growth, and Professional. Monthly billing, no setup fees, cancel anytime.',
    fr: 'Forfaits publics en CAD pour employeurs canadiens — liste d’attente, Starter, Growth et Professional. Facturation mensuelle, annulation en tout temps.',
  },
  pricing_mo: {
    en: '/mo',
    fr: '/mois',
  },
  pricing_current_plan: {
    en: 'Your plan',
    fr: 'Votre forfait',
  },
  pricing_cta_processing: {
    en: 'Loading…',
    fr: 'Chargement…',
  },
  pricing_cta_signin_first: {
    en: 'Sign in to continue',
    fr: 'Connectez-vous pour continuer',
  },
  pricing_cta_beta_only: {
    en: 'Available after beta',
    fr: 'Disponible après la bêta',
  },
  pricing_beta_only_badge: {
    en: 'Coming soon',
    fr: 'Bientôt disponible',
  },
  /* Prominent, above-the-fold counterpart to pricing_compare_note (which stays
     put as the detailed footnote under the comparison table) — surfaces the
     same beta-access truth where a reader actually sees it: next to the
     plan cards, not below them. Same PAID_PLANS_DISABLED_DURING_BETA gate. */
  pricing_beta_banner: {
    en: 'Beta access: every feature on every plan is unlocked for every account right now — the pricing and limits below describe what ships once the beta ends. AI Advisor usage carries fair-use limits so the service stays fast for everyone.',
    fr: 'Accès bêta : toutes les fonctionnalités de tous les forfaits sont déjà débloquées pour chaque compte — les prix et limites ci-dessous décrivent ce qui sera offert une fois la bêta terminée. L’utilisation du Conseiller IA est soumise à des limites d’usage raisonnable afin que le service reste rapide pour tous.', // [FR self-authored]
  },
  pricing_checkout_bypassed: {
    en: 'Internal account — no checkout needed. You already have full access.',
    fr: 'Compte interne — aucun paiement requis. Vous avez déjà un accès complet.',
  },
  pricing_checkout_error: {
    en: 'Could not start checkout. Please try again or contact support@dutiva.ca.',
    fr: 'Impossible de démarrer le paiement. Réessayez ou contactez support@dutiva.ca.',
  },
  pricing_checkout_unavailable: {
    en: 'Payments are not configured in this environment yet.',
    fr: 'Les paiements ne sont pas encore configurés dans cet environnement.',
  },
  pricing_manage_billing: {
    en: 'Manage billing',
    fr: 'Gérer la facturation',
  },
  pricing_portal_error: {
    en: 'Could not open the billing portal. Please try again or contact support@dutiva.ca.',
    fr: 'Impossible d’ouvrir le portail de facturation. Réessayez ou contactez support@dutiva.ca.',
  },
  pricing_checkout_return_success: {
    en: "Thanks — your subscription is being set up. This can take a few seconds; refresh if your plan doesn't show as updated yet.",
    fr: 'Merci — votre abonnement est en cours de configuration. Cela peut prendre quelques secondes ; actualisez si votre forfait ne s’affiche pas encore comme mis à jour.',
  },
  pricing_checkout_return_success_heading: {
    en: 'Payment received',
    fr: 'Paiement reçu',
  },
  pricing_checkout_return_go: {
    en: 'Go to your workspace',
    fr: 'Accéder à votre espace de travail',
  },
  pricing_checkout_return_cancelled: {
    en: 'Checkout was cancelled — no charge was made. You can try again anytime.',
    fr: "Le paiement a été annulé — aucun montant n'a été prélevé. Vous pouvez réessayer en tout temps.",
  },
  pricing_compare_title: {
    en: 'Compare what each plan includes.',
    fr: 'Comparez ce que chaque forfait comprend.',
  },
  pricing_compare_sub: {
    en: 'Paid plans skip the waitlist and include founder-led support. Billed securely through Stripe.',
    fr: 'Les forfaits payants sautent la liste d’attente et comprennent un soutien mené par le fondateur. Facturés en toute sécurité via Stripe.', // [FR self-authored]
  },
  pricing_faq_title: {
    en: 'Common questions',
    fr: 'Questions fréquentes',
  },
  pricing_faq_legal_q: {
    en: 'Is this legal advice?',
    fr: 'Est-ce un avis juridique ?',
  },
  pricing_faq_legal_a: {
    en: 'No. Dutiva provides general HR compliance guidance and document templates. For specific legal situations, consult an employment lawyer.',
    fr: 'Non. Dutiva fournit des orientations générales en conformité RH et des modèles de documents. Pour une situation juridique précise, consultez un avocat en droit du travail.',
  },
  pricing_faq_jur_q: {
    en: 'Which jurisdictions are covered?',
    fr: 'Quelles juridictions sont couvertes ?',
  },
  pricing_faq_jur_a: {
    en: 'Ontario, Quebec, and Federal, with Alberta and British Columbia coming soon.',
    fr: 'Ontario, Québec et fédéral, avec l’Alberta et la Colombie-Britannique à venir.',
  },
  pricing_cta_title: {
    en: 'Still deciding?',
    fr: 'Vous hésitez encore ?',
  },
  pricing_cta_body: {
    en: 'Pick a paid plan to start today, or join the waitlist if you’d rather not pay yet.',
    fr: 'Choisissez un forfait payant pour commencer aujourd’hui, ou joignez-vous à la liste d’attente si vous préférez ne pas payer pour l’instant.', // [FR self-authored]
  },
  pricing_cta_ask: {
    en: 'Ask a question',
    fr: 'Poser une question',
  },

  /* ── Expanded pricing-page copy (billing toggle, trust band, comparison
        table, FAQ). Self-authored EN + FR — no prototype/handoff counterpart.
        Refund copy deliberately defers to the checked-in Refund & Cancellation
        Policy rather than restating specific windows: the EN and FR policy
        documents currently differ on annual-refund terms, so marketing points
        to the policy instead of committing to a number. Only the cancellation
        timing (access continues to period end), which both locales agree on,
        is stated directly. ── */
  pricing_billing_monthly: { en: 'Monthly', fr: 'Mensuel' },
  pricing_billing_annual: { en: 'Annual', fr: 'Annuel' },
  pricing_billing_save: { en: '2 months free', fr: '2 mois gratuits' },
  pricing_billed_yearly: { en: 'billed yearly', fr: 'facturé par année' },
  pricing_annual_soon: {
    en: 'Annual billing is coming soon — email support@dutiva.ca and we’ll set it up for you.',
    fr: 'La facturation annuelle arrive bientôt — écrivez à support@dutiva.ca et nous la configurerons pour vous.',
  },

  /* ── Trust band ────────────────────────────────────────────────────────── */
  pricing_trust_stripe: { en: 'Secure Stripe checkout', fr: 'Paiement Stripe sécurisé' },
  pricing_trust_nosetup: { en: 'No setup fees', fr: 'Aucuns frais d’installation' },
  pricing_trust_cancel: { en: 'Cancel anytime', fr: 'Annulation en tout temps' },
  pricing_trust_privacy: {
    en: 'Privacy-first, built in Canada',
    fr: 'Confidentialité d’abord, conçu au Canada',
  },

  /* ── Feature comparison table ──────────────────────────────────────────── */
  pricing_feature_col: { en: 'Features', fr: 'Fonctionnalités' },
  pricing_included: { en: 'Included', fr: 'Inclus' },
  pricing_not_included: { en: 'Not included', fr: 'Non inclus' },
  pricing_compare_note: {
    en: 'Every admitted account gets the full product. Paying skips the waitlist and buys faster founder-led support. Advisor usage has fair-use caps so the service stays fast. Initial-reply times are targets, not resolution promises.',
    fr: 'Chaque compte admis a le produit complet. Payer saute la liste d’attente et achète un soutien plus rapide mené par le fondateur. L’usage du Conseiller a des plafonds raisonnables pour garder le service rapide. Les délais de première réponse sont des cibles, pas des promesses de résolution.', // [FR self-authored]
  },
  /* Shown when PLAN_FEATURE_GATES_ENABLED — never claim “full product”. */
  pricing_compare_note_entitled: {
    en: 'Limits apply to your active workspace. Footnotes explain how employees, documents, signatures, and Advisor rollover are counted. Initial-reply times are targets, not resolution promises.',
    fr: 'Les limites s’appliquent à votre espace de travail actif. Les notes de bas de page expliquent le décompte des employés, documents, signatures et reports du Conseiller. Les délais de première réponse sont des cibles, pas des promesses de résolution.', // [FR self-authored]
  },
  pricing_grp_workspace: { en: 'Access', fr: 'Accès' },
  pricing_grp_access: { en: 'Access', fr: 'Accès' }, // [FR self-authored]
  pricing_grp_advisor: { en: 'AI Advisor', fr: 'Conseiller IA' }, // [FR self-authored]
  pricing_grp_employees_cases: {
    en: 'Employees & cases',
    fr: 'Employés et dossiers', // [FR self-authored]
  },
  pricing_grp_planning: { en: 'Planning', fr: 'Planification' }, // [FR self-authored]
  pricing_grp_documents: { en: 'Documents', fr: 'Documents' }, // [FR self-authored]
  pricing_grp_workflows: { en: 'Workflows & guides', fr: 'Flux et guides' }, // [FR self-authored]
  pricing_grp_dashboard: { en: 'Dashboard & analytics', fr: 'Tableau de bord et analytique' }, // [FR self-authored]
  pricing_grp_workplace: { en: 'Workplace registers', fr: 'Registres du milieu de travail' }, // [FR self-authored]
  pricing_grp_support: { en: 'Support', fr: 'Soutien' },
  pricing_grp_billing: { en: 'Billing & terms', fr: 'Facturation et conditions' },

  pricing_row_full_product: { en: 'Full product', fr: 'Produit complet' },
  pricing_row_skip_waitlist: { en: 'Skip the waitlist', fr: 'Sauter la liste d’attente' },
  pricing_row_workspace_users: {
    en: 'Workspace users',
    fr: 'Utilisateurs de l’espace', // [FR self-authored]
  },
  pricing_row_active_employees: {
    en: 'Active employees',
    fr: 'Employés actifs', // [FR self-authored]
  },
  pricing_row_active_cases: {
    en: 'Active HR cases',
    fr: 'Dossiers RH actifs', // [FR self-authored]
  },
  pricing_row_open_tasks: {
    en: 'Open tasks',
    fr: 'Tâches ouvertes', // [FR self-authored]
  },
  pricing_row_advisor_replies: {
    en: 'Advisor replies / month',
    fr: 'Réponses du Conseiller / mois', // [FR self-authored]
  },
  pricing_row_advisor_rollover: {
    en: 'Advisor reply rollover',
    fr: 'Report des réponses du Conseiller', // [FR self-authored]
  },
  pricing_row_reply_packs: {
    en: 'Prepaid reply packs',
    fr: 'Forfaits de réponses prépayés', // [FR self-authored]
  },
  pricing_row_metered_overage: {
    en: 'Opt-in metered overage',
    fr: 'Dépassement mesuré (sur demande)', // [FR self-authored]
  },
  pricing_row_advisor_memory: {
    en: 'Cross-record Advisor memory',
    fr: 'Mémoire du Conseiller entre dossiers', // [FR self-authored]
  },
  pricing_row_employee_profiles: {
    en: 'Employee profiles',
    fr: 'Profils d’employés', // [FR self-authored]
  },
  pricing_row_employee_notes: {
    en: 'Employee notes',
    fr: 'Notes sur les employés', // [FR self-authored]
  },
  pricing_row_leave_records: {
    en: 'Leave records',
    fr: 'Dossiers de congé', // [FR self-authored]
  },
  pricing_row_expiry_tracking: {
    en: 'Expiry tracking',
    fr: 'Suivi des échéances', // [FR self-authored]
  },
  pricing_row_hr_cases: {
    en: 'HR cases',
    fr: 'Dossiers RH', // [FR self-authored]
  },
  pricing_row_case_notes: {
    en: 'Case notes',
    fr: 'Notes de dossier', // [FR self-authored]
  },
  pricing_row_tasks: {
    en: 'Tasks',
    fr: 'Tâches', // [FR self-authored]
  },
  pricing_row_calendar: {
    en: 'Calendar',
    fr: 'Calendrier', // [FR self-authored]
  },
  pricing_row_compliance_findings: {
    en: 'Compliance findings',
    fr: 'Constatations de conformité', // [FR self-authored]
  },
  pricing_row_obligations: {
    en: 'Obligations',
    fr: 'Obligations', // [FR self-authored]
  },
  pricing_row_policy_register: {
    en: 'Policy register',
    fr: 'Registre des politiques', // [FR self-authored]
  },
  pricing_row_policy_review: {
    en: 'Policy review reminders',
    fr: 'Rappels de révision des politiques', // [FR self-authored]
  },
  pricing_row_templates_visible: {
    en: 'Document templates',
    fr: 'Modèles de documents', // [FR self-authored]
  },
  pricing_row_saved_documents: {
    en: 'Saved documents',
    fr: 'Documents enregistrés', // [FR self-authored]
  },
  pricing_row_signature_envelopes: {
    en: 'Signature envelopes',
    fr: 'Enveloppes de signature', // [FR self-authored]
  },
  pricing_row_pdf_export: {
    en: 'PDF export',
    fr: 'Export PDF', // [FR self-authored]
  },
  pricing_row_word_export: {
    en: 'Word (.docx) export',
    fr: 'Export Word (.docx)', // [FR self-authored]
  },
  pricing_row_doc_repository: {
    en: 'Document repository',
    fr: 'Dépôt de documents', // [FR self-authored]
  },
  pricing_row_workflows: {
    en: 'Guided workflows',
    fr: 'Flux guidés', // [FR self-authored]
  },
  pricing_row_reference_guides: {
    en: 'Reference guides',
    fr: 'Guides de référence', // [FR self-authored]
  },
  pricing_row_official_sources: {
    en: 'Links to official sources',
    fr: 'Liens vers les sources officielles', // [FR self-authored]
  },
  pricing_row_guided_setup: {
    en: 'Guided setup',
    fr: 'Configuration guidée', // [FR self-authored]
  },
  pricing_row_operational_dashboard: {
    en: 'Operational dashboard',
    fr: 'Tableau de bord opérationnel', // [FR self-authored]
  },
  pricing_row_operational_analytics: {
    en: 'Operational analytics',
    fr: 'Analytique opérationnelle', // [FR self-authored]
  },
  pricing_row_compliance_trends: {
    en: 'Compliance trends',
    fr: 'Tendances de conformité', // [FR self-authored]
  },
  pricing_row_case_aging: {
    en: 'Case aging insights',
    fr: 'Insights sur le vieillissement des dossiers', // [FR self-authored]
  },
  pricing_row_workforce_insights: {
    en: 'Workforce insights',
    fr: 'Insights sur l’effectif', // [FR self-authored]
  },
  pricing_row_communications: {
    en: 'Communications register',
    fr: 'Registre des communications', // [FR self-authored]
  },
  pricing_row_compensation: {
    en: 'Compensation register',
    fr: 'Registre de la rémunération', // [FR self-authored]
  },
  pricing_row_wellbeing: {
    en: 'Wellbeing register',
    fr: 'Registre du bien-être', // [FR self-authored]
  },
  pricing_row_help_centre: { en: 'Help Centre', fr: 'Centre d’aide' },
  pricing_row_support: { en: 'Support', fr: 'Soutien' },
  pricing_row_queue_priority: {
    en: 'Support queue priority',
    fr: 'Priorité dans la file de soutien', // [FR self-authored]
  },
  pricing_row_initial_reply: {
    en: 'Initial reply (business days)',
    fr: 'Première réponse (jours ouvrables)',
  },
  pricing_row_self_onboarding: {
    en: 'Self-serve onboarding',
    fr: 'Accueil en libre-service', // [FR self-authored]
  },
  pricing_row_walkthrough: {
    en: 'Onboarding walkthrough on request',
    fr: 'Visite d’accueil sur demande',
  },
  pricing_row_onboarding_call: {
    en: 'Scheduled onboarding call',
    fr: 'Appel d’accueil planifié',
  },
  pricing_row_contract: { en: 'No long-term contract', fr: 'Aucun contrat à long terme' },

  pricing_v_when_admitted: { en: 'Once a seat opens', fr: 'Dès qu’une place se libère' },
  pricing_v_email: { en: 'Email', fr: 'Courriel' },
  pricing_v_2_days: { en: '2 days', fr: '2 jours' },
  pricing_v_1_day: { en: '1 day', fr: '1 jour' },
  pricing_v_unlimited: { en: 'Unlimited', fr: 'Illimité' }, // [FR self-authored]

  pricing_v_users_free: { en: '1', fr: '1' },
  pricing_v_users_starter: { en: '2', fr: '2' },
  pricing_v_users_growth: { en: '5', fr: '5' },
  pricing_v_users_pro: { en: '10', fr: '10' },

  pricing_v_employees_free: { en: '5', fr: '5' },
  pricing_v_employees_starter: { en: '10', fr: '10' },
  pricing_v_employees_growth: { en: '50', fr: '50' },
  pricing_v_employees_pro: { en: '100', fr: '100' },

  pricing_v_cases_free: { en: '3', fr: '3' },
  pricing_v_tasks_free: { en: '10', fr: '10' },

  pricing_v_advisor_free: { en: `${freeAdvisor} / month`, fr: `${freeAdvisor} / mois` }, // [FR self-authored]
  pricing_v_advisor_starter: { en: `${starterAdvisor} / month`, fr: `${starterAdvisor} / mois` }, // [FR self-authored]
  pricing_v_advisor_growth: { en: `${growthAdvisor} / month`, fr: `${growthAdvisor} / mois` }, // [FR self-authored]
  pricing_v_advisor_pro: { en: `${proAdvisor} / month`, fr: `${proAdvisor} / mois` }, // [FR self-authored]

  pricing_v_rollover_starter: {
    en: `Up to ${starterAdvisor} for 90 days`,
    fr: `Jusqu’à ${starterAdvisor} pendant 90 jours`, // [FR self-authored]
  },
  pricing_v_rollover_growth: {
    en: `Up to ${growthAdvisor} for 90 days`,
    fr: `Jusqu’à ${growthAdvisor} pendant 90 jours`, // [FR self-authored]
  },
  pricing_v_rollover_pro: {
    en: `Up to ${proAdvisor} for 90 days`,
    fr: `Jusqu’à ${proAdvisor} pendant 90 jours`, // [FR self-authored]
  },

  pricing_v_docs_free: { en: '5 total', fr: '5 au total' }, // [FR self-authored]
  pricing_v_docs_starter: { en: '20 / month', fr: '20 / mois' }, // [FR self-authored]
  pricing_v_docs_growth: { en: '100 / month', fr: '100 / mois' }, // [FR self-authored]
  pricing_v_docs_pro: { en: '300 / month', fr: '300 / mois' }, // [FR self-authored]

  pricing_v_sign_free: { en: '1 total', fr: '1 au total' }, // [FR self-authored]
  pricing_v_sign_starter: { en: '5 / month', fr: '5 / mois' }, // [FR self-authored]
  pricing_v_sign_growth: { en: '25 / month', fr: '25 / mois' }, // [FR self-authored]
  pricing_v_sign_pro: { en: '100 / month', fr: '100 / mois' }, // [FR self-authored]

  pricing_v_templates_all: { en: 'All 50', fr: 'Les 50' }, // [FR self-authored]
  pricing_v_workflows_free: { en: '3 selected', fr: '3 sélectionnés' }, // [FR self-authored]
  pricing_v_workflows_all: { en: 'All 12', fr: 'Les 12' }, // [FR self-authored]
  pricing_v_guides_all: { en: 'All 8', fr: 'Les 8' }, // [FR self-authored]

  pricing_v_priority_standard: { en: 'Standard', fr: 'Standard' }, // [FR self-authored]
  pricing_v_priority_paid: { en: 'Paid first', fr: 'Payants d’abord' }, // [FR self-authored]
  pricing_v_priority_priority: { en: 'Priority', fr: 'Prioritaire' }, // [FR self-authored]
  pricing_v_priority_highest: { en: 'Highest', fr: 'La plus élevée' }, // [FR self-authored]
  pricing_v_walkthrough_request: { en: 'On request', fr: 'Sur demande' }, // [FR self-authored]

  pricing_fn_active_employees: {
    en: 'Active employees only — terminated or archived profiles do not count.',
    fr: 'Employés actifs seulement — les profils résiliés ou archivés ne comptent pas.', // [FR self-authored]
  },
  pricing_fn_rollover: {
    en: 'Unused included Advisor replies on paid plans may roll over for 90 days, up to one month of your current plan. Pack and overage replies do not roll over.',
    fr: 'Les réponses du Conseiller incluses et inutilisées sur les forfaits payants peuvent être reportées 90 jours, jusqu’à un mois de votre forfait actuel. Les réponses des forfaits prépayés et du dépassement ne se reportent pas.', // [FR self-authored]
  },
  pricing_fn_documents: {
    en: 'A document counts on first save to the repository. Free is a total during free access; paid plans reset each calendar month (UTC).',
    fr: 'Un document compte à la première sauvegarde dans le dépôt. Le forfait gratuit est un total pendant l’accès gratuit ; les forfaits payants se réinitialisent chaque mois civil (UTC).', // [FR self-authored]
  },
  pricing_fn_signatures: {
    en: 'A signature envelope counts on first send. Free is a total during free access; paid plans reset each calendar month (UTC).',
    fr: 'Une enveloppe de signature compte au premier envoi. Le forfait gratuit est un total pendant l’accès gratuit ; les forfaits payants se réinitialisent chaque mois civil (UTC).', // [FR self-authored]
  },
  pricing_fn_initial_reply: {
    en: 'Initial reply times are targets for a first response, not promises that the issue will be resolved in that window.',
    fr: 'Les délais de première réponse sont des cibles pour un premier avis, pas des promesses que le dossier sera résolu dans ce délai.', // [FR self-authored]
  },
  pricing_fn_review_before_use: {
    en: 'Document templates are for review before use. They are not lawyer-approved for your situation.',
    fr: 'Les modèles de documents sont à revoir avant usage. Ils ne sont pas approuvés par un avocat pour votre situation.', // [FR self-authored]
  },

  /* ── Expanded FAQ ──────────────────────────────────────────────────────── */
  pricing_faq_switch_q: {
    en: 'Can I change plans later?',
    fr: 'Puis-je changer de forfait plus tard ?',
  },
  pricing_faq_switch_a: {
    en: 'Yes. Upgrade, downgrade, or cancel anytime from your billing settings. Downgrades and cancellations take effect at the end of your current billing period.',
    fr: 'Oui. Passez à un forfait supérieur ou inférieur, ou annulez à tout moment depuis vos paramètres de facturation. Les rétrogradations et les annulations prennent effet à la fin de votre période de facturation en cours.',
  },
  pricing_faq_billing_q: {
    en: 'How does billing work?',
    fr: 'Comment fonctionne la facturation ?',
  },
  pricing_faq_billing_a: {
    en: 'Paid plans are billed securely through Stripe in Canadian dollars, monthly. Annual billing is coming soon. Manage or cancel your subscription anytime.',
    fr: 'Les forfaits payants sont facturés en toute sécurité via Stripe en dollars canadiens, mensuellement. La facturation annuelle arrive bientôt. Gérez ou annulez votre abonnement à tout moment.',
  },
  pricing_faq_refund_q: {
    en: 'What is your refund policy?',
    fr: 'Quelle est votre politique de remboursement ?',
  },
  pricing_faq_refund_a: {
    en: 'Refund eligibility depends on your plan and billing period. You can cancel anytime — your access continues until the end of your billing period. See our Refund & Cancellation Policy for the full, current terms.',
    fr: 'L’admissibilité au remboursement dépend de votre forfait et de votre période de facturation. Vous pouvez annuler à tout moment — votre accès se poursuit jusqu’à la fin de votre période de facturation. Consultez notre politique de remboursement et d’annulation pour les conditions complètes et à jour.',
  },
  pricing_faq_annual_q: {
    en: 'Is annual billing cheaper?',
    fr: 'La facturation annuelle est-elle moins chère ?',
  },
  pricing_faq_annual_a: {
    en: 'Annual billing is coming soon — it will include two months free compared with paying month to month. Email support@dutiva.ca to be notified when it is available.',
    fr: 'La facturation annuelle arrive bientôt — elle comprendra deux mois gratuits par rapport au paiement mensuel. Écrivez à support@dutiva.ca pour être avisé dès qu’elle est disponible.',
  },
  pricing_faq_multiclient_q: {
    en: 'Can I use one subscription for multiple clients?',
    fr: 'Puis-je utiliser un abonnement pour plusieurs clients ?',
  },
  pricing_faq_multiclient_a: {
    en: 'Each Dutiva account is for one organization. HR consultants managing multiple clients should contact us about consultant pricing and multi-account options.',
    fr: 'Chaque compte Dutiva est destiné à une organisation. Les conseillers RH qui gèrent plusieurs clients devraient nous contacter pour les tarifs conseillers et les options multi-comptes.',
  },
  pricing_faq_packs_q: {
    en: 'Are extra Advisor replies part of a paid plan?',
    fr: 'Les réponses supplémentaires du Conseiller font-elles partie d’un forfait payant ?', // [FR self-authored]
  },
  pricing_faq_packs_a: {
    en: 'No. Every admitted account has the same included Advisor replies each month. Prepaid packs are optional if you go past that — they are not a plan feature. Paying for a plan still buys founder-led support, not extra modules. On a paid subscription you can also opt in, in Settings, to bill extra replies at month end.',
    fr: 'Non. Chaque compte admis a le même nombre de réponses du Conseiller incluses chaque mois. Les forfaits prépayés sont facultatifs si vous dépassez ce plafond — ce n’est pas une fonction d’abonnement. Payer un forfait achète encore du soutien mené par le fondateur, pas des modules supplémentaires. Avec un abonnement payant, vous pouvez aussi activer, dans les paramètres, la facturation des réponses en trop en fin de mois.', // [FR self-authored]
  },
  pricing_faq_packs_a_entitled: {
    en: `Each plan includes Advisor replies each month (Free ${freeAdvisor}, Starter ${starterAdvisor}, Growth ${growthAdvisor}, Professional ${proAdvisor}). On paid plans you can buy prepaid packs (${ADVISOR_PACK_50_REPLIES} for $${ADVISOR_PACK_50_PRICE_CAD} CAD, ${ADVISOR_PACK_200_REPLIES} for $${ADVISOR_PACK_200_PRICE_CAD} CAD) and, in Settings, opt in to bill extra replies at $${ADVISOR_OVERAGE_PER_REPLY_CAD.toFixed(2)} CAD each (cap ${ADVISOR_OVERAGE_MONTHLY_REPLY_CAP}/month).`,
    fr: `Chaque forfait inclut des réponses du Conseiller chaque mois (Gratuit ${freeAdvisor}, Starter ${starterAdvisor}, Growth ${growthAdvisor}, Professional ${proAdvisor}). Sur les forfaits payants, vous pouvez acheter des forfaits prépayés (${ADVISOR_PACK_50_REPLIES} pour ${ADVISOR_PACK_50_PRICE_CAD} $ CAD, ${ADVISOR_PACK_200_REPLIES} pour ${ADVISOR_PACK_200_PRICE_CAD} $ CAD) et, dans les paramètres, activer la facturation des réponses en trop à ${ADVISOR_OVERAGE_PER_REPLY_CAD.toFixed(2)} $ CAD chacune (plafond ${ADVISOR_OVERAGE_MONTHLY_REPLY_CAP}/mois).`, // [FR self-authored]
  },
})
