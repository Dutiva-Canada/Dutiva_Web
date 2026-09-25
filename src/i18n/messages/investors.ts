import { defineMessages } from '../core'

/**
 * Public /investors landing copy — the marketing door to the invite-only
 * /invest portal. Deliberately hedged: informational and educational
 * tooling, never advice, and access is granted by invitation.
 *
 * [FR self-authored — no design handoff; reviewed against the copy rules.]
 */
export const investorsMessages = defineMessages({
  investors_eyebrow: { en: 'For invited clients', fr: 'Pour les clients invités' },
  investors_h1: { en: 'Dutiva Invest', fr: 'Dutiva Investir' },
  investors_intro: {
    en: 'A portfolio workspace for the clients we work with directly — track positions across equities, ETFs, crypto, and fixed income, run rules-based checks against your watchlist, and keep a record of every order, simulated or real.',
    fr: 'Un espace portefeuille pour les clients avec lesquels nous travaillons directement — suivez vos positions en actions, FNB, cryptoactifs et titres à revenu fixe, appliquez des vérifications fondées sur des règles à votre liste de surveillance et conservez une trace de chaque ordre, simulé ou réel.',
  },
  investors_f1_t: { en: 'Track every holding in one place', fr: 'Toutes vos positions au même endroit' },
  investors_f1_b: {
    en: 'Accounts and positions across asset classes, with manual price updates and a live view of allocation and cash.',
    fr: 'Comptes et positions, toutes classes d’actifs confondues, avec mises à jour manuelles des cours et vue en direct de la répartition et de l’encaisse.',
  },
  investors_f2_t: { en: 'Signals from your own rules', fr: 'Des signaux selon vos propres règles' },
  investors_f2_b: {
    en: 'Define simple rules — a day move past a threshold, a dip below an average — and the bot evaluates them daily and on demand, logging what it found and why.',
    fr: 'Définissez des règles simples — un mouvement quotidien au-delà d’un seuil, un repli sous une moyenne — et le robot les évalue chaque jour et sur demande, en consignant ses constats.',
  },
  investors_f3_t: { en: 'Paper trades before real ones', fr: 'Des transactions simulées avant les vraies' },
  investors_f3_b: {
    en: 'Strategies can suggest orders or fill them in a simulated book, so a rule proves itself before any real order is recorded. Live orders are logged for review — never sent to a broker.',
    fr: 'Les stratégies peuvent suggérer des ordres ou les exécuter dans un livre simulé, pour éprouver une règle avant tout ordre réel. Les ordres réels sont consignés pour révision — jamais transmis à un courtier.',
  },
  investors_access_t: { en: 'Access is by invitation', fr: 'L’accès se fait sur invitation' },
  investors_access_b: {
    en: 'Dutiva Invest is not a self-serve product. If you work with us, ask for an invite and we’ll enable it on your account.',
    fr: 'Dutiva Investir n’est pas un produit en libre-service. Si vous travaillez avec nous, demandez une invitation et nous l’activerons sur votre compte.',
  },
  investors_cta_t: { en: 'Have an invite?', fr: 'Vous avez une invitation ?' },
  investors_cta_p: {
    en: 'Sign in with the email we invited — a one-time code, no password.',
    fr: 'Connectez-vous avec le courriel invité — un code à usage unique, sans mot de passe.',
  },
  investors_cta_btn: { en: 'Open the portal', fr: 'Ouvrir le portail' },
  investors_disclaimer: {
    en: 'Dutiva Invest provides portfolio tracking and analysis tools for informational and educational purposes only. It is not investment advice, and Dutiva is not a registered dealer or adviser.',
    fr: 'Dutiva Investir offre des outils de suivi et d’analyse de portefeuille à des fins informatives et éducatives seulement. Ce n’est pas un conseil en placement, et Dutiva n’est pas un courtier ni un conseiller inscrit.',
  },
})
