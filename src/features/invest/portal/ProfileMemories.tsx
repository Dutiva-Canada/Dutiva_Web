/**
 * The memories card on /invest/profile — confirmed, durable facts Tally
 * retains about the holder (invest_memories, 0222). Two write paths, both
 * review-first: the holder adds one by hand ('manual'), or accepts a fact
 * Tally proposed from recent chat ('tally' — the pending strip above
 * handles that accept). "Ask Tally to review" runs the review-memories
 * action; whatever it files lands in the same pending strip.
 */
import { useMemo, useState } from 'react'
import { Brain, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import { deleteMemory, reviewMemories, saveMemory } from '../data/api'
import { MEMORY_KINDS, type MemoryKind } from '../data/types'

/** Same normalized compare as the server's textDedupeKey — a near-twin
    already on file doesn't need a second row. */
const memKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

const KIND_LABEL: Record<MemoryKind, (typeof IM)[keyof typeof IM]> = {
  preference: IM.invest_mem_kind_preference,
  plan: IM.invest_mem_kind_plan,
  fact: IM.invest_mem_kind_fact,
  philosophy: IM.invest_mem_kind_philosophy,
}

export function ProfileMemories({ onFiled }: { onFiled: () => void }) {
  const { x, lang } = useI18n()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()

  const [composerOpen, setComposerOpen] = useState(false)
  const [kind, setKind] = useState<MemoryKind>('fact')
  const [symbol, setSymbol] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<'save' | 'review' | `del:${string}` | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  /* Held ∪ watched symbols for the scope pick — a memory can name any
     name the book tracks, matching the review pass's symbol validation.
     Empty = applies to the book as a whole. */
  const heldSymbols = useMemo(
    () =>
      [
        ...new Set(
          [...state.positions.map((p) => p.symbol), ...state.watchlist.map((w) => w.symbol)].map(
            (s) => s.toUpperCase(),
          ),
        ),
      ].sort(),
    [state.positions, state.watchlist],
  )

  const save = async () => {
    const t = text.trim()
    if (busy || t.length < 8) return
    /* A twin already on file is a success, not a new row — the dedupe is
       the same normalized-text compare the review pass uses. */
    if (state.memories.some((m) => memKey(m.text) === memKey(t))) {
      setComposerOpen(false)
      setText('')
      showToast(IM.invest_mem_exists)
      return
    }
    setBusy('save')
    try {
      await saveMemory({ kind, text: t, symbol: symbol.trim() || null, source: 'manual' })
      setText('')
      setSymbol('')
      setComposerOpen(false)
      await refresh()
      showToast(IM.invest_mem_saved)
    } catch (e) {
      showToast(
        fill(x(IM.invest_mem_failed), { error: e instanceof Error ? e.message : String(e) }),
      )
    } finally {
      setBusy(null)
    }
  }

  /* The review pass — files 'memory' suggestions; the pending strip counts
     and accepts them. onFiled lets the page reload that strip. */
  const review = async () => {
    if (busy) return
    setBusy('review')
    try {
      const res = await reviewMemories({ lang })
      onFiled()
      showToast(
        res.proposed === 0
          ? IM.invest_mem_review_none
          : {
              en: fill(IM.invest_mem_review_filed.en, { n: String(res.proposed) }),
              fr: fill(IM.invest_mem_review_filed.fr, { n: String(res.proposed) }),
            },
      )
    } catch {
      showToast(IM.invest_mem_review_failed)
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    if (busy) return
    setBusy(`del:${id}`)
    try {
      await deleteMemory(id)
      await refresh()
    } catch (e) {
      showToast(
        fill(x(IM.invest_mem_failed), { error: e instanceof Error ? e.message : String(e) }),
      )
    } finally {
      setBusy(null)
      setConfirmDel(null)
    }
  }

  return (
    <section className="sb-section" aria-labelledby="prof-memories-h">
      <div className="sb-section-head">
        <div>
          <h2 id="prof-memories-h" className="sb-flabel" style={{ margin: 0 }}>
            <Brain size={15} strokeWidth={1.9} aria-hidden="true" /> {x(IM.invest_prof_memories)}
          </h2>
          <p className="sb-caption" style={{ marginTop: 4, marginBottom: 0 }}>
            {x(IM.invest_prof_memories_sub)}
          </p>
        </div>
        <div className="sb-row-actions">
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            onClick={() => setComposerOpen((v) => !v)}
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
            {x(IM.invest_mem_add)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-primary sb-btn-sm"
            disabled={busy !== null}
            onClick={() => void review()}
          >
            {busy === 'review' ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={14} strokeWidth={1.9} aria-hidden="true" />
            )}
            {busy === 'review' ? x(IM.invest_mem_review_busy) : x(IM.invest_mem_review)}
          </button>
        </div>
      </div>

      {composerOpen && (
        <div className="sb-card" style={{ marginBottom: 14 }}>
          <div className="sb-card-pad">
            <div className="sb-field">
              <span className="sb-flabel" id="prof-mem-kind">
                {x(IM.invest_mem_add)}
              </span>
              <div className="sb-pills" role="group" aria-labelledby="prof-mem-kind">
                {MEMORY_KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={kind === k}
                    onClick={() => setKind(k)}
                  >
                    {x(KIND_LABEL[k])}
                  </button>
                ))}
              </div>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="prof-mem-sym">
                {x(IM.invest_mem_symbol_ph)}
              </label>
              <select
                id="prof-mem-sym"
                className="sb-input"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              >
                <option value="">—</option>
                {heldSymbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sb-field" style={{ marginBottom: 10 }}>
              <label className="sb-flabel" htmlFor="prof-mem-text">
                {x(IM.invest_mem_add_ph)}
              </label>
              <input
                id="prof-mem-text"
                className="sb-input"
                value={text}
                maxLength={400}
                onChange={(e) => setText(e.target.value)}
                placeholder={x(IM.invest_mem_add_ph)}
              />
            </div>
            <div className="sb-row-actions">
              <button
                type="button"
                className="sb-btn sb-btn-primary sb-btn-sm"
                disabled={busy !== null || text.trim().length < 8}
                onClick={() => void save()}
              >
                {busy === 'save' ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : null}
                {x(IM.invest_mem_save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.memories.length === 0 ? (
        <div className="sb-empty">{x(IM.invest_mem_empty)}</div>
      ) : (
        <div className="sb-mini-list">
          {state.memories.map((m) => (
            <div key={m.id} className="sb-notify-row">
              <span className="sb-pill">{x(KIND_LABEL[m.kind])}</span>
              {m.symbol && <span className="sb-scan-sym">{m.symbol}</span>}
              <span style={{ flex: 1, minWidth: 0 }}>{m.text}</span>
              <span className="sb-notify-hint" style={{ flexShrink: 0 }}>
                {m.source === 'tally' ? x(IM.invest_mem_source_tally) : x(IM.invest_mem_source_manual)}
              </span>
              <button
                type="button"
                className={`sb-btn sb-btn-danger sb-btn-sm${confirmDel === m.id ? ' sb-armed' : ''}`}
                style={{ flexShrink: 0 }}
                disabled={busy !== null}
                onClick={() => (confirmDel === m.id ? void remove(m.id) : setConfirmDel(m.id))}
                aria-label={x(IM.invest_delete)}
              >
                {busy === `del:${m.id}` ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : confirmDel === m.id ? (
                  x(IM.invest_delete)
                ) : (
                  <Trash2 size={14} strokeWidth={1.9} aria-hidden="true" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
