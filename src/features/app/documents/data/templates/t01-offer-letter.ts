/* T01 — Offer of employment letter (Ontario).
   Replaced from T01_Offer_Letter_ON_Bilingual_EN_FR_polished.md (bilingual
   Ontario offer letter handoff). Ontario-only: QC and FED get their own
   jurisdiction-specific offer-letter templates (see T09 for QC) rather than
   this one carrying conditional Ontario-only clauses. Hand-maintained; keep
   the FR in step with the EN on every edit. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT01: DocTemplate = {
  id: 'tpl_t01',
  tid: 'T01',
  key: 'offer_letter',
  kind: 'letter',
  category: 'hiring',
  core: true,
  name: {
    en: 'Offer of employment letter (Ontario)',
    fr: 'Lettre d’offre d’emploi (Ontario)',
  },
  desc: {
    en: 'A bilingual Ontario offer of employment: role, pay, hours, benefits, vacation, probation, conditions, governing terms and acceptance.',
    fr: 'Une offre d’emploi bilingue de l’Ontario : poste, rémunération, heures, avantages, vacances, probation, conditions, dispositions applicables et acceptation.',
  },
  jurisdictions: ['ON'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v5',
  versionNumber: 5,
  effectiveDate: '2026-05-01',
  updatedAt: '2026-08-14',
  estMinutes: 12,
  usageCount: 128,
  statutory: [
    {
      en: 'Employment Standards Act, 2000 — minimum standards',
      fr: 'Loi de 2000 sur les normes d’emploi — normes minimales',
    },
    {
      en: 'Human Rights Code — non-discrimination in hiring',
      fr: 'Code des droits de la personne — non-discrimination à l’embauche',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Written for Ontario employers. ESA, 2000 minimum standards cannot be contracted out of; a non-compliant termination clause can void the clause entirely (Waksdale v. Swegon, 2020 ONCA 391).',
      fr: 'Rédigé pour les employeurs de l’Ontario. Les normes minimales de la LNE de 2000 ne peuvent être écartées par contrat ; une clause de cessation non conforme peut être invalidée (Waksdale c. Swegon, 2020 ONCA 391).',
    },
  },
  includes: [
    { en: 'Employer information', fr: 'Renseignements sur l’employeur' },
    { en: 'Role, start date & reporting', fr: 'Poste, date de début et supervision' },
    {
      en: 'Employment type, hours & overtime',
      fr: 'Type d’emploi, heures et heures supplémentaires',
    },
    { en: 'Compensation & pay administration', fr: 'Rémunération et administration de la paie' },
    { en: 'Variable compensation', fr: 'Rémunération variable' },
    { en: 'Benefits & wellness', fr: 'Avantages sociaux et mieux-être' },
    {
      en: 'Vacation, vacation pay & public holidays',
      fr: 'Vacances, indemnité de vacances et jours fériés',
    },
    {
      en: 'Statutory leaves & required workplace policies',
      fr: 'Congés prévus par la loi et politiques obligatoires',
    },
    { en: 'Probationary period', fr: 'Période probatoire' },
    {
      en: 'Confidentiality & intellectual property',
      fr: 'Confidentialité et propriété intellectuelle',
    },
    { en: 'Ending employment', fr: 'Fin de l’emploi' },
    { en: 'Temporary layoff', fr: 'Mise à pied temporaire' },
    { en: 'Conditions of this offer', fr: 'Conditions de la présente offre' },
    { en: 'Governing documents & law', fr: 'Documents applicables et droit applicable' },
    { en: 'Acceptance & Schedule A', fr: 'Acceptation et annexe A' },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Employee',
        fr: 'Employé(e)',
      },
      label: {
        en: 'Employee full name',
        fr: 'Nom complet de la personne salariée',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'employee_first_name',
      section: {
        en: 'Employee',
        fr: 'Employé(e)',
      },
      label: {
        en: 'Employee first name',
        fr: 'Prénom de la personne salariée',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'employee_address_line_1',
      section: {
        en: 'Employee',
        fr: 'Employé(e)',
      },
      label: {
        en: 'Address line 1',
        fr: 'Adresse (ligne 1)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'employee_address_line_2',
      section: {
        en: 'Employee',
        fr: 'Employé(e)',
      },
      label: {
        en: 'Address line 2 (optional)',
        fr: 'Adresse (ligne 2) — facultatif',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'position_title',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Position title',
        fr: 'Titre du poste',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'department',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Department / team',
        fr: 'Service / équipe',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'manager_name',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Manager name',
        fr: 'Nom du gestionnaire',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'manager_title',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Manager title',
        fr: 'Titre du gestionnaire',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'employment_type',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Employment type',
        fr: 'Type d’emploi',
      },
      type: 'radio',
      required: true,
      options: [
        {
          value: 'full-time',
          label: {
            en: 'Full-time',
            fr: 'Temps plein',
          },
        },
        {
          value: 'part-time',
          label: {
            en: 'Part-time',
            fr: 'Temps partiel',
          },
        },
        {
          value: 'contract',
          label: {
            en: 'Contract',
            fr: 'Contractuel',
          },
        },
      ],
    },
    {
      id: 'start_date',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Start date',
        fr: 'Date d’entrée en fonction',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'work_location',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Primary work location',
        fr: 'Lieu de travail principal',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'offer_expiry_date',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Offer expiry date',
        fr: 'Date d’expiration de l’offre',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'scheduled_hours_per_week',
      section: {
        en: 'Hours',
        fr: 'Heures',
      },
      label: {
        en: 'Scheduled hours per week',
        fr: 'Heures de travail prévues par semaine',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'regular_hours',
      section: {
        en: 'Hours',
        fr: 'Heures',
      },
      label: {
        en: 'Regular hours (e.g. 9:00 a.m. – 5:00 p.m.)',
        fr: 'Heures régulières (p. ex. 9 h à 17 h)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'annual_base_salary',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Annual base salary (CAD)',
        fr: 'Salaire de base annuel (CAD)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'pay_period',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Pay period',
        fr: 'Période de paie',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'pay_day',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Regular pay day',
        fr: 'Jour de paie régulier',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'pay_frequency',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Pay frequency',
        fr: 'Fréquence de paie',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'variable_comp_plan_name',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Variable compensation plan name',
        fr: 'Nom du régime de rémunération variable',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'variable_comp_target',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Variable compensation target',
        fr: 'Cible de rémunération variable',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'benefits_plan_name',
      section: {
        en: 'Benefits',
        fr: 'Avantages sociaux',
      },
      label: {
        en: 'Benefits plan name',
        fr: 'Nom du régime d’avantages sociaux',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'benefits_start_date',
      section: {
        en: 'Benefits',
        fr: 'Avantages sociaux',
      },
      label: {
        en: 'Benefits start date',
        fr: 'Date d’entrée en vigueur des avantages sociaux',
      },
      type: 'date',
      required: false,
    },
    {
      id: 'vacation_weeks',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Vacation weeks per year',
        fr: 'Semaines de vacances par année',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: '2',
          label: {
            en: '2 weeks',
            fr: '2 semaines',
          },
        },
        {
          value: '3',
          label: {
            en: '3 weeks',
            fr: '3 semaines',
          },
        },
        {
          value: '4',
          label: {
            en: '4 weeks',
            fr: '4 semaines',
          },
        },
        {
          value: '5',
          label: {
            en: '5 weeks',
            fr: '5 semaines',
          },
        },
      ],
    },
    {
      id: 'probation_length',
      section: {
        en: 'Terms',
        fr: 'Conditions',
      },
      label: {
        en: 'Probationary period length',
        fr: 'Durée de la période probatoire',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'none',
          label: {
            en: 'None',
            fr: 'Aucune',
          },
        },
        {
          value: '3 months',
          label: {
            en: '3 months',
            fr: '3 mois',
          },
        },
        {
          value: '6 months',
          label: {
            en: '6 months',
            fr: '6 mois',
          },
        },
      ],
    },
    {
      id: 'employer_business_name',
      section: {
        en: 'Employer',
        fr: 'Employeur',
      },
      label: {
        en: 'Employer operating / business name',
        fr: 'Nom commercial / d’exploitation',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'employer_address',
      section: {
        en: 'Employer',
        fr: 'Employeur',
      },
      label: {
        en: 'Employer address',
        fr: 'Adresse de l’employeur',
      },
      type: 'textarea',
      required: true,
    },
    {
      id: 'employer_phone',
      section: {
        en: 'Employer',
        fr: 'Employeur',
      },
      label: {
        en: 'Employer telephone',
        fr: 'Téléphone de l’employeur',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'hr_contact_name',
      section: {
        en: 'Employer',
        fr: 'Employeur',
      },
      label: {
        en: 'HR contact name',
        fr: 'Nom de la personne-ressource RH',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'hr_contact_email',
      section: {
        en: 'Employer',
        fr: 'Employeur',
      },
      label: {
        en: 'HR contact email',
        fr: 'Courriel de la personne-ressource RH',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'job_responsibilities',
      section: {
        en: 'Schedule A',
        fr: 'Annexe A',
      },
      label: {
        en: 'Key responsibilities',
        fr: 'Responsabilités principales',
      },
      type: 'textarea',
      required: true,
    },
    {
      id: 'required_qualifications',
      section: {
        en: 'Schedule A',
        fr: 'Annexe A',
      },
      label: {
        en: 'Required qualifications',
        fr: 'Qualifications requises',
      },
      type: 'textarea',
      required: true,
    },
    {
      id: 'role_requirements',
      section: {
        en: 'Schedule A',
        fr: 'Annexe A',
      },
      label: {
        en: 'Physical, travel or other role requirements',
        fr: 'Exigences physiques, déplacements ou autres',
      },
      type: 'textarea',
      required: false,
    },
    {
      id: 'employer_signer_name',
      section: {
        en: 'Signatures',
        fr: 'Signatures',
      },
      label: {
        en: 'Employer signer name',
        fr: 'Nom du signataire employeur',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'employer_signer_title',
      section: {
        en: 'Signatures',
        fr: 'Signatures',
      },
      label: {
        en: 'Employer signer title',
        fr: 'Titre du signataire employeur',
      },
      type: 'text',
      required: true,
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Offer of Employment',
        fr: 'Offre d’emploi',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · Ontario',
        fr: '{{org}} · {{today}} · Ontario',
      },
    },
    {
      type: 'para',
      text: {
        en: '{{today}}\n\n{{employee_name}}\n\n{{employee_address_line_1}}\n\n{{employee_address_line_2}}\n\n**Re:** Offer of Employment - {{position_title}}\n\nDear {{employee_first_name}},\n\nWe are pleased to offer you employment with {{org}} (the "Company") in the position of {{position_title}}. This letter summarizes the individualized business terms of the offer. The attached Employment Agreement contains the complete legal terms of your employment and must be signed before employment begins.\n\nThis bilingual document is provided in English and French. Both versions are intended to be consistent. If there is any discrepancy between the English and French versions, the English version prevails to the extent permitted by applicable law, unless the Company expressly agrees otherwise in writing.',
        fr: '{{today}}\n\n{{employee_name}}\n\n{{employee_address_line_1}}\n\n{{employee_address_line_2}}\n\n**Objet :** Offre d\'emploi - {{position_title}}\n\nBonjour {{employee_first_name}},\n\nNous avons le plaisir de vous offrir un emploi auprès de {{org}} (la "Société") au poste de {{position_title}}. La présente lettre résume les conditions d\'affaires propres à cette offre. Le contrat de travail ci-joint contient les conditions juridiques complètes de votre emploi et doit être signé avant le début de votre emploi.\n\nLe présent document bilingue est fourni en anglais et en français. Les deux versions sont censées être cohérentes. En cas de divergence entre les versions anglaise et française, la version anglaise prévaut dans la mesure permise par la loi applicable, sauf accord écrit contraire exprès de la Société.',
      },
    },
    {
      type: 'clause',
      text: {
        en: "The following information is included to support Ontario employment standards requirements where applicable, including the written employment information required for employers with 25 or more employees on the employee's first day of work.\nLegal name: {{org}}\nOperating/business name: {{employer_business_name}}\nEmployer address: {{employer_address}}\nEmployer telephone: {{employer_phone}}\nEmployer contact: {{hr_contact_name}} - {{hr_contact_email}}",
        fr: "Les renseignements suivants sont inclus afin d'appuyer les exigences ontariennes en matière de normes d'emploi, le cas échéant, y compris les renseignements écrits sur l'emploi exigés des employeurs qui comptent 25 employés ou plus le premier jour de travail de l'employé.\nDénomination sociale: {{org}}\nNom commercial: {{employer_business_name}}\nAdresse de l'employeur: {{employer_address}}\nTéléphone de l'employeur: {{employer_phone}}\nPersonne-ressource: {{hr_contact_name}} - {{hr_contact_email}}",
      },
      n: 1,
      heading: {
        en: 'Employer information',
        fr: "Renseignements sur l'employeur",
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Your position will be {{position_title}}, reporting to {{manager_name}}, {{manager_title}}. Your employment will begin on the following start date: {{start_date}}. Your primary place of work will be {{work_location}}, subject to operational needs, remote-work approvals and applicable law.\nA description of your key responsibilities is attached as Schedule A. Your role may reasonably evolve over time, and the Company may assign related duties that are consistent with your position, qualifications and skill set.',
        fr: "Votre poste sera {{position_title}}, sous la supervision de {{manager_name}}, {{manager_title}}. Votre emploi débutera à la date d'entrée en fonction suivante : {{start_date}}. Votre lieu principal de travail sera {{work_location}}, sous réserve des besoins opérationnels, des autorisations de travail à distance et de la loi applicable.\nUne description de vos principales responsabilités est jointe à l'annexe A. Votre rôle peut raisonnablement évoluer au fil du temps, et la Société peut vous attribuer des tâches connexes compatibles avec votre poste, vos qualifications et vos compétences.",
      },
      n: 2,
      heading: {
        en: 'Role, start date and reporting',
        fr: 'Poste, date de début et supervision',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This is a {{employment_type}} position. Your initial anticipated hours of work are {{scheduled_hours_per_week}} hours per week, generally {{regular_hours}}.\nWhere Ontario overtime rules apply and no exemption or special rule applies, overtime is paid at 1.5 times the regular rate for hours worked above 44 in a work week. Overtime must be approved in advance. Failure to obtain prior approval may result in disciplinary action, up to and including termination. If overtime is worked without prior approval, you must still report it accurately so that it can be addressed and paid in accordance with the Employment Standards Act, 2000 (Ontario) (the "ESA") and Company policy.',
        fr: "Il s'agit d'un poste {{employment_type}}. Vos heures de travail initialement prévues sont de {{scheduled_hours_per_week}} heures par semaine, généralement {{regular_hours}}.\nLorsque les règles ontariennes sur les heures supplémentaires s'appliquent et qu'aucune exemption ou règle spéciale ne s'applique, les heures supplémentaires sont rémunérées à 1,5 fois le taux régulier pour les heures travaillées au-delà de 44 heures au cours d'une semaine de travail. Les heures supplémentaires doivent être approuvées à l'avance. À défaut d'obtenir une approbation préalable peut entraîner des mesures disciplinaires, pouvant aller jusqu'au licenciement. Si des heures supplémentaires sont travaillées sans approbation préalable, vous devez tout de même les déclarer avec exactitude afin qu'elles puissent être traitées et payées conformément à la Loi de 2000 sur les normes d'emploi (Ontario) (la \"LNE\") et aux politiques de la Société.",
      },
      n: 3,
      heading: {
        en: 'Employment type, hours and overtime',
        fr: "Type d'emploi, heures et heures supplémentaires",
      },
    },
    {
      type: 'clause',
      text: {
        en: "Your base salary will be {{annual_base_salary}} per year, paid {{pay_frequency}} by direct deposit, less statutory deductions and authorized withholdings.\nStarting wage or salary: {{annual_base_salary}}\nPay period: {{pay_period}}\nRegular pay day: {{pay_day}}\nPay frequency: {{pay_frequency}}\nYour compensation will be reviewed as part of the Company's regular performance and compensation cycle. A review does not guarantee an increase or adjustment.",
        fr: 'Votre salaire de base sera de {{annual_base_salary}} par année, payé {{pay_frequency}} par dépôt direct, moins les retenues prévues par la loi et les retenues autorisées.\nSalaire ou taux de départ: {{annual_base_salary}}\nPériode de paie: {{pay_period}}\nJour de paie régulier: {{pay_day}}\nFréquence de paie: {{pay_frequency}}\nVotre rémunération sera examinée dans le cadre du cycle régulier de gestion du rendement et de rémunération de la Société. Un tel examen ne garantit aucune augmentation ni rajustement.',
      },
      n: 4,
      heading: {
        en: 'Compensation and pay administration',
        fr: 'Rémunération et administration de la paie',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'You may be eligible to participate in {{variable_comp_plan_name}} (the "Plan"), with a target opportunity of {{variable_comp_target}}, subject to the written terms of the Plan as amended from time to time. The Plan governs all eligibility, performance conditions, earning, payment, proration and termination-related treatment.\nNo bonus, commission or incentive payment is earned or payable unless all conditions in the Plan are satisfied, subject to the ESA and applicable law. The Company may amend or discontinue the Plan on reasonable notice, subject to the ESA and the express terms of the Plan.',
        fr: "Vous pourriez être admissible à participer à {{variable_comp_plan_name}} (le \"Régime\"), avec une possibilité cible de {{variable_comp_target}}, sous réserve des modalités écrites du Régime, telles qu'elles peuvent être modifiées de temps à autre. Le Régime régit l'admissibilité, les conditions de rendement, l'acquisition, le paiement, la répartition au prorata et le traitement applicable à la fin de l'emploi.\nAucun boni, commission ni paiement incitatif n'est acquis ou payable à moins que toutes les conditions du Régime soient respectées, sous réserve de la LNE et de la loi applicable. La Société peut modifier ou mettre fin au Régime moyennant un préavis raisonnable, sous réserve de la LNE et des modalités expresses du Régime.",
      },
      n: 5,
      heading: {
        en: 'Variable compensation',
        fr: 'Rémunération variable',
      },
    },
    {
      type: 'clause',
      text: {
        en: "You will be eligible to participate in the Company's {{benefits_plan_name}} group benefits plan effective {{benefits_start_date}}, subject to the insurer's eligibility requirements and the governing plan documents. The insurance contracts and plan documents prevail over any summary in this letter.\nThe Company may amend, replace or discontinue benefits plans, subject to the plan documents, reasonable notice and applicable law. Statutory benefit continuation during an ESA notice period will be provided where required.\nYou will also have access to the Company's Employee and Family Assistance Program, if applicable, in accordance with its terms.",
        fr: "Vous serez admissible à participer au régime collectif d'avantages sociaux {{benefits_plan_name}} de la Société à compter du {{benefits_start_date}}, sous réserve des critères d'admissibilité de l'assureur et des documents régissant le régime. Les contrats d'assurance et les documents du régime prévalent sur tout résumé contenu dans la présente lettre.\nLa Société peut modifier, remplacer ou mettre fin à ses régimes d'avantages sociaux, sous réserve des documents du régime, d'un préavis raisonnable et de la loi applicable. Le maintien des avantages sociaux pendant un délai de préavis prévu par la LNE sera fourni lorsque requis.\nVous aurez également accès au programme d'aide aux employés et à leur famille de la Société, le cas échéant, conformément à ses modalités.",
      },
      n: 6,
      heading: {
        en: 'Benefits and wellness',
        fr: 'Avantages sociaux et mieux-être',
      },
    },
    {
      type: 'clause',
      text: {
        en: "You will receive {{vacation_weeks}} weeks of paid vacation per vacation entitlement year, subject to reasonable scheduling approval and the Company's vacation policy. Your entitlement will not be less than the ESA minimum: two weeks of vacation time and 4% vacation pay for employees with less than five years of employment, and three weeks of vacation time and 6% vacation pay after five or more years of employment.\nYou will also receive public holiday entitlements required by the ESA, unless an ESA exemption or special rule applies.",
        fr: "Vous recevrez {{vacation_weeks}} semaines de vacances payées par année de référence, sous réserve d'une approbation raisonnable de l'horaire et de la politique de vacances de la Société. Votre droit aux vacances ne sera pas inférieur au minimum prévu par la LNE : deux semaines de vacances et une indemnité de vacances de 4 % pour les employés ayant moins de cinq années d'emploi, et trois semaines de vacances et une indemnité de vacances de 6 % après cinq années d'emploi ou plus.\nVous recevrez également les droits relatifs aux jours fériés prévus par la LNE, sauf si une exemption ou une règle spéciale prévue par la LNE s'applique.",
      },
      n: 7,
      heading: {
        en: 'Vacation, vacation pay and public holidays',
        fr: 'Vacances, indemnité de vacances et jours fériés',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'You are entitled to the statutory leaves of absence that apply under the ESA, including pregnancy, parental, placement of a child, family caregiver, family responsibility, sick, bereavement, domestic or sexual violence, reservist, organ donor, family medical, critical illness, child death, crime-related child disappearance, declared emergency, infectious disease emergency, job seeking and long-term illness leave, where the eligibility requirements are met.',
        fr: "Vous avez droit aux congés prévus par la LNE qui s'appliquent, notamment les congés de maternité, parental, en cas de placement d'un enfant, familial pour les aidants naturels, pour obligations familiales, de maladie, de deuil, en cas de violence familiale ou sexuelle, de réserviste, pour don d'organe, familial pour raison médicale, en cas de maladie grave, en cas de décès d'un enfant, en cas de disparition d'un enfant dans des circonstances criminelles, en cas d'urgence déclarée, spécial en raison d'une maladie infectieuse, pour recherche d'emploi et de longue durée pour maladie, lorsque les conditions d'admissibilité sont satisfaites.",
      },
      n: 8,
      heading: {
        en: 'Statutory leaves and required workplace policies',
        fr: 'Congés prévus par la loi et politiques obligatoires',
      },
    },
    {
      /* ESA s. 21.1.2 (disconnecting from work) and s. 41.1.1 (electronic
         monitoring) written-policy duties apply only once the employer
         reaches 25 employees. */
      type: 'clause',
      text: {
        en: 'Because the Company employs 25 or more employees, you will receive copies of its written disconnecting-from-work policy and its written electronic monitoring policy required by the ESA, within the applicable statutory timeframe. These policies describe expectations and required disclosures; they do not reduce or replace your rights under the ESA.',
        fr: 'Comme la Société compte 25 salariés ou plus, vous recevrez des copies de sa politique écrite sur la déconnexion du travail et de sa politique écrite relative à la surveillance électronique, exigées par la LNE, dans le délai prévu par la loi. Ces politiques décrivent les attentes et les divulgations requises; elles ne réduisent ni ne remplacent vos droits en vertu de la LNE.',
      },
      heading: {
        en: 'Disconnecting from work & electronic monitoring',
        fr: 'Déconnexion du travail et surveillance électronique',
      },
      when: {
        min_headcount: 25,
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The first {{probation_length}} of your employment will be a probationary period. The purpose of probation is to assess fit, performance, conduct and operational alignment. The probationary period does not constitute a waiver of your statutory entitlements under the ESA, nor does it limit them.\nUnder the ESA, the minimum notice of termination provisions generally do not apply during the first three months of employment. After the first three months, ESA minimum termination entitlements apply even if a contractual probationary period continues. If employment ends during probation, you will receive at least the minimum entitlements required by the ESA and the Employment Agreement.',
        fr: "La période initiale de {{probation_length}} de votre emploi constituera une période probatoire. La période probatoire vise à évaluer l'adéquation du poste, le rendement, la conduite et l'alignement opérationnel. La période probatoire ne constitue pas une renonciation à vos droits statutaires en vertu de la LNE, ni ne les limite.\nEn vertu de la LNE, les dispositions minimales relatives au préavis de licenciement ne s'appliquent généralement pas pendant les trois premiers mois d'emploi. Après les trois premiers mois, les droits minimaux prévus par la LNE en cas de fin d'emploi s'appliquent même si une période probatoire contractuelle se poursuit. Si votre emploi prend fin pendant la période probatoire, vous recevrez au moins les droits minimaux exigés par la LNE et le contrat de travail.",
      },
      n: 9,
      heading: {
        en: 'Probationary period',
        fr: 'Période probatoire',
      },
    },
    {
      type: 'clause',
      text: {
        en: "As a condition of employment, you must protect the Company's confidential information and comply with the intellectual-property obligations in the Employment Agreement. Any work product created in the course of employment, using Company resources or relating to the Company's business will be governed by the Employment Agreement.",
        fr: "Comme condition d'emploi, vous devez protéger les renseignements confidentiels de la Société et respecter les obligations relatives à la propriété intellectuelle prévues au contrat de travail. Tout produit du travail créé dans le cadre de votre emploi, au moyen des ressources de la Société ou relativement aux activités de la Société sera régi par le contrat de travail.",
      },
      n: 10,
      heading: {
        en: 'Confidentiality and intellectual property',
        fr: 'Confidentialité et propriété intellectuelle',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Please refer to the Employment Agreement for the complete legal terms governing termination. This section is a summary provided for your convenience and does not replace or expand upon the entitlements set out in the Employment Agreement or the *Employment Standards Act, 2000*.\nFor clarity, the Company will always provide at least the minimum notice of termination, termination pay, severance pay if applicable, benefit continuation, accrued and unpaid vacation pay, earned wages and any other amounts required by the ESA.',
        fr: "Veuillez consulter le contrat de travail pour les dispositions complètes en matière de licenciement. Cette section n'est qu'un résumé fourni à titre informatif ; elle ne remplace ni n'étend les droits prévus dans le contrat de travail ou la Loi de 2000 sur les normes d'emploi.\nPar souci de clarté, la Société fournira toujours au moins le préavis de licenciement minimal, l'indemnité compensatrice de préavis de licenciement, l'indemnité de cessation d'emploi le cas échéant, le maintien des avantages sociaux, l'indemnité de vacances accumulée et impayée, les salaires gagnés et toute autre somme exigée par la LNE.",
      },
      n: 11,
      heading: {
        en: 'Ending employment',
        fr: "Fin de l'emploi",
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employment Agreement contains an express temporary layoff provision. By accepting this offer and signing the Employment Agreement, you agree that the Company may place you on a temporary layoff in accordance with the ESA and the Employment Agreement. If a layoff becomes a termination under the ESA or applicable law, you will receive your required termination and severance entitlements.',
        fr: "Le contrat de travail contient une disposition expresse relative à la mise à pied temporaire. En acceptant la présente offre et en signant le contrat de travail, vous acceptez que la Société puisse vous mettre à pied temporairement conformément à la LNE et au contrat de travail. Si une mise à pied devient un licenciement ou une cessation d'emploi au sens de la LNE ou de la loi applicable, vous recevrez les droits applicables en matière de licenciement et de cessation d'emploi.",
      },
      n: 12,
      heading: {
        en: 'Temporary layoff',
        fr: 'Mise à pied temporaire',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This offer is conditional on:\n* your legal authorization to work in Canada for the duration of your employment;\n* The obtainment of satisfactory results from role-related background, credential and reference checks that have been disclosed to you and conducted with required consent, in accordance with applicable privacy, human rights and employment laws;\n* your signing and returning the Employment Agreement, confidentiality and intellectual-property documents, policy acknowledgements and onboarding documents required by the Company on or before your start date; and\n* your representation that accepting this offer and performing your duties will not breach any obligation owed to a current or former employer or other third party, including confidentiality, intellectual-property, non-solicitation or other lawful restrictive-covenant obligations.',
        fr: "La présente offre est conditionnelle à ce qui suit :\n* votre autorisation légale de travailler au Canada pendant toute la durée de votre emploi;\n* l'obtention de résultats satisfaisants aux vérifications liées au poste, notamment des vérifications des antécédents, des titres de compétence et des références qui vous ont été divulguées et qui sont effectuées avec le consentement requis, conformément aux lois applicables en matière de protection de la vie privée, de droits de la personne et d'emploi;\n* votre signature et votre retour du contrat de travail, des documents relatifs à la confidentialité et à la propriété intellectuelle, des accusés de réception de politiques et des documents d'accueil exigés par la Société au plus tard à votre date de début; et\n* votre déclaration selon laquelle l'acceptation de la présente offre et l'exécution de vos fonctions ne violeront aucune obligation envers un employeur actuel ou ancien ni envers un autre tiers, notamment en matière de confidentialité, de propriété intellectuelle, de non-sollicitation ou d'autres clauses restrictives légales.",
      },
      n: 13,
      heading: {
        en: 'Conditions of this offer',
        fr: 'Conditions de la présente offre',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This offer letter, the Employment Agreement and any attached schedules form the entire agreement concerning your employment and replace all prior discussions, representations or understandings about the same subject matter.\nIf there is a conflict between this offer letter and the Employment Agreement, the Employment Agreement prevails for legal terms, including termination, confidentiality, intellectual property, policies, governing law, severability and temporary layoff. The individualized business terms in this offer letter - including position, start date, reporting, initial work location, initial anticipated hours and starting compensation - prevail unless the Employment Agreement expressly states otherwise.\nThis offer is governed by the laws of Ontario and the laws of Canada applicable in Ontario. The ESA provides minimum statutory employment standards and nothing in this offer is intended to contract out of or waive those minimum standards.',
        fr: "La présente lettre d'offre, le contrat de travail et les annexes jointes constituent l'intégralité de l'entente concernant votre emploi et remplacent toutes les discussions, déclarations ou ententes antérieures portant sur le même objet.\nEn cas de conflit entre la présente lettre d'offre et le contrat de travail, le contrat de travail prévaut quant aux conditions juridiques, notamment la fin de l'emploi, la confidentialité, la propriété intellectuelle, les politiques, le droit applicable, la divisibilité et la mise à pied temporaire. Les conditions d'affaires individualisées contenues dans la présente lettre d'offre - notamment le poste, la date de début, la supervision, le lieu initial de travail, les heures initialement prévues et la rémunération de départ - prévalent, sauf disposition expresse contraire du contrat de travail.\nLa présente offre est régie par les lois de l'Ontario et les lois du Canada applicables en Ontario. La LNE établit les normes minimales d'emploi prévues par la loi et rien dans la présente offre n'a pour objet de renoncer à ces normes minimales ou d'y déroger.",
      },
      n: 14,
      heading: {
        en: 'Governing documents and law',
        fr: 'Documents applicables et droit applicable',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'To accept this offer, please sign the acceptance block at the end of this bilingual document and return this letter and the Employment Agreement to {{hr_contact_name}} at {{hr_contact_email}} by {{offer_expiry_date}}. You are encouraged to review the documents carefully and may obtain independent legal advice before signing.\nWe look forward to working with you.\nSincerely,\n{{employer_signer_name}}\n{{employer_signer_title}}\n{{org}}',
        fr: "Pour accepter la présente offre, veuillez signer le bloc d'acceptation à la fin du présent document bilingue et retourner la présente lettre ainsi que le contrat de travail à {{hr_contact_name}}, à {{hr_contact_email}}, au plus tard le {{offer_expiry_date}}. Nous vous encourageons à examiner les documents attentivement et vous pouvez obtenir un avis juridique indépendant avant de signer.\nNous avons hâte de travailler avec vous.\nCordialement,\n{{employer_signer_name}}\n{{employer_signer_title}}\n{{org}}",
      },
      n: 15,
      heading: {
        en: 'Acceptance',
        fr: 'Acceptation',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Position title: {{position_title}}\nDepartment/team: {{department}}\nKey responsibilities: {{job_responsibilities}}\nRequired qualifications: {{required_qualifications}}\nPhysical, travel or other role requirements, if any: {{role_requirements}}',
        fr: 'Titre du poste: {{position_title}}\nService/équipe: {{department}}\nResponsabilités principales: {{job_responsibilities}}\nQualifications requises: {{required_qualifications}}\nExigences physiques, déplacements ou autres exigences liées au poste, le cas échéant: {{role_requirements}}',
      },
      heading: {
        en: 'Schedule A - Job Description',
        fr: 'Annexe A - Description du poste',
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
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'candidate',
}
