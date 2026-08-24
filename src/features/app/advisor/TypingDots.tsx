/**
 * "Advisor is thinking" indicator — three dots pulsing on the prototype's
 * `pulseDot` keyframe with 0 / .15s / .3s delays. `md` matches the Advisor
 * view (5px dots), `sm` the rail (4px dots).
 */
export interface TypingDotsProps {
  /** Localized label, e.g. x(advisorCore.advisor_thinking). */
  readonly label: string
  readonly size?: 'md' | 'sm'
}

const DELAY_CLASS = ['pulse-dot-delay-0', 'pulse-dot-delay-1', 'pulse-dot-delay-2'] as const

export function TypingDots({ label, size = 'md' }: TypingDotsProps) {
  const container =
    size === 'md'
      ? 'flex items-center gap-[8px] py-[6px] text-[13.5px] text-text-muted'
      : 'flex items-center gap-[7px] text-[12.5px] text-text-muted'
  const dot = size === 'md' ? 'h-[5px] w-[5px]' : 'h-[4px] w-[4px]'
  return (
    <div className={container}>
      <span className="flex gap-[3px]">
        {DELAY_CLASS.map((delayClass) => (
          <span
            key={delayClass}
            className={`inline-block rounded-full bg-text-faint ${dot} animate-[pulseDot_1.1s_ease-in-out_infinite] ${delayClass}`}
          />
        ))}
      </span>
      {label}
    </div>
  )
}
