import { GovernanceDataProvider } from './GovernanceDataProvider'
import { GovernanceLayout } from './GovernanceLayout'

/**
 * Demo-mode governance workspace — uses Northgate-style fixtures so prospects
 * can preview the register without signing in.
 */
export function GovernanceDemoView() {
  return (
    <GovernanceDataProvider mode="demo">
      <GovernanceLayout />
    </GovernanceDataProvider>
  )
}
