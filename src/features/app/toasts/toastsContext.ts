import { createContext, useContext } from 'react'
import type { LText } from '@/i18n/core'

export type ToastTone = 'ok' | 'info'

export interface ToastAction {
  label: LText
  to: string
}

export interface Toast {
  id: number
  message: LText
  tone: ToastTone
  action?: ToastAction
}

export interface ToastsContextValue {
  toasts: Toast[]
  /** Show a bottom toast; auto-dismisses after ~3.6s (longer when an action is present). */
  showToast: (message: LText, tone?: ToastTone, action?: ToastAction) => void
  dismissToast: (id: number) => void
}

export const ToastsContext = createContext<ToastsContextValue | null>(null)

export function useToasts(): ToastsContextValue {
  const ctx = useContext(ToastsContext)
  if (!ctx) throw new Error('useToasts must be used within a ToastsProvider')
  return ctx
}
