import { Shield, Package, ClipboardList, AlertTriangle, Radar, Truck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { useSecurityData } from '../SecurityDataContext'

export function Overview() {
  const { x } = useI18n()
  const { assets, accessReviews, incidents, risks, vendorReviews } = useSecurityData()

  const cards = [
    { icon: Package, label: M.sec_tab_assets, count: assets.length },
    { icon: ClipboardList, label: M.sec_tab_access, count: accessReviews.length },
    { icon: AlertTriangle, label: M.sec_tab_incidents, count: incidents.length },
    { icon: Radar, label: M.sec_tab_risks, count: risks.length },
    { icon: Truck, label: M.sec_tab_vendors, count: vendorReviews.length },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label.en}
            className="flex items-center gap-[14px] rounded-[12px] border border-border bg-surface p-[16px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-inset">
              <Icon size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-[22px] font-bold text-text">{card.count}</div>
              <div className="text-[12.5px] text-text-muted">{x(card.label)}</div>
            </div>
          </div>
        )
      })}
      <div className="col-span-1 flex items-center gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:col-span-2 lg:col-span-3">
        <Shield size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
        <p className="m-0 text-[13px] text-text-muted">{x(M.sec_disclaimer)}</p>
      </div>
    </div>
  )
}
