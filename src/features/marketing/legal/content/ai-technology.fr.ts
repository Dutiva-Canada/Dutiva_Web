import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Politique relative à l’IA et aux technologies',
  lastUpdated: '26 août 2026',
  effectiveDate: '1er juin 2026',
  callout: [
    'Juridique | Dernière mise à jour : 15 juillet 2026',
    'La présente Politique explique les technologies utilisées pour exploiter Dutiva, y compris le fonctionnement actuel du Conseiller, les fournisseurs technologiques, les limites de traitement des données, les mécanismes de récupération du contexte et les mesures de protection entourant les processus RH assistés par l’IA.',
    'La présente Politique doit être lue avec la Politique de confidentialité, les Conditions d’utilisation, l’Avis de non-responsabilité juridique, la Divulgation relative à l’utilisation de l’IA, l’Accord de traitement des données et la Politique de conservation et de suppression des données.',
  ],
  sections: [
    {
      title: '1. Objet et portée',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva est une plateforme logicielle-service canadienne de conformité RH destinée aux employeurs, aux professionnels des RH et aux responsables d’entreprise. Certaines fonctionnalités utilisent l’intelligence artificielle, la récupération de contexte, l’automatisation et des fournisseurs technologiques tiers pour soutenir les processus RH.',
        },
        {
          type: 'p',
          text: 'La présente Politique vise à fournir une transparence concrète sur l’utilisation actuelle de ces technologies. Elle ne crée pas d’engagements de service au-delà des Conditions d’utilisation et ne remplace pas les avis propres à certaines fonctionnalités affichés dans l’application.',
        },
      ],
    },
    {
      title: '2. Fonctionnement actuel du Conseiller',
      blocks: [
        {
          type: 'p',
          text: 'Le Conseiller Dutiva fonctionne au moyen de la fonction en périphérie côté serveur advisor-chat de Dutiva. La configuration de production actuelle achemine les messages du Conseiller vers DigitalOcean Gradient AI et utilise DeepSeek 3.2 (`deepseek-3.2`) pour générer les réponses. Le fournisseur et le modèle sont résolus au moment de la requête à partir de la table d’acheminement de Dutiva et peuvent changer sans déploiement logiciel.',
        },
        {
          type: 'p',
          text: 'Dutiva peut mettre à jour les modèles, fournisseurs, méthodes de récupération du contexte, instructions système, mesures de protection et logique d’acheminement au fil du temps afin d’améliorer la fiabilité, la performance bilingue, la latence, les coûts, la sécurité ou les mesures d’utilisation responsable. Les changements importants qui touchent le public seront reflétés dans la présente Politique, la Divulgation relative à l’utilisation de l’IA ou les avis dans le produit, selon le cas.',
        },
      ],
    },
    {
      title: '3. Renseignements pouvant être transmis aux fournisseurs d’IA',
      blocks: [
        {
          type: 'p',
          text: 'Les requêtes au Conseiller peuvent comprendre :',
        },
        {
          type: 'li',
          text: 'le message de l’utilisateur;',
        },
        {
          type: 'li',
          text: 'un historique récent et limité de la conversation;',
        },
        {
          type: 'li',
          text: 'la province, le territoire ou le régime fédéral sélectionné;',
        },
        {
          type: 'li',
          text: 'le contexte d’accompagnement RH récupéré;',
        },
        {
          type: 'li',
          text: 'l’identifiant du processus actif ou le contexte du modèle;',
        },
        {
          type: 'li',
          text: 'un contexte limité de l’espace de travail, par exemple le nom de l’organisation, la province ou le régime applicable, le rôle, la taille de l’employeur, la préférence linguistique, le forfait et l’état du processus.',
        },
        {
          type: 'p',
          text: 'Dutiva limite le contexte transmis aux fournisseurs d’IA à ce qui est raisonnablement nécessaire pour générer une réponse utile. Dutiva n’inclut pas intentionnellement les numéros de carte de paiement, les identifiants bancaires, les identifiants de compte complets ni les identifiants du portail de facturation dans les requêtes d’IA.',
        },
        {
          type: 'p',
          text: 'Les utilisateurs ne devraient pas soumettre de numéros d’assurance sociale, de dossiers médicaux, de renseignements personnels sur la santé, de renseignements bancaires, de dossiers d’employés protégés, de fichiers de conventions collectives ou d’autres renseignements d’employés hautement sensibles au Conseiller, sauf si Dutiva fournit expressément un processus contrôlé pour ce type de renseignements et que le client dispose d’un fondement légal pour les utiliser.',
        },
      ],
    },
    {
      title: '4. Récupération du contexte et contexte d’accompagnement',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva peut fournir au modèle un contexte interne d’accompagnement RH extrait de sa base de connaissances de conformité, notamment des notes propres à la province ou au régime applicable, des listes de contrôle, le contexte des modèles de documents et des indications structurées.',
        },
        {
          type: 'p',
          text: 'Le Conseiller reçoit des instructions pour utiliser le contexte récupéré lorsqu’il est disponible, éviter d’inventer des citations ou des références législatives, identifier les hypothèses et les incertitudes, et signaler les questions à risque élevé qui devraient faire l’objet d’une révision par des professionnels qualifiés en RH, en droit, en paie, en protection des renseignements personnels ou dans tout autre domaine pertinent.',
        },
        {
          type: 'p',
          text: 'Le contexte récupéré améliore l’ancrage des réponses, mais il ne garantit pas qu’une réponse est complète, à jour ou adaptée aux faits, au milieu de travail, aux contrats, aux politiques, aux conventions collectives ou au secteur d’activité du client.',
        },
      ],
    },
    {
      title: '5. Contrôles des résultats et mesures de protection',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva applique des contrôles pratiques aux réponses assistées par l’IA, notamment :',
        },
        {
          type: 'li',
          text: 'des appels côté serveur aux fournisseurs afin que les secrets des fournisseurs de modèles ne soient pas exposés dans le navigateur;',
        },
        {
          type: 'li',
          text: 'la minimisation des instructions et du contexte lorsque cela est raisonnablement possible;',
        },
        {
          type: 'li',
          text: 'des limites de longueur des messages, un historique limité de conversation et des limites de débit;',
        },
        {
          type: 'li',
          text: 'des instructions système qui demandent des notes relatives à la province ou au régime applicable, des niveaux de risque, des prochaines étapes, un fondement juridique et des indications de révision professionnelle, lorsque pertinent;',
        },
        {
          type: 'li',
          text: 'des mesures de protection, de prévention des abus et de mise en forme;',
        },
        {
          type: 'li',
          text: 'des rappels persistants indiquant que Dutiva fournit un soutien aux processus RH et un accompagnement axé sur la conformité, et non des conseils juridiques.',
        },
        {
          type: 'p',
          text: 'Ces contrôles réduisent les risques, mais ils ne peuvent pas éliminer les erreurs de l’IA ni les résultats inappropriés.',
        },
      ],
    },
    {
      title: '6. Fournisseurs technologiques',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva s’appuie actuellement sur les catégories de fournisseurs et de technologies suivantes :',
        },
        {
          type: 'li',
          text: 'Supabase : authentification, base de données, stockage, fonctions en périphérie et infrastructure de données de l’application.',
        },
        {
          type: 'li',
          text: 'Vercel : hébergement, fonctions sans serveur, déploiement et journaux opérationnels.',
        },
        {
          type: 'li',
          text: 'DigitalOcean Gradient AI : acheminement des modèles d’IA et inférence pour les fonctionnalités liées au Conseiller.',
        },
        {
          type: 'li',
          text: 'Stripe : facturation des abonnements, paiement en ligne, factures, taxes et traitement des paiements.',
        },
        {
          type: 'li',
          text: 'Cloudflare : DNS, acheminement du trafic, performance, disponibilité et protection du réseau.',
        },
        {
          type: 'li',
          text: 'Google Analytics, s’il est activé : analytique du produit ou du site Web.',
        },
        {
          type: 'li',
          text: 'React et Vite : cadre applicatif frontal et outils de compilation.',
        },
        {
          type: 'p',
          text: 'Tous les fournisseurs ne reçoivent pas toutes les catégories de renseignements. L’accès d’un fournisseur dépend de la fonctionnalité, de la configuration et des données nécessaires pour exploiter cette partie du service.',
        },
      ],
    },
    {
      title: '7. Limites de l’IA et révision professionnelle',
      blocks: [
        {
          type: 'p',
          text: 'Les systèmes d’IA peuvent produire du contenu inexact, incomplet, désuet, inventé, biaisé ou incohérent. Dutiva ne garantit pas que les réponses de l’IA tiennent compte de toutes les lois, de tous les règlements, de toute la jurisprudence, des conventions collectives, des contrats de travail, des politiques du milieu de travail, des directives administratives, des exigences de paie, des obligations relatives aux droits de la personne ou des faits propres au milieu de travail.',
        },
        {
          type: 'p',
          text: 'Dutiva ne prend pas de décisions finales en matière de milieu de travail pour les clients. Les employeurs, professionnels des RH et utilisateurs autorisés demeurent responsables de réviser les résultats, de confirmer les faits, d’appliquer le droit en vigueur et le contexte du milieu de travail, de documenter les décisions et d’obtenir une révision professionnelle qualifiée lorsque cela est approprié.',
        },
        {
          type: 'p',
          text: 'Avant d’agir dans des dossiers de cessation d’emploi, de mise à pied, d’accommodement, d’enquête, d’incident de confidentialité, d’équité salariale, de milieu syndiqué, de rémunération des dirigeants, d’emploi transfrontalier ou d’autres questions à risque élevé, les clients devraient obtenir une révision juridique ou professionnelle qualifiée.',
        },
      ],
    },
    {
      title: '8. Conservation des données, entraînement et amélioration du produit',
      blocks: [
        {
          type: 'p',
          text: 'Le flux actuel du navigateur de Dutiva peut conserver l’état de conversation du Conseiller en session pour l’expérience utilisateur et la continuité du processus. Dutiva peut également traiter des dossiers opérationnels limités, des journaux, des signaux d’utilisation et des événements de sécurité afin de fournir, dépanner, sécuriser, surveiller et améliorer le service, comme il est décrit dans la Politique de confidentialité et la Politique de conservation et de suppression des données.',
        },
        {
          type: 'p',
          text: 'Dutiva n’utilise pas les requêtes envoyées au Conseiller ni les documents RH générés par les clients pour entraîner des modèles de fondation de tiers, sauf si une entente écrite distincte ou un consentement explicite le prévoit.',
        },
        {
          type: 'p',
          text: 'Le traitement et la conservation effectués par les fournisseurs sont régis par leurs conditions, leurs configurations et les ententes de Dutiva avec ces fournisseurs. Lorsque cela est disponible, Dutiva utilise des contrôles de configuration, contractuels et opérationnels destinés à limiter la conservation et l’utilisation inutiles du contenu des clients.',
        },
      ],
    },
    {
      title: '9. Systèmes automatisés et révision humaine',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva utilise l’automatisation pour soutenir la génération d’ébauches, la récupération du contexte d’accompagnement, les limites de débit, la surveillance de la sécurité et l’état des processus. Dutiva est conçu pour assister les processus des employeurs et des RH; il n’est pas conçu pour prendre des décisions finales d’embauche, de discipline, d’accommodement, de cessation d’emploi, de rémunération ou d’autres décisions d’emploi au nom des clients.',
        },
        {
          type: 'p',
          text: 'Lorsqu’un résultat automatisé ou assisté par l’IA est utilisé pour soutenir une décision en milieu de travail, le client demeure responsable de la révision humaine, de la vérification des faits et de la prise de décision. Les clients devraient tenir compte des exigences supplémentaires en matière de protection des renseignements personnels, de droits de la personne, de normes du travail, de relations de travail et de gouvernance interne avant d’utiliser des résultats automatisés dans des décisions en milieu de travail.',
        },
      ],
    },
    {
      title: '10. Modifications à la présente Politique',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva peut mettre à jour la présente Politique à mesure que son service, ses fournisseurs, sa configuration de modèles, son système de récupération du contexte, ses mesures de protection ou ses obligations légales évoluent. Les changements importants seront reflétés par la mise à jour de la date ci-dessus, la publication d’une Politique révisée ou la communication d’un avis supplémentaire lorsque cela est approprié.',
        },
      ],
    },
    {
      title: '11. Questions',
      blocks: [
        {
          type: 'p',
          text: 'Les questions concernant l’utilisation de l’IA, de l’automatisation ou des fournisseurs technologiques par Dutiva peuvent être envoyées à support@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
