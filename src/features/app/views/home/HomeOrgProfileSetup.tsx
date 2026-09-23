import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { updateAdminProfile, updateOrganizationSettings } from '@/features/app/workspaceMode/api'
import {
  JURISDICTION_OPTIONS,
  PROVINCE_TO_JURISDICTION,
} from '@/features/app/workspaceMode/jurisdictionOptions'
import { homeMessages as M } from '@/i18n/messages/home'
import { settingsMessages as SM } from '@/i18n/messages/settings'

const fieldClass =
  'block w-full max-w-[320px] rounded-[8px] border border-border bg-bg px-[10px] py-[7px] text-[13.5px] text-text'

const labelClass = 'block text-[12px] text-text-muted'

/**
 * Step 1 of the setup path made immediate: an inline "the basics" card on the
 * empty production Home while the org has no jurisdictions configured. Saves
 * name/province/city to the user's profile (same fields as Settings) and maps
 * province onto organizations.jurisdictions — which flips the checklist's
 * "Confirm your company profile" step to done on the same render. Org-admin
 * only; once jurisdictions exist the card disappears entirely.
 * See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */
export function HomeOrgProfileSetup() {
  const { x } = useI18n()
  const { status, session } = useAuth()
  const { showToast } = useToasts()
  const {
    mode,
    identity,
    organization,
    organizationId,
    isOrgAdmin,
    refreshIdentity,
    refreshOrganization,
  } = useWorkspaceMode()
  const [companyName, setCompanyName] = useState(organization?.name ?? identity.companyName)
  const [province, setProvince] = useState(identity.province ?? 'Ontario')
  const [city, setCity] = useState(identity.city ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCompanyName(organization?.name ?? identity.companyName)
    setProvince(identity.province ?? 'Ontario')
    setCity(identity.city ?? '')
  }, [organization?.name, identity.companyName, identity.province, identity.city])

  if (mode !== 'production' || !isOrgAdmin || status !== 'signed-in' || !session || !organizationId)
    return null

  const knownValues = JURISDICTION_OPTIONS.map((o) => o.value)
  const hasKnownProvince = knownValues.includes(province as (typeof knownValues)[number])

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const savedProfile = await updateAdminProfile(session.user.id, {
        companyName,
        province,
        city,
      })
      if (!savedProfile) {
        showToast(M.home_setup_profile_failed, 'info')
        return
      }
      const code = PROVINCE_TO_JURISDICTION[province]
      if (code) {
        const merged = [...new Set([...(organization?.jurisdictions ?? []), code])]
        const savedOrg = await updateOrganizationSettings(organizationId, {
          jurisdictions: merged,
        })
        if (!savedOrg) {
          showToast(M.home_setup_profile_failed, 'info')
          return
        }
      }
      await Promise.all([refreshIdentity(), refreshOrganization()])
      showToast(M.home_setup_profile_saved, 'ok')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-[18px] rounded-[12px] border border-border bg-surface p-[16px] text-left">
      <div className="mb-[4px] text-[13px] font-bold text-text">
        {x(M.home_setup_profile_title)}
      </div>
      <p className="m-0 mb-[14px] text-[12.5px] leading-[1.5] text-text-muted">
        {x(M.home_setup_profile_note)}
      </p>
      <div className="flex flex-col gap-[14px]">
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="home-setup-company" className={labelClass}>
            {x(SM.settings_company)}
          </label>
          <input
            id="home-setup-company"
            type="text"
            value={companyName}
            disabled={saving}
            onChange={(e) => setCompanyName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="home-setup-province" className={labelClass}>
            {x(SM.settings_primary_jurisdiction)}
          </label>
          <select
            id="home-setup-province"
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
          <label htmlFor="home-setup-city" className={labelClass}>
            {x(SM.settings_city)}
          </label>
          <input
            id="home-setup-city"
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
          className="mt-[2px] w-fit cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[11px] font-sans text-[12px] font-bold text-text disabled:cursor-not-allowed disabled:opacity-60 md:py-[7px]"
        >
          {x(M.home_setup_profile_save)}
        </button>
      </div>
    </div>
  )
}
