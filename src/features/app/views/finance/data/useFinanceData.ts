import { useContext } from 'react'
import { FinanceDataContext } from './FinanceDataContext'
import type { FinanceDataContextValue } from './FinanceDataContext'

export function useFinanceData(): FinanceDataContextValue {
  const ctx = useContext(FinanceDataContext)
  if (!ctx) throw new Error('useFinanceData must be used within a FinanceDataProvider')
  return ctx
}
