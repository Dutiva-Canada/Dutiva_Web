import { CommsDataProvider } from './data/CommsDataProvider'
import { CommsLayout } from './CommsLayout'

/**
 * Demo-mode communications workspace. Fixtures are read-only; the data layer
 * still exposes the same API surface as production so the UI components are
 * shared.
 */
export function CommsDemoView() {
  return (
    <CommsDataProvider mode="demo">
      <CommsLayout mode="demo" />
    </CommsDataProvider>
  )
}
