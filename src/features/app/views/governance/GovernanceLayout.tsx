import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { AppPage } from '@/features/app/shell/AppPage'

const TABS = [
  { key: 'overview', to: 'overview' },
  { key: 'records', to: 'records' },
  { key: 'decisions', to: 'decisions' },
  { key: 'officers', to: 'officers' },
  { key: 'shareholders', to: 'shareholders' },
] as const

export function GovernanceLayout() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { pathname } = useLocation()
  const { mode } = useWorkspaceMode()

  return (
    <AppPage width="default" responsivePad>
      <div className="mb-[18px]">
        <h1 className="m-0 mb-[4px] font-display text-[23px] font-semibold text-text">
          {x(M.gov_title)}
        </h1>
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_subtitle)}</p>
      </div>

      <div className="mb-[8px] text-[12px] text-text-muted">
        {mode === 'demo' ? x(M.gov_demo_read_only) : x(M.gov_production_synced)}
      </div>

      <div className="mb-[18px] flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((tab) => {
          const to = `${root}/governance/${tab.to}`
          const active = pathname === to || pathname.startsWith(`${to}/`)
          return (
            <Link
              key={tab.key}
              to={to}
              className={
                active
                  ? 'rounded-t-[6px] border-b-2 border-accent px-3 py-1.5 text-[13.5px] font-semibold text-accent'
                  : 'rounded-t-[6px] px-3 py-1.5 text-[13.5px] font-medium text-text-muted hover:text-text'
              }
            >
              {x(M[`gov_tab_${tab.key}` as keyof typeof M])}
            </Link>
          )
        })}
      </div>

      <div className="min-h-[200px]">
        <Outlet />
      </div>
    </AppPage>
  )
}
