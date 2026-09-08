import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { AppPage } from '@/features/app/shell/AppPage'

const TABS = [
  { key: 'directory', to: 'directory' },
  { key: 'engagements', to: 'engagements' },
] as const

export function SpecialistsLayout() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { pathname } = useLocation()

  return (
    <AppPage width="default" responsivePad>
      <div className="mb-[18px]">
        <h1 className="m-0 mb-[4px] font-display text-[23px] font-semibold text-text">
          {x(M.spec_title)}
        </h1>
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.spec_subtitle)}</p>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((tab) => {
          const to = `${root}/specialists/${tab.to}`
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
              {x(M[`spec_tab_${tab.key}` as keyof typeof M])}
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
