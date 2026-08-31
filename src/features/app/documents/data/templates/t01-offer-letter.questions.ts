/* T01 wizard questions — split from t01-offer-letter.ts for maintainability. */
import type { TemplateQuestion } from '../types'

export const t01OfferLetterQuestions: TemplateQuestion[] = [
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
]
