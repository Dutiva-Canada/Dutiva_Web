import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from './cx'

interface SidebarTooltipProps {
  readonly children: ReactNode
  readonly label: string
  readonly show: boolean
  readonly position?: 'right' | 'bottom'
}

export function SidebarTooltip({ children, label, show, position = 'right' }: SidebarTooltipProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ visible: boolean; top: number; left: number }>({
    visible: false,
    top: 0,
    left: 0,
  })

  const computePosition = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return { top: 0, left: 0 }
    if (position === 'right') {
      return { top: rect.top + rect.height / 2, left: rect.right + 8 }
    }
    return { top: rect.bottom + 6, left: rect.left + rect.width / 2 }
  }, [position])

  const updatePosition = useCallback(() => {
    const next = computePosition()
    setTooltip({ visible: true, ...next })
  }, [computePosition])

  const hide = useCallback(() => setTooltip((t) => ({ ...t, visible: false })), [])

  useEffect(() => {
    if (!tooltip.visible) return
    const update = () => setTooltip((t) => ({ ...t, ...computePosition() }))
    window.addEventListener('resize', update)
    const scroller = wrapperRef.current?.closest('[data-rail-scroll]') ?? window
    scroller.addEventListener('scroll', update, { passive: true })
    return () => {
      window.removeEventListener('resize', update)
      scroller.removeEventListener('scroll', update)
    }
  }, [tooltip.visible, computePosition])

  if (!show) return <>{children}</>

  return (
    <div
      ref={wrapperRef}
      className="relative flex"
      onMouseEnter={updatePosition}
      onMouseLeave={hide}
      onFocusCapture={updatePosition}
      onBlurCapture={hide}
    >
      {children}
      {tooltip.visible && (
        <span
          role="tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
          className={cx(
            'pointer-events-none fixed z-80 whitespace-nowrap rounded-md bg-surface px-2 py-1 text-[11px] font-medium text-text shadow-[0_4px_16px_rgba(0,0,0,0.18)] ring-1 ring-border',
            position === 'right' ? '-translate-y-1/2' : '-translate-x-1/2',
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}
