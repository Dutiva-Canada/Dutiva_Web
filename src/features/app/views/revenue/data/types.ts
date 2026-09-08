export type RevenueStreamType = 'recurring' | 'one_time'
export type RevenueStreamStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type RevenueStreamFrequency = 'monthly' | 'quarterly' | 'annually'
export type RevenueCurrency = 'CAD' | 'USD' | 'EUR' | 'GBP'
export type RevenueInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface RevenueStream {
  id: string
  organization_id: string
  name: string
  stream_type: RevenueStreamType
  status: RevenueStreamStatus
  amount: number
  currency: RevenueCurrency
  frequency: RevenueStreamFrequency | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RevenueInvoice {
  id: string
  organization_id: string
  stream_id: string | null
  customer_name: string
  amount: number
  currency: RevenueCurrency
  status: RevenueInvoiceStatus
  issue_date: string | null
  due_date: string | null
  paid_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RevenueSummary {
  streams: RevenueStream[]
  invoices: RevenueInvoice[]
}
