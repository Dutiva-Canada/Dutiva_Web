import { Fragment, lazy, Suspense, useMemo } from 'react'
import { hideIncompleteWidgetFence, splitChatSegments } from './specBlocks'

/**
 * WidgetContent — assistant-message body for the plain-text portal chats
 * (Invest/Tally, Health/Mira, PR/Paige, and any future surface). It splits
 * the reply into text and `dutiva-widget` fence segments: text renders
 * verbatim inside the existing bubble (preserving today's pre-wrap look),
 * each fence becomes a lazily-loaded <ChatWidgetBlock />.
 *
 * Only ever render this for assistant turns — user text is never parsed.
 * Callers gate on interactiveChatWidgetsEnabled(surface); off means the
 * caller renders `content` exactly as before and this module's widget code
 * is never even fetched.
 */

const ChatWidgetBlock = lazy(() =>
  import('./ChatWidget').then((m) => ({ default: m.ChatWidgetBlock })),
)

interface WidgetContentProps {
  readonly text: string
  /** True while the reply streams — an unclosed trailing fence is hidden
     until its closer lands, so half-parsed JSON never flashes. */
  readonly streaming?: boolean
}

export function WidgetContent({ text, streaming = false }: WidgetContentProps) {
  const segments = useMemo(
    () => splitChatSegments(streaming ? hideIncompleteWidgetFence(text) : text),
    [text, streaming],
  )

  return (
    <>
      {segments.map((segment, i) =>
        segment.kind === 'text' ? (
          <Fragment key={i}>{segment.text}</Fragment>
        ) : (
          <Suspense fallback={<div className="cw-loading" aria-hidden="true" />} key={i}>
            <ChatWidgetBlock source={segment.source} />
          </Suspense>
        ),
      )}
    </>
  )
}
