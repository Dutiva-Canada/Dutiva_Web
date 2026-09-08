import type { Bi } from '@/i18n/core'

/** Lightweight CRM record states. */
export type CrmContactStatus = 'lead' | 'prospect' | 'customer' | 'partner' | 'churned'
export type CrmDealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type CrmActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task'

export interface CrmCompany {
  id: string
  name: string
  domain?: string
  industry?: string
  size?: string
  notes?: Bi
}

export interface CrmContact {
  id: string
  name: string
  email?: string
  phone?: string
  companyId?: string
  role?: string
  status: CrmContactStatus
  notes?: Bi
}

export interface CrmDeal {
  id: string
  title: string
  companyId?: string
  contactId?: string
  stage: CrmDealStage
  value?: number
  currency: string
  closeDate?: string
  notes?: Bi
}

export interface CrmActivity {
  id: string
  contactId?: string
  companyId?: string
  dealId?: string
  type: CrmActivityType
  date: string
  summary: Bi
  followUpDate?: string
}

export interface CrmState {
  companies: CrmCompany[]
  contacts: CrmContact[]
  deals: CrmDeal[]
  activities: CrmActivity[]
}
