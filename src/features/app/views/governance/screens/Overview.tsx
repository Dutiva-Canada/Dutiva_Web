import { FileText, Gavel, Users, TrendingUp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { useGovernanceData } from '../GovernanceDataContext'

export function Overview() {
  const { x } = useI18n()
  const { records, decisions, officers, shareholders } = useGovernanceData()

  const cards = [
    { icon: FileText, label: M.gov_tab_records, count: records.length },
    { icon: Gavel, label: M.gov_tab_decisions, count: decisions.length },
    { icon: Users, label: M.gov_tab_officers, count: officers.length },
    { icon: TrendingUp, label: M.gov_tab_shareholders, count: shareholders.length },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
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
    </div>
  )
}
