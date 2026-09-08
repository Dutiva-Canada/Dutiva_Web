import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { revenueMessages as M } from '@/i18n/messages/revenue'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { AppPage } from '@/features/app/shell/AppPage'
import { useCrmData } from '@/features/app/views/crm/useCrmData'
import { loadCommsState } from '@/features/app/views/comms/data/productionApi'
import { initialCommsState } from '@/features/app/views/comms/data/fixtures'
import { statusChipClass } from '@/components/chips'
import { Funnel, Megaphone, Activity, Calendar } from 'lucide-react'

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const

function formatCurrency(value: number | undefined, currency = 'CAD'): string {
  if (value == null) return ''
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function RevenueView() {
  const { x } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()
  const { root } = useWorkspaceRoot()

  const crm = useCrmData(mode, organizationId ?? undefined)
  const crmState = crm.state

  const commsState =
    mode === 'production' && organizationId ? loadCommsState(organizationId) : initialCommsState

  const pipeline = STAGE_ORDER.map((stage) => ({
    stage,
    deals: crmState.deals.filter((d) => d.stage === stage),
  })).filter((group) => group.deals.length > 0)

  const totalOpenValue = crmState.deals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + (d.value ?? 0), 0)

  const activeCampaigns = commsState.initiatives
    .filter((i) => i.status === 'active')
    .slice(0, 5)

  const recentActivity = [...crmState.activities]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const upcomingComms = commsState.contentItems
    .filter((c) => c.deliveryStatus === 'scheduled' || c.status === 'approved')
    .sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? ''))
    .slice(0, 5)

  return (
    <AppPage width="default" responsivePad>
      <div className="mb-[18px]">
        <h1 className="m-0 mb-[4px] font-display text-[23px] font-semibold text-text">{x(M.rev_title)}</h1>
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.rev_subtitle)}</p>
      </div>

      <div className="mb-[18px] flex flex-wrap gap-3">
        <Link
          to={`${root}/crm`}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(M.rev_go_to_crm)}
        </Link>
        <Link
          to={`${root}/comms`}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(M.rev_go_to_comms)}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Funnel size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_pipeline)}</h2>
          </div>
          {crmState.deals.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_crm)}</p>
          ) : (
            <>
              <div className="mb-[12px] text-[13px] text-text-muted">
                {x(M.rev_value)}: {formatCurrency(totalOpenValue)}
              </div>
              <div className="space-y-2">
                {pipeline.map((group) => (
                  <div
                    key={group.stage}
                    className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                  >
                    <span className="text-[13px] capitalize text-text">{group.stage}</span>
                    <div className="text-[13px] text-text-muted">
                      {group.deals.length} {x(M.rev_deals)} · {formatCurrency(
                        group.deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Megaphone size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_active_campaigns)}</h2>
          </div>
          {activeCampaigns.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_comms)}</p>
          ) : (
            <div className="space-y-2">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <span className="text-[13px] text-text">{x(campaign.title)}</span>
                  <span className={statusChipClass('success')}>{campaign.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Activity size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_recent_activity)}</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_crm)}</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <span className="text-[13px] text-text">{x(activity.summary)}</span>
                  <span className="text-[12px] text-text-muted">{activity.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Calendar size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_upcoming_comms)}</h2>
          </div>
          {upcomingComms.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_comms)}</p>
          ) : (
            <div className="space-y-2">
              {upcomingComms.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <span className="text-[13px] text-text">{x(item.title)}</span>
                  <span className="text-[12px] text-text-muted">{item.scheduledFor}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-[18px] rounded-[12px] border border-border bg-surface p-[14px]">
        <p className="m-0 text-[13px] text-text-muted">{x(M.rev_disclaimer)}</p>
      </div>
    </AppPage>
  )
}
