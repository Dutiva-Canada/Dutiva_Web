import { NavLink, Outlet } from 'react-router-dom'
import {
  Banknote,
  BookOpen,
  Building2,
  Calculator,
  FileText,
  LayoutDashboard,
  Paperclip,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Upload,
  Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { AppPage } from '@/features/app/shell/AppPage'
import { Disclaimer } from '@/components/Disclaimer'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useFinanceData } from './data/useFinanceData'
import type { LucideIcon } from 'lucide-react'

interface FinanceTab {
  key: string
  to: string
  label: keyof typeof M
  icon: LucideIcon
}

const TABS: FinanceTab[] = [
  { key: 'overview', to: 'overview', label: 'finance_tab_overview', icon: LayoutDashboard },
  { key: 'entities', to: 'entities', label: 'finance_tab_entities', icon: Building2 },
  { key: 'transactions', to: 'transactions', label: 'finance_tab_transactions', icon: Receipt },
  { key: 'sales', to: 'sales', label: 'finance_tab_sales', icon: FileText },
  { key: 'purchases', to: 'purchases', label: 'finance_tab_purchases', icon: ShoppingBag },
  { key: 'payroll', to: 'payroll', label: 'finance_tab_payroll', icon: Wallet },
  { key: 'accounting', to: 'accounting', label: 'finance_tab_accounting', icon: BookOpen },
  { key: 'plans', to: 'plans', label: 'finance_tab_plans', icon: Calculator },
  { key: 'treasury', to: 'treasury', label: 'finance_tab_treasury', icon: PiggyBank },
  { key: 'tax', to: 'tax', label: 'finance_tab_tax', icon: Banknote },
  { key: 'evidence', to: 'evidence', label: 'finance_tab_evidence', icon: Paperclip },
  { key: 'import-export', to: 'import-export', label: 'finance_tab_import_export', icon: Upload },
]

interface FinanceLayoutProps {
  mode: 'demo' | 'production'
}

export function FinanceLayout({ mode }: FinanceLayoutProps) {
  const { x } = useI18n()
  const { hasSupabase } = useFinanceData()
  const { organization } = useWorkspaceMode()

  const visibleTabs = mode === 'demo' ? TABS : TABS.filter((tab) => {
    const flags = organization?.financeFeatures
    if (!flags || Object.keys(flags).length === 0) return true
    return flags[tab.key] !== false
  })

  const modeMessage = (() => {
    if (mode === 'demo') return x(M.finance_demo_read_only)
    if (hasSupabase) return x(M.finance_production_workspace)
    return x(M.finance_production_local_only)
  })()

  return (
    <AppPage width="comfort">
      <div className="mb-[18px]">
        <h1 className="text-[22px] font-bold text-text">{x(M.finance_title)}</h1>
        <p className="mt-[4px] text-[13px] text-text-muted">{x(M.finance_subtitle)}</p>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[6px]">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.key}
              to={tab.to}
              end={tab.key === 'overview'}
              className={({ isActive }) =>
                `flex items-center gap-[6px] rounded-[10px] px-[12px] py-[8px] text-[12.5px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'bg-surface text-text-2 hover:bg-inset border border-border'
                }`
              }
            >
              <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M[tab.label])}
            </NavLink>
          )
        })}
      </div>

      <div className="mb-[14px] text-[12px] text-text-muted">{modeMessage}</div>

      <Outlet />

      <div className="mt-[24px]">
        <Disclaimer />
      </div>
    </AppPage>
  )
}
