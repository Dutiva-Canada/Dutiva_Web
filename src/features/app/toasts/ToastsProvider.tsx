import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { LText } from '@/i18n/core'
import { ToastsContext } from './toastsContext'
import type { Toast, ToastAction, ToastTone } from './toastsContext'

const TOAST_DURATION_MS = 3600
const TOAST_WITH_ACTION_MS = 6200

export function ToastsProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(
    () => () => {
      for (const handle of timers.current) clearTimeout(handle)
      timers.current = []
    },
    [],
  )

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: LText, tone: ToastTone = 'ok', action?: ToastAction) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, tone, action }])
      const duration = action != null ? TOAST_WITH_ACTION_MS : TOAST_DURATION_MS
      const handle = setTimeout(() => {
        timers.current = timers.current.filter((t) => t !== handle)
        dismissToast(id)
      }, duration)
      timers.current.push(handle)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  )

  return <ToastsContext value={value}>{children}</ToastsContext>
}
