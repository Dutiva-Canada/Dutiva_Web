import { ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import { advisorCore as M } from '@/i18n/messages/advisorCore'
import { CitationChips } from './CitationChips'
import { cardToneStyles } from './toneStyles'
import type { ToneCardData } from './types'

/**
 * Embedded Advisor tone card (prototype `prepCard()` + card markup):
 * tone-tinted panel with status dot + title, body, optional confidence line,
 * citation pills, an automatic trust note on risk/warning tones, and action
 * buttons (primary = white on the tone's dot colour, secondary = outline).
 */
interface ToneCardProps {
  readonly card: ToneCardData
}

function trustNoteFor(tone: ToneCardData['tone']) {
  if (tone === 'risk') return M.advisor_trust_risk
  if (tone === 'warning') return M.advisor_trust_warning
  return null
}

export function ToneCard({ card }: ToneCardProps) {
  const { x, lang } = useI18n()
  const tone = cardToneStyles[card.tone]
  const trustNote = trustNoteFor(card.tone)
  const citations = card.citations ?? []
  const actions = card.actions ?? []

  return (
    <div
      className={`flex min-w-0 flex-col gap-[8px] rounded-[12px] border px-[16px] py-[14px] ${tone.card}`}
    >
      <div className="flex items-center gap-[8px]">
        <div className={`h-[7px] w-[7px] shrink-0 rounded-full ${tone.dot}`} />
        <div className={`text-[13.5px] font-bold ${tone.title}`}>{pickL(card.title, lang)}</div>
      </div>
      <div className="text-[13.5px] leading-[1.55] text-text-2">{pickL(card.body, lang)}</div>
      {card.confidence !== undefined && (
        <div className="text-[12px] text-text-muted">
          <strong className="text-text-3">{x(M.advisor_confidence)}</strong>
          {pickL(card.confidence, lang)}
        </div>
      )}
      {citations.length > 0 && <CitationChips citations={citations} tone={card.tone} />}
      {trustNote && (
        <div className="mt-[2px] flex items-center gap-[6px] border-t border-border-soft pt-[8px] text-[11.5px] text-text-muted">
          <ShieldCheck size={13} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
          <span>{x(trustNote)}</span>
        </div>
      )}
      {actions.length > 0 && (
        <div className="mt-[2px] flex gap-[8px]">
          {actions.map((action) => (
            <button
              key={keyOfL(action.label)}
              type="button"
              onClick={action.onClick}
              className={
                action.primary
                  ? `cursor-pointer rounded-[7px] border-none px-[13px] py-[7px] text-[12.5px] font-semibold text-white ${tone.primaryBtn}`
                  : `cursor-pointer rounded-[7px] border bg-transparent px-[13px] py-[7px] text-[12.5px] font-semibold ${tone.outline}`
              }
            >
              {pickL(action.label, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
