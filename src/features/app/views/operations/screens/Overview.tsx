import { FolderKanban, Truck, ClipboardCheck, Cpu, PackageCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { useOperationsData } from '../OperationsDataContext'

export function Overview() {
  const { x } = useI18n()
  const { projects, vendors, qualityChecks, technology, logistics } = useOperationsData()

  const cards = [
    { icon: FolderKanban, label: M.ops_tab_projects, count: projects.length },
    { icon: PackageCheck, label: M.ops_tab_vendors, count: vendors.length },
    { icon: ClipboardCheck, label: M.ops_tab_quality, count: qualityChecks.length },
    { icon: Cpu, label: M.ops_tab_technology, count: technology.length },
    { icon: Truck, label: M.ops_tab_logistics, count: logistics.length },
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
        <FolderKanban size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
        <p className="m-0 text-[13px] text-text-muted">{x(M.ops_disclaimer)}</p>
      </div>
    </div>
  )
}
