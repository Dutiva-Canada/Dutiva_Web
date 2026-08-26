import { defineMessages } from '../core'

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
  pricing_grp_workspace: { en: 'Access', fr: 'Accès' },
  pricing_grp_support: { en: 'Support', fr: 'Soutien' },
  pricing_grp_billing: { en: 'Billing & terms', fr: 'Facturation et conditions' },

  pricing_row_full_product: { en: 'Full product', fr: 'Produit complet' },
  pricing_row_skip_waitlist: { en: 'Skip the waitlist', fr: 'Sauter la liste d’attente' },
  pricing_row_help_centre: { en: 'Help Centre', fr: 'Centre d’aide' },
  pricing_row_support: { en: 'Support', fr: 'Soutien' },
  pricing_row_initial_reply: {
    en: 'Initial reply (business days)',
    fr: 'Première réponse (jours ouvrables)',
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
})
