/* T04 — Employee handbook (Ontario).
   Replaced from T04_Employee_Handbook_ON_EN_polished.docx.md (an
   Ontario-only, English-source handoff). Ontario-only, matching T01/T02:
   Québec and federally regulated employers get their own
   jurisdiction-specific handbook templates rather than this one carrying
   conditional Ontario-only clauses. The source had no French version — all
   FR below is [FR self-authored] and must be reviewed alongside the EN. See
   docs/design-handoff-t04-employee-handbook-on/README.md. Hand-maintained;
   keep the FR in step with the EN on every edit. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT04: DocTemplate = {
  id: 'tpl_t04',
  tid: 'T04',
  key: 'employee_handbook',
  kind: 'handbook',
  category: 'policies',
  core: true,
  name: {
    en: 'Employee handbook (Ontario)',
    fr: 'Manuel de l’employé (Ontario)',
  },
  desc: {
    en: 'The consolidated Ontario guide to how the workplace runs — respect & human rights, hours & pay, leaves, remote work, monitoring, health & safety, confidentiality, privacy, conduct and how employment ends.',
    fr: 'Le guide ontarien regroupé du fonctionnement du milieu — respect et droits de la personne, heures et paie, congés, télétravail, surveillance, santé-sécurité, confidentialité, vie privée, conduite et fin d’emploi.',
  },
  jurisdictions: ['ON'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v6',
  versionNumber: 6,
  effectiveDate: '2026-01-10',
  updatedAt: '2026-08-14',
  estMinutes: 18,
  usageCount: 63,
  statutory: [
    {
      en: 'Employment Standards Act, 2000',
      fr: 'Loi de 2000 sur les normes d’emploi',
    },
    {
      en: 'Occupational Health and Safety Act (Ontario)',
      fr: 'Loi sur la santé et la sécurité au travail (Ontario)',
    },
    {
      en: 'Human Rights Code (Ontario)',
      fr: 'Code des droits de la personne (Ontario)',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Written for Ontario employers. Ontario has no general private-sector employee-privacy statute (unlike AB, BC or QC) — the Company applies reasonable safeguards and complies with PIPEDA where it applies.',
      fr: 'Rédigé pour les employeurs de l’Ontario. L’Ontario n’a pas de loi générale sur la protection de la vie privée des employés du secteur privé (contrairement à l’AB, la C.-B. ou le QC) — la Société applique des mesures de protection raisonnables et se conforme à la LPRPDE lorsqu’elle s’applique.',
    },
  },
  includes: [
    {
      en: 'Who we are & respect / human rights',
      fr: 'Qui nous sommes et respect / droits de la personne',
    },
    { en: 'How to raise a concern', fr: 'Comment soulever une préoccupation' },
    { en: 'Hours, pay & timekeeping', fr: 'Heures, paie et suivi du temps' },
    { en: 'Vacation & public holidays', fr: 'Vacances et jours fériés' },
    { en: 'Statutory leaves & sick time', fr: 'Congés prévus par la loi et congés de maladie' },
    { en: 'Remote work & disconnecting from work', fr: 'Télétravail et déconnexion' },
    { en: 'Electronic monitoring', fr: 'Surveillance électronique' },
    { en: 'Health, safety & wellbeing', fr: 'Santé, sécurité et bien-être' },
    {
      en: 'Harassment, discrimination & violence prevention',
      fr: 'Harcèlement, discrimination et violence',
    },
    {
      en: 'Confidentiality & information security',
      fr: 'Confidentialité et sécurité de l’information',
    },
    {
      en: 'Privacy of employee personal information',
      fr: 'Vie privée des renseignements personnels',
    },
    { en: 'Technology & responsible use', fr: 'Technologie et utilisation responsable' },
    { en: 'Conflicts of interest', fr: 'Conflits d’intérêts' },
    { en: 'Performance & discipline', fr: 'Rendement et discipline' },
    { en: 'Ending employment', fr: 'Fin de l’emploi' },
    { en: 'Protected reporting', fr: 'Signalement protégé' },
    { en: 'Acknowledgement', fr: 'Accusé de réception' },
  ],
  questions: [
    {
      id: 'handbook_version',
      section: { en: 'Basics', fr: 'Bases' },
      label: { en: 'Handbook version', fr: 'Version du manuel' },
      type: 'text',
      required: true,
    },
    {
      id: 'handbook_effective_date',
      section: { en: 'Basics', fr: 'Bases' },
      label: { en: 'Effective date', fr: 'Date d’entrée en vigueur' },
      type: 'date',
      required: true,
    },
    {
      id: 'company_mission',
      section: { en: 'Basics', fr: 'Bases' },
      label: { en: 'Company mission', fr: 'Mission de l’entreprise' },
      type: 'textarea',
      required: true,
    },
    {
      id: 'company_values',
      section: { en: 'Basics', fr: 'Bases' },
      label: { en: 'Company values', fr: 'Valeurs de l’entreprise' },
      type: 'textarea',
      required: true,
    },
    {
      id: 'hr_contact_name',
      section: { en: 'Support', fr: 'Soutien' },
      label: { en: 'HR contact name', fr: 'Nom de la personne-ressource RH' },
      type: 'text',
      required: true,
    },
    {
      id: 'hr_contact_email',
      section: { en: 'Support', fr: 'Soutien' },
      label: { en: 'HR contact email', fr: 'Courriel de la personne-ressource RH' },
      type: 'text',
      required: true,
    },
    {
      id: 'standard_hours_per_week',
      section: { en: 'Hours', fr: 'Heures' },
      label: { en: 'Standard hours per week', fr: 'Heures standard par semaine' },
      type: 'text',
      required: true,
    },
    {
      id: 'pay_frequency',
      section: { en: 'Hours', fr: 'Heures' },
      label: { en: 'Pay frequency', fr: 'Fréquence de paie' },
      type: 'text',
      required: true,
    },
    {
      id: 'designated_reporting_contact',
      section: { en: 'Support', fr: 'Soutien' },
      label: {
        en: 'Designated reporting contact (optional)',
        fr: 'Personne-ressource désignée pour les signalements (facultatif)',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'it_security_contact',
      section: { en: 'Support', fr: 'Soutien' },
      label: { en: 'IT / security contact', fr: 'Personne-ressource TI / sécurité' },
      type: 'text',
      required: true,
    },
    {
      id: 'privacy_contact_name',
      section: { en: 'Support', fr: 'Soutien' },
      label: { en: 'Privacy contact name', fr: 'Nom de la personne-ressource — vie privée' },
      type: 'text',
      required: true,
    },
    {
      id: 'privacy_contact_email',
      section: { en: 'Support', fr: 'Soutien' },
      label: { en: 'Privacy contact email', fr: 'Courriel de la personne-ressource — vie privée' },
      type: 'text',
      required: true,
    },
    {
      id: 'review_frequency',
      section: { en: 'Basics', fr: 'Bases' },
      label: {
        en: 'Performance review frequency (e.g. annually)',
        fr: 'Fréquence des évaluations de rendement (p. ex. annuellement)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'handbook_url',
      section: { en: 'Basics', fr: 'Bases' },
      label: { en: 'Current handbook URL', fr: 'URL de la version actuelle du manuel' },
      type: 'text',
      required: true,
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Employee Handbook',
        fr: 'Manuel de l’employé',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · Version {{handbook_version}} · Effective {{handbook_effective_date}} · Ontario',
        fr: '{{org}} · Version {{handbook_version}} · En vigueur le {{handbook_effective_date}} · Ontario',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Welcome to {{org}}. This handbook explains the everyday policies, expectations and resources that guide how we work together.\n\nThis handbook is not an employment contract and does not guarantee employment for any period. Your signed employment agreement, applicable statutes and the common law govern your legal rights and obligations. Where this handbook summarizes a law or policy, the statute, employment agreement or full policy controls if there is an inconsistency. The Company may update this handbook from time to time and will provide reasonable notice of material changes.',
        fr: 'Bienvenue chez {{org}}. Le présent manuel explique les politiques, attentes et ressources quotidiennes qui guident notre façon de travailler ensemble.\n\nCe manuel n’est pas un contrat de travail et ne garantit aucune durée d’emploi. Votre contrat de travail signé, les lois applicables et la common law régissent vos droits et obligations légaux. Lorsque ce manuel résume une loi ou une politique, la loi, le contrat de travail ou la politique complète prévaut en cas d’incompatibilité. La Société peut mettre à jour ce manuel de temps à autre et donnera un préavis raisonnable des changements importants.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Our mission is {{company_mission}}. The values that guide us are {{company_values}}. We expect everyone to act with integrity, accountability, respect and care in dealings with colleagues, customers, suppliers and the communities in which we operate.\n\nEvery employee has the right to a workplace free from discrimination, harassment and violence. In Ontario, protected human-rights grounds include the grounds set out in the Ontario Human Rights Code. If the Company is federally regulated or another statute applies, that statute may also apply.\n\nWe will reasonably accommodate needs related to protected grounds up to the point of undue hardship. Accommodation is an individualized process. Employees requesting accommodation should contact {{hr_contact_name}} at {{hr_contact_email}} and provide information reasonably necessary to assess and implement the accommodation.',
        fr: 'Notre mission est {{company_mission}}. Les valeurs qui nous guident sont {{company_values}}. Nous attendons de chacun qu’il agisse avec intégrité, responsabilité, respect et bienveillance envers les collègues, les clients, les fournisseurs et les communautés où nous exerçons nos activités.\n\nChaque employé a droit à un milieu de travail exempt de discrimination, de harcèlement et de violence. En Ontario, les motifs protégés en matière de droits de la personne comprennent ceux prévus au Code des droits de la personne de l’Ontario. Si la Société relève de la compétence fédérale ou qu’une autre loi s’applique, cette loi peut également s’appliquer.\n\nNous accommoderons raisonnablement les besoins liés aux motifs protégés jusqu’au point de contrainte excessive. L’accommodement est un processus individualisé. Les employés qui demandent un accommodement doivent communiquer avec {{hr_contact_name}} à {{hr_contact_email}} et fournir les renseignements raisonnablement nécessaires pour évaluer et mettre en œuvre l’accommodement.',
      },
      n: 1,
      heading: {
        en: 'Who we are, and respect & human rights',
        fr: 'Qui nous sommes, et respect et droits de la personne',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Speak up if you have a good-faith concern about safety, harassment, discrimination, violence, ethics, payroll, privacy, information security, legal compliance or how someone is being treated. You may contact your manager, HR, a senior leader or any reporting channel identified in the applicable policy.\n\nThe Company prohibits reprisal for raising a good-faith concern, participating in an investigation or exercising a statutory workplace right. Knowingly false, malicious or bad-faith reports may be addressed through discipline.',
        fr: 'Exprimez-vous si vous avez une préoccupation de bonne foi concernant la sécurité, le harcèlement, la discrimination, la violence, l’éthique, la paie, la vie privée, la sécurité de l’information, la conformité légale ou la façon dont une personne est traitée. Vous pouvez communiquer avec votre gestionnaire, les RH, un dirigeant ou tout autre canal de signalement prévu par la politique applicable.\n\nLa Société interdit toute mesure de représailles envers une personne qui soulève une préoccupation de bonne foi, participe à une enquête ou exerce un droit prévu par la loi en milieu de travail. Un signalement sciemment faux, malveillant ou de mauvaise foi peut faire l’objet de mesures disciplinaires.',
      },
      n: 2,
      heading: {
        en: 'How to raise a concern',
        fr: 'Comment soulever une préoccupation',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Our standard working week is {{standard_hours_per_week}} hours. You will be paid {{pay_frequency}} by direct deposit, less statutory deductions and authorized withholdings.\n\nRecord your working time accurately and submit records on time. Time worked must be recorded whether it was pre-approved or not. Managers may address unauthorized work under policy, but working time must still be reported accurately and paid where required by law.\n\nWhere Ontario overtime rules apply and no exemption or special rule applies, overtime is paid at 1.5 times the regular rate for hours worked above 44 in a work week.',
        fr: 'Notre semaine de travail standard est de {{standard_hours_per_week}} heures. Vous serez payé {{pay_frequency}} par dépôt direct, moins les retenues prévues par la loi et les retenues autorisées.\n\nEnregistrez votre temps de travail avec exactitude et soumettez vos relevés à temps. Le temps travaillé doit être enregistré, qu’il ait été approuvé au préalable ou non. Les gestionnaires peuvent traiter le travail non autorisé conformément à la politique, mais le temps travaillé doit tout de même être déclaré avec exactitude et payé lorsque la loi l’exige.\n\nLorsque les règles ontariennes sur les heures supplémentaires s’appliquent et qu’aucune exemption ou règle spéciale ne s’applique, les heures supplémentaires sont rémunérées à 1,5 fois le taux régulier pour les heures travaillées au-delà de 44 heures au cours d’une semaine de travail.',
      },
      n: 3,
      heading: {
        en: 'Working hours, pay and timekeeping',
        fr: 'Heures de travail, paie et suivi du temps',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Vacation entitlements are set by the ESA, your employment agreement and the Company’s vacation policy. Ontario minimum vacation entitlements are two weeks of vacation time and 4% vacation pay for employees with less than five years of employment, and three weeks and 6% vacation pay after five or more years of employment.\n\nVacation requests should be made with reasonable notice and are approved by managers based on operational needs and fair scheduling. Unused vacation, carryover and vacation payout are administered under the vacation policy and the ESA. Public holiday entitlements are provided in accordance with the ESA unless an exemption or special rule applies.',
        fr: 'Les droits aux vacances sont établis par la LNE, votre contrat de travail et la politique de vacances de la Société. Les droits minimaux aux vacances en Ontario sont de deux semaines de vacances et une indemnité de vacances de 4 % pour les employés ayant moins de cinq années d’emploi, et de trois semaines et 6 % après cinq années d’emploi ou plus.\n\nLes demandes de vacances doivent être faites avec un préavis raisonnable et sont approuvées par les gestionnaires en fonction des besoins opérationnels et d’un horaire équitable. Les vacances non utilisées, leur report et leur paiement sont administrés en vertu de la politique de vacances et de la LNE. Les droits aux jours fériés sont accordés conformément à la LNE, sauf si une exemption ou une règle spéciale s’applique.',
      },
      n: 4,
      heading: {
        en: 'Vacation and public holidays',
        fr: 'Vacances et jours fériés',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Employees are entitled to statutory leaves under the ESA where eligibility requirements are met. These may include pregnancy, parental, family caregiver, family responsibility, sick, bereavement, domestic or sexual violence, reservist, organ donor, family medical, critical illness, child death, crime-related child disappearance, declared emergency, infectious disease emergency, job seeking and long-term illness leave.\n\nOntario sick leave under the ESA is an unpaid, job-protected leave of up to three days per calendar year after at least two consecutive weeks of employment. The Company may provide paid sick days or other paid time off where stated in the applicable policy or employment agreement.\n\nOntario long-term illness leave is an unpaid, job-protected leave of up to 27 weeks in a 52-week period for eligible employees with a serious medical condition supported by the required certificate. HR will administer medical documentation on a need-to-know and privacy-protective basis.',
        fr: 'Les employés ont droit aux congés prévus par la LNE lorsque les conditions d’admissibilité sont satisfaites. Ceux-ci peuvent comprendre les congés de maternité, parental, familial pour les aidants naturels, pour obligations familiales, de maladie, de deuil, en cas de violence familiale ou sexuelle, de réserviste, pour don d’organe, familial pour raison médicale, en cas de maladie grave, en cas de décès d’un enfant, en cas de disparition d’un enfant dans des circonstances criminelles, en cas d’urgence déclarée, en cas d’urgence liée à une maladie infectieuse, pour recherche d’emploi et de longue durée pour maladie.\n\nLe congé de maladie ontarien prévu par la LNE est un congé non payé et protégé d’une durée maximale de trois jours par année civile, après au moins deux semaines consécutives d’emploi. La Société peut offrir des jours de maladie payés ou d’autres congés payés lorsque cela est prévu par la politique applicable ou le contrat de travail.\n\nLe congé ontarien pour maladie de longue durée est un congé non payé et protégé d’une durée maximale de 27 semaines sur une période de 52 semaines pour les employés admissibles atteints d’un problème de santé grave, appuyé par le certificat requis. Les RH administreront la documentation médicale sur la base du besoin de savoir et dans le respect de la vie privée.',
      },
      n: 5,
      heading: {
        en: 'Statutory leaves and sick time',
        fr: 'Congés prévus par la loi et congés de maladie',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Where a role allows it, the Company may support flexible or remote work arrangements. These arrangements are not automatic and must be approved under the Remote Work Policy.\n\nIf the Company is required under the ESA to maintain a written disconnecting-from-work policy, that policy will set expectations about work-related communications outside scheduled working hours. The ESA policy requirement does not, by itself, create a new statutory right to disconnect; employee rights not to perform work are established through other ESA rules and any greater policy commitments the Company expressly provides.',
        fr: 'Lorsqu’un poste le permet, la Société peut soutenir des modalités de travail flexibles ou à distance. Ces modalités ne sont pas automatiques et doivent être approuvées conformément à la politique de télétravail.\n\nSi la Société est tenue de maintenir une politique écrite sur la déconnexion du travail en vertu de la LNE, cette politique établira les attentes relatives aux communications liées au travail en dehors des heures de travail prévues. L’exigence de la LNE relative à cette politique ne crée pas, en elle-même, un nouveau droit légal à la déconnexion; les droits de l’employé de ne pas effectuer de travail découlent d’autres règles de la LNE et de tout engagement supérieur que la Société prend expressément.',
      },
      n: 6,
      heading: {
        en: 'Flexibility, remote work and disconnecting from work',
        fr: 'Flexibilité, télétravail et déconnexion',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'If the Company is required under the ESA to maintain a written electronic monitoring policy, the policy will describe whether employees are electronically monitored, how and in what circumstances monitoring occurs, and the purposes for which information obtained through monitoring may be used.\n\nThe electronic monitoring policy is a transparency document. It does not authorize monitoring that would otherwise be unlawful and does not reduce any privacy, employment or human-rights obligations that apply to the Company.',
        fr: 'Si la Société est tenue de maintenir une politique écrite sur la surveillance électronique en vertu de la LNE, cette politique décrira si les employés sont surveillés électroniquement, comment et dans quelles circonstances la surveillance a lieu, et les fins pour lesquelles les renseignements obtenus par la surveillance peuvent être utilisés.\n\nLa politique de surveillance électronique est un document de transparence. Elle n’autorise pas une surveillance qui serait autrement illégale et ne réduit aucune obligation en matière de vie privée, d’emploi ou de droits de la personne applicable à la Société.',
      },
      n: 7,
      heading: {
        en: 'Electronic monitoring',
        fr: 'Surveillance électronique',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'In Ontario, occupational health and safety is governed by the Occupational Health and Safety Act. Employees have health-and-safety rights and responsibilities, including rights to know about hazards, participate in health-and-safety processes and refuse unsafe work where the statutory requirements are met.\n\nThe Company will maintain required workplace violence and workplace harassment policies and programs. Employees must follow safety procedures, report hazards and incidents promptly, and cooperate with investigations and corrective measures.\n\nMental health and wellbeing matter. Where offered, the Employee and Family Assistance Program provides confidential support in accordance with its terms. Employees may also request accommodation through HR.',
        fr: 'En Ontario, la santé et la sécurité au travail sont régies par la Loi sur la santé et la sécurité au travail. Les employés ont des droits et des responsabilités en matière de santé et de sécurité, notamment le droit de connaître les dangers, de participer aux processus de santé et sécurité et de refuser un travail dangereux lorsque les conditions prévues par la loi sont satisfaites.\n\nLa Société maintiendra les politiques et programmes requis en matière de violence et de harcèlement en milieu de travail. Les employés doivent suivre les procédures de sécurité, signaler rapidement les dangers et incidents, et coopérer aux enquêtes et aux mesures correctives.\n\nLa santé mentale et le bien-être sont importants. Lorsqu’il est offert, le programme d’aide aux employés et à leur famille fournit un soutien confidentiel conformément à ses modalités. Les employés peuvent également demander un accommodement auprès des RH.',
      },
      n: 8,
      heading: {
        en: 'Health, safety and wellbeing',
        fr: 'Santé, sécurité et bien-être',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Workplace Harassment, Discrimination and Violence Prevention Policy explains prohibited conduct, reporting options, investigation steps, confidentiality protections, anti-reprisal protections and potential outcomes. Reports may be made to a manager, HR, {{designated_reporting_contact}} or an external investigator where appropriate.\n\nThe Company will investigate workplace harassment complaints and incidents in a manner appropriate in the circumstances. Information will be shared only as necessary to investigate, take corrective action, protect health and safety, or as otherwise required by law.',
        fr: 'La politique de prévention du harcèlement, de la discrimination et de la violence en milieu de travail explique les comportements interdits, les options de signalement, les étapes d’enquête, les protections en matière de confidentialité, les protections contre les représailles et les résultats possibles. Les signalements peuvent être faits à un gestionnaire, aux RH, à {{designated_reporting_contact}} ou à un enquêteur externe, le cas échéant.\n\nLa Société enquêtera sur les plaintes et incidents de harcèlement en milieu de travail d’une manière appropriée aux circonstances. Les renseignements ne seront communiqués que dans la mesure nécessaire pour enquêter, prendre des mesures correctives, protéger la santé et la sécurité, ou tel qu’autrement exigé par la loi.',
      },
      n: 9,
      heading: {
        en: 'Harassment, discrimination and violence prevention',
        fr: 'Harcèlement, discrimination et prévention de la violence',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Employees must protect confidential information belonging to the Company, customers, colleagues, suppliers and business partners. Confidential information must be used only for legitimate work purposes and disclosed only to authorized persons with a business need to know.\n\nReport suspected loss, theft, unauthorized access, disclosure, phishing, malware or other security incidents immediately to {{it_security_contact}} and {{privacy_contact_name}}. Good-faith reporting is protected from reprisal.',
        fr: 'Les employés doivent protéger les renseignements confidentiels appartenant à la Société, à ses clients, à ses collègues, à ses fournisseurs et à ses partenaires d’affaires. Les renseignements confidentiels ne doivent être utilisés qu’à des fins professionnelles légitimes et communiqués uniquement aux personnes autorisées ayant un besoin professionnel de les connaître.\n\nSignalez immédiatement toute perte, vol, accès non autorisé, divulgation, hameçonnage, logiciel malveillant ou autre incident de sécurité soupçonné à {{it_security_contact}} et à {{privacy_contact_name}}. Un signalement de bonne foi est protégé contre les représailles.',
      },
      n: 10,
      heading: {
        en: 'Confidentiality and information security',
        fr: 'Confidentialité et sécurité de l’information',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Company collects, uses, discloses, retains and safeguards employee personal information only for reasonable employment-related purposes and on a need-to-know basis, such as payroll, benefits, performance management, scheduling, workplace safety, accommodation, legal compliance and security.\n\nDepending on the nature of the Company’s operations and the information involved, PIPEDA may apply to commercial activities and to employee personal information of federally regulated businesses. Ontario does not have a general private-sector employee privacy statute equivalent to Alberta, British Columbia or Quebec, but the Company will apply reasonable privacy safeguards and comply with all laws that apply.\n\nContact {{privacy_contact_name}} at {{privacy_contact_email}} to request access to, or correction of, your employee personal information, subject to legal limits and verification requirements.',
        fr: 'La Société recueille, utilise, communique, conserve et protège les renseignements personnels des employés uniquement à des fins raisonnables liées à l’emploi et sur la base du besoin de savoir, notamment pour la paie, les avantages sociaux, la gestion du rendement, l’établissement des horaires, la sécurité au travail, l’accommodement, la conformité légale et la sécurité.\n\nSelon la nature des activités de la Société et des renseignements en cause, la LPRPDE peut s’appliquer aux activités commerciales et aux renseignements personnels des employés des entreprises sous réglementation fédérale. L’Ontario n’a pas de loi générale sur la protection de la vie privée des employés du secteur privé équivalente à celle de l’Alberta, de la Colombie-Britannique ou du Québec, mais la Société appliquera des mesures de protection raisonnables et se conformera à toutes les lois applicables.\n\nCommuniquez avec {{privacy_contact_name}} à {{privacy_contact_email}} pour demander l’accès à vos renseignements personnels d’employé ou leur correction, sous réserve des limites légales et des exigences de vérification.',
      },
      n: 11,
      heading: {
        en: 'Privacy of employee personal information',
        fr: 'Vie privée des renseignements personnels de l’employé',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Company systems, devices, accounts, email, messaging tools and data are provided for legitimate work purposes. Reasonable incidental personal use may be permitted if it does not interfere with work, create risk, consume excessive resources or breach policy.\n\n* Do not share passwords or authentication codes.\n* Do not install unapproved software or browser extensions.\n* Do not bypass security controls.\n* Use approved storage, collaboration and communication tools for Company information.\n* Report suspected compromise immediately.',
        fr: 'Les systèmes, appareils, comptes, courriels, outils de messagerie et données de la Société sont fournis à des fins professionnelles légitimes. Une utilisation personnelle accessoire raisonnable peut être permise si elle ne nuit pas au travail, ne crée pas de risque, ne consomme pas des ressources excessives et ne contrevient pas à la politique.\n\n* Ne partagez pas vos mots de passe ni vos codes d’authentification.\n* N’installez pas de logiciels ou d’extensions de navigateur non approuvés.\n* Ne contournez pas les contrôles de sécurité.\n* Utilisez les outils approuvés de stockage, de collaboration et de communication pour les renseignements de la Société.\n* Signalez immédiatement toute compromission soupçonnée.',
      },
      n: 12,
      heading: {
        en: 'Technology and responsible use',
        fr: 'Technologie et utilisation responsable',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Employees must act in the Company’s best interests while performing their roles. Disclose any actual, potential or perceived conflict of interest to your manager or HR as soon as possible.\n\nPotential conflicts may include work for a competitor, supplier or customer; a side business in the same field; gifts or benefits that could influence judgment; financial interests; or close personal relationships affecting hiring, supervision, purchasing or business decisions. Disclosure allows the Company to assess and manage the issue fairly.',
        fr: 'Les employés doivent agir dans le meilleur intérêt de la Société dans l’exercice de leurs fonctions. Divulguez le plus rapidement possible à votre gestionnaire ou aux RH tout conflit d’intérêts réel, potentiel ou perçu.\n\nLes conflits potentiels peuvent inclure le travail pour un concurrent, un fournisseur ou un client; une entreprise secondaire dans le même domaine; des cadeaux ou avantages pouvant influencer le jugement; des intérêts financiers; ou des relations personnelles étroites influant sur l’embauche, la supervision, les achats ou les décisions d’affaires. La divulgation permet à la Société d’évaluer et de gérer la question équitablement.',
      },
      n: 13,
      heading: {
        en: 'Conflicts of interest and outside activities',
        fr: 'Conflits d’intérêts et activités extérieures',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Managers are expected to provide timely, specific and respectful feedback. Employees will receive structured performance discussions at least {{review_frequency}}, subject to role and business needs.\n\nWhere performance or conduct concerns arise, the Company may use coaching, performance improvement plans, progressive discipline or immediate discipline depending on the circumstances, seriousness of the concern and applicable law. Serious misconduct may result in discipline up to and including termination of employment.',
        fr: 'Les gestionnaires doivent fournir une rétroaction opportune, précise et respectueuse. Les employés recevront des discussions structurées sur le rendement au moins {{review_frequency}}, selon le poste et les besoins de l’entreprise.\n\nEn cas de préoccupation liée au rendement ou à la conduite, la Société peut recourir au mentorat, à un plan d’amélioration du rendement, à des mesures disciplinaires progressives ou à des mesures disciplinaires immédiates, selon les circonstances, la gravité de la préoccupation et la loi applicable. Une inconduite grave peut entraîner des mesures disciplinaires, pouvant aller jusqu’au congédiement.',
      },
      n: 14,
      heading: {
        en: 'Performance, growth and discipline',
        fr: 'Rendement, développement et discipline',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Your employment agreement governs resignation, temporary layoff, termination, statutory entitlements and any contractual entitlements at the end of employment. The Company will comply with the ESA and applicable law.\n\nEmployees who resign should provide the notice required by their employment agreement where possible. The Company may waive some or all of the resignation notice period, subject to the agreement and applicable law.',
        fr: 'Votre contrat de travail régit la démission, la mise à pied temporaire, la cessation d’emploi, les droits prévus par la loi et tout droit contractuel à la fin de l’emploi. La Société se conformera à la LNE et à la loi applicable.\n\nLes employés qui démissionnent doivent donner le préavis exigé par leur contrat de travail, dans la mesure du possible. La Société peut renoncer à tout ou partie du délai de préavis de démission, sous réserve du contrat et de la loi applicable.',
      },
      n: 15,
      heading: {
        en: 'Ending employment',
        fr: 'Fin de l’emploi',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Employees are encouraged to report suspected fraud, safety risks, harassment, discrimination, privacy incidents, information-security incidents, payroll concerns, regulatory breaches or other serious concerns through the appropriate reporting channel.\n\nThe Company will protect confidentiality as far as practicable and lawful. Absolute confidentiality cannot be guaranteed because the Company may need to investigate, take corrective action, protect people, comply with law or disclose information to regulators or advisors.',
        fr: 'Les employés sont encouragés à signaler tout soupçon de fraude, risque pour la sécurité, harcèlement, discrimination, incident lié à la vie privée, incident de sécurité de l’information, préoccupation relative à la paie, manquement réglementaire ou autre préoccupation grave par le canal de signalement approprié.\n\nLa Société protégera la confidentialité dans la mesure du possible et permise par la loi. La confidentialité absolue ne peut être garantie, car la Société peut avoir besoin d’enquêter, de prendre des mesures correctives, de protéger les personnes, de se conformer à la loi ou de communiquer des renseignements à des organismes de réglementation ou à des conseillers.',
      },
      n: 16,
      heading: {
        en: 'Protected reporting and cooperation',
        fr: 'Signalement protégé et coopération',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This handbook is reviewed at least annually and updated as needed to reflect legal changes, business changes and lessons learned. The most current version is available at {{handbook_url}}. Material changes will be communicated with reasonable notice.',
        fr: 'Le présent manuel est révisé au moins annuellement et mis à jour selon les besoins pour tenir compte des changements législatifs, des changements d’affaires et des leçons apprises. La version la plus à jour est disponible à {{handbook_url}}. Les changements importants seront communiqués avec un préavis raisonnable.',
      },
      n: 17,
      heading: {
        en: 'How this handbook is maintained',
        fr: 'Comment ce manuel est maintenu',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'By signing the handbook acknowledgement or continuing employment after receiving this handbook, you acknowledge that you have received access to the handbook, have had the opportunity to read it, and agree to follow Company policies and workplace expectations. This acknowledgement does not convert the handbook into an employment contract.',
        fr: 'En signant l’accusé de réception du manuel ou en poursuivant votre emploi après avoir reçu ce manuel, vous reconnaissez avoir eu accès au manuel, avoir eu l’occasion de le lire, et vous vous engagez à respecter les politiques de la Société et les attentes en milieu de travail. Cet accusé de réception ne transforme pas le manuel en contrat de travail.',
      },
      n: 18,
      heading: {
        en: 'Acknowledgement',
        fr: 'Accusé de réception',
      },
    },
    {
      type: 'ack',
      text: {
        en: 'I acknowledge I have received, had the opportunity to read, and agree to follow this handbook and Company policies.',
        fr: 'Je reconnais avoir reçu ce manuel et les politiques de la Société, avoir eu l’occasion de les lire, et je m’engage à les respecter.',
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employer',
          fr: 'Employeur',
        },
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
      ],
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
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'org',
}
