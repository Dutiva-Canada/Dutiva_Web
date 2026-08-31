import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Aperçu de la sécurité',
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    "Dutiva Canada Inc. s'engage à protéger les données de nos clients avec les plus hauts standards de sécurité de l'industrie. Cette page décrit nos mesures de sécurité techniques et organisationnelles.",
  ],
  sections: [
    {
      title: '1. Infrastructure et hébergement',
      blocks: [
        {
          type: 'p',
          text: 'Notre plateforme est hébergée sur des infrastructures cloud certifiées SOC 2 Type II, avec des centres de données situés en Amérique du Nord. Nous utilisons une architecture multi-locataire sécurisée avec isolation stricte des données entre les clients.',
        },
        {
          type: 'li',
          text: 'Redondance géographique des données avec réplication en temps réel',
        },
        {
          type: 'li',
          text: "Surveillance continue 24/7/365 de l'infrastructure",
        },
        {
          type: 'li',
          text: "Pare-feu d'application web (WAF) et protection DDoS",
        },
      ],
    },
    {
      title: '2. Chiffrement des données',
      blocks: [
        {
          type: 'p',
          text: 'Toutes les données sont chiffrées au repos et en transit en utilisant des protocoles de chiffrement de niveau bancaire.',
        },
        {
          type: 'li',
          text: 'Chiffrement au repos : AES-256 pour toutes les données stockées',
        },
        {
          type: 'li',
          text: 'Chiffrement en transit : TLS 1.3 pour toutes les connexions',
        },
        {
          type: 'li',
          text: 'Gestion sécurisée des clés de chiffrement avec rotation régulière',
        },
      ],
    },
    {
      title: "3. Contrôles d'accès",
      blocks: [
        {
          type: 'p',
          text: 'Nous appliquons le principe du moindre privilège pour tous les accès aux systèmes et aux données.',
        },
        {
          type: 'li',
          text: 'Authentification multi-facteurs (MFA) obligatoire pour tout le personnel',
        },
        {
          type: 'li',
          text: "Contrôles d'accès basés sur les rôles (RBAC) granulaires",
        },
        {
          type: 'li',
          text: "Journal d'audit complet de toutes les activités d'accès",
        },
        {
          type: 'li',
          text: 'Révision trimestrielle des accès et révocation automatique',
        },
      ],
    },
    {
      title: '4. Gestion des vulnérabilités',
      blocks: [
        {
          type: 'p',
          text: 'Notre programme de gestion des vulnérabilités comprend des évaluations régulières et des tests de sécurité continus.',
        },
        {
          type: 'li',
          text: "Analyses automatisées de vulnérabilités sur le code et l'infrastructure",
        },
        {
          type: 'li',
          text: "Tests d'intrusion annuels par des tiers indépendants",
        },
        {
          type: 'li',
          text: 'Programme de primes aux bogues (bug bounty) pour la communauté',
        },
        {
          type: 'li',
          text: 'Délai de correction : critique (24h), élevée (7 jours), moyenne (30 jours)',
        },
      ],
    },
    {
      title: '5. Réponse aux incidents',
      blocks: [
        {
          type: 'p',
          text: 'Nous maintenons un plan de réponse aux incidents détaillé avec des procédures documentées pour détecter, analyser, contenir et remédier aux incidents de sécurité.',
        },
        {
          type: 'li',
          text: 'Équipe de réponse aux incidents disponible 24h/24, 7j/7',
        },
        {
          type: 'li',
          text: 'Notification aux clients dans les 72 heures en cas de violation de données',
        },
        {
          type: 'li',
          text: 'Tests annuels du plan de réponse aux incidents',
        },
      ],
    },
    {
      title: '6. Feuille de route de conformité',
      blocks: [
        {
          type: 'p',
          text: "Dutiva s'engage à obtenir et maintenir les certifications de conformité reconnues de l'industrie.",
        },
        {
          type: 'li',
          text: "Certification SOC 2 Type II : en cours d'audit, prévue pour 2026",
        },
        {
          type: 'li',
          text: 'Conformité PIPEDA et Loi 25 du Québec : pleinement conforme',
        },
        {
          type: 'li',
          text: 'Questions de sécurité : security@dutiva.ca',
        },
      ],
    },
  ],
} satisfies PolicyEdition
