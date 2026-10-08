import { CHAT_WIDGET_FENCE } from './fence'

/**
 * Splitting an assistant reply into text and widget segments.
 *
 * A bot embeds a widget as a fenced block tagged `dutiva-widget`:
 *
 *   Here's the estimate:
 *   ```dutiva-widget
 *   { "type": "calculator", ... }
 *   ```
 *   Want the overtime version too?
 *
 * Prose around the fence stays a text segment — one reply can mix any
 * number of paragraphs and widgets. The fence regex is deliberately
 * conservative (tag must be the whole info string, block must close) so a
 * look-alike fence never swallows real text.
 */

export type ChatSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'widget'; readonly source: string }

const WIDGET_BLOCK = new RegExp(
  '```' + CHAT_WIDGET_FENCE + '[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n?```',
  'g',
)

export function splitChatSegments(content: string): ChatSegment[] {
  const segments: ChatSegment[] = []
  let cursor = 0
  for (const match of content.matchAll(WIDGET_BLOCK)) {
    const index = match.index ?? 0
    if (index > cursor) segments.push({ kind: 'text', text: content.slice(cursor, index) })
    const source = (match[1] ?? '').trim()
    if (source.length > 0) {
      segments.push({ kind: 'widget', source })
    } else {
      /* An empty fence carries no spec — keep it out of the widget stream
         but don't leak the markers into the text either. */
      segments.push({ kind: 'text', text: '' })
    }
    cursor = index + match[0].length
  }
  if (cursor < content.length) segments.push({ kind: 'text', text: content.slice(cursor) })
  return segments.filter((seg) => seg.kind === 'widget' || seg.text.length > 0)
}

/**
 * Streaming twin of hideIncompleteTable: while a reply is still arriving,
 * an unclosed ```dutiva-widget fence would flash raw JSON. Hide the
 * trailing fragment from the fence line onward until its closer lands.
 */
export function hideIncompleteWidgetFence(content: string): string {
  const open = content.lastIndexOf('```')
  if (open === -1) return content

  const opener = content.slice(open)
  const newline = opener.indexOf('\n')
  if (newline === -1) {
    /* The info string itself is still arriving — hide only once we're sure
       it's the widget fence, not some other code block. */
    return CHAT_WIDGET_FENCE.startsWith(opener.slice(3).trim()) &&
      opener.slice(3).trim().length > 0
      ? content.slice(0, open)
      : content
  }

  const info = opener.slice(3, newline).trim()
  if (info !== CHAT_WIDGET_FENCE) return content
  return content.slice(0, open)
}
