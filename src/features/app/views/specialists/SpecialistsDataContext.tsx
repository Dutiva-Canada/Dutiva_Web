import { createContext, useContext } from 'react'
import type { Specialist, SpecialistEngagement } from './data/types'

export interface SpecialistsDataValue {
  specialists: Specialist[]
  engagements: SpecialistEngagement[]
  loading: boolean
  error: string | null
  addSpecialist: (specialist: Specialist) => void
  updateSpecialist: (specialist: Specialist) => void
  addEngagement: (engagement: SpecialistEngagement) => void
  updateEngagement: (engagement: SpecialistEngagement) => void
}

export const SpecialistsDataContext = createContext<SpecialistsDataValue | null>(null)

export function useSpecialistsData(): SpecialistsDataValue {
  const ctx = useContext(SpecialistsDataContext)
  if (!ctx) throw new Error('useSpecialistsData must be used within SpecialistsDataProvider')
  return ctx
}
