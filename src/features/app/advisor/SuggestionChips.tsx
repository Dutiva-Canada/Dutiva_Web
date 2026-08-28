import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import type { LText } from '@/i18n/core'

/**
 * Advisor suggestion chips, per the prototype's three chip rows:
 *
 * - `suggest` — accent pills inside a reply ("could you tell me a bit more?")
 * - `followup` — round outline pills after a completed reply
 * - `SuggestionChipGrid` — the two-column label+sub cards on the Advisor
 *   empty state ("Terminate an employee · Ontario, BC, federal & more").
 */
export interface SuggestionChip {
  readonly label: LText
  readonly onClick: () => void
}

export interface SuggestionChipsProps {
  readonly chips: readonly SuggestionChip[]
  readonly variant?: 'suggest' | 'followup'
}

export function SuggestionChips({ chips, variant = 'suggest' }: SuggestionChipsProps) {
  const { lang } = useI18n()
  if (chips.length === 0) return null
  const chipClass =
    variant === 'suggest'
      ? 'cursor-pointer rounded-[9px] border border-(--accent-soft-border) bg-accent-soft px-[14px] py-[8px] text-[13px] font-semibold text-accent'
      : 'cursor-pointer rounded-[100px] border border-border bg-surface px-[13px] py-[7px] text-[12.5px] font-semibold text-text-2'
  return (
    <div className="flex max-w-[620px] flex-wrap gap-[8px]">
      {chips.map((chip) => (
        <button key={keyOfL(chip.label)} type="button" onClick={chip.onClick} className={chipClass}>
          {pickL(chip.label, lang)}
        </button>
      ))}
    </div>
  )
}

export interface SuggestionGridChip {
  readonly label: LText
  readonly sub: LText
  readonly onClick: () => void
}

export function SuggestionChipGrid({ chips }: { readonly chips: readonly SuggestionGridChip[] }) {
  const { lang } = useI18n()
  if (chips.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-[10px] text-left sm:grid-cols-2">
      {chips.map((chip) => (
        <button
          key={keyOfL(chip.label)}
          type="button"
          onClick={chip.onClick}
          className="flex cursor-pointer flex-col gap-[2px] rounded-[11px] border border-border bg-surface px-[14px] py-[12px] text-left"
        >
          <span className="text-[13.5px] font-semibold text-text">{pickL(chip.label, lang)}</span>
          <span className="text-[12px] text-text-muted">{pickL(chip.sub, lang)}</span>
        </button>
      ))}
    </div>
  )
}
