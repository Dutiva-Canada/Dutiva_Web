import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Procédure de retrait de contenu',
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    "Cette procédure décrit le processus de signalement et de retrait de contenu présumément contrefaisant sur la plateforme Dutiva Canada Inc., conformément à la Loi sur le droit d'auteur du Canada.",
  ],
  sections: [
    {
      title: '1. Exigences pour la notification de retrait',
      blocks: [
        {
          type: 'p',
          text: "Pour qu'une notification de retrait soit valide et traitée, elle doit contenir les éléments suivants conformément à la Loi sur le droit d'auteur du Canada.",
        },
        {
          type: 'li',
          text: "Signature physique ou électronique du détenteur des droits d'auteur ou de son mandataire",
        },
        {
          type: 'li',
          text: "Identification de l'œuvre protégée par le droit d'auteur présumée violée",
        },
        {
          type: 'li',
          text: 'Identification du contenu présumément contrefaisant et de son emplacement sur la plateforme',
        },
        {
          type: 'li',
          text: 'Coordonnées complètes du plaignant (adresse, téléphone, courriel)',
        },
        {
          type: 'li',
          text: "Déclaration de bonne foi croyant que l'utilisation n'est pas autorisée",
        },
        {
          type: 'li',
          text: 'Déclaration sous peine de parjure que les informations sont exactes',
        },
      ],
    },
    {
      title: '2. Contre-notification',
      blocks: [
        {
          type: 'p',
          text: "Si vous croyez que le contenu a été retiré par erreur ou que vous avez le droit d'utiliser le contenu, vous pouvez soumettre une contre-notification.",
        },
        {
          type: 'li',
          text: 'Signature physique ou électronique',
        },
        {
          type: 'li',
          text: 'Identification du contenu retiré et son emplacement avant le retrait',
        },
        {
          type: 'li',
          text: 'Déclaration sous peine de parjure de bonne foi croyant que le retrait était une erreur',
        },
        {
          type: 'li',
          text: 'Consentement à la juridiction des tribunaux fédéraux canadiens',
        },
        {
          type: 'li',
          text: 'Délai de réponse de 10 à 14 jours ouvrables',
        },
      ],
    },
    {
      title: '3. Agent désigné de Dutiva',
      blocks: [
        {
          type: 'p',
          text: "Les notifications de retrait et les contre-notifications doivent être envoyées à notre agent désigné pour les questions de droit d'auteur.",
        },
        {
          type: 'li',
          text: 'Courriel : legal@dutiva.ca',
        },
        {
          type: 'li',
          text: 'Objet du courriel : Notification de retrait DMCA ou Contre-notification',
        },
        {
          type: 'li',
          text: 'Réponse initiale dans les 3 jours ouvrables suivant la réception',
        },
        {
          type: 'li',
          text: "Examens traités selon leur ordre d'arrivée",
        },
      ],
    },
    {
      title: '4. Référence légale',
      blocks: [
        {
          type: 'p',
          text: "Cette procédure est établie conformément à la Loi sur le droit d'auteur du Canada et aux principes applicables en matière de propriété intellectuelle.",
        },
        {
          type: 'li',
          text: "Loi sur le droit d'auteur du Canada, L.R.C. (1985), ch. C-42",
        },
        {
          type: 'li',
          text: 'Dutiva traite toutes les notifications de bonne foi avec diligence',
        },
        {
          type: 'li',
          text: 'Les comptes des contrevenants récidivistes peuvent être suspendus ou résiliés',
        },
        {
          type: 'li',
          text: 'Dutiva se réserve le droit de contester des notifications abusives',
        },
      ],
    },
  ],
} satisfies PolicyEdition
