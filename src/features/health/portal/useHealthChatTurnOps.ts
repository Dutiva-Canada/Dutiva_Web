import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { healthMessages as HM } from '@/i18n/messages/health'
import {
  deleteHealthChatTurn,
  rateHealthChatTurn,
  undoHealthChatAction,
  type HealthChatTurn,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useHealthData } from '@/features/health/data/HealthDataContext'

/**
 * Per-turn mutations on the conversation log — undo an action chip, delete
 * one turn, thumb a reply (with the one-tap reason), plus the armed-confirm
 * and busy flags those controls need. All of them write through the
 * health-ai function and patch local state optimistically.
 */
export function useHealthChatTurnOps(
  turns: HealthChatTurn[] | null,
  setTurns: Dispatch<SetStateAction<HealthChatTurn[] | null>>,
) {
  const { showToast } = useToasts()
  const { refresh } = useHealthData()
  const [undoing, setUndoing] = useState<string | null>(null)
  /* Turn id whose delete icon is armed — the second tap confirms. */
  const [delArmed, setDelArmed] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  /* Turn id whose downvote is waiting on a reason chip pick. */
  const [reasonFor, setReasonFor] = useState<string | null>(null)

  /* An armed delete disarms itself — the confirm can't linger. */
  useEffect(() => {
    if (!delArmed) return
    const t = window.setTimeout(() => setDelArmed(null), 3000)
    return () => window.clearTimeout(t)
  }, [delArmed])

  /* Undo on an action chip — the server reverses the write and marks the
     action undone, so the chip doesn't offer it again after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoHealthChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(HM.health_chat_undo_failed)
    } finally {
      setUndoing(null)
    }
  }

  /* Two-step per-turn delete — one row gone without wiping the thread.
     A user turn's paired reply goes with it (the server drops the +1ms
     row; the local filter mirrors that). */
  const removeTurn = async (turn: HealthChatTurn) => {
    if (deleting) return
    if (delArmed !== turn.id) {
      setDelArmed(turn.id)
      return
    }
    setDelArmed(null)
    setDeleting(turn.id)
    try {
      await deleteHealthChatTurn(turn.id)
      setTurns((prev) => {
        const list = prev ?? []
        const idx = list.findIndex((t) => t.id === turn.id)
        /* The server drops a user turn's paired reply along with it —
           identify that reply by position (the assistant turn right
           after), not the +1ms stamp it happens to persist with; a stamp
           that slips leaves an orphaned bubble no poll will clean up. */
        const pairId =
          turn.role === 'user' && list.at(idx + 1)?.role === 'assistant'
            ? (list.at(idx + 1)?.id ?? null)
            : null
        return list.filter((t) => t.id !== turn.id && t.id !== pairId)
      })
    } catch {
      showToast(HM.health_chat_error)
    } finally {
      setDeleting(null)
    }
  }

  /* Thumbs on an assistant turn — only real rows (uuid ids) can hold a
     rating; optimistic, reverted if the write fails. A downvote opens the
     one-tap reason chips. */
  const rate = async (turnId: string, rating: 1 | -1) => {
    const before = turns?.find((t) => t.id === turnId)?.feedback ?? null
    const next = before === rating ? 0 : rating
    setTurns((prev) =>
      (prev ?? []).map((t) =>
        t.id === turnId ? { ...t, feedback: next || null, feedbackReason: null } : t,
      ),
    )
    setReasonFor(next === -1 ? turnId : null)
    try {
      await rateHealthChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
      setReasonFor(null)
      /* The thumb silently snapping back reads as "it toggled off" — the
         toast is the only way to tell the rating itself didn't save. */
      showToast(HM.health_chat_error)
    }
  }

  /* Reason chip under a downvote — stores the why with the rating. */
  const pickReason = async (turnId: string, reason: string) => {
    setReasonFor(null)
    setTurns((prev) =>
      (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedbackReason: reason } : t)),
    )
    try {
      await rateHealthChatTurn(turnId, -1, reason)
    } catch {
      /* The rating itself already landed — a failed reason just leaves the
         downvote unexplained. */
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedbackReason: null } : t)),
      )
    }
  }

  return {
    undoing,
    delArmed,
    deleting,
    reasonFor,
    setReasonFor,
    undo,
    removeTurn,
    rate,
    pickReason,
  }
}
