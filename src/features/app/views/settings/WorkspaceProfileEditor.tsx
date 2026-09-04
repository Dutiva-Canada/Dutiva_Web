import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { updateAdminProfile } from '@/features/app/workspaceMode/api'
import { settingsMessages as M } from '@/i18n/messages/settings'

const PROVINCE_OPTIONS = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon',
] as const

const fieldClass =
  'mt-[6px] w-full max-w-[320px] rounded-[8px] border border-border bg-bg px-[10px] py-[7px] text-[13.5px] text-text'

/** Production workspace: edit company name / province / city on the user's profile. */
export function WorkspaceProfileEditor() {
  const { x } = useI18n()
  const { status, session } = useAuth()
  const { showToast } = useToasts()
  const { identity, refreshIdentity, isAdmin } = useWorkspaceMode()
  const [companyName, setCompanyName] = useState(identity.companyName)
  const [province, setProvince] = useState(identity.province ?? 'Ontario')
  const [city, setCity] = useState(identity.city ?? 'Ottawa')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCompanyName(identity.companyName)
    setProvince(identity.province ?? 'Ontario')
    setCity(identity.city ?? 'Ottawa')
  }, [identity.companyName, identity.province, identity.city])

  if (!isAdmin || status !== 'signed-in' || !session) return null

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const saved = await updateAdminProfile(session.user.id, { companyName, province, city })
      if (!saved) {
        showToast(M.settings_profile_failed, 'info')
        return
      }
      await refreshIdentity()
      showToast(M.settings_profile_saved, 'ok')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="mb-[10px] text-[12px] text-text-muted">{x(M.settings_profile_edit)}</p>
      <div className="flex flex-col gap-[12px]">
        <div>
          <label htmlFor="settings-company-name" className="text-[12px] text-text-muted">
            {x(M.settings_company)}
          </label>
          <input
            id="settings-company-name"
            type="text"
            value={companyName}
            disabled={saving}
            onChange={(e) => setCompanyName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="settings-province" className="text-[12px] text-text-muted">
            {x(M.settings_provinces_of_op)}
          </label>
          <select
            id="settings-province"
            value={province}
            disabled={saving}
            onChange={(e) => setProvince(e.target.value)}
            className={fieldClass}
          >
            {!PROVINCE_OPTIONS.includes(province as (typeof PROVINCE_OPTIONS)[number]) && (
              <option value={province}>{province}</option>
            )}
            {PROVINCE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="settings-city" className="text-[12px] text-text-muted">
            {x(M.settings_locations)}
          </label>
          <input
            id="settings-city"
            type="text"
            value={city}
            disabled={saving}
            onChange={(e) => setCity(e.target.value)}
            className={fieldClass}
          />
        </div>
        <button
          type="button"
          disabled={saving || !companyName.trim() || !city.trim()}
          onClick={() => void save()}
          className="w-fit cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12px] font-bold text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {x(M.settings_profile_save)}
        </button>
      </div>
    </div>
  )
}
