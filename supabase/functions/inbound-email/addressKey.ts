/**
 * Extracts the per-integration routing key from recipient addresses.
 * Minted addresses look like `in-<16..64 hex>@<inbound domain>` — the
 * `in-` prefix keeps workspace mail from colliding with anything else on
 * the domain. Senders can write `Name <in-…@…>` or the bare address; the
 * key may appear in `to` or in `received_for` (forwarded mail lists the
 * envelope recipient there, not in `to`).
 */
const KEY_PATTERN = /(?:^|[<"'(\s])in-([0-9a-f]{16,64})@/i

function asAddressList(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

export function extractEmailKey(to: unknown, receivedFor: unknown): string | null {
  for (const addr of [...asAddressList(to), ...asAddressList(receivedFor)]) {
    const match = KEY_PATTERN.exec(addr)
    if (match) return match[1].toLowerCase()
  }
  return null
}
