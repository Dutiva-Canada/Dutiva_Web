import { createContext, useContext } from 'react'
import type {
  OperationsProject,
  OperationsVendor,
  OperationsQualityCheck,
  OperationsTechnology,
  OperationsLogistics,
} from './data/types'

export interface OperationsDataValue {
  projects: OperationsProject[]
  vendors: OperationsVendor[]
  qualityChecks: OperationsQualityCheck[]
  technology: OperationsTechnology[]
  logistics: OperationsLogistics[]
  loading: boolean
  error: string | null
  addProject: (project: OperationsProject) => void
  updateProject: (project: OperationsProject) => void
  addVendor: (vendor: OperationsVendor) => void
  updateVendor: (vendor: OperationsVendor) => void
  addQualityCheck: (check: OperationsQualityCheck) => void
  updateQualityCheck: (check: OperationsQualityCheck) => void
  addTechnology: (technology: OperationsTechnology) => void
  updateTechnology: (technology: OperationsTechnology) => void
  addLogistics: (logistics: OperationsLogistics) => void
  updateLogistics: (logistics: OperationsLogistics) => void
}

export const OperationsDataContext = createContext<OperationsDataValue | null>(null)

export function useOperationsData(): OperationsDataValue {
  const ctx = useContext(OperationsDataContext)
  if (!ctx) throw new Error('useOperationsData must be used within OperationsDataProvider')
  return ctx
}
