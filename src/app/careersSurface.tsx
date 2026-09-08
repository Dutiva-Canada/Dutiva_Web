import { Suspense, lazy } from 'react'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'

/**
 * Lazily composed /careers route elements. The careers surface is a
 * separate third surface — not marketing (no locale URLs, no SEO registry)
 * and not the workspace (no org membership, no admin gate). It uses
 * LangProvider (persisted language preference, like the app surface) so
 * both the public job board and the authenticated candidate portal share
 * one language state.
 */

const CareersLayout = lazy(() =>
  import('@/features/careers/CareersLayout').then((m) => ({ default: m.CareersLayout })),
)
const PortalLayout = lazy(() =>
  import('@/features/careers/portal/PortalLayout').then((m) => ({ default: m.PortalLayout })),
)

/** Provider stack for the careers surface. */
function CareersProviders({ children }: { readonly children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>
        <ToastsProvider>
          {children}
          <ToastHost />
        </ToastsProvider>
      </AuthProvider>
    </LangProvider>
  )
}

/** /careers — public job board (no auth required). */
export function CareersSurface() {
  return (
    <CareersProviders>
      <Suspense fallback={null}>
        <CareersLayout />
      </Suspense>
    </CareersProviders>
  )
}

/** /careers/portal — authenticated candidate portal (requires auth). */
export function CareersPortalSurface() {
  return (
    <CareersProviders>
      <Suspense fallback={null}>
        <PortalLayout />
      </Suspense>
    </CareersProviders>
  )
}
