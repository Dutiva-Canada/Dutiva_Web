import { useEffect, useRef, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { jurisdictionInfo } from '../../data'
import type {
  DocRiskLevel,
  Jurisdiction,
  TemplateCategory,
  TemplateCategoryId,
} from '../../data'
import { REVIEW_LEVEL_ORDER, reviewLevelInfo } from '../../presentation'

export interface StudioFilterValue {
  category: TemplateCategoryId | 'all'
  jurisdiction: Jurisdiction | 'all'
  reviewLevel: DocRiskLevel | 'all'
}

function Chip({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  readonly active: boolean
  readonly onClick: () => void
  readonly ariaLabel?: string
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`min-h-[34px] shrink-0 cursor-pointer rounded-full border px-3.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? 'border-navy bg-navy text-white'
          : 'border-border bg-surface text-text hover:border-border-strong'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Horizontally scrollable quick-filter chips: All · Recommended · the three
 * jurisdictions · every template category. Each chip toggles its own filter
 * axis; "All" clears the whole filter state including the search query.
 */
export function StudioChips({
  value,
  recommendedOnly,
  allActive,
  categories,
  onCategory,
  onJurisdiction,
  onRecommended,
  onClearAll,
}: {
  readonly value: StudioFilterValue
  readonly recommendedOnly: boolean
  /** True when every axis (chips, panel filters, search) is at default. */
  readonly allActive: boolean
  readonly categories: readonly TemplateCategory[]
  readonly onCategory: (category: TemplateCategoryId | 'all') => void
  readonly onJurisdiction: (jurisdiction: Jurisdiction | 'all') => void
  readonly onRecommended: (next: boolean) => void
  readonly onClearAll: () => void
}) {
  const { t, x } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('doclib_studio_filters')}
      className="-mx-[14px] flex gap-2 overflow-x-auto px-[14px] pt-2.5 pb-1 sm:mx-0 sm:px-0"
    >
      <Chip active={allActive} onClick={onClearAll}>
        {t('doclib_studio_all')}
      </Chip>
      <Chip active={recommendedOnly} onClick={() => onRecommended(!recommendedOnly)}>
        {t('doclib_studio_recommendedBadge')}
      </Chip>
      {jurisdictionInfo.map((info) => (
        <Chip
          key={info.code}
          active={value.jurisdiction === info.code}
          ariaLabel={x(info.name)}
          onClick={() =>
            onJurisdiction(value.jurisdiction === info.code ? 'all' : info.code)
          }
        >
          {info.code}
        </Chip>
      ))}
      {[...categories]
        .sort((a, b) => a.order - b.order)
        .map((cat) => (
          <Chip
            key={cat.id}
            active={value.category === cat.id}
            onClick={() => onCategory(value.category === cat.id ? 'all' : cat.id)}
          >
            {x(cat.name)}
          </Chip>
        ))}
    </div>
  )
}

function FilterGroup({
  label,
  options,
  current,
  onPick,
}: {
  readonly label: string
  readonly options: readonly { value: string; label: string }[]
  readonly current: string
  readonly onPick: (value: string) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="px-1 py-3 first:pt-1">
      <div className="mb-2 px-3 text-[11px] font-bold tracking-wide text-text-muted uppercase">
        {label}
      </div>
      <div className="space-y-0.5">
        {options.map((option) => {
          const selected = option.value === current
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(option.value)}
              className={`flex min-h-[40px] w-full cursor-pointer items-center justify-between gap-3 rounded-[9px] px-3 text-left text-[13px] font-semibold transition-colors ${
                selected ? 'bg-navy/5 text-text' : 'text-text-muted hover:bg-inset'
              }`}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {selected && (
                <Check size={15} strokeWidth={2.4} className="shrink-0 text-navy" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The three catalogue filter axes as single-select groups, shared by the
 * mobile bottom sheet and the desktop popover. Selections apply live; the
 * footer button only dismisses the panel.
 */
export function StudioFiltersPanel({
  value,
  categories,
  resultCount,
  onChange,
  onClear,
  onDone,
}: {
  readonly value: StudioFilterValue
  readonly categories: readonly TemplateCategory[]
  readonly resultCount: number
  readonly onChange: (next: StudioFilterValue) => void
  readonly onClear: () => void
  readonly onDone: () => void
}) {
  const { t, x } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 divide-y divide-border-soft overflow-y-auto">
        <FilterGroup
          label={t('doclib_studio_category')}
          current={value.category}
          onPick={(v) => onChange({ ...value, category: v as TemplateCategoryId | 'all' })}
          options={[
            { value: 'all', label: t('doclib_studio_all') },
            ...[...categories]
              .sort((a, b) => a.order - b.order)
              .map((cat) => ({ value: cat.id as string, label: x(cat.name) })),
          ]}
        />
        <FilterGroup
          label={t('doclib_studio_jurisdiction')}
          current={value.jurisdiction}
          onPick={(v) => onChange({ ...value, jurisdiction: v as Jurisdiction | 'all' })}
          options={[
            { value: 'all', label: t('doclib_studio_all') },
            ...jurisdictionInfo.map((info) => ({
              value: info.code as string,
              label: x(info.name),
            })),
          ]}
        />
        <FilterGroup
          label={t('doclib_studio_review')}
          current={value.reviewLevel}
          onPick={(v) => onChange({ ...value, reviewLevel: v as DocRiskLevel | 'all' })}
          options={[
            { value: 'all', label: t('doclib_studio_all') },
            ...REVIEW_LEVEL_ORDER.map((level) => ({
              value: level as string,
              label: x(reviewLevelInfo(level).label),
            })),
          ]}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-[9px] border border-border bg-surface px-3 text-[12.5px] font-semibold text-text hover:bg-inset"
        >
          {t('doclib_studio_clear')}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-[9px] bg-navy px-3 text-[12.5px] font-bold text-white hover:opacity-90"
        >
          {t('doclib_studio_showResults')} ({resultCount})
        </button>
      </div>
    </div>
  )
}

/**
 * Bottom sheet (<lg): fixed overlay, panel slides up from the bottom edge —
 * the native mobile pattern. Escape/backdrop close, body scroll locked.
 */
export function StudioFiltersSheet({
  onClose,
  children,
}: {
  readonly onClose: () => void
  readonly children: ReactNode
}) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => closeRef.current?.focus(), 0)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('doclib_studio_filters')}
      className="fixed inset-0 z-85 flex flex-col justify-end bg-black/40 motion-safe:animate-[fadeIn_0.1s_ease-out]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[85dvh] flex-col rounded-t-[16px] border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-xl motion-safe:animate-[slideUpSheet_0.2s_ease-out]">
        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-4 py-3">
          <h2 className="m-0 text-[14px] font-bold text-text">{t('doclib_studio_filters')}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('doclib_studio_close')}
            className="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * Anchored panel (lg+): the desktop counterpart to the bottom sheet — a
 * dropdown under the filter button rather than a screen-hogging overlay.
 * Parent renders it inside a `relative` container; closes on Escape and
 * outside pointer-down.
 */
export function StudioFiltersPopover({
  onClose,
  children,
}: {
  readonly onClose: () => void
  readonly children: ReactNode
}) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  return (
    <div
      ref={panelRef}
      role="group"
      aria-label={t('doclib_studio_filters')}
      className="absolute top-full right-0 z-30 mt-2 flex max-h-[70vh] w-[340px] flex-col rounded-[12px] border border-border bg-surface shadow-lg"
    >
      {children}
    </div>
  )
}
