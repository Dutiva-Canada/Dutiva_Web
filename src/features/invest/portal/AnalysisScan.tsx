/**
 * The environmental-scan watch board — theme-level factors (economy,
 * policy, sector, currency, geopolitical, company) with the symbols they
 * could touch. The sweep connects an item to a holding whose thesis just
 * degraded; staleness (unreviewed ~6 weeks) is the board's own discipline.
 *
 * "Let Tally scan" drafts a set from the held universe (draft-scan —
 * each item files its own agent_suggestions row, returned here as staged
 * cards the user accepts or dismisses one by one).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, Loader2, Plus, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import {
  deleteScanItem,
  draftScan,
  markScanItemReviewed,
  saveScanItem,
  type ScanDraft,
} from '../data/api'
import { resolveSuggestion } from '@/lib/agentQueue'
import type { InvestNewsItem, InvestScanItem, ScanDirection, ScanTheme } from '../data/types'
import { SCAN_DIRECTIONS, SCAN_THEMES } from '../data/types'
import { relTimeLabel } from './relTime'
import {
  dedupeNews,
  isPaywalledSource,
  NEWS_KIND_ORDER,
  newsKind,
  normalizeSource,
  sourceInSet,
} from '../data/newsDedupe'
import { NewsPaywallChip } from './NewsPaywallChip'
import { usePaywalledPref } from './newsPrefs'
import { SCAN_DIR_LABEL, SCAN_DIR_PILL } from './strategyUi'

const SCAN_THEME_LABEL: Record<ScanTheme, keyof typeof IM> = {
  economy: 'invest_scan_theme_economy',
  policy: 'invest_scan_theme_policy',
  sector: 'invest_scan_theme_sector',
  currency: 'invest_scan_theme_currency',
  geopolitical: 'invest_scan_theme_geopolitical',
  company: 'invest_scan_theme_company',
}
/* The direction label/pill maps live in strategyUi so the pending-
   suggestion strip shares the board's vocabulary. */

/** An item untouched for ~6 weeks earns the stale badge — the board's
    own review cadence. */
const STALE_MS = 45 * 86_400_000

interface ScanDraftState {
  id: string | null
  theme: ScanTheme
  direction: ScanDirection
  title: string
  note: string
  symbols: string[]
}
const emptyScan = (): ScanDraftState => ({
  id: null,
  theme: 'sector',
  direction: 'monitor',
  title: '',
  note: '',
  symbols: [],
})

export function AnalysisScan() {
  const { x, lang } = useI18n()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ScanDraftState>(emptyScan)
  const [staged, setStaged] = useState<{ item: ScanDraft; suggestionId: string | null }[]>([])
  const [tallyBusy, setTallyBusy] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  /* Two-tap confirm auto-disarms — a permanently-armed button turns a
     later stray click into a delete. Same cadence as RulesAccordion. */
  useEffect(() => {
    if (confirmDelete === null) return
    const t = window.setTimeout(() => setConfirmDelete(null), 3000)
    return () => window.clearTimeout(t)
  }, [confirmDelete])

  /* Symbols an item can point at — held ∪ watched ∪ thesised. */
  const symbolOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of [
      ...state.positions.map((p) => p.symbol),
      ...state.watchlist.map((w) => w.symbol),
      ...state.theses.map((t) => t.symbol),
    ]) {
      const sym = s.toUpperCase()
      if (!seen.has(sym)) {
        seen.add(sym)
        out.push(sym)
      }
    }
    return out
  }, [state.positions, state.watchlist, state.theses])

  /* Stale items surface first — the board's review discipline. */
  const sorted = useMemo(() => {
    const now = Date.now()
    const rank = (i: InvestScanItem) =>
      now - Date.parse(i.lastReviewedAt) > STALE_MS ? 0 : 1
    return [...state.scanItems].sort((a, b) => {
      const r = rank(a) - rank(b)
      if (r !== 0) return r
      return SCAN_THEMES.indexOf(a.theme) - SCAN_THEMES.indexOf(b.theme)
    })
  }, [state.scanItems])

  /* Subscription-only sources hidden here too — same device pref, and
     the chip below names what the board isn't showing. */
  const [showPaywalled, togglePaywalled] = usePaywalledPref()
  /* The freshest theme-matched headlines per item — viaTheme is stored
     as the item's title at fetch time, so the match key is the trimmed
     title. Same-story dedupe runs symbol-agnostic here: on a theme card
     the tag is the theme, not the ticker. */
  const newsByTheme = useMemo(() => {
    /* Muted publishers (0240) hide here too — a muted source is muted
       everywhere the feed surfaces, not just on the Overview card. */
    const muted = new Set(state.newsMutes.map(normalizeSource))
    const map = new Map<string, InvestNewsItem[]>()
    const hidden = new Set<string>()
    let hiddenCount = 0
    for (const n of dedupeNews(state.news, { symbolAware: false })) {
      if (sourceInSet(muted, n.source)) continue
      if (isPaywalledSource(n.source)) {
        if (!showPaywalled) {
          if (n.viaTheme) {
            hidden.add(n.source)
            hiddenCount++
          }
          continue
        }
      }
      if (!n.viaTheme) continue
      const list = map.get(n.viaTheme) ?? []
      list.push(n)
      map.set(n.viaTheme, list)
    }
    /* Same kind order as the Overview feed — the three a card shows
       prefer an event over a price-move writeup. */
    for (const list of map.values()) {
      list.sort(
        (a, b) => NEWS_KIND_ORDER[a.kind ?? newsKind(a.title)] - NEWS_KIND_ORDER[b.kind ?? newsKind(b.title)],
      )
    }
    return { map, hiddenCount, hiddenSources: [...hidden].sort() }
  }, [state.news, state.newsMutes, showPaywalled])

  const save = useCallback(async () => {
    if (busy || !draft.title.trim()) return
    setBusy('scan')
    try {
      await saveScanItem({
        ...(draft.id ? { id: draft.id } : {}),
        theme: draft.theme,
        direction: draft.direction,
        title: draft.title,
        note: draft.note,
        symbols: draft.symbols,
      })
      showToast(IM.invest_scan_saved)
      setDraft(emptyScan())
      setOpen(false)
      await refresh()
    } catch (e) {
      showToast(
        fill(x(IM.invest_scan_failed), { error: e instanceof Error ? e.message : String(e) }),
      )
    } finally {
      setBusy(null)
    }
  }, [busy, draft, refresh, showToast, x])

  const runTally = useCallback(async () => {
    if (tallyBusy) return
    const holdings = state.positions.map((p) => ({
      assetClass: p.assetClass,
      symbol: p.symbol,
      name: p.name,
    }))
    if (holdings.length === 0) return
    setTallyBusy(true)
    try {
      setStaged(await draftScan({ holdings, lang }))
    } catch {
      showToast(IM.invest_scan_tally_failed)
    } finally {
      setTallyBusy(false)
    }
  }, [tallyBusy, state.positions, lang, showToast])

  const addStaged = useCallback(
    async (idx: number) => {
      const st = staged[idx]
      if (!st || busy) return
      setBusy(`staged-${idx}`)
      try {
        await saveScanItem({
          theme: st.item.theme,
          direction: st.item.direction,
          title: st.item.title,
          note: st.item.note,
          symbols: st.item.symbols,
        })
        if (st.suggestionId) {
          void resolveSuggestion(st.suggestionId, 'accepted', 'added').catch(() => {})
        }
        setStaged((cur) => cur.filter((_, i) => i !== idx))
        showToast(IM.invest_scan_saved)
        await refresh()
      } catch (e) {
        showToast(
          fill(x(IM.invest_scan_failed), { error: e instanceof Error ? e.message : String(e) }),
        )
      } finally {
        setBusy(null)
      }
    },
    [staged, busy, refresh, showToast, x],
  )

  const remove = useCallback(
    async (i: InvestScanItem) => {
      if (busy) return
      setBusy(i.id)
      try {
        await deleteScanItem(i.id)
        showToast(IM.invest_scan_deleted)
        await refresh()
      } finally {
        setBusy(null)
        setConfirmDelete(null)
      }
    },
    [busy, refresh, showToast],
  )

  return (
    <section ref={sectionRef} className="sb-section" aria-label={x(IM.invest_analysis_scan)}>
      <div className="sb-section-head">
        <div>
          <h2>{x(IM.invest_analysis_scan)}</h2>
          <p className="sub">{x(IM.invest_analysis_scan_sub)}</p>
        </div>
        <div className="sb-row-actions">
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            disabled={tallyBusy || state.positions.length === 0}
            onClick={() => void runTally()}
          >
            {tallyBusy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            {tallyBusy ? x(IM.invest_scan_tally_busy) : x(IM.invest_scan_tally)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            onClick={() => {
              setDraft(emptyScan())
              setOpen((o) => !o)
            }}
          >
            <Plus size={15} aria-hidden="true" />
            {x(IM.invest_scan_new)}
          </button>
        </div>
      </div>

      {staged.length > 0 && (
        <div className="sb-mini-list" style={{ marginBottom: 14 }}>
          <p className="sb-caption" style={{ marginTop: 0 }}>
            {x(IM.invest_analysis_pending)}
          </p>
          {staged.map((st, i) => (
            <div
              key={`staged-${i}`}
              className="sb-notify-row"
              style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{st.item.title}</strong>
                <span className="sb-notify-hint">
                  {x(IM[SCAN_THEME_LABEL[st.item.theme]])}
                  {st.item.symbols.length > 0
                    ? ` · ${st.item.symbols.join(', ')}`
                    : ` · ${x(IM.invest_scan_all_book)}`}
                </span>
                {st.item.note && <span className="sb-notify-hint">{st.item.note}</span>}
              </span>
              <span className="sb-row-actions" style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busy !== null}
                  onClick={() => void addStaged(i)}
                >
                  {x(IM.invest_scan_suggest_accept)}
                </button>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busy !== null}
                  onClick={() => {
                    if (st.suggestionId) {
                      void resolveSuggestion(st.suggestionId, 'dismissed', 'dismissed').catch(
                        () => {},
                      )
                    }
                    setStaged((cur) => cur.filter((_, j) => j !== i))
                  }}
                >
                  {x(IM.invest_dismiss)}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="sb-card" style={{ marginBottom: 14 }}>
          <div className="sb-card-pad">
            <div className="sb-goal-compose">
              <div className="sb-field">
                <label className="sb-flabel" htmlFor="an-scan-theme">
                  {x(IM.invest_scan_theme)}
                </label>
                <select
                  className="sb-input"
                  id="an-scan-theme"
                  value={draft.theme}
                  onChange={(e) =>
                    setDraft((cur) => ({ ...cur, theme: e.target.value as ScanTheme }))
                  }
                >
                  {SCAN_THEMES.map((t) => (
                    <option key={t} value={t}>
                      {x(IM[SCAN_THEME_LABEL[t]])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sb-field">
                <label className="sb-flabel" htmlFor="an-scan-dir">
                  {x(IM.invest_scan_direction)}
                </label>
                <select
                  className="sb-input"
                  id="an-scan-dir"
                  value={draft.direction}
                  onChange={(e) =>
                    setDraft((cur) => ({
                      ...cur,
                      direction: e.target.value as ScanDirection,
                    }))
                  }
                >
                  {SCAN_DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {x(IM[SCAN_DIR_LABEL[d]])}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sb-field">
              <input
                className="sb-input"
                value={draft.title}
                maxLength={100}
                placeholder={x(IM.invest_scan_title_ph)}
                aria-label={x(IM.invest_scan_title_ph)}
                onChange={(e) => setDraft((cur) => ({ ...cur, title: e.target.value }))}
              />
            </div>
            <div className="sb-field">
              <input
                className="sb-input"
                value={draft.note}
                maxLength={200}
                placeholder={x(IM.invest_scan_note_ph)}
                aria-label={x(IM.invest_scan_note_ph)}
                onChange={(e) => setDraft((cur) => ({ ...cur, note: e.target.value }))}
              />
            </div>
            <div className="sb-field">
              <span className="sb-flabel" id="an-scan-syms">
                {x(IM.invest_scan_symbols)}
              </span>
              <div className="sb-pills" role="group" aria-labelledby="an-scan-syms">
                {symbolOptions.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    aria-pressed={draft.symbols.includes(sym)}
                    onClick={() =>
                      setDraft((cur) => ({
                        ...cur,
                        symbols: cur.symbols.includes(sym)
                          ? cur.symbols.filter((s) => s !== sym)
                          : [...cur.symbols, sym],
                      }))
                    }
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <div className="sb-row-actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="sb-btn sb-btn-primary sb-btn-sm"
                disabled={!draft.title.trim() || busy !== null}
                onClick={() => void save()}
              >
                {busy === 'scan' && (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                )}
                {x(IM.invest_scan_save)}
              </button>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                onClick={() => setOpen(false)}
              >
                {x(IM.invest_thesis_cancel)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Same rule as the Overview feed — hidden subscription-only
          sources stay named and one tap reveals them. */}
      <NewsPaywallChip
        hiddenCount={newsByTheme.hiddenCount}
        hiddenSources={newsByTheme.hiddenSources}
        showPaywalled={showPaywalled}
        onToggle={togglePaywalled}
      />

      {state.scanItems.length === 0 ? (
        <div className="sb-empty">{x(IM.invest_scan_empty)}</div>
      ) : (
        <div className="sb-scan-grid">
          {sorted.map((item) => {
            const stale = Date.now() - Date.parse(item.lastReviewedAt) > STALE_MS
            const when = relTimeLabel(item.lastReviewedAt, x)
            const itemNews = newsByTheme.map.get(item.title.trim().slice(0, 120)) ?? []
            return (
              <article key={item.id} className="sb-scan">
                <header className="sb-goal-head">
                  <span className="sb-scan-chips">
                    <span className={`sb-pill ${SCAN_DIR_PILL[item.direction]}`}>
                      {x(IM[SCAN_DIR_LABEL[item.direction]])}
                    </span>
                    <span className="sb-pill sb-pill-draft">
                      {x(IM[SCAN_THEME_LABEL[item.theme]])}
                    </span>
                  </span>
                  {stale && (
                    <span className="sb-pill sb-pill-warn">
                      <CircleAlert size={12} aria-hidden="true" />
                      {x(IM.invest_scan_stale)}
                    </span>
                  )}
                </header>
                <strong className="sb-scan-title">{item.title}</strong>
                {item.note && <p className="sb-goal-detail">{item.note}</p>}
                <div className="sb-scan-syms">
                  {item.symbols.length === 0 ? (
                    <span className="sb-scan-sym sb-scan-all">{x(IM.invest_scan_all_book)}</span>
                  ) : (
                    item.symbols.map((s) => (
                      <span key={s} className="sb-scan-sym">
                        {s}
                      </span>
                    ))
                  )}
                </div>
                {itemNews.length > 0 && (
                  <div className="sb-scan-news">
                    <p className="sb-scan-news-head">{x(IM.invest_scan_news_head)}</p>
                    <ul className="sb-scan-news-list">
                      {itemNews.slice(0, 3).map((n) => (
                        <li key={n.id}>
                          <a href={n.url} target="_blank" rel="noopener noreferrer">
                            {n.title}
                          </a>
                          <span className="sb-scan-news-meta">
                            {n.source}
                            {n.symbol && <span className="sb-scan-sym">{n.symbol}</span>}
                            {n.publishedAt && <span>{relTimeLabel(n.publishedAt, x)}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <footer className="sb-thesis-foot">
                  <span className="sb-thesis-when">
                    {when && fill(x(IM.invest_scan_reviewed), { when })}
                  </span>
                  <span className="sb-row-actions">
                    {stale && (
                      <button
                        type="button"
                        className="sb-btn sb-btn-secondary sb-btn-sm"
                        disabled={busy !== null}
                        onClick={() => {
                          setBusy(item.id)
                          void markScanItemReviewed(item.id)
                            .then(() => refresh())
                            .finally(() => setBusy(null))
                        }}
                      >
                        {x(IM.invest_scan_mark)}
                      </button>
                    )}
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      onClick={() => {
                        setDraft({
                          id: item.id,
                          theme: item.theme,
                          direction: item.direction,
                          title: item.title,
                          note: item.note,
                          symbols: item.symbols,
                        })
                        setOpen(true)
                        /* The form opens at this section's top — page top
                           may sit above it on a long Analysis page. */
                        requestAnimationFrame(() =>
                          sectionRef.current?.scrollIntoView({ block: 'start' }),
                        )
                      }}
                    >
                      {x(IM.invest_goal_edit)}
                    </button>
                    <button
                      type="button"
                      className={`sb-btn sb-btn-danger sb-btn-sm${confirmDelete === item.id ? ' sb-armed' : ''}`}
                      disabled={busy !== null}
                      onClick={() => {
                        if (confirmDelete === item.id) void remove(item)
                        else setConfirmDelete(item.id)
                      }}
                    >
                      {confirmDelete === item.id
                        ? x(IM.invest_thesis_delete_confirm)
                        : x(IM.invest_goal_delete)}
                    </button>
                  </span>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
