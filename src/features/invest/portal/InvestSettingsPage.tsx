import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Globe, Loader2, LogOut, RotateCcw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useAuth } from '@/features/app/auth/authContext'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { supabase } from '@/lib/supabaseClient'
import { resetOnboarding } from './onboarding'
import { useInvestHead } from './useInvestHead'
import { StrategyDeliveryCard } from './StrategyDeliveryCard'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const rowLabel = 'm-0 text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted'

/**
 * Settings — language, notification delivery summary, and the account view
 * (signed-in email, auth method, session controls).
 *
 * No danger zone: the backend has no account-deletion or data-export
 * endpoint for invest data, so there is deliberately no button pretending
 * otherwise.
 */
export function InvestSettingsPage() {
  const { x, L, lang, setLang } = useI18n()
  const { session, signOut } = useAuth()
  const { loading } = useInvestData()
  const navigate = useNavigate()
  useInvestHead(IM.invest_seo_title_settings, IM.invest_seo_desc_settings)
  const [globalBusy, setGlobalBusy] = useState(false)

  const signOutEverywhere = async () => {
    if (!supabase) return
    setGlobalBusy(true)
    try {
      /* Global scope revokes every refresh token on the account server-side
         and clears the local session — the auth state listener then drops
         the portal back to the sign-in wall. */
      await supabase.auth.signOut({ scope: 'global' })
    } catch {
      await signOut()
    } finally {
      setGlobalBusy(false)
    }
  }

  const replayTour = () => {
    resetOnboarding()
    void navigate('/invest')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(IM.invest_tab_settings)}
      </h1>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">
          {x(IM.invest_settings_language)}
        </h2>
        <div
          className="mt-[12px] flex gap-[8px]"
          role="group"
          aria-label={x(IM.invest_settings_language)}
        >
          {(['en', 'fr'] as const).map((l: Lang) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border px-[16px] text-[13px] font-semibold transition-colors ${
                lang === l
                  ? 'border-gold-border bg-gold-bg text-gold-fg'
                  : 'border-border bg-transparent text-text-2 hover:bg-inset'
              }`}
            >
              <Globe size={13} strokeWidth={2} aria-hidden="true" />
              {l === 'en' ? 'English' : 'Français'}
              {lang === l && <Check size={13} strokeWidth={2.5} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <StrategyDeliveryCard />

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_settings_tour)}</h2>
        <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
          {x(IM.invest_settings_tour_note)}
        </p>
        <button
          type="button"
          onClick={replayTour}
          className="mt-[12px] inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-border bg-transparent px-[14px] text-[12.5px] font-semibold text-text-2 hover:bg-inset"
        >
          <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
          {x(IM.invest_settings_tour_open)}
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_settings_account)}</h2>
        <dl className="m-0 mt-[12px] flex flex-col gap-[10px]">
          <div>
            <dt className={rowLabel}>{x(IM.invest_settings_email)}</dt>
            <dd className="m-0 mt-[2px] text-[13.5px] text-text">{session?.user.email ?? '—'}</dd>
          </div>
          <div>
            <dt className={rowLabel}>{x(IM.invest_settings_method)}</dt>
            <dd className="m-0 mt-[2px] text-[13.5px] text-text">
              {x(IM.invest_settings_method_value)}
            </dd>
          </div>
        </dl>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-border bg-transparent px-[14px] text-[12.5px] font-semibold text-text-2 hover:bg-inset"
          >
            <LogOut size={13} strokeWidth={2} aria-hidden="true" />
            {x(IM.invest_sign_out)}
          </button>
          <button
            type="button"
            disabled={globalBusy}
            onClick={() => void signOutEverywhere()}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-border bg-transparent px-[14px] text-[12.5px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50"
          >
            {globalBusy ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <LogOut size={13} strokeWidth={2} aria-hidden="true" />
            )}
            {x(IM.invest_settings_signout_all)}
          </button>
        </div>
        <p className="m-0 mt-[8px] text-[12px] leading-normal text-text-muted">
          {L(
            '“Sign out everywhere” ends this session and every other session on this account.',
            '« Se déconnecter partout » termine cette session et toutes les autres sur ce compte.',
          )}
        </p>
      </section>
    </div>
  )
}
