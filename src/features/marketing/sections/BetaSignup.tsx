import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, Hourglass, ShieldCheck } from 'lucide-react'
import { usePublicPath } from '@/seo/usePublicPath'
import { CaptchaField } from '@/features/support/CaptchaField'
import { isCaptchaConfigured } from '@/features/support/captcha'
import { createBetaSignup, BetaSignupError } from '../betaSignupApi'
import type { BetaProvince } from '../betaSignupApi'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

/** Same validation shape as the prototype's beta-form handler (linear-time). */
function isValidEmail(value: string): boolean {
  const at = value.indexOf('@')
  if (at <= 0 || at === value.length - 1) return false
  const domain = value.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  if (dot <= 0 || dot === domain.length - 1) return false
  return !value.startsWith(' ') && !value.endsWith(' ') && !value.includes(' ')
}

const LABEL = 'text-[0.8125rem] font-semibold text-text'
const INPUT =
  'rounded-xl border border-control-border bg-bg px-4 font-sans text-text placeholder:text-text-3'

type Status = 'idle' | 'sending' | 'done' | 'waitlisted'

/**
 * Beta waiting-list form. Submissions go to the `create-beta-signup` edge
 * function (see ../betaSignupApi), which stores the address, alerts the
 * operator, and emails the visitor a confirmation.
 *
 * The beta accepts BETA_COHORT_LIMIT signups to begin; the server reports
 * whether that cohort was already full, and `waitlisted` renders the
 * honest version of success — on the list, waiting for a spot — instead of
 * promising access the workspace gate would refuse.
 *
 * A repeat address is reported by the server as an ordinary success, so
 * there is deliberately no "already on the list" state here — telling the
 * visitor would leak list membership to anyone who can type an address.
 * (The cohort bit is aggregate state, computed the same way for new and
 * repeat addresses, so it leaks nothing per-address.)
 */
export function BetaSignup() {
  const { lt, lang } = useLanding()
  const { legalDoc } = usePublicPath()
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [province, setProvince] = useState<BetaProvince | ''>('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<{ key: LandingMessageKey; isError: boolean } | null>(null)
  /* CAPTCHA widget: rendered only when a site key is configured, mirroring
     the public support form. Inert (nothing rendered, no token required) in
     dev/tests and until the operator sets VITE_CAPTCHA_SITE_KEY. */
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaReset, setCaptchaReset] = useState(0)
  const captchaRequired = isCaptchaConfigured()

  const errorKeyForCode = (code: string): LandingMessageKey => {
    if (code === 'rate_limited') return 'landing_cta_rate_limited'
    if (code === 'captcha') return 'landing_cta_captcha_failed'
    return 'landing_cta_fail'
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = email.trim()
    if (!isValidEmail(value)) {
      setMessage({ key: 'landing_cta_error', isError: true })
      return
    }
    if (!consent) {
      setMessage({ key: 'landing_cta_consent_err', isError: true })
      return
    }
    if (captchaRequired && !captchaToken) {
      setMessage({ key: 'landing_cta_captcha_required', isError: true })
      return
    }

    setMessage(null)
    setStatus('sending')
    try {
      const result = await createBetaSignup({
        email: value,
        company,
        province,
        language: lang === 'fr' ? 'fr' : 'en',
        consent,
        honeypot,
        captchaToken,
      })
      setStatus(result.waitlisted ? 'waitlisted' : 'done')
    } catch (error) {
      const code = error instanceof BetaSignupError ? error.code : 'error'
      setMessage({ key: errorKeyForCode(code), isError: true })
      setStatus('idle')
      /* A CAPTCHA token is single-use; force a fresh challenge on any failure
         so a retry cannot resubmit the spent token. */
      if (captchaRequired) {
        setCaptchaToken(null)
        setCaptchaReset((n) => n + 1)
      }
    }
  }

  return (
    <section id="start" className="mx-auto max-w-300 scroll-mt-20 px-6 pt-6 pb-18">
      <div className="premium-card grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-10 p-[clamp(28px,4vw,56px)]">
        <div>
          <span className="badge">{lt('landing_cta_badge')}</span>
          <h2 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-text">
            {lt('landing_cta_title')}
          </h2>
          <p className="mt-3.5 max-w-[44ch] text-base leading-[1.6] text-text-2">
            {lt('landing_cta_p')}
          </p>
          <p className="mt-3 max-w-[46ch] text-[0.8125rem] leading-normal font-semibold text-text">
            {lt('landing_cta_capacity')}
          </p>
        </div>

        <div>
          {status === 'done' || status === 'waitlisted' ? (
            <div className="flex items-center gap-3 rounded-[14px] border border-(--gold-border-soft) bg-gold-subtle px-5 py-4.5">
              {status === 'waitlisted' ? (
                <Hourglass size={22} className="flex-none text-gold-strong" />
              ) : (
                <CircleCheck size={22} className="flex-none text-gold-strong" />
              )}
              <div>
                <div className="font-semibold text-text">
                  {lt(status === 'waitlisted' ? 'landing_cta_wait_t' : 'landing_cta_done_t')}
                </div>
                <p className="m-0 mt-0.5 text-sm text-text-2">
                  {lt(status === 'waitlisted' ? 'landing_cta_wait_p' : 'landing_cta_done_p')}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              {/* Honeypot: off-screen, not announced, never tab-focusable. */}
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="beta-fax">{lt('landing_beta_honeypot')}</label>
                <input
                  id="beta-fax"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="beta-email" className={LABEL}>
                  {lt('landing_cta_email_label')}
                </label>
                <input
                  id="beta-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={lt('landing_cta_email_ph')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`min-h-12 text-[0.9375rem] ${INPUT}`}
                />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <div className="flex min-w-45 flex-1 flex-col gap-1.5">
                  <label htmlFor="beta-company" className={LABEL}>
                    {lt('landing_cta_company_label')}
                  </label>
                  <input
                    id="beta-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder={lt('landing_cta_company_ph')}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={`min-h-11 text-sm ${INPUT}`}
                  />
                </div>
                <div className="flex min-w-45 flex-1 flex-col gap-1.5">
                  <label htmlFor="beta-prov" className={LABEL}>
                    {lt('landing_cta_prov_label')}
                  </label>
                  <select
                    id="beta-prov"
                    name="province"
                    autoComplete="address-level1"
                    value={province}
                    onChange={(e) => setProvince(e.target.value as BetaProvince | '')}
                    className="min-h-11 rounded-xl border border-control-border bg-bg px-3 font-sans text-sm text-text"
                  >
                    <option value="">{lt('landing_cta_prov_0')}</option>
                    <option value="on">{lt('landing_cta_prov_on')}</option>
                    <option value="qc">{lt('landing_cta_prov_qc')}</option>
                    <option value="fed">{lt('landing_cta_prov_fed')}</option>
                    <option value="other">{lt('landing_cta_prov_other')}</option>
                  </select>
                </div>
              </div>

              {/* CASL express consent — the server rejects a submission without
                  it, so this is the record, not a courtesy. */}
              <label className="mt-0.5 flex items-start gap-2.5">
                <input
                  id="beta-consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[0.8125rem] leading-normal text-text-2">
                  {lt('landing_cta_consent_label')}
                </span>
              </label>

              {captchaRequired && (
                <CaptchaField onToken={setCaptchaToken} resetSignal={captchaReset} />
              )}

              <button
                type="submit"
                className={`gold-button gold-button-lg self-start ${status === 'sending' ? 'opacity-60' : ''}`}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? (
                  lt('landing_cta_sending')
                ) : (
                  <>
                    {lt('landing_cta_btn')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              <div
                role="status"
                aria-live="polite"
                className={`text-[0.8125rem] leading-normal ${message ? 'block' : 'hidden'} ${message?.isError ? 'text-danger' : 'text-text-2'}`}
              >
                {message ? lt(message.key) : null}
              </div>
              <p className="m-0 text-xs leading-[1.55] text-text-3">
                {lt('landing_cta_consent')}{' '}
                <Link
                  to={legalDoc('privacy')}
                  className="font-semibold text-text-2 transition-opacity hover:opacity-80"
                >
                  {lt('landing_cta_privacy_link')}
                </Link>
                {'.'}
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-text-3">
                <ShieldCheck size={14} className="text-gold-strong" />
                {lt('landing_cta_disclaimer')}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
