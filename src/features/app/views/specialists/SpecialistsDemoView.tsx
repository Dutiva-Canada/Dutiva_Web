import { SpecialistsDataProvider } from './SpecialistsDataProvider'
import { SpecialistsLayout } from './SpecialistsLayout'

export function SpecialistsDemoView() {
  return (
    <SpecialistsDataProvider mode="demo">
      <SpecialistsLayout />
    </SpecialistsDataProvider>
  )
}
