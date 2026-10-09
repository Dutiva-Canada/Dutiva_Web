import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, RefreshCw, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { relativeTime } from '@/lib/format'
import {
  loadPendingSuggestions,
  resolveSuggestion,
  type AgentSuggestion,
  type AgentSurface,
} from '@/lib/agentQueue'
import { useToasts } from '@/features/app/toasts/toastsContext'

/**
 * The durable review list for one surface's agent_suggestions — the
 * "work waiting on a human" inbox. Each kind declares how to render its
 * payload and which action(s) resolve it; a generic Dismiss always exists.
 * Rows the queue never wrote (suggestionId was null upstream) can't appear
 * here — they're inherently ephemeral.
 */

export interface KindRenderer {
  /** One-line payload summary under the title. */
  detail?: (s: AgentSuggestion) => string | null
  /** Resolve-and-act buttons, rendered before Dismiss. */
  actions: {
    label: Bi
    /** resolved_action recorded when run() succeeds. */
    action: string
    run: (s: AgentSuggestion) => Promise<void>
  }[]
}

interface Props {
  surface: AgentSurface
  kinds: Record<string, KindRenderer>
  /** Bilingual strings — callers pass their surface's message keys so the
      queue stays chrome-free of portal copy. */
  messages: {
    empty: Bi
    dismiss: Bi
    acceptFallback: Bi
    loadFailed: Bi
    filedBy: Bi
    /** Toast when a resolve call fails — the row stays pending either way,
        but the click shouldn't look dead. */
    actionFailed: Bi
    /** Human labels per kind — the row's raw kind is the fallback. */
    kindLabel?: Record<string, Bi>
  }
}

function ageOf(s: AgentSuggestion): string {
  const r = relativeTime(s.created_at)
  if (!r) return ''
  if (r.unit === 'now') return 'just now'
  if (r.unit === 'min') return `${r.n}m`
  if (r.unit === 'hr') return `${r.n}h`
  return `${r.n}d`
}

export function AgentReviewQueue({ surface, kinds, messages }: Props) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [items, setItems] = useState<AgentSuggestion[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setItems(await loadPendingSuggestions(surface))
      setLoadFailed(false)
    } catch {
      setItems([])
      setLoadFailed(true)
    }
  }, [surface])

  useEffect(() => {
    void reload()
  }, [reload])

  /* Run the kind's action, then mark the row resolved. A failed action
     keeps the row pending — the human hasn't actually accepted anything. */
  const act = async (s: AgentSuggestion, action: string, run: () => Promise<void>) => {
    if (busyId) return
    setBusyId(s.id)
    try {
      await run()
      await resolveSuggestion(s.id, 'accepted', action)
      setItems((cur) => (cur ?? []).filter((i) => i.id !== s.id))
    } catch {
      showToast(messages.actionFailed)
    } finally {
      setBusyId(null)
    }
  }

  const dismiss = async (s: AgentSuggestion) => {
    if (busyId) return
    setBusyId(s.id)
    try {
      await resolveSuggestion(s.id, 'dismissed', 'dismissed')
      setItems((cur) => (cur ?? []).filter((i) => i.id !== s.id))
    } catch {
      showToast(messages.actionFailed)
    } finally {
      setBusyId(null)
    }
  }

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-[40px]">
        <Loader2 size={20} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }
  if (loadFailed) {
    return (
      <div className="sb-empty">
        <p style={{ margin: '0 0 10px' }}>{x(messages.loadFailed)}</p>
        <button
          type="button"
          className="sb-btn sb-btn-secondary sb-btn-sm"
          onClick={() => void reload()}
        >
          <RefreshCw size={13} aria-hidden="true" />
          {x({ en: 'Retry', fr: 'Réessayer' })}
        </button>
      </div>
    )
  }
  if (items.length === 0) {
    return <div className="sb-empty">{x(messages.empty)}</div>
  }

  return (
    <div className="sb-mini-list" style={{ marginTop: 12 }}>
      {items.map((s) => {
        const kind = kinds[s.kind]
        const detail = kind?.detail?.(s) ?? null
        const kindLabel = messages.kindLabel?.[s.kind]
        const busy = busyId === s.id
        return (
          <div
            key={s.id}
            className="sb-notify-row"
            style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong>{s.title}</strong>
              {detail ? <span className="sb-notify-hint">{detail}</span> : null}
              <span className="sb-notify-hint">
                {x(messages.filedBy)} · {kindLabel ? x(kindLabel) : s.kind}
                {ageOf(s) ? ` · ${ageOf(s)}` : ''}
              </span>
            </span>
            <span className="sb-row-actions" style={{ flexShrink: 0 }}>
              {(kind?.actions ?? []).map((a) => (
                <button
                  key={a.action}
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busyId !== null}
                  onClick={() => void act(s, a.action, () => a.run(s))}
                >
                  {busy ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={13} aria-hidden="true" />
                  )}
                  {x(a.label)}
                </button>
              ))}
              {(kind?.actions ?? []).length === 0 ? (
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busyId !== null}
                  onClick={() => void act(s, 'acknowledged', async () => {})}
                >
                  {busy ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={13} aria-hidden="true" />
                  )}
                  {x(messages.acceptFallback)}
                </button>
              ) : null}
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                disabled={busyId !== null}
                onClick={() => void dismiss(s)}
              >
                <X size={13} aria-hidden="true" />
                {x(messages.dismiss)}
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
