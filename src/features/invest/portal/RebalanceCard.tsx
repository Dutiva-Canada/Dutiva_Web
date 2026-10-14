/**
 * Rebalance card (0223) — target weight per position vs. the marked
 * weight, drift in points, and a draft-order button that writes a
 * reviewable queued order to close the gap. The card drafts; it never
 * fills — execution stays on the Orders tab with the user.
 */
import { useMemo, useState } from 'react'
import { Scale } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { createOrder, setPositionTargetWeight } from '../data/api'
import type { FxTable } from '../data/fx'
import { convertFx } from '../data/fx'
import { readOrderMode } from './investPrefs'
import { fmtPct } from './strategyUi'
import type { InvestPosition, MarketSnapshot } from '../data/types'

interface Row {
  p: InvestPosition
  /** Marked value in the book currency — null when no usable quote. */
  bookValue: number | null
  /** Marked price in the book currency (for the draft's quantity math). */
  bookPx: number | null
  weight: number | null
  drift: number | null
}

/** Drift under a point is noise, not a signal to trade. */
const DRIFT_BAND = 1

export function RebalanceCard({
  positions,
  snapshots,
  accounts,
  cashTotal,
  bookCcy,
  fx,
  busy,
  run,
}: {
  positions: InvestPosition[]
  snapshots: MarketSnapshot[]
  accounts: { id: string; name: string }[]
  /** Accounts' cash converted to book currency — part of the pie the
      weights share. */
  cashTotal: number
  bookCcy: string
  fx: FxTable | null
  busy: boolean
  run: (fn: () => Promise<void>) => Promise<void>
}) {
  const { x, lang, L } = useI18n()
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const book = useMemo(() => {
    let invested = 0
    const vals = new Map<string, { bookValue: number | null; bookPx: number | null }>()
    for (const p of positions) {
      const snap = snapshots.find(
        (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
      )
      const pxNative = snap?.price ?? p.lastPrice ?? null
      const pxCur = snap?.currency ?? p.currency
      const bookPx =
        pxNative === null ? null : convertFx(pxNative, pxCur, bookCcy, fx)
      const bookValue = bookPx === null ? null : p.quantity * bookPx
      vals.set(p.id, { bookValue, bookPx })
      if (bookValue !== null) invested += bookValue
    }
    /* Same denominator rule as the donut beside it — an overdrawn cash
       line doesn't count toward the pie the weights share. */
    const total = invested + (cashTotal > 0 ? cashTotal : 0)
    return { total, vals }
  }, [positions, snapshots, bookCcy, cashTotal, fx])

  const rows = useMemo<Row[]>(
    () =>
      positions
        .map((p) => {
          const v = book.vals.get(p.id)
          const weight =
            v?.bookValue != null && book.total > 0 ? (v.bookValue / book.total) * 100 : null
          const drift =
            weight !== null && p.targetWeightPct !== null
              ? weight - p.targetWeightPct
              : null
          return { p, bookValue: v?.bookValue ?? null, bookPx: v?.bookPx ?? null, weight, drift }
        })
        /* Targeted rows first by |drift|; untargeted rows and ties fall
           to weight desc so the table still scans largest-to-smallest
           instead of insertion order. */
        .sort((a, b) => {
          const da = a.drift === null ? -1 : Math.abs(a.drift)
          const db = b.drift === null ? -1 : Math.abs(b.drift)
          return db - da || (b.weight ?? 0) - (a.weight ?? 0)
        }),
    [positions, book],
  )

  const targeted = rows.filter((r) => r.p.targetWeightPct !== null)
  /* Cells render the sign manually (+'/'−' chips) — fmtPct gets abs. */
  const pctFmt = (n: number) => fmtPct(lang, Math.abs(n), 1)

  const saveTarget = (p: InvestPosition) => {
    const n: number | null = draft.trim() === '' ? null : Number(draft)
    /* Invalid input on blur = cancel — returning early would leave the
       cell in edit mode with no focus and no way out but re-clicking. */
    if (draft.trim() !== '' && (n === null || !Number.isFinite(n) || n < 0 || n > 100)) {
      setEditId(null)
      return
    }
    setEditId(null)
    if (n === p.targetWeightPct) return
    void run(() => setPositionTargetWeight(p.id, n))
  }

  const draftOrder = (r: Row) => {
    if (r.drift === null || r.bookPx === null || r.bookPx <= 0 || book.total <= 0) return
    /* Value to move in book currency → shares at the same-currency mark.
       Round to 3 decimals — fractional books are the norm here. */
    const driftAbs = Math.abs(r.drift)
    const moveValue = (driftAbs / 100) * book.total
    const qty = Math.round((moveValue / r.bookPx) * 1000) / 1000
    if (!(qty > 0)) return
    const side = r.drift > 0 ? 'sell' : 'buy'
    void run(async () => {
      await createOrder({
        accountId: r.p.accountId,
        assetClass: r.p.assetClass,
        symbol: r.p.symbol,
        name: r.p.name,
        side,
        quantity: qty,
        orderType: 'market',
        mode: readOrderMode(),
        note: L(
          `Rebalance — ${r.p.symbol} ${pctFmt(driftAbs)} ${side === 'sell' ? 'over' : 'under'} target`,
          `Rééquilibrage — ${r.p.symbol} ${pctFmt(driftAbs)} ${side === 'sell' ? 'au-dessus de' : 'sous'} la cible`,
        ),
      })
    })
  }

  if (positions.length === 0) return null

  return (
    <section className="sb-card sb-card-pad">
      <h2 className="sb-h2" style={{ margin: 0 }}>
        <Scale size={15} strokeWidth={2} aria-hidden="true" /> {x(IM.invest_rebal_title)}
      </h2>
      <p className="sb-helper" style={{ margin: '4px 0 14px' }}>
        {x(IM.invest_rebal_note).replace('{ccy}', bookCcy)}
      </p>
      <div className="sb-table-wrap">
        <table className="sb-table sb-table-tight">
          <thead>
            <tr>
              <th>{x(IM.invest_field_symbol)}</th>
              <th className="num">{x(IM.invest_rebal_weight)}</th>
              <th className="num">{x(IM.invest_rebal_target)}</th>
              <th className="num">{x(IM.invest_rebal_drift)}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.p.id}>
                <td>
                  <span className="strong">{r.p.symbol}</span>
                  {accounts.length > 1 && (
                    <span className="dim" style={{ marginLeft: 6 }}>
                      {accounts.find((a) => a.id === r.p.accountId)?.name ?? ''}
                    </span>
                  )}
                </td>
                <td className="num">
                  {r.weight === null ? <span className="dim">—</span> : pctFmt(r.weight)}
                </td>
                <td className="num">
                  {editId === r.p.id ? (
                    <input
                      className="sb-input sb-rebal-input"
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      inputMode="decimal"
                      autoFocus
                      value={draft}
                      placeholder="—"
                      aria-label={`${x(IM.invest_rebal_target)} ${r.p.symbol}`}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => saveTarget(r.p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTarget(r.p)
                        if (e.key === 'Escape') setEditId(null)
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="sb-linklike"
                      onClick={() => {
                        setEditId(r.p.id)
                        setDraft(r.p.targetWeightPct === null ? '' : String(r.p.targetWeightPct))
                      }}
                    >
                      {r.p.targetWeightPct === null ? (
                        <span className="dim">{x(IM.invest_rebal_set)}</span>
                      ) : (
                        pctFmt(r.p.targetWeightPct)
                      )}
                    </button>
                  )}
                </td>
                <td className="num">
                  {r.drift === null ? (
                    <span className="dim">—</span>
                  ) : (
                    <span
                      style={{
                        color:
                          Math.abs(r.drift) <= DRIFT_BAND
                            ? 'var(--sb-muted)'
                            : r.drift > 0
                              ? 'var(--sb-danger)'
                              : 'var(--sb-ok)',
                      }}
                    >
                      {r.drift > 0 ? '+' : r.drift < 0 ? '−' : ''}
                      {pctFmt(r.drift)}
                    </span>
                  )}
                </td>
                <td className="num">
                  {r.drift !== null && Math.abs(r.drift) > DRIFT_BAND && r.bookPx !== null && (
                    <button
                      type="button"
                      disabled={busy}
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      onClick={() => draftOrder(r)}
                    >
                      {x(r.drift > 0 ? IM.invest_rebal_draft_sell : IM.invest_rebal_draft_buy)}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {targeted.length === 0 && (
        <p className="sb-helper" style={{ margin: '10px 0 0' }}>
          {x(IM.invest_rebal_empty)}
        </p>
      )}
      {targeted.length > 0 && (
        <p className="sb-helper" style={{ margin: '10px 0 0' }}>
          {x(IM.invest_rebal_review)}
        </p>
      )}
    </section>
  )
}
