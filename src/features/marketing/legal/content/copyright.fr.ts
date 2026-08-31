import type { PolicyEdition } from '../policyContent'

export default {
  title: "Politique sur le droit d'auteur",
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    "Cette politique décrit la propriété des droits d'auteur relatifs à la plateforme Dutiva Canada Inc. et aux contenus créés par nos utilisateurs. Elle explique également comment signaler une violation présumée du droit d'auteur.",
  ],
  sections: [
    {
      title: '1. Propriété du contenu de la plateforme',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva Canada Inc. détient tous les droits de propriété intellectuelle relatifs à la plateforme Dutiva, y compris le logiciel, les designs, les logos, les textes, les graphiques et tout autre matériel.',
        },
        {
          type: 'li',
          text: "Le code source, l'architecture et les algorithmes sont la propriété exclusive de Dutiva",
        },
        {
          type: 'li',
          text: 'Les marques de commerce et logos de Dutiva sont protégés',
        },
        {
          type: 'li',
          text: "La mise en page, les designs d'interface et les éléments visuels sont protégés",
        },
        {
          type: 'li',
          text: 'Toute reproduction non autorisée est strictement interdite',
        },
      ],
    },
    {
      title: "2. Droits de l'utilisateur sur ses entrées",
      blocks: [
        {
          type: 'p',
          text: 'Vous conservez tous les droits de propriété intellectuelle sur les données, documents et informations que vous saisissez ou téléversez dans la plateforme Dutiva.',
        },
        {
          type: 'li',
          text: "Vous conservez la propriété de vos documents, textes et données d'entrée",
        },
        {
          type: 'li',
          text: 'Vous accordez à Dutiva une licence limitée pour traiter ces données pour vous fournir les services',
        },
        {
          type: 'li',
          text: 'Cette licence se termine lorsque vous supprimez vos données ou votre compte',
        },
        {
          type: 'li',
          text: "Dutiva n'utilise pas vos entrées pour entraîner nos modèles d'IA sans consentement explicite",
        },
      ],
    },
    {
      title: '3. Documents générés',
      blocks: [
        {
          type: 'p',
          text: 'Les documents, contrats et autres contenus générés par la plateforme Dutiva à partir de vos entrées sont considérés comme votre contenu.',
        },
        {
          type: 'li',
          text: "Vous êtes propriétaire des documents générés par l'IA à partir de vos entrées",
        },
        {
          type: 'li',
          text: 'Dutiva ne revendique aucun droit sur les documents créés pour votre organisation',
        },
        {
          type: 'li',
          text: "Vous êtes responsable de la vérification et de l'utilisation appropriée des documents générés",
        },
        {
          type: 'li',
          text: 'Les modèles fournis par Dutiva restent la propriété de Dutiva',
        },
      ],
    },
    {
      title: "4. Signalement des violations de droit d'auteur (DMCA)",
      blocks: [
        {
          type: 'p',
          text: "Si vous croyez qu'un contenu sur notre plateforme viole vos droits d'auteur, vous pouvez soumettre une notification de retrait conformément à la Loi sur le droit d'auteur du Canada.",
        },
        {
          type: 'li',
          text: 'Envoyez votre notification à : legal@dutiva.ca',
        },
        {
          type: 'li',
          text: "Incluez : identification de l'œuvre protégée, identification du contenu présumément contrefait, vos coordonnées, déclaration de bonne foi",
        },
        {
          type: 'li',
          text: 'Dutiva examinera toutes les notifications valides et prendra les mesures appropriées',
        },
        {
          type: 'li',
          text: 'Les contrefaçons répétées peuvent entraîner la résiliation du compte',
        },
      ],
    },
  ],
} satisfies PolicyEdition
