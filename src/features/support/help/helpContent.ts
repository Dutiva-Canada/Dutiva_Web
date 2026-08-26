import { bi, pick } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
import type { HelpArticle, HelpBlock, HelpSection } from './helpCenterData'

/**
 * Help Centre article bodies, keyed by English slug.
 *
 * Split from helpCenterData.ts for the same reason the editorial articles are
 * (see marketing/articles/articleModel.ts): `src/seo/routes.ts` reads every
 * help article to mint its URL pair, and the router imports that registry — so
 * a `sections` field on `HelpArticle` put every word of the Help Centre in
 * the eager entry graph of every public page.
 *
 * Everything that reads a body is lazy: HelpArticlePage, the Help Centre
 * search, and the support first-line helper. `scripts/check-entry-graph.mjs`
 * fails the build if this module is reached eagerly again.
 */

const p = (en: string, fr: string): HelpBlock => ({ type: 'p', text: bi(en, fr) })
const li = (en: string, fr: string): HelpBlock => ({ type: 'li', text: bi(en, fr) })

export const HELP_SECTIONS: Record<string, readonly HelpSection[]> = {
  'signing-in': [
    {
      blocks: [
        p(
          'Dutiva uses passwordless sign-in. Enter the email address on your account and we email you a 6-digit sign-in code, along with a link. Type the code on the sign-in screen — or open the link and press “Confirm sign-in” — and you’re in.',
          'Dutiva utilise une connexion sans mot de passe. Saisissez l’adresse courriel de votre compte et nous vous envoyons un code de connexion à 6 chiffres, accompagné d’un lien. Saisissez le code sur l’écran de connexion — ou ouvrez le lien et appuyez sur « Confirmer la connexion » — et vous y êtes.',
        ),
      ],
    },
    {
      heading: bi('If the link doesn’t work', 'Si le lien ne fonctionne pas'),
      blocks: [
        li(
          'Type the 6-digit code instead. Some corporate mail systems open links automatically to scan them, which can use up a one-time link before you click it. A code can’t be used up that way.',
          'Saisissez plutôt le code à 6 chiffres. Certains systèmes de messagerie d’entreprise ouvrent automatiquement les liens pour les analyser, ce qui peut consommer un lien à usage unique avant même que vous cliquiez. Un code ne peut pas être consommé de cette façon.',
        ),
        li(
          'Each code and link can be used once and expires after a short time. Request a new one if it has been a while.',
          'Chaque code et chaque lien ne peuvent être utilisés qu’une fois et expirent après un court délai. Demandez-en un nouveau s’il s’est écoulé du temps.',
        ),
        li(
          'Open the most recent email — an older code or link is no longer valid.',
          'Ouvrez le courriel le plus récent — un code ou un lien plus ancien n’est plus valide.',
        ),
        li(
          'You can use the code or link on any device; you don’t have to use the same browser that requested it.',
          'Vous pouvez utiliser le code ou le lien sur n’importe quel appareil; vous n’êtes pas obligé d’utiliser le même navigateur que celui qui l’a demandé.',
        ),
      ],
    },
    {
      blocks: [
        p(
          'Dutiva is currently invite-only. If your email isn’t recognized, ask the person who set up your workspace to invite you, or contact support.',
          'Dutiva est actuellement accessible sur invitation seulement. Si votre courriel n’est pas reconnu, demandez à la personne qui a configuré votre espace de travail de vous inviter, ou communiquez avec le soutien.',
        ),
      ],
    },
  ],
  'switching-language': [
    {
      blocks: [
        p(
          'Every part of Dutiva — the app, this Help Centre, and our public pages — is available in English and French. Use the language toggle in the header to switch. Your choice is remembered on your device.',
          'Chaque partie de Dutiva — l’application, ce centre d’aide et nos pages publiques — est offerte en anglais et en français. Utilisez le sélecteur de langue dans l’en-tête pour changer. Votre choix est mémorisé sur votre appareil.',
        ),
        p(
          'When you send a support request, you can also tell us which language you’d prefer for our reply.',
          'Lorsque vous envoyez une demande de soutien, vous pouvez aussi nous indiquer la langue que vous préférez pour notre réponse.',
        ),
      ],
    },
  ],
  'generate-a-document': [
    {
      blocks: [
        p(
          'The HR Documents Library holds Dutiva’s templates. Open Document Studio, pick a template that fits your situation, and follow the prompts — Dutiva assembles a draft you can review, edit, and save to your workspace.',
          'La bibliothèque de documents RH contient les modèles de Dutiva. Ouvrez le Studio de documents, choisissez un modèle adapté à votre situation et suivez les questions — Dutiva assemble une ébauche que vous pouvez relire, modifier et enregistrer dans votre espace de travail.',
        ),
      ],
    },
    {
      heading: bi('Before you rely on a draft', 'Avant de vous fier à une ébauche'),
      blocks: [
        li(
          'Read the whole document and adjust it to your workplace, contracts, and current facts.',
          'Lisez le document en entier et adaptez-le à votre milieu de travail, à vos contrats et aux faits actuels.',
        ),
        li(
          'Templates are a starting point, not legal advice. For terminations, accommodations, or other high-risk matters, obtain qualified review.',
          'Les modèles sont un point de départ, et non un avis juridique. Pour les congédiements, les mesures d’adaptation ou d’autres situations à risque élevé, obtenez une révision qualifiée.',
        ),
      ],
    },
  ],
  'how-templates-work': [
    {
      blocks: [
        p(
          'Dutiva’s templates are written to reflect common Canadian employment practices and are organized by jurisdiction where that matters. They give you a structured, professional draft to build on.',
          'Les modèles de Dutiva sont rédigés pour refléter les pratiques d’emploi canadiennes courantes et sont organisés par régime lorsque cela est pertinent. Ils vous donnent une ébauche structurée et professionnelle sur laquelle bâtir.',
        ),
        p(
          'They do not replace advice from a qualified HR professional or lawyer, and they can’t account for every workplace policy, collective agreement, or fact. You stay responsible for the final document and the decision behind it.',
          'Ils ne remplacent pas les conseils d’un professionnel des RH ou d’un avocat qualifié, et ne peuvent tenir compte de chaque politique de travail, convention collective ou fait. Vous demeurez responsable du document final et de la décision qui le sous-tend.',
        ),
      ],
    },
  ],
  'using-the-advisor': [
    {
      blocks: [
        p(
          'The Dutiva Advisor is an AI assistant for HR workflow questions. It works best when you set the relevant province, territory, or federal regime and describe your situation plainly. It draws on Dutiva’s HR guidance to ground its answers and flags where a matter should go to a professional.',
          'Le Conseiller Dutiva est un assistant IA pour les questions de flux de travail RH. Il fonctionne mieux lorsque vous précisez la province, le territoire ou le régime fédéral pertinent et décrivez votre situation simplement. Il s’appuie sur les directives RH de Dutiva pour fonder ses réponses et signale les situations à confier à un professionnel.',
        ),
      ],
    },
    {
      heading: bi('Tips for better answers', 'Conseils pour de meilleures réponses'),
      blocks: [
        li(
          'Set your jurisdiction — employment rules differ across Canada.',
          'Précisez votre régime — les règles d’emploi diffèrent partout au Canada.',
        ),
        li(
          'Give the relevant facts, but don’t paste sensitive employee records, medical details, or identifiers you don’t need to share.',
          'Donnez les faits pertinents, mais ne collez pas de dossiers d’employés sensibles, de renseignements médicaux ni d’identifiants que vous n’avez pas besoin de partager.',
        ),
        li(
          'Treat answers as a starting point and confirm them against current law and your own context.',
          'Considérez les réponses comme un point de départ et vérifiez-les au regard du droit en vigueur et de votre propre contexte.',
        ),
      ],
    },
  ],
  'advisor-limits-and-review': [
    {
      blocks: [
        p(
          'AI systems can produce inaccurate, incomplete, or outdated content. Dutiva provides HR workflow support and compliance-oriented guidance — not legal advice — and it does not make final workplace decisions for you.',
          'Les systèmes d’IA peuvent produire du contenu inexact, incomplet ou périmé. Dutiva offre un soutien aux flux de travail RH et des directives axées sur la conformité — pas un avis juridique — et ne prend pas de décisions finales en milieu de travail à votre place.',
        ),
        p(
          'For higher-risk matters — terminations, layoffs, accommodations, investigations, privacy incidents, pay equity, or unionized-workplace issues — the Advisor will point you toward qualified legal or professional review. That’s by design: you remain responsible for reviewing outputs, confirming facts, and applying current law.',
          'Pour les situations à risque plus élevé — congédiements, mises à pied, mesures d’adaptation, enquêtes, incidents de confidentialité, équité salariale ou questions liées à un milieu syndiqué — le Conseiller vous orientera vers une révision juridique ou professionnelle qualifiée. C’est voulu : vous demeurez responsable de relire les résultats, de confirmer les faits et d’appliquer le droit en vigueur.',
        ),
      ],
    },
  ],
  'plans-and-invoices': [
    {
      blocks: [
        p(
          'Dutiva plans are billed in Canadian dollars with no long-term contract. From the billing portal you can see your current plan, update your payment method, download invoices, and change or cancel your subscription.',
          'Les forfaits Dutiva sont facturés en dollars canadiens sans contrat à long terme. Depuis le portail de facturation, vous pouvez voir votre forfait actuel, mettre à jour votre mode de paiement, télécharger vos factures et modifier ou annuler votre abonnement.',
        ),
        p(
          'New annual subscriptions include a 14-day money-back guarantee; monthly plans are non-refundable after the billing date, apart from documented billing errors or an outage over 24 consecutive hours. See the Refund and Cancellation Policy for full terms. For a billing question or dispute, send a request under “Billing” and include the invoice or subscription reference — please don’t email full card numbers.',
          'Les nouveaux abonnements annuels comprennent une garantie de remboursement de 14 jours; les forfaits mensuels ne sont pas remboursables après la date de facturation, sauf erreur de facturation documentée ou panne de plus de 24 heures consécutives. Consultez la Politique de remboursement et d’annulation pour les conditions complètes. Pour une question ou un différend de facturation, envoyez une demande sous « Facturation » et incluez la référence de facture ou d’abonnement — veuillez ne pas envoyer de numéros de carte complets par courriel.',
        ),
      ],
    },
  ],
  'recover-account-access': [
    {
      blocks: [
        p(
          'If you can’t get in, first request a fresh sign-in link and check your most recent email. If you no longer have access to the email on file, or your address has changed, send a support request under “Account access” and tell us whether you can still sign in.',
          'Si vous n’arrivez pas à vous connecter, demandez d’abord un nouveau lien de connexion et vérifiez votre courriel le plus récent. Si vous n’avez plus accès au courriel enregistré, ou si votre adresse a changé, envoyez une demande de soutien sous « Accès au compte » et indiquez-nous si vous pouvez encore vous connecter.',
        ),
        p(
          'To protect your account, we may need to verify your identity before changing the email address associated with it. Complex account recovery is one of the situations where we may arrange a scheduled call.',
          'Pour protéger votre compte, nous pourrions devoir vérifier votre identité avant de modifier l’adresse courriel qui y est associée. La récupération de compte complexe est l’une des situations où nous pouvons organiser un appel planifié.',
        ),
      ],
    },
  ],
  'how-your-data-is-protected': [
    {
      blocks: [
        p(
          'Traffic between you and Dutiva is encrypted with TLS, and your data is encrypted at rest. Access to workspace data is enforced at the database level, so accounts only reach data that belongs to them, and internal access to production is restricted.',
          'Le trafic entre vous et Dutiva est chiffré au moyen de TLS, et vos données sont chiffrées au repos. L’accès aux données d’espace de travail est appliqué au niveau de la base de données, de sorte que les comptes n’atteignent que les données qui leur appartiennent, et l’accès interne à la production est restreint.',
        ),
        p(
          'For the full picture — infrastructure, encryption, access management, vulnerability handling, and incident response — see the Security Overview in our legal documents. To report a vulnerability, use the “Security concern” category or email security@dutiva.ca.',
          'Pour le portrait complet — infrastructure, chiffrement, gestion des accès, traitement des vulnérabilités et intervention en cas d’incident — consultez l’Aperçu de la sécurité dans nos documents juridiques. Pour signaler une vulnérabilité, utilisez la catégorie « Préoccupation de sécurité » ou écrivez à security@dutiva.ca.',
        ),
      ],
    },
  ],
  'making-a-privacy-request': [
    {
      blocks: [
        p(
          'You can ask about the personal information Dutiva holds and, where applicable, request access, correction, or deletion under PIPEDA and Quebec’s Law 25. Send these through the “Privacy request” category or to privacy@dutiva.ca — they’re handled separately from ordinary support.',
          'Vous pouvez vous renseigner sur les renseignements personnels que détient Dutiva et, s’il y a lieu, demander l’accès, la correction ou la suppression en vertu de la LPRPDE et de la Loi 25 du Québec. Envoyez ces demandes au moyen de la catégorie « Demande de confidentialité » ou à privacy@dutiva.ca — elles sont traitées séparément du soutien ordinaire.',
        ),
        p(
          'We may need to verify your identity before acting on a request. Please don’t attach identity documents to your first message — we’ll provide secure instructions if they’re needed.',
          'Nous pourrions devoir vérifier votre identité avant de donner suite à une demande. Veuillez ne pas joindre de pièces d’identité à votre premier message — nous fournirons des instructions sécurisées au besoin.',
        ),
      ],
    },
  ],
  'how-support-works': [
    {
      blocks: [
        p(
          'Dutiva provides support through this Help Centre, secure support requests, and email. General inbound telephone support isn’t offered. When an issue can’t reasonably be resolved in writing — including certain accessibility, security, account-recovery, or exceptional matters — we may arrange a telephone or video appointment.',
          'Dutiva offre du soutien par l’intermédiaire de ce centre d’aide, de demandes de soutien sécurisées et du courriel. Le soutien téléphonique entrant général n’est pas offert. Lorsqu’une situation ne peut raisonnablement être réglée par écrit — notamment certaines questions d’accessibilité, de sécurité, de récupération de compte ou exceptionnelles — nous pouvons organiser un rendez-vous téléphonique ou vidéo.',
        ),
      ],
    },
    {
      heading: bi('When to expect a reply', 'Quand attendre une réponse'),
      blocks: [
        p(
          'When you submit a request you get an automatic acknowledgement with a reference number, and we reply in writing to the same ticket. Initial-reply targets depend on plan and ticket priority, measured in business days — they’re targets, not guaranteed resolution times. Starter (and waitlisted accounts) aim for 2 business days; Growth and Pro product tickets aim for 1 business day. Privacy, security, accessibility, and complaint requests keep their existing handling. Business days exclude weekends and Ontario statutory holidays.',
          'Lorsque vous soumettez une demande, vous recevez un accusé de réception automatique avec un numéro de référence, et nous répondons par écrit dans le même billet. Les cibles de première réponse dépendent du forfait et de la priorité du billet, mesurées en jours ouvrables — ce sont des cibles, pas des délais de résolution garantis. Starter (et les comptes en liste d’attente) visent 2 jours ouvrables; les billets produit Growth et Pro visent 1 jour ouvrable. Les demandes de confidentialité, de sécurité, d’accessibilité et les plaintes gardent leur traitement existant. Les jours ouvrables excluent les fins de semaine et les jours fériés légaux de l’Ontario.',
        ),
      ],
    },
  ],
  'writing-a-good-request': [
    {
      heading: bi('Help us help you faster', 'Aidez-nous à vous aider plus vite'),
      blocks: [
        li(
          'A short, specific subject and a clear description of what you expected versus what happened.',
          'Un sujet court et précis et une description claire de ce que vous attendiez par rapport à ce qui s’est produit.',
        ),
        li(
          'Steps to reproduce the problem, the page or feature involved, and any error message.',
          'Les étapes pour reproduire le problème, la page ou la fonctionnalité concernée et tout message d’erreur.',
        ),
        li(
          'How much it’s affecting you and how time-sensitive it is — this helps us set priority.',
          'L’ampleur de l’impact et le degré d’urgence — cela nous aide à établir la priorité.',
        ),
      ],
    },
    {
      heading: bi('Please leave out', 'À ne pas inclure'),
      blocks: [
        p(
          'Don’t include unnecessary employee personal information, medical information, investigation evidence, passwords, or authentication codes. Dutiva will provide secure instructions if additional information is required. When you send a request from inside the app, we attach limited, non-sensitive technical context (like your current page and app version) that you can review and remove before submitting.',
          'N’incluez pas inutilement de renseignements personnels sur des employés, de renseignements médicaux, de preuves d’enquête, de mots de passe ni de codes d’authentification. Dutiva fournira des instructions sécurisées si des renseignements supplémentaires sont nécessaires. Lorsque vous envoyez une demande depuis l’application, nous joignons un contexte technique limité et non sensible (comme votre page actuelle et la version de l’application) que vous pouvez examiner et retirer avant de soumettre.',
        ),
      ],
    },
  ],
}

/** An article's body, or [] for an unknown slug — the page degrades rather
    than throwing. `helpCenter.test.ts` asserts no article resolves to []. */
export function helpArticleSections(slug: string): readonly HelpSection[] {
  return HELP_SECTIONS[slug] ?? []
}

/** Flatten an article to plain text (headings + blocks) — used as grounding
    context for the first-line answer helper, and by Help Centre search. */
export function articlePlainText(article: HelpArticle, lang: Lang): string {
  return helpArticleSections(article.slug)
    .flatMap((s: HelpSection) => [
      ...(s.heading ? [pick(s.heading, lang)] : []),
      ...s.blocks.map((b: { text: Bi }) => pick(b.text, lang)),
    ])
    .join(' ')
}
