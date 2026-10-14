/**
 * The SWOT quadrant beside each thesis — strengths / weaknesses /
 * opportunities / threats as short editable lists. Tally drafts all four
 * from the thesis and holding (draft-swot, filed to the review queue like
 * every agent artifact); the user edits and saves onto the thesis row.
 * The quadrant never feeds the evaluator — it's the "why", not a trigger.
 */
import { useMemo, useState } from 'react'
import { Check, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import { draftSwot, saveSwot } from '../data/api'
import type { InvestThesis, ThesisSwot } from '../data/types'
import { resolveSuggestion } from '@/lib/agentQueue'

const QUADRANTS = [
  { key: 'strengths', label: IM.invest_swot_strengths, tone: 'sb-swot-s' },
  { key: 'weaknesses', label: IM.invest_swot_weaknesses, tone: 'sb-swot-w' },
  { key: 'opportunities', label: IM.invest_swot_opportunities, tone: 'sb-swot-o' },
  { key: 'threats', label: IM.invest_swot_threats, tone: 'sb-swot-t' },
] as const

type QuadrantKey = (typeof QUADRANTS)[number]['key']

export function AnalysisSwot({ theses }: { theses: InvestThesis[] }) {
  const { x, lang } = useI18n()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()

  const [picked, setPicked] = useState<string | null>(null)
  /* Unsaved edits are kept per thesis — switching the pick pill mid-edit
     must not silently discard a quadrant's work. */
  const [drafts, setDrafts] = useState<Record<string, ThesisSwot>>({})
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<'save' | 'tally' | null>(null)
  const [tallyNote, setTallyNote] = useState(false)
  const [suggestionId, setSuggestionId] = useState<string | null>(null)
  const [addText, setAddText] = useState<Record<QuadrantKey, string>>({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
  })

  const thesis = useMemo(() => {
    if (!picked) return null
    const [assetClass, symbol] = picked.split(':')
    return (
      theses.find(
        (t) => t.assetClass === assetClass && t.symbol.toUpperCase() === symbol?.toUpperCase(),
      ) ?? null
    )
  }, [picked, theses])

  const draft = picked && thesis ? (drafts[picked] ?? thesis.swot) : null
  const dirty = picked ? (dirtyKeys[picked] ?? false) : false

  /* Held symbols without a thesis — they can't hold a SWOT (the quadrant
     lives on the thesis row), so they surface as the nudge. */
  const untracked = useMemo(() => {
    const covered = new Set(theses.map((t) => `${t.assetClass}:${t.symbol.toUpperCase()}`))
    const seen = new Set<string>()
    return state.positions
      .filter((p) => {
        const key = `${p.assetClass}:${p.symbol.toUpperCase()}`
        if (covered.has(key) || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((p) => p.symbol.toUpperCase())
  }, [theses, state.positions])

  const pick = (key: string) => {
    if (busy) return
    setPicked(key)
    setTallyNote(false)
    setSuggestionId(null)
  }

  const setQuadrant = (q: QuadrantKey, items: string[]) => {
    if (!picked || !thesis) return
    const base = drafts[picked] ?? thesis.swot
    setDrafts((cur) => ({ ...cur, [picked]: { ...base, [q]: items } }))
    setDirtyKeys((cur) => ({ ...cur, [picked]: true }))
  }

  const addItem = (q: QuadrantKey) => {
    const text = addText[q].trim()
    if (!text || !draft) return
    setQuadrant(q, [...draft[q], text.slice(0, 140)])
    setAddText((cur) => ({ ...cur, [q]: '' }))
  }

  const runTally = async () => {
    if (!thesis || busy) return
    setBusy('tally')
    try {
      const res = await draftSwot({
        assetClass: thesis.assetClass,
        symbol: thesis.symbol,
        name: thesis.name,
        thesis: thesis.thesis,
        intent: thesis.intent,
        lang,
      })
      if (picked) {
        setDrafts((cur) => ({ ...cur, [picked]: res.draft }))
        setDirtyKeys((cur) => ({ ...cur, [picked]: true }))
      }
      setTallyNote(true)
      setSuggestionId((cur) => cur ?? res.suggestionId)
    } catch {
      showToast(IM.invest_swot_tally_failed)
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    if (!thesis || !draft || busy) return
    setBusy('save')
    try {
      await saveSwot(thesis.id, draft)
      if (suggestionId) {
        void resolveSuggestion(suggestionId, 'accepted', 'applied').catch(() => {})
        setSuggestionId(null)
      }
      showToast(IM.invest_swot_saved)
      if (picked) {
        setDrafts((cur) => {
          const next = { ...cur }
          delete next[picked]
          return next
        })
        setDirtyKeys((cur) => ({ ...cur, [picked]: false }))
      }
      setTallyNote(false)
      await refresh()
    } catch (e) {
      showToast(
        fill(x(IM.invest_swot_failed), { error: e instanceof Error ? e.message : String(e) }),
      )
    } finally {
      setBusy(null)
    }
  }

  if (theses.length === 0) return null

  return (
    <section className="sb-section" aria-label={x(IM.invest_analysis_swot)}>
      <h2>{x(IM.invest_analysis_swot)}</h2>
      <p className="sub">{x(IM.invest_analysis_swot_sub)}</p>

      <div className="sb-pills sb-swot-picks" role="group" aria-label={x(IM.invest_swot_pick)}>
        {theses.map((t) => {
          const key = `${t.assetClass}:${t.symbol.toUpperCase()}`
          return (
            <button
              key={key}
              type="button"
              aria-pressed={picked === key}
              onClick={() => pick(key)}
            >
              {t.symbol}
            </button>
          )
        })}
      </div>

      {thesis && draft && (
        <div className="sb-swot-wrap">
          {tallyNote && <p className="sb-helper">{x(IM.invest_swot_tally_note)}</p>}
          <div className="sb-swot-grid">
            {QUADRANTS.map((q) => (
              <div key={q.key} className={`sb-swot-card ${q.tone}`}>
                <h3>{x(q.label)}</h3>
                <ul>
                  {draft[q.key].length === 0 && (
                    <li className="sb-swot-empty">{x(IM.invest_swot_empty)}</li>
                  )}
                  {draft[q.key].map((item, i) => (
                    <li key={`${q.key}-${i}`}>
                      <span>{item}</span>
                      <button
                        type="button"
                        className="sb-swot-x"
                        aria-label={x(IM.invest_sb_remove_sym)}
                        onClick={() =>
                          setQuadrant(
                            q.key,
                            draft[q.key].filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="sb-swot-add">
                  <input
                    className="sb-input"
                    value={addText[q.key]}
                    maxLength={140}
                    placeholder={x(IM.invest_swot_add_ph)}
                    aria-label={`${x(q.label)} — ${x(IM.invest_swot_add)}`}
                    onChange={(e) =>
                      setAddText((cur) => ({ ...cur, [q.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem(q.key)
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    disabled={!addText[q.key].trim()}
                    aria-label={x(IM.invest_swot_add)}
                    onClick={() => addItem(q.key)}
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="sb-row-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              disabled={busy !== null}
              onClick={() => void runTally()}
            >
              {busy === 'tally' ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={14} aria-hidden="true" />
              )}
              {busy === 'tally' ? x(IM.invest_swot_tally_busy) : x(IM.invest_swot_tally)}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-primary sb-btn-sm"
              disabled={!dirty || busy !== null}
              onClick={() => void save()}
            >
              {busy === 'save' ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Check size={14} aria-hidden="true" />
              )}
              {x(IM.invest_swot_save)}
            </button>
          </div>
        </div>
      )}

      {untracked.length > 0 && (
        <p className="sb-helper" style={{ marginTop: 10 }}>
          {fill(x(IM.invest_swot_no_thesis), { symbol: untracked.slice(0, 4).join(', ') })}
        </p>
      )}
    </section>
  )
}
