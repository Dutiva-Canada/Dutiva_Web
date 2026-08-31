/* T02 — Employment agreement (Ontario).
   Replaced from T02_Employment_Agreement_ON_EN_polished.docx.md (an
   Ontario-only, English-source handoff). Ontario-only, matching T01:
   Québec and federally regulated employers get their own
   jurisdiction-specific agreement templates rather than this one carrying
   conditional Ontario-only clauses. The source had no French version — all
   FR below is [FR self-authored] and must be reviewed alongside the EN.
   Two internal cross-reference numbers in the source (a probation clause
   pointing at "Section 12" for termination, and an entire-agreement clause
   pointing at "Section 10" for policy amendments) were corrected to the
   sections they actually describe (11 and 9) rather than transcribed as
   errors — see docs/design-handoff-t02-employment-agreement-on/README.md.
   Hand-maintained; keep the FR in step with the EN on every edit. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT02: DocTemplate = {
  id: 'tpl_t02',
  tid: 'T02',
  key: 'employment_agreement',
  kind: 'agreement',
  category: 'hiring',
  core: true,
  name: {
    en: 'Employment agreement (Ontario)',
    fr: 'Contrat de travail (Ontario)',
  },
  desc: {
    en: 'A full indefinite-term Ontario employment contract: hours, pay, benefits, leaves, IP, restrictive covenants, termination, layoff and governing terms.',
    fr: 'Un contrat de travail complet à durée indéterminée pour l’Ontario : heures, rémunération, avantages, congés, propriété intellectuelle, clauses restrictives, cessation, mise à pied et dispositions applicables.',
  },
  jurisdictions: ['ON'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v5',
  versionNumber: 5,
  effectiveDate: '2026-04-10',
  updatedAt: '2026-08-27',
  estMinutes: 15,
  usageCount: 74,
  statutory: [
    {
      en: 'Employment Standards Act, 2000, S.O. 2000, c. 41',
      fr: 'Loi de 2000 sur les normes d’emploi, L.O. 2000, chap. 41',
    },
    {
      en: 'Human Rights Code (Ontario)',
      fr: 'Code des droits de la personne (Ontario)',
    },
    {
      en: 'Occupational Health and Safety Act (Ontario)',
      fr: 'Loi sur la santé et la sécurité au travail (Ontario)',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: "Written for Ontario employers. Section 11 ties each without-cause entitlement to the ESA minimum (notice, severance, benefits, wages and vacation pay) and limits for-cause without notice to the ESA wilful-misconduct standard — a structure Ontario courts upheld in Baker v. Van Dolder's Home Team Inc., 2026 ONCA (Aug 6, 2026). Non-compete clauses entered into on or after October 25, 2021 are generally prohibited and void under the ESA, subject only to narrow statutory exceptions. Have counsel review before use.",
      fr: "Rédigé pour les employeurs de l’Ontario. La section 11 rattache chaque droit en cas de cessation sans motif au minimum de la LNE (préavis, indemnité de départ, avantages, salaires et indemnité de vacances) et limite la cessation sans préavis au motif d’inconduite délibérée au sens de la LNE — structure que les tribunaux ontariens ont confirmée dans Baker c. Van Dolder's Home Team Inc., 2026 ONCA (6 août 2026). Les ententes de non-concurrence conclues à compter du 25 octobre 2021 sont généralement interdites et nulles en vertu de la LNE, sous réserve d’exceptions légales limitées. Faites réviser par un conseiller avant utilisation.", // [FR self-authored]
    },
  },
  includes: [
    { en: 'Parties', fr: 'Parties' },
    {
      en: 'Start date, employment type & probation',
      fr: 'Date de début, type d’emploi et probation',
    },
    {
      en: 'Place of work, hours & overtime',
      fr: 'Lieu de travail, heures et heures supplémentaires',
    },
    { en: 'Compensation', fr: 'Rémunération' },
    {
      en: 'Vacation, vacation pay & public holidays',
      fr: 'Vacances, indemnité de vacances et jours fériés',
    },
    { en: 'Benefits & wellbeing', fr: 'Avantages sociaux et mieux-être' },
    { en: 'Leaves of absence & accommodation', fr: 'Congés et accommodement' },
    { en: 'Confidentiality', fr: 'Confidentialité' },
    { en: 'Intellectual property', fr: 'Propriété intellectuelle' },
    { en: 'Policies', fr: 'Politiques' },
    { en: 'Restrictive covenants', fr: 'Clauses restrictives' },
    { en: 'Ending employment', fr: 'Fin de l’emploi' },
    { en: 'Temporary layoff', fr: 'Mise à pied temporaire' },
    { en: 'Human rights, health & safety', fr: 'Droits de la personne, santé et sécurité' },
    { en: 'Governing law', fr: 'Loi applicable' },
    { en: 'Schedule A & B', fr: 'Annexes A et B' },
  ],
  questions: [
    {
      id: 'employee_name',
      section: { en: 'Employee', fr: 'Employé(e)' },
      label: { en: 'Employee full name', fr: 'Nom complet de l’employé(e)' },
      type: 'text',
      required: true,
    },
    {
      id: 'employee_address_line_1',
      section: { en: 'Employee', fr: 'Employé(e)' },
      label: { en: 'Employee address', fr: 'Adresse de l’employé(e)' },
      type: 'text',
      required: true,
    },
    {
      id: 'employee_address_line_2',
      section: { en: 'Employee', fr: 'Employé(e)' },
      label: { en: 'Address line 2 (optional)', fr: 'Adresse (ligne 2) — facultatif' },
      type: 'text',
      required: false,
    },
    {
      id: 'employer_address',
      section: { en: 'Employer', fr: 'Employeur' },
      label: { en: 'Employer principal office address', fr: 'Adresse du siège de l’employeur' },
      type: 'textarea',
      required: true,
    },
    {
      id: 'start_date',
      section: { en: 'Term', fr: 'Durée' },
      label: { en: 'Start date', fr: 'Date de début' },
      type: 'date',
      required: true,
    },
    {
      id: 'employment_type',
      section: { en: 'Term', fr: 'Durée' },
      label: { en: 'Employment type', fr: 'Type d’emploi' },
      type: 'radio',
      required: true,
      options: [
        { value: 'full-time', label: { en: 'Full-time', fr: 'Temps plein' } },
        { value: 'part-time', label: { en: 'Part-time', fr: 'Temps partiel' } },
        { value: 'contract', label: { en: 'Contract', fr: 'Contractuel' } },
      ],
    },
    {
      id: 'work_location',
      section: { en: 'Hours', fr: 'Heures' },
      label: { en: 'Regular place of work', fr: 'Lieu de travail habituel' },
      type: 'text',
      required: true,
    },
    {
      id: 'scheduled_hours_per_week',
      section: { en: 'Hours', fr: 'Heures' },
      label: { en: 'Scheduled hours per week', fr: 'Heures prévues par semaine' },
      type: 'text',
      required: true,
    },
    {
      id: 'regular_hours',
      section: { en: 'Hours', fr: 'Heures' },
      label: {
        en: 'Regular hours (e.g. 9:00 a.m. – 5:00 p.m.)',
        fr: 'Heures régulières (p. ex. 9 h à 17 h)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'annual_base_salary',
      section: { en: 'Compensation', fr: 'Rémunération' },
      label: { en: 'Annual base salary (CAD)', fr: 'Salaire de base annuel (CAD)' },
      type: 'text',
      required: true,
    },
    {
      id: 'pay_frequency',
      section: { en: 'Compensation', fr: 'Rémunération' },
      label: { en: 'Pay frequency', fr: 'Fréquence de paie' },
      type: 'text',
      required: true,
    },
    {
      id: 'variable_comp_description',
      section: { en: 'Compensation', fr: 'Rémunération' },
      label: {
        en: 'Variable compensation description (optional)',
        fr: 'Description de la rémunération variable (facultatif)',
      },
      type: 'textarea',
      required: false,
    },
    {
      id: 'vacation_weeks',
      section: { en: 'Compensation', fr: 'Rémunération' },
      label: { en: 'Vacation weeks per year', fr: 'Semaines de vacances par année' },
      type: 'select',
      required: true,
      options: [
        { value: '2', label: { en: '2 weeks', fr: '2 semaines' } },
        { value: '3', label: { en: '3 weeks', fr: '3 semaines' } },
        { value: '4', label: { en: '4 weeks', fr: '4 semaines' } },
        { value: '5', label: { en: '5 weeks', fr: '5 semaines' } },
      ],
    },
    {
      id: 'benefits_plan_name',
      section: { en: 'Benefits', fr: 'Avantages sociaux' },
      label: {
        en: 'Benefits plan name (optional)',
        fr: 'Nom du régime d’avantages sociaux (facultatif)',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'benefits_start_date',
      section: { en: 'Benefits', fr: 'Avantages sociaux' },
      label: {
        en: 'Benefits start date (optional)',
        fr: 'Date d’entrée en vigueur des avantages sociaux (facultatif)',
      },
      type: 'date',
      required: false,
    },
    {
      id: 'employee_notice_weeks',
      section: { en: 'Termination', fr: 'Cessation' },
      label: {
        en: 'Employee resignation notice (weeks)',
        fr: 'Préavis de démission de l’employé(e) (semaines)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'has_enhanced_termination',
      section: { en: 'Termination', fr: 'Cessation' },
      label: {
        en: 'Contractual termination entitlement above ESA minimum?',
        fr: 'Droit contractuel à la cessation d’emploi supérieur au minimum de la LNE?',
      },
      type: 'radio',
      required: true,
      hint: {
        en: 'Yes adds Schedule B, the additional entitlement and how it is calculated.',
        fr: 'Oui ajoute l’annexe B, le droit additionnel et son mode de calcul.',
      },
      options: [
        {
          value: 'yes',
          label: { en: 'Yes — complete Schedule B', fr: 'Oui — remplir l’annexe B' },
        },
        {
          value: 'no',
          label: { en: 'No — ESA minimum only', fr: 'Non — minimum de la LNE seulement' },
        },
      ],
    },
    {
      id: 'without_cause_notice',
      section: { en: 'Termination', fr: 'Cessation' },
      label: {
        en: 'Additional entitlement, if any (Schedule B)',
        fr: 'Droit additionnel, s’il y a lieu (annexe B)',
      },
      type: 'text',
      required: false,
    },
    {
      id: 'termination_enhancement_terms',
      section: { en: 'Termination', fr: 'Cessation' },
      label: {
        en: 'Method of calculation / conditions (Schedule B)',
        fr: 'Méthode de calcul / conditions (annexe B)',
      },
      type: 'textarea',
      required: false,
    },
    {
      id: 'job_description',
      section: { en: 'Schedule A', fr: 'Annexe A' },
      label: { en: 'Job description (Schedule A)', fr: 'Description du poste (annexe A)' },
      type: 'textarea',
      required: true,
    },
    {
      id: 'employer_signer_name',
      section: { en: 'Signatures', fr: 'Signatures' },
      label: { en: 'Employer signer name', fr: 'Nom du signataire employeur' },
      type: 'text',
      required: true,
    },
    {
      id: 'employer_signer_title',
      section: { en: 'Signatures', fr: 'Signatures' },
      label: { en: 'Employer signer title', fr: 'Titre du signataire employeur' },
      type: 'text',
      required: true,
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Employment Agreement',
        fr: 'Contrat de travail',
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
        en: 'This Employment Agreement (the Agreement) is made as of {{today}}. Between {{org}}, a corporation with its principal office at {{employer_address}} (the Employer), and {{employee_name}}, of {{employee_address_line_1}}, {{employee_address_line_2}} (the Employee). The Employer and the Employee are each a Party and together the Parties.\n\nThis Agreement is intended for Ontario employment governed by the Employment Standards Act, 2000. It should be reviewed before use for federally regulated employers, unionized employees, regulated professions, special ESA exemptions or non-Ontario work locations.',
        fr: 'Le présent contrat de travail (le « Contrat ») est conclu en date du {{today}}. Entre {{org}}, une société dont le siège est situé au {{employer_address}} (l’« Employeur »), et {{employee_name}}, domicilié(e) au {{employee_address_line_1}}, {{employee_address_line_2}} (l’« Employé(e) »). L’Employeur et l’Employé(e) sont chacun une « Partie » et ensemble les « Parties ».\n\nLe présent contrat est destiné à un emploi en Ontario régi par la Loi de 2000 sur les normes d’emploi. Il doit être révisé avant utilisation pour les employeurs sous réglementation fédérale, les employés syndiqués, les professions réglementées, les exemptions particulières de la LNE ou les lieux de travail hors de l’Ontario.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Employment begins on {{start_date}} on a {{employment_type}} basis. Unless ended in accordance with this Agreement and applicable law, employment will continue indefinitely.\n\nProbationary Period. The first three (3) months of continuous employment will be considered a probationary period, during which the Employer will assess the Employee’s performance, suitability, and fit for regular employment. At any time during this probationary period (prior to the completion of three months of continuous employment), the Employer may terminate the Employee’s employment at its sole discretion, without cause, and without providing advance notice of termination, termination pay, severance pay, or common law reasonable notice, except as strictly required by the Employment Standards Act, 2000 (ESA). If the Employee is terminated after having completed three months of continuous employment, the probationary period provisions will no longer apply, and the Employee’s entitlements upon termination will be governed entirely by the termination provisions set out in Section 11 of this Agreement and the minimum requirements of the ESA.\n\nThe Employee will perform duties honestly, diligently, in good faith and in the best interests of the Employer. The Employee will comply with lawful and reasonable directions, applicable laws, and Employer policies that are made reasonably available to the Employee.',
        fr: 'L’emploi débute le {{start_date}}, à titre {{employment_type}}. Sauf s’il y est mis fin conformément au présent Contrat et à la loi applicable, l’emploi se poursuivra pour une durée indéterminée.\n\nPériode de probation. Les trois (3) premiers mois d’emploi continu constitueront une période de probation, pendant laquelle l’Employeur évaluera le rendement, l’aptitude et l’adéquation de l’Employé(e) à un emploi régulier. À tout moment pendant cette période de probation (avant l’achèvement de trois mois d’emploi continu), l’Employeur peut mettre fin à l’emploi de l’Employé(e), à son entière discrétion, sans motif et sans donner de préavis de cessation, d’indemnité de cessation, d’indemnité de départ ou de préavis raisonnable de common law, sauf dans la stricte mesure exigée par la Loi de 2000 sur les normes d’emploi (la « LNE »). Si l’Employé(e) est congédié(e) après avoir complété trois mois d’emploi continu, les dispositions relatives à la période de probation ne s’appliqueront plus, et les droits de l’Employé(e) à la cessation d’emploi seront régis entièrement par les dispositions de cessation prévues à la section 11 du présent Contrat et par les exigences minimales de la LNE.\n\nL’Employé(e) exercera ses fonctions honnêtement, avec diligence, de bonne foi et dans l’intérêt de l’Employeur. L’Employé(e) se conformera aux directives légales et raisonnables, aux lois applicables et aux politiques de l’Employeur qui lui sont raisonnablement communiquées.',
      },
      n: 1,
      heading: {
        en: 'Start date, employment type & probationary period',
        fr: 'Date de début, type d’emploi et période de probation',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee’s regular place of work is {{work_location}}. The Employee’s initial scheduled hours are {{scheduled_hours_per_week}} hours per week, typically {{regular_hours}}.\n\nThe Employer may reasonably vary work location, schedule and reporting arrangements to meet operational needs, subject to the ESA, the Ontario Human Rights Code and any applicable accommodation obligations.\n\nWhere Ontario overtime rules apply and no exemption or special rule applies, overtime is paid at 1.5 times the regular rate for hours worked above 44 in a work week. Overtime must be approved in advance. If overtime is worked without prior approval, it must still be reported accurately and will be addressed under the Employer’s policies and the ESA.',
        fr: 'Le lieu de travail habituel de l’Employé(e) est {{work_location}}. Les heures de travail initialement prévues de l’Employé(e) sont de {{scheduled_hours_per_week}} heures par semaine, généralement {{regular_hours}}.\n\nL’Employeur peut raisonnablement modifier le lieu de travail, l’horaire et les liens hiérarchiques pour répondre aux besoins opérationnels, sous réserve de la LNE, du Code des droits de la personne de l’Ontario et de toute obligation d’accommodement applicable.\n\nLorsque les règles ontariennes sur les heures supplémentaires s’appliquent et qu’aucune exemption ou règle spéciale ne s’applique, les heures supplémentaires sont rémunérées à 1,5 fois le taux régulier pour les heures travaillées au-delà de 44 heures au cours d’une semaine de travail. Les heures supplémentaires doivent être approuvées à l’avance. Si des heures supplémentaires sont travaillées sans approbation préalable, elles doivent tout de même être déclarées avec exactitude et seront traitées conformément aux politiques de l’Employeur et à la LNE.',
      },
      n: 2,
      heading: {
        en: 'Place of work, hours and overtime',
        fr: 'Lieu de travail, heures et heures supplémentaires',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employer will pay the Employee a base salary of {{annual_base_salary}} per year, paid {{pay_frequency}} by direct deposit, less statutory deductions and authorized withholdings.\n\nThe Employee may be eligible for {{variable_comp_description}}, subject to the written terms of the applicable plan as amended from time to time. No bonus, commission or incentive payment is earned or payable unless all conditions in the applicable plan are satisfied, subject always to the ESA and other applicable law.\n\nCompensation may be reviewed as part of the Employer’s normal compensation cycle. A review does not guarantee an increase, bonus, incentive payment or other adjustment.',
        fr: 'L’Employeur versera à l’Employé(e) un salaire de base de {{annual_base_salary}} par année, payé {{pay_frequency}} par dépôt direct, moins les retenues prévues par la loi et les retenues autorisées.\n\nL’Employé(e) pourrait être admissible à {{variable_comp_description}}, sous réserve des modalités écrites du régime applicable, telles que modifiées de temps à autre. Aucun boni, commission ou paiement incitatif n’est acquis ou payable à moins que toutes les conditions du régime applicable soient respectées, sous réserve en tout temps de la LNE et des autres lois applicables.\n\nLa rémunération pourra être révisée dans le cadre du cycle normal de gestion de la rémunération de l’Employeur. Une révision ne garantit aucune augmentation, boni, prime incitative ou autre rajustement.',
      },
      n: 3,
      heading: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee is entitled to {{vacation_weeks}} of paid vacation per vacation entitlement year, subject to reasonable scheduling approval and the Employer’s vacation policy. The Employee will receive no less than the ESA minimum vacation time and vacation pay: two weeks and 4% for employees with less than five years of employment, and three weeks and 6% after five or more years of employment.\n\nVacation pay accrues as wages are earned. Unused vacation and vacation pay are governed by the ESA, this Agreement and the Employer’s vacation policy. The Employee is also entitled to public holiday entitlements required by the ESA, unless an ESA exemption or special rule applies.',
        fr: 'L’Employé(e) a droit à {{vacation_weeks}} de vacances payées par année de référence, sous réserve d’une approbation raisonnable de l’horaire et de la politique de vacances de l’Employeur. L’Employé(e) recevra au moins le minimum prévu par la LNE en matière de vacances et d’indemnité de vacances : deux semaines et 4 % pour les employés ayant moins de cinq années d’emploi, et trois semaines et 6 % après cinq années d’emploi ou plus.\n\nL’indemnité de vacances s’accumule au fur et à mesure que le salaire est gagné. Les vacances et l’indemnité de vacances non utilisées sont régies par la LNE, le présent Contrat et la politique de vacances de l’Employeur. L’Employé(e) a également droit aux congés pour jours fériés prévus par la LNE, sauf si une exemption ou une règle spéciale de la LNE s’applique.',
      },
      n: 4,
      heading: {
        en: 'Vacation, vacation pay and public holidays',
        fr: 'Vacances, indemnité de vacances et jours fériés',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee is eligible to participate in the Employer’s group benefits plan ({{benefits_plan_name}}) in accordance with the governing plan documents and insurer requirements, starting {{benefits_start_date}}. The plan documents and insurance contracts prevail over any summary in this Agreement.\n\nThe Employer may amend, replace or discontinue benefit plans, subject to the plan documents, reasonable notice and applicable law. The Employer will continue benefit plan contributions during any statutory ESA notice period where required.\n\nThe Employee may also have access to the Employer’s Employee and Family Assistance Program, where offered, in accordance with its terms.',
        fr: 'L’Employé(e) est admissible à participer au régime collectif d’avantages sociaux de l’Employeur ({{benefits_plan_name}}) conformément aux documents du régime et aux exigences de l’assureur, à compter du {{benefits_start_date}}. Les documents du régime et les contrats d’assurance prévalent sur tout résumé contenu dans le présent Contrat.\n\nL’Employeur peut modifier, remplacer ou mettre fin aux régimes d’avantages sociaux, sous réserve des documents du régime, d’un préavis raisonnable et de la loi applicable. L’Employeur maintiendra les cotisations au régime d’avantages sociaux pendant tout délai de préavis prévu par la LNE, lorsque requis.\n\nL’Employé(e) pourrait également avoir accès au programme d’aide aux employés et à leur famille de l’Employeur, s’il est offert, conformément à ses modalités.',
      },
      n: 5,
      heading: {
        en: 'Benefits and wellbeing',
        fr: 'Avantages sociaux et mieux-être',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee is entitled to all statutory leaves of absence required by the ESA where eligibility requirements are met, including pregnancy, parental, family caregiver, family responsibility, sick, bereavement, domestic or sexual violence, reservist, organ donor, family medical, critical illness, child death, crime-related child disappearance, declared emergency, infectious disease emergency, job seeking and long-term illness leave.\n\nThe Employer will not take reprisals against the Employee for exercising statutory leave rights. The Employer will reasonably accommodate needs protected by the Ontario Human Rights Code up to the point of undue hardship, using an individualized and good-faith process.',
        fr: 'L’Employé(e) a droit à tous les congés prévus par la LNE lorsque les conditions d’admissibilité sont satisfaites, notamment les congés de maternité, parental, familial pour les aidants naturels, pour obligations familiales, de maladie, de deuil, en cas de violence familiale ou sexuelle, de réserviste, pour don d’organe, familial pour raison médicale, en cas de maladie grave, en cas de décès d’un enfant, en cas de disparition d’un enfant dans des circonstances criminelles, en cas d’urgence déclarée, en cas d’urgence liée à une maladie infectieuse, pour recherche d’emploi et de longue durée pour maladie.\n\nL’Employeur ne prendra aucune mesure de représailles contre l’Employé(e) pour avoir exercé ses droits aux congés prévus par la loi. L’Employeur accommodera raisonnablement les besoins protégés par le Code des droits de la personne de l’Ontario jusqu’au point de contrainte excessive, au moyen d’un processus individualisé et de bonne foi.',
      },
      n: 6,
      heading: {
        en: 'Leaves of absence and accommodation',
        fr: 'Congés et accommodement',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'During and after employment, the Employee will keep Confidential Information confidential and will not use or disclose it except as required to perform the Employee’s duties for the Employer or as permitted by law.\n\nConfidential Information means all non-public information about the Employer, its affiliates, clients, suppliers, personnel, finances, products, services, technology, source code, systems, processes, security practices, business plans, pricing, strategy, trade secrets and intellectual property, in any form.\n\nThis section does not restrict the Employee from making a lawful report or protected disclosure to a regulator or government authority, participating in a legal or human-rights process, reporting a workplace concern in good faith, or discussing wages or working conditions where protected or permitted by law.',
        fr: 'Pendant et après son emploi, l’Employé(e) gardera confidentiels les Renseignements confidentiels et ne les utilisera ni ne les divulguera, sauf dans la mesure requise pour exercer ses fonctions pour l’Employeur ou tel que permis par la loi.\n\nLes « Renseignements confidentiels » désignent tous les renseignements non publics concernant l’Employeur, ses sociétés affiliées, ses clients, ses fournisseurs, son personnel, ses finances, ses produits, ses services, sa technologie, son code source, ses systèmes, ses processus, ses pratiques de sécurité, ses plans d’affaires, ses prix, sa stratégie, ses secrets commerciaux et sa propriété intellectuelle, sous quelque forme que ce soit.\n\nLa présente section ne restreint pas le droit de l’Employé(e) de faire un signalement licite ou une divulgation protégée à un organisme de réglementation ou à une autorité gouvernementale, de participer à un processus judiciaire ou relatif aux droits de la personne, de signaler de bonne foi une préoccupation liée au milieu de travail, ou de discuter de son salaire ou de ses conditions de travail lorsque cela est protégé ou permis par la loi.',
      },
      n: 7,
      heading: {
        en: 'Confidentiality',
        fr: 'Confidentialité',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'All inventions, improvements, ideas, works of authorship, software, source code, documentation, designs, databases, processes, discoveries, trade secrets and other work product that the Employee creates, develops, authors, conceives or reduces to practice in the course of employment, using the Employer’s resources or Confidential Information, or relating to the Employer’s business or reasonably anticipated business (Work Product), are the exclusive property of the Employer.\n\nThe Employee assigns to the Employer all right, title and interest in the Work Product, including copyright and all other intellectual-property rights. The Employee waives all moral rights in the Work Product to the extent permitted by law and will sign documents reasonably required to confirm or perfect the Employer’s ownership rights.\n\nThe Employer does not claim inventions or work product developed entirely on the Employee’s own time, without using the Employer’s resources or Confidential Information, and that do not relate to the Employer’s business, actual or demonstrably anticipated research, development, products or services.',
        fr: 'Toutes les inventions, améliorations, idées, œuvres, logiciels, codes source, documentations, conceptions, bases de données, processus, découvertes, secrets commerciaux et autres produits du travail que l’Employé(e) crée, développe, rédige, conçoit ou met en pratique dans le cadre de son emploi, au moyen des ressources de l’Employeur ou de Renseignements confidentiels, ou en lien avec les activités actuelles ou raisonnablement prévues de l’Employeur (les « Produits du travail »), sont la propriété exclusive de l’Employeur.\n\nL’Employé(e) cède à l’Employeur tous ses droits, titres et intérêts dans les Produits du travail, y compris le droit d’auteur et tous les autres droits de propriété intellectuelle. L’Employé(e) renonce à tous ses droits moraux sur les Produits du travail dans la mesure permise par la loi et signera les documents raisonnablement requis pour confirmer ou parfaire les droits de propriété de l’Employeur.\n\nL’Employeur ne revendique aucun droit sur les inventions ou produits du travail développés entièrement sur le temps personnel de l’Employé(e), sans utiliser les ressources ou les Renseignements confidentiels de l’Employeur, et qui ne se rapportent pas aux activités de l’Employeur, à sa recherche, à son développement, à ses produits ou à ses services réels ou raisonnablement prévisibles.',
      },
      n: 8,
      heading: {
        en: 'Intellectual property',
        fr: 'Propriété intellectuelle',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee will comply with the Employer’s policies, procedures, codes and rules as amended from time to time, including the Employee Handbook, Code of Business Conduct, Information Security Policy and Workplace Harassment, Discrimination and Violence Prevention Policy.\n\nPolicies do not create a guarantee of continued employment. The Employer may amend policies on reasonable notice, provided that no policy amendment will reduce the Employee’s minimum entitlements under the ESA or unilaterally remove a material contractual right without lawful consideration or legal authority.',
        fr: 'L’Employé(e) se conformera aux politiques, procédures, codes et règles de l’Employeur, tels que modifiés de temps à autre, y compris le manuel de l’employé, le code de conduite des affaires, la politique de sécurité de l’information et la politique de prévention du harcèlement, de la discrimination et de la violence en milieu de travail.\n\nLes politiques ne créent aucune garantie de maintien en emploi. L’Employeur peut modifier ses politiques moyennant un préavis raisonnable, à condition qu’aucune modification de politique ne réduise les droits minimaux de l’Employé(e) en vertu de la LNE ni ne retire unilatéralement un droit contractuel important sans contrepartie licite ou autorité légale.',
      },
      n: 9,
      heading: {
        en: 'Policies',
        fr: 'Politiques',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This Agreement does not impose a post-employment non-compete obligation. Any separate restrictive covenant must be in writing, separately reviewed and signed, and must comply with the ESA and applicable common law.\n\nFor Ontario employees, non-compete agreements entered into on or after October 25, 2021 are generally prohibited and void under the ESA, subject only to statutory exceptions, including certain executive and sale-of-business circumstances. Confidentiality obligations in this Agreement continue to apply after employment ends.',
        fr: 'Le présent Contrat n’impose aucune obligation de non-concurrence postérieure à l’emploi. Toute clause restrictive distincte doit être écrite, révisée et signée séparément, et doit être conforme à la LNE et à la common law applicable.\n\nPour les employés de l’Ontario, les ententes de non-concurrence conclues à compter du 25 octobre 2021 sont généralement interdites et nulles en vertu de la LNE, sous réserve uniquement des exceptions prévues par la loi, notamment certaines situations visant les cadres et la vente d’une entreprise. Les obligations de confidentialité prévues au présent Contrat continuent de s’appliquer après la fin de l’emploi.',
      },
      n: 10,
      heading: {
        en: 'Restrictive covenants',
        fr: 'Clauses restrictives',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The following provisions are intended to provide the Employee with no less than the Employee’s minimum entitlements under the ESA at the time employment ends. Nothing in this Agreement contracts out of or waives those minimum standards.\n\nResignation by the Employee. The Employee may resign by giving {{employee_notice_weeks}} weeks’ written notice. The Employer may waive all or part of the resignation notice period. If the Employer waives notice, the Employee will be paid for the waived portion unless the Parties agree otherwise in writing and subject to the ESA.\n\nTermination by the Employer without cause. The Employer may end the Employee’s employment without cause by providing:\n* the minimum notice of termination, termination pay or combination of notice and termination pay required by the ESA;\n* statutory severance pay if required by the ESA;\n* continued benefit plan contributions during the statutory ESA notice period where required by the ESA and the governing benefit plans;\n* earned wages, accrued vacation pay and any other minimum amounts required by the ESA; and\n* any additional contractual termination entitlement expressly stated in Schedule B, if Schedule B applies.\n\nThe amounts and benefits described above are in full satisfaction of all entitlements arising from a without-cause termination, including any entitlement to common-law reasonable notice or damages in lieu of such notice, to the maximum extent permitted by law.\n\nTermination for statutory wilful misconduct. The Employer may end employment without notice, termination pay or severance pay only where, at the time employment ends, the Employee is disentitled to those amounts under the ESA and its regulations, including because the Employee has been guilty of wilful misconduct, disobedience or wilful neglect of duty that is not trivial and has not been condoned. If the Employee is not disentitled under the ESA and its regulations, the Employee will receive no less than the minimum entitlements required by the ESA.\n\nNo release required for ESA minimums. The Employee will not be required to sign a release as a condition of receiving minimum ESA entitlements. The Employer may require a release for any additional payment or benefit beyond ESA minimum entitlements, where lawful.\n\nPlans and post-employment compensation. Any variable compensation, equity, bonus, commission or incentive entitlement on or after termination is governed by the applicable written plan and the ESA. If the ESA requires a greater amount or benefit than a plan provides, the ESA minimum will be provided.',
        fr: 'Les dispositions suivantes visent à garantir à l’Employé(e) au moins ses droits minimaux prévus par la LNE au moment de la fin de l’emploi. Rien dans le présent Contrat ne vise à écarter ou à renoncer à ces normes minimales.\n\nDémission par l’Employé(e). L’Employé(e) peut démissionner en donnant un préavis écrit de {{employee_notice_weeks}} semaines. L’Employeur peut renoncer à tout ou partie du délai de préavis de démission. Si l’Employeur renonce au préavis, l’Employé(e) sera rémunéré(e) pour la portion à laquelle il a été renoncé, sauf entente écrite contraire des Parties et sous réserve de la LNE.\n\nCessation par l’Employeur sans motif. L’Employeur peut mettre fin à l’emploi de l’Employé(e) sans motif en fournissant :\n* le préavis de cessation minimal, l’indemnité de cessation ou une combinaison de préavis et d’indemnité de cessation exigée par la LNE;\n* l’indemnité de départ prévue par la loi, si exigée par la LNE;\n* le maintien des cotisations au régime d’avantages sociaux pendant le délai de préavis prévu par la LNE, lorsque requis par la LNE et les régimes applicables;\n* les salaires gagnés, l’indemnité de vacances accumulée et toute autre somme minimale exigée par la LNE; et\n* tout droit contractuel additionnel à la cessation d’emploi expressément prévu à l’annexe B, si l’annexe B s’applique.\n\nLes montants et avantages décrits ci-dessus constituent, dans toute la mesure permise par la loi, la satisfaction complète de tous les droits découlant d’une cessation sans motif, y compris tout droit à un préavis raisonnable de common law ou à des dommages-intérêts en tenant lieu.\n\nCessation pour inconduite délibérée au sens de la loi. L’Employeur peut mettre fin à l’emploi sans préavis, indemnité de cessation ou indemnité de départ uniquement lorsque, au moment de la fin de l’emploi, l’Employé(e) est privé(e) de ces sommes en vertu de la LNE et de ses règlements, notamment en raison d’une inconduite délibérée, d’une désobéissance ou d’une négligence volontaire des fonctions qui n’est pas anodine et qui n’a pas été pardonnée. Si l’Employé(e) n’est pas privé(e) de ces droits en vertu de la LNE et de ses règlements, il ou elle recevra au moins les droits minimaux exigés par la LNE.\n\nAucune quittance exigée pour les minimums de la LNE. L’Employé(e) ne sera pas tenu(e) de signer une quittance comme condition pour recevoir les droits minimaux prévus par la LNE. L’Employeur peut exiger une quittance pour tout paiement ou avantage additionnel au-delà des droits minimaux de la LNE, dans la mesure permise par la loi.\n\nRégimes et rémunération postérieure à l’emploi. Tout droit à une rémunération variable, à des titres, à un boni, à une commission ou à une prime incitative à la cessation d’emploi ou après celle-ci est régi par le régime écrit applicable et par la LNE. Si la LNE exige un montant ou un avantage supérieur à celui prévu par un régime, le minimum prévu par la LNE sera fourni.',
      },
      n: 11,
      heading: {
        en: 'Ending employment',
        fr: 'Fin de l’emploi',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee expressly agrees that the Employer may place the Employee on temporary layoff in accordance with the ESA. A temporary layoff that complies with the ESA and this Agreement will not, by itself, constitute a termination or constructive dismissal. If a temporary layoff becomes a termination under the ESA or applicable law, the Employee will receive the entitlements required under Section 11 of this Agreement and the ESA.',
        fr: 'L’Employé(e) accepte expressément que l’Employeur puisse le/la mettre à pied temporairement conformément à la LNE. Une mise à pied temporaire conforme à la LNE et au présent Contrat ne constituera pas, en elle-même, une cessation d’emploi ou un congédiement déguisé. Si une mise à pied temporaire devient une cessation d’emploi au sens de la LNE ou de la loi applicable, l’Employé(e) recevra les droits exigés à la section 11 du présent Contrat et par la LNE.',
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
        en: 'The Employer is committed to a workplace free from discrimination, harassment and violence. The Employer will comply with the Ontario Human Rights Code and the Occupational Health and Safety Act, including workplace violence and workplace harassment obligations where applicable. The Employee may raise concerns in good faith without reprisal.',
        fr: 'L’Employeur s’engage à offrir un milieu de travail exempt de discrimination, de harcèlement et de violence. L’Employeur se conformera au Code des droits de la personne de l’Ontario et à la Loi sur la santé et la sécurité au travail, y compris les obligations relatives à la violence et au harcèlement en milieu de travail, le cas échéant. L’Employé(e) peut soulever des préoccupations de bonne foi sans crainte de représailles.',
      },
      n: 13,
      heading: {
        en: 'Human rights, health and safety',
        fr: 'Droits de la personne, santé et sécurité',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This Agreement, the signed offer letter and any schedules form the entire agreement between the Parties concerning employment and replace all prior discussions, representations and understandings about the same subject matter.\n\nIf there is a conflict between this Agreement and the Employee Handbook or another policy, this Agreement governs contractual terms and the policy governs day-to-day administration unless the policy provides a greater right or benefit. If there is a conflict between this Agreement and the ESA, the ESA minimum standard prevails to the extent required by law.\n\nAny change to this Agreement must be in writing and signed by both Parties, except for policy amendments made in accordance with Section 9.',
        fr: 'Le présent Contrat, la lettre d’offre signée et toute annexe constituent l’intégralité de l’entente entre les Parties concernant l’emploi et remplacent toutes les discussions, déclarations et ententes antérieures portant sur le même objet.\n\nEn cas de conflit entre le présent Contrat et le manuel de l’employé ou une autre politique, le présent Contrat régit les conditions contractuelles et la politique régit l’administration quotidienne, sauf si la politique accorde un droit ou un avantage supérieur. En cas de conflit entre le présent Contrat et la LNE, la norme minimale de la LNE prévaut dans la mesure exigée par la loi.\n\nToute modification du présent Contrat doit être écrite et signée par les deux Parties, à l’exception des modifications de politiques apportées conformément à la section 9.',
      },
      n: 14,
      heading: {
        en: 'Entire agreement and order of precedence',
        fr: 'Intégralité de l’entente et ordre de priorité',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'If a court or tribunal finds any provision of this Agreement invalid or unenforceable, the remaining provisions continue in force unless doing so would be contrary to law or would materially change the intended employment bargain. A failure to enforce a provision is not a waiver of the right to enforce it later.',
        fr: 'Si un tribunal juge qu’une disposition du présent Contrat est invalide ou inapplicable, les autres dispositions demeurent en vigueur, sauf si cela est contraire à la loi ou modifierait de façon importante l’entente d’emploi voulue. Le défaut de faire respecter une disposition ne constitue pas une renonciation au droit de l’appliquer ultérieurement.',
      },
      n: 15,
      heading: {
        en: 'Severability and no waiver',
        fr: 'Divisibilité et absence de renonciation',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This Agreement is governed by the laws of Ontario and the laws of Canada applicable in Ontario. The primary Ontario employment standards statute is the Employment Standards Act, 2000, S.O. 2000, c. 41.',
        fr: 'Le présent Contrat est régi par les lois de l’Ontario et les lois du Canada applicables en Ontario. La principale loi ontarienne en matière de normes d’emploi est la Loi de 2000 sur les normes d’emploi, L.O. 2000, chap. 41.',
      },
      n: 16,
      heading: {
        en: 'Governing law',
        fr: 'Loi applicable',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee confirms that the Employee has had a reasonable opportunity to review this Agreement before signing and to obtain independent legal advice. If the Employee chooses not to obtain legal advice, the Employee does so voluntarily.\n\nBy signing below, the Parties confirm that they have read this Agreement, understand it and agree to its terms.',
        fr: 'L’Employé(e) confirme avoir eu une occasion raisonnable d’examiner le présent Contrat avant de le signer et d’obtenir un avis juridique indépendant. Si l’Employé(e) choisit de ne pas obtenir d’avis juridique, il ou elle le fait volontairement.\n\nEn signant ci-dessous, les Parties confirment avoir lu le présent Contrat, l’avoir compris et en accepter les modalités.',
      },
      n: 17,
      heading: {
        en: 'Independent legal advice',
        fr: 'Avis juridique indépendant',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{job_description}}',
        fr: '{{job_description}}',
      },
      heading: {
        en: 'Schedule A - Job Description',
        fr: 'Annexe A - Description du poste',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Complete this schedule only if the Employer is providing a contractual amount or benefit above ESA minimum entitlements.\n\nAdditional entitlement, if any: {{without_cause_notice}}\n\nMethod of calculation / conditions: {{termination_enhancement_terms}}',
        fr: 'Complétez cette annexe uniquement si l’Employeur offre un montant ou un avantage contractuel supérieur aux droits minimaux de la LNE.\n\nDroit additionnel, s’il y a lieu : {{without_cause_notice}}\n\nMéthode de calcul / conditions : {{termination_enhancement_terms}}',
      },
      heading: {
        en: 'Schedule B - Additional Contractual Termination Entitlement',
        fr: 'Annexe B - Droit contractuel additionnel à la cessation d’emploi',
      },
      when: {
        answer: { id: 'has_enhanced_termination', equals: ['yes'] },
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
  subject: 'employee',
}
