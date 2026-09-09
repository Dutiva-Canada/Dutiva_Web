import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { updateOrganizationSettings } from '@/features/app/workspaceMode/api'
import {
  TOGGLEABLE_MODULES,
  isModuleEnabled,
  type WorkspaceModuleKey,
} from '@/features/app/workspaceMode/workspaceModules'
import { getNavGroups } from '@/features/app/shell/navConfig'
import { shellMessages as SHELL } from '@/i18n/messages/shell'
import { financeMessages as FINANCE } from '@/i18n/messages/finance'
import { crmMessages as CRM } from '@/i18n/messages/crm'
import { commsMessages as COMMS } from '@/i18n/messages/comms'
import { memoryMessages as MEMORY } from '@/i18n/messages/memory'
import type { Bi } from '@/i18n/core'

const MODULE_LABELS: Record<WorkspaceModuleKey, Bi> = {
  home: SHELL.shell_nav_home,
  advisor: SHELL.shell_nav_advisor_home,
  memory: MEMORY.memory_title,
  workflows: SHELL.shell_nav_workflows,
  revenue: SHELL.shell_nav_revenue,
  crm: CRM.crm_title,
  comms: COMMS.comms_title,
  operations: SHELL.shell_nav_operations,
  planning: SHELL.shell_nav_planning,
  documents: SHELL.shell_nav_library,
  knowledge: SHELL.shell_nav_knowledge,
  employees: SHELL.shell_nav_people,
  cases: SHELL.shell_nav_cases,
  hiring: SHELL.shell_nav_hiring,
  wellbeing: SHELL.shell_nav_wellbeing,
  communications: SHELL.shell_nav_communications,
  finance: FINANCE.finance_title,
  compensation: SHELL.shell_nav_compensation,
  governance: SHELL.shell_nav_governance,
  compliance: SHELL.shell_nav_compliance,
  policies: SHELL.shell_nav_policies,
  security: SHELL.shell_nav_security,
  specialists: SHELL.shell_nav_specialists,
  analytics: SHELL.shell_nav_analytics,
}

const labelClass = 'block text-[12px] text-text-muted'

function groupBySidebarHeading(): { heading: Bi | null; modules: WorkspaceModuleKey[] }[] {
  const groups = getNavGroups('/app')
  return groups
    .map((group) => ({
      heading: group.heading,
      modules: group.items
        .map((item) => item.key as WorkspaceModuleKey)
        .filter((key) => TOGGLEABLE_MODULES.includes(key)),
    }))
    .filter((group) => group.modules.length > 0)
}

export function WorkspaceModulesEditor() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { organization, organizationId, isOrgAdmin, refreshOrganization } = useWorkspaceMode()
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(
    organization?.enabledModules ?? {},
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEnabledModules(organization?.enabledModules ?? {})
  }, [organization])

  const hasChanges = useMemo(() => {
    if (!organization) return false
    return JSON.stringify(enabledModules) !== JSON.stringify(organization.enabledModules)
  }, [enabledModules, organization])

  if (!isOrgAdmin || !organizationId) return null

  const toggleModule = (key: WorkspaceModuleKey) => {
    setEnabledModules((prev) => ({ ...prev, [key]: !isModuleEnabled(prev, key) }))
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const saved = await updateOrganizationSettings(organizationId, { enabledModules })
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

  const grouped = groupBySidebarHeading()

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <span className={labelClass}>{x(M.settings_org_workspace_modules)}</span>
        <p className="text-[12px] text-text-muted">{x(M.settings_org_workspace_modules_note)}</p>
        {grouped.map((group, i) => (
          <div key={i} className="mt-[8px]">
            {group.heading != null && (
              <div className="mb-[6px] text-[11px] font-bold uppercase tracking-wider text-text-faint">
                {pick(group.heading, lang)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-[8px] sm:grid-cols-3">
              {group.modules.map((key) => (
                <label key={key} className="flex items-center gap-[4px] text-[12px] text-text">
                  <input
                    type="checkbox"
                    checked={isModuleEnabled(enabledModules, key)}
                    onChange={() => toggleModule(key)}
                    disabled={saving}
                  />
                  {pick(MODULE_LABELS[key], lang)}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={saving || !hasChanges}
        onClick={() => void save()}
        className="w-fit cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12px] font-bold text-text disabled:cursor-not-allowed disabled:opacity-60"
      >
        {x(M.settings_org_save)}
      </button>
    </div>
  )
}
