import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import {
  Copy,
  Download,
  FileText,
  Globe,
  Heart,
  Image,
  RotateCcw,
  Sparkle,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import type { Bi, LText } from '@/i18n/core'
import type { AdvisorPackSize } from '@/config/advisorUsage'
import {
  ADVISOR_PACK_50_PRICE_CAD,
  ADVISOR_PACK_50_REPLIES,
  ADVISOR_PACK_200_PRICE_CAD,
  ADVISOR_PACK_200_REPLIES,
} from '@/config/advisorUsage'
import { Disclaimer } from '@/components/Disclaimer'
import { advisorCore } from '@/i18n/messages/advisorCore'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { advisorWorkspaceMessages as W } from '@/i18n/messages/advisorWorkspace'
import { ChatBubble } from '@/features/app/advisor/ChatBubble'
import { ReasoningExpander } from '@/features/app/advisor/ReasoningExpander'
import { StreamedText } from '@/features/app/advisor/StreamedText'
import { SuggestionChips } from '@/features/app/advisor/SuggestionChips'
import { ToneCard } from '@/features/app/advisor/ToneCard'
import { AgentActionCard } from '@/features/app/agent/AgentActionCard'
import { TypingDots } from '@/features/app/advisor/TypingDots'
import type { ChatMessage } from '@/features/app/advisor/types'
import { followupReplies } from '@/data'
import { resolveDocTitle } from '@/features/app/docstudio/resolveDocTitle'
import { estimatorFollowup } from './advisorFlows'
import type { MessageExtras, QuickFormState, SuggestChipSpec } from './advisorFlows'
import { PROVINCE_CHIPS, scenarioFollowupLabels } from './advisorScenarios'
import type { ScenarioBanner, ScenarioBannerTone } from './advisorScenarios'
import { formatTurnTime } from '@/components/chat/portalChatUtils'

/**
 * Transcript turn components for ChatPane: the user bubble (attachments,
 * chips, reuse affordance), the advisor turn (thinking → error → bubble →
 * reasoning → banner → cards → docs → quick form → chips → pack offer), and
 * the small blocks nested inside them.
 */

const ENTRANCE = 'motion-safe:animate-[fadeInUp_.45s_cubic-bezier(.4,0,.2,1)]'

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

function packBuyLabel(count: number, price: number, lang: 'en' | 'fr'): string {
  const template = pickL(M.advisorview_pack_buy, lang)
  return template.replace('{count}', String(count)).replace('{price}', String(price))
}

function AdvisorPackOffer({
  buying,
  onBuy,
}: {
  readonly buying: AdvisorPackSize | null
  readonly onBuy: (pack: AdvisorPackSize) => void
}) {
  const { x, lang } = useI18n()
  const busy = buying !== null
  return (
    <div className="flex max-w-[520px] flex-col gap-[10px] rounded-[12px] border border-border bg-surface px-[14px] py-[12px]">
      <div className="text-[13px] font-semibold text-text">{x(M.advisorview_pack_buy_heading)}</div>
      <div className="flex flex-wrap gap-[8px]">
        <button
          type="button"
          disabled={busy}
          onClick={() => onBuy(ADVISOR_PACK_50_REPLIES)}
          className="cursor-pointer rounded-[7px] border border-border bg-accent-soft px-[13px] py-[7px] font-sans text-[12.5px] font-semibold text-accent disabled:cursor-wait disabled:opacity-60"
        >
          {packBuyLabel(ADVISOR_PACK_50_REPLIES, ADVISOR_PACK_50_PRICE_CAD, lang)}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onBuy(ADVISOR_PACK_200_REPLIES)}
          className="cursor-pointer rounded-[7px] border border-border bg-accent-soft px-[13px] py-[7px] font-sans text-[12.5px] font-semibold text-accent disabled:cursor-wait disabled:opacity-60"
        >
          {packBuyLabel(ADVISOR_PACK_200_REPLIES, ADVISOR_PACK_200_PRICE_CAD, lang)}
        </button>
      </div>
      <Disclaimer variant="block" />
    </div>
  )
}

/* ------------------------------------------------------------- user turn */

export function UserTurn({
  message,
  onReuse,
}: {
  readonly message: ChatMessage
  /** Sends the turn's text back into the composer as an editable draft. */
  readonly onReuse?: (text: string) => void
}) {
  const { x, lang } = useI18n()
  const chips = message.userChips ?? []
  const attachments = message.attachments ?? []
  const text = pickL(message.text, lang)
  return (
    <div className={`group flex flex-col items-end gap-[8px] ${ENTRANCE}`}>
      {attachments.length > 0 && (
        <div className="flex max-w-[80%] flex-wrap justify-end gap-[6px]">
          {attachments.map((a) => (
            <span
              key={`${a.kind}-${a.name}`}
              className="flex items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[9px] py-[5px] text-[12px] font-semibold text-text-2"
            >
              {a.kind === 'image' ? (
                <Image size={12} strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <FileText size={12} strokeWidth={1.9} aria-hidden="true" />
              )}
              <span className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                {a.name}
              </span>
            </span>
          ))}
        </div>
      )}
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
      {(onReuse != null || message.at !== undefined) && text.length > 0 && (
        <div className="flex items-center gap-[10px]">
          {onReuse != null && (
            <button
              type="button"
              onClick={() => onReuse(text)}
              className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent p-0 text-[11.5px] font-semibold text-text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-muted"
            >
              <RotateCcw size={12} strokeWidth={2} />
              {x(M.advisorview_reuse)}
            </button>
          )}
          {message.at !== undefined && (
            <span className="text-[10.5px] text-text-faint">
              {formatTurnTime(message.at, lang)}
            </span>
          )}
        </div>
      )}
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
  readonly onBuyAdvisorPack?: (pack: AdvisorPackSize) => void
  readonly buyingAdvisorPack?: AdvisorPackSize | null
  /** undefined = turn has no persisted rating key (demo/fixture/live-seeded). */
  readonly rating?: 1 | -1 | null
  readonly onRate?: (messageId: string, rating: 1 | -1) => void
  /** Picked thumbs-down reason, when one was saved. */
  readonly reason?: string | null
  readonly onRateReason?: (messageId: string, reason: string) => void
}

/** One-tap why after a thumbs-down — chips persist so the choice is visible. */
const REASON_CHIPS = [
  { key: 'wrong_info', label: M.advisorview_reason_wrong },
  { key: 'too_vague', label: M.advisorview_reason_vague },
  { key: 'tone', label: M.advisorview_reason_tone },
] as const

export function AdvisorTurn({
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
  onBuyAdvisorPack,
  buyingAdvisorPack = null,
  rating,
  onRate,
  reason,
  onRateReason,
}: AdvisorTurnProps) {
  const { x, lang } = useI18n()
  const navigate = useWorkspaceNavigate()
  const status = message.status ?? 'done'
  const showBubble = status === 'streaming' || status === 'done'
  const done = status === 'done'
  const text = pickL(message.text, lang)
  const reasoning = message.reasoning ?? []
  const cards = message.cards ?? []
  const docs = extras?.docs ?? []
  const followups = extras?.followups ?? []
  const suggestChips = extras?.suggestChips ?? []
  const navChips = extras?.navChips ?? []
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
                {done && message.at !== undefined && (
                  <div className="mt-[6px] px-[4px] text-[10.5px] text-text-faint">
                    {formatTurnTime(message.at, lang)}
                  </div>
                )}
                {done && (
                  <div className="mt-[6px] flex items-center gap-[12px] px-[4px] opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onCopyMessage(text)}
                      className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent p-0 text-[11.5px] font-semibold text-text-faint hover:text-text-muted"
                    >
                      <Copy size={12} strokeWidth={2} />
                      {x(M.advisorview_copy)}
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportMessage(text)}
                      className="flex cursor-pointer items-center gap-[5px] border-none bg-transparent p-0 text-[11.5px] font-semibold text-text-faint hover:text-text-muted"
                    >
                      <Download size={12} strokeWidth={2} />
                      {x(M.advisorview_export)}
                    </button>
                    {rating !== undefined && onRate != null && (
                      <span className="flex items-center gap-[2px]">
                        <button
                          type="button"
                          aria-label={x(M.advisorview_rate_up)}
                          aria-pressed={rating === 1}
                          onClick={() => onRate(message.id, 1)}
                          className={`cursor-pointer border-none bg-transparent p-[3px] ${
                            rating === 1
                              ? 'text-accent'
                              : 'text-text-faint hover:text-text-muted'
                          }`}
                        >
                          <ThumbsUp size={12} strokeWidth={2} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={x(M.advisorview_rate_down)}
                          aria-pressed={rating === -1}
                          onClick={() => onRate(message.id, -1)}
                          className={`cursor-pointer border-none bg-transparent p-[3px] ${
                            rating === -1
                              ? 'text-accent'
                              : 'text-text-faint hover:text-text-muted'
                          }`}
                        >
                          <ThumbsDown size={12} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
                {done && rating === -1 && onRateReason != null && (
                  <div className="mt-[6px] flex max-w-[520px] flex-wrap items-center gap-[7px] px-[4px]">
                    <span className="text-[11.5px] font-semibold text-text-faint">
                      {x(M.advisorview_reason_label)}
                    </span>
                    {REASON_CHIPS.map((chip) => {
                      const picked = reason === chip.key
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          aria-pressed={picked}
                          onClick={() => onRateReason(message.id, chip.key)}
                          className={`cursor-pointer rounded-[100px] border px-[11px] py-[4px] font-sans text-[11.5px] font-semibold ${
                            picked
                              ? 'border-(--accent-soft-border) bg-accent-soft text-accent'
                              : 'border-border bg-surface text-text-2'
                          }`}
                        >
                          {x(chip.label)}
                        </button>
                      )
                    })}
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

            {done && (message.proposedActions ?? []).length > 0 && (
              <div className="flex max-w-[620px] flex-col gap-[10px]">
                {(message.proposedActions ?? []).map((proposal) => (
                  <AgentActionCard key={proposal.id} proposal={proposal} />
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

            {done && navChips.length > 0 && (
              <SuggestionChips
                variant="suggest"
                chips={navChips.map((chip) => ({
                  label: chip.label,
                  onClick: () => navigate(chip.to),
                }))}
              />
            )}

            {done && extras?.advisorPackOffer && onBuyAdvisorPack && (
              <AdvisorPackOffer buying={buyingAdvisorPack} onBuy={onBuyAdvisorPack} />
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
