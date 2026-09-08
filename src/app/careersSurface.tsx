import { Suspense, lazy } from 'react'
import type { Lang } from '@/i18n/core'
import { ForcedLangProvider } from '@/i18n/ForcedLangProvider'
import { LangProvider } from '@/i18n/LangProvider'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'

/**
 * Lazily composed /careers route elements. The public job board uses
 * URL-scoped language (ForcedLangProvider, like the marketing surface) so
 * `/careers` and `/fr/carrieres` are crawlable locale pairs. The candidate
 * portal uses LangProvider (persisted preference, like the app surface)
 * since it is auth-gated and not crawled.
 */

const CareersLayout = lazy(() =>
  import('@/features/careers/CareersLayout').then((m) => ({ default: m.CareersLayout })),
)
const PortalLayout = lazy(() =>
  import('@/features/careers/portal/PortalLayout').then((m) => ({ default: m.PortalLayout })),
)

/** /careers — public job board (URL-scoped language, no auth required). */
export function CareersSurface({ lang }: { readonly lang: Lang }) {
  return (
    <ForcedLangProvider lang={lang}>
      <AuthProvider>
        <ToastsProvider>
          <Suspense fallback={null}>
            <CareersLayout />
          </Suspense>
          <ToastHost />
        </ToastsProvider>
      </AuthProvider>
    </ForcedLangProvider>
  )
}

/** /careers/portal — authenticated candidate portal (preference-scoped language, requires auth). */
export function CareersPortalSurface() {
  return (
    <LangProvider>
      <AuthProvider>
        <ToastsProvider>
          <Suspense fallback={null}>
            <PortalLayout />
          </Suspense>
          <ToastHost />
        </ToastsProvider>
      </AuthProvider>
    </LangProvider>
  )
}
