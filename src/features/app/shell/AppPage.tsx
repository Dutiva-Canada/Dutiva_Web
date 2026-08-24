import type { ReactNode } from 'react'
import { cx } from './cx'

/**
 * Shared scroll chrome for `/app` list and detail views. Topbar already owns
 * the route title (as the page `h1`); views should lead with subtitle copy via
 * `AppPageLead` rather than repeating the title.
 */

export type AppPageWidth = 'narrow' | 'comfort' | 'default' | 'wide' | 'studio'

const WIDTH_CLASS: Record<AppPageWidth, string> = {
  narrow: 'max-w-[720px]',
  comfort: 'max-w-[820px]',
  default: 'max-w-[900px]',
  wide: 'max-w-[1120px]',
  studio: 'max-w-[1240px]',
}

const PAD_STANDARD = 'px-[32px] pt-[28px] pb-[60px] max-[640px]:px-[16px]'
/** Home-style pad — tighter on phones, room for the mobile composer. */
const PAD_RESPONSIVE = 'px-[14px] pt-[18px] pb-[96px] sm:px-[32px] sm:pt-[26px] sm:pb-[60px]'

export function AppPage({
  children,
  width = 'default',
  responsivePad = false,
  className,
  innerClassName,
}: {
  readonly children: ReactNode
  readonly width?: AppPageWidth
  readonly responsivePad?: boolean
  readonly className?: string
  readonly innerClassName?: string
}) {
  return (
    <div
      className={cx(
        'min-h-0 flex-1 overflow-y-auto',
        responsivePad ? PAD_RESPONSIVE : PAD_STANDARD,
        className,
      )}
    >
      <div className={cx('mx-auto', WIDTH_CLASS[width], innerClassName)}>{children}</div>
    </div>
  )
}

/** Subtitle / intro under the topbar title — not a second heading. */
export function AppPageLead({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <p className={cx('mb-[20px] max-w-[620px] text-[13.5px] text-text-muted', className)}>
      {children}
    </p>
  )
}
