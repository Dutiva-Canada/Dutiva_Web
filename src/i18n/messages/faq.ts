import { BETA_COHORT_LIMIT } from '@/config/beta'
import { defineMessages } from '../core'

/**
 * FAQ page — page-specific EN + FR strings, extracted from the Dutiva marketing
 * prototype (faq.dc.html). Shared header/footer chrome already lives in landing.ts —
 * reuse those keys; do not duplicate them here. Register the spread below in
 * src/i18n/messages/index.ts. Keys are feature-prefixed per CONVENTIONS.md.
 */
export const faqMessages = defineMessages({
  faq_eyebrow: { en: 'FAQ', fr: 'FAQ' },
  faq_h1: { en: 'Frequently asked questions.', fr: 'Foire aux questions.' },
  faq_intro: {
    en: 'Answers to common questions about Dutiva — what it does, how it handles Canadian compliance, and how your data is protected.',
    fr: 'Réponses aux questions courantes sur Dutiva — ce qu’il fait, comment il gère la conformité canadienne et comment vos données sont protégées.',
  },
  faq_g_title: { en: 'General', fr: 'Général' },
  faq_q1: { en: 'Is Dutiva a law firm?', fr: 'Dutiva est-il un cabinet d’avocats ?' },
  faq_a1: {
    en: 'No. Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice. Complex or high-risk situations should be reviewed with qualified counsel.',
    fr: 'Non. Dutiva offre un soutien pratique aux processus RH et des conseils axés sur la conformité. Il ne fournit pas d’avis juridique. Les situations complexes ou à risque élevé devraient être révisées avec un conseiller juridique qualifié.',
  },
  faq_q2: { en: 'Who is Dutiva for?', fr: 'À qui s’adresse Dutiva ?' },
  faq_a2: {
    en: 'Small and mid-sized Canadian employers — and the HR consultants who serve them — who need jurisdiction-aware HR guidance and review-ready documents.',
    fr: 'Aux PME canadiennes — et aux conseillers RH qui les accompagnent — qui ont besoin de conseils RH adaptés à la compétence applicable et de documents prêts à réviser.',
  },
  faq_q3: { en: 'Is Dutiva bilingual?', fr: 'Dutiva est-il bilingue ?' },
  faq_a3: {
    en: 'Yes. Every workflow ships in English and professional, Québec-appropriate French. Switch languages any time with the EN/FR toggle.',
    fr: 'Oui. Chaque processus est offert en anglais et en français professionnel adapté au Québec. Changez de langue à tout moment avec le sélecteur EN/FR.',
  },
  faq_q13: { en: 'Does Dutiva run payroll?', fr: 'Dutiva gère-t-il la paie ?' },
  faq_a13: {
    en: 'No. Dutiva is HR compliance and documentation software — not a payroll provider. It does not process payroll, run pay cycles, remit source deductions, or issue pay. Dutiva helps Canadian employers with jurisdiction-aware HR guidance and review-ready documents across the employee lifecycle.',
    fr: 'Non. Dutiva est un logiciel de conformité et de documentation RH — et non un fournisseur de paie. Il ne traite pas la paie, n’effectue pas de cycles de paie, ne verse pas les retenues à la source et n’émet pas la paie. Dutiva aide les employeurs canadiens grâce à des conseils RH adaptés à la compétence applicable et à des documents prêts à réviser tout au long du cycle de vie de l’employé.',
  },
  faq_c_title: { en: 'Compliance & coverage', fr: 'Conformité et couverture' },
  faq_q4: {
    en: 'Which jurisdictions does Dutiva cover?',
    fr: 'Quelles compétences Dutiva couvre-t-il ?',
  },
  faq_a4: {
    en: 'Ontario (Employment Standards Act, 2000), Quebec (Act respecting labour standards), and Federal (Canada Labour Code, Part III), including federal remote work. Alberta and British Columbia are coming soon.',
    fr: 'L’Ontario (Loi de 2000 sur les normes d’emploi), le Québec (Loi sur les normes du travail) et le fédéral (Code canadien du travail, Partie III), y compris le télétravail fédéral. L’Alberta et la Colombie-Britannique suivront bientôt.',
  },
  faq_q5: {
    en: 'Does Dutiva give legal advice?',
    fr: 'Dutiva donne-t-il des conseils juridiques ?',
  },
  faq_a5: {
    en: 'No. Dutiva names the applicable statute and structures the work, but high-risk matters should be reviewed with qualified counsel — Advisor flags when to escalate.',
    fr: 'Non. Dutiva nomme la loi applicable et structure le travail, mais les enjeux à risque élevé devraient être révisés avec un conseiller juridique qualifié — le Conseiller indique quand escalader.',
  },
  faq_q6: { en: 'How accurate is the AI?', fr: 'Quelle est la fiabilité de l’IA ?' },
  faq_a6: {
    en: 'Advisor is grounded in the actual employment standards, but AI can make mistakes. Always verify statutory citations and thresholds against the primary source before relying on them.',
    fr: 'Le Conseiller est ancré dans les normes du travail réelles, mais l’IA peut se tromper. Vérifiez toujours les citations législatives et les seuils auprès de la source primaire avant de vous y fier.',
  },
  faq_d_title: { en: 'Data & security', fr: 'Données et sécurité' },
  faq_q7: { en: 'Where is my data processed?', fr: 'Où mes données sont-elles traitées ?' },
  faq_a7: {
    en: 'Dutiva is PIPEDA-conscious and Quebec Law 25-aware. Some processing occurs outside Canada with appropriate safeguards — see the Cross-Border Data Transfer Disclosure.',
    fr: 'Dutiva est conforme à la LPRPDE et tient compte de la Loi 25 du Québec. Certains traitements ont lieu à l’extérieur du Canada avec des mesures de protection appropriées — consultez la Divulgation sur le transfert transfrontalier de données.',
  },
  faq_q8: {
    en: 'Is my data used to train AI models?',
    fr: 'Mes données servent-elles à entraîner des modèles d’IA ?',
  },
  faq_a8: {
    en: 'No. Inputs sent to AI providers are processed transiently and are not retained to train third-party foundation models under Dutiva’s arrangement. Do not paste highly sensitive information — such as full SINs, medical details, or privileged legal notes — into the Advisor unless your organization has a lawful basis and a controlled workflow for that data.',
    fr: 'Non. Les données envoyées aux fournisseurs d’IA sont traitées de façon transitoire et ne sont pas conservées pour entraîner des modèles de fondation tiers dans le cadre de l’entente de Dutiva. Ne collez pas de renseignements hautement sensibles — tels que des NAS complets, des détails médicaux ou des notes juridiques confidentielles — dans le Conseiller, sauf si votre organisation dispose d’un fondement légal et d’un processus contrôlé pour ces données.',
  },
  faq_q9: { en: 'How do I delete my data?', fr: 'Comment supprimer mes données ?' },
  faq_a9: {
    en: 'Email privacy@dutiva.ca with the subject line “Deletion Request”. See the User Data Deletion Procedures for the full process.',
    fr: 'Écrivez à privacy@dutiva.ca avec l’objet « Demande de suppression ». Consultez les Procédures de suppression des données de l’utilisateur pour le processus complet.',
  },
  faq_p_title: { en: 'Pricing & billing', fr: 'Tarifs et facturation' },
  faq_q10: { en: 'How much does Dutiva cost?', fr: 'Combien coûte Dutiva ?' },
  faq_a10: {
    en: 'Free / Beta, Starter at $24/mo, Growth at $49/mo (most popular), and Professional at $99/mo. Prices in CAD; monthly billing is available now and annual billing is coming soon.',
    fr: 'Gratuit / Bêta, Starter à 24 $/mois, Growth à 49 $/mois (le plus populaire) et Professional à 99 $/mois. Prix en CAD ; facturation mensuelle disponible maintenant et facturation annuelle à venir.',
  },
  faq_q11: { en: 'Is there a free trial?', fr: 'Y a-t-il un essai gratuit ?' },
  /* Deviates from the prototype: beta capacity decision, 2026-08-07 — the
     answer now states the cohort limit. Number interpolated from
     BETA_COHORT_LIMIT. [FR self-authored] */
  faq_a11: {
    en: `Yes — join the beta free, no credit card required. The beta accepts ${BETA_COHORT_LIMIT} individuals and organizations to begin; once those spots are taken, new signups join the waiting list and we email them as spots open. Open the Advisor and generate a document to see how it works.`,
    fr: `Oui — rejoignez la version bêta gratuitement, sans carte de crédit. La bêta accepte ${BETA_COHORT_LIMIT} personnes et organisations pour commencer; une fois ces places prises, les nouvelles inscriptions rejoignent la liste d’attente et nous leur écrivons dès que des places se libèrent. Ouvrez le Conseiller et générez un document pour voir comment ça fonctionne.`,
  },
  faq_q12: {
    en: 'What is your refund policy?',
    fr: 'Quelle est votre politique de remboursement ?',
  },
  faq_a12: {
    en: 'Once annual subscriptions are available, new annual subscriptions include a 14-day money-back guarantee. Monthly plans are non-refundable after the billing date, apart from documented billing errors or a service outage over 24 consecutive hours. You can cancel anytime — access continues to the end of your billing period. See the Refund and Cancellation Policy for full terms.',
    fr: 'Une fois les abonnements annuels disponibles, les nouveaux abonnements annuels comprennent une garantie de remboursement de 14 jours. Les forfaits mensuels ne sont pas remboursables après la date de facturation, sauf erreur de facturation documentée ou panne de service de plus de 24 heures consécutives. Vous pouvez annuler à tout moment — l’accès se poursuit jusqu’à la fin de votre période de facturation. Consultez la Politique de remboursement et d’annulation pour les conditions complètes.',
  },
  faq_closing_t: { en: 'Still have questions?', fr: 'D’autres questions ?' },
  faq_closing_p: {
    en: "Email our team and we'll help you get set up.",
    fr: 'Écrivez à notre équipe et nous vous aiderons à démarrer.',
  },
  faq_closing_btn: { en: 'Contact support', fr: 'Contacter le soutien' },
})
