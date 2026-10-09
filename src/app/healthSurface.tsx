import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'

/**
 * Lazily composed /health route element — the standalone, invite-only
 * Dutiva Health wellness surface. Same standalone pattern as the invest
 * portal: preference-scoped language, shared AuthProvider, its own shell —
 * separate from both the marketing chrome and the /app workspace sidebar.
 *
 * Renders the child route's element: the gated HealthPortalLayout for app
 * pages, or the standalone HealthLegalPage for /health/legal/* (public so
 * the sign-in wall's footer links resolve for signed-out visitors).
 */
export function HealthPortalSurface() {
  return (
    <LangProvider>
      <AuthProvider>
        <ToastsProvider>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
          <ToastHost />
        </ToastsProvider>
      </AuthProvider>
    </LangProvider>
  )
}
