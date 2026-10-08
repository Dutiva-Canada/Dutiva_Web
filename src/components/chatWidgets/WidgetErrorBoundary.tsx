import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportRecoverableError } from '@/lib/errorReporting'
import { WidgetFallback } from './WidgetFallback'

/**
 * Last line of the "a widget never throws" guarantee. The schema rejects
 * malformed specs and the components are vetted, but a runtime edge that
 * still throws should not propagate to RouteErrorPage and take the whole
 * chat surface down — the card degrades to the same quiet fallback an
 * invalid spec gets, and the crash still reaches telemetry with its
 * component stack.
 */
export class WidgetErrorBoundary extends Component<
  { readonly children: ReactNode },
  { readonly failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    reportRecoverableError(error, { componentStack: errorInfo.componentStack ?? undefined })
  }

  override render() {
    return this.state.failed ? <WidgetFallback /> : this.props.children
  }
}
