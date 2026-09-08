import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'

type Mode = 'signin' | 'signup'

/** Shared card chrome so every state (form / sent) reads as one panel. */
const cardClass =
  'rounded-[18px] border border-border bg-surface p-[28px] shadow-[0_20px_50px_-24px_rgba(13,27,42,0.35)] min-[640px]:p-[32px]'
const fieldClass =
  'h-[46px] w-full rounded-[11px] border border-border bg-bg px-[14px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[6px] block text-[12.5px] font-semibold text-text-2'
const primaryBtnClass =
  'flex h-[46px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60'

/**
 * Sign-in / sign-up card for the candidate portal. Passwordless throughout:
 * both tabs email a 6-digit code (the sign-up tab also captures a display
 * name). Renders two states — the form and the "check your inbox"
 * confirmation with code entry.
 */
export function CandidateAuthPanel() {
  const { x } = useI18n()
  const { signInWithEmail, verifyEmailCode } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sentTo, setSentTo] = useState<string | undefined>()

  const send = (targetEmail: string, withName: boolean) => {
    setSending(true)
    setError(undefined)
    setCode('')
    void signInWithEmail(targetEmail, withName ? { name } : undefined).then((nextError) => {
      setSending(false)
      if (nextError) setError(x(M.careers_auth_error_generic))
      else setSentTo(targetEmail)
    })
  }

  const submitCode = (e: SubmitEvent) => {
    e.preventDefault()
    if (!sentTo) return
    setVerifying(true)
    setError(undefined)
    void verifyEmailCode(sentTo, code).then((nextError) => {
      setVerifying(false)
      if (nextError) setError(x(M.careers_auth_error_generic))
    })
  }

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) {
      setError(x(M.careers_auth_error_generic))
      return
    }
    send(email.trim(), mode === 'signup')
  }

  if (sentTo) {
    return (
      <div className={cardClass}>
        <div className="flex flex-col items-center gap-[14px] text-center">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gold-bg text-gold-fg">
            <MailCheck size={24} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h1 className="m-0 font-display text-[20px] font-semibold text-text">
            {x(M.careers_auth_check_inbox)}
          </h1>
          <p className="m-0 text-[13.5px] leading-[1.55] text-text-3" role="status">
            {x(M.careers_auth_check_inbox_body).replace('{email}', sentTo)}
          </p>

          <form onSubmit={submitCode} className="mt-[4px] flex w-full flex-col gap-[10px]">
            <label className={`${labelClass} text-left`} htmlFor="careers-auth-code">
              {x(M.careers_auth_code)}
            </label>
            <input
              id="careers-auth-code"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${fieldClass} text-center text-[18px] tracking-[0.4em]`}
            />
            <button
              type="submit"
              disabled={verifying || code.trim().length === 0}
              className={primaryBtnClass}
            >
              {verifying && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {verifying ? x(M.careers_auth_verifying) : x(M.careers_auth_verify)}
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
              {x(M.careers_auth_send_link)}
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
              {x(M.careers_auth_use_different_email)}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const nameId = 'careers-auth-name'
  const emailId = 'careers-auth-email'

  return (
    <div className={cardClass}>
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
              {x(m === 'signin' ? M.careers_auth_signin_tab : M.careers_auth_signup_tab)}
            </button>
          )
        })}
      </div>

      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(mode === 'signin' ? M.careers_auth_welcome : M.careers_auth_welcome_new)}
      </h1>

      <form onSubmit={handleSubmit} className="mt-[22px] flex flex-col gap-[14px]">
        {mode === 'signup' && (
          <div>
            <label className={labelClass} htmlFor={nameId}>
              {x(M.careers_auth_name)}
            </label>
            <input
              id={nameId}
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}
        <div>
          <label className={labelClass} htmlFor={emailId}>
            {x(M.careers_auth_email)}
          </label>
          <input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {sending ? x(M.careers_auth_signing_in) : x(M.careers_auth_send_link)}
        </button>
      </form>
    </div>
  )
}
