import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { financeMessages as FM } from '@/i18n/messages/finance'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { updateOrganizationSettings } from '@/features/app/workspaceMode/api'

const JURISDICTION_OPTIONS = [
  { value: 'CA-AB', label: 'Alberta' },
  { value: 'CA-BC', label: 'British Columbia' },
  { value: 'CA-MB', label: 'Manitoba' },
  { value: 'CA-NB', label: 'New Brunswick' },
  { value: 'CA-NL', label: 'Newfoundland and Labrador' },
  { value: 'CA-NS', label: 'Nova Scotia' },
  { value: 'CA-NT', label: 'Northwest Territories' },
  { value: 'CA-NU', label: 'Nunavut' },
  { value: 'CA-ON', label: 'Ontario' },
  { value: 'CA-PE', label: 'Prince Edward Island' },
  { value: 'CA-QC', label: 'Quebec' },
  { value: 'CA-SK', label: 'Saskatchewan' },
  { value: 'CA-YT', label: 'Yukon' },
  { value: 'CA-Federal', label: 'Federally regulated' },
] as const

const FINANCE_TAB_KEYS: { key: string; label: keyof typeof FM }[] = [
  { key: 'overview', label: 'finance_tab_overview' },
  { key: 'entities', label: 'finance_tab_entities' },
  { key: 'transactions', label: 'finance_tab_transactions' },
  { key: 'sales', label: 'finance_tab_sales' },
  { key: 'purchases', label: 'finance_tab_purchases' },
  { key: 'payroll', label: 'finance_tab_payroll' },
  { key: 'accounting', label: 'finance_tab_accounting' },
  { key: 'plans', label: 'finance_tab_plans' },
  { key: 'treasury', label: 'finance_tab_treasury' },
  { key: 'tax', label: 'finance_tab_tax' },
  { key: 'evidence', label: 'finance_tab_evidence' },
  { key: 'import-export', label: 'finance_tab_import_export' },
]

const fieldClass =
  'block w-full max-w-[320px] rounded-[8px] border border-border bg-bg px-[10px] py-[7px] text-[13.5px] text-text'

const labelClass = 'block text-[12px] text-text-muted'

export function OrganizationProfileEditor() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { organization, organizationId, isOrgAdmin, refreshOrganization } = useWorkspaceMode()
  const [industry, setIndustry] = useState(organization?.industry ?? '')
  const [jurisdictions, setJurisdictions] = useState<string[]>(organization?.jurisdictions ?? [])
  const [financeFeatures, setFinanceFeatures] = useState<Record<string, boolean>>(
    organization?.financeFeatures ?? {},
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setIndustry(organization?.industry ?? '')
    setJurisdictions(organization?.jurisdictions ?? [])
    setFinanceFeatures(organization?.financeFeatures ?? {})
  }, [organization])

  const hasChanges = useMemo(() => {
    if (!organization) return false
    return (
      industry !== (organization.industry ?? '') ||
      JSON.stringify(jurisdictions.sort()) !== JSON.stringify([...organization.jurisdictions].sort()) ||
      JSON.stringify(financeFeatures) !== JSON.stringify(organization.financeFeatures)
    )
  }, [industry, jurisdictions, financeFeatures, organization])

  if (!isOrgAdmin || !organizationId) return null

  const toggleJurisdiction = (code: string) => {
    setJurisdictions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )
  }

  const toggleFinanceFeature = (key: string) => {
    setFinanceFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const saved = await updateOrganizationSettings(organizationId, {
        industry: industry || null,
        jurisdictions,
        financeFeatures,
      })
      if (!saved) {
        showToast(M.settings_org_failed, 'info')
        return
      }
      await refreshOrganization()
      showToast(M.settings_org_saved, 'ok')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-[14px] text-[12px] font-semibold text-text-3">
        {x(M.settings_org_profile_edit)}
      </div>
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="settings-org-industry" className={labelClass}>
            {x(M.settings_org_industry)}
          </label>
          <input
            id="settings-org-industry"
            type="text"
            value={industry}
            disabled={saving}
            onChange={(e) => setIndustry(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className={labelClass}>{x(M.settings_org_jurisdictions)}</span>
          <p className="text-[12px] text-text-muted">{x(M.settings_org_jurisdictions_note)}</p>
          <div className="flex flex-wrap gap-[8px]">
            {JURISDICTION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-[4px] text-[12px] text-text">
                <input
                  type="checkbox"
                  checked={jurisdictions.includes(opt.value)}
                  onChange={() => toggleJurisdiction(opt.value)}
                  disabled={saving}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className={labelClass}>{x(M.settings_org_finance_features)}</span>
          <p className="text-[12px] text-text-muted">{x(M.settings_org_finance_features_note)}</p>
          <div className="grid grid-cols-2 gap-[8px] sm:grid-cols-3">
            {FINANCE_TAB_KEYS.map((tab) => (
              <label key={tab.key} className="flex items-center gap-[4px] text-[12px] text-text">
                <input
                  type="checkbox"
                  checked={financeFeatures[tab.key] !== false}
                  onChange={() => toggleFinanceFeature(tab.key)}
                  disabled={saving}
                />
                {x(FM[tab.label])}
              </label>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={saving || !hasChanges}
          onClick={() => void save()}
          className="mt-[2px] w-fit cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12px] font-bold text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {x(M.settings_org_save)}
        </button>
      </div>
    </div>
  )
}
