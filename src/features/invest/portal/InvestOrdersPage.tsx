import './strategies.css'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Info, Loader2, Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  ASSET_CLASSES,
  type AssetClass,
  type InvestAccount,
  type InvestOrder,
  type OrderFill,
  type OrderMode,
  type OrderSide,
  type OrderStatus,
  type OrderType,
} from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { readOrderMode } from './investPrefs'
import {
  createOrder,
  executeOrder,
  importFill,
  setOrderStatus,
  updateQueuedOrder,
} from '@/features/invest/data/api'
import { sendInvestReaction } from '@/features/invest/data/chatApi'
import { TallyNote } from './TallyNote'
import { InfoHint } from './InfoHint'
import { useInvestHead } from './useInvestHead'
import { relTimeLabel } from './relTime'
import { fmtDay, fmtNum } from './strategyUi'
import { suggestionIcon } from './suggestionIcons'
import { fill as fillSlots } from '@/lib/format'
import {
  loadPendingSuggestions,
  resolveSuggestion,
  type AgentSuggestion,
} from '@/lib/agentQueue'

const cardClass = 'sb-card sb-card-pad'
const fieldClass = 'sb-input'
const labelClass = 'sb-flabel'
const btnClass = 'sb-btn sb-btn-primary'

const assetLabel: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const statusLabel: Record<OrderStatus, keyof typeof IM> = {
  draft: 'invest_status_draft',
  queued: 'invest_status_queued',
  executed: 'invest_status_executed',
  cancelled: 'invest_status_cancelled',
  failed: 'invest_status_failed',
  expired: 'invest_status_expired',
}

/** Orders tab — order log, manual order entry, execute/cancel actions. */
export function InvestOrdersPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_orders, IM.invest_seo_desc_orders)
  /* Prices print in the symbol's own listing currency — an order on a
     USD-quoted name must not wear a CAD format. */
  const fmtFor = useMemo(
    () => (cur: string) =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: cur,
      }),
    [lang],
  )
  /* Held → snapshot → book default: the order row itself stores no
     currency, so the listing's own rows carry it. */
  const currencyFor = useMemo(() => {
    const pos = new Map(state.positions.map((p) => [`${p.assetClass}:${p.symbol.toUpperCase()}`, p.currency]))
    const snap = new Map(state.snapshots.map((s) => [`${s.assetClass}:${s.symbol.toUpperCase()}`, s.currency]))
    const book = (state.accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD').toUpperCase()
    return (o: InvestOrder) =>
      pos.get(`${o.assetClass}:${o.symbol.toUpperCase()}`) ??
      snap.get(`${o.assetClass}:${o.symbol.toUpperCase()}`) ??
      book
  }, [state.positions, state.snapshots, state.accounts])
  const accountName = useMemo(
    () => new Map(state.accounts.map((a) => [a.id, a.name])),
    [state.accounts],
  )
  const orderById = useMemo(
    () => new Map(state.orders.map((o) => [o.id, o])),
    [state.orders],
  )
  /* Fills arrive newest-first from the loader; per-order lists flip to
     oldest-first so a partial order reads as it happened. */
  const fillsByOrder = useMemo(() => {
    const m = new Map<string, OrderFill[]>()
    for (const f of state.fills) {
      const arr = m.get(f.orderId) ?? []
      arr.push(f)
      m.set(f.orderId, arr)
    }
    for (const arr of m.values()) arr.reverse()
    return m
  }, [state.fills])
  /* Realized P&L — sell fills carry the position's avg cost at the moment
     they landed; backfilled rows (avg_cost_at_fill null) are history, not
     computable gains. Currency groups keep USD sales out of a CAD total. */
  const { closedTrades, realizedByCcy } = useMemo(() => {
    const trades: {
      id: string
      symbol: string
      quantity: number
      avgCost: number
      price: number
      realized: number
      date: string
      fmt: Intl.NumberFormat
    }[] = []
    const totals: Record<string, number> = {}
    for (const f of state.fills) {
      const o = orderById.get(f.orderId)
      if (!o || o.side !== 'sell' || f.avgCostAtFill === null) continue
      const ccy = currencyFor(o)
      const realized = (f.price - f.avgCostAtFill) * f.quantity
      totals[ccy] = (totals[ccy] ?? 0) + realized
      trades.push({
        id: f.id,
        symbol: o.symbol,
        quantity: f.quantity,
        avgCost: f.avgCostAtFill,
        price: f.price,
        realized,
        date: f.filledAt.slice(0, 10),
        fmt: fmtFor(ccy),
      })
    }
    return { closedTrades: trades, realizedByCcy: totals }
  }, [state.fills, orderById, currencyFor, fmtFor])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [tallyLine, setTallyLine] = useState<string | null>(null)
  const [pending, setPending] = useState<AgentSuggestion[]>([])
  const [pendingBusy, setPendingBusy] = useState<string | null>(null)

  /* 'order_cross' rows — the limit-order sweep files one when a queued
     order's limit is crossed. Accepting executes AT the limit the user
     already committed to; anything else stays queued as it was. */
  useEffect(() => {
    loadPendingSuggestions('invest')
      .then((rows) => setPending(rows.filter((r) => r.kind === 'order_cross')))
      .catch(() => {})
  }, [])

  const acceptCross = async (s: AgentSuggestion) => {
    const p = (s.payload ?? {}) as Record<string, unknown>
    const orderId = typeof p.order_id === 'string' ? p.order_id : ''
    const limit = typeof p.limit_price === 'number' ? p.limit_price : null
    const order = state.orders.find((o) => o.id === orderId)
    if (!order || limit === null || pendingBusy) return
    setPendingBusy(s.id)
    try {
      await executeOrder(orderId, limit)
      void resolveSuggestion(s.id, 'accepted', 'executed').catch(() => {})
      setPending((cur) => cur.filter((r) => r.id !== s.id))
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setPendingBusy(null)
    }
  }

  const dismissPending = async (s: AgentSuggestion) => {
    setPending((cur) => cur.filter((r) => r.id !== s.id))
    await resolveSuggestion(s.id, 'dismissed', 'dismissed').catch(() => {})
  }

  /* Returns whether the write landed — the form only clears on success;
     a failed insert keeping its values beats retyping. */
  const run = async (fn: () => Promise<void>): Promise<boolean> => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await refresh()
      return true
    } catch {
      setError(x(IM.invest_error_generic))
      return false
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="sb sb-page">
      <div className="sb-head-row">
        <h1>
          {x(IM.invest_orders_title)}
          <InfoHint
            label={x(IM.invest_hint_order_status_aria)}
            text={x(IM.invest_hint_order_status)}
          />
        </h1>
      </div>
      {error && (
        <p role="alert" className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {error}
        </p>
      )}

      <div className="sb-note">
        <Info size={16} strokeWidth={1.7} aria-hidden="true" style={{ color: 'var(--sb-muted)' }} />
        <span>{x(IM.invest_live_note)}</span>
      </div>

      {pending.length > 0 && (
        <div className="sb-mini-list" style={{ marginBottom: 16 }}>
          <p className="sb-caption" style={{ marginTop: 0 }}>
            {x(IM.invest_suggest_hint)}
          </p>
          {pending.map((s) => {
            const KindIcon = suggestionIcon(s.kind)
            const p = (s.payload ?? {}) as Record<string, unknown>
            const title =
              lang === 'fr' && typeof p.title_fr === 'string' ? p.title_fr : s.title
            const detail =
              (lang === 'fr' && typeof p.detail_fr === 'string'
                ? p.detail_fr
                : typeof p.detail_en === 'string'
                  ? p.detail_en
                  : null) ?? null
            const orderId = typeof p.order_id === 'string' ? p.order_id : ''
            const order = state.orders.find((o) => o.id === orderId)
            /* Stale = the order already moved on — executed elsewhere,
               cancelled, or deleted between the sweep and the click. */
            const stale = !order || (order.status !== 'queued' && order.status !== 'draft')
            const limit = typeof p.limit_price === 'number' ? p.limit_price : null
            const cur = typeof p.currency === 'string' ? p.currency : order ? currencyFor(order) : 'CAD'
            return (
              <div
                key={s.id}
                className="sb-notify-row"
                style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
              >
                <KindIcon size={15} className="sb-notify-ico" aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>{title}</strong>
                  {detail && <span className="sb-notify-hint">{detail}</span>}
                  {stale && (
                    <span className="sb-notify-hint">{x(IM.invest_cross_stale)}</span>
                  )}
                </span>
                <span className="sb-row-actions" style={{ flexShrink: 0 }}>
                  {!stale && limit !== null && (
                    <button
                      type="button"
                      className="sb-btn sb-btn-primary sb-btn-sm"
                      disabled={pendingBusy !== null}
                      onClick={() => void acceptCross(s)}
                    >
                      {pendingBusy === s.id && (
                        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      )}
                      {fillSlots(x(IM.invest_cross_execute), {
                        price: fmtFor(cur).format(limit),
                      })}
                    </button>
                  )}
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    disabled={pendingBusy !== null}
                    onClick={() => void dismissPending(s)}
                  >
                    {x(IM.invest_dismiss)}
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {state.accounts.length > 0 && (
        <section className={cardClass} style={{ marginBottom: 16 }}>
          <OrderForm
            busy={busy}
            accounts={state.accounts}
            onCreate={(input) =>
              run(async () => {
                await createOrder(input)
                /* Tally notices — best-effort: a throttled or failed
                   reaction returns null and never disturbs the save. Her
                   line also lands in the chat thread. */
                sendInvestReaction(
                  { type: 'order_queued', symbol: input.symbol, side: input.side, quantity: input.quantity },
                  lang,
                  setTallyLine,
                )
                  .then((r) => {
                    if (r.reply) setTallyLine(r.reply)
                  })
                  .catch(() => {})
              })
            }
          />
          {tallyLine && <TallyNote line={tallyLine} />}
        </section>
      )}

      <section className={cardClass}>
        {state.orders.length === 0 ? (
          <p className="sb-empty" style={{ marginTop: 0 }}>{x(IM.invest_orders_empty)}</p>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>{x(IM.invest_field_symbol)}</th>
                  <th>{x(IM.invest_order_side)}</th>
                  <th className="num">{x(IM.invest_field_quantity)}</th>
                  <th>{x(IM.invest_order_type)}</th>
                  <th>{x(IM.invest_order_status)}</th>
                  <th className="num">{x(IM.invest_order_fill_price)}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    fills={fillsByOrder.get(o.id) ?? []}
                    busy={busy}
                    fmt={fmtFor(currencyFor(o))}
                    account={
                      state.accounts.length > 1
                        ? (accountName.get(o.accountId) ?? null)
                        : null
                    }
                    onExecute={(fill, qty, at) =>
                      run(async () => {
                        await executeOrder(o.id, fill, qty, at)
                        sendInvestReaction(
                          { type: 'fill_recorded', symbol: o.symbol, quantity: qty ?? o.quantity },
                          lang,
                          setTallyLine,
                        )
                          .then((r) => {
                            if (r.reply) setTallyLine(r.reply)
                          })
                          .catch(() => {})
                      })
                    }
                    onEdit={(input) => run(() => updateQueuedOrder(o.id, input))}
                    onCancel={() => run(() => setOrderStatus(o.id, 'cancelled'))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {closedTrades.length > 0 && (
        <section className={cardClass} style={{ marginTop: 16 }}>
          <h2 className="sb-h2">
            {x(IM.invest_closed_title)}
            <InfoHint
              label={x(IM.invest_hint_closed_aria)}
              text={x(IM.invest_hint_closed)}
            />
          </h2>
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>{x(IM.invest_field_symbol)}</th>
                  <th className="num">{x(IM.invest_field_quantity)}</th>
                  <th className="num">{x(IM.invest_closed_avg_cost)}</th>
                  <th className="num">{x(IM.invest_closed_sold_at)}</th>
                  <th className="num">{x(IM.invest_closed_realized)}</th>
                  <th>{x(IM.invest_closed_date)}</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t) => (
                  <tr key={t.id}>
                    <td><span className="strong">{t.symbol}</span></td>
                    <td className="num">{fmtNum(lang, t.quantity, { max: 4 })}</td>
                    <td className="num">{t.fmt.format(t.avgCost)}</td>
                    <td className="num">{t.fmt.format(t.price)}</td>
                    <td
                      className="num"
                      style={{ color: t.realized >= 0 ? 'var(--sb-ok)' : 'var(--sb-danger)' }}
                    >
                      {t.realized >= 0 ? '+' : '−'}{t.fmt.format(Math.abs(t.realized))}
                    </td>
                    <td className="dim">
                      {fmtDay(lang, t.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {Object.entries(realizedByCcy).map(([ccy, total]) => (
                  <tr key={ccy}>
                    <td colSpan={4} className="dim">
                      {fillSlots(x(IM.invest_closed_total), { ccy })}
                    </td>
                    <td
                      className="num strong"
                      style={{ color: total >= 0 ? 'var(--sb-ok)' : 'var(--sb-danger)' }}
                    >
                      {total >= 0 ? '+' : '−'}{fmtFor(ccy).format(Math.abs(total))}
                    </td>
                    <td />
                  </tr>
                ))}
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {state.accounts.length > 0 && (
        <ImportFills
          accounts={state.accounts}
          busy={busy}
          onImport={(rows) =>
            run(async () => {
              for (const r of rows) await importFill(r)
            })
          }
        />
      )}
    </div>
  )
}

function OrderRow({
  order: o,
  fills,
  busy,
  fmt,
  account,
  onExecute,
  onEdit,
  onCancel,
}: {
  order: InvestOrder
  /** Fills that already landed against this order, oldest first. */
  fills: OrderFill[]
  busy: boolean
  fmt: Intl.NumberFormat
  /** Account label — shown only when the book has more than one. */
  account: string | null
  onExecute: (fillPrice?: number, qty?: number, at?: string) => Promise<unknown>
  onEdit: (input: { quantity: number; limitPrice: number | null; note?: string }) => Promise<unknown>
  onCancel: () => Promise<unknown>
}) {
  const { x, lang } = useI18n()
  const [open, setOpen] = useState<'fill' | 'edit' | 'fills' | null>(null)
  const [fillQty, setFillQty] = useState('')
  const [fillPrice, setFillPrice] = useState('')
  const [fillAt, setFillAt] = useState('')
  const [editQty, setEditQty] = useState(String(o.quantity))
  const [editLimit, setEditLimit] = useState(o.limitPrice !== null ? String(o.limitPrice) : '')
  const [editNote, setEditNote] = useState(o.note ?? '')
  const actionable = o.status === 'queued' || o.status === 'draft'

  const filledQty = fills.reduce((s, f) => s + f.quantity, 0)
  const remaining = o.quantity - filledQty
  const qtyNum = Number(fillQty)
  const priceNum = Number(fillPrice)
  /* Paper: a blank price fills at the current mark. Live: required. */
  const priceOk = o.mode === 'live' ? priceNum > 0 : fillPrice === '' || priceNum > 0
  const fillValid = (fillQty === '' || (qtyNum > 0 && qtyNum <= remaining)) && priceOk

  const submitFill = () => {
    void onExecute(
      fillPrice === '' ? undefined : priceNum,
      fillQty === '' ? undefined : qtyNum,
      fillAt === '' ? undefined : fillAt,
    ).then(() => {
      setFillQty('')
      setFillPrice('')
      setFillAt('')
      setOpen(null)
    })
  }

  const submitEdit = () => {
    const q = Number(editQty)
    if (!Number.isFinite(q) || q <= 0) return
    const lim = editLimit === '' ? null : Number(editLimit)
    void onEdit({ quantity: q, limitPrice: lim, note: editNote }).then(() =>
      setOpen(null),
    )
  }

  const toggle = (v: 'fill' | 'edit' | 'fills') => setOpen((cur) => (cur === v ? null : v))
  const cols = 7

  return (
    <>
      <tr>
        <td>
          <span className="strong">{o.symbol}</span>
          {account && (
            <span className="dim" style={{ marginLeft: 6 }}>
              {account}
            </span>
          )}
          <span className="dim" style={{ marginLeft: 6 }}>
            {x(o.mode === 'paper' ? IM.invest_mode_paper : IM.invest_mode_live)}
          </span>
        </td>
        <td>{x(o.side === 'buy' ? IM.invest_order_buy : IM.invest_order_sell)}</td>
        <td className="num">
          {fmtNum(lang, o.quantity, { max: 4 })}
          {filledQty > 0 && remaining > 0 && (
            <p className="dim" style={{ margin: '2px 0 0' }}>
              {fillSlots(x(IM.invest_fills_progress), {
                filled: fmtNum(lang, filledQty, { max: 4 }),
                total: fmtNum(lang, o.quantity, { max: 4 }),
              })}
            </p>
          )}
        </td>
        <td>
          {x(o.orderType === 'market' ? IM.invest_order_market : IM.invest_order_limit)}
          {o.limitPrice !== null && ` · ${fmt.format(o.limitPrice)}`}
        </td>
        <td>
          <StatusChip status={o.status} />
          {(o.status === 'draft' || o.status === 'expired') && relTimeLabel(o.createdAt, x) && (
            <p className="dim" style={{ margin: '2px 0 0' }}>
              {fillSlots(x(IM.invest_order_proposed), { ago: relTimeLabel(o.createdAt, x) ?? '' })}
            </p>
          )}
          {o.error && (
            <p className="dim" style={{ margin: '2px 0 0', color: 'var(--sb-danger)', maxWidth: 180 }}>
              {o.error}
            </p>
          )}
        </td>
        <td className="num">
          {o.executedPrice !== null ? fmt.format(o.executedPrice) : '—'}
        </td>
        <td>
          <span className="sb-row-actions">
            {fills.length > 0 && (
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                aria-expanded={open === 'fills'}
                onClick={() => toggle('fills')}
              >
                {fillSlots(x(IM.invest_fills_count), { count: fills.length })}
              </button>
            )}
            {actionable && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="sb-btn sb-btn-primary sb-btn-sm"
                  aria-expanded={open === 'fill'}
                  onClick={() => toggle('fill')}
                >
                  {x(IM.invest_mark_executed)}
                </button>
                {o.status === 'queued' && (
                  <button
                    type="button"
                    disabled={busy}
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    aria-expanded={open === 'edit'}
                    onClick={() => toggle('edit')}
                  >
                    {x(IM.invest_edit)}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onCancel()}
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                >
                  {x(IM.invest_cancel_order)}
                </button>
              </>
            )}
          </span>
        </td>
      </tr>

      {open === 'fills' && fills.length > 0 && (
        <tr className="sb-ord-detail">
          <td colSpan={cols}>
            <ul className="sb-fill-list">
              {fills.map((f) => (
                <li key={f.id}>
                  <span className="strong">{fmtNum(lang, f.quantity, { max: 4 })}</span>
                  {' @ '}
                  {fmt.format(f.price)}
                  <span className="dim">
                    {' '}
                    ·{' '}
                    {fmtDay(lang, f.filledAt.slice(0, 10))}
                  </span>
                  {f.note && <span className="dim"> · {f.note}</span>}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}

      {open === 'fill' && actionable && (
        <tr className="sb-ord-detail">
          <td colSpan={cols}>
            <div className="sb-ord-fill">
              <div className="sb-field">
                <label className={labelClass} htmlFor={`fill-qty-${o.id}`}>{x(IM.invest_field_quantity)}</label>
                <input
                  id={`fill-qty-${o.id}`}
                  type="number"
                  min="0"
                  max={remaining}
                  step="any"
                  value={fillQty}
                  onChange={(e) => setFillQty(e.target.value)}
                  placeholder={String(remaining)}
                  className="sb-input sb-input-sm"
                />
              </div>
              <div className="sb-field">
                <label className={labelClass} htmlFor={`fill-price-${o.id}`}>{x(IM.invest_order_fill_price)}</label>
                <input
                  id={`fill-price-${o.id}`}
                  type="number"
                  min="0"
                  step="any"
                  value={fillPrice}
                  onChange={(e) => setFillPrice(e.target.value)}
                  placeholder={
                    o.mode === 'paper' ? x(IM.invest_fill_price_mark_hint) : undefined
                  }
                  className="sb-input sb-input-sm"
                />
              </div>
              <div className="sb-field">
                <label className={labelClass} htmlFor={`fill-date-${o.id}`}>{x(IM.invest_fill_date)}</label>
                <input
                  id={`fill-date-${o.id}`}
                  type="date"
                  value={fillAt}
                  onChange={(e) => setFillAt(e.target.value)}
                  className="sb-input sb-input-sm"
                />
              </div>
              <button
                type="button"
                disabled={busy || !fillValid}
                className="sb-btn sb-btn-primary sb-btn-sm"
                onClick={submitFill}
              >
                {fillQty !== '' && qtyNum < remaining
                  ? x(IM.invest_fill_partial)
                  : x(IM.invest_fill_record)}
              </button>
            </div>
          </td>
        </tr>
      )}

      {open === 'edit' && o.status === 'queued' && (
        <tr className="sb-ord-detail">
          <td colSpan={cols}>
            <div className="sb-ord-fill">
              <div className="sb-field">
                <label className={labelClass} htmlFor={`edit-qty-${o.id}`}>{x(IM.invest_field_quantity)}</label>
                <input
                  id={`edit-qty-${o.id}`}
                  type="number"
                  min="0"
                  step="any"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="sb-input sb-input-sm"
                />
              </div>
              <div className="sb-field">
                <label className={labelClass} htmlFor={`edit-limit-${o.id}`}>{x(IM.invest_order_limit_price)}</label>
                <input
                  id={`edit-limit-${o.id}`}
                  type="number"
                  min="0"
                  step="any"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="sb-input sb-input-sm"
                />
              </div>
              <div className="sb-field" style={{ flex: 1, minWidth: 160 }}>
                <label className={labelClass} htmlFor={`edit-note-${o.id}`}>{x(IM.invest_fill_note)}</label>
                <input
                  id={`edit-note-${o.id}`}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="sb-input sb-input-sm"
                />
              </div>
              <button
                type="button"
                disabled={busy || !(Number(editQty) > 0)}
                className="sb-btn sb-btn-primary sb-btn-sm"
                onClick={submitEdit}
              >
                {x(IM.invest_save)}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/** Pastes a block of external fills — `symbol, side, qty, price, date` per
    line — and imports them oldest-first through the bot's fill path. */
function ImportFills({
  accounts,
  busy,
  onImport,
}: {
  accounts: InvestAccount[]
  busy: boolean
  onImport: (rows: {
    accountId: string
    assetClass: AssetClass
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    filledAt: string
    applyBook: boolean
  }[]) => Promise<unknown>
}) {
  const { x } = useI18n()
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [text, setText] = useState('')
  const [applyBook, setApplyBook] = useState(true)
  const [parseErrors, setParseErrors] = useState<string[]>([])

  const effectiveAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : (accounts[0]?.id ?? '')

  const parse = (): { rows: Parameters<typeof onImport>[0]; errors: string[] } => {
    const rows: Parameters<typeof onImport>[0] = []
    const errors: string[] = []
    text.split('\n').forEach((line, i) => {
      const t = line.trim()
      if (!t || t.startsWith('#')) return
      const parts = t.split(',').map((p) => p.trim())
      const [symbol, side, qty, price, date] = parts
      const bad = !symbol ||
        (side !== 'buy' && side !== 'sell') ||
        !(Number(qty) > 0) ||
        !(Number(price) > 0) ||
        !date ||
        Number.isNaN(Date.parse(date))
      if (bad) {
        errors.push(fillSlots(x(IM.invest_import_bad_line), { line: i + 1 }))
        return
      }
      rows.push({
        accountId: effectiveAccountId,
        assetClass: 'equity',
        symbol: symbol.toUpperCase(),
        side,
        quantity: Number(qty),
        price: Number(price),
        filledAt: date,
        applyBook,
      })
    })
    return { rows, errors }
  }

  const submit = () => {
    const { rows, errors } = parse()
    setParseErrors(errors)
    if (rows.length === 0) return
    void onImport(rows).then((ok) => {
      if (ok !== false) {
        setText('')
        setParseErrors([])
      }
    })
  }

  if (!open) {
    return (
      <p style={{ marginTop: 16 }}>
        <button
          type="button"
          className="sb-btn sb-btn-secondary"
          onClick={() => setOpen(true)}
        >
          {x(IM.invest_import_open)}
        </button>
      </p>
    )
  }

  return (
    <section className={cardClass} style={{ marginTop: 16 }}>
      <h2 className="sb-h2">
        {x(IM.invest_import_title)}
        <InfoHint
          label={x(IM.invest_hint_import_aria)}
          text={x(IM.invest_hint_import)}
        />
      </h2>
      <p className="sb-helper">{x(IM.invest_import_help)}</p>
      <div className="sb-form-grid">
        <div className="sb-field">
          <label className={labelClass} htmlFor="inv-import-acct">{x(IM.invest_accounts_title)}</label>
          <select
            id="inv-import-acct"
            value={effectiveAccountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={fieldClass}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
          <label className={labelClass} htmlFor="inv-import-rows">{x(IM.invest_import_rows)}</label>
          <textarea
            id="inv-import-rows"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={fieldClass}
            rows={5}
            placeholder={x(IM.invest_import_placeholder)}
          />
        </div>
        <label className="sb-check" style={{ gridColumn: '1 / -1' }}>
          <input
            type="checkbox"
            checked={applyBook}
            onChange={(e) => setApplyBook(e.target.checked)}
          />
          <span>{x(IM.invest_import_apply_book)}</span>
        </label>
      </div>
      {parseErrors.length > 0 && (
        <ul className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {parseErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="sb-form-actions">
        <button
          type="button"
          className={btnClass}
          disabled={busy || !text.trim()}
          onClick={submit}
        >
          {x(IM.invest_import_run)}
        </button>
        <button
          type="button"
          className="sb-btn sb-btn-secondary"
          onClick={() => setOpen(false)}
        >
          {x(IM.invest_dismiss)}
        </button>
      </div>
    </section>
  )
}

function StatusChip({ status }: { status: OrderStatus }) {
  const { x } = useI18n()
  const tone =
    status === 'executed'
      ? 'sb-pill-ok'
      : status === 'failed' || status === 'cancelled' || status === 'expired'
        ? 'sb-pill-fail'
        : 'sb-pill-warn'
  return <span className={`sb-pill ${tone}`}>{x(IM[statusLabel[status]])}</span>
}

function OrderForm({
  busy,
  accounts,
  onCreate,
}: {
  busy: boolean
  accounts: { id: string; name: string }[]
  /** Resolves true when the order row landed — the form keeps its values
     on a failed insert so the holder isn't retyping into the void. */
  onCreate: (input: {
    accountId: string
    assetClass: AssetClass
    symbol: string
    side: OrderSide
    quantity: number
    orderType: OrderType
    limitPrice?: number | null
    mode: OrderMode
  }) => Promise<boolean>
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<OrderSide>('buy')
  const [quantity, setQuantity] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [mode, setMode] = useState<OrderMode>(readOrderMode)

  /* The selection is captured state — if the account row goes away (deleted
     elsewhere) fall back to the first rather than submitting a stale id. */
  const effectiveAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : (accounts[0]?.id ?? '')
  const qtyNum = Number(quantity)
  const limitNum = Number(limitPrice)
  const valid =
    !!effectiveAccountId &&
    !!symbol.trim() &&
    qtyNum > 0 &&
    Number.isFinite(qtyNum) &&
    (orderType === 'market' || (limitNum > 0 && Number.isFinite(limitNum)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    void onCreate({
      accountId: effectiveAccountId,
      assetClass,
      symbol: symbol.trim(),
      side,
      quantity: qtyNum,
      orderType,
      limitPrice: orderType === 'limit' ? limitNum : null,
      mode,
    }).then((ok) => {
      if (!ok) return
      setSymbol('')
      setQuantity('')
      setLimitPrice('')
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="sb-form-grid">
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-acc">
          {x(IM.invest_accounts_title)}
        </label>
        <select
          id="inv-ord-acc"
          value={effectiveAccountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={fieldClass}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-class">
          {x(IM.invest_field_asset_class)}
        </label>
        <select
          id="inv-ord-class"
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value as AssetClass)}
          className={fieldClass}
        >
          {ASSET_CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {x(IM[assetLabel[cls]])}
            </option>
          ))}
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-symbol">
          {x(IM.invest_field_symbol)}
        </label>
        <input
          id="inv-ord-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-side">
          {x(IM.invest_order_side)}
        </label>
        <select
          id="inv-ord-side"
          value={side}
          onChange={(e) => setSide(e.target.value as OrderSide)}
          className={fieldClass}
        >
          <option value="buy">{x(IM.invest_order_buy)}</option>
          <option value="sell">{x(IM.invest_order_sell)}</option>
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-qty">
          {x(IM.invest_field_quantity)}
        </label>
        <input
          id="inv-ord-qty"
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-type">
          {x(IM.invest_order_type)}
        </label>
        <select
          id="inv-ord-type"
          value={orderType}
          onChange={(e) => setOrderType(e.target.value as OrderType)}
          className={fieldClass}
        >
          <option value="market">{x(IM.invest_order_market)}</option>
          <option value="limit">{x(IM.invest_order_limit)}</option>
        </select>
      </div>
      {orderType === 'limit' && (
        <div className="sb-field">
          <label className={labelClass} htmlFor="inv-ord-limit">
            {x(IM.invest_order_limit_price)}
          </label>
          <input
            id="inv-ord-limit"
            type="number"
            min="0"
            step="any"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
      )}
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-ord-mode">
          {x(IM.invest_order_mode_label)}
          <InfoHint
            label={x(IM.invest_hint_order_mode_aria)}
            text={x(IM.invest_hint_order_mode)}
          />
        </label>
        <select
          id="inv-ord-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as OrderMode)}
          className={fieldClass}
        >
          <option value="paper">{x(IM.invest_mode_paper)}</option>
          <option value="live">{x(IM.invest_mode_live)}</option>
        </select>
      </div>
      <div className="sb-form-actions">
        <button
          type="submit"
          disabled={busy || !valid}
          className={btnClass}
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          {x(IM.invest_new_order)}
        </button>
      </div>
      </div>
    </form>
  )
}
