import { createContext, useContext } from 'react'
import type { HealthState } from './types'

export interface HealthDataContextValue {
  state: HealthState | undefined
  loading: boolean
  error: Error | undefined
  refresh: () => Promise<void>
}

export const HealthDataContext = createContext<HealthDataContextValue | null>(null)

export function useHealthData(): HealthDataContextValue {
  const ctx = useContext(HealthDataContext)
  if (!ctx) throw new Error('useHealthData must be used inside HealthDataProvider')
  return ctx
}
