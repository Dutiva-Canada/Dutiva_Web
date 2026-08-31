import type { PolicyEdition } from '../policyContent'

export default {
  title: "Contrat d'abonnement SaaS",
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    "Le présent contrat d'abonnement SaaS (le « Contrat ») régit les abonnements à la plateforme Dutiva entre Dutiva Canada Inc. (« Dutiva ») et le client abonné (le « Client »). En souscrivant à un forfait payant, le Client accepte les conditions du présent Contrat, des Conditions d'utilisation de Dutiva, de la Politique de confidentialité et, le cas échéant, du Contrat de traitement des données, tous incorporés par référence.",
  ],
  sections: [
    {
      title: '1. Abonnement et accès',
      blocks: [
        {
          type: 'p',
          text: "Dutiva accorde au Client un droit limité, non exclusif et non transférable d'accéder à la plateforme Dutiva et de l'utiliser pendant la durée de l'abonnement, sous réserve des limites d'utilisation, des fonctionnalités et des restrictions du forfait sélectionné.",
        },
        {
          type: 'p',
          text: "Les fonctionnalités, limites d'utilisation et tarifs applicables à l'abonnement du Client sont définis sur la page de tarification à dutiva.ca/pricing à la date de souscription, ou dans un bon de commande signé entre les parties pour les abonnements Entreprise.",
        },
      ],
    },
    {
      title: "2. Durée de l'abonnement",
      blocks: [
        {
          type: 'p',
          text: "Abonnements mensuels : la durée initiale de l'abonnement commence à la date du premier paiement réussi et se poursuit pendant un mois civil. L'abonnement se renouvelle automatiquement chaque mois à la même date, sauf annulation conformément à la Politique de remboursement et d'annulation.",
        },
        {
          type: 'p',
          text: "Abonnements annuels : la durée initiale de l'abonnement commence à la date du premier paiement réussi et se poursuit pendant douze mois. L'abonnement se renouvelle automatiquement à l'anniversaire de la date de début, sauf annulation conformément à la Politique de remboursement et d'annulation.",
        },
      ],
    },
    {
      title: '3. Conditions de paiement',
      blocks: [
        {
          type: 'p',
          text: "Tous les frais sont payables en dollars canadiens (CAD) avant les taxes applicables. Le paiement est dû à l'avance au début de chaque période d'abonnement. Les paiements sont traités via Stripe. Le Client autorise Dutiva à débiter le moyen de paiement enregistré pour tous les montants dus.",
        },
        {
          type: 'p',
          text: "En cas d'échec de paiement, Dutiva notifiera le Client et lui accordera un délai pour mettre à jour ses informations de paiement. Dutiva se réserve le droit de suspendre l'accès à la plateforme si des montants impayés persistent après un préavis raisonnable.",
        },
        {
          type: 'p',
          text: "Les taxes de vente canadiennes fédérales et provinciales applicables (TPS, TVH, TVQ) seront ajoutées aux frais en fonction de l'adresse de facturation du Client.",
        },
      ],
    },
    {
      title: '4. Renouvellement automatique et annulation',
      blocks: [
        {
          type: 'p',
          text: "Les abonnements se renouvellent automatiquement sauf si le Client annule avant la date de renouvellement conformément à la Politique de remboursement et d'annulation. Dutiva enverra un courriel de rappel avant les renouvellements annuels.",
        },
        {
          type: 'p',
          text: "L'annulation ne donne pas droit à un remboursement pour la période payée en cours, sauf disposition contraire de la Politique de remboursement et d'annulation. L'accès se poursuit jusqu'à la fin de la durée d'abonnement en cours, sauf lorsqu'un remboursement est accordé en vertu de cette politique, auquel cas l'accès prend fin à la date du remboursement.",
        },
      ],
    },
    {
      title: "5. Limites d'utilisation",
      blocks: [
        {
          type: 'p',
          text: "Chaque forfait comprend des limites d'utilisation mensuelles définies pour les messages du conseiller, les générations de documents, les documents enregistrés, les exportations, les révisions de conformité et d'autres fonctionnalités tels qu'indiqués sur la page de tarification. L'utilisation est réinitialisée au début de chaque cycle de facturation. Les droits non utilisés ne sont pas reportés.",
        },
        {
          type: 'p',
          text: "Dutiva se réserve le droit d'appliquer des limites d'utilisation et de demander une mise à niveau du forfait pour accéder à une capacité supplémentaire. Dutiva fournira un préavis raisonnable avant d'appliquer de nouvelles limites aux abonnements existants.",
        },
      ],
    },
    {
      title: '6. Documents incorporés',
      blocks: [
        {
          type: 'p',
          text: "Le présent Contrat incorpore par référence : les Conditions d'utilisation de Dutiva (dutiva.ca/terms) ; la Politique de confidentialité (dutiva.ca/privacy) ; le Contrat de traitement des données (dutiva.ca/data-processing-agreement) ; et la Politique d'utilisation acceptable (dutiva.ca/acceptable-use).",
        },
      ],
    },
    {
      title: '7. Bons de commande Entreprise',
      blocks: [
        {
          type: 'p',
          text: "Les abonnements Entreprise peuvent être régis par un bon de commande distinct signé entre Dutiva et le Client. Les bons de commande précisent les tarifs, la durée, le nombre de sièges, les limites d'utilisation, les conditions de soutien personnalisées et toute autre condition convenue mutuellement.",
        },
        {
          type: 'p',
          text: "Pour discuter d'un abonnement Entreprise, contactez support@dutiva.ca.",
        },
      ],
    },
    {
      title: '8. Droit applicable',
      blocks: [
        {
          type: 'p',
          text: "Le présent Contrat est régi par les lois de la Province d'Ontario et les lois fédérales canadiennes applicables. Tout différend découlant du présent Contrat sera soumis à la compétence exclusive des tribunaux de l'Ontario.",
        },
      ],
    },
  ],
} satisfies PolicyEdition
