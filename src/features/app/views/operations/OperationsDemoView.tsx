import { OperationsDataProvider } from './OperationsDataProvider'
import { OperationsLayout } from './OperationsLayout'

export function OperationsDemoView() {
  return (
    <OperationsDataProvider mode="demo">
      <OperationsLayout />
    </OperationsDataProvider>
  )
}
