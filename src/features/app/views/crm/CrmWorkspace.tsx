import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import { AppPage, AppPageLead } from '@/features/app/shell/AppPage'
import { useCrmData } from './useCrmData'
import { CrmDashboard } from './CrmDashboard'
import { CrmContacts } from './CrmContacts'
import { CrmCompanies } from './CrmCompanies'
import { CrmDeals } from './CrmDeals'
import { CrmActivities } from './CrmActivities'

const TABS = ['dashboard', 'contacts', 'companies', 'deals', 'activities'] as const

type CrmTab = (typeof TABS)[number]

export function CrmWorkspace({
  mode,
  organizationId,
}: {
  readonly mode: 'demo' | 'production'
  readonly organizationId: string | undefined
}) {
  const { x } = useI18n()
  const crm = useCrmData(mode, organizationId)
  const [activeTab, setActiveTab] = useState<CrmTab>('dashboard')

  return (
    <AppPage width="wide">
      <div className="mb-[18px] flex flex-wrap items-center gap-[8px]">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-[8px] border px-[14px] py-[8px] text-[13px] font-semibold transition-colors ${
              activeTab === tab
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-surface text-text'
            }`}
          >
            {x(M[`crm_tab_${tab}` as keyof typeof M])}
          </button>
        ))}
      </div>

      {mode === 'demo' && (
        <AppPageLead>{x(M.crm_demo_note)}</AppPageLead>
      )}

      {activeTab === 'dashboard' && <CrmDashboard crm={crm} />}
      {activeTab === 'contacts' && <CrmContacts crm={crm} />}
      {activeTab === 'companies' && <CrmCompanies crm={crm} />}
      {activeTab === 'deals' && <CrmDeals crm={crm} />}
      {activeTab === 'activities' && <CrmActivities crm={crm} />}
    </AppPage>
  )
}
