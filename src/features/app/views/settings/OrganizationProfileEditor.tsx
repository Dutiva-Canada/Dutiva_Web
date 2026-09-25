import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { financeMessages as FM } from '@/i18n/messages/finance'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { updateOrganizationSettings } from '@/features/app/workspaceMode/api'
import { WorkspaceModulesEditor } from './WorkspaceModulesEditor'

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
  { key: 'portfolio', label: 'finance_tab_portfolio' },
  { key: 'deals', label: 'finance_tab_deals' },
  { key: 'governance', label: 'finance_tab_governance' },
  { key: 'tax', label: 'finance_tab_tax' },
  { key: 'evidence', label: 'finance_tab_evidence' },
  { key: 'import-export', label: 'finance_tab_import_export' },
]

/* Org industry options — stable keys persisted on organizations.industry so
   module visibility and Advisor context can key off them later. A stored
   free-text value that predates the list renders as its own option so the
   select never silently clobbers it. */
const INDUSTRY_OPTIONS: { value: string; label: keyof typeof M }[] = [
  { value: 'technology', label: 'settings_org_industry_opt_technology' },
  { value: 'retail', label: 'settings_org_industry_opt_retail' },
  { value: 'manufacturing', label: 'settings_org_industry_opt_manufacturing' },
  { value: 'construction', label: 'settings_org_industry_opt_construction' },
  { value: 'logistics', label: 'settings_org_industry_opt_logistics' },
  { value: 'healthcare', label: 'settings_org_industry_opt_healthcare' },
  { value: 'hospitality', label: 'settings_org_industry_opt_hospitality' },
  { value: 'professional_services', label: 'settings_org_industry_opt_professional' },
  { value: 'investment_firm', label: 'settings_org_industry_opt_investment_firm' },
  { value: 'holding_company', label: 'settings_org_industry_opt_holding_company' },
  { value: 'trading_firm', label: 'settings_org_industry_opt_trading_firm' },
  { value: 'equity_firm', label: 'settings_org_industry_opt_equity_firm' },
  { value: 'other', label: 'settings_org_industry_opt_other' },
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
      JSON.stringify(jurisdictions.sort()) !==
        JSON.stringify([...organization.jurisdictions].sort()) ||
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
          <p className="m-0 text-[12px] text-text-muted">{x(M.settings_org_industry_note)}</p>
          <select
            id="settings-org-industry"
            value={industry}
            disabled={saving}
            onChange={(e) => setIndustry(e.target.value)}
            className={fieldClass}
          >
            <option value="">—</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {x(M[opt.label])}
              </option>
            ))}
            {/* Legacy free-text value not in the list — keep it visible and
                saveable until the org picks a structured key. */}
            {industry !== '' && !INDUSTRY_OPTIONS.some((o) => o.value === industry) && (
              <option value={industry}>{industry}</option>
            )}
          </select>
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
        <WorkspaceModulesEditor />
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
