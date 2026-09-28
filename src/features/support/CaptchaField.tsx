import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import { useTheme } from '@/lib/themeContext'
import {
  CAPTCHA_PROVIDER,
  CAPTCHA_SCRIPT_URLS,
  CAPTCHA_SITE_KEY,
  isCaptchaConfigured,
} from './captcha'
import type { CaptchaProvider } from './captcha'

/**
 * CAPTCHA widget for the public Contact form — the human check that backs the
 * honeypot and the per-IP/per-email rate limits in
 * `create-public-support-ticket`. Verification happens server-side
 * (`captcha.ts`, mirrored in the function); this only obtains the token.
 *
 * **Inert unless configured.** With no `VITE_CAPTCHA_SITE_KEY` the component
 * renders nothing and the form submits exactly as it does today — no third-party
 * script is fetched, so prerender, tests, and local dev are untouched. Setting
 * the site key without the server-side secret is a no-op too (the server simply
 * ignores the token); the operator sets both together, per the runbook.
 *
 * Marketing-surface tokens only (bg/border/text/text-2/text-3, risk-*) —
 * app-surface tokens like bg-surface are undefined on this page.
 */

/** The subset of the Turnstile/hCaptcha global we use — both expose it. */
interface CaptchaApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
      theme: string
      language: string
    },
  ) => string | undefined
  reset: (widgetId?: string) => void
  remove?: (widgetId: string) => void
}

const GLOBAL_NAME: Record<CaptchaProvider, string> = {
  turnstile: 'turnstile',
  hcaptcha: 'hcaptcha',
}

/**
 * One script load per provider per page, shared by every widget instance. The
 * promise is cached rather than the boolean so concurrent mounts await the same
 * load instead of injecting duplicate tags.
 */
const scriptLoads = new Map<CaptchaProvider, Promise<CaptchaApi>>()

function loadCaptchaScript(provider: CaptchaProvider): Promise<CaptchaApi> {
  const cached = scriptLoads.get(provider)
  if (cached) return cached

  const load = new Promise<CaptchaApi>((resolve, reject) => {
    const globalName = GLOBAL_NAME[provider]
    const existing = (window as unknown as Record<string, CaptchaApi | undefined>)[globalName]
    if (existing) {
      resolve(existing)
      return
    }
    const script = document.createElement('script')
    script.src = CAPTCHA_SCRIPT_URLS[provider]
    script.async = true
    script.defer = true
    script.onload = () => {
      const api = (window as unknown as Record<string, CaptchaApi | undefined>)[globalName]
      if (api) resolve(api)
      else reject(new Error(`${provider} loaded without exposing its API`))
    }
    script.onerror = () => reject(new Error(`Could not load the ${provider} script`))
    document.head.appendChild(script)
  })
  // A failed load must not be cached as permanent — a later mount (or a user
  // who regains connectivity) should get a fresh attempt rather than a
  // rejected promise forever.
  load.catch(() => scriptLoads.delete(provider))
  scriptLoads.set(provider, load)
  return load
}

interface CaptchaFieldProps {
  /** Called with the solved token, or `null` when it expires or errors. */
  readonly onToken: (token: string | null) => void
  /**
   * Increment to force a fresh challenge. Tokens are single-use — after a
   * rejected submit the old one is spent, so the widget must be reset before
   * the customer can try again.
   */
  readonly resetSignal?: number
  /** Overridable for tests; defaults to the build-time site key. */
  readonly siteKey?: string
  readonly provider?: CaptchaProvider
}

export function CaptchaField({
  onToken,
  resetSignal = 0,
  siteKey = CAPTCHA_SITE_KEY,
  provider = CAPTCHA_PROVIDER,
}: CaptchaFieldProps) {
  const { x, lang } = useI18n()
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<CaptchaApi | null>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)
  const [failed, setFailed] = useState(false)

  // `onToken` is a fresh closure each render; hold it in a ref so the widget is
  // rendered once rather than torn down and re-rendered on every keystroke in
  // the parent form.
  const onTokenRef = useRef(onToken)
  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!isCaptchaConfigured(siteKey)) return
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    loadCaptchaScript(provider)
      .then((api) => {
        if (cancelled) return
        apiRef.current = api
        widgetIdRef.current = api.render(container, {
          sitekey: siteKey!,
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => {
            onTokenRef.current(null)
            setFailed(true)
          },
          theme,
          language: lang,
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      const id = widgetIdRef.current
      if (id && apiRef.current?.remove) {
        try {
          apiRef.current.remove(id)
        } catch {
          // The provider tears its own widget down with the container; a
          // failure here must never break unmounting the form.
        }
      }
      widgetIdRef.current = undefined
    }
    // Theme and language are render-time options, so a change re-renders the
    // widget — that is the provider's supported way to restyle/relocalize it.
  }, [siteKey, provider, theme, lang])

  useEffect(() => {
    if (resetSignal === 0) return
    onTokenRef.current(null)
    setFailed(false)
    if (apiRef.current) apiRef.current.reset(widgetIdRef.current)
  }, [resetSignal])

  if (!isCaptchaConfigured(siteKey)) return null

  return (
    <div className="flex flex-col gap-[6px]">
      <div ref={containerRef} data-testid="captcha-widget" />
      {failed ? (
        <p role="alert" className="m-0 text-[12.5px] leading-[1.5] text-risk-fg">
          {x(M.support_captcha_unavailable)}
        </p>
      ) : (
        <p className="m-0 text-[12px] leading-[1.5] text-text-3">{x(M.support_captcha_hint)}</p>
      )}
    </div>
  )
}
