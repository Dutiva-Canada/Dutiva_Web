/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import { lazy, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme'
import { router } from './router'

/*
 * Developer annotation overlay — dev + Vercel preview only (src/devtools/).
 *
 * The gate is inlined here on purpose: every term folds to a literal at build
 * time (import.meta.env.DEV and the `__VERCEL_ENV__` define are statically
 * replaced), so in a production build the whole condition collapses to `false`
 * and Rollup eliminates the `false ? lazy(import(...)) : null` branch — the
 * dev-tools chunk is never emitted and the live site ships none of this code.
 * A cross-module boolean const is NOT inlined for that DCE, so it must stay
 * inline. `__VERCEL_ENV__` mirrors src/lib/deployEnv (baked via vite.config).
 */
declare const __VERCEL_ENV__: string

const DevAnnotations =
  import.meta.env.DEV || (typeof __VERCEL_ENV__ === 'string' && __VERCEL_ENV__ === 'preview')
    ? lazy(() => import('@/devtools/DevAnnotations'))
    : null

/**
 * Language providers live inside the route tree (URL-scoped on the public
 * surface, preference-scoped on /app — see routes.tsx), so App only carries
 * the theme.
 */
export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      {DevAnnotations && (
        <Suspense fallback={null}>
          <DevAnnotations />
        </Suspense>
      )}
    </ThemeProvider>
  )
}
