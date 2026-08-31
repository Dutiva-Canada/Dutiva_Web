import { allTemplates } from '@/features/app/documents/catalogue'
import type { DocTemplate } from '@/features/app/documents/data'
import {
  answerLabels,
  bilingualMergeValues,
  computedTokens,
  resolveBlocks,
} from '@/features/app/documents/engine'
import type { Lang } from '@/i18n/core'
import { MARKETING_DEMO_ORG } from './demoOrgContext'

/** Curated templates with strong “before you sign up” preview value. */
export const FEATURED_TEMPLATE_TIDS = ['T01', 'T03', 'T21'] as const

export type FeaturedTemplateTid = (typeof FEATURED_TEMPLATE_TIDS)[number]

/** Sample wizard answers merged into marketing previews — fictional demo employee. */
export const demoMergeFieldAnswers: Record<string, string> = {
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

export function templateByTid(tid: string): DocTemplate | undefined {
  return allTemplates.find((candidate) => candidate.tid === tid)
}

export function buildTemplatePreview(tid: string, lang: Lang) {
  const template = templateByTid(tid)
  if (!template) return null
  const ctx = { ...MARKETING_DEMO_ORG, answers: demoMergeFieldAnswers }
  const blocks = resolveBlocks(template, ctx)
  const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const valuesByLang =
    template.delivery === 'bilingual'
      ? bilingualMergeValues(template, demoMergeFieldAnswers, MARKETING_DEMO_ORG.jurisdiction)
      : undefined
  const values = valuesByLang?.en ?? {
    ...computedTokens(MARKETING_DEMO_ORG.jurisdiction, lang, today),
    ...answerLabels(template, demoMergeFieldAnswers, lang),
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
  if (!template) return demoMergeFieldAnswers[fieldId]
  return answerLabels(template, demoMergeFieldAnswers, lang)[fieldId]
}
