import type { PolicyEdition } from '../policyContent'

export default {
  "title": "Liste des sous-traitants",
  "lastUpdated": "26 août 2026",
  "effectiveDate": "1 juin 2026",
  "callout": [
    "Dutiva Canada Inc. (« Dutiva ») fait appel à des fournisseurs de services tiers (« sous-traitants ») pour exploiter et améliorer la plateforme. Cette page répertorie les sous-traitants que nous utilisons actuellement, leur rôle, l'emplacement de leurs opérations de traitement des données et les catégories de données auxquelles ils peuvent avoir accès. Cette liste est mise à jour lorsque nous ajoutons ou modifions des sous-traitants."
  ],
  "sections": [
    {
      "title": "1. Infrastructure et hébergement",
      "blocks": [
        {
          "type": "p",
          "text": "Supabase Inc. — Rôle : base de données, authentification, stockage de fichiers et infrastructure API. Données traitées : données de compte, données d'espace de travail, documents générés, journaux d'utilisation. Lieu de traitement : États-Unis (infrastructure AWS ; région Canada disponible et utilisée lorsqu'elle est configurée)."
        },
        {
          "type": "p",
          "text": "Vercel Inc. — Rôle : hébergement frontend, livraison par réseau périphérique et infrastructure de déploiement. Données traitées : trafic web, métadonnées de requêtes, actifs statiques. Lieu de traitement : États-Unis et nœuds périphériques CDN mondiaux."
        }
      ]
    },
    {
      "title": "2. Services d'IA et de modèles de langage",
      "blocks": [
        {
          "type": "p",
          "text": "DigitalOcean Gradient AI — Rôle : services d'acheminement et d'inférence de modèles d'IA alimentant les réponses du Conseiller Dutiva et la génération de documents. Données traitées : texte des messages du Conseiller, contexte de juridiction, saisies de modèles sélectionnés, contexte d'orientation récupéré. Lieu de traitement : Toronto, Canada. Les données soumises pour inférence sont assujetties aux conditions de traitement des données du fournisseur et ne sont pas utilisées pour entraîner des modèles de fondation de tiers dans le cadre de l'entente de Dutiva."
        }
      ]
    },
    {
      "title": "3. Traitement des paiements",
      "blocks": [
        {
          "type": "p",
          "text": "Stripe, Inc. — Rôle : traitement des paiements, gestion des abonnements et portail de facturation. Données traitées : données de carte de paiement (stockées et traitées par Stripe ; Dutiva ne stocke pas les numéros de carte complets), adresse de facturation, relevés de transactions, statut de l'abonnement. Lieu de traitement : États-Unis."
        }
      ]
    },
    {
      "title": "4. Communication par courriel et communication transactionnelle",
      "blocks": [
        {
          "type": "p",
          "text": "Resend Inc. (ou fournisseur équivalent de courriels transactionnels) — Rôle : livraison de courriels transactionnels, notamment la vérification de compte, la réinitialisation de mot de passe, les notifications de documents, les reçus de facturation et les communications d'assistance. Données traitées : adresse courriel, contenu des messages, métadonnées de livraison. Lieu de traitement : États-Unis."
        }
      ]
    },
    {
      "title": "5. Surveillance des erreurs",
      "blocks": [
        {
          "type": "p",
          "text": "Dutiva n'utilise pas de sous-traitant tiers de suivi des erreurs (comme Sentry ou Datadog). Lorsqu'une erreur survient dans l'application, un rapport minimisé est envoyé à une fonction exploitée par Dutiva et stocké dans la propre base de données de Dutiva (Supabase, mentionnée à la section 1). Chaque rapport se limite à un message d'erreur sommaire, au motif de la route, à un identifiant de version, à la famille sommaire du navigateur et du système d'exploitation, et à la langue — il ne contient aucun identifiant d'utilisateur, de session ou d'authentification, ni aucun contenu saisi. Le traitement et le stockage suivent l'entrée Supabase ci-dessus."
        }
      ]
    },
    {
      "title": "6. Analytique",
      "blocks": [
        {
          "type": "p",
          "text": "L'analytique de première partie est traitée en interne. Les événements du Centre d'aide et du parcours d'assistance (recherches, consultations d'articles, votes d'utilité et événements de tickets d'assistance) sont envoyés à une fonction périphérique exploitée par Dutiva, épinglée à la région Canada (ca-central-1), et stockés dans la propre base de données de Dutiva (Supabase, section 1). Ils portent un identifiant anonyme renouvelé quotidiennement ou un identifiant d'espace de travail (organisation), jamais un identifiant d'utilisateur individuel, et ne sont partagés avec aucun fournisseur d'analytique tiers. Ces événements ne sont collectés qu'après que la personne a consenti au moyen de la bannière de consentement."
        },
        {
          "type": "p",
          "text": "Analytique web tierce facultative : Google Analytics 4 (Google LLC — États-Unis). Le cas échéant, GA4 ne se charge que lorsqu'un identifiant de mesure est configuré et que la personne a donné son consentement au moyen de la bannière de consentement, avec l'anonymisation de l'adresse IP activée. Lorsqu'aucun identifiant de mesure n'est configuré, aucune donnée d'analytique web n'est envoyée à Google."
        }
      ]
    },
    {
      "title": "7. Protection contre les robots et CAPTCHA",
      "blocks": [
        {
          "type": "p",
          "text": "Pour protéger les formulaires publics (comme l'inscription à la version bêta et les demandes d'assistance) contre le pourriel et les abus automatisés, Dutiva peut faire appel à un fournisseur de CAPTCHA / de protection contre les robots : Cloudflare, Inc. (Cloudflare Turnstile) par défaut, ou Intuition Machines, Inc. (hCaptcha) lorsqu'il est configuré. Lorsqu'elle est activée, cette protection évalue des signaux techniques du navigateur de la personne — dont l'adresse IP et des signaux d'interaction — afin de distinguer les humains des clients automatisés. Elle n'est engagée que sur les formulaires publics de soumission et uniquement lorsque les clés de protection contre les robots sont configurées. Cloudflare peut également fournir des services de DNS, de sécurité réseau et de disponibilité le cas échéant. Lieu de traitement : États-Unis et réseau périphérique mondial."
        },
        {
          "type": "p",
          // [FR self-authored]
          "text": "TrustedSite (Halo Security) — Rôle : sceau de balayage de sécurité du site public. Données traitées : adresse IP du visiteur et signaux du navigateur ou de l'appareil lorsque le script du sceau se charge sur les pages marketing. L'espace de travail authentifié ne charge pas ce script. Lieu de traitement : États-Unis."
        }
      ]
    },
    {
      "title": "8. Transferts de données transfrontaliers",
      "blocks": [
        {
          "type": "p",
          "text": "La plupart des sous-traitants de Dutiva sont établis aux États-Unis. Les données personnelles transférées vers des sous-traitants américains sont soumises à la législation américaine. Nous sélectionnons des sous-traitants qui maintiennent des garanties techniques et contractuelles appropriées, notamment des accords de traitement des données conformes aux exigences de la LPRPDE."
        },
        {
          "type": "p",
          "text": "Pour les résidents du Québec : les transferts transfrontaliers de renseignements personnels sont soumis aux exigences de la Loi 25 du Québec. Nous effectuons des évaluations des facteurs relatifs à la vie privée pour les transferts transfrontaliers lorsque requis et maintenons une documentation des garanties de transfert."
        }
      ]
    },
    {
      "title": "9. Modifications de la liste des sous-traitants",
      "blocks": [
        {
          "type": "p",
          "text": "Dutiva mettra à jour cette liste lorsque des sous-traitants seront ajoutés, modifiés ou supprimés. Les clients d'entreprise disposant d'accords de traitement des données peuvent bénéficier de délais de préavis spécifiques tels qu'énoncés dans leur accord."
        },
        {
          "type": "p",
          "text": "Pour toute question concernant les sous-traitants ou les transferts de données, contactez privacy@dutiva.ca."
        }
      ]
    }
  ]
} satisfies PolicyEdition
