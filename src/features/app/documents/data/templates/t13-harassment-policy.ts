/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. That generator is retired — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why.

   Widened in v5 to be Ring 2 Pillar C's respectful workplace policy. The
   framework asks for a policy "covering harassment, discrimination, and
   inclusion", and #126 recorded that the first two were already here and the
   third was not — so the tool stayed outstanding rather than being counted
   done against a policy that did not cover it. Building it by widening this
   file rather than minting a companion was the decision then, and it is what
   happened.

   Two things were wrong independently of that. `includes` advertised seven
   sections — definitions, prohibited conduct, reporting, confidentiality,
   investigation, no reprisal, support resources — and the preview rendered
   two clauses, so the template promised a document it did not produce. And a
   conduct policy with no statement of what is *not* harassment is the version
   that makes managers afraid to manage; reasonable direction, feedback and
   performance management are named here for that reason. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT13: DocTemplate = {
  id: 'tpl_t13',
  tid: 'T13',
  key: 'harassment_policy',
  kind: 'policy',
  category: 'policies',
  core: true,
  name: {
    en: 'Respectful workplace policy',
    fr: 'Politique sur le respect en milieu de travail',
  },
  desc: {
    en: 'The base policy every jurisdiction Dutiva covers requires — harassment, discrimination and violence, what respect looks like day to day, and how a report is handled. Québec and federal workplaces prescribe further content the document lists for you to add.',
    fr: 'La politique de base exigée dans chaque juridiction couverte par Dutiva — harcèlement, discrimination et violence, respect au quotidien et traitement d’un signalement. Le Québec et le régime fédéral prescrivent du contenu additionnel que le document énumère pour que vous l’ajoutiez.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v5',
  versionNumber: 5,
  effectiveDate: '2026-02-01',
  updatedAt: '2026-08-01',
  estMinutes: 11,
  usageCount: 88,
  statutory: [
    {
      en: 'OHSA — Bill 168 duties',
      fr: 'LSST — obligations (projet 168)',
    },
    {
      en: 'LSA — psychological harassment',
      fr: 'LNT — harcèlement psychologique',
    },
    {
      en: 'Work Place Harassment and Violence Prevention Regulations (federal)',
      fr: 'Règlement fédéral sur le harcèlement et la violence',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Two statutes carry this. The Occupational Health and Safety Act requires a written harassment and violence programme, worker training, and a defined complaint procedure — including a route that does not run through the employee’s own manager. The Human Rights Code is what defines discrimination and sets the protected grounds this policy refers to; the Code’s list is the operative one, so check it rather than relying on any list reproduced elsewhere.',
      fr: 'Deux lois s’appliquent. La Loi sur la santé et la sécurité au travail exige un programme écrit contre le harcèlement et la violence, la formation des travailleurs et une procédure de plainte définie — y compris une voie qui ne passe pas par le gestionnaire de la personne. Le Code des droits de la personne définit la discrimination et établit les motifs protégés auxquels renvoie la présente politique ; c’est la liste du Code qui fait foi, alors consultez-la plutôt que toute liste reproduite ailleurs.',
    },
    QC: {
      en: 'The Act respecting labour standards requires an employer to adopt a psychological harassment prevention and complaint-handling policy and to make it available to employees, and psychological harassment there expressly includes sexual harassment. Note that a single serious incident can constitute harassment where it produces a lasting harmful effect — a policy written as though a pattern is always required understates the law, and one written as though seriousness alone suffices overstates it. The Charter of human rights and freedoms sets the protected grounds. The policy must be available in French.',
      fr: 'La Loi sur les normes du travail oblige l’employeur à adopter une politique de prévention du harcèlement psychologique et de traitement des plaintes et à la rendre disponible au personnel, et le harcèlement psychologique y comprend expressément le harcèlement sexuel. Notez qu’une seule conduite grave peut constituer du harcèlement lorsqu’elle produit un effet nocif continu — une politique rédigée comme si une répétition était toujours requise sous-estime la loi, et une politique laissant croire que la gravité suffit la surestime. La Charte des droits et libertés de la personne établit les motifs protégés. La politique doit être disponible en français.',
    },
    FED: {
      en: 'The Work Place Harassment and Violence Prevention Regulations require the policy to be developed and reviewed jointly with the policy committee or health and safety representative — an employer-written policy circulated for comment does not satisfy that. They also require a workplace assessment, training, and a resolution process with prescribed timelines, and they protect the identity of the parties throughout. The Canadian Human Rights Act sets the protected grounds.',
      fr: 'Le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail exige que la politique soit élaborée et révisée conjointement avec le comité d’orientation ou le représentant en santé et sécurité — une politique rédigée par l’employeur puis soumise à commentaires n’y satisfait pas. Il exige aussi une évaluation du lieu de travail, de la formation et un processus de règlement assorti de délais prescrits, et il protège l’identité des parties tout au long. La Loi canadienne sur les droits de la personne établit les motifs protégés.',
    },
  },
  includes: [
    {
      en: 'Definitions',
      fr: 'Définitions',
    },
    {
      en: 'Prohibited conduct',
      fr: 'Conduite interdite',
    },
    {
      en: 'What respect looks like day to day',
      fr: 'Le respect au quotidien',
    },
    {
      en: 'What is not harassment',
      fr: 'Ce qui ne constitue pas du harcèlement',
    },
    {
      en: 'How to report',
      fr: 'Comment signaler',
    },
    {
      en: 'Confidentiality',
      fr: 'Confidentialité',
    },
    {
      en: 'Investigation process',
      fr: 'Processus d’enquête',
    },
    {
      en: 'No reprisal',
      fr: 'Aucune représailles',
    },
    {
      en: 'Support resources',
      fr: 'Ressources de soutien',
    },
    {
      en: 'Training and review cycle',
      fr: 'Formation et cycle de révision',
    },
  ],
  questions: [
    {
      id: 'effective_date',
      section: {
        en: 'Basics',
        fr: 'Bases',
      },
      label: {
        en: 'Effective date',
        fr: 'Date d’entrée en vigueur',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'report_to',
      section: {
        en: 'Reporting',
        fr: 'Signalement',
      },
      label: {
        en: 'Report incidents to',
        fr: 'Signaler les incidents à',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. HR lead',
        fr: 'p. ex. responsable RH',
      },
    },
    {
      id: 'alt_contact',
      section: {
        en: 'Reporting',
        fr: 'Signalement',
      },
      label: {
        en: 'Alternate contact (if respondent is the manager)',
        fr: 'Contact alternatif (si le mis en cause est le gestionnaire)',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Owner / external ombud',
        fr: 'p. ex. propriétaire / ombudsman',
      },
    },
    {
      id: 'support_resources',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'Support available to anyone involved',
        fr: 'Soutien offert aux personnes concernées',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Assistance programme, benefits contact, or the external services you would point people to.',
        fr: 'Programme d’aide, personne-ressource pour les avantages, ou services externes vers lesquels orienter.',
      },
      hint: {
        en: 'Support is available to everyone involved, including the person a complaint is about. A policy that offers it only to complainants is one respondents disengage from.',
        fr: 'Le soutien est offert à toutes les personnes concernées, y compris celle visée par une plainte. Une politique qui ne l’offre qu’aux plaignants est une politique dont les personnes mises en cause se désengagent.',
      },
    },
    {
      id: 'review_cycle',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'How often this policy is reviewed',
        fr: 'Fréquence de révision de la politique',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. every year, and after any incident.',
        fr: 'p. ex. chaque année, et après tout incident.',
      },
      hint: {
        en: 'This is a floor, not a preference. Ontario requires an annual review of the harassment programme, and the federal Regulations require one at least every three years — so "every four years" is not a slower choice, it is non-compliance. Write the cycle you will actually keep, at least as often as your jurisdiction requires; the clause below states the minimum that applies to you.',
        fr: 'Il s’agit d’un seuil, non d’une préférence. L’Ontario exige une révision annuelle du programme contre le harcèlement et le règlement fédéral en exige une au moins tous les trois ans — « tous les quatre ans » n’est donc pas un choix plus espacé, mais un manquement. Inscrivez le cycle que vous respecterez réellement, au moins aussi souvent que l’exige votre juridiction ; la clause ci-dessous énonce le minimum qui vous est applicable.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Harassment, Discrimination & Violence Policy',
        fr: 'Politique sur le harcèlement, la discrimination et la violence',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · Effective {{effective_date}} · {{jurisdiction}}',
        fr: '{{org}} · En vigueur le {{effective_date}} · {{jurisdiction}}',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'What we are committing to',
        fr: 'Notre engagement',
      },
      text: {
        en: '{{org}} is committed to a workplace free from harassment, discrimination and violence, as required in {{jurisdiction}}. This policy applies to everyone who works here, however they are engaged, and it applies wherever the work happens — on our premises, at a client site, while travelling, at work events, and in email, chat and video calls. Conduct does not stop being workplace conduct because it happened on a screen or after hours.',
        fr: '{{org}} s’engage à offrir un milieu exempt de harcèlement, de discrimination et de violence, conformément aux exigences applicables en {{jurisdiction}}. La présente politique vise toute personne qui travaille ici, quel que soit son statut, et s’applique partout où le travail se fait : dans nos locaux, chez un client, en déplacement, lors d’activités professionnelles, ainsi que dans les courriels, les messageries et les visioconférences. Un comportement ne cesse pas de relever du travail parce qu’il s’est produit à l’écran ou en dehors des heures.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'What is prohibited',
        fr: 'Ce qui est interdit',
      },
      text: {
        en: 'As a matter of this policy {{org}} prohibits: harassment, meaning comment or conduct directed at someone that is unwelcome and that is not the ordinary business of managing — where that line falls is clause 5, which is part of this definition rather than an exception to it; sexual harassment, including unwelcome advances, comments about someone’s body or private life, and the display or sending of sexual material; discrimination, meaning treating someone adversely on a ground the human rights legislation applying to this workplace protects; and violence, including threats and attempts, whether or not anyone is hurt. This is the standard we hold ourselves to and it is deliberately wider than the legal minimum — conduct can breach this policy without meeting the statutory test. The statutory definition, which is what the law measures, is set out in the next clause.',
        fr: 'Au titre de la présente politique, {{org}} interdit : le harcèlement, soit des propos ou comportements importuns dirigés vers une personne et qui ne relèvent pas de la gestion ordinaire — la clause 5 précise où passe cette frontière et fait partie de la présente définition plutôt que d’y déroger ; le harcèlement sexuel, y compris les avances importunes, les commentaires sur le corps ou la vie privée d’une personne et l’affichage ou l’envoi de matériel à caractère sexuel ; la discrimination, soit un traitement défavorable fondé sur un motif protégé par la législation en droits de la personne applicable à ce milieu ; et la violence, y compris les menaces et les tentatives, qu’il y ait blessure ou non. Il s’agit de la norme que nous nous donnons et elle est volontairement plus large que le minimum légal — un comportement peut contrevenir à la présente politique sans satisfaire au critère prévu par la loi. La définition légale, celle que la loi applique, figure à la clause suivante.',
      },
    },
    {
      type: 'clause',
      n: 3,
      when: {
        juris: 'ON',
      },
      heading: {
        en: 'The definition the law uses here',
        fr: 'La définition retenue par la loi ici',
      },
      text: {
        en: 'Under the Occupational Health and Safety Act, workplace harassment means engaging in a course of vexatious comment or conduct against a worker in a workplace that is known or ought reasonably to be known to be unwelcome, including virtually through the use of information and communications technology — and it includes workplace sexual harassment. Note "a course of": a single remark will usually breach this policy without meeting that statutory test. Workplace violence has its own definition, covering the exercise or attempted exercise of physical force that causes or could cause injury, and a statement or behaviour a worker could reasonably interpret as a threat to do so. Discrimination is defined by the Human Rights Code, which is also where the protected grounds are set out.',
        fr: 'Sous le régime de la Loi sur la santé et la sécurité au travail, le harcèlement au travail s’entend du fait pour une personne d’adopter une ligne de conduite caractérisée par des remarques ou des gestes vexatoires contre un travailleur dans un lieu de travail, lorsqu’elle sait ou devrait raisonnablement savoir que cette conduite est importune, y compris virtuellement par l’utilisation de technologies de l’information et des communications — et il comprend le harcèlement sexuel au travail. Notez « une ligne de conduite » : une remarque isolée contreviendra généralement à la présente politique sans satisfaire à ce critère légal. La violence au travail a sa propre définition, qui vise l’emploi ou la tentative d’emploi d’une force physique causant ou pouvant causer un préjudice, ainsi que les propos ou comportements qu’un travailleur pourrait raisonnablement interpréter comme une menace en ce sens. La discrimination est définie par le Code des droits de la personne, qui énonce aussi les motifs protégés.',
      },
    },
    {
      type: 'clause',
      n: 3,
      when: {
        juris: 'QC',
      },
      heading: {
        en: 'The definition the law uses here',
        fr: 'La définition retenue par la loi ici',
      },
      text: {
        en: 'Under the Act respecting labour standards, psychological harassment means vexatious behaviour manifesting itself in repeated and hostile or unwanted conduct, verbal comments, actions or gestures, that affects an employee’s dignity or psychological or physical integrity and results in a harmful work environment. It expressly includes conduct of a sexual nature. A single serious incident can also amount to psychological harassment, but only where it produces a lasting harmful effect — seriousness alone is not the test. Discrimination is governed by the Charter of human rights and freedoms, which sets the protected grounds.',
        fr: 'Sous le régime de la Loi sur les normes du travail, le harcèlement psychologique s’entend d’une conduite vexatoire se manifestant par des comportements, des paroles, des actes ou des gestes répétés, hostiles ou non désirés, qui porte atteinte à la dignité ou à l’intégrité psychologique ou physique de la personne salariée et entraîne un milieu de travail néfaste. Il comprend expressément les conduites à caractère sexuel. Une seule conduite grave peut également constituer du harcèlement psychologique, mais uniquement lorsqu’elle produit un effet nocif continu — la gravité seule ne suffit pas. La discrimination relève de la Charte des droits et libertés de la personne, qui établit les motifs protégés.',
      },
    },
    {
      type: 'clause',
      n: 3,
      when: {
        juris: 'FED',
      },
      heading: {
        en: 'The definition the law uses here',
        fr: 'La définition retenue par la loi ici',
      },
      text: {
        en: 'Under the Canada Labour Code, harassment and violence is defined as one thing rather than two: any action, conduct or comment, including of a sexual nature, that can reasonably be expected to cause offence, humiliation or other physical or psychological injury or illness to an employee. That is broader than the tests used provincially — it requires no course of conduct and no lasting effect. Discrimination is governed by the Canadian Human Rights Act, which sets the protected grounds.',
        fr: 'Sous le régime du Code canadien du travail, le harcèlement et la violence sont définis comme une seule notion plutôt que deux : tout acte, comportement ou propos, y compris de nature sexuelle, dont on peut raisonnablement s’attendre à ce qu’il offense ou humilie un employé ou lui cause une blessure ou une maladie, physique ou psychologique. C’est plus large que les critères applicables en province — aucune ligne de conduite ni effet durable n’est exigé. La discrimination relève de la Loi canadienne sur les droits de la personne, qui établit les motifs protégés.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'What respect looks like here',
        fr: 'Ce à quoi ressemble le respect ici',
      },
      text: {
        en: 'Prohibitions describe the floor. Most of what makes a workplace liveable sits above it, and it is worth saying out loud: people are addressed by the name and pronouns they use; meetings are run so the quietest person in them can be heard; credit follows the work; disagreement is about the work and not the person; and someone who says a joke landed badly is told thank you rather than that they misread it. Nobody is disciplined for falling short of this paragraph. It is the standard we hold ourselves to, and the reason the paragraphs above rarely have to be used.',
        fr: 'Les interdictions décrivent le seuil minimal. L’essentiel de ce qui rend un milieu vivable se situe au-dessus, et cela mérite d’être dit : on s’adresse aux personnes par le nom et les pronoms qu’elles utilisent ; les réunions sont animées de façon que la personne la plus discrète puisse se faire entendre ; le mérite suit le travail ; les désaccords portent sur le travail et non sur la personne ; et lorsqu’une personne signale qu’une plaisanterie a mal passé, on la remercie plutôt que de lui dire qu’elle a mal compris. Personne n’est sanctionné pour ne pas être à la hauteur du présent paragraphe. C’est la norme que nous nous donnons, et la raison pour laquelle les paragraphes précédents servent rarement.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'What is not harassment',
        fr: 'Ce qui ne constitue pas du harcèlement',
      },
      text: {
        en: 'Managing is not harassing. Assigning work, setting deadlines, giving feedback that is difficult to hear, addressing performance, investigating a concern, and deciding not to approve something are all ordinary and none of them becomes harassment because the person on the receiving end is unhappy. What changes that is how it is done: direction delivered to humiliate, singled out for a reason this policy prohibits, or applied to one person and not another doing the same job. If you are unsure which side of that line you are on, ask before you act rather than after.',
        fr: 'Encadrer n’est pas harceler. Attribuer du travail, fixer des échéances, donner une rétroaction difficile à entendre, aborder le rendement, examiner une préoccupation ou refuser une demande sont des gestes ordinaires, et aucun ne devient du harcèlement parce que la personne visée en est mécontente. Ce qui change la donne, c’est la manière : une directive donnée pour humilier, une personne ciblée pour un motif que la présente politique interdit, ou une règle appliquée à l’une et non à l’autre pour un même poste. Si vous doutez de quel côté de cette ligne vous vous trouvez, demandez avant d’agir plutôt qu’après.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'How to report',
        fr: 'Comment signaler',
      },
      text: {
        en: 'Report to {{report_to}}. If the report concerns that person, contact {{alt_contact}} instead — you never have to raise something with the person it is about. A report can be made in writing or in person, by the person affected or by someone who witnessed it. You do not need to be certain, and you do not need to use the word "harassment". Nothing here removes your right to go to the ministry, regulator or human rights body with jurisdiction, or to take your own legal advice, at any point.',
        fr: 'Signalez à {{report_to}}. Si le signalement concerne cette personne, adressez-vous plutôt à {{alt_contact}} — vous n’avez jamais à soulever une question auprès de la personne qu’elle vise. Un signalement peut être fait par écrit ou de vive voix, par la personne concernée ou par un témoin. Vous n’avez pas à être certain(e), ni à employer le mot « harcèlement ». Rien ici ne vous retire le droit de vous adresser au ministère, à l’organisme de réglementation ou à l’organisme des droits de la personne compétent, ni de consulter votre propre conseiller juridique, à tout moment.',
      },
    },
    {
      type: 'clause',
      n: 7,
      heading: {
        en: 'Confidentiality, and its limits',
        fr: 'La confidentialité et ses limites',
      },
      text: {
        en: 'A report is shared only with the people who need it to respond, and details are not discussed in the workplace. That is not the same as secrecy, and we will not promise more than we can hold to: a person a complaint is about has to be told enough to answer it, some matters must be reported to a regulator, and a record may have to be produced in a proceeding. Where the law requires us to disclose, we will, and we will tell you before we do wherever we can.',
        fr: 'Un signalement n’est communiqué qu’aux personnes qui doivent y donner suite, et les détails ne se discutent pas dans le milieu de travail. Cela ne signifie pas le secret, et nous ne promettrons pas plus que ce que nous pouvons tenir : la personne visée par une plainte doit en savoir assez pour y répondre, certaines situations doivent être signalées à un organisme de réglementation, et un dossier peut devoir être produit dans une instance. Lorsque la loi nous oblige à divulguer, nous le ferons, et nous vous en informerons au préalable chaque fois que ce sera possible.',
      },
    },
    {
      type: 'clause',
      n: 8,
      heading: {
        en: 'What happens after a report',
        fr: 'Ce qui suit un signalement',
      },
      text: {
        en: 'Every report is taken seriously and looked into in a way that fits what is alleged — not every concern needs a formal investigation, and some are resolved by a conversation the parties agree to. Where an investigation is needed it is conducted by someone impartial, the person the complaint is about is told the allegations in enough detail to respond, both are given the chance to be heard, and the outcome is communicated to those entitled to it. Nothing is decided before that happens.',
        fr: 'Chaque signalement est pris au sérieux et examiné d’une manière adaptée à ce qui est allégué — toute préoccupation n’appelle pas une enquête formelle, et certaines se règlent par une conversation acceptée par les parties. Lorsqu’une enquête s’impose, elle est menée par une personne impartiale, la personne visée est informée des allégations avec assez de détails pour y répondre, chacune peut se faire entendre, et l’issue est communiquée aux personnes qui y ont droit. Rien n’est décidé avant.',
      },
    },
    {
      type: 'clause',
      n: 9,
      heading: {
        en: 'No reprisal',
        fr: 'Aucune représaille',
      },
      text: {
        en: 'Nobody is penalised for raising a concern in good faith, for taking part in a process under this policy, or for refusing to take part in conduct it prohibits. Reprisal is itself a breach of this policy and is dealt with on its own footing. A report made in good faith that is not substantiated is not a false report, and is never treated as one.',
        fr: 'Nul n’est pénalisé pour avoir soulevé de bonne foi une préoccupation, participé à un processus prévu par la présente politique ou refusé de prendre part à un comportement qu’elle interdit. Les représailles constituent en soi un manquement à la présente politique et sont traitées de façon distincte. Un signalement fait de bonne foi mais non fondé n’est pas un faux signalement et n’est jamais traité comme tel.',
      },
    },
    {
      type: 'clause',
      n: 10,
      heading: {
        en: 'Support, training and review',
        fr: 'Soutien, formation et révision',
      },
      text: {
        en: 'Support available to anyone involved: {{support_resources}}. It is open to everyone involved, including the person a complaint is about. Everyone who works here is trained on this policy when they join and when it changes, and managers are trained on what to do when something is reported to them. This policy is reviewed {{review_cycle}}.',
        fr: 'Soutien offert aux personnes concernées : {{support_resources}}. Il est offert à toutes les personnes concernées, y compris celle visée par une plainte. Toute personne qui travaille ici reçoit une formation sur la présente politique à son arrivée et à chaque modification, et les gestionnaires sont formés sur la conduite à tenir lorsqu’un signalement leur est adressé. La présente politique est révisée {{review_cycle}}.',
      },
    },
    {
      type: 'clause',
      n: 11,
      when: {
        juris: 'QC',
      },
      heading: {
        en: 'What Québec requires this policy to add',
        fr: 'Ce que le Québec exige d’ajouter à la présente politique',
      },
      text: {
        en: 'The Act respecting labour standards prescribes content beyond what is above, and a policy without it is incomplete however well the rest reads. Add, before publishing: the methods used to identify and control the risks of psychological harassment, including harassment of a sexual nature; how work-related social activities are handled; the measures protecting anyone involved in a complaint; how a complaint is received, handled and followed up, and the training given to whoever handles one. Complaint records must also be kept for at least two years. This document does not supply those — it lists them so nothing is published missing one.',
        fr: 'La Loi sur les normes du travail prescrit du contenu au-delà de ce qui précède, et une politique qui en est dépourvue demeure incomplète, si bien rédigé soit le reste. Ajoutez, avant publication : les méthodes utilisées pour identifier et contrôler les risques de harcèlement psychologique, y compris à caractère sexuel ; le traitement réservé aux activités sociales liées au travail ; les mesures protégeant les personnes concernées par une plainte ; les modalités de réception, de traitement et de suivi d’une plainte, ainsi que la formation donnée aux personnes qui la traitent. Les documents relatifs à une plainte doivent en outre être conservés au moins deux ans. Le présent document ne fournit pas ces éléments — il les énumère pour que rien ne soit publié sans eux.',
      },
    },
    {
      type: 'clause',
      n: 11,
      when: {
        juris: 'FED',
      },
      heading: {
        en: 'What the federal Regulations require this policy to add',
        fr: 'Ce que le règlement fédéral exige d’ajouter à la présente politique',
      },
      text: {
        en: 'The Work Place Harassment and Violence Prevention Regulations prescribe the elements a prevention policy must contain, and this document does not supply all of them. Add, before publishing: the respective roles of the employer, the applicable partner, the designated recipient and the parties; a summary of the risk factors the workplace assessment identified and the measures taken; the emergency procedures where an occurrence poses an immediate danger; the training that will be provided; and how an employee can exercise the recourses available under the Canada Labour Code, Part II. Note also that the whole policy must be developed and reviewed jointly, which the next clause covers.',
        fr: 'Le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail prescrit les éléments que doit contenir une politique de prévention, et le présent document ne les fournit pas tous. Ajoutez, avant publication : les rôles respectifs de l’employeur, du partenaire concerné, du destinataire désigné et des parties ; un sommaire des facteurs de risque relevés par l’évaluation du lieu de travail et des mesures prises ; les procédures d’urgence lorsqu’un incident présente un danger immédiat ; la formation qui sera offerte ; et la façon dont un employé peut exercer les recours prévus au Code canadien du travail, Partie II. Notez également que l’ensemble de la politique doit être élaboré et révisé conjointement, ce que couvre la clause suivante.',
      },
    },
    {
      type: 'clause',
      n: 11,
      when: {
        juris: 'ON',
      },
      heading: {
        en: 'The review cycle the law requires here',
        fr: 'Le cycle de révision exigé par la loi ici',
      },
      text: {
        en: 'Whatever cycle is written above, the Occupational Health and Safety Act requires this programme to be reviewed at least annually. A longer interval does not replace that obligation, and a policy last reviewed beyond it is evidence in its own right.',
        fr: 'Quel que soit le cycle indiqué ci-dessus, la Loi sur la santé et la sécurité au travail exige que le présent programme soit révisé au moins une fois l’an. Un intervalle plus long ne remplace pas cette obligation, et une politique dont la dernière révision la dépasse constitue une preuve en soi.',
      },
    },
    {
      type: 'clause',
      n: 12,
      when: {
        juris: 'QC',
      },
      heading: {
        en: 'Keeping this current',
        fr: 'Garder la politique à jour',
      },
      text: {
        en: 'The Act respecting labour standards requires the policy to exist and to be made available to employees rather than fixing a review interval. Review it on the cycle above and whenever an incident, a legislative change or a change to the workplace makes it out of date — an unreviewed policy is hard to describe as a reasonable step to prevent harassment.',
        fr: 'La Loi sur les normes du travail exige que la politique existe et soit rendue disponible au personnel plutôt que de fixer un intervalle de révision. Révisez-la selon le cycle indiqué ci-dessus et chaque fois qu’un incident, une modification législative ou un changement au milieu de travail la rend désuète — une politique jamais révisée se qualifie difficilement de moyen raisonnable pour prévenir le harcèlement.',
      },
    },
    {
      type: 'clause',
      n: 12,
      when: {
        juris: 'FED',
      },
      heading: {
        en: 'The federal resolution process',
        fr: 'Le processus de règlement fédéral',
      },
      text: {
        en: 'This workplace is federally regulated. Where what is reported is a harassment or violence occurrence, the Work Place Harassment and Violence Prevention Regulations set the process and its timelines — negotiated resolution, conciliation where both parties agree to it, and an investigation the principal party may require — and they protect the identity of the parties and witnesses throughout. Those Regulations also require this policy to be reviewed at least every three years, and to be developed and reviewed jointly with the policy committee or health and safety representative. That is a step {{org}} must carry out — issuing this document does not perform it, and this policy should not be published until it has been.',
        fr: 'Le présent milieu de travail est de compétence fédérale. Lorsque le signalement porte sur un incident de harcèlement ou de violence, le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail fixe le processus et ses délais — résolution négociée, conciliation lorsque les deux parties y consentent, et enquête que la partie principale peut exiger — et il protège l’identité des parties et des témoins tout au long. Ce règlement exige également que la présente politique soit révisée au moins tous les trois ans et qu’elle soit élaborée et révisée conjointement avec le comité d’orientation ou le représentant en santé et sécurité. Il s’agit d’une étape que {{org}} doit accomplir — produire le présent document ne l’accomplit pas, et cette politique ne devrait pas être publiée tant que ce n’est pas fait.',
      },
    },
    {
      type: 'ack',
      text: {
        en: 'I acknowledge I have read and understood this document.',
        fr: 'Je reconnais avoir lu et compris le présent document.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'Generated from your answers as a starting point.',
        fr: 'Généré à partir de vos réponses comme point de départ.',
      },
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'This is a base policy, not a finished statutory one everywhere. In Ontario what is above addresses the harassment programme only — the Occupational Health and Safety Act separately requires a workplace violence programme, with its own risk assessment, controls for the risks it identifies, a procedure for summoning immediate assistance, and violence-specific reporting and investigation measures, none of which this document supplies; Québec and the federal regime each prescribe further content, which the clauses above list rather than supply. Do not publish this as your required policy until those elements have been added and — federally — until it has been developed jointly with the policy committee or health and safety representative.',
        fr: 'Il s’agit d’une politique de base, et non d’une politique légale achevée partout. En Ontario, ce qui précède ne vise que le programme contre le harcèlement — la Loi sur la santé et la sécurité au travail exige distinctement un programme de prévention de la violence, assorti de sa propre évaluation des risques, de mesures de contrôle des risques relevés, d’une procédure pour obtenir de l’aide immédiate ainsi que de mesures de signalement et d’enquête propres à la violence, qu’aucun élément du présent document ne fournit ; le Québec et le régime fédéral prescrivent chacun du contenu additionnel, que les clauses ci-dessus énumèrent sans le fournir. Ne publiez pas le présent texte comme votre politique obligatoire tant que ces éléments n’ont pas été ajoutés et, au fédéral, tant qu’elle n’a pas été élaborée conjointement avec le comité d’orientation ou le représentant en santé et sécurité.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'org',
  bodyHtmlEn:
    '<h1 class="center">Workplace Harassment, Discrimination and Violence Prevention Policy</h1>\n<p class="center"><strong>Effective:</strong> <span class="mf">{{policy_effective_date}}</span></p>\n<h2>Our commitment</h2>\n<p>Every person at <span class="mf">{{employer_legal_name}}</span> has the right to a workplace that is safe, respectful, and free from harassment, discrimination and violence. This is required by the Occupational Health and Safety Act, R.S.O. 1990, c. O.1, ss. 32.0.1–32.0.8 and the Human Rights Code, R.S.O. 1990, c. H.19.</p>\n<h2>1. Who this applies to</h2>\n<p>This policy applies to everyone who works for or with the Company, in any location where Company business is conducted, including remote workspaces and Company-related digital spaces.</p>\n<h2>2. What we don\'t allow</h2>\n<p>The Company does not tolerate harassment, sexual harassment, discrimination on any protected ground, workplace violence, or retaliation against anyone who reports in good faith.</p>\n<h2>3. How to report</h2>\n<p>Contact <span class="mf">{{hr_contact_name}}</span> at <span class="mf">{{hr_contact_email}}</span> or <span class="mf">{{hr_contact_phone}}</span>, or use the confidential reporting channel at <span class="mf">{{confidential_reporting_channel}}</span>, which accepts anonymous reports. If you are in immediate danger, contact emergency services (911) first.</p>\n<h2>4. How we investigate</h2>\n<p>Reports are acknowledged promptly (normally within <span class="mf">{{ack_period}}</span>), investigated fairly and impartially, and both parties are informed of the outcome, normally within <span class="mf">{{results_period}}</span> of the conclusion of the investigation.</p>\n<h2>5. Corrective actions</h2>\n<p>Where a complaint is substantiated, corrective action proportionate to the conduct will follow, consistent with <em>McKinley v. BC Tel</em>, 2001 SCC 38 where termination is considered.</p>\n<h2>6. Domestic violence</h2>\n<p>If you are experiencing domestic violence, we will take reasonable steps to keep you safe at work and help you access support, including statutory domestic-violence leave where applicable. Contact <span class="mf">{{hr_contact_name}}</span> confidentially.</p>\n<h2>7. Training and prevention</h2>\n<p>All employees and managers receive training on this policy at onboarding and annually thereafter. Workplace violence risks are assessed at least annually.</p>\n<h2>8. Third-party and client harassment</h2>\n<p>Harassment can come from clients, customers, contractors, or other third parties. Report it to your manager or <span class="mf">{{hr_contact_name}}</span>; you will not be penalized for refusing to tolerate abusive conduct.</p>\n<h2>9. Your statutory rights</h2>\n<p>Nothing in this policy limits your right to file a complaint with the human rights commission, the labour standards regulator, or the OHS regulator. For employees in Québec, a psychological harassment complaint may be filed with the CNESST within 2 years of the last incident.</p>\n<h2>10. Program review</h2>\n<p>This policy is reviewed at least annually and updated to reflect changes in the law. The current version is posted at <span class="mf">{{policy_url}}</span>.</p>',
}
