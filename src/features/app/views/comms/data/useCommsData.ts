import { useContext } from 'react'
import { CommsDataContext } from './CommsDataContext'
import type { CommsDataContextValue } from './CommsDataContext'

export function useCommsData(): CommsDataContextValue {
  const ctx = useContext(CommsDataContext)
  if (!ctx) throw new Error('useCommsData must be used within a CommsDataProvider')
  return ctx
}
