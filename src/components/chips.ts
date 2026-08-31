import type { Tone } from '@/data'

/**
 * Status-chip and status-dot colour helpers — THE port of the prototype's
 * `statusChipStyle(tone)` (App v2.dc.html, 3310–3314), `sourceChipStyle(tone)`
 * (4125–4128) and the status-dot fills (4134, 4163). Every view renders its
 * tone chips through this module; views that need a non-default chip size
 * compose `chipToneClass(tone)` with their own base classes.
 */

/** Fixture tones plus the `neutral` step used by timeline/org/workflow chips. */
export type ChipTone = Tone | 'neutral'

type ChipToneKey = 'risk' | 'warning' | 'success' | 'info' | 'neutral'

/** Prototype `statusChipStyle(tone)` colour map as token utilities. */
export const chipToneClasses: Record<ChipToneKey, string> = {
  risk: 'bg-risk-bg text-risk-fg',
  warning: 'bg-warn-bg text-warn-fg',
  success: 'bg-ok-bg text-ok-fg',
  info: 'bg-accent-soft text-accent',
  neutral: 'bg-inset text-text-muted',
}

/** Resolve any fixture tone ('suggestion' renders as info, like the prototype). */
function toneKey(tone: ChipTone, fallback: ChipToneKey): ChipToneKey {
  if (tone === 'risk' || tone === 'warning' || tone === 'success' || tone === 'neutral') {
    return tone
  }
  if (tone === 'info') return 'info'
  return fallback
}

/** Colour ramp only — compose with view-specific base classes for odd sizes. */
export function chipToneClass(tone: ChipTone): string {
  return chipToneClasses[toneKey(tone, 'info')]
}

/** Base of the prototype's `statusChipStyle` (12px/600, 3px 10px, 100px radius). */
export const statusChipBaseClass =
  'inline-flex rounded-[100px] px-[10px] py-[3px] text-[12px] font-semibold whitespace-nowrap'

/** Pill status chip. Unknown tones fall back to info. */
export function statusChipClass(tone: ChipTone): string {
  return `${statusChipBaseClass} ${chipToneClass(tone)}`
}

/** Uppercase source chip (10.5px, 2px 7px, radius 5px). Unknown tones fall back to neutral. */
export function sourceChipClass(tone: ChipTone): string {
  return `inline-flex shrink-0 rounded-[5px] px-[7px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] uppercase whitespace-nowrap ${chipToneClasses[toneKey(tone, 'neutral')]}`
}

/** Status-dot fill (risk-dot / gold-dot / ok-fg / text-faint / accent). */
export function dotToneClass(tone: ChipTone): string {
  switch (tone) {
    case 'risk':
      return 'bg-risk-dot'
    case 'warning':
      return 'bg-gold-dot'
    case 'success':
      return 'bg-ok-fg'
    case 'neutral':
      return 'bg-text-faint'
    default:
      return 'bg-accent'
  }
}
