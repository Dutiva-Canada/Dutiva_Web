import { createContext, useContext } from 'react'
import type { LText } from '@/i18n/core'

export type ToastTone = 'ok' | 'info'

/* Actions are either a link (navigates, toast dismissed) or a callback
   (a real button — used by undo-toasts, which never leave the page). */
export type ToastAction =
  | { label: LText; to: string }
  | { label: LText; onPress: () => void }

/* Kept here (not in the provider) so producers that need to know how long
   an actionable toast lives — like an undo window that commits when the
   toast expires — read the same constant the UI does. */
export const TOAST_DURATION_MS = 3600
export const TOAST_WITH_ACTION_MS = 6200

export interface Toast {
  id: number
  message: LText
  tone: ToastTone
  action?: ToastAction
}

interface ToastsContextValue {
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
