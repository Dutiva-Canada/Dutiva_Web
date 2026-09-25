import { useState, type SubmitEvent } from 'react'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useAuth } from '@/features/app/auth/authContext'

const cardClass =
  'rounded-[18px] border border-border bg-surface p-[28px] shadow-[0_20px_50px_-24px_rgba(13,27,42,0.35)] min-[640px]:p-[32px]'
const fieldClass =
  'h-[46px] w-full rounded-[11px] border border-border bg-bg px-[14px] text-[14px] text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-faint focus:border-navy focus:shadow-[0_0_0_3px_var(--accent-soft)]'
const labelClass = 'mb-[6px] block text-[12.5px] font-semibold text-text-2'
const primaryBtnClass =
  'flex h-[46px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy text-[14px] font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60'

/**
 * Standalone sign-in for the invest portal — same passwordless email-code
 * flow as the candidate portal (shared auth), minus the sign-up tab: access
 * is invite-only, so a code is sent to whoever asks but the
 * invest_access grant decides whether the portal itself opens.
 */
export function InvestAuthPanel() {
  const { x } = useI18n()
  const { signInWithEmail, verifyEmailCode } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [sentTo, setSentTo] = useState<string | undefined>()

  const send = (targetEmail: string) => {
    setSending(true)
    setError(undefined)
    setCode('')
    void signInWithEmail(targetEmail, { next: '/invest' }).then((nextError) => {
      setSending(false)
      if (nextError) setError(x(IM.invest_signin_error))
      else setSentTo(targetEmail)
    })
  }

  const submitEmail = (e: SubmitEvent) => {
    e.preventDefault()
    if (email.trim()) send(email.trim())
  }

  const submitCode = (e: SubmitEvent) => {
    e.preventDefault()
    if (!sentTo) return
    setVerifying(true)
    setError(undefined)
    void verifyEmailCode(sentTo, code).then((nextError) => {
      setVerifying(false)
      if (nextError) setError(x(IM.invest_signin_error))
    })
  }

  if (sentTo) {
    return (
      <div className={cardClass}>
        <div className="flex flex-col items-center gap-[14px] text-center">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gold-bg text-gold-fg">
            <MailCheck size={24} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h1 className="m-0 font-display text-[20px] font-semibold text-text">
            {x(IM.invest_signin_title)}
          </h1>
          <p className="m-0 text-[13.5px] leading-[1.55] text-text-3" role="status">
            {x(IM.invest_signin_sent).replace('{email}', sentTo)}
          </p>
          <form onSubmit={submitCode} className="mt-[4px] flex w-full flex-col gap-[10px]">
            <label className={`${labelClass} text-left`} htmlFor="invest-auth-code">
              {x(IM.invest_signin_code)}
            </label>
            <input
              id="invest-auth-code"
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
            <button type="submit" disabled={verifying || code.trim().length === 0} className={primaryBtnClass}>
              {verifying && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {x(IM.invest_signin_verify)}
            </button>
          </form>
          {error && (
            <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
              {error}
            </p>
          )}
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
    )
  }

  return (
    <div className={cardClass}>
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(IM.invest_signin_title)}
      </h1>
      <p className="m-0 mt-[8px] text-[13px] leading-[1.55] text-text-3">
        {x(IM.invest_signin_body)}
      </p>
      <form onSubmit={submitEmail} className="mt-[22px] flex flex-col gap-[14px]">
        <div>
          <label className={labelClass} htmlFor="invest-auth-email">
            {x(IM.invest_signin_email)}
          </label>
          <input
            id="invest-auth-email"
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
          {sending ? x(M.careers_auth_signing_in) : x(IM.invest_signin_send)}
        </button>
      </form>
    </div>
  )
}
