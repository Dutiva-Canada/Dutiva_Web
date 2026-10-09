import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Déclaration d’accessibilité',
  lastUpdated: '8 avril 2026',
  effectiveDate: '8 avril 2026',
  callout: [
    'Juridique | Dernière mise à jour : 8 avril 2026',
    'Dutiva Canada Inc. (« Dutiva », « nous », « notre » ou « nos ») s’engage à rendre Dutiva utilisable par les personnes en situation de handicap et par les utilisateurs qui utilisent des technologies d’assistance. Nous travaillons activement à l’atteinte de la conformité aux Règles pour l’accessibilité des contenus Web (WCAG) 2.1, niveau AA, dans les principaux parcours du site Web et de l’application, et nous continuons de suivre l’évolution des WCAG 2.2.',
  ],
  sections: [
    {
      title: '1. Notre engagement',
      blocks: [
        {
          type: 'p',
          text: 'L’accessibilité est une considération fondamentale de produit et de conception chez Dutiva. Les outils de conformité RH devraient être utilisables par les employeurs canadiens, les professionnels des RH, les responsables d’entreprise et les utilisateurs autorisés ayant des capacités et des besoins d’accès variés.',
        },
        {
          type: 'p',
          text: 'Nous concevons et testons la plateforme pour prendre en charge les technologies d’assistance modernes et des modes d’interaction inclusifs, notamment la navigation au clavier, les lecteurs d’écran, les indicateurs de focus visibles, le redimensionnement du texte, les modes d’affichage à contraste élevé, les mises en page adaptatives et le soutien en français et en anglais.',
        },
      ],
    },
    {
      title: '2. État de conformité',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva est actuellement en conformité partielle avec les WCAG 2.1, niveau AA. Cela signifie que certaines parties du site Web et de l’application peuvent ne pas encore satisfaire pleinement à tous les critères de succès applicables, notamment les fonctionnalités bêta, le contenu dynamique et les processus de documents générés.',
        },
        {
          type: 'p',
          text: 'Nous effectuons des examens d’accessibilité, corrigeons les problèmes de façon continue et accordons la priorité à la conformité WCAG 2.1, niveau AA, dans les principaux parcours utilisateurs, notamment l’accès au compte, la navigation, le Conseiller, la génération de documents, la révision dans l’espace de travail, la facturation, la gestion du compte et le soutien. Nous suivons également l’évolution des WCAG 2.2 à mesure que le produit évolue.',
        },
      ],
    },
    {
      title: '3. Fonctionnalités d’accessibilité',
      blocks: [
        {
          type: 'p',
          text: 'Les fonctionnalités et pratiques de conception actuelles en matière d’accessibilité comprennent :',
        },
        {
          type: 'li',
          text: 'l’accessibilité au clavier pour les actions principales et les processus de base ;',
        },
        {
          type: 'li',
          text: 'des indicateurs de focus visibles et un ordre de focus logique pour les éléments interactifs ;',
        },
        {
          type: 'li',
          text: 'une structure HTML sémantique, des titres pertinents, des libellés de formulaire et un soutien ARIA lorsque le HTML natif est insuffisant ;',
        },
        {
          type: 'li',
          text: 'des contrastes de couleurs conçus pour respecter les attentes du niveau AA des WCAG pour le texte courant et les principaux éléments interactifs ;',
        },
        {
          type: 'li',
          text: 'des mises en page adaptatives et la prise en charge du redimensionnement du texte jusqu’à 200 % sans perte des fonctionnalités essentielles ;',
        },
        {
          type: 'li',
          text: 'des titres de page, formulaires, boutons, éléments de navigation et messages d’état conçus pour être compatibles avec les lecteurs d’écran lorsque mis en œuvre ;',
        },
        {
          type: 'li',
          text: 'un soutien en français et en anglais dans les principales zones de la plateforme, avec des attributs de langue appropriés lorsque mis en œuvre ;',
        },
        {
          type: 'li',
          text: 'une dépendance réduite à la couleur seule pour communiquer des renseignements importants ;',
        },
        {
          type: 'li',
          text: 'un examen continu du contenu généré, des réponses par IA, des aperçus de documents et des processus d’exportation en matière d’accessibilité.',
        },
      ],
    },
    {
      title: '4. Limites connues et améliorations en cours',
      blocks: [
        {
          type: 'p',
          text: 'Nous sommes au courant des secteurs suivants où des améliorations d’accessibilité sont en cours :',
        },
        {
          type: 'li',
          text: 'certains contenus de documents générés dynamiquement peuvent ne pas toujours être annoncés de façon fiable par tous les lecteurs d’écran ;',
        },
        {
          type: 'li',
          text: 'l’interface du Conseiller par IA fait l’objet d’un examen concernant les réponses en continu, les annonces par lecteur d’écran, le comportement des régions dynamiques et la gestion du focus ;',
        },
        {
          type: 'li',
          text: 'certains tableaux de données, composants de type calculateur et vues d’état des processus peuvent nécessiter des sémantiques de tableau, des annotations ARIA ou des associations d’en-têtes améliorées dans certaines combinaisons de navigateurs et de technologies d’assistance ;',
        },
        {
          type: 'li',
          text: 'certains processus tiers de paiement, d’authentification, d’analyse ou de services intégrés peuvent présenter des comportements d’accessibilité qui échappent au contrôle direct de Dutiva ;',
        },
        {
          type: 'li',
          text: 'les nouvelles fonctionnalités bêta peuvent nécessiter des essais d’accessibilité supplémentaires après leur déploiement ;',
        },
        {
          type: 'li',
          text: 'nous priorisons les problèmes d’accessibilité selon leur gravité, leur incidence sur les utilisateurs et leur fréquence. Nous visons à traiter les obstacles à incidence élevée dans les versions planifiées et à offrir un soutien raisonnable ou des solutions de rechange lorsque cela est possible.',
        },
      ],
    },
    {
      title: '5. Spécifications techniques et essais',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva s’appuie sur les technologies et pratiques suivantes pour soutenir l’accessibilité :',
        },
        {
          type: 'li',
          text: 'balisage sémantique HTML5;',
        },
        {
          type: 'li',
          text: 'rôles, états et propriétés WAI-ARIA lorsque le HTML natif est insuffisant ;',
        },
        {
          type: 'li',
          text: 'CSS pour la présentation visuelle, sans intention de transmettre une information essentielle uniquement par la couleur ou le style visuel ;',
        },
        {
          type: 'li',
          text: 'React et JavaScript pour les interactions dynamiques, avec des pratiques de gestion du clavier et du focus appliquées aux principaux parcours ;',
        },
        {
          type: 'li',
          text: 'essais dans les navigateurs modernes, y compris Chrome, Firefox, Safari et Edge ;',
        },
        {
          type: 'li',
          text: 'essais avec des technologies d’assistance et des outils d’accessibilité, y compris NVDA, VoiceOver, la navigation uniquement au clavier, les inspecteurs d’accessibilité des navigateurs, les vérifications de contraste de couleurs, les vérifications de zoom adaptatif et les analyses automatisées d’accessibilité ;',
        },
        {
          type: 'li',
          text: 'les outils automatisés ne détectent pas tous les problèmes d’accessibilité. Les essais manuels et les commentaires des utilisateurs demeurent des éléments importants de notre processus d’accessibilité.',
        },
      ],
    },
    {
      title: '6. Contenu et services de tiers',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva peut s’appuyer sur des fournisseurs tiers pour l’authentification, le paiement, l’hébergement, les outils d’analyse lorsqu’ils sont activés, l’inférence par IA, le soutien et les services d’infrastructure. Nous sélectionnons des fournisseurs destinés à soutenir une prestation de service sécuritaire et fiable, mais les interfaces de tiers peuvent présenter des limites d’accessibilité qui échappent à notre contrôle direct.',
        },
        {
          type: 'p',
          text: 'Nous accueillons les commentaires sur les obstacles rencontrés dans les processus de tiers afin d’évaluer les mesures d’atténuation, les options auprès des fournisseurs, le soutien de rechange ou les ajustements au produit.',
        },
      ],
    },
    {
      title: '7. Commentaires et formats accessibles',
      blocks: [
        {
          type: 'p',
          text: 'Nous accueillons vos commentaires sur l’accessibilité de Dutiva. Si vous rencontrez un obstacle ou avez des suggestions d’amélioration, veuillez communiquer avec nous :',
        },
        {
          type: 'p',
          text: 'Courriel : support@dutiva.ca',
        },
        {
          type: 'p',
          text: 'Objet suggéré : Commentaires sur l’accessibilité',
        },
        {
          type: 'p',
          text: 'Pour nous aider à examiner votre demande, veuillez inclure la page ou la fonctionnalité concernée, l’appareil, le navigateur et la technologie d’assistance utilisés, une description de l’obstacle et le résultat que vous cherchiez à obtenir.',
        },
        {
          type: 'p',
          text: 'Nous visons à accuser réception des commentaires sur l’accessibilité dans un délai de cinq jours ouvrables. Les problèmes complexes ou les demandes de format accessible peuvent exiger plus de temps, mais nous fournirons des mises à jour lorsque cela est raisonnable.',
        },
        {
          type: 'p',
          text: 'Si vous avez besoin de renseignements dans un format accessible ou d’une aide à la communication, communiquez avec nous et nous travaillerons avec vous pour fournir les renseignements d’une manière qui répond à vos besoins, sous réserve des limites techniques, juridiques et de sécurité.',
        },
      ],
    },
    {
      title: '8. Contexte réglementaire',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva surveille et vise à respecter les exigences canadiennes applicables en matière d’accessibilité. Les cadres pertinents peuvent comprendre les WCAG, la Loi canadienne sur l’accessibilité et ses règlements lorsqu’ils s’appliquent, la Loi de 2005 sur l’accessibilité pour les personnes handicapées de l’Ontario (LAPHO) lorsqu’elle s’applique, ainsi que d’autres lois provinciales en matière d’accessibilité lorsque celles-ci s’appliquent.',
        },
        {
          type: 'p',
          text: 'À mesure que la base d’utilisateurs, le nombre d’employés, les activités et les obligations juridiques de Dutiva évoluent, nous publierons les plans d’accessibilité, rapports d’étape et descriptions du processus de rétroaction exigés par la loi applicable.',
        },
        {
          type: 'p',
          text: 'La présente Déclaration décrit les engagements et pratiques actuels de Dutiva en matière d’accessibilité. Elle ne remplace aucun plan d’accessibilité, rapport d’étape ou document relatif au processus de rétroaction qui pourrait être exigé par une loi applicable.',
        },
      ],
    },
    {
      title: '9. Mises à jour de la présente déclaration',
      blocks: [
        {
          type: 'p',
          text: 'Nous pouvons mettre à jour la présente Déclaration d’accessibilité de temps à autre afin de refléter les changements apportés à notre plateforme, aux essais d’accessibilité, aux limites connues, aux travaux de correction ou aux obligations légales. La date de « dernière mise à jour » ci-dessus indique la date de la dernière révision de la présente Déclaration.',
        },
      ],
    },
    {
      title: '10. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva Canada Inc.',
        },
        {
          type: 'p',
          text: 'Courriel : support@dutiva.ca',
        },
        {
          type: 'p',
          text: 'Site Web : dutiva.ca',
        },
      ],
    },
  ],
} satisfies PolicyEdition
