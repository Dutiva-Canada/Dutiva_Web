import { bi } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
import type { CrmActivityType, CrmContactStatus, CrmDealStage } from './types'

export function toBi(value: string, lang: Lang): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? bi(`[EN review] ${text}`, text)
    : bi(text, `[FR review] ${text}`)
}

export function fromBi(value: Bi | undefined, lang: Lang): string {
  if (!value) return ''
  return value[lang] ?? value.en
}

export const CRM_CONTACT_STATUSES = [
  'lead',
  'prospect',
  'customer',
  'partner',
  'churned',
] as const satisfies readonly CrmContactStatus[]

export const CRM_DEAL_STAGES = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const satisfies readonly CrmDealStage[]

export const CRM_ACTIVITY_TYPES = [
  'call',
  'email',
  'meeting',
  'note',
  'task',
] as const satisfies readonly CrmActivityType[]
