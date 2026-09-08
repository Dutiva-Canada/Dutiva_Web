import { createContext, useContext } from 'react'
import type {
  SecurityAsset,
  SecurityAccessReview,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './data/types'

export interface SecurityDataValue {
  assets: SecurityAsset[]
  accessReviews: SecurityAccessReview[]
  incidents: SecurityIncident[]
  risks: SecurityRisk[]
  vendorReviews: SecurityVendorReview[]
  loading: boolean
  error: string | null
  addAsset: (asset: SecurityAsset) => void
  addAccessReview: (review: SecurityAccessReview) => void
  addIncident: (incident: SecurityIncident) => void
  addRisk: (risk: SecurityRisk) => void
  addVendorReview: (review: SecurityVendorReview) => void
}

export const SecurityDataContext = createContext<SecurityDataValue | null>(null)

export function useSecurityData(): SecurityDataValue {
  const ctx = useContext(SecurityDataContext)
  if (!ctx) throw new Error('useSecurityData must be used within SecurityDataProvider')
  return ctx
}
