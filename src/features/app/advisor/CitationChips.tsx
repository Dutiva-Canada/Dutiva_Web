import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import { cardToneStyles } from './toneStyles'
import type { CardTone, Citation } from './types'

/**
 * Citation pills (statute references under a reply/card): 11.5px text on the
 * translucent `--cite-bg` fill with the parent card's tone border/foreground.
 */
interface CitationChipsProps {
  readonly citations: readonly Citation[]
  /** Tone of the surrounding card; standalone usage defaults to info. */
  readonly tone?: CardTone
}

export function CitationChips({ citations, tone = 'info' }: CitationChipsProps) {
  const { lang } = useI18n()
  if (citations.length === 0) return null
  const outline = cardToneStyles[tone].outline
  return (
    <div className="flex flex-wrap gap-[6px]">
      {citations.map((citation) => (
        <span
          key={keyOfL(citation.label)}
          className={`rounded-[100px] border bg-cite-bg px-[9px] py-[3px] text-[11.5px] ${outline}`}
        >
          {pickL(citation.label, lang)}
        </span>
      ))}
    </div>
  )
}
