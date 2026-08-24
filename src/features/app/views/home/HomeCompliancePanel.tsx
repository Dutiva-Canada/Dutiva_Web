import { ArrowRight } from 'lucide-react'
import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { homeMessages as M } from '@/i18n/messages/home'
import { complianceCategories, complianceScore } from '@/data'
import type { HomeAction } from './homeData'

/**
 * CompliancePrediction — the 82 → 88 (+6 in 90 days) card with the top three
 * category bars and the "Top lever · Remote Work Policy refresh +4" footer
 * (prototype Home markup lines 493–515; `buildComplianceView().categories`).
 */

/** Prototype `scoreColor` / `fillStyle` — category tone → colour utility. */
const categoryScoreClass = (tone: string) => {
  if (tone === 'risk') return 'text-risk-dot'
  if (tone === 'warning') return 'text-gold-dot'
  return 'text-ok-fg'
}
const categoryFillClass = (tone: string) => {
  if (tone === 'risk') return 'bg-risk-dot'
  if (tone === 'warning') return 'bg-gold-dot'
  return 'bg-ok-fg'
}

export function HomeCompliancePanel({
  onAction,
}: {
  readonly onAction: (action: HomeAction) => void
}) {
  const { x } = useI18n()
  const catRows = complianceCategories.slice(0, 3)

  return (
    <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[15px]">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-text">{x(M.home_compliance_title)}</span>
        <span className="inline-flex items-center gap-[3px] rounded-[6px] border border-ok-border bg-ok-bg px-[7px] py-[2px] text-[10.5px] font-bold text-ok-fg">
          {x(M.home_predicted_chip)}
        </span>
      </div>

      <div className="mt-[10px] flex items-end gap-[9px]">
        <div className="font-display text-[30px] leading-none font-semibold text-gold-dot">
          {complianceScore}
          <span className="font-sans text-[13px] text-text-faint">/100</span>
        </div>
        <ArrowRight
          size={18}
          strokeWidth={2}
          className="mb-[5px] text-text-faint"
          aria-hidden="true"
        />
        <div className="font-display text-[24px] leading-none font-semibold text-ok-fg">88</div>
        <span className="mb-[4px] text-[10.5px] text-text-muted">{x(M.home_predicted_in)}</span>
      </div>
      <div className="mt-[5px] text-[11px] text-text-muted">{x(M.home_predicted_note)}</div>

      <div className="mt-[13px] flex flex-col gap-[9px]">
        {catRows.map((cat) => (
          <div key={cat.key}>
            <div className="mb-[4px] flex justify-between gap-[8px] text-[11.5px]">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-text-2">
                {x(cat.label)}
              </span>
              <span className={`font-bold ${categoryScoreClass(cat.tone)}`}>{cat.score}</span>
            </div>
            <div className="h-[6px] overflow-hidden rounded-full bg-inset">
              <ProgressFill
                pct={cat.score}
                className={`h-full w-full rounded-full ${categoryFillClass(cat.tone).replace('bg-', 'text-')}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[12px] flex flex-wrap items-center gap-[8px] border-t border-border-soft pt-[11px]">
        <div className="min-w-[150px] flex-1 text-[11.5px] text-text-3">
          <span className="font-bold text-text-2">{x(M.home_lever_label)}</span> ·{' '}
          {x(M.home_lever_text)} <span className="font-bold text-ok-fg">+4</span>
        </div>
        <button
          type="button"
          onClick={() => onAction({ kind: 'doc', templateKey: 'T10' })}
          className="shrink-0 cursor-pointer rounded-[7px] border-none bg-accent-soft px-[11px] py-[6px] font-sans text-[11.5px] font-bold text-accent"
        >
          {x(M.home_lever_cta)}
        </button>
      </div>
    </div>
  )
}
