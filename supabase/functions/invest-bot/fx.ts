/**
 * ECB reference rates via Frankfurter — the same source the portal uses for
 * blended totals, so bot math and the Overview agree. Edge functions have no
 * CSP constraint, so this fetches the .dev host directly.
 *
 * Failure is honest: `fetchFxTable` returns null and `convertFx` returns null
 * for any pair it cannot price — the caller decides whether a missing rate
 * means "skip the position" or "skip the rule". Nothing ever assumes 1:1.
 */
export interface FxTable {
  /** ECB publication date of the rate set. */
  date: string
  /** Units per 1 CAD — rates.CAD === 1 by construction. */
  rates: Record<string, number>
}

const FX_URL = 'https://api.frankfurter.dev/v1/latest?base=CAD'

export async function fetchFxTable(timeoutMs = 8_000): Promise<FxTable | null> {
  try {
    const res = await fetch(FX_URL, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const data = (await res.json()) as { date?: string; rates?: Record<string, number> }
    if (!data?.rates || typeof data.rates !== 'object') return null
    return { date: data.date ?? '', rates: { ...data.rates, CAD: 1 } }
  } catch {
    return null
  }
}

/**
 * Convert `amount` from `from` into `to`. Identity when the currencies match;
 * null when either leg lacks a rate — a missing rate must never degrade to a
 * silent 1:1 pass-through.
 */
export function convertFx(
  amount: number,
  from: string,
  to: string,
  fx: FxTable | null,
): number | null {
  const a = from.toUpperCase()
  const b = to.toUpperCase()
  if (a === b) return amount
  const rFrom = fx?.rates[a]
  const rTo = fx?.rates[b]
  if (rFrom === undefined || rTo === undefined || rFrom === 0) return null
  return (amount / rFrom) * rTo
}
