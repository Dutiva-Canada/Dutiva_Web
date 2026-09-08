import { createContext, useContext } from 'react'
import type { RevenueStream, RevenueInvoice } from './data/types'

export interface RevenueDataValue {
  streams: RevenueStream[]
  invoices: RevenueInvoice[]
  loading: boolean
  error: string | null
  addStream: (stream: RevenueStream) => void
  updateStream: (stream: RevenueStream) => void
  removeStream: (id: string) => Promise<void>
  addInvoice: (invoice: RevenueInvoice) => void
  updateInvoice: (invoice: RevenueInvoice) => void
  removeInvoice: (id: string) => Promise<void>
}

export const RevenueDataContext = createContext<RevenueDataValue | null>(null)

export function useRevenueData(): RevenueDataValue {
  const ctx = useContext(RevenueDataContext)
  if (!ctx) throw new Error('useRevenueData must be used within RevenueDataProvider')
  return ctx
}
