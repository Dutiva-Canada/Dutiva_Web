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
  addRecord: (record: GovernanceRecord) => void
  updateRecord: (record: GovernanceRecord) => void
  removeRecord: (id: string) => Promise<void>
  addDecision: (decision: GovernanceDecision) => void
  updateDecision: (decision: GovernanceDecision) => void
  removeDecision: (id: string) => Promise<void>
  addOfficer: (officer: GovernanceOfficer) => void
  updateOfficer: (officer: GovernanceOfficer) => void
  removeOfficer: (id: string) => Promise<void>
  addShareholder: (shareholder: GovernanceShareholder) => void
  updateShareholder: (shareholder: GovernanceShareholder) => void
  removeShareholder: (id: string) => Promise<void>
}

export const GovernanceDataContext = createContext<GovernanceDataValue | null>(null)

export function useGovernanceData(): GovernanceDataValue {
  const ctx = useContext(GovernanceDataContext)
  if (!ctx) throw new Error('useGovernanceData must be used within GovernanceDataProvider')
  return ctx
}
