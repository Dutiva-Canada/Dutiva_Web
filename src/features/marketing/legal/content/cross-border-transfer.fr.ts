import type { PolicyEdition } from '../policyContent'

export default {
  "title": "Divulgation sur les transferts de données transfrontaliers",
  "lastUpdated": "26 août 2026",
  "effectiveDate": "1 juin 2026",
  "callout": [
    "Cette divulgation informe les utilisateurs canadiens des transferts transfrontaliers de données personnelles effectués par Dutiva Canada Inc., conformément à la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE/PIPEDA) et à la Loi 25 du Québec."
  ],
  "sections": [
    {
      "title": "1. Transferts de données vers les États-Unis",
      "blocks": [
        {
          "type": "p",
          "text": "Dutiva utilise certains fournisseurs de services situés aux États-Unis pour héberger et traiter les données. Les transferts suivants ont lieu :"
        },
        {
          "type": "li",
          "text": "Supabase : hébergement de base de données et stockage, localisé en Virginie et en Californie"
        },
        {
          "type": "li",
          "text": "Vercel : hébergement et mise en réseau de l'application, localisé aux États-Unis"
        },
        {
          "type": "li",
          "text": "Stripe : traitement des paiements, localisé aux États-Unis"
        },
        {
          "type": "li",
          // [FR self-authored]
          "text": "TrustedSite (Halo Security) : signaux de balayage de sécurité du site public (adresse IP du visiteur et signaux du navigateur ou de l'appareil sur les pages marketing), localisé aux États-Unis. L'espace de travail authentifié ne charge pas ce script."
        }
      ]
    },
    {
      "title": "2. Mesures de sauvegarde",
      "blocks": [
        {
          "type": "p",
          "text": "Dutiva met en place des mesures de sauvegarde appropriées pour protéger les données transférées vers les États-Unis."
        },
        {
          "type": "li",
          "text": "Chiffrement AES-256 des données au repos et TLS 1.3 en transit"
        },
        {
          "type": "li",
          "text": "Contrats de traitement des données (DPA) avec tous les fournisseurs tiers"
        },
        {
          "type": "li",
          "text": "Évaluations de l'impact sur la vie privée (EIPV/PIA) effectuées conformément à la Loi 25 du Québec"
        },
        {
          "type": "li",
          "text": "Audits de sécurité réguliers des fournisseurs de services"
        }
      ]
    },
    {
      "title": "3. Adéquation PIPEDA",
      "blocks": [
        {
          "type": "p",
          "text": "Les transferts transfrontaliers de données sont effectués conformément aux exigences de la LPRPDE (PIPEDA)."
        },
        {
          "type": "li",
          "text": "Les États-Unis ne sont pas considérés comme offrant un niveau de protection adéquat par défaut"
        },
        {
          "type": "li",
          "text": "Les mesures contractuelles compensent les différences de protection légale"
        },
        {
          "type": "li",
          "text": "Notification aux utilisateurs conformément à l'alinéa 4.3 de l'annexe 1 de la PIPEDA"
        },
        {
          "type": "li",
          "text": "Droits des utilisateurs maintenus malgré le transfert transfrontalier"
        }
      ]
    },
    {
      "title": "4. Exigences de la Loi 25 du Québec",
      "blocks": [
        {
          "type": "p",
          "text": "Conformément à la Loi 25 sur la protection des renseignements personnels au Québec, Dutiva a effectué des évaluations d'impact sur la vie privée (EIPV) pour les transferts transfrontaliers."
        },
        {
          "type": "li",
          "text": "EIPV/PIA complétés pour tous les transferts vers les fournisseurs américains"
        },
        {
          "type": "li",
          "text": "Documentation des risques et des mesures d'atténuation"
        },
        {
          "type": "li",
          "text": "Révision annuelle des évaluations d'impact"
        },
        {
          "type": "li",
          "text": "Disponibilité sur demande d'un résumé des EIPV pour les utilisateurs"
        }
      ]
    },
    {
      "title": "5. Droits des utilisateurs",
      "blocks": [
        {
          "type": "p",
          "text": "Vous conservez vos droits en matière de protection des données malgré les transferts transfrontaliers."
        },
        {
          "type": "li",
          "text": "Droit d'accès à vos données personnelles"
        },
        {
          "type": "li",
          "text": "Droit de rectification des données inexactes"
        },
        {
          "type": "li",
          "text": "Droit de retrait de consentement (avec effet sur la fourniture des services)"
        },
        {
          "type": "li",
          "text": "Questions : privacy@dutiva.ca"
        }
      ]
    }
  ]
} satisfies PolicyEdition
