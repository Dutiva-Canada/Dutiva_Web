import { useMemo, useState, type FormEvent } from 'react'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { ASSET_CLASSES, type AccountKind, type AssetClass } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  createAccount,
  createPosition,
  syncPrices,
  upsertSnapshot,
} from '@/features/invest/data/api'

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

const kindLabel: Record<AccountKind, keyof typeof IM> = {
  paper: 'invest_kind_paper',
  live: 'invest_kind_live',
  external: 'invest_kind_external',
}

/** Portfolios tab — accounts, positions, manual price updates. */
export function InvestPortfolioPage() {
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
  const [syncNote, setSyncNote] = useState<string | undefined>()

  const syncNow = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const r = await syncPrices()
      setSyncNote(
        r.failed.length > 0
          ? x(IM.invest_sync_partial).replace('{symbols}', r.failed.join(', '))
          : x(IM.invest_sync_done).replace('{count}', String(r.synced)),
      )
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  const snapshotPrice = (assetClass: AssetClass, symbol: string) =>
    state.snapshots.find((s) => s.assetClass === assetClass && s.symbol === symbol)?.price

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
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
          {x(IM.invest_tab_portfolios)}
        </h1>
        <button
          type="button"
          disabled={busy}
          onClick={() => void syncNow()}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border border-border bg-transparent px-[12px] text-[12.5px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={13} aria-hidden="true" />
          )}
          {busy ? x(IM.invest_syncing) : x(IM.invest_sync_prices)}
        </button>
      </div>
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}
      {syncNote && !error && (
        <p role="status" className="m-0 text-[12.5px] text-text-2">
          {syncNote}
        </p>
      )}

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-[12px]">
          <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_accounts_title)}</h2>
        </div>
        <AccountForm busy={busy} onCreate={(input) => run(() => createAccount(input))} />
        {state.accounts.length === 0 ? (
          <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">{x(IM.invest_accounts_empty)}</p>
        ) : (
          <ul className="m-0 mt-[12px] flex list-none flex-wrap gap-[10px] p-0">
            {state.accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-[10px] rounded-[10px] border border-border bg-inset px-[12px] py-[9px]"
              >
                <div>
                  <p className="m-0 text-[13px] font-semibold text-text">{a.name}</p>
                  <p className="m-0 text-[11px] text-text-muted">
                    {x(IM[kindLabel[a.kind]])} · {fmt.format(a.cashBalance)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_positions_title)}</h2>
        {state.accounts.length > 0 && (
          <PositionForm
            busy={busy}
            accounts={state.accounts}
            onCreate={(input) => run(() => createPosition(input))}
          />
        )}
        {state.positions.length === 0 ? (
          <p className="m-0 mt-[14px] text-[12.5px] text-text-muted">
            {x(IM.invest_positions_empty)}
          </p>
        ) : (
          <div className="mt-[14px] overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
                  <th className="py-[8px] pr-[12px]">{x(IM.invest_field_symbol)}</th>
                  <th className="py-[8px] pr-[12px]">{x(IM.invest_field_asset_class)}</th>
                  <th className="py-[8px] pr-[12px] text-right">{x(IM.invest_field_quantity)}</th>
                  <th className="py-[8px] pr-[12px] text-right">{x(IM.invest_field_avg_cost)}</th>
                  <th className="py-[8px] pr-[12px] text-right">{x(IM.invest_field_last_price)}</th>
                  <th className="py-[8px] pr-[12px] text-right">{x(IM.invest_field_value)}</th>
                  <th className="py-[8px]">{x(IM.invest_field_last_price)}</th>
                </tr>
              </thead>
              <tbody>
                {state.positions.map((p) => {
                  const px = snapshotPrice(p.assetClass, p.symbol) ?? p.lastPrice ?? p.avgCost
                  return (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="py-[9px] pr-[12px]">
                        <span className="font-semibold text-text">{p.symbol}</span>
                        <span className="ml-[6px] text-text-muted">{p.name}</span>
                      </td>
                      <td className="py-[9px] pr-[12px] text-text-2">{x(IM[assetLabel[p.assetClass]])}</td>
                      <td className="py-[9px] pr-[12px] text-right tabular-nums text-text-2">
                        {p.quantity}
                      </td>
                      <td className="py-[9px] pr-[12px] text-right tabular-nums text-text-2">
                        {fmt.format(p.avgCost)}
                      </td>
                      <td className="py-[9px] pr-[12px] text-right tabular-nums text-text-2">
                        {fmt.format(px)}
                      </td>
                      <td className="py-[9px] pr-[12px] text-right tabular-nums font-semibold text-text">
                        {fmt.format(p.quantity * px)}
                      </td>
                      <td className="py-[9px]">
                        <PriceEditor
                          busy={busy}
                          onSave={(price) =>
                            run(() =>
                              upsertSnapshot({
                                assetClass: p.assetClass,
                                symbol: p.symbol,
                                price,
                              }),
                            )
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function AccountForm({
  busy,
  onCreate,
}: {
  busy: boolean
  onCreate: (input: { name: string; kind: AccountKind; cashBalance?: number }) => Promise<void>
}) {
  const { x } = useI18n()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AccountKind>('paper')
  const [cash, setCash] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void onCreate({
      name: name.trim(),
      kind,
      cashBalance: cash ? Number(cash) : 0,
    }).then(() => {
      setName('')
      setCash('')
    })
  }

  return (
    <form onSubmit={submit} className="mt-[14px] flex flex-wrap items-end gap-[10px]">
      <div className="min-w-[160px] flex-1">
        <label className={labelClass} htmlFor="inv-acc-name">
          {x(IM.invest_account_name)}
        </label>
        <input
          id="inv-acc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="w-[140px]">
        <label className={labelClass} htmlFor="inv-acc-kind">
          {x(IM.invest_account_kind)}
        </label>
        <select
          id="inv-acc-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as AccountKind)}
          className={fieldClass}
        >
          {(['paper', 'live', 'external'] as const).map((k) => (
            <option key={k} value={k}>
              {x(IM[kindLabel[k]])}
            </option>
          ))}
        </select>
      </div>
      <div className="w-[120px]">
        <label className={labelClass} htmlFor="inv-acc-cash">
          {x(IM.invest_ov_cash)}
        </label>
        <input
          id="inv-acc-cash"
          type="number"
          min="0"
          step="0.01"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className={fieldClass}
        />
      </div>
      <button type="submit" disabled={busy || !name.trim()} className={btnClass}>
        <Plus size={14} aria-hidden="true" />
        {x(IM.invest_add_account)}
      </button>
    </form>
  )
}

function PositionForm({
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
    name: string
    quantity: number
    avgCost: number
  }) => Promise<void>
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!accountId || !symbol.trim() || !quantity || !avgCost) return
    void onCreate({
      accountId,
      assetClass,
      symbol: symbol.trim(),
      name: name.trim() || symbol.trim().toUpperCase(),
      quantity: Number(quantity),
      avgCost: Number(avgCost),
    }).then(() => {
      setSymbol('')
      setName('')
      setQuantity('')
      setAvgCost('')
    })
  }

  return (
    <form onSubmit={submit} className="mt-[14px] flex flex-wrap items-end gap-[10px]">
      <div className="min-w-[140px]">
        <label className={labelClass} htmlFor="inv-pos-acc">
          {x(IM.invest_accounts_title)}
        </label>
        <select
          id="inv-pos-acc"
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
      <div className="w-[130px]">
        <label className={labelClass} htmlFor="inv-pos-class">
          {x(IM.invest_field_asset_class)}
        </label>
        <select
          id="inv-pos-class"
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
        <label className={labelClass} htmlFor="inv-pos-symbol">
          {x(IM.invest_field_symbol)}
        </label>
        <input
          id="inv-pos-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="min-w-[120px] flex-1">
        <label className={labelClass} htmlFor="inv-pos-name">
          {x(IM.invest_field_name)}
        </label>
        <input
          id="inv-pos-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="w-[90px]">
        <label className={labelClass} htmlFor="inv-pos-qty">
          {x(IM.invest_field_quantity)}
        </label>
        <input
          id="inv-pos-qty"
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
        <label className={labelClass} htmlFor="inv-pos-cost">
          {x(IM.invest_field_avg_cost)}
        </label>
        <input
          id="inv-pos-cost"
          type="number"
          min="0"
          step="any"
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <button type="submit" disabled={busy || !accountId || !symbol.trim()} className={btnClass}>
        <Plus size={14} aria-hidden="true" />
        {x(IM.invest_add_position)}
      </button>
    </form>
  )
}

function PriceEditor({ busy, onSave }: { busy: boolean; onSave: (price: number) => Promise<void> }) {
  const { x } = useI18n()
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] cursor-pointer rounded-[7px] border border-border bg-transparent px-[12px] text-[12px] font-semibold text-text-2 hover:bg-inset"
      >
        {x(IM.invest_field_last_price)}
      </button>
    )
  }
  return (
    <span className="flex items-center gap-[6px]">
      <input
        type="number"
        min="0"
        step="any"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-[38px] w-[90px] rounded-[7px] border border-border bg-bg px-[8px] text-[12px] text-text outline-none focus:border-navy"
        aria-label={x(IM.invest_field_last_price)}
      />
      <button
        type="button"
        disabled={busy || !price}
        onClick={() =>
          void onSave(Number(price)).then(() => {
            setOpen(false)
            setPrice('')
          })
        }
        className="min-h-[44px] cursor-pointer rounded-[7px] border-none bg-navy px-[12px] text-[12px] font-semibold text-white disabled:opacity-50"
      >
        {x(IM.invest_save)}
      </button>
    </span>
  )
}
