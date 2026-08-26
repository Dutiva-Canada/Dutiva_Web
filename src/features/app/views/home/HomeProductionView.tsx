import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { homeMessages as M } from '@/i18n/messages/home'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { HomeProductionEmptyState } from './HomeProductionEmptyState'
import { useHomeProductionStats } from './useHomeProductionStats'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Home in production mode — the real command centre. A brand-new workspace
 * keeps the "Your workspace is ready" welcome (HomeProductionEmptyState);
 * once records exist this renders live stat tiles that deep-link to their
 * modules, a due-soon list drawn from real cases and tasks (overdue
 * flagged), and a policy-attention row. Everything loads through the
 * modules' own productionApi boundaries, like Reports.
 */

export function HomeProductionView({ onSend }: { readonly onSend: (text: string) => void }) {
  const { x } = useI18n()
  const { identity, organizationId } = useWorkspaceMode()
  const { data, loadFailed, reload, stats, dueItems, totalRecords } = useHomeProductionStats()

  /* No org yet (bootstrap pending/failed) or still loading — the welcome
     state stays useful and never flashes an error at the front door. */
  if (!organizationId || (data === null && !loadFailed)) {
    return (
      <HomeProductionEmptyState identity={identity} onSend={onSend} employeeCount={0} />
    )
  }

  if (loadFailed) {
    return (
      <AppPage width="default" responsivePad>
          <div className="mb-[24px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.home_prod_error)}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.home_prod_retry)}
            </button>
          </div>
          <ChatComposer
            variant="chat"
            placeholder={x(M.home_composer_placeholder)}
            onSend={onSend}
          />
          <Disclaimer className="mt-[8px] text-center" />
      </AppPage>
    )
  }

  /* Unreachable (loadFailed and data===null are mutually exclusive above),
     but TypeScript can't correlate the two guards. */
  if (data === null) {
    return (
      <HomeProductionEmptyState identity={identity} onSend={onSend} employeeCount={0} />
    )
  }

  if (totalRecords === 0) {
    return (
      <HomeProductionEmptyState
        identity={identity}
        onSend={onSend}
        employeeCount={data.employees}
      />
    )
  }

  return (
    <AppPage width="default" responsivePad>
        {/* Header */}
        <div className="mb-[18px]">
          <div className="mb-[6px] text-[10.5px] font-bold tracking-[0.09em] text-gold-dot uppercase">
            {identity.companyName}
          </div>
          <h1 className="m-0 mb-[4px] font-display text-[23px] font-semibold text-text">
            {x(M.home_prod_greeting)}
          </h1>
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.home_prod_sub)}</p>
        </div>

        {/* Stat tiles → modules */}
        <div className="mb-[20px] flex flex-wrap gap-[14px]">
          {stats.map((stat) => (
            <Link
              key={stat.label.en}
              to={stat.to}
              className="min-w-[140px] flex-1 rounded-[12px] border border-border bg-surface p-[16px] transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-(--accent-soft-border)"
            >
              <div className="font-display text-[28px] font-bold text-text">{stat.value}</div>
              <div className="mt-[2px] text-[12.5px] text-text-muted">{x(stat.label)}</div>
            </Link>
          ))}
        </div>

        {/* Due soon */}
        <div className="mb-[20px]">
          <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
            {x(M.home_prod_due_title)}
          </div>
          <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
            {dueItems.length === 0 && (
              <div className="px-[18px] py-[16px] text-[13px] text-text-muted">
                {x(M.home_prod_due_none)}
              </div>
            )}
            {dueItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[12px] first:border-t-0 hover:bg-inset"
              >
                <span className={statusChipClass(item.overdue ? 'risk' : 'info')}>
                  {item.overdue ? x(M.home_prod_overdue) : x(item.kind)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                  {item.title}
                </span>
                <span className="shrink-0 text-[12px] text-text-muted">{item.dueDate}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Policy attention */}
        {data.policiesNeedingAttention > 0 && (
          <Link
            to="/app/policies"
            className="mb-[20px] flex items-center gap-[12px] rounded-[12px] border border-gold-border bg-gold-bg px-[16px] py-[13px] hover:opacity-90"
          >
            <BookOpen
              size={16}
              strokeWidth={1.7}
              className="shrink-0 text-gold-fg"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-[13px] font-semibold text-gold-fg">
              {data.policiesNeedingAttention}{' '}
              {x(
                data.policiesNeedingAttention === 1
                  ? M.home_prod_policy_attention_one
                  : M.home_prod_policy_attention_many,
              )}
            </span>
            <span className="shrink-0 text-[12.5px] font-bold text-gold-fg">
              {x(M.home_prod_policy_open)}
            </span>
          </Link>
        )}

        {/* Composer */}
        <div className="mx-auto mt-[26px] max-w-[760px]">
          <div className="rounded-[14px] shadow-float">
            <ChatComposer
              variant="chat"
              placeholder={x(M.home_composer_placeholder)}
              onSend={onSend}
            />
          </div>
          <Disclaimer className="mt-[8px] text-center" />
        </div>
    </AppPage>
  )
}
