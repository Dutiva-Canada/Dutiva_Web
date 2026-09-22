import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Loader2, LogOut, Moon, Sun, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useTheme } from '@/lib/themeContext'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { deleteMyCandidateProfile } from '@/features/careers/data/candidateApi'

function segClass(on: boolean): string {
  return `cursor-pointer rounded-[8px] border-none px-[14px] py-[8px] text-[13px] font-semibold transition-colors duration-150 ${
    on ? 'bg-navy text-white' : 'bg-transparent text-text-muted hover:text-text-2'
  }`
}

/**
 * Candidate-portal settings: language, theme, sign-out, and the delete-your-
 * data action (relocated here from the profile editor — it's an account-level
 * action, not a profile field).
 */
export function PortalSettingsPage() {
  const { x, lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const { session, signOut } = useAuth()
  const { showToast } = useToasts()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const onDelete = async () => {
    if (deleting) return
    if (!window.confirm(x(M.careers_profile_delete_confirm))) return
    setDeleting(true)
    try {
      await deleteMyCandidateProfile()
      showToast(M.careers_profile_deleted, 'ok')
      navigate('/careers/portal')
    } catch {
      showToast(M.careers_profile_delete_error, 'info')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <h1 className="m-0 text-[22px] font-bold text-text">
        {x(M.careers_portal_nav_settings)}
      </h1>

      {/* Preferences */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="m-0 mb-[14px] text-[15px] font-semibold text-text">
          {x(M.careers_settings_preferences)}
        </h2>
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[8px] text-[13.5px] font-semibold text-text-2">
              <Globe size={15} strokeWidth={2} aria-hidden="true" />
              {x(M.careers_settings_language)}
            </div>
            <div
              role="tablist"
              aria-label={x(M.careers_settings_language)}
              className="flex gap-[4px] rounded-[10px] bg-inset p-[3px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={lang === 'en'}
                onClick={() => setLang('en')}
                className={segClass(lang === 'en')}
              >
                English
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lang === 'fr'}
                onClick={() => setLang('fr')}
                className={segClass(lang === 'fr')}
              >
                Français
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[8px] text-[13.5px] font-semibold text-text-2">
              {theme === 'dark' ? (
                <Moon size={15} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Sun size={15} strokeWidth={2} aria-hidden="true" />
              )}
              {x(M.careers_settings_theme)}
            </div>
            <div
              role="tablist"
              aria-label={x(M.careers_settings_theme)}
              className="flex gap-[4px] rounded-[10px] bg-inset p-[3px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={theme !== 'dark'}
                onClick={() => setTheme('light')}
                className={segClass(theme !== 'dark')}
              >
                {x(M.careers_settings_theme_light)}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={theme === 'dark'}
                onClick={() => setTheme('dark')}
                className={segClass(theme === 'dark')}
              >
                {x(M.careers_settings_theme_dark)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="m-0 mb-[14px] text-[15px] font-semibold text-text">
          {x(M.careers_settings_account)}
        </h2>
        <div className="flex items-center justify-between gap-[12px]">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-text">
              {session?.user.email}
            </div>
            <div className="text-[12.5px] text-text-muted">
              {x(M.careers_settings_account_body)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[12px] py-[8px] text-[13px] font-semibold text-text-2 hover:bg-inset"
          >
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.careers_auth_sign_out)}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-[12px] border border-risk-border bg-surface p-[20px]">
        <h2 className="m-0 text-[15px] font-semibold text-risk-fg">
          {x(M.careers_profile_delete_title)}
        </h2>
        <p className="mt-[6px] mb-[14px] text-[13px] leading-[1.5] text-text-muted">
          {x(M.careers_profile_delete_body)}
        </p>
        <button
          type="button"
          onClick={() => void onDelete()}
          disabled={deleting}
          className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-risk-fg px-[14px] py-[8px] text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {x(M.careers_profile_delete_action)}
        </button>
      </div>
    </div>
  )
}
