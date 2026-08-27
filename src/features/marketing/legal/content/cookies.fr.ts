import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Politique relative aux témoins',
  lastUpdated: '26 août 2026',
  effectiveDate: '1er juin 2026',
  callout: [
    'Légal\nPolitique relative aux témoins',
    'Dutiva utilise des témoins et du stockage dans le navigateur strictement nécessaires pour assurer le fonctionnement du site Web et de l’application. Dutiva n’utilise pas de témoins publicitaires de tiers ni de traceurs publicitaires intersites. Les outils d’analyse facultatifs, s’ils sont activés, sont traités comme indiqué ci-dessous.',
  ],
  sections: [
    {
      title: '1. Objet de la présente politique',
      blocks: [
        {
          type: 'p',
          text: 'La présente Politique relative aux témoins explique comment Dutiva Canada Inc. (« Dutiva », « nous », « notre » ou « nos ») utilise les témoins, le stockage local, le stockage de session et les technologies similaires sur son site Web et dans son application. Ces technologies enregistrent ou lisent de petites quantités d’information dans votre navigateur afin que le service puisse conserver l’état de la session, les préférences, les contrôles de sécurité et les processus en cours.',
        },
        {
          type: 'p',
          text: 'La présente Politique devrait être lue avec notre Politique de confidentialité.',
        },
      ],
    },
    {
      title: '2. Témoins et stockage strictement nécessaires',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva utilise des témoins et du stockage nécessaires pour fournir les fonctions essentielles du service, notamment :',
        },
        {
          type: 'li',
          text: 'Authentification : le stockage de session de Supabase permet de maintenir votre connexion et de prendre en charge l’authentification sécurisée par lien de connexion.',
        },
        {
          type: 'li',
          text: 'Sécurité et fiabilité : les fournisseurs d’infrastructure peuvent utiliser des témoins opérationnels, des journaux et des métadonnées de requête pour acheminer le trafic, prévenir les abus, maintenir la disponibilité et protéger le service.',
        },
        {
          type: 'li',
          // [FR self-authored]
          text: 'Sceau de sécurité du site public : le site marketing charge TrustedSite (Halo Security) pour que les visiteurs puissent voir l’état du balayage de sécurité du site. Ce script peut déposer des témoins ou un stockage similaire sur le domaine de TrustedSite. Il n’est pas chargé dans l’espace de travail authentifié et n’est pas utilisé à des fins publicitaires.',
        },
        {
          type: 'li',
          text: 'Continuité des processus : l’état conservé dans le navigateur aide à éviter les interruptions lorsque vous progressez dans les processus d’intégration, de documents, de Conseiller et d’espace de travail.',
        },
        {
          type: 'li',
          text: 'Facturation et paiement : Stripe peut utiliser des témoins ou des technologies similaires lorsque vous accédez au paiement, aux factures, au portail de facturation ou aux processus de paiement connexes.',
        },
        {
          type: 'li',
          text: 'Sans ce stockage nécessaire, l’accès au compte, les fonctions de sécurité, les processus de facturation et les principales fonctions de l’application pourraient ne pas fonctionner.',
        },
      ],
    },
    {
      title: '3. Stockage des préférences',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva conserve certaines valeurs de préférence dans le navigateur afin que l’interface demeure utilisable d’une visite à l’autre. Les exemples actuels comprennent la langue, le thème, le contexte d’intégration, les paramètres de l’espace de travail et l’état de certaines fonctionnalités dans le navigateur.',
        },
        {
          type: 'p',
          text: 'Le stockage des préférences n’est pas utilisé pour la publicité, la vente de renseignements personnels ou la création de profils de marketing de tiers.',
        },
      ],
    },
    {
      title: '4. Analyse',
      blocks: [
        {
          type: 'p',
          // [FR self-authored] — matches the English cookies.en.ts update for D2 support analytics
          text: 'Dutiva utilise deux types d’analyse : l’analytique de support interne et l’analytique facultative de site Web tierce (Google Analytics 4). Les deux sont facultatives et désactivées par défaut — rien n’est collecté tant que vous n’avez pas accepté l’analytique au moyen de la bannière de consentement, et vous pouvez modifier votre choix à tout moment à partir du lien « Préférences de témoins » dans le pied de page. L’analytique de support interne (recherches dans le Centre d’aide, consultations d’articles, votes d’utilité et événements liés aux billets de support) est envoyée à une fonction edge exploitée par Dutiva au Canada et n’utilise pas de témoins tiers. Ces événements portent un identifiant de visiteur anonyme quotidien rotatif pour l’activité du Centre d’aide ou l’identifiant de l’espace de travail (organisation) pour les événements authentifiés liés aux billets, jamais un identifiant individuel d’utilisateur. Les données d’événements brutes sont conservées pendant 90 jours ; les agrégats quotidiens sont conservés indéfiniment.',
        },
        {
          type: 'p',
          text: 'Google Analytics 4, s’il est activé, ne se charge que lorsqu’un identifiant de mesure est configuré et que l’utilisateur a accordé son consentement par l’intermédiaire de la bannière de consentement. Lorsque des outils d’analyse ou des technologies facultatives similaires exigent un consentement, un avis ou des contrôles de préférence en vertu des lois applicables, Dutiva fournira les contrôles appropriés avant d’utiliser ces technologies à cette fin.',
        },
        {
          type: 'li',
          text: 'Les outils d’analyse sont configurés de manière à réduire au minimum les renseignements personnels, y compris l’anonymisation de l’adresse IP, le masquage de l’adresse IP ou d’autres paramètres de protection de la vie privée lorsque ces options sont prises en charge.',
        },
        {
          type: 'li',
          text: 'Dutiva ne transmet pas intentionnellement de texte sensible provenant de documents, de numéros de carte de paiement, de numéros d’assurance sociale, de dossiers médicaux, de coordonnées bancaires ou de renseignements hautement sensibles sur les employés dans les événements d’analyse.',
        },
        {
          type: 'li',
          text: 'Les outils d’analyse ne sont pas utilisés pour le reciblage publicitaire de tiers ni pour la création de profils de marketing intersites.',
        },
      ],
    },
    {
      title: '5. Consentement et technologies facultatives',
      blocks: [
        {
          type: 'p',
          text: 'Les témoins et le stockage strictement nécessaires sont utilisés parce qu’ils sont requis pour fournir et sécuriser le service. Les outils facultatifs d’analyse, de marketing, de suivi, de profilage ou les technologies similaires ne sont pas nécessaires pour l’accès de base au compte.',
        },
        {
          type: 'p',
          text: 'Si Dutiva introduit des technologies facultatives qui recueillent des renseignements personnels, identifient ou localisent une personne, effectuent un profilage ou exigent autrement un consentement ou des contrôles supplémentaires en vertu des lois applicables, Dutiva mettra à jour la présente Politique et fournira les avis et contrôles appropriés avant de les utiliser.',
        },
      ],
    },
    {
      title: '6. Témoins publicitaires et de marketing',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva n’utilise pas actuellement de témoins publicitaires de tiers, de pixels de médias sociaux ni de traceurs de marketing intersites. Si nous ajoutons ultérieurement des témoins de marketing facultatifs, nous mettrons à jour la présente Politique et fournirons les avis et contrôles appropriés avant de les utiliser.',
        },
      ],
    },
    {
      title: '7. Fournisseurs tiers',
      blocks: [
        {
          type: 'p',
          text: 'Nos fournisseurs de services peuvent utiliser des témoins, du stockage dans le navigateur ou des technologies similaires à des fins opérationnelles, notamment pour l’authentification, le paiement, la prévention de la fraude, l’hébergement, la performance, le soutien à l’inférence par IA, la sécurité du réseau et le sceau TrustedSite du site public. Ces fournisseurs peuvent comprendre Supabase, Vercel, Stripe, Cloudflare, DigitalOcean Gradient AI, TrustedSite et Google Analytics si les outils d’analyse sont activés.',
        },
        {
          type: 'p',
          text: 'Les fournisseurs tiers traitent les renseignements conformément à leurs propres conditions et avis de confidentialité lorsqu’ils agissent de façon indépendante. Lorsqu’ils agissent comme fournisseurs de services de Dutiva, leur traitement est limité aux services qu’ils fournissent à Dutiva, sous réserve des exigences contractuelles et légales applicables.',
        },
      ],
    },
    {
      title: '8. Vos contrôles',
      blocks: [
        {
          type: 'p',
          text: 'Vous pouvez bloquer, effacer ou limiter les témoins et le stockage du navigateur dans les paramètres de votre navigateur. Si vous effacez le stockage requis, vous pourriez être déconnecté et certaines préférences ou certains processus en cours pourraient être réinitialisés.',
        },
        {
          type: 'p',
          text: 'Les contrôles courants des navigateurs comprennent :',
        },
        {
          type: 'li',
          text: 'Chrome : Paramètres > Confidentialité et sécurité > Supprimer les données de navigation.',
        },
        {
          type: 'li',
          text: 'Firefox : Paramètres > Vie privée et sécurité > Cookies et données de sites.',
        },
        {
          type: 'li',
          text: 'Safari : Réglages > Confidentialité > Gérer les données de sites Web.',
        },
        {
          type: 'li',
          text: 'Edge : Paramètres > Confidentialité, recherche et services > Effacer les données de navigation.',
        },
      ],
    },
    {
      title: '9. Conservation',
      blocks: [
        {
          type: 'p',
          text: 'Le stockage de session expire généralement lorsque votre session prend fin, lorsque vous vous déconnectez ou lorsque votre navigateur l’efface. Le stockage des préférences demeure jusqu’à ce que vous modifiiez la préférence, effaciez les données du site ou que l’application l’écrase. Les journaux d’infrastructure et les événements d’analyse sont conservés selon les pratiques de conservation du fournisseur applicable et de Dutiva.',
        },
      ],
    },
    {
      title: '10. Modifications à la présente Politique',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva peut mettre à jour la présente Politique afin de tenir compte de changements apportés au site Web, à l’application, aux fournisseurs de services, à la configuration des outils d’analyse, aux exigences légales ou aux pratiques de protection de la vie privée. Les changements importants seront communiqués au moyen du site Web, de l’application, d’un courriel ou d’une autre méthode raisonnable lorsque cela est requis.',
        },
      ],
    },
    {
      title: '11. Nous joindre',
      blocks: [
        {
          type: 'p',
          text: 'Les questions concernant les témoins, le stockage du navigateur ou les technologies similaires peuvent être envoyées à privacy@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
