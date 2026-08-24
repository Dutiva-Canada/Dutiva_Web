import { useEffect, useRef } from 'react'
import { Sparkle, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import { useEscapeToClose } from '@/lib/escapeStack'
import { advisorCore as M } from '@/i18n/messages/advisorCore'
import { ChatBubble } from '@/features/app/advisor/ChatBubble'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { StreamedText } from '@/features/app/advisor/StreamedText'
import { ToneCard } from '@/features/app/advisor/ToneCard'
import { TypingDots } from '@/features/app/advisor/TypingDots'
import { useRail } from './railContext'

/**
 * The contextual Advisor rail — a 400px docked panel that slides in from the
 * right over a scrim (prototype `railView` markup). Renders nothing while
 * closed. Mounted by the AppShell inside the `.surface-app` token scope.
 *
 * Behaviour: Escape and the scrim/close button dismiss it; the composer takes
 * focus on open; the transcript auto-scrolls as replies stream in.
 */
export function AdvisorRail() {
  const { rail, closeRail, sendRailMessage } = useRail()
  const { x, lang } = useI18n()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEscapeToClose(rail.open, closeRail)

  /* Remember the opener and give focus back on close. */
  useEffect(() => {
    if (rail.open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    } else if (triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [rail.open])

  /* Keep the newest message (and its streaming tail) in view. */
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [rail.messages])

  if (!rail.open) return null

  const chips = rail.meta.chips ?? []

  return (
    <>
      <div
        onClick={closeRail}
        aria-hidden="true"
        className="fixed inset-0 z-295 bg-overlay-scrim-soft"
      />
      <dialog
        open
        aria-modal="true"
        aria-label={x(M.advisor_rail_aria)}
        className="fixed top-0 right-0 bottom-0 z-296 m-0 flex w-[min(400px,100%)] animate-[slideInRight_.2s_ease] flex-col border-l border-border bg-surface-2 font-sans shadow-[-20px_0_50px_rgba(0,0,0,0.2)]"
      >
        {/* Context header — subject + Advisor eyebrow (initials when the subject is a person). */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-[18px] py-[16px]">
          <div className="flex min-w-0 items-center gap-[9px]">
            {rail.meta.initials ? (
              <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent">
                {rail.meta.initials}
              </div>
            ) : (
              <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] bg-navy">
                <Sparkle
                  size={12}
                  className="fill-gold-on-navy"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold tracking-[0.04em] text-gold-dot uppercase">
                {x(M.advisor_rail_eyebrow)}
              </div>
              <div className="overflow-hidden text-[14px] font-semibold text-ellipsis whitespace-nowrap text-text">
                {pickL(rail.title, lang)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeRail}
            aria-label={x(M.advisor_rail_close)}
            className="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-none bg-inset"
          >
            <X size={13} strokeWidth={2} className="text-text-3" aria-hidden="true" />
          </button>
        </div>

        {/* Subject meta chips (entity type · jurisdiction …), when provided. */}
        {chips.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-[6px] border-b border-border-soft px-[18px] py-[10px]">
            {chips.map((chip) => (
              <span
                key={keyOfL(chip)}
                className="rounded-[100px] border border-gold-border bg-surface px-[9px] py-[2px] text-[11.5px] font-semibold text-gold-fg"
              >
                {pickL(chip, lang)}
              </span>
            ))}
          </div>
        )}

        {/* Transcript — polite live region so streamed replies are announced. */}
        <div
          ref={scrollRef}
          aria-live="polite"
          className="flex flex-1 flex-col gap-[14px] overflow-y-auto px-[18px] py-[16px]"
        >
          {rail.messages.map((message) =>
            message.author === 'user' ? (
              <ChatBubble key={message.id} author="user" compact>
                {pickL(message.text, lang)}
              </ChatBubble>
            ) : (
              <div key={message.id} className="flex flex-col gap-[8px]">
                {message.status === 'thinking' ? (
                  <TypingDots size="sm" label={x(M.advisor_thinking_short)} />
                ) : (
                  <>
                    {/* No `whitespace-pre-wrap`: ChatMarkdown owns block flow.
                        The `--cm-*` overrides tie its accent and opaque
                        backdrop (sticky table headers, scroll fades) to this
                        panel's own tokens. */}
                    <div className="text-[13.5px] leading-[1.55] text-text [--cm-accent:var(--accent)] [--cm-surface-solid:var(--surface-2)]">
                      <StreamedText
                        text={message.text}
                        status={message.status}
                        streamedLen={message.streamedLen}
                      />
                    </div>
                    {(message.status === 'done' || message.status === undefined) &&
                      (message.cards ?? []).map((card) => (
                        <ToneCard key={keyOfL(card.title)} card={card} />
                      ))}
                  </>
                )}
              </div>
            ),
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-border-soft bg-surface px-[14px] py-[12px]">
          <ChatComposer
            variant="rail"
            placeholder={x(M.advisor_rail_placeholder)}
            onSend={sendRailMessage}
            autoFocus
          />
        </div>
      </dialog>
    </>
  )
}
