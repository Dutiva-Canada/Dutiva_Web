import type { ReactNode } from 'react'

/**
 * Chat message bubble, per the prototype markup:
 *
 * - user: navy fill, white text, rounded with a small tail corner
 *   (14/14/3/14 in the Advisor view, 12/12/2/12 `compact` in the rail);
 * - assistant: surface fill, 1px soft border, mirrored tail (3/14/14/14).
 *   Its content is `<ChatMarkdown>`, which owns block flow and line breaks, so
 *   the bubble no longer sets `white-space: pre-wrap` (it fights the
 *   renderer). The two `--cm-*` overrides tie the renderer's accent and its
 *   opaque backdrop — sticky table headers, scroll fades — to the app-surface
 *   tokens, so light and dark both resolve without configuration.
 */
interface ChatBubbleProps {
  readonly author: 'user' | 'assistant'
  /** Rail sizing (smaller paddings/typography). */
  readonly compact?: boolean
  readonly children: ReactNode
}

export function ChatBubble({ author, compact = false, children }: ChatBubbleProps) {
  if (author === 'user') {
    const sizing = compact
      ? 'max-w-[88%] rounded-[12px_12px_2px_12px] px-[13px] py-[9px] text-[13.5px] leading-[1.5]'
      : 'max-w-[72%] rounded-[14px_14px_3px_14px] px-[16px] py-[11px] text-[14.5px] leading-[1.55]'
    return <div className={`self-end bg-navy text-white ${sizing}`}>{children}</div>
  }
  return (
    <div className="max-w-[620px] rounded-[3px_14px_14px_14px] border border-border-soft bg-surface px-[16px] py-[13px] text-[14.5px] leading-[1.6] text-text [--cm-accent:var(--accent)] [--cm-surface-solid:var(--surface)]">
      {children}
    </div>
  )
}
