import { allTemplates } from '@/features/app/documents/catalogue'
import type { DocTemplate } from '@/features/app/documents/data'
import {
  answerLabels,
  computedTokens,
  formatTodayLabel,
  mergeFieldValues,
  resolveBlocks,
} from '@/features/app/documents/engine'
import type { Lang } from '@/i18n/core'
import { MARKETING_DEMO_ORG } from './demoOrgContext'

/** Curated templates with strong “before you sign up” preview value. */
export const FEATURED_TEMPLATE_TIDS = ['T01', 'T03', 'T21'] as const

/** Sample wizard answers merged into marketing previews — fictional demo employee. */
const demoMergeFieldAnswers: Record<string, string> = {
  employee_name: 'Jordan Mensah',
  employee_first_name: 'Jordan',
  employee_address_line_1: '42 Maple Street',
  employee_address_line_2: 'Toronto, ON  M5V 1A1',
  position_title: 'Operations Coordinator',
  department: 'Operations',
  manager_name: 'Amara Osei',
  manager_title: 'Director of Operations',
  work_location: 'Toronto, ON — hybrid (3 days on site)',
  start_date: '2026-09-15',
  offer_expiry_date: '2026-09-05',
  employment_type: 'full-time',
  scheduled_hours_per_week: '40',
  regular_hours: 'Monday to Friday, 9:00 a.m. to 5:00 p.m.',
  annual_base_salary: '$68,000',
  pay_frequency: 'bi-weekly',
  pay_period: 'bi-weekly',
  pay_day: 'every other Friday',
  variable_comp_plan_name: 'Annual performance bonus',
  variable_comp_target: '10% of base salary',
  benefits_plan_name: 'Northgate group benefits',
  benefits_start_date: '2026-10-01',
  vacation_weeks: '3',
  probation_length: '3 months',
  employer_business_name: 'Northgate Logistics',
  employer_address: '1200 Industrial Parkway, Mississauga, ON  L5T 2H8',
  employer_phone: '(905) 555-0142',
  hr_contact_name: 'Riley Summers',
  hr_contact_email: 'hr@northgate.ca',
  job_responsibilities:
    'Coordinate inbound and outbound shipments, maintain carrier relationships, and support warehouse scheduling.',
  required_qualifications:
    'Post-secondary diploma in logistics or supply chain; two or more years in transportation coordination.',
  role_requirements: 'Occasional travel to the Mississauga distribution centre.',
  employer_signer_name: 'Martin Constantineau',
  employer_signer_title: 'Director of Human Resources',
  effective_date: '2026-10-03',
  tenure_years: '6',
  notice_weeks: '8',
  severance_weeks: '6',
  benefits_end: '2026-11-28',
  termination_effective_date: '2026-10-03',
  last_day_worked: '2026-10-03',
  notice_period: '8 weeks',
}

/**
 * French overrides for the free-text answers — select/radio values stay
 * canonical (`answerLabels` localizes them through the question options) and
 * `date` answers format themselves per language. Without these, a French
 * preview renders French clauses around English job titles, pay terms and
 * the Schedule A body.
 */
const demoMergeFieldAnswersFr: Record<string, string> = {
  employee_address_line_1: '42, rue Maple',
  employee_address_line_2: 'Toronto (Ont.)  M5V 1A1',
  position_title: 'Coordonnateur des opérations',
  department: 'Opérations',
  manager_title: 'Directrice des opérations',
  work_location: 'Toronto (Ont.) — hybride (3 jours sur place)',
  regular_hours: 'du lundi au vendredi, de 9 h à 17 h',
  annual_base_salary: '68 000 $',
  pay_frequency: 'aux deux semaines',
  pay_period: 'aux deux semaines',
  pay_day: 'un vendredi sur deux',
  variable_comp_plan_name: 'un régime de boni de rendement annuel',
  variable_comp_target: '10 % du salaire de base',
  benefits_plan_name: 'Northgate',
  employer_address: '1200, promenade Industrial, Mississauga (Ont.)  L5T 2H8',
  job_responsibilities:
    'Coordonner les expéditions entrantes et sortantes, entretenir les relations avec les transporteurs et appuyer la planification des horaires d’entrepôt.',
  required_qualifications:
    'Diplôme d’études postsecondaires en logistique ou en chaîne d’approvisionnement; au moins deux ans d’expérience en coordination du transport.',
  role_requirements: 'Déplacements occasionnels au centre de distribution de Mississauga.',
  employer_signer_title: 'Directeur des ressources humaines',
  notice_period: '8 semaines',
}

function demoAnswersFor(lang: Lang): Record<string, string> {
  return lang === 'fr' ? { ...demoMergeFieldAnswers, ...demoMergeFieldAnswersFr } : demoMergeFieldAnswers
}

export function templateByTid(tid: string): DocTemplate | undefined {
  return allTemplates.find((candidate) => candidate.tid === tid)
}

export function buildTemplatePreview(tid: string, lang: Lang) {
  const template = templateByTid(tid)
  if (!template) return null
  const answers = demoAnswersFor(lang)
  const ctx = { ...MARKETING_DEMO_ORG, answers }
  const blocks = resolveBlocks(template, ctx)
  const today = formatTodayLabel(lang)
  /* Each half of a bilingual template gets its own locale's answers — the EN
     half must not inherit the FR free-text overrides and vice versa. */
  const valuesByLang =
    template.delivery === 'bilingual'
      ? {
          en: mergeFieldValues(
            template,
            demoAnswersFor('en'),
            MARKETING_DEMO_ORG.jurisdiction,
            'en',
            formatTodayLabel('en'),
          ),
          fr: mergeFieldValues(
            template,
            demoAnswersFor('fr'),
            MARKETING_DEMO_ORG.jurisdiction,
            'fr',
            formatTodayLabel('fr'),
          ),
        }
      : undefined
  const values = valuesByLang?.[lang] ?? {
    ...computedTokens(MARKETING_DEMO_ORG.jurisdiction, lang, today),
    ...answerLabels(template, answers, lang),
  }
  return { template, blocks, values, valuesByLang, bilingual: template.delivery === 'bilingual' }
}

/** Compact marketing previews show one language; export still ships both for bilingual templates. */
export function compactDocPaperProps(
  preview: NonNullable<ReturnType<typeof buildTemplatePreview>>,
  lang: Lang,
) {
  return {
    values: preview.valuesByLang?.[lang] ?? preview.values,
    bilingual: false as const,
    docLang: lang,
    showBilingualBadge: preview.bilingual === true,
  }
}

/** Resolved demo answer for a wizard field — dates and selects match document output. */
export function demoAnswerDisplay(tid: string, fieldId: string, lang: Lang): string | undefined {
  const template = templateByTid(tid)
  const answers = demoAnswersFor(lang)
  if (!template) return answers[fieldId]
  return answerLabels(template, answers, lang)[fieldId]
}
