import './strategies.css'
import { useMemo, useState, type FormEvent } from 'react'
import { Info, Loader2, Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  ASSET_CLASSES,
  type AssetClass,
  type InvestOrder,
  type OrderMode,
  type OrderSide,
  type OrderStatus,
  type OrderType,
} from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { createOrder, executeOrder, setOrderStatus } from '@/features/invest/data/api'
import { useInvestHead } from './useInvestHead'
import { relTimeLabel } from './relTime'
import { fill as fillSlots } from '@/lib/format'

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
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD',
      }),
    [lang],
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
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
        <h1>{x(IM.invest_orders_title)}</h1>
      </div>
      {error && (
        <p role="alert" className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {error}
        </p>
      )}

      <div className="sb-note">
        <Info size={16} strokeWidth={1.7} aria-hidden="true" />
        <span>{x(IM.invest_live_note)}</span>
      </div>

      {state.accounts.length > 0 && (
        <section className={cardClass} style={{ marginBottom: 16 }}>
          <OrderForm
            busy={busy}
            accounts={state.accounts}
            onCreate={(input) => run(() => createOrder(input))}
          />
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
                    busy={busy}
                    fmt={fmt}
                    onExecute={(fill) => run(() => executeOrder(o.id, fill))}
                    onCancel={() => run(() => setOrderStatus(o.id, 'cancelled'))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function OrderRow({
  order: o,
  busy,
  fmt,
  onExecute,
  onCancel,
}: {
  order: InvestOrder
  busy: boolean
  fmt: Intl.NumberFormat
  onExecute: (fillPrice?: number) => Promise<void>
  onCancel: () => Promise<void>
}) {
  const { x } = useI18n()
  const [fill, setFill] = useState('')
  const actionable = o.status === 'queued' || o.status === 'draft'

  return (
    <tr>
      <td>
        <span className="strong">{o.symbol}</span>
        <span className="dim" style={{ marginLeft: 6 }}>
          {x(o.mode === 'paper' ? IM.invest_mode_paper : IM.invest_mode_live)}
        </span>
      </td>
      <td>{x(o.side === 'buy' ? IM.invest_order_buy : IM.invest_order_sell)}</td>
      <td className="num">{o.quantity}</td>
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
        {actionable && (
          <span className="sb-row-actions">
            {o.mode === 'live' && (
              <input
                type="number"
                min="0"
                step="any"
                value={fill}
                onChange={(e) => setFill(e.target.value)}
                placeholder={x(IM.invest_order_fill_price)}
                className="sb-input sb-input-sm"
              />
            )}
            <button
              type="button"
              disabled={busy || (o.mode === 'live' && !fill)}
              onClick={() => void onExecute(o.mode === 'live' ? Number(fill) : undefined)}
              className="sb-btn sb-btn-primary sb-btn-sm"
            >
              {x(IM.invest_mark_executed)}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCancel()}
              className="sb-btn sb-btn-secondary sb-btn-sm"
            >
              {x(IM.invest_cancel_order)}
            </button>
          </span>
        )}
      </td>
    </tr>
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
  onCreate: (input: {
    accountId: string
    assetClass: AssetClass
    symbol: string
    side: OrderSide
    quantity: number
    orderType: OrderType
    limitPrice?: number | null
    mode: OrderMode
  }) => Promise<void>
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<OrderSide>('buy')
  const [quantity, setQuantity] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [mode, setMode] = useState<OrderMode>('paper')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!accountId || !symbol.trim() || !quantity) return
    void onCreate({
      accountId,
      assetClass,
      symbol: symbol.trim(),
      side,
      quantity: Number(quantity),
      orderType,
      limitPrice: orderType === 'limit' && limitPrice ? Number(limitPrice) : null,
      mode,
    }).then(() => {
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
          value={accountId}
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
          {x(IM.invest_account_kind)}
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
          disabled={busy || !accountId || !symbol.trim() || !quantity}
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
