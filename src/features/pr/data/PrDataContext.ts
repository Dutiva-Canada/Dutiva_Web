import { createContext, useContext } from 'react'
import type { PrState } from './types'

export interface PrDataContextValue {
  state: PrState | undefined
  loading: boolean
  error: Error | undefined
  refresh: () => Promise<void>
}

export const PrDataContext = createContext<PrDataContextValue | null>(null)

export function usePrData(): PrDataContextValue {
  const ctx = useContext(PrDataContext)
  if (!ctx) throw new Error('usePrData must be used inside PrDataProvider')
  return ctx
}
