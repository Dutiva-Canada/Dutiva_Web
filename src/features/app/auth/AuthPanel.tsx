import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { authMessages as M } from '@/i18n/messages/auth'
import { usePublicPath } from '@/seo/usePublicPath'
import { helpArticleBySlug, helpDocPath, seoRoute } from '@/seo/routes'
import { supportChannel } from '@/config/support'
import { useAuth } from './authContext'

type Mode = 'signin' | 'signup'

const SUPPORT_EMAIL = supportChannel('support').email

/** Shared card chrome so every state (form / sent / signed-in) reads as one panel. */
const cardClass =
  'rounded-[18px] border border-border bg-surface p-[28px] shadow-[0_20px_50px_-24px_rgba(13,27,42,0.35)] min-[640px]:p-[32px]'
const fieldClass =
  'h-[46px] w-full rounded-[11px] border border-border bg-bg px-[14px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[6px] block text-[12.5px] font-semibold text-text-2'
const primaryBtnClass =
  'flex h-[46px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60'

/**
 * The dedicated sign in / sign up card rendered on /app/welcome (see
 * EntryStage). Passwordless throughout: both tabs email a magic link (the
 * sign-up tab also captures a display name). Renders three states — the
 * form, the "check your inbox" confirmation, and a "signed in on the wrong
 * account" notice for a session that isn't the invite-only account (an
 * authorized session is redirected away before this ever mounts).
 *
 * Only shown when Supabase is configured; local dev/tests get the direct
 * "enter workspace" card from EntryStage instead. No prototype counterpart.
 */
export function AuthPanel() {
  const { x, L, lang } = useI18n()
  const { legalDoc, p } = usePublicPath()
  const { status, session, signInWithEmail, verifyEmailCode, signOut } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  /** The emailed 6-digit code, and whether it is being verified. */
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  /** The address a link was sent to — drives the confirmation view locally so
      "use a different email" can return to the form without a provider reset. */
  const [sentTo, setSentTo] = useState<string | undefined>()

  const signingIn = helpArticleBySlug('signing-in')
  const helpPath = signingIn ? helpDocPath(signingIn, lang) : seoRoute('help').path[lang]
  const signedInEmail = session?.user.email

  const send = (targetEmail: string, withName: boolean) => {
    setSending(true)
    setError(undefined)
    setCode('')
    void signInWithEmail(targetEmail, withName ? { name } : undefined).then((nextError) => {
      setSending(false)
      if (nextError) setError(nextError)
      else setSentTo(targetEmail)
    })
  }

  /* Verifying the emailed code signs in directly, so the flow never depends on
     a link surviving the recipient's mailbox — see verifyEmailCode. On success
     the session arrives through onAuthStateChange and EntryStage takes over. */
  const submitCode = (e: SubmitEvent) => {
    e.preventDefault()
    if (!sentTo) return
    setVerifying(true)
    setError(undefined)
    void verifyEmailCode(sentTo, code).then((nextError) => {
      setVerifying(false)
      if (nextError) setError(nextError)
    })
  }

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault()
    /* `required` alone accepts a whitespace-only name, which the provider then
       trims away — so the sign-up would succeed without the promised metadata.
       Require at least one non-whitespace character. */
    if (mode === 'signup' && !name.trim()) {
      setError(x(M.auth_name_required))
      return
    }
    send(email.trim(), mode === 'signup')
  }

  /* Two exits, because the article does not always resolve it. The second is
     deliberately email and not the public Contact form: `account_access` is not
     an `allowPublic` category (create-public-support-ticket rejects it), and a
     locked-out person cannot reach the in-app form — so an address is the only
     route that actually works from here. It comes from the support config like
     every other address on the site. */
  const helpFooter = (
    <p className="mt-[18px] text-center text-[12.5px] leading-[1.6] text-text-muted">
      {L('Trouble signing in?', 'Un problème de connexion?')}{' '}
      <Link to={helpPath} className="font-semibold text-text-2 hover:text-text">
        {L('Get help', 'Obtenir de l’aide')}
      </Link>
      {' · '}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-text-2 hover:text-text">
        {SUPPORT_EMAIL}
      </a>
    </p>
  )

  /* A session that isn't the invite-only account (an authorized one is
     redirected away by EntryStage before AuthPanel mounts). */
  if (status === 'signed-in' && signedInEmail) {
    return (
      <div>
        <div className={cardClass}>
          <div className="flex flex-col gap-[12px]">
            <h1 className="m-0 font-display text-[19px] font-semibold text-text">
              {x(M.auth_menu_title)}
            </h1>
            <p className="m-0 text-[13.5px] text-text-2">{signedInEmail}</p>
            <p className="m-0 text-[13px] leading-[1.5] text-text-muted">
              {x(M.auth_not_authorized)}
            </p>
            <Link to={p('pricing')} className={`${primaryBtnClass} mt-[4px] no-underline`}>
              {x(M.auth_choose_plan)}
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-[2px] cursor-pointer self-start rounded-[10px] border border-border bg-transparent px-[16px] py-[9px] text-[13px] font-semibold text-text-2 hover:bg-inset"
            >
              {x(M.auth_sign_out)}
            </button>
          </div>
        </div>
        {helpFooter}
      </div>
    )
  }

  if (sentTo) {
    return (
      <div>
        <div className={cardClass}>
          <div className="flex flex-col items-center gap-[14px] text-center">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gold-bg text-gold-fg">
              <MailCheck size={24} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h1 className="m-0 font-display text-[20px] font-semibold text-text">
              {x(M.auth_sent_title)}
            </h1>
            <p className="m-0 text-[13.5px] leading-[1.55] text-text-3" role="status">
              {x(M.auth_sent_body_prefix)}{' '}
              <span className="font-semibold text-text-2">{sentTo}</span>.{' '}
              {x(M.auth_sent_body_suffix)}
            </p>
            <p className="m-0 text-[12px] leading-[1.5] text-text-muted">{x(M.auth_sent_spam)}</p>

            {/* Code entry. The primary route, not a fallback: it is the only
                one a mailbox scanner cannot spend on the recipient's behalf. */}
            <form onSubmit={submitCode} className="mt-[4px] flex w-full flex-col gap-[10px]">
              <label className={`${labelClass} text-left`} htmlFor="auth-code">
                {x(M.auth_code_label)}
              </label>
              <input
                id="auth-code"
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={x(M.auth_code_placeholder)}
                className={`${fieldClass} text-center text-[18px] tracking-[0.4em]`}
              />
              <p className="m-0 text-left text-[12px] leading-[1.5] text-text-muted">
                {x(M.auth_code_hint)}
              </p>
              <button
                type="submit"
                disabled={verifying || code.trim().length === 0}
                className={primaryBtnClass}
              >
                {verifying && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {verifying ? x(M.auth_code_verifying) : x(M.auth_code_submit)}
              </button>
            </form>

            {error && (
              <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
                {error}
              </p>
            )}
            <div className="mt-[2px] flex flex-col items-center gap-[12px]">
              <button
                type="button"
                onClick={() => send(sentTo, mode === 'signup')}
                disabled={sending}
                className="flex cursor-pointer items-center gap-[7px] rounded-[10px] border border-border bg-transparent px-[16px] py-[9px] text-[13px] font-semibold text-text-2 hover:bg-inset disabled:cursor-default disabled:opacity-60"
              >
                {sending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(M.auth_resend)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSentTo(undefined)
                  setError(undefined)
                }}
                disabled={sending}
                className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent text-[12.5px] font-semibold text-text-muted hover:text-text-2 disabled:cursor-default disabled:opacity-60"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                {x(M.auth_use_different_email)}
              </button>
            </div>
          </div>
        </div>
        {helpFooter}
      </div>
    )
  }

  const nameId = 'auth-name'
  const emailId = 'auth-email'

  return (
    <div>
      <div className={cardClass}>
        {/* Sign in / Sign up toggle. Plain toggle buttons with aria-pressed
            (matching ShellControls' LangToggle) — not an ARIA tablist, since
            there are no tabpanels or roving/arrow-key semantics to back that up. */}
        <div className="mb-[22px] flex gap-[3px] rounded-[11px] bg-inset p-[4px]">
          {(['signin', 'signup'] as const).map((m) => {
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMode(m)
                  setError(undefined)
                }}
                className={
                  'flex-1 cursor-pointer rounded-[8px] border-none px-[12px] py-[9px] text-[13px] font-semibold transition-[background,color] duration-150 ' +
                  (active
                    ? 'bg-surface text-text shadow-[0_1px_3px_rgba(13,27,42,0.10)]'
                    : 'bg-transparent text-text-muted hover:text-text-2')
                }
              >
                {x(m === 'signin' ? M.auth_sign_in : M.auth_tab_signup)}
              </button>
            )
          })}
        </div>

        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
          {x(mode === 'signin' ? M.auth_signin_title : M.auth_signup_title)}
        </h1>
        <p className="mt-[6px] mb-[22px] text-[13.5px] leading-[1.5] text-text-3">
          {x(mode === 'signin' ? M.auth_signin_sub : M.auth_signup_sub)}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          {mode === 'signup' && (
            <div>
              <label className={labelClass} htmlFor={nameId}>
                {x(M.auth_name_label)}
              </label>
              <input
                id={nameId}
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={x(M.auth_name_placeholder)}
                className={fieldClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass} htmlFor={emailId}>
              {x(M.auth_email_label)}
            </label>
            <input
              id={emailId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={x(M.auth_email_placeholder)}
              className={fieldClass}
            />
          </div>

          {error && (
            <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
              {error}
            </p>
          )}

          <button type="submit" disabled={sending} className={primaryBtnClass}>
            {sending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {sending
              ? x(M.auth_sending)
              : x(mode === 'signin' ? M.auth_submit_signin : M.auth_submit_signup)}
          </button>

          <p className="m-0 text-center text-[12px] leading-[1.5] text-text-muted">
            {x(M.auth_passwordless_note)}
          </p>

          {mode === 'signup' && (
            <p className="m-0 text-center text-[11.5px] leading-[1.5] text-text-faint">
              {x(M.auth_terms_prefix)}
              <Link
                to={legalDoc('terms')}
                className="font-semibold text-text-muted hover:text-text-2"
              >
                {x(M.auth_terms_link)}
              </Link>
              {x(M.auth_terms_and)}
              <Link
                to={legalDoc('privacy')}
                className="font-semibold text-text-muted hover:text-text-2"
              >
                {x(M.auth_privacy_link)}
              </Link>
              {x(M.auth_terms_suffix)}
            </p>
          )}
        </form>
      </div>
      {helpFooter}
    </div>
  )
}
