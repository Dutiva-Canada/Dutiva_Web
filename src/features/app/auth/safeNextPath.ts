/**
 * Post-verification redirect allowlist. Only root-relative paths are safe to
 * hand to react-router — anything else (//host, https://…, whitespace tricks)
 * would turn the magic-link confirm route into an open redirect. Both the
 * sender (AuthProvider, which puts it on the emailed link) and the spender
 * (AuthConfirm, which navigates there) validate independently.
 */
export function safeNextPath(value: string | null | undefined): string | undefined {
  return value && /^\/(?!\/)\S*$/.test(value) ? value : undefined
}
