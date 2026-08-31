import type { PolicyEdition } from '../policyContent'

export default {
  title: "Cadre de divulgation des risques liés à l'IA",
  lastUpdated: '1 juin 2026',
  effectiveDate: '1 juin 2026',
  callout: [
    "Dutiva Canada Inc. utilise des technologies d'intelligence artificielle pour générer du contenu et fournir des services. Ce document divulgue les risques associés à l'utilisation de ces technologies afin que vous puissiez prendre des décisions éclairées.",
  ],
  sections: [
    {
      title: '1. Limites de précision',
      blocks: [
        {
          type: 'p',
          text: "Les systèmes d'IA, y compris ceux utilisés par Dutiva, peuvent produire des résultats inexacts ou incomplets.",
        },
        {
          type: 'li',
          text: 'Les documents générés peuvent contenir des erreurs factuelles, grammaticales ou juridiques',
        },
        {
          type: 'li',
          text: 'Les informations peuvent ne pas refléter les dernières modifications législatives',
        },
        {
          type: 'li',
          text: "L'IA ne remplace pas l'expertise professionnelle qualifiée",
        },
        {
          type: 'li',
          text: 'Vous êtes responsable de la vérification de tout contenu généré avant utilisation',
        },
      ],
    },
    {
      title: "2. Risques d'hallucination",
      blocks: [
        {
          type: 'p',
          text: "Les modèles d'IA peuvent parfois générer des informations fictives ou inventées qui semblent plausibles, un phénomène connu sous le nom d'hallucination.",
        },
        {
          type: 'li',
          text: "L'IA peut inventer des références juridiques, des articles ou des précédents inexistants",
        },
        {
          type: 'li',
          text: 'Les citations et sources fournies doivent toujours être vérifiées indépendamment',
        },
        {
          type: 'li',
          text: 'Les informations sur les lois et réglementations doivent être confirmées auprès de sources officielles',
        },
        {
          type: 'li',
          text: 'Ne pas utiliser de contenu généré sans vérification pour des décisions importantes',
        },
      ],
    },
    {
      title: '3. Risques de biais',
      blocks: [
        {
          type: 'p',
          text: "Les modèles d'IA peuvent refléter et perpétuer des biais présents dans leurs données d'entraînement.",
        },
        {
          type: 'li',
          text: 'Le contenu généré peut contenir des biais culturels, de genre ou sociétaux',
        },
        {
          type: 'li',
          text: 'Les modèles peuvent sous-représenter certaines perspectives ou populations',
        },
        {
          type: 'li',
          text: "L'IA peut ne pas être adaptée à tous les contextes juridictionnels ou culturels",
        },
        {
          type: 'li',
          text: "Vérifiez que le contenu respecte les principes d'équité et d'inclusion de votre organisation",
        },
      ],
    },
    {
      title: "4. Risque d'obsolescence",
      blocks: [
        {
          type: 'p',
          text: "Les modèles d'IA ont une date de connaissance fixe et peuvent ne pas avoir accès aux informations les plus récentes.",
        },
        {
          type: 'li',
          text: 'Les connaissances du modèle ont une date limite qui peut ne pas inclure les changements récents',
        },
        {
          type: 'li',
          text: 'Les modifications législatives, réglementaires ou jurisprudentielles récentes peuvent être absentes',
        },
        {
          type: 'li',
          text: 'Dutiva met à jour ses connaissances de référence régulièrement, mais des lacunes peuvent subsister',
        },
        {
          type: 'li',
          text: 'Vérifiez toujours la pertinence temporelle des informations fournies',
        },
      ],
    },
    {
      title: '5. Scénarios nécessitant une révision humaine',
      blocks: [
        {
          type: 'p',
          text: "Certaines situations exigent obligatoirement l'examen par un professionnel qualifié et ne doivent pas reposer uniquement sur l'IA.",
        },
        {
          type: 'li',
          text: 'Documents juridiques contraignants ou litigieux',
        },
        {
          type: 'li',
          text: 'Conseils réglementaires ou de conformité spécifiques à votre industrie',
        },
        {
          type: 'li',
          text: 'Situations impliquant des droits des employés ou des litiges de travail',
        },
        {
          type: 'li',
          text: 'Décisions ayant des conséquences financières ou légales significatives',
        },
        {
          type: 'li',
          text: 'Cas impliquant des données sensibles ou des renseignements personnels protégés',
        },
      ],
    },
    {
      title: "6. Responsabilités de l'utilisateur",
      blocks: [
        {
          type: 'p',
          text: "En utilisant les services d'IA de Dutiva, vous reconnaissez et acceptez vos responsabilités.",
        },
        {
          type: 'li',
          text: "Vérifiez tout le contenu généré avant de l'utiliser, le partager ou le signer",
        },
        {
          type: 'li',
          text: 'Consultez un professionnel qualifié pour les questions complexes ou critiques',
        },
        {
          type: 'li',
          text: "Ne saisissez pas d'informations confidentielles, sensibles ou personnelles non nécessaires",
        },
        {
          type: 'li',
          text: 'Signalez les problèmes ou préoccupations à support@dutiva.ca',
        },
      ],
    },
  ],
} satisfies PolicyEdition
