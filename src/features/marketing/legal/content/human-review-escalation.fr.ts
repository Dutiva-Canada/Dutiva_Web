import type { PolicyEdition } from '../policyContent'

export default {
  title: "Politique d'escalade vers la révision humaine",
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    "Dutiva Canada Inc. maintient une politique d'escalade vers la révision humaine pour examiner les sorties de l'intelligence artificielle dans des situations spécifiques. Cette politique assure la qualité et la sûreté des contenus générés.",
  ],
  sections: [
    {
      title: "1. Quand l'escalade a lieu",
      blocks: [
        {
          type: 'p',
          text: "Certains résultats de l'IA sont automatiquement ou manuellement escaladés vers un examen humain pour garantir leur qualité et leur conformité.",
        },
        {
          type: 'li',
          text: "Signalement par l'utilisateur d'un contenu problématique ou douteux",
        },
        {
          type: 'li',
          text: 'Scénarios à haut risque identifiés par nos systèmes de détection',
        },
        {
          type: 'li',
          text: 'Contenu généré impliquant des domaines réglementés ou juridiques complexes',
        },
        {
          type: 'li',
          text: "Requêtes inhabituelles ou hors du domaine de compétence normal de l'IA",
        },
      ],
    },
    {
      title: '2. Critères de déclenchement',
      blocks: [
        {
          type: 'p',
          text: "Les critères suivants déterminent si une sortie de l'IA doit être examinée par un être humain.",
        },
        {
          type: 'li',
          text: "Drapeau utilisateur : l'utilisateur marque explicitement le contenu pour révision",
        },
        {
          type: 'li',
          text: 'Mots-clés sensibles : présence de termes liés à la sécurité, à la conformité ou aux droits',
        },
        {
          type: 'li',
          text: 'Score de confiance : sorties avec une confiance algorithmique inférieure au seuil',
        },
        {
          type: 'li',
          text: 'Complexité : sujets nécessitant une expertise spécialisée en RH ou en droit du travail',
        },
        {
          type: 'li',
          text: 'Contexte : documents destinés à des procédures formelles ou des litiges potentiels',
        },
      ],
    },
    {
      title: '3. Normes de révision',
      blocks: [
        {
          type: 'p',
          text: 'Les examinateurs humains suivent des normes strictes pour évaluer les contenus escaladés.',
        },
        {
          type: 'li',
          text: "Vérification de l'exactitude factuelle et juridique du contenu",
        },
        {
          type: 'li',
          text: "Évaluation de la pertinence et de l'adéquation au contexte canadien",
        },
        {
          type: 'li',
          text: 'Contrôle de conformité aux politiques de Dutiva et aux normes éthiques',
        },
        {
          type: 'li',
          text: "Validation de l'absence de biais discriminatoires ou de contenu inapproprié",
        },
        {
          type: 'li',
          text: "Documentation des décisions pour l'amélioration continue des modèles",
        },
      ],
    },
    {
      title: '4. Délais de réponse',
      blocks: [
        {
          type: 'p',
          text: "Dutiva s'engage à traiter les demandes d'escalade dans des délais raisonnables.",
        },
        {
          type: 'li',
          text: "Accusé de réception automatique dans l'heure suivant le signalement",
        },
        {
          type: 'li',
          text: 'Révision initiale par un examinateur : 1 jour ouvrable',
        },
        {
          type: 'li',
          text: 'Cas complexes nécessitant une expertise spécialisée : 3 jours ouvrables',
        },
        {
          type: 'li',
          text: 'Notification finale avec résolution ou recommandations : 5 jours ouvrables maximum',
        },
      ],
    },
    {
      title: "5. Notification à l'utilisateur",
      blocks: [
        {
          type: 'p',
          text: "Les utilisateurs sont informés du statut et des résultats du processus d'escalade.",
        },
        {
          type: 'li',
          text: "Notification de réception de la demande d'escalade",
        },
        {
          type: 'li',
          text: 'Mise à jour sur la progression si le délai dépasse 48 heures',
        },
        {
          type: 'li',
          text: 'Résolution finale avec explications si des modifications sont apportées',
        },
        {
          type: 'li',
          text: 'Recommandations alternatives si le contenu ne peut être approuvé',
        },
        {
          type: 'li',
          text: 'Contact : support@dutiva.ca pour les questions sur les escalades',
        },
      ],
    },
  ],
} satisfies PolicyEdition
