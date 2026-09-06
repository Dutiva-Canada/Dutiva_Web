import { FinanceDataProvider } from './data/FinanceDataProvider'
import { FinanceLayout } from './FinanceLayout'

/**
 * Demo-mode finance workspace. Fixtures are read-only; the data layer still
 * exposes the same API surface as production so the UI components are shared.
 */
export function FinanceDemoView() {
  return (
    <FinanceDataProvider mode="demo">
      <FinanceLayout mode="demo" />
    </FinanceDataProvider>
  )
}
