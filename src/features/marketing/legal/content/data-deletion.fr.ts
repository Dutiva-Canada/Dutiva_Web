import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Procédures de suppression des données',
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    'Cette page décrit les procédures de Dutiva Canada Inc. pour répondre aux demandes de suppression de données personnelles, conformément aux exigences de la PIPEDA et de la Loi 25 du Québec.',
  ],
  sections: [
    {
      title: '1. Processus de demande de suppression',
      blocks: [
        {
          type: 'p',
          text: 'Pour demander la suppression de vos données, vous devez soumettre une demande formelle par courriel.',
        },
        {
          type: 'li',
          text: 'Envoyez votre demande à : privacy@dutiva.ca',
        },
        {
          type: 'li',
          text: 'Objet : « Demande de suppression de données »',
        },
        {
          type: 'li',
          text: 'Incluez : nom complet, adresse courriel associée au compte, description des données à supprimer',
        },
        {
          type: 'li',
          text: "Pièce jointe : preuve d'identité (carte d'identité avec numéros masqués)",
        },
      ],
    },
    {
      title: "2. Vérification de l'identité",
      blocks: [
        {
          type: 'p',
          text: 'Avant de traiter une demande de suppression, nous devons vérifier votre identité pour protéger la sécurité de votre compte.',
        },
        {
          type: 'li',
          text: "Vérification par courriel de confirmation envoyée à l'adresse du compte",
        },
        {
          type: 'li',
          text: 'Vérification complémentaire possible pour les demandes sensibles',
        },
        {
          type: 'li',
          text: 'Délai de vérification : 3 à 5 jours ouvrables',
        },
        {
          type: 'li',
          text: 'Notification si la vérification échoue ou si des informations supplémentaires sont requises',
        },
      ],
    },
    {
      title: '3. Portée de la suppression',
      blocks: [
        {
          type: 'p',
          text: "La suppression couvre les catégories de données suivantes lorsqu'elles s'appliquent à votre compte.",
        },
        {
          type: 'li',
          text: 'Données de compte : profil, préférences, informations de facturation',
        },
        {
          type: 'li',
          text: 'Documents générés : contrats, politiques et autres documents créés via la plateforme',
        },
        {
          type: 'li',
          text: "Données de l'espace de travail : paramètres de l'organisation, membres de l'équipe",
        },
        {
          type: 'li',
          text: "Journaux d'activité : historique d'utilisation et métadonnées associées",
        },
      ],
    },
    {
      title: '4. Délais de traitement',
      blocks: [
        {
          type: 'p',
          text: "Dutiva s'engage à traiter les demandes de suppression dans les délais établis par la législation canadienne.",
        },
        {
          type: 'li',
          text: 'Accusé de réception dans les 5 jours ouvrables suivant la réception',
        },
        {
          type: 'li',
          text: "Suppression effective dans les 30 jours suivant la vérification de l'identité",
        },
        {
          type: 'li',
          text: 'Notification de confirmation une fois la suppression complétée',
        },
        {
          type: 'li',
          text: "Délais prolongés possibles si des obligations légales de conservation s'appliquent",
        },
      ],
    },
    {
      title: '5. Obligations de conservation légale',
      blocks: [
        {
          type: 'p',
          text: "Certaines données peuvent être conservées au-delà de la demande de suppression si la loi l'exige.",
        },
        {
          type: 'li',
          text: 'Données de facturation : conservées selon les exigences fiscales (6-7 ans)',
        },
        {
          type: 'li',
          text: "Données liées à des litiges : conservées jusqu'à la résolution du litige",
        },
        {
          type: 'li',
          text: 'Données requises par les autorités : conservées selon les ordonnances applicables',
        },
        {
          type: 'li',
          text: "Anonymisation des données lorsque la conservation complète n'est pas requise",
        },
      ],
    },
    {
      title: '6. Processus technique',
      blocks: [
        {
          type: 'p',
          text: "Les suppressions sont effectuées selon des procédures techniques sécurisées pour garantir l'irréversibilité.",
        },
        {
          type: 'li',
          text: 'Suppression logique initiale avec délai de grâce de 30 jours (annulation possible)',
        },
        {
          type: 'li',
          text: 'Suppression physique définitive après la période de grâce',
        },
        {
          type: 'li',
          text: "Effacement sécurisé conforme aux standards de l'industrie (NIST 800-88)",
        },
        {
          type: 'li',
          text: "Vérification post-suppression pour confirmer l'effacement",
        },
      ],
    },
  ],
} satisfies PolicyEdition
