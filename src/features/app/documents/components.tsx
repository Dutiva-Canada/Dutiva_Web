import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { chipToneClasses, statusChipBaseClass } from '@/components/chips'
import { mergeSegments, splitBilingualBody } from './engine'
import type { MergeSegment } from './engine'
import type { DocChipTone, Jurisdiction, PreviewBlock } from './data'

/**
 * Shared primitives the handoff calls out as feature-specific (no existing
 * design-system equivalent): jurisdiction pill (.jchip), the rendered-document
 * "paper" with merge-field highlighting (.doc-body / .mf), wizard step
 * indicator, segmented toggle, skeleton shimmer, and the doclib status chip
 * (maps the handoff's tone names onto the app chip ramp).
 */

const DOC_TONE_CLASS: Record<DocChipTone, string> = {
  risk: chipToneClasses.risk,
  warn: chipToneClasses.warning,
  ok: chipToneClasses.success,
  info: chipToneClasses.info,
  neutral: chipToneClasses.neutral,
  gold: 'bg-(--gold-bg) text-(--gold-fg)',
}

export function DocChip({
  tone,
  children,
}: {
  readonly tone: DocChipTone
  readonly children: ReactNode
}) {
  return <span className={`${statusChipBaseClass} ${DOC_TONE_CLASS[tone]}`}>{children}</span>
}

/** Small jurisdiction pill (ON/QC/FED) — visually distinct from status chips. */
export function JurisdictionPill({ code }: { readonly code: Jurisdiction }) {
  return (
    <span className="inline-flex items-center rounded-[6px] border border-border bg-inset px-[6px] py-px text-[10.5px] font-bold tracking-[0.04em] text-text-muted">
      {code}
    </span>
  )
}

/** Shimmer block for catalogue loading states. */
export function Skel({ className }: { readonly className?: string }) {
  return (
    <div className={`animate-pulse rounded-[8px] bg-inset ${className ?? ''}`} aria-hidden="true" />
  )
}

export function SegButton({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  readonly active: boolean
  readonly onClick: () => void
  readonly children: ReactNode
  readonly ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`cursor-pointer rounded-[8px] px-[10px] py-[5px] text-[12px] font-semibold transition-colors ${
        active
          ? 'border border-border bg-surface text-text shadow-sm'
          : 'text-text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

/** Wizard 3-dot step control: numbered circles, done/active states, jump-back. */
const STEP_CIRCLE_CLASS = {
  active: 'bg-(--navy) text-white',
  done: 'bg-ok-bg text-ok-fg',
  todo: 'bg-inset text-text-faint',
} as const

function stepState(index: number, step: number): keyof typeof STEP_CIRCLE_CLASS {
  if (index < step) return 'done'
  if (index === step) return 'active'
  return 'todo'
}

export function StepDots({
  step,
  labels,
  onJump,
}: {
  readonly step: number
  readonly labels: string[]
  readonly onJump: (step: number) => void
}) {
  return (
    <div className="flex items-center gap-[6px]">
      {labels.map((label, index) => {
        const state = stepState(index, step)
        const circle = STEP_CIRCLE_CLASS[state]
        return (
          <div key={label} className="flex items-center gap-[6px]">
            {index > 0 && <div className="h-px w-[18px] bg-border" aria-hidden="true" />}
            <button
              type="button"
              disabled={index >= step}
              onClick={() => onJump(index)}
              aria-current={state === 'active' ? 'step' : undefined}
              className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[11.5px] font-bold ${circle} ${
                index < step ? 'cursor-pointer' : ''
              }`}
            >
              {index + 1}
            </button>
            <span
              className={`text-[12px] font-semibold max-[640px]:hidden ${
                state === 'active' ? 'text-text' : 'text-text-muted'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Rendered document "paper" ───────────────────────────────────────────── */

const INLINE_BOLD_PATTERN = /(\*\*[^*]+\*\*)/g

/** Handoff letter blocks use `**Re:**` / `**Objet :**` — render as bold, not raw markdown. */
function renderInlineTemplateText(text: string): ReactNode {
  return text.split(INLINE_BOLD_PATTERN).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function MergeSegmentSpan({ segment }: { readonly segment: MergeSegment }) {
  if (segment.kind === 'text') return <>{renderInlineTemplateText(segment.text)}</>

  const className =
    segment.kind === 'filled'
      ? 'box-decoration-clone rounded-[2px] bg-accent-soft py-px font-medium text-text'
      : 'box-decoration-clone rounded-[2px] bg-warn-bg py-px text-warn-fg'
  return <span className={className}>{segment.text}</span>
}

function MergeText({
  text,
  values,
  preline = false,
}: {
  readonly text: string
  readonly values: Record<string, string>
  /** Preserve `\n` line breaks from template copy (letter blocks, clause lists). */
  readonly preline?: boolean
}) {
  return (
    <span className={preline ? 'whitespace-pre-line' : undefined}>
      {mergeSegments(text, values).map((segment) => (
        <MergeSegmentSpan key={segment.id} segment={segment} />
      ))}
    </span>
  )
}

function blockText(block: PreviewBlock, lang: 'en' | 'fr'): string {
  if (!block.text) return ''
  return block.text[lang]
}

function blockKey(block: PreviewBlock, lang?: 'en' | 'fr'): string {
  const content =
    block.n ??
    block.heading?.en ??
    block.text?.en ??
    block.roles?.map((role) => role.en).join('-') ??
    ''
  return lang ? `${lang}-${block.type}-${content}` : `${block.type}-${content}`
}

function DocPaperBody({
  blocks,
  values,
  lang,
}: {
  readonly blocks: PreviewBlock[]
  readonly values: Record<string, string>
  readonly lang: 'en' | 'fr'
}) {
  const d = (value: Bi): string => value[lang]
  return (
    <>
      {blocks.map((block) => {
        const text = blockText(block, lang)
        const key = blockKey(block, lang)
        switch (block.type) {
          case 'title':
            return (
              <div
                key={key}
                className="mb-1 text-center font-display text-[15px] font-bold tracking-[-0.01em]"
              >
                <MergeText text={text} values={values} />
              </div>
            )
          case 'meta':
            return (
              <div key={key} className="mb-4 text-center text-[11px] text-text-faint">
                <MergeText text={text} values={values} />
              </div>
            )
          case 'clause':
            return (
              <div key={key} className="mt-3">
                {block.heading && (
                  <div className="text-[12px] font-bold">
                    {block.n !== undefined ? `${block.n}. ` : ''}
                    {d(block.heading)}
                  </div>
                )}
                <p className="mt-0.5">
                  <MergeText text={text} values={values} preline />
                </p>
              </div>
            )
          case 'fill':
            return (
              <div key={key} className="mt-3">
                {block.heading && (
                  <div className="text-[12px] font-bold">
                    {block.n !== undefined ? `${block.n}. ` : ''}
                    {d(block.heading)}
                  </div>
                )}
                {text && (
                  <p className="mt-0.5 text-[11.5px] text-text-muted italic">
                    <MergeText text={text} values={values} preline />
                  </p>
                )}
                <div className="mt-2 flex flex-col gap-[14px]" aria-hidden="true">
                  {Array.from({ length: block.lines ?? 3 }, (_, i) => (
                    <div key={i} className="border-b border-border" />
                  ))}
                </div>
              </div>
            )
          case 'ack':
            return (
              <p key={key} className="mt-4 italic">
                <MergeText text={text} values={values} preline />
              </p>
            )
          case 'note':
            return (
              <div
                key={key}
                className={`mt-4 rounded-[8px] border px-3 py-2 text-[11.5px] ${
                  block.tone === 'risk'
                    ? 'border-risk-border bg-risk-bg text-risk-fg'
                    : 'border-(--accent-soft-border) bg-accent-soft text-text-muted'
                }`}
              >
                <MergeText text={text} values={values} preline />
              </div>
            )
          case 'sig':
            return (
              <div
                key={key}
                className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-8"
              >
                {(block.roles ?? []).map((role) => (
                  <div key={role.en}>
                    <div className="border-b border-text/60 pb-6" aria-hidden="true" />
                    <div className="mt-1 text-[11px] text-text-muted">{d(role)}</div>
                  </div>
                ))}
              </div>
            )
          default:
            return (
              <p key={key} className="mt-3">
                <MergeText text={text} values={values} preline />
              </p>
            )
        }
      })}
    </>
  )
}

/**
 * The rendered document. `blocks` should already be conditional-clause
 * resolved (engine.resolveBlocks); `values` = wizard answers merged over the
 * computed tokens (engine.computedTokens). Every preview surface (template
 * detail, wizard live preview, document detail) renders through this.
 */
export function DocPaper({
  blocks,
  values,
  valuesByLang,
  bilingual,
  className,
  docLang,
}: {
  readonly blocks: PreviewBlock[]
  readonly values: Record<string, string>
  readonly className?: string
  /** When set with `bilingual`, renders EN then FR in one deliverable (T01). */
  readonly valuesByLang?: { en: Record<string, string>; fr: Record<string, string> }
  readonly bilingual?: boolean
  /**
   * The language the *document* is written in, which is not the UI locale —
   * a workspace in English can generate a French letter. Pass it wherever a
   * document has one, so block copy and merged answers agree; omit it on the
   * template detail preview, which has no document and follows the UI.
   */
  readonly docLang?: 'en' | 'fr'
}) {
  const { lang: uiLang } = useI18n()
  const lang = docLang ?? uiLang
  const paperClass = `rounded-[12px] border border-border bg-surface p-[clamp(18px,2.5vw,28px)] font-serif text-[12.5px] leading-[1.7] text-text shadow-sm ${className ?? ''}`

  if (bilingual && valuesByLang) {
    const { body, tail } = splitBilingualBody(blocks)
    return (
      <div className={paperClass}>
        <DocPaperBody blocks={body} values={valuesByLang.en} lang="en" />
        <div
          className="mt-8 mb-4 border-t border-border pt-6 text-center font-display text-[13px] font-bold tracking-[-0.01em]"
          aria-hidden="true"
        >
          Version française
        </div>
        <DocPaperBody blocks={body} values={valuesByLang.fr} lang="fr" />
        {tail.length > 0 && <DocPaperBody blocks={tail} values={valuesByLang.en} lang="en" />}
      </div>
    )
  }

  return (
    <div className={paperClass}>
      <DocPaperBody blocks={blocks} values={values} lang={lang} />
    </div>
  )
}

/* ── Document action buttons ─────────────────────────────────────────────── */

const ACTBTN_VARIANT = {
  primary: 'bg-(--navy) text-white hover:opacity-90',
  ghost: 'border border-border bg-surface text-text hover:bg-inset',
  danger: 'border border-(--risk-border) bg-surface text-risk-fg hover:bg-risk-bg',
} as const

export function ActBtn({
  variant = 'ghost',
  onClick,
  children,
  disabled,
}: {
  readonly variant?: keyof typeof ACTBTN_VARIANT
  readonly onClick: () => void
  readonly children: ReactNode
  readonly disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] px-[12px] py-[7px] text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${ACTBTN_VARIANT[variant]}`}
    >
      {children}
    </button>
  )
}
