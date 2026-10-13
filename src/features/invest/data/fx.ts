/* Latest ECB reference rates via frankfurter.app — free, keyless,
   CORS-open. Rates are indicative, so every converted figure is marked
   '≈' at display rather than presented as exact. A 6-hour localStorage
   cache keeps repeat loads free; an in-memory cache covers the session. */

export interface FxTable {
  /** ECB publication date the rates describe (YYYY-MM-DD). */
  date: string
  /** CAD-base rates — 1 CAD = rates[cur] units of `cur`; rates.CAD === 1. */
  rates: Record<string, number>
}

const STORE_KEY = 'invest-fx-v1'
const TTL_MS = 6 * 3600_000

let mem: FxTable | null = null

function readStore(): FxTable | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as FxTable & { at: number }
    return Date.now() - c.at < TTL_MS ? { date: c.date, rates: c.rates } : null
  } catch {
    return null
  }
}

/** CAD-base rate table, or null when the feed can't be reached — callers
    treat null as 'no conversion possible', never as 1:1. */
export async function loadFxRates(): Promise<FxTable | null> {
  mem ??= readStore()
  if (mem) return mem
  try {
    /* frankfurter.dev is the live host — the .app domain 301-redirects
       here, and CSP blocks redirect hops, so the old URL can never
       succeed behind the site's connect-src. No `symbols` param — one
       call returns every ECB currency (~30), so a JPY/AUD/CHF position
       converts too instead of silently dropping. */
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=CAD', {
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { date?: string; rates?: Record<string, number> }
    if (!data?.rates) return null
    mem = { date: String(data.date ?? ''), rates: { CAD: 1, ...data.rates } }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...mem, at: Date.now() }))
    } catch {
      /* private-mode storage failures still get the session cache */
    }
    return mem
  } catch {
    return null
  }
}

/** `amount` expressed in `to`. null when either side has no rate — the
    caller renders '—' rather than show a number in the wrong currency. */
export function convertFx(
  amount: number,
  from: string,
  to: string,
  fx: FxTable | null,
): number | null {
  if (from === to) return amount
  const rates = fx?.rates
  if (!rates) return null
  const f = rates[from]
  const t = rates[to]
  if (!f || !t) return null
  /* Rates are '1 CAD = f units of from' — go from → CAD → to. */
  return (amount / f) * t
}
