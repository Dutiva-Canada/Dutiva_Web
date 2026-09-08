import { createContext, useContext } from 'react'
import type {
  GovernanceRecord,
  GovernanceDecision,
  GovernanceOfficer,
  GovernanceShareholder,
} from './data/types'

export interface GovernanceDataValue {
  records: GovernanceRecord[]
  decisions: GovernanceDecision[]
  officers: GovernanceOfficer[]
  shareholders: GovernanceShareholder[]
  loading: boolean
  error: string | null
}

export const GovernanceDataContext = createContext<GovernanceDataValue | null>(null)

export function useGovernanceData(): GovernanceDataValue {
  const ctx = useContext(GovernanceDataContext)
  if (!ctx) throw new Error('useGovernanceData must be used within GovernanceDataProvider')
  return ctx
}
