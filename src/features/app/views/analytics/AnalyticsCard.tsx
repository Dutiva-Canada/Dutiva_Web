import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'

/**
 * Shared card chrome for the Analytics dashboard: header (title + optional
 * subtitle), and the three data states every card must support — loading
 * skeleton, per-card error with retry, and a plain-text empty state.
 */

export function AnalyticsCard({
  title,
  subtitle,
  children,
  className = '',
  hidden = false,
}: {
  readonly title: string
  readonly subtitle?: string
  readonly children: ReactNode
  readonly className?: string
  /** Role-gated out for this viewer (see cardVisibility.ts). */
  readonly hidden?: boolean
}) {
  if (hidden) return null
  return (
    <section
      aria-label={title}
      className={`min-w-0 rounded-[12px] border border-border bg-surface p-[16px] sm:p-[20px] ${className}`}
    >
      <div className="mb-[4px] text-[13px] font-bold text-text-2">{title}</div>
      {subtitle !== undefined && (
        <div className="mb-[14px] text-[12px] text-text-muted">{subtitle}</div>
      )}
      {subtitle === undefined && <div className="mb-[10px]" />}
      {children}
    </section>
  )
}

const SKELETON_WIDTH = ['w-full', 'w-[88%]', 'w-[76%]', 'w-[64%]', 'w-[52%]'] as const

/** Loading skeleton — quiet inset blocks; announced as busy for AT. */
export function CardSkeleton({ lines = 3 }: { readonly lines?: number }) {
  const { x } = useI18n()
  return (
    <div role="status" aria-label={x(M.analytics_loading)} className="flex flex-col gap-[10px]">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`h-[14px] animate-pulse rounded-[6px] bg-inset ${SKELETON_WIDTH[i % SKELETON_WIDTH.length]}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/** Plain-text empty state. */
export function CardEmpty({ text }: { readonly text: string }) {
  return <p className="m-0 py-[10px] text-[13px] text-text-muted">{text}</p>
}

/** Per-card load failure with its own retry, so one module can't blank the page. */
export function CardError({ onRetry }: { readonly onRetry: () => void }) {
  const { x } = useI18n()
  return (
    <div className="flex items-center justify-between gap-[12px] rounded-[9px] border border-risk-border bg-risk-bg px-[12px] py-[10px]">
      <span className="text-[12.5px] text-risk-fg">{x(M.analytics_error)}</span>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
      >
        {x(M.analytics_retry)}
      </button>
    </div>
  )
}
