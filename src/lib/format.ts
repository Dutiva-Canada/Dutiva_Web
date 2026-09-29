/** Fill `{placeholder}` slots in a catalogue string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

/** Currency amount, whole units. */
export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Compact age of an ISO timestamp — the caller maps the unit onto its
    message keys. null when the input isn't a parseable past timestamp. */
export function relativeTime(
  iso: string,
  now: Date = new Date(),
): { unit: 'now' | 'min' | 'hr' | 'day'; n: number } | null {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t) || t > now.getTime()) return null
  const mins = Math.floor((now.getTime() - t) / 60000)
  if (mins < 1) return { unit: 'now', n: 0 }
  if (mins < 60) return { unit: 'min', n: mins }
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return { unit: 'hr', n: hrs }
  return { unit: 'day', n: Math.floor(hrs / 24) }
}
