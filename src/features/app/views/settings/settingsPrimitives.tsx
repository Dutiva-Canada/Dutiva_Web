import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import { statusChipClass } from '@/components/chips'
import type { ChipTone, ToggleSpec } from './settingsData'

/**
 * Settings-view building blocks: section eyebrow, surface card, the 38×22
 * toggle switch (`buildToggleStyle`/`buildToggleKnobStyle`, 3533–3538),
 * labelled toggle rows and status chips. `segClass` (the prototype's `seg()`,
 * line 4908) lives in ./settingsData — a plain function export here would
 * trip the fast-refresh only-export-components rule.
 */

/* Section eyebrow + content (markup: 13px/700 text-3 label, 10px below). */
export function Section({
  label,
  children,
}: {
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <div>
      <div className="mb-[10px] text-[13px] font-bold text-text-3">{label}</div>
      {children}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-[12px] border border-border bg-surface ${className}`}>
      {children}
    </div>
  )
}

export function StatusChip({
  tone,
  children,
}: {
  readonly tone: ChipTone
  readonly children: ReactNode
}) {
  return <span className={statusChipClass(tone)}>{children}</span>
}

/* Prototype buildToggleStyle / buildToggleKnobStyle (lines 3533–3538). */
export function ToggleSwitch({
  on,
  label,
  onToggle,
  disabled = false,
}: {
  readonly on: boolean
  readonly label: string
  readonly onToggle: () => void
  readonly disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-[100px] border-none transition-colors duration-150 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      } ${on ? 'bg-navy' : 'bg-border'}`}
    >
      <div
        className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 ${
          on ? 'left-[19px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

export function ToggleRow({
  spec,
  on,
  onToggle,
}: {
  readonly spec: ToggleSpec
  readonly on: boolean
  readonly onToggle: () => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[14px]">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-text">{x(spec.label)}</div>
        <div className="mt-[2px] text-[12px] text-text-muted">{x(spec.sub)}</div>
      </div>
      <ToggleSwitch on={on} label={x(spec.label)} onToggle={onToggle} />
    </div>
  )
}
