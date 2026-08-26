import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { authMessages as M } from '@/i18n/messages/auth'
import { usePublicPath } from '@/seo/usePublicPath'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/app/auth/authContext'
import { peekPendingCheckout } from '@/features/app/billing/pendingCheckout'
import { AuthPanel } from '@/features/app/auth/AuthPanel'
import { LangToggle, ThemeToggle } from './ShellControls'

/** Where an unauthorized visit to /app/* wanted to end up (see RequireAdminSession). */
interface EntryLocationState {
  from?: { pathname: string }
}

/** Wordmark on the app surface (themed) — used in the mobile/tablet top bar.
    Links back to the marketing home page (same as the marketing header logo). */
function AppWordmark() {
  const { home } = usePublicPath()
  return (
    <Link
      to={home('top')}
      className="flex w-fit items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
    >
      {/* Decorative: the adjacent wordmark text already names the brand. */}
      <img
        src="/brand/dutiva-leaf.png"
        alt=""
        className="block h-6.5 w-auto logo-glow"
      />
      <span className="font-display text-[17px] font-bold tracking-[-0.01em]">
        Duti<span className="text-gold-dot">va</span>
      </span>
    </Link>
  )
}

/**
 * Left brand rail — always a dark navy surface regardless of theme, so its
 * copy uses explicit light/gold colors rather than the theme-flipping tokens.
 * Hidden below `lg`, where the form panel stands on its own.
 */
function BrandRail() {
  const { x } = useI18n()
  const { home } = usePublicPath()
  const points = [M.auth_brand_point_1, M.auth_brand_point_2, M.auth_brand_point_3]

  return (
    <aside
      className="entry-brand-rail relative hidden w-[45%] max-w-150 shrink-0 flex-col justify-between overflow-hidden px-13 py-11 lg:flex"
    >
      {/* Gold glow accents */}
      <div
        aria-hidden="true"
        className="entry-brand-glow-tr pointer-events-none absolute -top-32.5 -right-30 h-85 w-85 rounded-full opacity-[0.18]"
      />
      <div
        aria-hidden="true"
        className="entry-brand-glow-bl pointer-events-none absolute -bottom-37.5 -left-27.5 h-80 w-80 rounded-full opacity-[0.12]"
      />

      <Link
        to={home('top')}
        className="relative flex w-fit items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        {/* Decorative: the adjacent wordmark text already names the brand. */}
        <img
          src="/brand/dutiva-leaf.png"
          alt=""
          className="entry-brand-leaf-glow block h-7 w-auto"
        />
        <span className="font-display text-[18px] font-bold tracking-[-0.01em] text-white">
          Duti<span className="text-gold-on-dark">va</span>
        </span>
      </Link>

      <div className="relative">
        <div className="mb-5.5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--dutiva-gold-rgb),0.28)] bg-[rgba(var(--dutiva-gold-rgb),0.10)] px-3.25 py-1.5 text-[12px] font-semibold text-gold-on-dark">
          <Sparkle size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {x(M.auth_brand_badge)}
        </div>
        <h2 className="m-0 mb-4 max-w-115 font-display text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] text-white">
          {x(M.auth_brand_headline)}
        </h2>
        <p className="m-0 mb-7.5 max-w-107.5 text-[14.5px] leading-[1.6] text-white/70">
          {x(M.auth_brand_sub)}
        </p>
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {points.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-2.75 text-[13.5px] leading-normal text-white/85"
            >
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--dutiva-gold-rgb),0.16)] text-gold-on-dark">
                <Check size={12} strokeWidth={2.5} aria-hidden="true" />
              </span>
              {x(point)}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative text-[12px] text-white/45">{x(M.auth_brand_footer)}</div>
    </aside>
  )
}

/**
 * Direct-entry card for local dev / tests, where Supabase isn't configured and
 * RequireAdminSession is a no-op — no sign-in is needed, so offer a plain way
 * into the workspace. Matches every feature's "degrade to signed-out" posture.
 */
function EnterWorkspaceCard() {
  const { x } = useI18n()
  return (
    <div className="rounded-[18px] border border-border bg-surface p-7 text-center shadow-[0_20px_50px_-24px_rgba(13,27,42,0.35)] min-[640px]:p-8">
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(M.auth_welcome_title)}
      </h1>
      <p className="mx-auto mt-2 mb-5.5 max-w-75 text-[13.5px] leading-normal text-text-3">
        {x(M.auth_welcome_sub)}
      </p>
      <Link
        to="/app/home"
        className="flex h-11.5 w-full items-center justify-center rounded-[11px] bg-navy text-[14px] font-semibold text-white"
      >
        {x(M.auth_enter_workspace)}
      </Link>
    </div>
  )
}

function FormColumn({ children }: { readonly children: ReactNode }) {
  const { x, lang } = useI18n()
  const legalPath = lang === 'fr' ? '/fr/juridique' : '/legal'

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 py-5 min-[640px]:px-10">
        <div className="lg:hidden">
          <AppWordmark />
        </div>
        {/* ml-auto keeps the controls right-aligned at lg+, where the wordmark
            above is display:none and would otherwise let justify-between pull
            this lone flex child to the left edge. */}
        <div className="ml-auto flex items-center gap-2.5">
          <LangToggle />
          <ThemeToggle
            className="flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-inset text-text-2"
            iconSize={17}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-10 min-[640px]:px-10">
        <div className="w-full max-w-100 animate-[fadeInUp_.4s_ease]">{children}</div>
      </div>

      <div className="px-6 pb-6.5 text-center min-[640px]:px-10">
        <p className="m-0 text-[11.5px] text-text-faint">
          © Dutiva Canada Inc. ·{' '}
          <Link to={legalPath} className="hover:text-text-muted">
            {x(M.auth_legal_link)}
          </Link>
        </p>
      </div>
    </main>
  )
}

/**
 * App entry stage (/app/welcome) — the dedicated sign in / sign up page. A
 * two-panel layout: a dark navy brand rail (hidden below `lg`) beside the
 * auth form. With Supabase configured the workspace is gated — invite-only,
 * for the admin account or anyone on the beta list (see
 * RequireAdminSession) — so the form emails a passwordless magic link via
 * AuthPanel; without it, CTAs enter directly, matching every feature's
 * "degrade to signed-out" posture in local dev/tests. An already authorized
 * session is redirected straight into the workspace; a signed-in session
 * that isn't invited sees AuthPanel's own "not authorized" state instead of
 * the form (the magic link is sent to any address — membership is checked
 * only after sign-in, never as a pre-send guess at someone else's
 * eligibility; see authContext's note on signInWithEmail).
 */
export function EntryStage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { p } = usePublicPath()
  const { status, authorized: membership } = useAuth()

  const gated = !!supabase
  const authorized = status === 'signed-in' && membership === true
  /* The membership RPC hasn't resolved yet — stay blank rather than
     flashing AuthPanel's "not authorized" state for what may turn out to be
     a perfectly good session. */
  const pending = status === 'signed-in' && membership === null

  useEffect(() => {
    if (!authorized) return
    const from = (location.state as EntryLocationState | null)?.from
    navigate(from?.pathname ?? '/app/home', { replace: true })
  }, [authorized, location.state, navigate])

  useEffect(() => {
    if (status !== 'signed-in' || membership !== false) return
    if (!peekPendingCheckout()) return
    navigate(p('pricing'), { replace: true })
  }, [status, membership, navigate, p])

  return (
    <div className="surface-app min-h-screen bg-bg font-sans text-text">
      <div className="flex min-h-screen">
        <BrandRail />
        <FormColumn>
          {gated ? pending ? null : !authorized && <AuthPanel /> : <EnterWorkspaceCard />}
        </FormColumn>
      </div>
    </div>
  )
}
