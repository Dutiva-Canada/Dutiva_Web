import { ArrowDown, ShieldCheck, Sparkle, Square } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { AdvisorPackSize } from '@/config/advisorUsage'
import { Disclaimer } from '@/components/Disclaimer'
import { advisorCore } from '@/i18n/messages/advisorCore'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { advisorWorkspaceMessages as W } from '@/i18n/messages/advisorWorkspace'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { TypingDots } from '@/features/app/advisor/TypingDots'
import type { AdvisorAttachment, AttachmentIssue } from '@/features/app/advisor/attachments'
import type { ChatMessage } from '@/features/app/advisor/types'
import type { MessageExtras, SuggestChipSpec } from './advisorFlows'
import { ThreadListOpenButton } from './ThreadList'
import { useTurnRatings } from './advisorTurnRatings'
import { AdvisorTurn, UserTurn } from './advisorTurns'
import {
  formatTurnDay,
  sameTurnDay,
  usePortalChatDraft,
  useStickToBottom,
} from '@/components/chat/portalChatUtils'

/**
 * Active conversation pane (prototype `hasActiveConversation` markup):
 * the always-visible jurisdiction context line, the 740px transcript with
 * user/advisor turns (thinking dots → streaming bubble → cards, doc chips,
 * quick form, suggest/follow-up chips; error turn with Retry), and the chat
 * composer footer with the short disclaimer.
 */

interface ChatPaneProps {
  readonly messages: readonly ChatMessage[]
  readonly busy: boolean
  readonly jurisdiction: Bi
  readonly getExtras: (messageId: string) => MessageExtras | undefined
  readonly onSend: (text: string, attachments?: AdvisorAttachment[]) => void
  /** A file was refused before it could attach (toast surface). */
  readonly onAttachmentIssue?: (issue: AttachmentIssue, fileName: string) => void
  readonly onRetry: (messageId: string) => void
  readonly onFollowup: (labelEn: string) => void
  readonly onGenerateDoc: (templateKey: string) => void
  readonly onSuggestChip: (chip: SuggestChipSpec) => void
  readonly onQuickFormChange: (messageId: string, fieldIndex: number, valueEn: string) => void
  readonly onQuickFormSubmit: (messageId: string) => void
  readonly onCopyMessage: (text: string) => void
  readonly onExportMessage: (text: string) => void
  /** Province chip pick on a jurisdiction-unknown turn (response experience). */
  readonly onPickProvince?: (province: Bi) => void
  /** Opens the Compliance Workspace panel when it is collapsed. */
  readonly onOpenWorkspace?: () => void
  /** When true, the workspace toggle is hidden (panel already open). */
  readonly workspaceOpen?: boolean
  /** Opens the conversation list when it is collapsed (desktop). */
  readonly onOpenThreads?: () => void
  /** When true, the conversations toggle is hidden (list already open). */
  readonly threadsOpen?: boolean
  /** Shown in the context bar when the thread list is collapsed. */
  readonly activeThreadTitle?: Bi | null
  /** Commercial 429: start prepaid pack Checkout. */
  readonly onBuyAdvisorPack?: (pack: AdvisorPackSize) => void
  readonly buyingAdvisorPack?: AdvisorPackSize | null
  /** Pill tint: warn while jurisdiction is unknown, support in supportive mode. */
  readonly jurisdictionTone?: JurisdictionPillTone
  /** A real (production) send is in flight — shows the Stop button. */
  readonly realSending?: boolean
  /** Aborts the in-flight real send (Stop button). */
  readonly onStop?: () => void
  /** sessionStorage key for the per-conversation draft. */
  readonly draftKey?: string
}

export type JurisdictionPillTone = 'gold' | 'warn' | 'support'

const JURISDICTION_PILL: Record<JurisdictionPillTone, string> = {
  gold: 'border-gold-border bg-gold-bg text-gold-fg',
  warn: 'border-warn-border bg-warn-bg text-warn-fg',
  support: 'border-support-border bg-support-bg text-support-fg',
}

export function ChatPane({
  messages,
  busy,
  jurisdiction,
  getExtras,
  onSend,
  onAttachmentIssue,
  onRetry,
  onFollowup,
  onGenerateDoc,
  onSuggestChip,
  onQuickFormChange,
  onQuickFormSubmit,
  onCopyMessage,
  onExportMessage,
  onPickProvince,
  onOpenWorkspace,
  workspaceOpen = false,
  onOpenThreads,
  threadsOpen = false,
  activeThreadTitle = null,
  onBuyAdvisorPack,
  buyingAdvisorPack = null,
  jurisdictionTone = 'gold',
  realSending = false,
  onStop,
  draftKey = 'advisor.chat.default',
}: ChatPaneProps) {
  const { x, lang } = useI18n()
  const { ratingFor, rate, reasonFor, rateReason } = useTurnRatings(messages, getExtras)
  const [draft, setDraft] = usePortalChatDraft(draftKey)
  const { logRef, stickToBottom, farUp, hasNew } = useStickToBottom([messages])
  const lastIsUser = messages[messages.length - 1]?.author === 'user'

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Jurisdiction context line — always visible on an active conversation. */}
      <div className="flex shrink-0 items-center justify-center gap-[10px] border-b border-border-soft px-[14px] py-[8px]">
        {onOpenThreads && !threadsOpen ? <ThreadListOpenButton onOpen={onOpenThreads} /> : null}
        {activeThreadTitle && !threadsOpen ? (
          <span className="max-w-[220px] overflow-hidden text-[12px] font-semibold text-ellipsis whitespace-nowrap text-text-2">
            {pickL(activeThreadTitle, lang)}
          </span>
        ) : null}
        <span
          className={`rounded-[100px] border px-[10px] py-[3px] text-[11.5px] font-semibold ${JURISDICTION_PILL[jurisdictionTone]}`}
        >
          {pickL(jurisdiction, lang)}
        </span>
        {onOpenWorkspace && !workspaceOpen && (
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="flex cursor-pointer items-center gap-[5px] rounded-[100px] border border-gold-border bg-gold-bg px-[11px] py-[4px] font-sans text-[11.5px] font-bold whitespace-nowrap text-gold-fg"
          >
            <ShieldCheck size={13} strokeWidth={1.9} aria-hidden="true" />
            {x(W.advws_open_workspace)}
          </button>
        )}
      </div>

      {/* Transcript — polite live region so streamed replies are announced. */}
      <div className="relative min-h-0 flex-1">
        <div ref={logRef} aria-live="polite" className="h-full overflow-y-auto">
          <div className="mx-auto flex max-w-[740px] flex-col gap-[22px] px-[24px] pt-[26px] pb-[16px]">
            {messages.map((message, i) => {
              /* Day separator when the calendar day changes — turns without
                 `at` (pre-0212 persisted history) never open one. */
              const prev = i > 0 ? messages[i - 1] : undefined
              const dayLabel =
                message.at !== undefined &&
                (prev?.at === undefined || !sameTurnDay(prev.at, message.at))
                  ? formatTurnDay(message.at, lang)
                  : ''
              return (
                <div key={message.id} className="contents">
                  {dayLabel !== '' && (
                    <div
                      role="separator"
                      className="self-center rounded-full border border-border bg-surface px-[10px] py-[2px] text-[10.5px] font-semibold text-text-muted"
                    >
                      {dayLabel}
                    </div>
                  )}
                  {message.author === 'user' ? (
                    <UserTurn message={message} onReuse={setDraft} />
                  ) : (
                    <AdvisorTurn
                      message={message}
                      extras={getExtras(message.id)}
                      onRetry={onRetry}
                      onFollowup={onFollowup}
                      onGenerateDoc={onGenerateDoc}
                      onSuggestChip={onSuggestChip}
                      onQuickFormChange={onQuickFormChange}
                      onQuickFormSubmit={onQuickFormSubmit}
                      onCopyMessage={onCopyMessage}
                      onExportMessage={onExportMessage}
                      onPickProvince={onPickProvince}
                      onBuyAdvisorPack={onBuyAdvisorPack}
                      buyingAdvisorPack={buyingAdvisorPack}
                      rating={ratingFor(message.id)}
                      onRate={rate}
                      reason={reasonFor(message.id)}
                      onRateReason={rateReason}
                    />
                  )}
                </div>
              )
            })}
            {/* Real sends don't stream — the last user bubble gets pending
                dots so the wait reads as "the advisor is on it". */}
            {busy && lastIsUser && (
              <div className="flex items-start gap-[12px]">
                <div className="mt-[2px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-navy">
                  <Sparkle
                    size={13}
                    className="fill-gold-on-navy"
                    strokeWidth={0}
                    aria-hidden="true"
                  />
                </div>
                <TypingDots label={x(advisorCore.advisor_thinking)} />
              </div>
            )}
            <div className="h-[6px]" />
          </div>
        </div>
        {/* Jump-to-latest — appears once the reader scrolls up; flags when
            something new landed off-screen. */}
        {farUp && (
          <button
            type="button"
            onClick={stickToBottom}
            className="absolute bottom-[14px] left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-[6px] rounded-[100px] border border-border bg-surface px-[13px] py-[7px] font-sans text-[12px] font-bold text-text-2 shadow-md motion-safe:animate-[fadeInUp_.2s_ease]"
          >
            <ArrowDown size={13} strokeWidth={2.2} aria-hidden="true" />
            {x(M.advisorview_jump_latest)}
            {hasNew && (
              <span className="h-[6px] w-[6px] rounded-full bg-accent" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Composer footer */}
      <div className="shrink-0 border-t border-border bg-bg px-[24px] pt-[14px] pb-[16px]">
        <div className="mx-auto max-w-[740px]">
          {realSending && onStop != null && (
            <div className="mb-[8px] flex justify-end">
              <button
                type="button"
                onClick={onStop}
                className="flex cursor-pointer items-center gap-[6px] rounded-[100px] border border-border bg-surface px-[13px] py-[6px] font-sans text-[12px] font-bold text-text-2"
              >
                <Square size={11} strokeWidth={2.4} aria-hidden="true" />
                {x(M.advisorview_stop)}
              </button>
            </div>
          )}
          <ChatComposer
            variant="chat"
            placeholder={x(M.advisorview_composer_msg)}
            onSend={onSend}
            disabled={busy}
            enableAttachments
            onAttachmentIssue={onAttachmentIssue}
            draft={draft}
            onDraftChange={setDraft}
          />
        </div>
        <Disclaimer className="mt-[8px] text-center" />
      </div>
    </div>
  )
}
