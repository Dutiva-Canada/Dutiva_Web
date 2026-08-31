import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { chipToneClasses, statusChipBaseClass } from '@/components/chips'
import {
  mergeSegments,
  parseClauseBulletLines,
  parseClauseFieldLines,
  splitBilingualBody,
  splitClauseSignOff,
  splitProseParagraphs,
} from './engine'
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

const PROSE_PARAGRAPH_GAP = 'space-y-2.5'

const INLINE_BOLD_PATTERN = /(\*\*[^*]+\*\*)/g
const INLINE_ITALIC_PATTERN = /(\*[^*\n]+\*)/g

/** Handoff letter blocks use `**Re:**` / `**Objet :**` — render as bold, not raw markdown. */
function renderInlineTemplateText(text: string): ReactNode {
  return text.split(INLINE_BOLD_PATTERN).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`b-${index}`}>{part.slice(2, -2)}</strong>
    }
    return part.split(INLINE_ITALIC_PATTERN).map((segment, subIndex) => {
      if (
        segment.startsWith('*') &&
        segment.endsWith('*') &&
        segment.length > 2 &&
        !segment.startsWith('**')
      ) {
        return <em key={`i-${index}-${subIndex}`}>{segment.slice(1, -1)}</em>
      }
      return segment
    })
  })
}

function ProseParagraphs({
  text,
  values,
  className,
}: {
  readonly text: string
  readonly values: Record<string, string>
  readonly className?: string
}) {
  const paragraphs = splitProseParagraphs(text)
  if (paragraphs.length <= 1) {
    return (
      <p className={className}>
        <MergeText text={text} values={values} preline />
      </p>
    )
  }
  return (
    <div className={`${PROSE_PARAGRAPH_GAP} ${className ?? ''}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          <MergeText text={paragraph} values={values} />
        </p>
      ))}
    </div>
  )
}

function ClauseSignOff({
  closing,
  lines,
  values,
}: {
  readonly closing: string
  readonly lines: string[]
  readonly values: Record<string, string>
}) {
  return (
    <div className="mt-6">
      <p>{closing}</p>
      {lines.map((line, index) => (
        <p key={index} className={index === 0 ? 'mt-8' : 'mt-0.5'}>
          <MergeText text={line} values={values} />
        </p>
      ))}
    </div>
  )
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

function LetterheadBody({
  text,
  values,
}: {
  readonly text: string
  readonly values: Record<string, string>
}) {
  const newline = text.indexOf('\n')
  if (newline === -1) {
    return (
      <div className="font-semibold">
        <MergeText text={text} values={values} />
      </div>
    )
  }
  return (
    <>
      <div className="font-semibold">
        <MergeText text={text.slice(0, newline)} values={values} />
      </div>
      <MergeText text={text.slice(newline + 1)} values={values} preline />
    </>
  )
}

function ClauseBody({
  text,
  values,
}: {
  readonly text: string
  readonly values: Record<string, string>
}) {
  const signOff = splitClauseSignOff(text)
  const core = signOff?.body ?? text
  const fields = parseClauseFieldLines(core)
  const bullets = fields ? null : parseClauseBulletLines(core)

  if (fields) {
    const { intro, fields: rows, outro } = fields
    return (
      <div className="mt-0.5">
        {intro.trim() && <ProseParagraphs text={intro} values={values} />}
        <dl className="mt-2 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12px]">
          {rows.map((field) => (
            <div key={field.label} className="contents">
              <dt className="font-semibold text-text">{field.label}</dt>
              <dd className="m-0">
                <MergeText text={field.value} values={values} />
              </dd>
            </div>
          ))}
        </dl>
        {outro.trim() && <ProseParagraphs text={outro} values={values} className="mt-2" />}
        {signOff && (
          <ClauseSignOff closing={signOff.closing} lines={signOff.lines} values={values} />
        )}
      </div>
    )
  }

  if (bullets) {
    const { intro, items, outro } = bullets
    return (
      <div className="mt-0.5">
        {intro.trim() && <ProseParagraphs text={intro} values={values} />}
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {items.map((item) => (
            <li key={item}>
              <MergeText text={item} values={values} />
            </li>
          ))}
        </ul>
        {outro.trim() && <ProseParagraphs text={outro} values={values} className="mt-2" />}
        {signOff && (
          <ClauseSignOff closing={signOff.closing} lines={signOff.lines} values={values} />
        )}
      </div>
    )
  }

  return (
    <div className="mt-0.5">
      <ProseParagraphs text={core} values={values} />
      {signOff && <ClauseSignOff closing={signOff.closing} lines={signOff.lines} values={values} />}
    </div>
  )
}

function paraClassName(block: PreviewBlock): string {
  if (block.align === 'right') return 'mb-4 mt-2 text-right'
  return 'mt-3'
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
  const firstClauseIndex = blocks.findIndex((block) => block.type === 'clause')
  return (
    <>
      {blocks.map((block, index) => {
        const text = blockText(block, lang)
        const key = blockKey(block, lang)
        const isFirstClause = block.type === 'clause' && index === firstClauseIndex
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
          case 'letterhead':
            return (
              <div key={key} className="mb-4">
                {block.dateText && (
                  <div className="mb-2 text-right">
                    <MergeText text={block.dateText[lang]} values={values} />
                  </div>
                )}
                <LetterheadBody text={text} values={values} />
              </div>
            )
          case 'address':
            return (
              <address key={key} className="mb-4 mt-0 block not-italic">
                <MergeText text={text} values={values} preline />
              </address>
            )
          case 'clause':
            return (
              <div
                key={key}
                className={isFirstClause ? 'mt-6 border-t border-border pt-5' : 'mt-4'}
              >
                {block.heading && (
                  <div className="text-[12px] font-bold">
                    {block.n !== undefined ? `${block.n}. ` : ''}
                    {d(block.heading)}
                  </div>
                )}
                <ClauseBody text={text} values={values} />
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
                  <div className="mt-0.5 text-[11.5px] text-text-muted italic">
                    <ProseParagraphs text={text} values={values} />
                  </div>
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
              <div key={key} className="mt-4 italic">
                <ProseParagraphs text={text} values={values} />
              </div>
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
                <ProseParagraphs text={text} values={values} />
              </div>
            )
          case 'sig':
            return (
              <div
                key={key}
                className="mt-8 grid grid-cols-1 gap-8 max-sm:grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))]"
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
              <div key={key} className={paraClassName(block)}>
                <ProseParagraphs text={text} values={values} />
              </div>
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
  const paperRef = useRef<HTMLDivElement>(null)
  const paperClass = `rounded-[12px] border border-border bg-surface p-[clamp(18px,2.5vw,28px)] font-serif text-[12.5px] leading-[1.7] text-text shadow-sm ${className ?? ''}`

  useEffect(() => {
    if (!paperRef.current) return
    paperRef.current.scrollTop = 0
  }, [blocks, values, valuesByLang, bilingual, lang])

  if (bilingual && valuesByLang) {
    const { body, tail } = splitBilingualBody(blocks)
    return (
      <div ref={paperRef} className={paperClass}>
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
    <div ref={paperRef} className={paperClass}>
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
