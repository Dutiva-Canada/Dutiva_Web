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

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const fieldClass =
  'h-[38px] w-full rounded-[9px] border border-border bg-bg px-[11px] text-[13px] text-text outline-none focus:border-navy'
const labelClass = 'mb-[4px] block text-[11.5px] font-semibold text-text-2'
const btnClass =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border-none bg-navy px-[14px] text-[13px] font-semibold text-white disabled:opacity-50'

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
}

/** Orders tab — order log, manual order entry, execute/cancel actions. */
export function InvestOrdersPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
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
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
        {x(IM.invest_orders_title)}
      </h1>
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}

      <div className="flex items-start gap-[8px] rounded-[12px] border border-border bg-surface px-[14px] py-[11px] text-[12px] leading-normal text-text-muted">
        <Info size={15} strokeWidth={1.7} className="mt-px shrink-0" aria-hidden="true" />
        <span>{x(IM.invest_live_note)}</span>
      </div>

      {state.accounts.length > 0 && (
        <section className={cardClass}>
          <OrderForm
            busy={busy}
            accounts={state.accounts}
            onCreate={(input) => run(() => createOrder(input))}
          />
        </section>
      )}

      <section className={cardClass}>
        {state.orders.length === 0 ? (
          <p className="m-0 text-[12.5px] text-text-muted">{x(IM.invest_orders_empty)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
                  <th className="py-[8px] pr-[12px]">{x(IM.invest_field_symbol)}</th>
                  <th className="py-[8px] pr-[12px]">{x(IM.invest_order_side)}</th>
                  <th className="py-[8px] pr-[12px] text-right">{x(IM.invest_field_quantity)}</th>
                  <th className="py-[8px] pr-[12px]">{x(IM.invest_order_type)}</th>
                  <th className="py-[8px] pr-[12px]">{x(IM.invest_order_status)}</th>
                  <th className="py-[8px] pr-[12px] text-right">{x(IM.invest_order_fill_price)}</th>
                  <th className="py-[8px]" />
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
    <tr className="border-b border-border/60">
      <td className="py-[9px] pr-[12px]">
        <span className="font-semibold text-text">{o.symbol}</span>
        <span className="ml-[6px] text-[11px] text-text-muted">
          {x(o.mode === 'paper' ? IM.invest_mode_paper : IM.invest_mode_live)}
        </span>
      </td>
      <td className="py-[9px] pr-[12px] text-text-2">
        {x(o.side === 'buy' ? IM.invest_order_buy : IM.invest_order_sell)}
      </td>
      <td className="py-[9px] pr-[12px] text-right tabular-nums text-text-2">{o.quantity}</td>
      <td className="py-[9px] pr-[12px] text-text-2">
        {x(o.orderType === 'market' ? IM.invest_order_market : IM.invest_order_limit)}
        {o.limitPrice !== null && ` · ${fmt.format(o.limitPrice)}`}
      </td>
      <td className="py-[9px] pr-[12px]">
        <StatusChip status={o.status} />
        {o.error && <p className="m-0 mt-[2px] max-w-[180px] text-[10.5px] text-risk-fg">{o.error}</p>}
      </td>
      <td className="py-[9px] pr-[12px] text-right tabular-nums text-text-2">
        {o.executedPrice !== null ? fmt.format(o.executedPrice) : '—'}
      </td>
      <td className="py-[9px]">
        {actionable && (
          <span className="flex items-center justify-end gap-[6px]">
            {o.mode === 'live' && (
              <input
                type="number"
                min="0"
                step="any"
                value={fill}
                onChange={(e) => setFill(e.target.value)}
                placeholder={x(IM.invest_order_fill_price)}
                className="h-[38px] w-[90px] rounded-[7px] border border-border bg-bg px-[8px] text-[12px] text-text outline-none focus:border-navy"
              />
            )}
            <button
              type="button"
              disabled={busy || (o.mode === 'live' && !fill)}
              onClick={() => void onExecute(o.mode === 'live' ? Number(fill) : undefined)}
              className="min-h-[44px] cursor-pointer rounded-[7px] border-none bg-navy px-[12px] text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {x(IM.invest_mark_executed)}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCancel()}
              className="min-h-[44px] cursor-pointer rounded-[7px] border border-border bg-transparent px-[12px] text-[12px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50"
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
      ? 'bg-gold-bg text-gold-fg'
      : status === 'failed' || status === 'cancelled'
        ? 'bg-inset text-text-muted'
        : 'bg-surface text-text-2 border border-border'
  return (
    <span className={`inline-block rounded-full px-[8px] py-[2px] text-[10.5px] font-semibold ${tone}`}>
      {x(IM[statusLabel[status]])}
    </span>
  )
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
    <form onSubmit={submit} className="flex flex-wrap items-end gap-[10px]">
      <div className="min-w-[130px]">
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
      <div className="w-[120px]">
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
      <div className="w-[100px]">
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
      <div className="w-[90px]">
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
      <div className="w-[90px]">
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
      <div className="w-[110px]">
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
        <div className="w-[110px]">
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
      <div className="w-[100px]">
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
      <button type="submit" disabled={busy || !accountId || !symbol.trim() || !quantity} className={btnClass}>
        <Plus size={14} aria-hidden="true" />
        {x(IM.invest_new_order)}
      </button>
    </form>
  )
}
