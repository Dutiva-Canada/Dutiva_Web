import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { updateAdminProfile } from '@/features/app/workspaceMode/api'
import { settingsMessages as M } from '@/i18n/messages/settings'

/** Stored `profiles.province` values — Federal means Canada Labour Code. */
const JURISDICTION_OPTIONS = [
  { value: 'Federal', label: M.settings_prov_federal },
  { value: 'Alberta', label: null },
  { value: 'British Columbia', label: null },
  { value: 'Manitoba', label: null },
  { value: 'New Brunswick', label: null },
  { value: 'Newfoundland and Labrador', label: null },
  { value: 'Nova Scotia', label: null },
  { value: 'Ontario', label: null },
  { value: 'Prince Edward Island', label: null },
  { value: 'Quebec', label: null },
  { value: 'Saskatchewan', label: null },
  { value: 'Northwest Territories', label: null },
  { value: 'Nunavut', label: null },
  { value: 'Yukon', label: null },
] as const

const fieldClass =
  'block w-full max-w-[320px] rounded-[8px] border border-border bg-bg px-[10px] py-[7px] text-[13.5px] text-text'

const labelClass = 'block text-[12px] text-text-muted'

/** Production workspace: edit company name / jurisdiction / city on the user's profile. */
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

  const knownValues = JURISDICTION_OPTIONS.map((o) => o.value)
  const hasKnownProvince = knownValues.includes(province as (typeof knownValues)[number])

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
      <div className="mb-[14px] text-[12px] font-semibold text-text-3">
        {x(M.settings_profile_edit)}
      </div>
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="settings-company-name" className={labelClass}>
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
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="settings-province" className={labelClass}>
            {x(M.settings_primary_jurisdiction)}
          </label>
          <select
            id="settings-province"
            value={province}
            disabled={saving}
            onChange={(e) => setProvince(e.target.value)}
            className={fieldClass}
          >
            {!hasKnownProvince && <option value={province}>{province}</option>}
            {JURISDICTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label ? x(opt.label) : opt.value}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="settings-city" className={labelClass}>
            {x(M.settings_city)}
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
          className="mt-[2px] w-fit cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12px] font-bold text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {x(M.settings_profile_save)}
        </button>
      </div>
    </div>
  )
}
