import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  Contact,
  Eye,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { AppPage } from '@/features/app/shell/AppPage'
import { Disclaimer } from '@/components/Disclaimer'
import type { LucideIcon } from 'lucide-react'

interface CommsTab {
  key: string
  to: string
  label: keyof typeof M
  icon: LucideIcon
}

const TABS: CommsTab[] = [
  { key: 'overview', to: 'overview', label: 'comms_tab_overview', icon: LayoutDashboard },
  { key: 'initiatives', to: 'initiatives', label: 'comms_tab_initiatives', icon: Megaphone },
  { key: 'content', to: 'content', label: 'comms_tab_content', icon: CalendarDays },
  { key: 'relationships', to: 'relationships', label: 'comms_tab_relationships', icon: Contact },
  { key: 'engagement', to: 'engagement', label: 'comms_tab_engagement', icon: MessageSquare },
  { key: 'intelligence', to: 'intelligence', label: 'comms_tab_intelligence', icon: Eye },
  { key: 'results', to: 'results', label: 'comms_tab_results', icon: BarChart3 },
  { key: 'settings', to: 'settings', label: 'comms_tab_settings', icon: Settings },
]

interface CommsLayoutProps {
  mode: 'demo' | 'production'
}

export function CommsLayout({ mode }: CommsLayoutProps) {
  const { x } = useI18n()
  return (
    <AppPage width="comfort">
      <div className="mb-[18px]">
        <h1 className="text-[22px] font-bold text-text">{x(M.comms_title)}</h1>
        <p className="mt-[4px] text-[13px] text-text-muted">{x(M.comms_subtitle)}</p>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[6px]">
        {TABS.map((tab) => {
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

      <div className="mb-[14px] text-[12px] text-text-muted">
        {mode === 'demo' ? x(M.comms_demo_read_only) : x(M.comms_production_local_only)}
      </div>

      <Outlet />

      <div className="mt-[24px]">
        <Disclaimer />
      </div>
    </AppPage>
  )
}
