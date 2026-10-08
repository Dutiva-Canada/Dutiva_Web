/**
 * Feature flag for interactive chat widgets ("Intelligent UI").
 *
 * A bot opts a reply into widgets by emitting a fenced block tagged
 * `dutiva-widget` containing a widget spec (see widgetSpec.ts). The renderers
 * only parse that fence when the flag covers their surface — off means the
 * block renders as a plain code block, exactly as before this feature
 * existed.
 *
 * Flag value (first non-empty wins):
 *   1. localStorage `dutiva:flag:interactiveChatWidgets` — dev/demo override,
 *      lets reviewers flip the flag on a deployed build without a rebuild.
 *   2. VITE_INTERACTIVE_CHAT_WIDGETS at build time.
 *
 * Values: "1" | "true" | "all" enables every surface; otherwise a
 * comma-separated surface list ("advisor,invest,health,pr") enables just
 * those, so each chatbot can opt in independently.
 */

export type ChatWidgetSurface = 'advisor' | 'invest' | 'health' | 'pr'

export const CHAT_WIDGET_FLAG_KEY = 'dutiva:flag:interactiveChatWidgets'

function flagValue(): string {
  try {
    const override = globalThis.localStorage?.getItem(CHAT_WIDGET_FLAG_KEY)
    if (override != null && override !== '') return override
  } catch {
    /* localStorage can throw in locked-down contexts — fall through to env. */
  }
  return (import.meta.env.VITE_INTERACTIVE_CHAT_WIDGETS as string | undefined) ?? ''
}

export function interactiveChatWidgetsEnabled(surface: ChatWidgetSurface): boolean {
  const raw = flagValue().trim().toLowerCase()
  if (raw === '1' || raw === 'true' || raw === 'all') return true
  return raw
    .split(',')
    .map((part) => part.trim())
    .includes(surface)
}
