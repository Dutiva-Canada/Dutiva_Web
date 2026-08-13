import { ArrowUp, ClipboardCheck, FileText, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanding } from '../useLanding'

/**
 * The hero's embedded product frame — a static, theme-aware recreation of the
 * prototype's Advisor demo card (navy user bubble, sparkle avatar, 3-tier
 * risk system, document chips, follow-up composer). Purely presentational.
 */
export function AdvisorDemo() {
  const { lt } = useLanding()
  return (
    <div
      id="advisor"
      className="premium-card animate-fade-up scroll-mt-20 overflow-hidden p-0"
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border bg-bg-elevated px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-gold">
            <Sparkles size={19} />
          </span>
          <span>
            <span className="block font-semibold text-text">{lt('landing_adv_name')}</span>
            <span className="block text-[0.8125rem] text-text-2">{lt('landing_adv_juris')}</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ok-border bg-ok-bg px-2.5 py-1 text-xs font-semibold text-ok-fg">
          <span className="h-1.75 w-1.75 rounded-full bg-ok-fg" />
          {lt('landing_adv_live')}
        </span>
      </div>

      {/* Transcript */}
      <div className="grid gap-3.5 bg-bg-soft p-5">
        <div className="ml-auto max-w-[86%] rounded-[16px_16px_3px_16px] bg-navy px-4 py-2.75 text-[0.9375rem] leading-[1.55] text-white">
          {lt('landing_adv_user_q')}
        </div>

        <div className="max-w-[94%] rounded-[16px_16px_16px_3px] border border-border bg-bg-elevated px-4 py-3.5">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-warn-border bg-warn-bg px-2.25 py-0.75 text-[0.6875rem] font-bold tracking-[0.06em] uppercase text-warn-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-fg" />
            {lt('landing_adv_risk')}
          </div>
          <p className="m-0 text-[0.9375rem] leading-[1.55] text-text">
            {lt('landing_adv_answer')}
          </p>
          <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-text-3">
            <FileText size={12} />
            {lt('landing_adv_source')}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DocChip
            icon={FileText}
            label={lt('landing_adv_chip1')}
            action={lt('landing_adv_generate')}
          />
          <DocChip
            icon={ClipboardCheck}
            label={lt('landing_adv_chip2')}
            action={lt('landing_adv_generate')}
          />
        </div>

        <div className="flex items-end gap-2.5 rounded-[14px] border border-border bg-bg-elevated p-2 pl-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.35)]">
          <span className="flex-1 py-2 text-sm text-text-3">{lt('landing_adv_followup')}</span>
          <span className="grid h-8.5 w-8.5 flex-none place-items-center rounded-[9px] bg-navy">
            <ArrowUp size={15} className="text-white" />
          </span>
        </div>
      </div>
    </div>
  )
}

function DocChip({
  icon: Icon,
  label,
  action,
}: {
  readonly icon: LucideIcon
  readonly label: string
  readonly action: string
}) {
  return (
    <span className="flex items-center gap-2 rounded-[10px] border border-border bg-bg-elevated py-1.75 pr-2 pl-2.25 text-[0.8125rem]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-bg-soft">
        <Icon size={12} className="text-text-3" />
      </span>
      <span className="font-semibold text-text">{label}</span>
      <span className="rounded-md bg-gold-subtle px-2.25 py-1 text-xs font-bold text-gold-strong">
        {action}
      </span>
    </span>
  )
}
