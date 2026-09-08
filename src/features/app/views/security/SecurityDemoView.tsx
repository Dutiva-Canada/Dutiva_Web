import { SecurityDataProvider } from './SecurityDataProvider'
import { SecurityLayout } from './SecurityLayout'

/**
 * Demo-mode security workspace — uses fixtures so prospects can preview the
 * posture tracker without signing in.
 */
export function SecurityDemoView() {
  return (
    <SecurityDataProvider mode="demo">
      <SecurityLayout />
    </SecurityDataProvider>
  )
}
