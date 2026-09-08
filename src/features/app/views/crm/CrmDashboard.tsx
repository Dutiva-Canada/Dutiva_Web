import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import type { UseCrmDataReturn } from './useCrmData'
import { fromBi } from './crmUtils'

export function CrmDashboard({ crm }: { readonly crm: UseCrmDataReturn }) {
  const { x, lang } = useI18n()
  const openDeals = crm.state.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const wonDeals = crm.state.deals.filter((d) => d.stage === 'won')
  const pipeline = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const today = new Date()
  const inSeven = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = crm.state.activities.filter((a) => {
    if (!a.followUpDate) return false
    const d = new Date(a.followUpDate)
    return d >= today && d <= inSeven
  })

  const StatCard = ({
    label,
    value,
  }: {
    readonly label: React.ReactNode
    readonly value: React.ReactNode
  }) => (
    <div className="rounded-[10px] border border-border bg-surface p-[16px]">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-text-3">{label}</div>
      <div className="mt-[6px] font-display text-[1.75rem] font-semibold text-text">{value}</div>
    </div>
  )

  return (
    <div className="grid gap-[16px]">
      <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={x(M.crm_total_pipeline)} value={`$${pipeline.toLocaleString()}`} />
        <StatCard label={x(M.crm_open_deals)} value={String(openDeals.length)} />
        <StatCard label={x(M.crm_won_deals)} value={String(wonDeals.length)} />
        <StatCard label={x(M.crm_upcoming_followups)} value={String(upcoming.length)} />
      </div>

      <div className="grid gap-[12px] lg:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-surface p-[16px]">
          <h3 className="mb-[12px] text-[14px] font-semibold text-text">
            {x(M.crm_tab_deals)}
          </h3>
          {crm.state.deals.length === 0 ? (
            <p className="text-[13px] text-text-2">{x(M.crm_no_deal)}</p>
          ) : (
            <ul className="grid gap-[8px]">
              {crm.state.deals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex flex-wrap items-center justify-between gap-[8px] rounded-[8px] border border-border bg-inset px-[12px] py-[10px]"
                >
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-text truncate">
                    {deal.title}
                  </span>
                  <span className="text-[13px] text-text-2">
                    ${(deal.value ?? 0).toLocaleString()}
                  </span>
                  <span className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2">
                    {x(M[`crm_stage_${deal.stage}` as keyof typeof M])}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[10px] border border-border bg-surface p-[16px]">
          <h3 className="mb-[12px] text-[14px] font-semibold text-text">
            {x(M.crm_upcoming_followups)}
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-text-2">{x(M.crm_no_deal)}</p>
          ) : (
            <ul className="grid gap-[8px]">
              {upcoming.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-[8px] border border-border bg-inset px-[12px] py-[10px]"
                >
                  <div className="flex flex-wrap items-center gap-[8px] text-[13px] text-text">
                    <span>{x(M[`crm_activity_${activity.type}` as keyof typeof M])}</span>
                    <span className="text-text-3">·</span>
                    <span className="text-text-2">{crm.contactName(activity.contactId)}</span>
                    <span className="ml-auto text-[12px] text-text-3">{activity.followUpDate}</span>
                  </div>
                  <p className="mt-[4px] text-[12px] text-text-2 line-clamp-2">
                    {fromBi(activity.summary, lang)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
