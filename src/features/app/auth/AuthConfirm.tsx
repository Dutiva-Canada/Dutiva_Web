import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { useI18n } from '@/i18n/context'
import { authMessages as M } from '@/i18n/messages/auth'
import { supabase } from '@/lib/supabaseClient'
import { safeNextPath } from './safeNextPath'

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'magiclink',
  'email',
  'recovery',
  'invite',
  'email_change',
])

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_OTP_TYPES.has(value as EmailOtpType)
}

/**
 * Magic-link landing route (/app/auth/confirm). The sign-in email links here
 * with a `token_hash` (and `type`) in the query string; we exchange it for a
 * session with verifyOtp, then enter the workspace.
 *
 * Why this instead of the default `/auth/v1/verify` GET link: that link spends
 * its one-time token the moment anything fetches it, so email-provider link
 * scanners (Gmail/Outlook prefetch the URL from Google/Microsoft IPs) burn the
 * token before the user clicks — the classic "Email link is invalid or has
 * expired". verifyOtp with a token_hash also needs no PKCE code-verifier, so a
 * link opened on a different device than it was requested from still works.
 *
 * That was not enough on its own. This route originally spent the token from an
 * effect on mount, on the assumption that a scanner "(no JS)" would never reach
 * it. Google Workspace's pre-delivery scanner does run JavaScript: on
 * 2026-08-08 it loaded this page 33s after the email was sent, booted the SPA,
 * and completed verifyOtp from a Google IP (74.125.184.186) — after which every
 * real click 403'd with "One-time token not found". So the token is now spent
 * only on a deliberate click: scanners render pages, they do not press buttons.
 * The truly scanner-proof path is the typed 6-digit code (see AuthPanel and
 * authContext's verifyEmailCode); this gate is what protects any link still in
 * flight, or a template that keeps one.
 *
 * The `?code=` branch is exempt because PKCE is already scanner-proof — the
 * exchange needs a code_verifier from the requesting browser's storage, which a
 * scanner does not have — so it stays one-click. The session branch covers a
 * fragment link that supabase-js auto-detected on load and spends nothing.
 *
 * Requires the Supabase email template to point here, e.g.
 *   {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink
 * (RedirectTo is the emailRedirectTo set in AuthProvider — the current origin's
 * /app/auth/confirm). See docs/AUTH_EMAIL_TEMPLATES.md.
 */
export function AuthConfirm() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const [failed, setFailed] = useState(false)
  /** Set when a link carries a spendable token, held until the visitor clicks. */
  const [pending, setPending] = useState<{ tokenHash: string; type: EmailOtpType } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const ran = useRef(false)

  /* `?next=` is the surface the sign-in started from (e.g. the candidate
     portal passes /careers/portal). Validated to root-relative only; anything
     else falls back to the workspace home. */
  const destination = safeNextPath(params.get('next')) ?? '/app/home'

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!supabase) {
      navigate('/app/welcome', { replace: true })
      return
    }
    const client = supabase

    /* Supabase appends these when the link itself is rejected upstream. It
       reports the error in the query string on the verify-endpoint flow, but
       in the URL fragment on the implicit flow (#error=…&error_description=…),
       so check both. */
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
    const linkError =
      params.get('error_description') ??
      params.get('error') ??
      hashParams.get('error_description') ??
      hashParams.get('error')
    if (linkError) {
      console.error('auth confirm: link rejected —', linkError)
      setFailed(true)
      return
    }

    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    const code = params.get('code')

    if (tokenHash && isEmailOtpType(type)) {
      /* Do not spend it here — wait for a click. */
      setPending({ tokenHash, type })
      return
    }

    void (async () => {
      try {
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          /* A fragment-style link may have been auto-detected on load. */
          const { data } = await client.auth.getSession()
          if (!data.session) throw new Error('No sign-in token in the confirmation link.')
        }
        navigate(destination, { replace: true })
      } catch (error) {
        console.error('auth confirm: verification failed —', error)
        setFailed(true)
      }
    })()
  }, [navigate, params, location.hash, destination])

  const confirm = () => {
    if (!supabase || !pending) return
    const client = supabase
    setVerifying(true)
    void (async () => {
      try {
        const { error } = await client.auth.verifyOtp({
          token_hash: pending.tokenHash,
          type: pending.type,
        })
        if (error) throw error
        navigate(destination, { replace: true })
      } catch (error) {
        console.error('auth confirm: verification failed —', error)
        setFailed(true)
      } finally {
        setVerifying(false)
      }
    })()
  }

  if (!supabase) return null

  return (
    <div className="surface-app flex min-h-screen items-center justify-center bg-bg px-[24px] font-sans text-text">
      <div className="w-full max-w-[420px] rounded-[16px] border border-border bg-surface p-[28px] text-center shadow-[0_24px_60px_-20px_rgba(27,36,48,0.25)]">
        {failed ? (
          <div className="flex flex-col gap-[12px]" role="alert">
            <h1 className="m-0 font-display text-[18px] font-semibold text-text">
              {x(M.auth_confirm_error_title)}
            </h1>
            <p className="m-0 text-[13.5px] text-text-muted">{x(M.auth_confirm_error_body)}</p>
            <Link
              to={destination === '/app/home' ? '/app/welcome' : destination}
              className="self-center rounded-[8px] bg-navy px-[16px] py-[9px] text-[13.5px] font-semibold text-white"
            >
              {x(M.auth_confirm_retry)}
            </Link>
          </div>
        ) : pending && !verifying ? (
          <div className="flex flex-col gap-[14px]">
            <p className="m-0 text-[13.5px] leading-[1.5] text-text-2">
              {x(M.auth_confirm_prompt)}
            </p>
            <button
              type="button"
              onClick={confirm}
              className="cursor-pointer self-center rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[13.5px] font-semibold text-white"
            >
              {x(M.auth_confirm_cta)}
            </button>
          </div>
        ) : (
          <p className="m-0 text-[14px] text-text-2" role="status">
            {x(M.auth_confirm_verifying)}
          </p>
        )}
      </div>
    </div>
  )
}
