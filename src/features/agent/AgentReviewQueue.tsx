import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, RefreshCw, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, type Bi, type Lang } from '@/i18n/core'
import { relativeTime } from '@/lib/format'
import {
  loadPendingSuggestions,
  loadResolvedSuggestions,
  reopenSuggestion,
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
    /** Toast when a row is dismissed — optional; omit to keep dismissals
        silent (the row disappearing is the feedback). */
    dismissed?: Bi
    /** Human labels per kind — the row's raw kind is the fallback. */
    kindLabel?: Record<string, Bi>
  }
  /** Fires after each successful resolve — callers use it to refresh any
      ambient state the queue changes (badge counts, streak widgets). */
  onChanged?: () => void
  /** Opt-in "recently resolved" rail — a collapsed history of the last
      two weeks' verdicts, each with a Put-back undo for the mis-tap. */
  resolved?: {
    title: Bi
    putback: Bi
    /** Accessible name — '{title}' is filled with the row's title. */
    putbackNamed: Bi
    /** Toast after a successful put-back. */
    restored: Bi
    /** Localized verdict words, keyed by the row's status. */
    statusWord: { accepted: Bi; dismissed: Bi }
  }
}

/* Age stamp — bilingual; the absolute timestamp rides the title tooltip. */
function ageStamp(iso: string, lang: Lang): string {
  const r = relativeTime(iso)
  if (!r) return ''
  const p = (b: Bi) => pick(b, lang)
  if (r.unit === 'now') return p({ en: 'just now', fr: 'à l’instant' })
  if (r.unit === 'min') return p({ en: `${r.n}m`, fr: `${r.n} min` })
  if (r.unit === 'hr') return p({ en: `${r.n}h`, fr: `${r.n} h` })
  return p({ en: `${r.n}d`, fr: `${r.n} j` })
}

export function AgentReviewQueue({ surface, kinds, messages, onChanged, resolved }: Props) {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const [items, setItems] = useState<AgentSuggestion[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  /* Per-row busy — a resolve in flight on one row leaves the rest usable. */
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())
  /* The resolved rail — local echoes of this session's verdicts plus the
     last two weeks fetched from the server. */
  const [resolvedItems, setResolvedItems] = useState<AgentSuggestion[]>([])

  const setBusy = (id: string, on: boolean) =>
    setBusyIds((cur) => {
      const next = new Set(cur)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const reload = useCallback(async () => {
    try {
      setItems(await loadPendingSuggestions(surface))
      setLoadFailed(false)
    } catch {
      setItems([])
      setLoadFailed(true)
    }
  }, [surface])

  const reloadResolved = useCallback(async () => {
    if (!resolved) return
    try {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      setResolvedItems(await loadResolvedSuggestions(surface, since))
    } catch {
      /* The rail is a convenience, not the inbox — a miss stays silent. */
    }
  }, [surface, resolved])

  useEffect(() => {
    void reload()
    void reloadResolved()
  }, [reload, reloadResolved])

  /* The queue can change on another surface (Habits' inline suggestions
     resolve the same rows) — coming back to this tab refetches rather than
     trusting a snapshot taken at mount. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void reload()
        void reloadResolved()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload, reloadResolved])

  /* Local echo — a row this session just resolved appears in the rail at
     once, without waiting for a refetch. */
  const echoResolved = (s: AgentSuggestion, status: string, action: string) => {
    if (!resolved) return
    setResolvedItems((cur) =>
      [
        {
          ...s,
          status,
          resolved_action: action,
          resolved_at: new Date().toISOString(),
        },
        ...cur.filter((i) => i.id !== s.id),
      ].slice(0, 20),
    )
  }

  /* Run the kind's action, then mark the row resolved. A failed action
     keeps the row pending — the human hasn't actually accepted anything.
     A failed resolve after a succeeded action is why run() must be
     idempotent — the row stays pending and a retry can't double-apply. */
  const act = async (s: AgentSuggestion, action: string, run: () => Promise<void>) => {
    if (busyIds.has(s.id)) return
    setBusy(s.id, true)
    try {
      await run()
      await resolveSuggestion(s.id, 'accepted', action)
      setItems((cur) => (cur ?? []).filter((i) => i.id !== s.id))
      echoResolved(s, 'accepted', action)
      onChanged?.()
    } catch {
      showToast(messages.actionFailed)
    } finally {
      setBusy(s.id, false)
    }
  }

  const dismiss = async (s: AgentSuggestion) => {
    if (busyIds.has(s.id)) return
    setBusy(s.id, true)
    try {
      await resolveSuggestion(s.id, 'dismissed', 'dismissed')
      setItems((cur) => (cur ?? []).filter((i) => i.id !== s.id))
      echoResolved(s, 'dismissed', 'dismissed')
      if (messages.dismissed) showToast(messages.dismissed)
      onChanged?.()
    } catch {
      showToast(messages.actionFailed)
    } finally {
      setBusy(s.id, false)
    }
  }

  /* Put-back — a resolved row returns to pending, undoing the verdict.
     The pending list refetches so the row lands back in its created_at
     position rather than jumping to the top. */
  const putback = async (s: AgentSuggestion) => {
    if (busyIds.has(s.id)) return
    setBusy(s.id, true)
    try {
      await reopenSuggestion(s.id)
      setResolvedItems((cur) => cur.filter((i) => i.id !== s.id))
      await reload()
      if (resolved) showToast(resolved.restored)
      onChanged?.()
    } catch {
      showToast(messages.actionFailed)
    } finally {
      setBusy(s.id, false)
    }
  }

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-[40px]" role="status">
        <Loader2 size={20} className="animate-spin text-text-muted" aria-hidden="true" />
        <span className="sr-only">{x({ en: 'Loading…', fr: 'Chargement…' })}</span>
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
  /* The recently-resolved rail — collapsed by default; a tap on "Put back"
     undoes a verdict that landed by accident. */
  const resolvedRail =
    resolved && resolvedItems.length > 0 ? (
      <details style={{ marginTop: 18 }}>
        <summary
          className="sb-body-text"
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          {x(resolved.title)}
        </summary>
        <div className="sb-mini-list" role="list" style={{ marginTop: 10 }}>
          {resolvedItems.map((s) => {
            const busy = busyIds.has(s.id)
            const word =
              s.status === 'dismissed'
                ? x(resolved.statusWord.dismissed)
                : x(resolved.statusWord.accepted)
            const when = s.resolved_at ? ageStamp(s.resolved_at, lang) : ''
            const stamp = s.resolved_at
              ? new Date(s.resolved_at).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')
              : ''
            return (
              <div
                key={s.id}
                role="listitem"
                className="sb-notify-row"
                style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>{s.title}</strong>
                  <span className="sb-notify-hint">
                    {word}
                    {when ? ' · ' : ''}
                    {when ? <span title={stamp}>{when}</span> : null}
                  </span>
                </span>
                <span className="sb-row-actions" style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    disabled={busy}
                    aria-label={x(resolved.putbackNamed).replace('{title}', s.title)}
                    onClick={() => void putback(s)}
                  >
                    {busy ? (
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <RefreshCw size={13} aria-hidden="true" />
                    )}
                    {x(resolved.putback)}
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      </details>
    ) : null

  if (items.length === 0) {
    return (
      <>
        <div className="sb-empty">{x(messages.empty)}</div>
        {resolvedRail}
      </>
    )
  }

  return (
    <>
    <div className="sb-mini-list" role="list" style={{ marginTop: 12 }}>
      {items.map((s) => {
        const kind = kinds[s.kind]
        const detail = kind?.detail?.(s) ?? null
        const kindLabel = messages.kindLabel?.[s.kind]
        const busy = busyIds.has(s.id)
        const age = ageStamp(s.created_at, lang)
        const stamp = new Date(s.created_at).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')
        return (
          <div
            key={s.id}
            role="listitem"
            className="sb-notify-row"
            style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong>{s.title}</strong>
              {detail ? <span className="sb-notify-hint">{detail}</span> : null}
              <span className="sb-notify-hint">
                {x(messages.filedBy)} · {kindLabel ? x(kindLabel) : s.kind}
                {age ? ' · ' : ''}
                {age ? <span title={stamp}>{age}</span> : null}
              </span>
            </span>
            <span className="sb-row-actions" style={{ flexShrink: 0 }}>
              {(kind?.actions ?? []).map((a) => (
                <button
                  key={a.action}
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busy}
                  aria-label={`${x(a.label)} — ${s.title}`}
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
                  disabled={busy}
                  aria-label={`${x(messages.acceptFallback)} — ${s.title}`}
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
                disabled={busy}
                aria-label={`${x(messages.dismiss)} — ${s.title}`}
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
    {resolvedRail}
    </>
  )
}
