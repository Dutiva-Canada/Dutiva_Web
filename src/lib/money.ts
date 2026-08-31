import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/**
 * Bilingual currency formatting — `$118,000` in English, `118 000 $` in
 * Canadian French (space-grouped thousands, trailing dollar sign). The one
 * money formatter for the app; render with `x(money(n))` or take `.en`/`.fr`
 * when composing sentences.
 */
export function money(amount: number): Bi {
  const grouped = amount.toLocaleString('en-US')
  return bi(`$${grouped}`, `${grouped.replaceAll(',', ' ')} $`)
}

/** Currency chip when compensation is not on file. */
export function moneyOrUnset(amount: number | null): Bi {
  if (amount === null) return bi('—', '—')
  return money(amount)
}
