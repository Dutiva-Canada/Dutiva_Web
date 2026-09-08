import { RevenueDataProvider } from './RevenueDataProvider'
import { RevenueLayout } from './RevenueLayout'

/**
 * Demo-mode revenue workspace — uses fixtures so prospects can preview the
 * streams and invoices view without signing in.
 */
export function RevenueDemoView() {
  return (
    <RevenueDataProvider mode="demo">
      <RevenueLayout />
    </RevenueDataProvider>
  )
}
