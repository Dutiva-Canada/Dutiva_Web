import { allTemplates } from '@/features/app/documents/catalogue'
import type { DocTemplate } from '@/features/app/documents/data'
import { computedTokens, resolveBlocks } from '@/features/app/documents/engine'
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
  job_title: 'Operations Coordinator',
  department: 'Operations',
  reports_to: 'Amara Osei, Director of Operations',
  work_location: 'Toronto, ON — hybrid (3 days on site)',
  start_date: '2026-09-15',
  employment_type: 'permanent full-time',
  scheduled_hours_per_week: '40',
  regular_hours: 'Monday to Friday, 9:00 a.m. to 5:00 p.m.',
  annual_base_salary: '$68,000',
  pay_frequency: 'bi-weekly',
  pay_period: 'bi-weekly',
  pay_day: 'every other Friday',
  probation_length: '3 months',
  termination_effective_date: '2026-10-03',
  last_day_worked: '2026-10-03',
  notice_period: '8 weeks',
  manager_name: 'Amara Osei',
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
  const values = {
    ...computedTokens(MARKETING_DEMO_ORG.jurisdiction, lang, today),
    ...demoMergeFieldAnswers,
  }
  return { template, blocks, values }
}
