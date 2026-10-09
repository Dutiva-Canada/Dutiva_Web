/**
 * The fence language tag a bot uses to embed a widget spec in a reply.
 *
 * Kept in a leaf module on purpose: ChatMarkdown and the fence splitter
 * need only this string — importing it from widgetSpec.ts would drag zod
 * and every schema into chunks that might never render a widget.
 */
export const CHAT_WIDGET_FENCE = 'dutiva-widget'
