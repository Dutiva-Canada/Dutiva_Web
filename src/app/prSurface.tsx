import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'

/**
 * Lazily composed /pr route element — the standalone, invite-only Dutiva PR
 * communications surface. Same standalone pattern as the invest and health
 * portals: preference-scoped language, shared AuthProvider, its own shell —
 * separate from both the marketing chrome and the /app workspace sidebar.
 *
 * Renders the child route's element: the gated PrPortalLayout for app pages,
 * or the standalone PrLegalPage for /pr/legal/* (public so the sign-in
 * wall's footer links resolve for signed-out visitors).
 */
export function PrPortalSurface() {
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
