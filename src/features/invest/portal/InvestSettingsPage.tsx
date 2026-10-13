import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  Contrast,
  Download,
  Globe,
  Loader2,
  LogOut,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useAuth } from '@/features/app/auth/authContext'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { useTheme } from '@/lib/themeContext'
import type { ThemePref } from '@/lib/themeContext'
import { supabase } from '@/lib/supabaseClient'
import { resetOnboarding } from './onboarding'
import { useInvestHead } from './useInvestHead'
import { StrategyDeliveryCard } from './StrategyDeliveryCard'
import {
  DISPLAY_CURRENCIES,
  HOME_TABS,
  readBadgeScope,
  readDisplayCurrency,
  readHomeTab,
  readOrderMode,
  writeBadgeScope,
  writeDisplayCurrency,
  writeHomeTab,
  writeOrderMode,
  type BadgeScope,
  type HomeTab,
} from './investPrefs'
import type { OrderMode } from '@/features/invest/data/types'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const rowLabel = 'm-0 text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted'
const selectClass =
  'min-h-[44px] cursor-pointer rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-semibold text-text'
const segButton = (active: boolean) =>
  `inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border px-[16px] text-[13px] font-semibold transition-colors ${
    active
      ? 'border-gold-border bg-gold-bg text-gold-fg'
      : 'border-border bg-transparent text-text-2 hover:bg-inset'
  }`
const actionButton =
  'inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-border bg-transparent px-[14px] text-[12.5px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50'

const THEME_OPTIONS: { pref: ThemePref; label: (typeof IM)[keyof typeof IM]; Icon: typeof Sun }[] = [
  { pref: 'auto', label: IM.invest_sb_theme_auto, Icon: Contrast },
  { pref: 'light', label: IM.invest_sb_theme_light, Icon: Sun },
  { pref: 'dark', label: IM.invest_sb_theme_dark, Icon: Moon },
]

const HOME_TAB_LABELS: Record<HomeTab, (typeof IM)[keyof typeof IM]> = {
  '/invest': IM.invest_tab_overview,
  '/invest/chat': IM.invest_tab_chat,
  '/invest/portfolio': IM.invest_tab_portfolios,
  '/invest/orders': IM.invest_tab_orders,
  '/invest/signals': IM.invest_tab_signals,
  '/invest/strategies': IM.invest_tab_strategies,
}

/**
 * Settings — language, appearance, start page, display currency, per-strategy
 * delivery, email cadence, defaults, the tour, and the account view. The
 * "My data" card exports a client-side JSON snapshot and holds the two
 * danger actions: clearing Tally history (two-step confirm, user-scoped
 * chat tables) and wiping all Invest data (typed DELETE, server-side
 * `invest_wipe_account` RPC).
 */
export function InvestSettingsPage() {
  const { x, L, lang, setLang } = useI18n()
  const { session, signOut } = useAuth()
  const { state, loading, refresh } = useInvestData()
  const { themePref, setTheme } = useTheme()
  const navigate = useNavigate()
  useInvestHead(IM.invest_seo_title_settings, IM.invest_seo_desc_settings)
  const [busy, setBusy] = useState<'signout' | 'global' | 'clear' | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearDone, setClearDone] = useState(false)
  const [cadence, setCadence] = useState<'immediate' | 'daily' | 'weekly'>('immediate')
  const [wipeText, setWipeText] = useState('')
  const [wipeDone, setWipeDone] = useState(false)

  useEffect(() => {
    if (!supabase || !session?.user.id) return
    const uid = session.user.id
    let cancelled = false
    void supabase
      .from('invest_notification_prefs')
      .select('email_cadence')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data }) => {
        const v = data?.email_cadence
        if (!cancelled && (v === 'daily' || v === 'weekly')) setCadence(v)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  const setEmailCadence = (v: 'immediate' | 'daily' | 'weekly') => {
    setCadence(v)
    if (!supabase || !session?.user.id) return
    void supabase.from('invest_notification_prefs').upsert({
      user_id: session.user.id,
      email_cadence: v,
      updated_at: new Date().toISOString(),
    })
  }

  const wipeAllData = async () => {
    if (!supabase) return
    const { error } = await supabase.rpc('invest_wipe_account')
    if (!error) {
      setWipeDone(true)
      setWipeText('')
      await refresh()
    }
  }
  const [homeTab, setHomeTab] = useState<HomeTab>(readHomeTab)
  const [orderMode, setOrderMode] = useState<OrderMode>(readOrderMode)
  const [badgeScope, setBadgeScope] = useState<BadgeScope>(readBadgeScope)
  const [displayCur, setDisplayCur] = useState(readDisplayCurrency)

  const run = async (key: 'signout' | 'global' | 'clear', fn: () => Promise<void>) => {
    setBusy(key)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  const signOutEverywhere = async () => {
    if (!supabase) return
    try {
      /* Global scope revokes every refresh token on the account server-side
         and clears the local session — the auth state listener then drops
         the portal back to the sign-in wall. */
      await supabase.auth.signOut({ scope: 'global' })
    } catch {
      await signOut()
    }
  }

  const clearTallyHistory = async () => {
    if (!supabase || !session?.user.id) return
    /* Messages first: threads cascade only thread-linked rows — the default
       conversation's messages carry no thread_id and would be orphaned. */
    await supabase.from('invest_chat_messages').delete().eq('user_id', session.user.id)
    await supabase.from('invest_chat_threads').delete().eq('user_id', session.user.id)
    setConfirmClear(false)
    setClearDone(true)
  }

  const exportData = () => {
    const payload = JSON.stringify(
      { generatedAt: new Date().toISOString(), email: session?.user.email ?? null, ...state },
      null,
      2,
    )
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `dutiva-invest-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
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
              className={segButton(lang === l)}
            >
              <Globe size={13} strokeWidth={2} aria-hidden="true" />
              {l === 'en' ? 'English' : 'Français'}
              {lang === l && <Check size={13} strokeWidth={2.5} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">
          {x(IM.invest_settings_appearance)}
        </h2>
        <div
          className="mt-[12px] flex gap-[8px]"
          role="group"
          aria-label={x(IM.invest_settings_appearance)}
        >
          {THEME_OPTIONS.map(({ pref, label, Icon }) => (
            <button
              key={pref}
              type="button"
              onClick={() => setTheme(pref)}
              aria-pressed={themePref === pref}
              className={segButton(themePref === pref)}
            >
              <Icon size={13} strokeWidth={2} aria-hidden="true" />
              {x(label)}
              {themePref === pref && <Check size={13} strokeWidth={2.5} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">
          {x(IM.invest_settings_start_page)}
        </h2>
        <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
          {x(IM.invest_settings_start_page_note)}
        </p>
        <select
          className={`mt-[12px] ${selectClass}`}
          value={homeTab}
          onChange={(e) => {
            const v = e.target.value as HomeTab
            setHomeTab(v)
            writeHomeTab(v)
          }}
          aria-label={x(IM.invest_settings_start_page)}
        >
          {HOME_TABS.map((tab) => (
            <option key={tab} value={tab}>
              {x(HOME_TAB_LABELS[tab])}
            </option>
          ))}
        </select>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">
          {x(IM.invest_settings_currency)}
        </h2>
        <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
          {x(IM.invest_settings_currency_note)}
        </p>
        <select
          className={`mt-[12px] ${selectClass}`}
          value={displayCur}
          onChange={(e) => {
            setDisplayCur(e.target.value)
            writeDisplayCurrency(e.target.value)
          }}
          aria-label={x(IM.invest_settings_currency)}
        >
          <option value="">{x(IM.invest_settings_currency_auto)}</option>
          {DISPLAY_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      <StrategyDeliveryCard />

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">
          {x(IM.invest_settings_defaults)}
        </h2>
        <div className="mt-[12px] flex flex-col gap-[14px]">
          <div>
            <p className={rowLabel}>{x(IM.invest_settings_order_mode)}</p>
            <select
              className={`mt-[6px] ${selectClass}`}
              value={orderMode}
              onChange={(e) => {
                const v = e.target.value as OrderMode
                setOrderMode(v)
                writeOrderMode(v)
              }}
              aria-label={x(IM.invest_settings_order_mode)}
            >
              <option value="paper">{x(IM.invest_mode_paper)}</option>
              <option value="live">{x(IM.invest_mode_live)}</option>
            </select>
          </div>
          <div>
            <p className={rowLabel}>
              <Bell size={11} strokeWidth={2} className="mr-[4px] inline align-[-1px]" aria-hidden="true" />
              {x(IM.invest_settings_badge)}
            </p>
            <select
              className={`mt-[6px] ${selectClass}`}
              value={badgeScope}
              onChange={(e) => {
                const v = e.target.value as BadgeScope
                setBadgeScope(v)
                writeBadgeScope(v)
              }}
              aria-label={x(IM.invest_settings_badge)}
            >
              <option value="all">{x(IM.invest_settings_badge_all)}</option>
              <option value="signals">{x(IM.invest_settings_badge_signals)}</option>
            </select>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">
          {x(IM.invest_settings_notifications)}
        </h2>
        <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
          {x(IM.invest_settings_email_cadence_note)}
        </p>
        <div className="mt-[12px]">
          <p className={rowLabel}>{x(IM.invest_settings_email_cadence)}</p>
          <select
            className={`mt-[6px] ${selectClass}`}
            value={cadence}
            onChange={(e) => setEmailCadence(e.target.value as 'immediate' | 'daily' | 'weekly')}
            aria-label={x(IM.invest_settings_email_cadence)}
          >
            <option value="immediate">{x(IM.invest_cadence_email_immediate)}</option>
            <option value="daily">{x(IM.invest_cadence_email_daily)}</option>
            <option value="weekly">{x(IM.invest_cadence_email_weekly)}</option>
          </select>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_settings_tour)}</h2>
        <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
          {x(IM.invest_settings_tour_note)}
        </p>
        <button type="button" onClick={replayTour} className={`mt-[12px] ${actionButton}`}>
          <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
          {x(IM.invest_settings_tour_open)}
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_settings_data)}</h2>
        <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
          {x(IM.invest_settings_export_note)}
        </p>
        <button type="button" onClick={exportData} className={`mt-[12px] ${actionButton}`}>
          <Download size={13} strokeWidth={2} aria-hidden="true" />
          {x(IM.invest_settings_export)}
        </button>

        <div className="mt-[18px] border-t border-border pt-[14px]">
          <h3 className="m-0 text-[13px] font-semibold text-text">
            {x(IM.invest_settings_clear_chat)}
          </h3>
          <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
            {clearDone
              ? x(IM.invest_settings_clear_chat_done)
              : x(IM.invest_settings_clear_chat_note)}
          </p>
          {confirmClear ? (
            <div className="mt-[10px] flex flex-wrap items-center gap-[10px]">
              <p className="m-0 text-[12.5px] font-semibold text-text">
                {x(IM.invest_settings_clear_chat_confirm)}
              </p>
              <button
                type="button"
                disabled={busy === 'clear'}
                onClick={() => void run('clear', clearTallyHistory)}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-risk-border bg-transparent px-[14px] text-[12.5px] font-semibold text-risk-fg hover:bg-inset disabled:opacity-50"
              >
                {busy === 'clear' ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                )}
                {x(IM.invest_settings_clear_chat_yes)}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className={actionButton}
              >
                {x(IM.invest_cancel)}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={clearDone}
              className={`mt-[12px] ${actionButton}`}
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
              {x(IM.invest_settings_clear_chat)}
            </button>
          )}
        </div>

        <div className="mt-[18px] border-t border-border pt-[14px]">
          <h3 className="m-0 text-[13px] font-semibold text-text">
            {x(IM.invest_settings_wipe)}
          </h3>
          <p className="m-0 mt-[4px] text-[12px] leading-normal text-text-muted">
            {wipeDone ? x(IM.invest_settings_wipe_done) : x(IM.invest_settings_wipe_note)}
          </p>
          {!wipeDone && (
            <div className="mt-[10px] flex flex-wrap items-center gap-[10px]">
              <input
                type="text"
                value={wipeText}
                onChange={(e) => setWipeText(e.target.value)}
                placeholder={x(IM.invest_settings_wipe_type)}
                aria-label={x(IM.invest_settings_wipe_type)}
                className="min-h-[44px] w-[190px] rounded-[9px] border border-border bg-surface px-[12px] text-[13px] font-semibold text-text"
              />
              <button
                type="button"
                disabled={wipeText !== 'DELETE' || busy === 'clear'}
                onClick={() => void run('clear', wipeAllData)}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-risk-border bg-transparent px-[14px] text-[12.5px] font-semibold text-risk-fg hover:bg-inset disabled:opacity-50"
              >
                {busy === 'clear' ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                )}
                {x(IM.invest_settings_wipe)}
              </button>
            </div>
          )}
        </div>
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
            disabled={busy !== null}
            onClick={() => void run('signout', signOut)}
            className={actionButton}
          >
            {busy === 'signout' ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <LogOut size={13} strokeWidth={2} aria-hidden="true" />
            )}
            {x(IM.invest_sign_out)}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run('global', signOutEverywhere)}
            className={actionButton}
          >
            {busy === 'global' ? (
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
