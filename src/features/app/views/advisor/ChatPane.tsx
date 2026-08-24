import { useEffect, useRef } from 'react'
import {
  Copy,
  Download,
  FileText,
  Globe,
  Heart,
  ShieldCheck,
  Sparkle,
  TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { keyOfL, pickL } from '@/i18n/core'
import type { Bi, LText } from '@/i18n/core'
import { advisorCore } from '@/i18n/messages/advisorCore'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { advisorWorkspaceMessages as W } from '@/i18n/messages/advisorWorkspace'
import { ChatBubble } from '@/features/app/advisor/ChatBubble'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { ReasoningExpander } from '@/features/app/advisor/ReasoningExpander'
import { StreamedText } from '@/features/app/advisor/StreamedText'
import { SuggestionChips } from '@/features/app/advisor/SuggestionChips'
import { ToneCard } from '@/features/app/advisor/ToneCard'
import { TypingDots } from '@/features/app/advisor/TypingDots'
import type { ChatMessage } from '@/features/app/advisor/types'
import { followupReplies } from '@/data'
import { resolveDocTitle } from '@/features/app/docstudio/resolveDocTitle'
import { estimatorFollowup } from './advisorFlows'
import type { MessageExtras, QuickFormState, SuggestChipSpec } from './advisorFlows'
import { PROVINCE_CHIPS, scenarioFollowupLabels } from './advisorScenarios'
import type { ScenarioBanner, ScenarioBannerTone } from './advisorScenarios'

/**
 * Active conversation pane (prototype `hasActiveConversation` markup):
 * the always-visible jurisdiction context line, the 740px transcript with
 * user/advisor turns (thinking dots → streaming bubble → cards, doc chips,
 * quick form, suggest/follow-up chips; error turn with Retry), and the chat
 * composer footer with the short disclaimer.
 */

const ENTRANCE = 'animate-[fadeInUp_.45s_cubic-bezier(.4,0,.2,1)]'

export interface ChatPaneProps {
  readonly messages: readonly ChatMessage[]
  readonly busy: boolean
  readonly jurisdiction: Bi
  readonly getExtras: (messageId: string) => MessageExtras | undefined
  readonly onSend: (text: string) => void
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
  /** Opens the Compliance Workspace sheet below the xl breakpoint. */
  readonly onOpenWorkspace?: () => void
  /** Pill tint: warn while jurisdiction is unknown, support in supportive mode. */
  readonly jurisdictionTone?: JurisdictionPillTone
}

export type JurisdictionPillTone = 'gold' | 'warn' | 'support'

const JURISDICTION_PILL: Record<JurisdictionPillTone, string> = {
  gold: 'border-gold-border bg-gold-bg text-gold-fg',
  warn: 'border-warn-border bg-warn-bg text-warn-fg',
  support: 'border-support-border bg-support-bg text-support-fg',
}

/** Follow-up chip label: canned-reply label, scenario label, or estimator. */
function followupLabel(labelEn: string): LText {
  if (labelEn === estimatorFollowup.labelEn) return estimatorFollowup.label
  return followupReplies[labelEn]?.label ?? scenarioFollowupLabels[labelEn] ?? labelEn
}

/** Inline tone banner styling (prototype `bannerStyle`). */
const BANNER_TONE: Record<ScenarioBannerTone, { card: string; text: string; icon: LucideIcon }> = {
  risk: { card: 'border-risk-border bg-risk-bg', text: 'text-risk-fg', icon: TriangleAlert },
  support: { card: 'border-support-border bg-support-bg', text: 'text-support-fg', icon: Heart },
  info: { card: 'border-gold-border bg-gold-bg', text: 'text-gold-fg', icon: Globe },
}

function docTitle(templateKey: string): LText {
  return resolveDocTitle(templateKey)
}

export function ChatPane({
  messages,
  busy,
  jurisdiction,
  getExtras,
  onSend,
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
  jurisdictionTone = 'gold',
}: ChatPaneProps) {
  const { x, lang } = useI18n()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  /* Keep the newest message (and its streaming tail) in view. */
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Jurisdiction context line — always visible on an active conversation. */}
      <div className="flex shrink-0 items-center justify-center gap-[10px] border-b border-border-soft px-[14px] py-[8px]">
        <span
          className={`rounded-[100px] border px-[10px] py-[3px] text-[11.5px] font-semibold ${JURISDICTION_PILL[jurisdictionTone]}`}
        >
          {pickL(jurisdiction, lang)}
        </span>
        {onOpenWorkspace && (
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="flex cursor-pointer items-center gap-[5px] rounded-[100px] border border-gold-border bg-gold-bg px-[11px] py-[4px] font-sans text-[11.5px] font-bold whitespace-nowrap text-gold-fg xl:hidden"
          >
            <ShieldCheck size={13} strokeWidth={1.9} aria-hidden="true" />
            {x(W.advws_open_workspace)}
          </button>
        )}
      </div>

      {/* Transcript — polite live region so streamed replies are announced. */}
      <div ref={scrollRef} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[740px] flex-col gap-[22px] px-[24px] pt-[26px] pb-[16px]">
          {messages.map((message) =>
            message.author === 'user' ? (
              <UserTurn key={message.id} message={message} />
            ) : (
              <AdvisorTurn
                key={message.id}
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
              />
            ),
          )}
          <div className="h-[6px]" />
        </div>
      </div>

      {/* Composer footer */}
      <div className="shrink-0 border-t border-border bg-bg px-[24px] pt-[14px] pb-[16px]">
        <div className="mx-auto max-w-[740px]">
          <ChatComposer
            variant="chat"
            placeholder={x(M.advisorview_composer_msg)}
            onSend={onSend}
            disabled={busy}
          />
        </div>
        <Disclaimer className="mt-[8px] text-center" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- user turn */

function UserTurn({ message }: { readonly message: ChatMessage }) {
  const { lang } = useI18n()
  const chips = message.userChips ?? []
  const text = pickL(message.text, lang)
  return (
    <div className={`flex flex-col items-end gap-[8px] ${ENTRANCE}`}>
      {chips.length > 0 && (
        <div className="flex max-w-[80%] flex-wrap justify-end gap-[6px]">
          {chips.map((chip) => (
            <span
              key={keyOfL(chip)}
              className="rounded-[100px] bg-accent-soft px-[11px] py-[5px] text-[12.5px] font-semibold text-accent"
            >
              {pickL(chip, lang)}
            </span>
          ))}
        </div>
      )}
      {text.length > 0 && <ChatBubble author="user">{text}</ChatBubble>}
    </div>
  )
}

/* ---------------------------------------------------------- advisor turn */

interface AdvisorTurnProps {
  readonly message: ChatMessage
  readonly extras: MessageExtras | undefined
  readonly onRetry: (messageId: string) => void
  readonly onFollowup: (labelEn: string) => void
  readonly onGenerateDoc: (templateKey: string) => void
  readonly onSuggestChip: (chip: SuggestChipSpec) => void
  readonly onQuickFormChange: (messageId: string, fieldIndex: number, valueEn: string) => void
  readonly onQuickFormSubmit: (messageId: string) => void
  readonly onCopyMessage: (text: string) => void
  readonly onExportMessage: (text: string) => void
  readonly onPickProvince?: (province: Bi) => void
}

function AdvisorTurn({
  message,
  extras,
  onRetry,
  onFollowup,
  onGenerateDoc,
  onSuggestChip,
  onQuickFormChange,
  onQuickFormSubmit,
  onCopyMessage,
  onExportMessage,
  onPickProvince,
}: AdvisorTurnProps) {
  const { x, lang } = useI18n()
  const status = message.status ?? 'done'
  const showBubble = status === 'streaming' || status === 'done'
  const done = status === 'done'
  const text = pickL(message.text, lang)
  const reasoning = message.reasoning ?? []
  const cards = message.cards ?? []
  const docs = extras?.docs ?? []
  const followups = extras?.followups ?? []
  const suggestChips = extras?.suggestChips ?? []
  const quickForm = extras?.quickForm
  const banner = extras?.banner
  const provincePrompt = extras?.provincePrompt === true

  return (
    <div className={`flex items-start gap-[12px] ${ENTRANCE}`}>
      <div className="mt-[2px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-navy">
        <Sparkle size={13} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        {status === 'thinking' && <TypingDots label={x(advisorCore.advisor_thinking)} />}

        {status === 'error' && (
          <div className="flex max-w-[520px] flex-col gap-[8px] rounded-[12px] border border-risk-border bg-risk-bg px-[14px] py-[12px]">
            <div className="flex items-start gap-[8px]">
              <TriangleAlert
                size={15}
                strokeWidth={1.9}
                className="mt-px shrink-0 text-risk-dot"
                aria-hidden="true"
              />
              <span className="text-[13.5px] leading-normal text-risk-fg">
                {pickL(message.errorText ?? advisorCore.advisor_error_default, lang)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              className="cursor-pointer self-start rounded-[7px] border border-risk-border bg-surface px-[13px] py-[6px] font-sans text-[12.5px] font-semibold text-risk-fg"
            >
              {x(advisorCore.advisor_retry)}
            </button>
          </div>
        )}

        {showBubble && (
          <>
            {reasoning.length > 0 && <ReasoningExpander lines={reasoning} />}

            {text.length > 0 && (
              <div className="group relative">
                <ChatBubble author="assistant">
                  <StreamedText
                    text={message.text}
                    status={message.status}
                    streamedLen={message.streamedLen}
                    memory={extras?.memory}
                  />
                </ChatBubble>
                {done && (
                  <div className="mt-[6px] flex items-center gap-[12px] px-[4px] opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onCopyMessage(text)}
                      className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent p-0 text-[11.5px] font-semibold text-text-faint hover:text-text-muted"
                    >
                      <Copy size={12} strokeWidth={2} />
                      {x({ en: 'Copy', fr: 'Copier' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportMessage(text)}
                      className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent p-0 text-[11.5px] font-semibold text-text-faint hover:text-text-muted"
                    >
                      <Download size={12} strokeWidth={2} />
                      {x({ en: 'Export', fr: 'Exporter' })}
                    </button>
                  </div>
                )}
              </div>
            )}

            {done && banner && <TurnBanner banner={banner} />}

            {done && cards.length > 0 && (
              <div className="flex max-w-[620px] flex-col gap-[10px]">
                {cards.map((card) => (
                  <ToneCard key={keyOfL(card.title)} card={card} />
                ))}
              </div>
            )}

            {done && provincePrompt && onPickProvince && (
              <ProvincePrompt onPickProvince={onPickProvince} />
            )}

            {done && docs.length > 0 && (
              <div className="flex max-w-[620px] flex-wrap gap-[10px]">
                {docs.map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-[10px] rounded-[10px] border border-border bg-surface py-[10px] pr-[12px] pl-[10px]"
                  >
                    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-inset">
                      <FileText
                        size={14}
                        strokeWidth={1.7}
                        className="text-text-muted"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-text">
                      {pickL(docTitle(key), lang)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onGenerateDoc(key)}
                      className="cursor-pointer rounded-[6px] border-none bg-accent-soft px-[11px] py-[6px] font-sans text-[12px] font-bold text-accent"
                    >
                      {x(M.advisorview_generate)}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {done && quickForm && !quickForm.submitted && (
              <QuickForm
                messageId={message.id}
                form={quickForm}
                onChange={onQuickFormChange}
                onSubmit={onQuickFormSubmit}
              />
            )}

            {done && suggestChips.length > 0 && (
              <SuggestionChips
                variant="suggest"
                chips={suggestChips.map((chip) => ({
                  label: chip.label,
                  onClick: () => onSuggestChip(chip),
                }))}
              />
            )}

            {done && followups.length > 0 && (
              <SuggestionChips
                variant="followup"
                chips={followups.map((labelEn) => ({
                  label: followupLabel(labelEn),
                  onClick: () => onFollowup(labelEn),
                }))}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ turn banner */

/** Inline risk / info / support banner (prototype `turn.hasBanner`). */
function TurnBanner({ banner }: { readonly banner: ScenarioBanner }) {
  const { lang } = useI18n()
  const tone = BANNER_TONE[banner.tone]
  const Icon = tone.icon
  return (
    <div
      className={`flex max-w-[640px] items-start gap-[9px] rounded-[11px] border px-[13px] py-[11px] ${tone.card}`}
    >
      <Icon
        size={14}
        strokeWidth={1.9}
        className={`mt-px shrink-0 ${tone.text}`}
        aria-hidden="true"
      />
      <div className={`text-[13px] leading-normal ${tone.text}`}>
        <strong className="font-bold">{pickL(banner.title, lang)}</strong>
        {pickL(banner.text, lang)}
      </div>
    </div>
  )
}

/* -------------------------------------------------------- province prompt */

/** Collect-jurisdiction chips (prototype `turn.hasProvincePrompt`). */
function ProvincePrompt({ onPickProvince }: { readonly onPickProvince: (province: Bi) => void }) {
  const { x, lang } = useI18n()
  return (
    <div className="max-w-[560px] rounded-[12px] border border-border bg-surface p-[14px]">
      <div className="mb-[9px] text-[12px] font-semibold text-text-3">{x(W.advws_province_q)}</div>
      <div className="flex flex-wrap gap-[8px]">
        {PROVINCE_CHIPS.map((province) => (
          <button
            key={province.en}
            type="button"
            onClick={() => onPickProvince(province)}
            className="cursor-pointer rounded-[9px] border border-gold-border bg-gold-bg px-[14px] py-[8px] font-sans text-[13px] font-semibold text-gold-fg"
          >
            {pickL(province, lang)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- quick form */

interface QuickFormProps {
  readonly messageId: string
  readonly form: QuickFormState
  readonly onChange: (messageId: string, fieldIndex: number, valueEn: string) => void
  readonly onSubmit: (messageId: string) => void
}

function QuickForm({ messageId, form, onChange, onSubmit }: QuickFormProps) {
  const { lang } = useI18n()
  return (
    <div className="flex max-w-[560px] flex-col gap-[12px] rounded-[12px] border border-border bg-surface p-[16px]">
      {form.fields.map((field, fi) => {
        const selectId = `${messageId}-field-${field.key}`
        return (
          <div key={field.key} className="flex flex-col gap-[5px]">
            <label htmlFor={selectId} className="text-[12px] font-semibold text-text-3">
              {pickL(field.label, lang)}
            </label>
            <select
              id={selectId}
              value={field.value}
              onChange={(e) => onChange(messageId, fi, e.target.value)}
              className="rounded-[8px] border border-border bg-bg px-[10px] py-[9px] font-sans text-[13.5px] text-text"
            >
              {field.options.map((option) => (
                <option key={option.en} value={option.en}>
                  {pickL(option, lang)}
                </option>
              ))}
            </select>
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => onSubmit(messageId)}
        className="mt-[2px] cursor-pointer self-start rounded-[8px] border-none bg-navy px-[18px] py-[9px] font-sans text-[13.5px] font-bold text-white"
      >
        {pickL(form.submitLabel, lang)}
      </button>
    </div>
  )
}
