import { useCallback } from 'react'
import { healthMessages as HM } from '@/i18n/messages/health'
import type { Bi } from '@/i18n/core'
import { TOAST_WITH_ACTION_MS, useToasts } from '@/features/app/toasts/toastsContext'

/**
 * Delete-now-undo-later for the portal's row deletes. The row hides at once
 * (the page's own hiddenIds filter — provider state is never touched), the
 * real delete fires only when the undo toast lapses, and Undo restores the
 * exact row — same id, same created_at, same shared_with_mira consent —
 * because nothing was ever destroyed. That beats a re-create undo and a
 * confirm-then-gone flow on the same count of clicks.
 */

export const UNDO_WINDOW_MS = TOAST_WITH_ACTION_MS

interface PendingDelete {
  commit: () => Promise<void>
  onUndo?: () => void
  onCommitted?: () => void
  timer: ReturnType<typeof setTimeout>
}

/* Module scope, not component state — the timer and the toast (which mounts
   at surface level) both outlive the page the delete started on, so Undo
   still works after navigating Journal → Overview mid-window. */
const pending = new Map<string, PendingDelete>()

/* showToast captured at queue time — commit-failure toasts still land even
   if the queueing page has unmounted (the toasts provider sits above it). */
let toastFn: ((message: Bi, tone?: 'ok' | 'info') => void) | null = null

async function commitNow(key: string): Promise<void> {
  const p = pending.get(key)
  if (!p) return
  pending.delete(key)
  clearTimeout(p.timer)
  try {
    await p.commit()
    p.onCommitted?.()
  } catch {
    /* The row never left the server — un-hide it and say the delete didn't
       land. Same failure copy the direct delete path used. */
    p.onUndo?.()
    toastFn?.(HM.health_delete_failed, 'info')
  }
}

/* A closing tab ends the window — flush everything pending, best-effort.
   If the browser kills the request the row simply survives; that's the
   safe direction to fail. */
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    for (const key of [...pending.keys()]) void commitNow(key)
  })
}

export interface UndoableDelete {
  /** Unique per row — 'entry:<id>'. Queueing the same key twice no-ops. */
  key: string
  /** Toast body — 'Deleted “Walk”' / the habit variant names the history. */
  message: Bi
  /** The real delete — fires when the undo window lapses. */
  commit: () => Promise<void>
  /** Hide the row locally right now (e.g. add to the page's hiddenIds). */
  onOptimistic?: () => void
  /** Un-hide the row — Undo clicked, or the commit failed. */
  onUndo?: () => void
  /** Commit landed — pages refresh so the removal is reflected in state. */
  onCommitted?: () => void
}

export function useUndoableDelete() {
  const { showToast } = useToasts()

  const queueDelete = useCallback(
    (input: UndoableDelete) => {
      if (pending.has(input.key)) return
      toastFn = showToast
      input.onOptimistic?.()
      const timer = setTimeout(() => void commitNow(input.key), UNDO_WINDOW_MS)
      pending.set(input.key, {
        commit: input.commit,
        onUndo: input.onUndo,
        onCommitted: input.onCommitted,
        timer,
      })
      showToast(input.message, 'ok', {
        label: HM.health_chat_undo,
        onPress: () => {
          const p = pending.get(input.key)
          if (!p) return
          clearTimeout(p.timer)
          pending.delete(input.key)
          p.onUndo?.()
          showToast(HM.health_undo_restored)
        },
      })
    },
    [showToast],
  )

  return { queueDelete }
}
