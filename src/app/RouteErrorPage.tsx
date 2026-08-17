/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import { useEffect, useState } from 'react'
import { useLocation, useRouteError } from 'react-router-dom'
import { langOfPath } from '@/seo/routes'
import { reportRouteError } from '@/lib/errorReporting'
import { supportChannel } from '@/config/support'

const PILL_STYLE = { minHeight: 44, padding: '0 20px' } as const

const SUPPORT_EMAIL = supportChannel('support').email

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

/**
 * Router-level error boundary for every route (wired as the root
 * `errorElement` in routes.tsx). Without it React Router falls back to its
 * built-in developer screen — the raw stack trace and a "Hey developer 👋"
 * note — which is what visitors saw when a render threw in production.
 *
 * Deliberately self-contained: it renders above the locale providers and must
 * survive whatever broke below it, so it takes no context, loads no chunk,
 * and links out with plain anchors (a full document load, not a client-side
 * navigation through the router that just failed). Language comes from the
 * URL prefix, the same rule the public surface uses.
 *
 * The site ships a service worker, so a stale mix of cached assets is one
 * plausible way to get here: "Clear the offline cache" is the self-serve
 * escape hatch — it unregisters the worker, drops every cache, and reloads.
 *
 * The support address comes from `src/config/support.ts` like everywhere else
 * (it is pure bilingual data — no context and no lazy chunk, so it respects the
 * self-contained rule above). The Contact link is a plain anchor for the same
 * reason the others are: routing through the router that just threw is not a
 * bet worth making on an error page.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  const [clearing, setClearing] = useState(false)
  const lang = langOfPath(useLocation().pathname)
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en)

  useEffect(() => {
    console.error('Unhandled route error', error)
    /* Report to the telemetry sink (no-op unless installed — prod/preview
       only). Runs in an effect, so never during SSR/prerender and never
       before first paint. */
    reportRouteError(error)
  }, [error])

  const clearOfflineCache = async () => {
    setClearing(true)
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
    } catch {
      /* Best effort — reload regardless. */
    }
    window.location.reload()
  }

  return (
    <main className="surface-marketing dutiva-surface min-h-screen text-text">
      <section className="mx-auto max-w-[840px] px-6 pt-20 pb-24 text-center">
        <span className="badge">{L('Something went wrong', 'Une erreur est survenue')}</span>
        <h1 className="mt-5 font-display text-[clamp(2.125rem,4vw,3.25rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-text">
          {L('This page could not be displayed.', 'Cette page n’a pas pu s’afficher.')}
        </h1>
        <p className="mx-auto mt-4 max-w-[62ch] text-lg leading-[1.6] text-text-2">
          {L(
            'Reloading usually fixes it. If it keeps happening, clearing the offline cache reinstalls the latest version of the site.',
            'Recharger la page règle généralement le problème. Si l’erreur persiste, vider la cache hors ligne réinstalle la version la plus récente du site.',
          )}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="gold-button"
            style={PILL_STYLE}
            onClick={() => window.location.reload()}
          >
            {L('Reload the page', 'Recharger la page')}
          </button>
          <button
            type="button"
            className="ghost-button"
            style={PILL_STYLE}
            disabled={clearing}
            onClick={() => void clearOfflineCache()}
          >
            {L('Clear the offline cache', 'Vider la cache hors ligne')}
          </button>
          <a href={lang === 'fr' ? '/fr' : '/'} className="ghost-button" style={PILL_STYLE}>
            {L('Go to the homepage', 'Aller à la page d’accueil')}
          </a>
          <a
            href={lang === 'fr' ? '/fr/contact' : '/contact'}
            className="ghost-button"
            style={PILL_STYLE}
          >
            {L('Contact support', 'Contacter le soutien')}
          </a>
        </div>
        <p className="mx-auto mt-8 max-w-[52ch] text-sm text-text-3">
          {L('Technical detail: ', 'Détail technique : ')}
          <span className="font-mono">{messageOf(error)}</span>
        </p>
        <p className="mx-auto mt-2 max-w-[52ch] text-sm text-text-3">
          {L('Still stuck? Write to ', 'Toujours bloqué? Écrivez à ')}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  )
}
