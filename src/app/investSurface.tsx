import { Suspense, lazy } from 'react'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'

/**
 * Lazily composed /invest route element — the standalone, invite-only
 * invest portal. Like the candidate portal: preference-scoped language
 * (auth-gated, not crawled), shared AuthProvider, its own shell — separate
 * from both the marketing chrome and the /app workspace sidebar.
 */
const InvestPortalLayout = lazy(() =>
  import('@/features/invest/portal/InvestPortalLayout').then((m) => ({
    default: m.InvestPortalLayout,
  })),
)

/** /invest — authenticated + invest_access-gated portal. */
export function InvestPortalSurface() {
  return (
    <LangProvider>
      <AuthProvider>
        <ToastsProvider>
          <Suspense fallback={null}>
            <InvestPortalLayout />
          </Suspense>
          <ToastHost />
        </ToastsProvider>
      </AuthProvider>
    </LangProvider>
  )
}
