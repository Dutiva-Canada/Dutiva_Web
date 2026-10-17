import { Lock } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'

/* The subscription-only chip — a count of what's hidden plus the names
   on hover, because 'hidden' should never be anonymous. Shared by the
   Overview feed and the Analysis board. */
export function NewsPaywallChip({
  hiddenCount,
  hiddenSources,
  showPaywalled,
  onToggle,
}: {
  hiddenCount: number
  hiddenSources: string[]
  showPaywalled: boolean
  onToggle: () => void
}) {
  const { x } = useI18n()
  if (!showPaywalled && hiddenCount === 0) return null
  const namesTitle =
    hiddenSources.length > 0
      ? x(IM.invest_news_paywalled_sources).replace('{sources}', hiddenSources.join(', '))
      : undefined
  return (
    <div className="mt-[8px] flex flex-wrap items-center gap-[6px]">
      <button
        type="button"
        aria-pressed={showPaywalled}
        title={namesTitle}
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-[4px] rounded-full border border-border bg-inset px-[8px] py-[3px] text-[11px] font-medium text-text-2 transition-colors hover:border-border-strong hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Lock size={10} aria-hidden="true" />
        {showPaywalled
          ? x(IM.invest_news_paywalled_shown)
          : x(IM.invest_news_paywalled_hidden).replace('{n}', String(hiddenCount))}
      </button>
    </div>
  )
}
