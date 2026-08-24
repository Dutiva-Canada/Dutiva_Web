/**
 * CSP-safe horizontal progress fill — width is set via SVG geometry, not inline
 * style. Pair with a track wrapper (`overflow-hidden rounded-* bg-*`).
 */
export function ProgressFill({
  pct,
  className = 'h-full w-full text-chart-mark',
}: {
  readonly pct: number
  readonly className?: string
}) {
  const width = Math.min(100, Math.max(0, pct))
  return (
    <svg viewBox="0 0 100 1" preserveAspectRatio="none" className={className} aria-hidden="true">
      <rect width={width} height="1" className="fill-current" />
    </svg>
  )
}
