import { ChevronRight, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { homeMessages as M } from '@/i18n/messages/home'
import { statusChipClass } from '@/components/chips'
import {
  actNowPriorities,
  severityLabels,
  thisWeekPriorities,
  watchingPriorities,
} from './homeData'
import type { HomeAction, HomePriority } from './homeData'

/**
 * PriorityQueue — the Act now / This week / Watching stacks (prototype Home
 * markup lines 411–475). Act now cards carry the inline "why this matters"
 * inset, a primary action and an Ask Advisor flow; This week / Watching rows
 * are single-tap buttons with a due pill / severity chip.
 */

function SeverityChip({ priority }: { readonly priority: HomePriority }) {
  const { x } = useI18n()
  return (
    <span className={statusChipClass(priority.tone)}>{x(severityLabels[priority.severity])}</span>
  )
}

export function HomeActNowSection({
  onAction,
}: {
  readonly onAction: (action: HomeAction) => void
}) {
  const { x } = useI18n()
  return (
    <div>
      <div className="mb-[7px] text-[11px] font-bold tracking-wider text-risk-fg uppercase">
        {x(M.home_act_now)} · {actNowPriorities.length}
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
        {actNowPriorities.map((p) => {
          const ask = p.ask
          return (
            <div
              key={p.id}
              className="border-t border-t-inset border-l-[3px] border-l-risk-dot pt-[14px] pr-[16px] pb-[14px] pl-[13px]"
            >
              <div className="flex flex-wrap items-center gap-[8px]">
                <SeverityChip priority={p} />
                <span className="text-[13.5px] font-semibold text-text">{x(p.title)}</span>
              </div>
              <div className="mt-[3px] text-[12px] text-text-muted">{x(p.meta)}</div>
              <div className="mt-[9px] text-[12.5px] leading-[1.55] text-text-3">{x(p.why)}</div>
              <div className="mt-[10px] flex items-center gap-[10px]">
                <button
                  type="button"
                  onClick={() => onAction(p.action)}
                  className="cursor-pointer rounded-[7px] border-none bg-navy px-[13px] py-[7px] font-sans text-[12px] font-bold text-white hover:opacity-92"
                >
                  {x(p.actionLabel)}
                </button>
                {ask && (
                  <button
                    type="button"
                    onClick={() =>
                      onAction({ kind: 'flow', prompt: ask, flowKey: p.askFlowKey ?? 'fallback' })
                    }
                    className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent px-[2px] py-[7px] font-sans text-[12px] font-semibold text-gold-fg"
                  >
                    <Sparkle size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                    {x(M.home_ask_advisor)}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function HomeThisWeekSection({
  onAction,
}: {
  readonly onAction: (action: HomeAction) => void
}) {
  const { x } = useI18n()
  return (
    <div>
      <div className="mb-[7px] text-[11px] font-bold tracking-wider text-warn-fg uppercase">
        {x(M.home_this_week)} · {thisWeekPriorities.length}
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
        {thisWeekPriorities.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAction(p.action)}
            aria-label={x(p.title)}
            className="flex w-full cursor-pointer items-center gap-[11px] border-t border-t-inset border-l-[3px] border-l-gold-dot bg-transparent pt-[12px] pr-[14px] pb-[12px] pl-[11px] text-left font-sans hover:bg-inset"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-text">{x(p.title)}</div>
              <div className="mt-[2px] text-[11.5px] text-text-muted">{x(p.meta)}</div>
            </div>
            {p.due && (
              <span
                className={
                  p.due.warn
                    ? 'shrink-0 rounded-[6px] border border-warn-border bg-warn-bg px-[7px] py-[2px] text-[11px] font-semibold whitespace-nowrap text-warn-fg'
                    : 'shrink-0 rounded-[6px] border border-transparent bg-inset px-[7px] py-[2px] text-[11px] font-semibold whitespace-nowrap text-text-3'
                }
              >
                {x(p.due.label)}
              </span>
            )}
            <ChevronRight
              size={14}
              strokeWidth={2}
              className="shrink-0 text-text-faint"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function HomeWatchingSection({
  onAction,
}: {
  readonly onAction: (action: HomeAction) => void
}) {
  const { x } = useI18n()
  return (
    <div>
      <div className="mb-[7px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
        {x(M.home_watching)} · {watchingPriorities.length}
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
        {watchingPriorities.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAction(p.action)}
            aria-label={x(p.title)}
            className="flex w-full cursor-pointer items-center gap-[11px] border-t border-t-inset border-l-[3px] border-l-border bg-transparent pt-[12px] pr-[14px] pb-[12px] pl-[11px] text-left font-sans hover:bg-inset"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-text">{x(p.title)}</div>
              <div className="mt-[2px] text-[11.5px] text-text-muted">{x(p.meta)}</div>
            </div>
            <SeverityChip priority={p} />
          </button>
        ))}
      </div>
    </div>
  )
}
