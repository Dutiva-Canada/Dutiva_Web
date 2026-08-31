import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Politique d’intervention en cas d’incident et d’atteinte',
  lastUpdated: 'le 1er juin 2026',
  effectiveDate: 'le 1er juin 2026',
  callout: [
    'La présente Politique de réponse aux incidents et aux atteintes explique comment Dutiva Canada Inc. (« Dutiva », « nous », « notre » ou « nos ») identifie, escalade, contient, évalue, documente, communique et analyse les incidents de sécurité, les atteintes à la confidentialité, les incidents de confidentialité et les incidents liés aux fournisseurs qui touchent les systèmes de Dutiva ou des renseignements personnels.',
    'La présente Politique devrait être lue avec la Politique de confidentialité, l’Accord de traitement des données, la Politique de conservation et de suppression des données, les Conditions d’utilisation, la Divulgation relative à l’utilisation de l’IA, la Politique relative à l’IA et à la technologie et toute condition d’abonnement ou de commande applicable de Dutiva.',
  ],
  sections: [
    {
      title: '1. Portée et définitions',
      blocks: [
        {
          type: 'p',
          text: 'La présente Politique s’applique aux incidents soupçonnés ou confirmés visant les systèmes de Dutiva, l’infrastructure de production, les systèmes d’authentification, les identifiants de fournisseurs, les données des clients, les renseignements personnels, les documents générés, le traitement par le Conseiller, les requêtes aux fournisseurs de modèles d’IA, les processus de signature électronique, les intégrations liées au paiement, les systèmes de soutien, les sous-traitants ou les dossiers opérationnels connexes.',
        },
        {
          type: 'p',
          text: 'Aux fins de la présente Politique, un incident de sécurité désigne un événement susceptible de compromettre la confidentialité, l’intégrité, la disponibilité ou la résilience des systèmes, données, comptes, identifiants, processus ou infrastructures de Dutiva. Une atteinte à la confidentialité désigne la perte, l’accès non autorisé, la communication non autorisée ou l’utilisation non autorisée de renseignements personnels. En vertu de la LPRPDE, il peut s’agir d’une atteinte aux mesures de sécurité. Pour les renseignements personnels du Québec, il peut s’agir d’un incident de confidentialité.',
        },
        {
          type: 'p',
          text: 'Tout événement de sécurité ne constitue pas nécessairement une atteinte à la confidentialité devant être signalée. Dutiva évalue chaque incident en fonction des renseignements concernés, de la probabilité d’utilisation préjudiciable, des personnes ou clients touchés, des seuils juridiques, des obligations contractuelles et des mesures nécessaires pour réduire les préjudices et prévenir la répétition de l’incident.',
        },
      ],
    },
    {
      title: '2. Rôles de réponse',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva attribue les responsabilités de réponse selon le type d’incident, sa gravité, les systèmes touchés et l’incidence sur les renseignements personnels. Les rôles suivants peuvent participer à la réponse :',
        },
        {
          type: 'li',
          text: 'Responsable de l’incident : coordonne le triage, le confinement, l’enquête, les mises à jour de statut, la consignation des décisions et l’examen post-incident.',
        },
        {
          type: 'li',
          text: 'Responsable de la protection des renseignements personnels : évalue l’incidence sur les renseignements personnels, les obligations d’avis, les seuils de risque en matière de confidentialité, les dossiers d’atteinte, les registres d’incidents de confidentialité et les communications avec les organismes de réglementation.',
        },
        {
          type: 'li',
          text: 'Responsable de l’ingénierie : enquête sur la cause technique, examine les journaux, fait la rotation des identifiants, corrige le code, valide les correctifs et vérifie les mesures de remédiation.',
        },
        {
          type: 'li',
          text: 'Responsable des communications avec les clients : prépare les mises à jour destinées aux clients, les consignes de soutien, les avis aux utilisateurs touchés et les messages de suivi lorsque requis.',
        },
        {
          type: 'li',
          text: 'Conseiller juridique : examine les avis à risque élevé, les dépôts auprès des organismes de réglementation, les obligations contractuelles, la préservation des éléments de preuve, les questions de secret professionnel et les risques liés aux litiges ou aux tribunaux.',
        },
        {
          type: 'li',
          text: 'Responsable exécutif, au besoin : soutient les décisions prioritaires, les décisions liées à l’incidence sur les clients, l’allocation des ressources et les communications externes pour les incidents importants.',
        },
      ],
    },
    {
      title: '3. Phases de réponse',
      blocks: [
        {
          type: 'p',
          text: 'Le processus de réponse aux incidents de Dutiva suit généralement les phases ci-dessous. Certaines phases peuvent se dérouler en parallèle lorsque l’urgence exige un confinement immédiat ou un soutien aux avis :',
        },
        {
          type: 'li',
          text: 'Détection : recevoir et examiner les signaux provenant de la surveillance, des journaux, des alertes de fournisseurs, des utilisateurs, des billets de soutien, des chercheurs en sécurité, des examens internes ou d’un comportement inhabituel du service.',
        },
        {
          type: 'li',
          text: 'Triage : classifier la gravité, les systèmes touchés, les catégories de données, l’incidence sur les clients, l’incidence sur les personnes, le risque d’exploitation active, la participation de fournisseurs et la possibilité que des renseignements personnels soient concernés.',
        },
        {
          type: 'li',
          text: 'Confinement : révoquer ou faire la rotation des identifiants, isoler les systèmes, désactiver les fonctionnalités touchées, bloquer le trafic abusif, suspendre un traitement risqué, appliquer des correctifs d’urgence ou préserver les processus touchés tout en empêchant un préjudice supplémentaire.',
        },
        {
          type: 'li',
          text: 'Enquête : préserver les éléments de preuve pertinents, déterminer la cause fondamentale, établir les dossiers touchés, estimer les personnes ou clients touchés, reconstituer la chronologie et confirmer si un fournisseur ou un sous-traitant est impliqué.',
        },
        {
          type: 'li',
          text: 'Évaluation : déterminer les incidences juridiques, de confidentialité, contractuelles, client, opérationnelles, de sécurité et de réputation, y compris si les seuils d’avis sont atteints.',
        },
        {
          type: 'li',
          text: 'Avis : transmettre des avis aux clients, organismes de réglementation, personnes touchées, fournisseurs, assureurs, organismes d’application de la loi ou autres parties lorsque cela est requis ou approprié.',
        },
        {
          type: 'li',
          text: 'Rétablissement : restaurer le service, valider les correctifs, surveiller toute récurrence, mettre à jour les mesures de protection et transférer l’incident à l’examen post-incident une fois la situation opérationnellement stable.',
        },
        {
          type: 'li',
          text: 'Amélioration : suivre les mesures correctives, mises à jour de politiques, changements techniques, besoins de formation et changements au produit ou aux processus séparément du dossier d’incident.',
        },
      ],
    },
    {
      title: '4. Normes de délai',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva traite les incidents de sécurité et les incidents de confidentialité potentiels comme urgents. Lorsque cela est faisable, Dutiva vise un triage initial dans les 24 heures suivant la découverte et une première évaluation juridique ou de confidentialité dans les 72 heures suivant la confirmation que des renseignements personnels pourraient être concernés.',
        },
        {
          type: 'p',
          text: 'Ces normes de délai sont des cibles internes d’escalade. Elles ne remplacent pas les exigences légales ou contractuelles et peuvent varier selon la complexité de l’incident, la disponibilité des éléments de preuve, la participation de fournisseurs, les restrictions liées à l’application de la loi ou la nécessité de prévenir des préjudices additionnels.',
        },
        {
          type: 'p',
          text: 'En vertu de la LPRPDE, les atteintes devant être signalées doivent être déclarées au Commissariat à la protection de la vie privée du Canada et les personnes touchées doivent être avisées dès que possible après que Dutiva a déterminé que l’atteinte crée un risque réel de préjudice grave. Les incidents de confidentialité du Québec qui présentent un risque de préjudice sérieux doivent être déclarés à la Commission d’accès à l’information du Québec et aux personnes touchées avec diligence, sous réserve des limites d’enquête applicables.',
        },
      ],
    },
    {
      title: '5. Évaluation des atteintes en vertu de la LPRPDE',
      blocks: [
        {
          type: 'p',
          text: 'Pour les renseignements personnels dont Dutiva a la responsabilité, Dutiva évalue si une atteinte aux mesures de sécurité crée un risque réel de préjudice grave en tenant compte de la sensibilité des renseignements personnels concernés et de la probabilité que ces renseignements aient été, soient ou soient éventuellement mal utilisés. Dutiva peut également tenir compte des circonstances de l’atteinte, de la durée d’exposition, des indicateurs liés à un acteur malveillant, des mesures d’atténuation déjà prises, de la probabilité de vol d’identité, de perte financière, d’humiliation, d’atteinte à la réputation, de préjudice lié à l’emploi ou d’autres préjudices raisonnablement prévisibles.',
        },
        {
          type: 'p',
          text: 'Lorsque Dutiva détermine que le seuil du risque réel de préjudice grave est atteint, Dutiva :',
        },
        {
          type: 'li',
          text: 'déclarera l’atteinte au Commissariat à la protection de la vie privée du Canada dès que possible ;',
        },
        {
          type: 'li',
          text: 'avisera les personnes touchées dès que possible, sauf interdiction par la loi ;',
        },
        {
          type: 'li',
          text: 'avisera d’autres organisations ou institutions gouvernementales lorsque cela est approprié et susceptible de réduire ou d’atténuer le préjudice ;',
        },
        {
          type: 'li',
          text: 'fournira le contenu d’avis exigé par la loi applicable et les renseignements raisonnablement utiles pour aider les personnes touchées à réduire le risque ;',
        },
        {
          type: 'li',
          text: 'conservera un dossier de chaque atteinte aux mesures de sécurité pendant au moins 24 mois suivant le jour où Dutiva détermine que l’atteinte s’est produite, sauf si une période plus longue est exigée ou raisonnablement nécessaire.',
        },
      ],
    },
    {
      title: '6. Incidents de confidentialité au Québec',
      blocks: [
        {
          type: 'p',
          text: 'Pour les renseignements personnels du Québec, Dutiva évalue si un incident de confidentialité présente un risque de préjudice sérieux. L’évaluation tient compte, entre autres facteurs, de la sensibilité des renseignements personnels, des conséquences appréhendées de leur utilisation et de la probabilité qu’ils soient utilisés à des fins préjudiciables. Dutiva consulte le responsable de la protection des renseignements personnels dans le cadre de cette évaluation lorsque cela est requis ou approprié.',
        },
        {
          type: 'p',
          text: 'Lorsque Dutiva détermine que le seuil du risque de préjudice sérieux est atteint, Dutiva :',
        },
        {
          type: 'li',
          text: 'avisera la Commission d’accès à l’information du Québec avec diligence ;',
        },
        {
          type: 'li',
          text: 'avisera les personnes touchées avec diligence, sauf si l’avis est susceptible d’entraver une enquête menée en vertu de la loi pour prévenir, détecter ou réprimer le crime ou les infractions aux lois ;',
        },
        {
          type: 'li',
          text: 'prendra des mesures raisonnables pour diminuer le risque de préjudice et éviter que de nouveaux incidents de même nature se produisent ;',
        },
        {
          type: 'li',
          text: 'transmettra avec diligence à la Commission d’accès à l’information du Québec les renseignements complémentaires requis dont Dutiva prend connaissance après l’avis initial ;',
        },
        {
          type: 'li',
          text: 'inscrira l’incident au registre des incidents de confidentialité de Dutiva ;',
        },
        {
          type: 'li',
          text: 'conservera les renseignements inscrits au registre des incidents de confidentialité du Québec pendant au moins cinq ans après la date ou la période au cours de laquelle Dutiva a pris connaissance de l’incident.',
        },
      ],
    },
    {
      title: '7. Avis aux clients et notifications liées au rôle de sous-traitant',
      blocks: [
        {
          type: 'p',
          text: 'Lorsque Dutiva traite des Renseignements personnels du client pour le compte d’un client, Dutiva avisera le client touché sans délai indu après avoir confirmé un incident visant des Renseignements personnels du client qui exige une action du client, un soutien à la notification ou une escalade contractuelle.',
        },
        {
          type: 'p',
          text: 'Les avis aux clients comprendront les renseignements raisonnablement disponibles à Dutiva, lesquels peuvent inclure la nature de l’incident, la date ou la période connue ou estimée, les systèmes touchés, les catégories de données touchées, les mesures de confinement et de remédiation prises, les actions recommandées au client, l’indication que des avis aux organismes de réglementation ou aux personnes pourraient être requis et le point de contact de Dutiva pour le suivi.',
        },
        {
          type: 'p',
          text: 'Lorsque le client est responsable des renseignements personnels sous-jacents, le client demeure responsable d’évaluer et de respecter ses propres obligations de notification, de tenue de dossiers, d’emploi, réglementaires, contractuelles et liées au milieu de travail. Dutiva fournira une collaboration raisonnable au moyen des canaux disponibles liés au produit, au soutien, au droit et à la technique.',
        },
      ],
    },
    {
      title: '8. Incidents touchant les fournisseurs et sous-traitants',
      blocks: [
        {
          type: 'p',
          text: 'Certains incidents peuvent provenir d’un fournisseur de services, d’un sous-traitant, d’un fournisseur de modèles, d’un fournisseur de paiement, d’un fournisseur d’hébergement, d’un fournisseur de sécurité, d’un fournisseur d’analytique lorsque celle-ci est activée ou d’un autre système tiers utilisé pour fournir Dutiva, ou les impliquer.',
        },
        {
          type: 'p',
          text: 'Lorsque Dutiva reçoit un avis d’incident d’un fournisseur, Dutiva évaluera l’incident dans le contexte du service Dutiva, déterminera si les systèmes de Dutiva, les Données du client ou des renseignements personnels pourraient être touchés, demandera les renseignements raisonnablement nécessaires à son évaluation et coordonnera les communications avec les clients ou les organismes de réglementation lorsque requis.',
        },
        {
          type: 'p',
          text: 'Une panne, une vulnérabilité ou un événement de sécurité chez un fournisseur ne signifie pas automatiquement que des renseignements personnels de Dutiva ont été touchés. Dutiva évaluera les faits disponibles avant de communiquer une incidence confirmée sur les renseignements personnels, tout en fournissant des mises à jour opérationnelles en temps opportun lorsque cela est approprié.',
        },
      ],
    },
    {
      title: '9. Communications et contenu des avis',
      blocks: [
        {
          type: 'p',
          text: 'Les communications relatives à un incident devraient être exactes, proportionnées, opportunes et fondées sur les faits connus. Dutiva évite les spéculations, l’exagération, la sous-divulgation et la communication inutile de détails techniques sensibles qui pourraient accroître le risque de sécurité.',
        },
        {
          type: 'p',
          text: 'Selon l’incident et les exigences légales, les avis peuvent comprendre une description de l’incident, la date ou la période où il s’est produit, le moment où Dutiva en a pris connaissance, les catégories de données touchées, les personnes ou clients touchés, les mesures d’atténuation prises, les mesures que les personnes ou clients peuvent prendre pour réduire le risque, l’utilisation d’un avis public, les coordonnées de contact et les renseignements relatifs aux dépôts réglementaires requis.',
        },
        {
          type: 'p',
          text: 'Dutiva peut mettre à jour les communications relatives à l’incident à mesure que des faits supplémentaires sont confirmés. Des avis complémentaires peuvent être fournis lorsque la loi, les engagements contractuels, les attentes d’un organisme de réglementation ou les besoins de soutien aux clients l’exigent.',
        },
      ],
    },
    {
      title: '10. Dossiers d’incident et conservation',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva tient des dossiers d’incident adaptés au type d’incident, à sa gravité, aux exigences légales et aux besoins opérationnels. Les dossiers d’incident peuvent comprendre :',
        },
        {
          type: 'li',
          text: 'la date de découverte, la date ou la période estimée de survenance, la chronologie interne et la date à laquelle Dutiva a pris connaissance de l’incident ;',
        },
        {
          type: 'li',
          text: 'les systèmes, fournisseurs, sous-traitants, clients, personnes, comptes, dossiers et catégories de données concernés ;',
        },
        {
          type: 'li',
          text: 'les mesures de confinement, d’éradication, de rétablissement, de surveillance et d’atténuation prises ou prévues ;',
        },
        {
          type: 'li',
          text: 'l’évaluation du risque, l’analyse des seuils de confidentialité, l’analyse des avis, les avis transmis et les dépôts auprès des organismes de réglementation ;',
        },
        {
          type: 'li',
          text: 'les communications avec les clients, les communications avec les personnes touchées, les avis publics et les consignes de soutien lorsque cela s’applique ;',
        },
        {
          type: 'li',
          text: 'la cause fondamentale, les mesures correctives, les responsables, les échéances, les preuves de vérification et la décision de clôture.',
        },
        {
          type: 'p',
          text: 'Les dossiers d’incident et d’atteinte sont conservés conformément à la Politique de conservation et de suppression des données de Dutiva et aux exigences légales applicables, y compris les périodes statutaires relatives aux dossiers d’atteinte et aux registres d’incidents de confidentialité.',
        },
      ],
    },
    {
      title: '11. Examen post-incident et amélioration',
      blocks: [
        {
          type: 'p',
          text: 'Après les incidents importants, Dutiva effectuera un examen post-incident afin d’identifier la cause fondamentale, les signaux manqués, les décisions retardées, les lacunes de contrôle, les problèmes liés aux fournisseurs, les besoins de formation, les changements au produit, les mises à jour de politiques et les responsables du suivi.',
        },
        {
          type: 'p',
          text: 'Les correctifs de sécurité et les mises à jour de politiques sont suivis séparément de l’incident afin que la remédiation ne dépende pas de la mémoire ou de notes informelles. Dutiva peut mettre à jour les mesures de protection, la surveillance, les voies d’escalade, les messages aux utilisateurs, les contrôles des fournisseurs, la documentation ou la formation en fonction des enseignements tirés des incidents.',
        },
      ],
    },
    {
      title: '12. Références officielles et politiques connexes',
      blocks: [
        {
          type: 'p',
          text: 'Les points de référence comprennent les lignes directrices du Commissariat à la protection de la vie privée du Canada sur la déclaration obligatoire des atteintes en vertu de la LPRPDE et les lignes directrices de la Commission d’accès à l’information du Québec sur les incidents de confidentialité pour les entreprises privées.',
        },
        {
          type: 'p',
          text: 'Les politiques connexes de Dutiva comprennent la Politique de confidentialité, l’Accord de traitement des données, la Politique de conservation et de suppression des données, les Conditions d’utilisation, l’Avis de non-responsabilité juridique, la Politique relative aux témoins, la Divulgation relative à l’utilisation de l’IA et la Politique relative à l’IA et à la technologie.',
        },
      ],
    },
    {
      title: '13. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Les questions concernant la présente Politique ou la gestion des incidents liés à la confidentialité peuvent être transmises au responsable de la protection des renseignements personnels de Dutiva à l’adresse privacy@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'Les préoccupations en matière de sécurité ou les soupçons de mauvaise utilisation de Dutiva peuvent également être signalés par les canaux de soutien à support@dutiva.ca avec l’objet « Incident de sécurité ».',
        },
      ],
    },
  ],
} satisfies PolicyEdition
