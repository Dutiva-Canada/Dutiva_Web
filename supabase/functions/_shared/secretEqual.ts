/**
 * Constant-time comparison for shared-secret checks (x-trigger-secret,
 * service-role bearer tokens). `===` short-circuits on the first
 * mismatched byte — a per-byte XOR over the longer input always does the
 * same work, so the compare never leaks where a guess stopped matching.
 * Length is still checked first: a wrong-length guess returns false
 * immediately (the work below then feeds the timing side nothing useful).
 */
export function secretEquals(presented: string, expected: string): boolean {
  if (expected === '') return false
  const a = new TextEncoder().encode(presented)
  const b = new TextEncoder().encode(expected)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}
